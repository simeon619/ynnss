"use server";

import { eq } from "drizzle-orm";
import { getCart } from "@/app/(store)/cart/actions";
import { commerce } from "@/lib/commerce";
import { getTenantDb, globalDb } from "@/lib/db";
import { stores } from "@/lib/db/schema_global";
import { coupons, orderItems, orders, shippingRates } from "@/lib/db/schema_tenant";
import { initiateLocalPayment, type PaymentMethod } from "@/lib/payments/local-gateway";
import { getAvailableShippingRates } from "@/lib/shipping-engine";

/**
 * In the multi-tenant storefront, each storefront instance belongs to one store.
 * The STORE_ID env variable identifies which tenant DB to use.
 */
function getStorefrontStoreId(): string {
	const storeId = process.env.STORE_ID;
	if (!storeId) throw new Error("STORE_ID env variable is not set for this storefront.");
	return storeId;
}

function toSafeIntegerNumber(value: bigint, label: string) {
	if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new Error(`${label} exceeds Number.MAX_SAFE_INTEGER`);
	}
	return Number(value);
}

export async function checkoutAction(formData: FormData) {
	const storeId = getStorefrontStoreId();
	const db = await getTenantDb(storeId);

	const cart = await getCart();
	if (!cart || cart.lineItems.length === 0) {
		return { success: false, error: "Votre panier est vide." };
	}

	// Calculate Item Subtotal
	// biome-ignore lint/suspicious/noExplicitAny: commerce kit type
	const subtotal = cart.lineItems.reduce((acc: bigint, item: any) => {
		return acc + BigInt(item.productVariant.price) * BigInt(item.quantity);
	}, BigInt(0));

	// Handle Coupon
	const couponCode = formData.get("couponCode") as string;
	let discountAmount = BigInt(0);
	let appliedCouponId: string | null = null;
	let appliedCouponCode: string | null = null;

	if (couponCode) {
		const coupon = await db.query.coupons.findFirst({
			where: eq(coupons.code, couponCode.toUpperCase()),
		});

		if (coupon) {
			const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
			const isExhausted = coupon.maxUsage && (coupon.usedCount || 0) >= coupon.maxUsage;
			const isMinAmountMet = !coupon.minAmount || subtotal >= BigInt(coupon.minAmount);

			if (coupon.status === "active" && !isExpired && !isExhausted && isMinAmountMet) {
				appliedCouponId = coupon.id;
				appliedCouponCode = coupon.code;

				if (coupon.type === "percentage") {
					discountAmount = (subtotal * BigInt(coupon.value)) / BigInt(100);
				} else {
					discountAmount = BigInt(coupon.value);
				}

				// Ensure discount doesn't exceed subtotal
				if (discountAmount > subtotal) {
					discountAmount = subtotal;
				}
			} else {
				return { success: false, error: "Le code promo saisi est invalide ou expiré." };
			}
		} else {
			return { success: false, error: "Ce code promo n'existe pas." };
		}
	}

	const subtotalAfterDiscount = subtotal - discountAmount;

	// Handle Shipping
	const shippingRateId = formData.get("shippingRateId") as string;
	let shippingCost = BigInt(0);
	let selectedRate = null;

	if (shippingRateId) {
		const rate = await db.query.shippingRates.findFirst({
			where: eq(shippingRates.id, shippingRateId),
		});
		if (rate) {
			shippingCost = BigInt(rate.price);
			selectedRate = rate;
		}
	}

	const totalAmount = subtotalAfterDiscount + shippingCost;

	const email = formData.get("email") as string;
	const phone = formData.get("phone") as string;
	const method = formData.get("method") as PaymentMethod;

	const coordsRaw = formData.get("coordinates") as string;
	const coordinates = coordsRaw ? JSON.parse(coordsRaw) : null;
	const pickupPointId = formData.get("pickupPointId") as string;

	// Prepare Wave Splits
	let splits:
		| {
				wallet_id: string;
				amount: number;
				category: string;
				label: string;
				release_delay_hours: number;
				allow_early_release: boolean;
		  }[]
		| undefined;

	if (method === "WAVE") {
		const store = await globalDb.query.stores.findFirst({
			where: eq(stores.id, storeId),
		});

		if (!store?.waveWalletId) {
			return {
				success: false,
				error: "La boutique n'est pas encore prête à recevoir des paiements Wave.",
			};
		}

		const commissionBps = Math.round((store.commissionRate || 0.1) * 10_000);
		const commission = (subtotalAfterDiscount * BigInt(commissionBps)) / BigInt(10_000);
		const vendorAmount = subtotalAfterDiscount - commission;
		const platformTotal = commission + shippingCost;
		const mainWalletId = process.env.MAIN_WALLET_ID;

		splits = [
			{
				wallet_id: store.waveWalletId,
				amount: toSafeIntegerNumber(vendorAmount, "vendor split amount"),
				category: "ORDER_PAYMENT",
				label: `Vente ${store.name} (après commission)`,
				release_delay_hours: 24,
				allow_early_release: true,
			},
		];

		if (mainWalletId && platformTotal > BigInt(0)) {
			splits.push({
				wallet_id: mainWalletId,
				amount: toSafeIntegerNumber(platformTotal, "platform split amount"),
				category: "ORDER_PAYMENT",
				label: "Commissions & Livraison Plateforme",
				release_delay_hours: 0,
				allow_early_release: true,
			});
		}
	}

	const paymentResult = await initiateLocalPayment({
		amount: totalAmount,
		currency: "XOF",
		orderId: cart.id,
		customerEmail: email,
		method,
		splits,
	});

	if (paymentResult.success) {
		const orderId = cart.id;
		const lookup = `ORD-${cart.id.substring(cart.id.length - 6).toUpperCase()}`;
		const shippingAddress = {
			firstName: formData.get("firstName") as string,
			lastName: formData.get("lastName") as string,
			address: formData.get("address") as string,
			city: formData.get("city") as string,
			country: "CI",
		};

		await db.insert(orders).values({
			id: orderId,
			lookup,
			status: "pending",
			subtotal: subtotal.toString(),
			shippingCost: shippingCost.toString(),
			shippingRateId: selectedRate?.id || null,
			customerEmail: email,
			shippingAddress,
			paymentMethod: method,
			transactionId: paymentResult.transactionId,
			coordinates,
			pickupPointId: pickupPointId || selectedRate?.pickupPointId || null,
			// Add coupon custom field/logic if your schema supports it...
			// Since orders scheme does not have a couponCode field yet, we rely on the subtotal difference.
		});

		if (appliedCouponId) {
			const existingCoupon = await db.query.coupons.findFirst({
				where: eq(coupons.id, appliedCouponId),
			});
			if (existingCoupon) {
				await db
					.update(coupons)
					.set({ usedCount: (existingCoupon.usedCount || 0) + 1 })
					.where(eq(coupons.id, appliedCouponId));
			}
		}

		for (const item of cart.lineItems) {
			await db.insert(orderItems).values({
				orderId,
				variantId: item.productVariant.id,
				quantity: item.quantity,
				price: item.productVariant.price,
			});
		}

		await (commerce as { cartClear: (params: { cartId: string }) => Promise<void> }).cartClear({
			cartId: cart.id,
		});

		// Phase 5: Trigger internal sync webhook (background)
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		fetch(`${baseUrl}/api/internal/sync-order`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-webhook-secret": process.env.INTERNAL_WEBHOOK_SECRET || "",
			},
			body: JSON.stringify({
				storeId,
				amount: subtotalAfterDiscount.toString(),
				orderId,
			}),
		}).catch((err) => console.error("Internal sync trigger failed:", err));

		return { success: true, paymentUrl: paymentResult.paymentUrl };
	}

	return { success: false, error: paymentResult.error || "Échec du paiement." };
}

export async function getShippingRatesAction(
	city: string | undefined,
	coordinates?: { lat: number; lng: number },
) {
	const storeId = getStorefrontStoreId();
	const cart = await getCart();
	if (!cart) return [];

	// biome-ignore lint/suspicious/noExplicitAny: commerce kit type
	const items = cart.lineItems.map((item: any) => ({
		variantId: item.variantId,
		quantity: item.quantity,
		variant: {
			price: item.productVariant.price,
			weight: item.productVariant.weight,
			shippable: item.productVariant.shippable,
		},
	}));

	return getAvailableShippingRates(storeId, items, city, coordinates);
}

export async function validateCouponAction(code: string, cartSubtotal: string) {
	const storeId = getStorefrontStoreId();
	const db = await getTenantDb(storeId);
	const subtotal = BigInt(cartSubtotal);

	const coupon = await db.query.coupons.findFirst({
		where: eq(coupons.code, code.toUpperCase()),
	});

	if (!coupon) {
		return { valid: false, message: "Code promo invalide." };
	}

	const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
	const isExhausted = coupon.maxUsage && (coupon.usedCount || 0) >= coupon.maxUsage;
	const isMinAmountMet = !coupon.minAmount || subtotal >= BigInt(coupon.minAmount);

	if (coupon.status !== "active") return { valid: false, message: "Ce code promo est inactif." };
	if (isExpired) return { valid: false, message: "Ce code promo a expiré." };
	if (isExhausted) return { valid: false, message: "Ce code promo n'est plus disponible." };
	if (!isMinAmountMet) return { valid: false, message: `Minimum d'achat requis de ${coupon.minAmount} XOF.` };

	let discountPrice = BigInt(0);
	if (coupon.type === "percentage") {
		discountPrice = (subtotal * BigInt(coupon.value)) / BigInt(100);
	} else {
		discountPrice = BigInt(coupon.value);
	}

	if (discountPrice > subtotal) {
		discountPrice = subtotal;
	}

	return {
		valid: true,
		coupon: {
			code: coupon.code,
			type: coupon.type,
			value: coupon.value,
			discountAmount: discountPrice.toString(),
		},
	};
}
