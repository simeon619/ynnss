"use server";

import { eq, inArray, like, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteSession, getActiveStoreContext, verifySession } from "@/lib/auth";
import { type Category, generateSlug, isCircular } from "@/lib/category-utils";
import { getTenantDb } from "@/lib/db";
import {
	carts,
	categories,
	collections,
	orders,
	pickupPoints,
	products,
	shippingRates,
	shippingZones,
	variants,
} from "@/lib/db/schema_tenant";

/** Helper: returns the Drizzle instance for the current merchant's tenant DB */
async function getDb() {
	const session = await verifySession();
	if (!session) redirect("/login");

	const storeId = await getActiveStoreContext();
	if (!storeId) {
		console.warn("[getDb] No active store in context.");
		// If Admin, they shouldn't even be here unless impersonating
		if (session.role === "ADMIN") redirect("/admin");
		throw new Error("Aucune boutique active. Veuillez vous reconnecter.");
	}

	const db = await getTenantDb(storeId);

	try {
		// Fast check: Ensure the tables exist
		await db.run(sql`SELECT 1 FROM store_settings LIMIT 1`);
	} catch (error) {
		const err = error as Error;
		if (err.message?.includes("no such table")) {
			console.log(`[getDb] Tables missing for store ${storeId}. Running auto-migration...`);
			const { runTenantMigrations } = await import("@/lib/db");
			await runTenantMigrations(storeId);
		} else {
			console.error(`[getDb] Error checking store ${storeId} initialization:`, error);
			throw error;
		}
	}

	return db;
}

export async function logoutAction() {
	await deleteSession();
	redirect("/login");
}

/**
 * Product & Inventory Actions
 */

export async function updateProductStock(variantId: string, quantityDelta: number) {
	await (await getDb())
		.update(variants)
		.set({
			stock: sql`${variants.stock} + ${quantityDelta}`,
		})
		.where(eq(variants.id, variantId));

	revalidatePath("/manage/products");
	revalidatePath("/"); // Update storefront
}

export async function toggleProductStatus(productId: string, status: "published" | "draft" | "hidden") {
	await (await getDb())
		.update(products)
		.set({ status, updatedAt: new Date() })
		.where(eq(products.id, productId));

	revalidatePath("/manage/products");
	revalidatePath("/");
}

export async function deleteProduct(productId: string) {
	// SQLite with ON DELETE CASCADE handles variants automatically
	await (await getDb()).delete(products).where(eq(products.id, productId));

	revalidatePath("/manage/products");
	revalidatePath("/");
}

export async function bulkUpdateProductStatus(
	productIds: string[],
	status: "published" | "draft" | "hidden",
) {
	await (await getDb())
		.update(products)
		.set({ status, updatedAt: new Date() })
		.where(inArray(products.id, productIds));

	revalidatePath("/manage/products");
	revalidatePath("/");
}

export async function bulkDeleteProducts(productIds: string[]) {
	// SQLite with ON DELETE CASCADE handles variants automatically
	await (await getDb()).delete(products).where(inArray(products.id, productIds));

	revalidatePath("/manage/products");
	revalidatePath("/");
}

export async function createProduct(formData: FormData) {
	const name = formData.get("name") as string;
	const description = formData.get("description") as string;
	const price = formData.get("price") as string;
	const categoryId = formData.get("categoryId") as string;
	const status = formData.get("status") as string;

	// JSON Fields
	const images = JSON.parse((formData.get("images") as string) || "[]");
	const collectionSlugs = JSON.parse((formData.get("collections") as string) || "[]");
	const variantsData = JSON.parse((formData.get("variants") as string) || "[]");
	const options = JSON.parse((formData.get("options") as string) || "[]");

	// SEO & Badge
	const seoTitle = formData.get("seoTitle") as string;
	const seoDescription = formData.get("seoDescription") as string;
	const badgeText = formData.get("badgeText") as string;
	const badgeColor = formData.get("badgeColor") as string;

	// Organization
	const vendor = formData.get("vendor") as string;
	const summary = formData.get("summary") as string;
	const tags = JSON.parse((formData.get("tags") as string) || "[]");
	const chargeTax = formData.get("chargeTax") === "true";

	// Generate slug
	let slug = formData.get("slug") as string;
	if (!slug || slug.trim() === "") {
		slug = name
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, "")
			.replace(/[\s_-]+/g, "-")
			.replace(/^-+|-+$/g, "");
	}

	const productId = `prod_${Math.random().toString(36).substring(7)}`;

	try {
		const newProduct = await (await getDb())
			.insert(products)
			.values({
				id: productId,
				name,
				slug,
				description,
				categoryId: categoryId === "none" ? null : categoryId,
				collections: collectionSlugs,
				status: status || "draft",
				images,
				seoTitle,
				seoDescription,
				badgeText,
				badgeColor,
				vendor,
				summary,
				tags,
				options,
				chargeTax,
			})
			.returning();

		if (variantsData.length > 0) {
			for (const v of variantsData) {
				await (await getDb()).insert(variants).values({
					id: `var_${Math.random().toString(36).substring(7)}`,
					productId: newProduct[0].id,
					price: v.price,
					stock: Number.parseInt(v.stock, 10) || 0,
					sku: v.sku,
					width: Number.parseFloat(v.width) || null,
					height: Number.parseFloat(v.height) || null,
					depth: Number.parseFloat(v.depth) || null,
					weight: Number.parseFloat(v.weight) || null,
					combinations: v.combination ? [v.combination] : [],

					// New Fields
					compareAtPrice: v.compareAtPrice || null,
					costPrice: v.costPrice || null,
					barcode: v.barcode || null,
					shippable: v.shippable !== false, // Default true
					isEnabled: v.isEnabled !== false, // Default true
					manageInventory: v.manageInventory === true,
					digitalFileUrl: v.digitalFileUrl || null,
				});
			}
		} else {
			// Create default variant if no complex options
			await (await getDb()).insert(variants).values({
				id: `var_${Math.random().toString(36).substring(7)}`,
				productId: productId,
				price: price || "0",
				stock: 0,
			});
		}

		revalidatePath("/manage/products");
		revalidatePath("/");

		if (formData.get("addNext") === "true") {
			redirect("/manage/products/new");
		} else {
			redirect("/manage/products");
		}
	} catch (error) {
		console.error("Failed to create product:", error);
		throw error;
	}
}

export async function updateProduct(id: string, formData: FormData) {
	const name = formData.get("name") as string;
	const description = formData.get("description") as string;
	const slug = formData.get("slug") as string;
	const categoryId = formData.get("categoryId") as string;
	const status = formData.get("status") as "published" | "draft" | "hidden";

	// JSON Fields
	const images = JSON.parse((formData.get("images") as string) || "[]");
	const collectionSlugs = JSON.parse((formData.get("collections") as string) || "[]");
	const variantsData = JSON.parse((formData.get("variants") as string) || "[]");
	const options = JSON.parse((formData.get("options") as string) || "[]");

	// SEO & Badge
	const seoTitle = formData.get("seoTitle") as string;
	const seoDescription = formData.get("seoDescription") as string;
	const badgeText = formData.get("badgeText") as string;
	const badgeColor = formData.get("badgeColor") as string;

	// Organization
	const vendor = formData.get("vendor") as string;
	const summary = formData.get("summary") as string;
	const tags = JSON.parse((formData.get("tags") as string) || "[]");
	const chargeTax = formData.get("chargeTax") === "true";

	try {
		await (await getDb())
			.update(products)
			.set({
				name,
				slug:
					slug ||
					name
						.toLowerCase()
						.trim()
						.replace(/[^\w\s-]/g, "")
						.replace(/[\s_-]+/g, "-")
						.replace(/^-+|-+$/g, ""),
				description,
				status,
				categoryId: categoryId === "none" ? null : categoryId,
				collections: collectionSlugs,
				images,
				seoTitle,
				seoDescription,
				badgeText,
				badgeColor,
				vendor,
				summary,
				tags,
				options,
				chargeTax,
				updatedAt: new Date(),
			})
			.where(eq(products.id, id));

		// Handle Variants Update - Smart Sync Strategy
		if (variantsData.length > 0) {
			// 1. Fetch current existing variant IDs for this product
			const existingVariants = await (await getDb())
				.select({ id: variants.id })
				.from(variants)
				.where(eq(variants.productId, id));
			const existingIds = new Set(existingVariants.map((v: { id: string }) => v.id));

			const incomingIds = new Set<string>();
			// biome-ignore lint/suspicious/noExplicitAny: Drizzle requires specific types that are too complex to map here
			const toInsert: any[] = [];
			// biome-ignore lint/suspicious/noExplicitAny: Drizzle requires specific types that are too complex to map here
			const toUpdate: any[] = [];

			// 2. Classify incoming variants
			for (const v of variantsData) {
				if (v.id && existingIds.has(v.id)) {
					incomingIds.add(v.id);
					toUpdate.push(v);
				} else {
					toInsert.push(v);
				}
			}

			// 3. Identify variants to delete
			const toDelete = existingVariants.filter((v: { id: string }) => !incomingIds.has(v.id));

			// 4. Perform Updates
			for (const v of toUpdate) {
				await (await getDb())
					.update(variants)
					.set({
						price: v.price,
						stock: Number.parseInt(v.stock, 10) || 0,
						sku: v.sku,
						width: Number.parseFloat(v.width) || null,
						height: Number.parseFloat(v.height) || null,
						depth: Number.parseFloat(v.depth) || null,
						weight: Number.parseFloat(v.weight) || null,
						combinations: v.combination ? [v.combination] : [],
						compareAtPrice: v.compareAtPrice || null,
						costPrice: v.costPrice || null,
						barcode: v.barcode || null,
						shippable: v.shippable !== false,
						isEnabled: v.isEnabled !== false,
						manageInventory: v.manageInventory === true,
						attributes: v.attributes || [],
						images: v.images || [],
						digitalFileUrl: v.digitalFileUrl || null,
					})
					.where(eq(variants.id, v.id));
			}

			// 5. Perform Inserts
			for (const v of toInsert) {
				await (await getDb()).insert(variants).values({
					id: `var_${Math.random().toString(36).substring(7)}`,
					productId: id,
					price: v.price,
					stock: Number.parseInt(v.stock, 10) || 0,
					sku: v.sku,
					width: Number.parseFloat(v.width) || null,
					height: Number.parseFloat(v.height) || null,
					depth: Number.parseFloat(v.depth) || null,
					weight: Number.parseFloat(v.weight) || null,
					combinations: v.combination ? [v.combination] : [],
					compareAtPrice: v.compareAtPrice || null,
					costPrice: v.costPrice || null,
					barcode: v.barcode || null,
					shippable: v.shippable !== false,
					isEnabled: v.isEnabled !== false,
					manageInventory: v.manageInventory === true,
					attributes: v.attributes || [],
					images: v.images || [],
					digitalFileUrl: v.digitalFileUrl || null,
				});
			}

			// 6. Perform Deletes (with Soft Delete Fallback)
			for (const v of toDelete) {
				try {
					await (await getDb()).delete(variants).where(eq(variants.id, v.id));
				} catch (error) {
					console.warn(`Failed to hard delete variant ${v.id}, falling back to soft delete.`);
					// Soft delete: disable and zero stock
					await (await getDb())
						.update(variants)
						.set({ isEnabled: false, stock: 0 })
						.where(eq(variants.id, v.id));
				}
			}
		} else {
			const existingVariants = await (await getDb())
				.select({ id: variants.id })
				.from(variants)
				.where(eq(variants.productId, id));

			for (const v of existingVariants) {
				try {
					await (await getDb()).delete(variants).where(eq(variants.id, v.id));
				} catch (error) {
					await (await getDb())
						.update(variants)
						.set({ isEnabled: false, stock: 0 })
						.where(eq(variants.id, v.id));
				}
			}
		}

		revalidatePath("/manage/products");
		revalidatePath("/");
		revalidatePath(
			`/product/${
				slug ||
				name
					.toLowerCase()
					.trim()
					.replace(/[^\w\s-]/g, "")
					.replace(/[\s_-]+/g, "-")
					.replace(/^-+|-+$/g, "")
			}`,
		);
		redirect("/manage/products");
	} catch (error) {
		console.error("Failed to update product:", error);
		throw error;
	}
}

/**
 * Order Management Actions
 */

export async function updateOrderStatus(
	orderId: string,
	status: "pending" | "paid" | "shipped" | "cancelled",
) {
	await (await getDb()).update(orders).set({ status }).where(eq(orders.id, orderId));

	revalidatePath("/manage/orders");
}

/**
 * Analytics Data (Internal helper for Dashboard)
 */
export async function getDashboardStats() {
	const db = await getDb();

	// Fetch all paid orders for revenue and trends
	const allPaidOrders = await db.query.orders.findMany({
		where: eq(orders.status, "paid"),
		orderBy: (orders, { desc }) => [desc(orders.createdAt)],
	});

	// Get recent 5 orders (any status) for the recent orders widget
	const recentOrders = await db.query.orders.findMany({
		orderBy: (orders, { desc }) => [desc(orders.createdAt)],
		limit: 5,
	});

	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

	let currentMonthRevenue = 0;
	let previousMonthRevenue = 0;
	let currentMonthOrders = 0;
	let previousMonthOrders = 0;
	let currentMonthCost = 0;
	let previousMonthCost = 0;

	// Daily revenue dictionary for the chart (last 30 days)
	const dailyRevenue: Record<string, number> = {};
	const dailyProfit: Record<string, number> = {};
	for (let i = 29; i >= 0; i--) {
		const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
		const dateStr = d.toISOString().split("T")[0];
		dailyRevenue[dateStr] = 0;
		dailyProfit[dateStr] = 0;
	}

	// Get all order items for profit calculation
	// Note: costPrice is read from variant, not orderItems (avoids DB migration issues)
	const allOrderItems = await db.query.orderItems.findMany({
		with: { variant: true },
	});

	// Create a map of orderId -> items
	const orderItemsMap = new Map<string, typeof allOrderItems>();
	for (const item of allOrderItems) {
		const existing = orderItemsMap.get(item.orderId) || [];
		existing.push(item);
		orderItemsMap.set(item.orderId, existing);
	}

	for (const order of allPaidOrders) {
		const orderDate = new Date(order.createdAt || new Date());
		const subtotal = Number(order.subtotal || 0);

		// Calculate cost and profit for this order
		const orderItemsList = orderItemsMap.get(order.id) || [];
		let orderCost = 0;
		let orderProfit = 0;

		for (const item of orderItemsList) {
			// Get costPrice from variant (orderItems.costPrice requires migration)
			const costPrice = item.variant?.costPrice ? Number(item.variant.costPrice) : 0;
			const itemCost = costPrice * item.quantity;
			const itemRevenue = Number(item.price) * item.quantity;
			orderCost += itemCost;
			orderProfit += itemRevenue - itemCost;
		}

		// Current 30 days
		if (orderDate >= thirtyDaysAgo) {
			currentMonthRevenue += subtotal;
			currentMonthOrders++;
			currentMonthCost += orderCost;

			const dateStr = orderDate.toISOString().split("T")[0];
			if (dailyRevenue[dateStr] !== undefined) {
				dailyRevenue[dateStr] += subtotal;
				dailyProfit[dateStr] += orderProfit;
			}
		}
		// Previous 30 days
		else if (orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo) {
			previousMonthRevenue += subtotal;
			previousMonthOrders++;
			previousMonthCost += orderCost;
		}
	}

	// Calculate trends (percentages)
	const revenueTrend =
		previousMonthRevenue === 0
			? 100
			: ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

	const ordersTrend =
		previousMonthOrders === 0
			? 100
			: ((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100;

	const currentMonthProfit = currentMonthRevenue - currentMonthCost;
	const previousMonthProfit = previousMonthRevenue - previousMonthCost;
	const profitTrend =
		previousMonthProfit <= 0
			? 100
			: ((currentMonthProfit - previousMonthProfit) / Math.abs(previousMonthProfit)) * 100;

	const currentMargin = currentMonthRevenue > 0 ? (currentMonthProfit / currentMonthRevenue) * 100 : 0;
	const previousMargin = previousMonthRevenue > 0 ? (previousMonthProfit / previousMonthRevenue) * 100 : 0;
	const marginTrend = previousMargin === 0 ? 100 : ((currentMargin - previousMargin) / previousMargin) * 100;

	// Format data for Recharts
	const revenueData = Object.entries(dailyRevenue).map(([date, amount]) => {
		const [y, m, d] = date.split("-");
		return {
			name: `${d}/${m}`,
			total: amount,
			profit: dailyProfit[date] || 0,
		};
	});

	// Inventory logic
	const lowStockVariants = await db.query.variants.findMany({
		where: sql`${variants.stock} <= 5`,
		with: { product: true },
	});

	return {
		totalRevenue: currentMonthRevenue,
		revenueTrend: revenueTrend.toFixed(1),
		totalOrders: currentMonthOrders,
		ordersTrend: ordersTrend.toFixed(1),
		totalCost: currentMonthCost,
		totalProfit: currentMonthProfit,
		profitTrend: profitTrend.toFixed(1),
		profitMargin: currentMargin.toFixed(1),
		marginTrend: marginTrend.toFixed(1),
		lowStockCount: lowStockVariants.length,
		lowStockItems: lowStockVariants,
		recentOrders,
		revenueData,
	};
}

/**
 * Collection Management Actions
 */

export async function createCollection(formData: FormData) {
	const name = formData.get("name") as string;
	const description = formData.get("description") as string;
	// Auto-generate slug if not provided
	let slug = formData.get("slug") as string;
	if (!slug || slug.trim() === "") {
		slug = name
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, "")
			.replace(/[\s_-]+/g, "-")
			.replace(/^-+|-+$/g, "");
	} else {
		// Clean the manual slug but keep slashes
		slug = slug
			.toLowerCase()
			.trim()
			.replace(/[^\w\s/-]/g, "") // Keep /
			.replace(/[\s_]+/g, "-")
			.replace(/-+/g, "-")
			.replace(/\/+/g, "/") // Collapse multiple slashes
			.replace(/^\/+|\/+$/g, ""); // Remove leading/trailing slashes
	}

	const seoTitle = formData.get("seoTitle") as string;
	const seoDescription = formData.get("seoDescription") as string;
	const type = formData.get("type") as string;
	const minPrice = formData.get("minPrice") ? Number(formData.get("minPrice")) : undefined;
	const maxPrice = formData.get("maxPrice") ? Number(formData.get("maxPrice")) : undefined;
	const rulesRaw = formData.get("rules") as string;
	const complexRules = rulesRaw ? JSON.parse(rulesRaw) : null;

	const productIdsRaw = formData.get("productIds") as string;
	const productIds = productIdsRaw ? JSON.parse(productIdsRaw) : null;

	const bannerImage = formData.get("bannerImage") as string;
	const descriptionBottom = formData.get("descriptionBottom") as string;
	const badgeText = formData.get("badgeText") as string;
	const badgeColor = formData.get("badgeColor") as string;
	const defaultSort = (formData.get("defaultSort") as string) || "newest";
	const manualOrderRaw = formData.get("manualOrder") as string;
	const manualOrder = manualOrderRaw ? JSON.parse(manualOrderRaw) : null;
	const activeFrom = formData.get("activeFrom") as string;
	const activeTo = formData.get("activeTo") as string;

	await (await getDb()).insert(collections).values({
		id: `col_${Math.random().toString(36).substring(7)}`,
		name,
		slug,
		description,
		bannerImage,
		seoTitle,
		seoDescription,
		descriptionBottom,
		badgeText,
		badgeColor,
		type: type || "manual",
		rules: type === "automated" ? complexRules || { minPrice, maxPrice } : null,
		defaultSort,
		manualOrder,
		activeFrom: activeFrom || null,
		activeTo: activeTo || null,
	});

	if ((type === "manual" || !type) && productIds !== null && productIds.length > 0) {
		const allProducts = await (await getDb()).query.products.findMany();
		for (const p of allProducts) {
			if (productIds.includes(p.id)) {
				let currentCols = typeof p.collections === "string" ? JSON.parse(p.collections) : p.collections;
				if (!Array.isArray(currentCols)) currentCols = [];

				if (!currentCols.includes(slug)) {
					const nextCols = [...currentCols, slug];
					await (await getDb()).update(products).set({ collections: nextCols }).where(eq(products.id, p.id));
				}
			}
		}
	}

	revalidatePath("/manage/collections");
	revalidatePath("/"); // Update storefront navbar
	redirect("/manage/collections");
}

export async function updateCollection(id: string, formData: FormData) {
	const name = formData.get("name") as string;
	const description = formData.get("description") as string;
	const slug = formData.get("slug") as string;
	const seoTitle = formData.get("seoTitle") as string;
	const seoDescription = formData.get("seoDescription") as string;
	const type = formData.get("type") as string;
	const minPrice = formData.get("minPrice") ? Number(formData.get("minPrice")) : undefined;
	const maxPrice = formData.get("maxPrice") ? Number(formData.get("maxPrice")) : undefined;
	const rulesRaw = formData.get("rules") as string;
	const complexRules = rulesRaw ? JSON.parse(rulesRaw) : null;

	const productIdsRaw = formData.get("productIds") as string;
	const productIds = productIdsRaw ? JSON.parse(productIdsRaw) : null;

	const existingCollection = await (await getDb()).query.collections.findFirst({
		where: eq(collections.id, id),
	});

	const finalSlug = (
		slug ||
		name
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, "")
			.replace(/[\s_-]+/g, "-")
			.replace(/^-+|-+$/g, "")
	)
		.toLowerCase()
		.trim()
		.replace(/[^\w\s/-]/g, "") // Keep /
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/\/+/g, "/") // Collapse multiple slashes
		.replace(/^\/+|\/+$/g, "");

	const bannerImage = formData.get("bannerImage") as string;
	const descriptionBottom = formData.get("descriptionBottom") as string;
	const badgeText = formData.get("badgeText") as string;
	const badgeColor = formData.get("badgeColor") as string;
	const defaultSort = (formData.get("defaultSort") as string) || "newest";
	const manualOrderRaw = formData.get("manualOrder") as string;
	const manualOrder = manualOrderRaw ? JSON.parse(manualOrderRaw) : null;

	await (await getDb())
		.update(collections)
		.set({
			name,
			description,
			slug: finalSlug,
			bannerImage,
			seoTitle,
			seoDescription,
			descriptionBottom,
			badgeText,
			badgeColor,
			type: type || "manual",
			rules: type === "automated" ? complexRules || { minPrice, maxPrice } : null,
			defaultSort,
			manualOrder,
			activeFrom: (formData.get("activeFrom") as string) || null,
			activeTo: (formData.get("activeTo") as string) || null,
		})
		.where(eq(collections.id, id));

	if ((type === "manual" || !type) && productIds !== null) {
		const allProducts = await (await getDb()).query.products.findMany();
		const oldSlug = existingCollection?.slug;

		for (const p of allProducts) {
			let currentCols = typeof p.collections === "string" ? JSON.parse(p.collections) : p.collections;
			if (!Array.isArray(currentCols)) currentCols = [];

			const shouldHave = productIds.includes(p.id);
			const hasOldSlug = oldSlug && currentCols.includes(oldSlug);

			let nextCols = [...currentCols];
			let changed = false;

			if (oldSlug && oldSlug !== finalSlug && hasOldSlug) {
				nextCols = nextCols.filter((s) => s !== oldSlug);
				changed = true;
			}

			const currentlyHas = nextCols.includes(finalSlug);
			if (shouldHave && !currentlyHas) {
				nextCols.push(finalSlug);
				changed = true;
			} else if (!shouldHave && currentlyHas) {
				nextCols = nextCols.filter((s) => s !== finalSlug);
				changed = true;
			}

			if (changed) {
				await (await getDb()).update(products).set({ collections: nextCols }).where(eq(products.id, p.id));
			}
		}
	}

	revalidatePath("/manage/collections");
	revalidatePath("/"); // Update storefront navbar
	redirect("/manage/collections");
}

export async function deleteCollection(id: string) {
	await (await getDb()).delete(collections).where(eq(collections.id, id));
	revalidatePath("/manage/collections");
	revalidatePath("/");
}

export async function searchProducts(query: string) {
	if (!query) return [];
	const matchedProducts = await (await getDb()).query.products.findMany({
		where: or(like(products.name, `%${query}%`), like(products.slug, `%${query}%`)),
		limit: 20,
		with: {
			variants: {
				columns: {
					price: true,
				},
			},
		},
	});
	return matchedProducts.map((product) => ({
		id: product.id,
		name: product.name,
		images: product.images || [],
		price: product.variants[0]?.price || "0",
	}));
}

export async function getVendors() {
	const allProducts = await (await getDb()).query.products.findMany({
		columns: { vendor: true },
	});
	const vendors = new Set(allProducts.map((p) => p.vendor).filter(Boolean));
	return Array.from(vendors) as string[];
}

export async function getCollectionProducts(collectionSlug: string) {
	const allProducts = await (await getDb()).query.products.findMany({
		with: {
			variants: {
				columns: {
					price: true,
				},
			},
		},
	});
	return allProducts
		.filter((p) => {
			const colSlugs = typeof p.collections === "string" ? JSON.parse(p.collections) : p.collections;
			return Array.isArray(colSlugs) && colSlugs.includes(collectionSlug);
		})
		.map((product) => ({
			id: product.id,
			name: product.name,
			images: product.images || [],
			price: product.variants[0]?.price || "0",
		}));
}

/**
 * Category Management Actions (Hierarchical)
 */

export async function createCategory(formData: FormData) {
	const name = formData.get("name") as string;
	const description = formData.get("description") as string;
	const descriptionBottom = formData.get("descriptionBottom") as string;
	const image = formData.get("image") as string;
	const seoTitle = formData.get("seoTitle") as string;
	const seoDescription = formData.get("seoDescription") as string;
	let parentId = (formData.get("parentId") as string) || null;
	if (parentId === "none") parentId = null;

	let slug = formData.get("slug") as string;
	if (!slug || slug.trim() === "") {
		slug = generateSlug(name);
	} else {
		slug = generateSlug(slug);
	}

	await (await getDb()).insert(categories).values({
		id: `cat_${Math.random().toString(36).substring(7)}`,
		name,
		slug,
		description,
		descriptionBottom,
		parentId,
		image,
		seoTitle,
		seoDescription,
	});

	revalidatePath("/manage/categories");
	revalidatePath("/");
	redirect("/manage/categories");
}

export async function updateCategory(id: string, formData: FormData) {
	const name = formData.get("name") as string;
	const description = formData.get("description") as string;
	const descriptionBottom = formData.get("descriptionBottom") as string;
	const image = formData.get("image") as string;
	const seoTitle = formData.get("seoTitle") as string;
	const seoDescription = formData.get("seoDescription") as string;
	const slug = generateSlug((formData.get("slug") as string) || (formData.get("name") as string));
	let parentId = (formData.get("parentId") as string) || null;
	if (parentId === "none") parentId = null;

	await (await getDb())
		.update(categories)
		.set({
			name,
			description,
			descriptionBottom,
			slug,
			parentId,
			image,
			seoTitle,
			seoDescription,
		})
		.where(eq(categories.id, id));

	revalidatePath("/manage/categories");
	revalidatePath("/");
	redirect("/manage/categories");
}

export async function deleteCategory(id: string) {
	await (await getDb()).update(categories).set({ parentId: null }).where(eq(categories.parentId, id));
	await (await getDb()).delete(categories).where(eq(categories.id, id));
	revalidatePath("/manage/categories");
	revalidatePath("/");
}

export async function deleteCategories(ids: string[]) {
	await (await getDb()).update(categories).set({ parentId: null }).where(inArray(categories.parentId, ids));
	await (await getDb()).delete(categories).where(inArray(categories.id, ids));
	revalidatePath("/manage/categories");
	revalidatePath("/");
}

export async function updateCategoryHierarchy(
	updates: { id: string; parentId: string | null; sortOrder: number }[],
) {
	try {
		const allCategories = await (await getDb()).select().from(categories);

		for (const update of updates) {
			if (update.parentId && isCircular(allCategories as Category[], update.id, update.parentId)) {
				console.warn(`Prevented circular dependency for ${update.id}`);
				continue;
			}
			await (await getDb())
				.update(categories)
				.set({ parentId: update.parentId, sortOrder: update.sortOrder })
				.where(eq(categories.id, update.id));
		}
	} catch (error) {
		console.error(`[Hierarchy] Failed:`, error);
		throw error;
	}
	revalidatePath("/manage/categories");
}

export async function toggleCategoryStatus(id: string, status: "active" | "inactive") {
	await (await getDb()).update(categories).set({ status }).where(eq(categories.id, id));
	revalidatePath("/manage/categories");
}

export async function getCategories() {
	return await (await getDb()).query.categories.findMany({
		orderBy: (categories, { asc }) => [asc(categories.sortOrder), asc(categories.name)],
	});
}

/**
 * Shipping Management Actions
 */

export async function createShippingZone(formData: FormData) {
	const name = formData.get("name") as string;
	const description = formData.get("description") as string;
	const citiesRaw = formData.get("cities") as string;
	const boundaryRaw = formData.get("boundary") as string;
	const baseZoneId = formData.get("baseZoneId") as string;

	const cities = citiesRaw
		? citiesRaw
				.split(",")
				.map((c) => c.trim())
				.filter(Boolean)
		: [];
	const boundary = boundaryRaw ? JSON.parse(boundaryRaw) : null;
	const id = `zone_${Math.random().toString(36).substring(7)}`;

	await (await getDb()).insert(shippingZones).values({
		id,
		name,
		description,
		cities,
		boundary,
	});

	if (baseZoneId && baseZoneId !== "none") {
		const baseRates = await (await getDb()).query.shippingRates.findMany({
			where: eq(shippingRates.zoneId, baseZoneId),
		});

		if (baseRates.length > 0) {
			const clonedRates = baseRates.map((rate) => ({
				id: `rate_${Math.random().toString(36).substring(7)}`,
				zoneId: id,
				name: rate.name,
				price: rate.price,
				minAmount: rate.minAmount,
				minWeight: rate.minWeight,
				maxWeight: rate.maxWeight,
				deliveryTime: rate.deliveryTime,
				pickupPointId: rate.pickupPointId,
			}));

			await (await getDb()).insert(shippingRates).values(clonedRates);
		}
	}

	revalidatePath("/manage/settings/shipping");
}

export async function deleteShippingZone(id: string) {
	await (await getDb()).delete(shippingZones).where(eq(shippingZones.id, id));
	revalidatePath("/manage/settings/shipping");
}

export async function createShippingRate(formData: FormData) {
	const zoneId = formData.get("zoneId") as string;
	const name = formData.get("name") as string;
	const price = formData.get("price") as string;
	const minAmount = (formData.get("minAmount") as string) || "0";
	const minWeight = formData.get("minWeight") ? Number.parseFloat(formData.get("minWeight") as string) : null;
	const maxWeight = formData.get("maxWeight") ? Number.parseFloat(formData.get("maxWeight") as string) : null;
	const deliveryTime = (formData.get("deliveryTime") as string) || null;
	const pickupPointId = (formData.get("pickupPointId") as string) || null;

	await (await getDb()).insert(shippingRates).values({
		id: `rate_${Math.random().toString(36).substring(7)}`,
		zoneId,
		name,
		price,
		minAmount,
		minWeight: minWeight ?? null,
		maxWeight: maxWeight ?? null,
		deliveryTime,
		pickupPointId: pickupPointId === "none" ? null : pickupPointId,
	});

	revalidatePath("/manage/settings/shipping");
}

export async function updateShippingRate(id: string, formData: FormData) {
	const name = formData.get("name") as string;
	const price = formData.get("price") as string;
	const minAmount = (formData.get("minAmount") as string) || "0";
	const minWeight = formData.get("minWeight") ? Number.parseFloat(formData.get("minWeight") as string) : null;
	const maxWeight = formData.get("maxWeight") ? Number.parseFloat(formData.get("maxWeight") as string) : null;
	const deliveryTime = (formData.get("deliveryTime") as string) || null;
	const pickupPointId = (formData.get("pickupPointId") as string) || null;

	await (await getDb())
		.update(shippingRates)
		.set({
			name,
			price,
			minAmount,
			minWeight,
			maxWeight,
			deliveryTime,
			pickupPointId: pickupPointId === "none" ? null : pickupPointId,
		})
		.where(eq(shippingRates.id, id));

	revalidatePath("/manage/settings/shipping");
}

export async function deleteShippingRate(id: string) {
	await (await getDb()).delete(shippingRates).where(eq(shippingRates.id, id));
	revalidatePath("/manage/settings/shipping");
}

/**
 * Orders Management Actions
 */

export async function getOrders() {
	return await (await getDb()).query.orders.findMany({
		orderBy: (orders, { desc }) => [desc(orders.createdAt)],
		limit: 100, // Sécurité : On évite de saturer le dashboard si > 1000 commandes
	});
}

export async function getOrderDetails(orderId: string) {
	return await (await getDb()).query.orders.findFirst({
		where: eq(orders.id, orderId),
		with: {
			items: {
				with: {
					variant: {
						with: {
							product: true,
						},
					},
				},
			},
			pickupPoint: true,
		},
	});
}

export async function updateOrderStatusAction(
	orderId: string,
	status: "pending" | "paid" | "shipped" | "cancelled",
) {
	const db = await getDb();

	// 1. Récupération de l'état actuel de la commande pour éviter un double restock
	const orderInfo = await db.query.orders.findFirst({
		where: eq(orders.id, orderId),
		with: { items: true },
	});

	if (orderInfo) {
		const wasAlreadyCancelled = orderInfo.status === "cancelled";
		const isBeingCancelled = status === "cancelled";

		// 2. Si on annule une commande qui ne l'était pas avant, on restock les variantes
		if (isBeingCancelled && !wasAlreadyCancelled) {
			for (const item of orderInfo.items) {
				const variantData = await db.query.variants.findFirst({
					where: eq(variants.id, item.variantId),
				});

				if (variantData) {
					await db
						.update(variants)
						.set({ stock: variantData.stock + item.quantity })
						.where(eq(variants.id, item.variantId));
				}
			}
		}
	}

	// 3. Mise à jour du statut final
	await db.update(orders).set({ status }).where(eq(orders.id, orderId));
	revalidatePath("/manage/orders");
	revalidatePath(`/manage/orders/${orderId}`);
}

/**
 * Carts Management Actions
 */
export async function getAbandonedCarts() {
	const db = await getDb();

	// Nettoyage asynchrone (Non bloquant) des paniers très vieux (plus de 30 jours sans maj)
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	try {
		// sql`updated_at < ${thirtyDaysAgo}`
		await db.delete(carts).where(sql`${carts.updatedAt} < ${thirtyDaysAgo.getTime()}`);
	} catch (e) {
		console.error("Erreur gérée silencieusement lors du nettoyage des paniers", e);
	}

	return await db.query.carts.findMany({
		orderBy: (carts, { desc }) => [desc(carts.updatedAt)],
		limit: 100, // Sécurité OOM
		with: {
			lineItems: {
				with: {
					variant: {
						with: {
							product: true,
						},
					},
				},
			},
		},
	});
}

export async function createPickupPoint(formData: FormData) {
	const name = formData.get("name") as string;
	const city = formData.get("city") as string;
	const address = formData.get("address") as string;
	const phone = (formData.get("phone") as string) || null;
	const openingHours = (formData.get("openingHours") as string) || null;
	const coordinatesRaw = formData.get("coordinates") as string;
	const coordinates = coordinatesRaw ? JSON.parse(coordinatesRaw) : null;

	await (await getDb()).insert(pickupPoints).values({
		id: `pick_${Math.random().toString(36).substring(7)}`,
		name,
		city,
		address,
		phone,
		openingHours,
		coordinates,
	});

	revalidatePath("/manage/settings/shipping");
}

export async function deletePickupPoint(id: string) {
	await (await getDb()).delete(pickupPoints).where(eq(pickupPoints.id, id));
	revalidatePath("/manage/settings/shipping");
}
