/**
 * Tests for the local payment gateway (Wave + mock methods).
 *
 * Actors covered:
 * - Customer: initiates checkout, pays via Wave or mock method
 * - Merchant: receives vendor split (amount minus commission, 24h delayed)
 * - Platform: receives commission + shipping, released immediately
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { initiateLocalPayment } from "./local-gateway";

// ─── ENV setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
	vi.clearAllMocks();
	process.env.API_KEY_WAVE = "test-api-key";
	process.env.MANAGER_ID = "mgr_test";
	process.env.NEXT_PUBLIC_APP_URL = "https://store.test";
});

// ─── Wave Checkout ─────────────────────────────────────────────────────────────

describe("initiateLocalPayment – WAVE", () => {
	const vendorSplit = {
		wallet_id: "wlt_vendor",
		amount: 9000,
		category: "ORDER_PAYMENT",
		label: "Vente Boutique Ali (après commission)",
		release_delay_hours: 24,
		allow_early_release: true,
	};
	const platformSplit = {
		wallet_id: "wlt_platform",
		amount: 1500,
		category: "ORDER_PAYMENT",
		label: "Commissions & Livraison Plateforme",
		release_delay_hours: 0,
		allow_early_release: true,
	};

	it("returns a Wave checkout URL and payment_intent_id on success", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve({
						data: {
							wave_checkout_url: "https://pay.wave.com/abc123",
							payment_intent_id: "pi_test_001",
						},
					}),
			}),
		);

		const result = await initiateLocalPayment({
			amount: BigInt(10500),
			currency: "XOF",
			orderId: "order_abc",
			customerEmail: "client@test.com",
			method: "WAVE",
			splits: [vendorSplit, platformSplit],
		});

		expect(result.success).toBe(true);
		expect(result.paymentUrl).toBe("https://pay.wave.com/abc123");
		expect(result.transactionId).toBe("pi_test_001");
	});

	it("sends correct external_reference (ord_{orderId}) to Wave API", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve({
					data: { wave_checkout_url: "https://pay.wave.com/x", payment_intent_id: "pi_x" },
				}),
		});
		vi.stubGlobal("fetch", mockFetch);

		await initiateLocalPayment({
			amount: BigInt(5000),
			currency: "XOF",
			orderId: "order_xyz",
			customerEmail: "a@b.com",
			method: "WAVE",
			splits: [vendorSplit],
		});

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.external_reference).toBe("ord_order_xyz");
	});

	it("builds success_url and error_url using NEXT_PUBLIC_APP_URL", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ data: { wave_checkout_url: "url", payment_intent_id: "pi" } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		await initiateLocalPayment({
			amount: BigInt(5000),
			currency: "XOF",
			orderId: "order_123",
			customerEmail: "a@b.com",
			method: "WAVE",
			splits: [vendorSplit],
		});

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.success_url).toBe("https://store.test/order/success/order_123");
		expect(body.error_url).toBe("https://store.test/checkout?error=payment_failed");
	});

	it("sends vendor split with 24h release delay (merchant payment protection)", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ data: { wave_checkout_url: "url", payment_intent_id: "pi" } }),
		});
		vi.stubGlobal("fetch", mockFetch);

		await initiateLocalPayment({
			amount: BigInt(10000),
			currency: "XOF",
			orderId: "order_v",
			customerEmail: "a@b.com",
			method: "WAVE",
			splits: [vendorSplit, platformSplit],
		});

		const { splits } = JSON.parse(mockFetch.mock.calls[0][1].body);
		const vendor = splits.find((s: { wallet_id: string }) => s.wallet_id === "wlt_vendor");
		const platform = splits.find((s: { wallet_id: string }) => s.wallet_id === "wlt_platform");

		// Merchant money is locked 24h until delivery confirmed
		expect(vendor.release_delay_hours).toBe(24);
		expect(vendor.allow_early_release).toBe(true);

		// Platform commission released immediately
		expect(platform.release_delay_hours).toBe(0);
	});

	it("returns error when Wave API responds with non-ok status", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 400,
				text: () => Promise.resolve("Bad Request"),
			}),
		);

		const result = await initiateLocalPayment({
			amount: BigInt(5000),
			currency: "XOF",
			orderId: "order_fail",
			customerEmail: "a@b.com",
			method: "WAVE",
			splits: [vendorSplit],
		});

		expect(result.success).toBe(false);
		expect(result.error).toContain("Wave");
	});

	it("falls back to mock redirect when no splits provided (no Wave wallet configured)", async () => {
		// No fetch needed — gateway falls through to mock path
		const result = await initiateLocalPayment({
			amount: BigInt(5000),
			currency: "XOF",
			orderId: "order_nosplit",
			customerEmail: "a@b.com",
			method: "WAVE",
			splits: [], // no splits → not a real Wave payment
		});

		// Mock path: redirects directly to success page
		expect(result.success).toBe(true);
		expect(result.paymentUrl).toContain("/order/success/order_nosplit");
	});
});

// ─── Commission Calculation ───────────────────────────────────────────────────

describe("Wave split amount calculation", () => {
	/**
	 * Business rule:
	 *   commissionBps = commissionRate * 10_000
	 *   commission = (subtotal * commissionBps) / 10_000
	 *   vendorAmount = subtotal - commission
	 *   platformTotal = commission + shippingCost
	 */

	it("calculates 10% commission correctly (default rate)", () => {
		const subtotal = BigInt(10000);
		const commissionRate = 0.1;
		const shippingCost = BigInt(500);

		const commissionBps = Math.round(commissionRate * 10_000);
		const commission = (subtotal * BigInt(commissionBps)) / BigInt(10_000);
		const vendorAmount = subtotal - commission;
		const platformTotal = commission + shippingCost;

		expect(Number(commission)).toBe(1000); // 10% of 10 000 XOF
		expect(Number(vendorAmount)).toBe(9000); // merchant gets 9 000 XOF
		expect(Number(platformTotal)).toBe(1500); // 1000 commission + 500 shipping
	});

	it("calculates 5% commission correctly", () => {
		const subtotal = BigInt(20000);
		const commissionRate = 0.05;
		const shippingCost = BigInt(1000);

		const commissionBps = Math.round(commissionRate * 10_000);
		const commission = (subtotal * BigInt(commissionBps)) / BigInt(10_000);
		const vendorAmount = subtotal - commission;
		const platformTotal = commission + shippingCost;

		expect(Number(commission)).toBe(1000); // 5% of 20 000 XOF
		expect(Number(vendorAmount)).toBe(19000);
		expect(Number(platformTotal)).toBe(2000);
	});

	it("handles zero shipping cost (digital products)", () => {
		const subtotal = BigInt(5000);
		const commissionRate = 0.1;
		const shippingCost = BigInt(0);

		const commissionBps = Math.round(commissionRate * 10_000);
		const commission = (subtotal * BigInt(commissionBps)) / BigInt(10_000);
		const vendorAmount = subtotal - commission;
		const platformTotal = commission + shippingCost;

		expect(Number(vendorAmount)).toBe(4500);
		expect(Number(platformTotal)).toBe(500); // commission seulement
	});
});

// ─── Mock Payment Methods (Orange, MTN, Moov) ─────────────────────────────────

describe("initiateLocalPayment – mock methods", () => {
	it("Orange Money redirects directly to success page", async () => {
		const result = await initiateLocalPayment({
			amount: BigInt(3000),
			currency: "XOF",
			orderId: "order_om",
			customerEmail: "a@b.com",
			method: "ORANGE_MONEY",
		});

		expect(result.success).toBe(true);
		expect(result.paymentUrl).toContain("/order/success/order_om");
		expect(result.transactionId).toBeDefined();
	});

	it("MTN Money redirects directly to success page", async () => {
		const result = await initiateLocalPayment({
			amount: BigInt(3000),
			currency: "XOF",
			orderId: "order_mtn",
			customerEmail: "a@b.com",
			method: "MTN_MONEY",
		});

		expect(result.success).toBe(true);
		expect(result.paymentUrl).toContain("/order/success/order_mtn");
	});

	it("respects storefrontBasePath for multi-tenant stores", async () => {
		const result = await initiateLocalPayment({
			amount: BigInt(3000),
			currency: "XOF",
			orderId: "order_tenant",
			customerEmail: "a@b.com",
			method: "ORANGE_MONEY",
			storefrontBasePath: "/s/ma-boutique",
		});

		expect(result.paymentUrl).toBe("/s/ma-boutique/order/success/order_tenant");
	});
});
