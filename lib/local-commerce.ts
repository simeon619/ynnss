import { eq, inArray, or } from "drizzle-orm";
import { getTenantDb } from "@/lib/db";
import {
	cartItems,
	carts,
	categories,
	collections,
	orderItems,
	orders,
	products,
} from "@/lib/db/schema_tenant";
import { type Category, getAncestors, getDescendants, isEffectivelyActive } from "./category-utils";

/** Get the storefront tenant DB based on STORE_ID env var */
async function getDb() {
	const storeId = process.env.STORE_ID;
	if (!storeId) throw new Error("STORE_ID env variable is not set for this storefront.");
	return getTenantDb(storeId);
}

// Mock types to match commerce-kit expectations
export interface LocalCommerce {
	meGet: () => Promise<unknown>;
	productBrowse: (params?: { limit?: number; active?: boolean }) => Promise<unknown>;
	categoryBrowse: () => Promise<unknown>;
	categoryGet: (params: { idOrSlug: string }) => Promise<unknown>;
	collectionBrowse: (params?: { limit?: number }) => Promise<unknown>;
	productGet: (params: { idOrSlug: string }) => Promise<unknown>;
	collectionGet: (params: { idOrSlug: string }) => Promise<unknown>;
	cartGet: (params: { cartId: string }) => Promise<unknown>;
	cartUpsert: (params: { cartId?: string; variantId: string; quantity: number }) => Promise<unknown>;
	cartClear: (params: { cartId: string }) => Promise<void>;
	orderGet: (params: { id: string }) => Promise<unknown>;
	orderCreate: (params: { order: LocalOrderInput }) => Promise<unknown>;
}

interface LocalVariant {
	id?: string;
	price: string;
	images?: string[] | null;
	manageInventory?: boolean | null;
	stock?: number | null;
	isEnabled?: boolean | null;
	attributes?: { key: string; value: string }[] | null;
	shippable?: boolean | null;
}

interface LocalProduct {
	id: string;
	name: string;
	slug: string;
	description?: string | null;
	summary?: string | null;
	images?: string[] | null;
	options?: unknown[] | null;
	seoTitle?: string | null;
	seoDescription?: string | null;
	badgeText?: string | null;
	badgeColor?: string | null;
	categoryId?: string | null;
	collections?: string[] | null;
	tags?: string[] | null;
	vendor?: string | null;
	createdAt?: Date | null;
	variants?: LocalVariant[];
}

interface LocalCollection {
	id: string;
	name: string;
	slug: string;
	description?: string | null;
	seoTitle?: string | null;
	seoDescription?: string | null;
	image?: string | null;
	bannerImage?: string | null;
	descriptionBottom?: string | null;
	badgeText?: string | null;
	badgeColor?: string | null;
	defaultSort?: string | null;
	manualOrder?: string[] | null;
	activeFrom?: string | null;
	activeTo?: string | null;
}

interface LocalCategoryGetResult extends Category {
	children: Category[];
	products: LocalBrowseResult<LocalProduct>;
	breadcrumbs: Category[];
}

interface LocalCollectionGetResult extends LocalCollection {
	productCollections: Array<{
		product: LocalProduct;
	}>;
	products: LocalBrowseResult<LocalProduct>;
}

interface LocalMeResult {
	store: { subdomain: string; name: string };
	publicUrl: string;
	storeBaseUrl?: string;
}

interface LocalBrowseResult<T> {
	data: T[];
}

interface LocalCartLineItem {
	id: string;
	quantity: number;
	productVariant: {
		id: string;
		price: string;
		images?: string[] | null;
		product: {
			id: string;
			name: string;
			slug: string;
			images?: string[] | null;
		};
	};
}

interface LocalCart {
	id: string;
	lineItems: LocalCartLineItem[];
}

interface LocalOrderGetResult {
	id: string;
	lookup: string;
	orderData: {
		lineItems: LocalCartLineItem[];
		shippingAddress: {
			firstName: string;
			lastName: string;
			city: string;
			country: string;
			address: string;
		};
		shipping?: {
			name: string;
			price: string;
		};
		customer: { email: string };
	};
}

interface CollectionRuleInput {
	field: string;
	operator: string;
	value: unknown;
}

interface CollectionRulesInput {
	logicalOperator?: "AND" | "OR";
	rules?: CollectionRuleInput[];
	minPrice?: number;
	maxPrice?: number;
}

interface LocalOrderInput {
	id: string;
	lookup: string;
	paymentMethod?: string | null;
	orderData: {
		customer: {
			email: string;
		};
		shippingAddress: {
			firstName: string;
			lastName: string;
			city: string;
			country: string;
			address: string;
		};
		lineItems: Array<{
			quantity: number;
			productVariant: {
				id: string;
				price: string;
			};
		}>;
	};
}

export const LocalCommerceImplementation: LocalCommerce = {
	async meGet() {
		return {
			store: { subdomain: "sport-ci", name: "Sport YNS CI" },
			publicUrl: "http://localhost:3000",
		};
	},

	async productBrowse({ limit = 10, active = true } = {}) {
		const result = await (await getDb()).query.products.findMany({
			limit,
			where: active ? eq(products.status, "published") : undefined,
			with: { variants: true },
		});
		return { data: result };
	},

	async categoryBrowse() {
		const result = await (await getDb()).query.categories.findMany({
			where: eq(categories.status, "active"),
			orderBy: categories.sortOrder,
		});
		return { data: result };
	},

	async categoryGet({ idOrSlug }) {
		const allCategoriesData = (await (await getDb()).select().from(categories)) as unknown as Category[];
		const category = allCategoriesData.find((c: Category) => c.id === idOrSlug || c.slug === idOrSlug);

		if (!category || !isEffectivelyActive(allCategoriesData, category.id)) {
			return null;
		}

		// Fetch children separately to apply active filter
		const children = allCategoriesData.filter(
			(c: Category) => c.parentId === category.id && c.status === "active",
		);

		// Get all relevant category IDs for product fetching (recursive)
		const categoryIds = [category.id, ...getDescendants(allCategoriesData, category.id)];

		const productsResult = await (await getDb()).query.products.findMany({
			where: inArray(products.categoryId, categoryIds),
			with: { variants: true },
		});

		// Build breadcrumbs
		const breadcrumbs = getAncestors(allCategoriesData, category.id);

		return {
			...category,
			children: children,
			products: { data: productsResult },
			breadcrumbs: breadcrumbs,
		};
	},

	async collectionBrowse({ limit = 10 } = {}) {
		const allCollections = await (await getDb()).query.collections.findMany();
		const now = new Date();

		const activeCollections = allCollections.filter((c) => {
			const from = c.activeFrom ? new Date(c.activeFrom) : null;
			const to = c.activeTo ? new Date(c.activeTo) : null;

			if (from && now < from) return false;
			if (to && now > to) return false;
			return true;
		});

		return { data: activeCollections.slice(0, limit) };
	},

	async productGet({ idOrSlug }) {
		const result = await (await getDb()).query.products.findFirst({
			where: or(eq(products.id, idOrSlug), eq(products.slug, idOrSlug)),
			with: { variants: true },
		});
		return result ? { ...result } : null;
	},

	async collectionGet({ idOrSlug }) {
		const collection = await (await getDb()).query.collections.findFirst({
			where: or(eq(collections.id, idOrSlug), eq(collections.slug, idOrSlug)),
		});
		if (!collection) return null;

		// Date filtering
		const now = new Date();
		const from = collection.activeFrom ? new Date(collection.activeFrom) : null;
		const to = collection.activeTo ? new Date(collection.activeTo) : null;

		if (from && now < from) return null;
		if (to && now > to) return null;

		let filteredProducts: LocalProduct[] = [];

		if (collection.type === "automated" && collection.rules) {
			const rawRules = (
				typeof collection.rules === "string" ? JSON.parse(collection.rules) : collection.rules
			) as CollectionRulesInput;

			const allProducts = (await (
				await getDb()
			).query.products.findMany({
				with: { variants: true },
			})) as LocalProduct[];

			// Helper to evaluate a single rule
			const evaluateRule = (product: LocalProduct, rule: CollectionRuleInput): boolean => {
				const { field, operator, value } = rule;

				switch (field) {
					case "price":
						return (product.variants ?? []).some((v) => {
							const price = Number(v.price);
							const val = Number(value);
							if (operator === "gt") return price > val;
							if (operator === "lt") return price < val;
							if (operator === "eq") return price === val;
							if (operator === "after") return price >= val; // Used as "greater or equal" for price
							if (operator === "before") return price <= val; // Used as "less or equal" for price
							return false;
						});
					case "category":
						if (operator === "eq") return product.categoryId === value;
						if (operator === "neq") return product.categoryId !== value;
						if (operator === "in")
							return (
								Array.isArray(value) &&
								value.some((categoryId) => String(categoryId) === String(product.categoryId))
							);
						return false;
					case "tag": {
						const tags = product.tags || [];
						if (operator === "contains") return tags.includes(String(value));
						return false;
					}
					case "vendor":
						if (operator === "eq") return product.vendor === value;
						if (operator === "contains")
							return String(product.vendor).toLowerCase().includes(String(value).toLowerCase());
						return false;
					case "stock": {
						const totalStock = (product.variants ?? []).reduce((acc, v) => acc + (v.stock || 0), 0);
						const stockVal = Number(value);
						if (operator === "gt") return totalStock > stockVal;
						if (operator === "lt") return totalStock < stockVal;
						if (operator === "eq") return totalStock === stockVal;
						return false;
					}
					case "createdAt": {
						const productDate = product.createdAt ? new Date(product.createdAt).getTime() : 0;
						// If value is a number, treat as "days ago"
						const targetTime =
							typeof value === "number"
								? Date.now() - value * 24 * 60 * 60 * 1000
								: new Date(value as string).getTime();
						if (operator === "after") return productDate >= targetTime;
						if (operator === "before") return productDate <= targetTime;
						return false;
					}
					default:
						return false;
				}
			};

			// Check if it's the new multi-rule format or old price-only format
			if (rawRules.rules && Array.isArray(rawRules.rules)) {
				const { logicalOperator, rules } = rawRules;
				filteredProducts = allProducts.filter((p) => {
					if (logicalOperator === "OR") {
						return rules.some((rule) => evaluateRule(p, rule));
					}
					return rules.every((rule) => evaluateRule(p, rule));
				});
			} else {
				// Backward compatibility with { minPrice, maxPrice }
				filteredProducts = allProducts.filter((p) => {
					return (p.variants ?? []).some((v) => {
						const price = Number(v.price);
						const minMatch =
							rawRules.minPrice === undefined || rawRules.minPrice === null || price >= rawRules.minPrice;
						const maxMatch =
							rawRules.maxPrice === undefined || rawRules.maxPrice === null || price <= rawRules.maxPrice;
						return minMatch && maxMatch;
					});
				});
			}
		} else {
			// Find products that have this collection slug in their collections JSON array
			const allProducts = (await (
				await getDb()
			).query.products.findMany({
				with: { variants: true },
			})) as LocalProduct[];
			filteredProducts = allProducts.filter(
				(p) => p.collections?.includes(idOrSlug) || p.collections?.includes(collection.slug),
			);
		}

		// Apply sorting
		const sortMode = collection.defaultSort || "newest";

		if (sortMode === "manual" && Array.isArray(collection.manualOrder) && collection.manualOrder.length > 0) {
			const orderMap = new Map(collection.manualOrder.map((id: string, index: number) => [id, index]));
			filteredProducts.sort((a, b) => {
				const orderA = orderMap.has(a.id) ? (orderMap.get(a.id) as number) : 999999;
				const orderB = orderMap.has(b.id) ? (orderMap.get(b.id) as number) : 999999;
				return orderA - orderB;
			});
		} else if (sortMode === "price-asc") {
			filteredProducts.sort((a, b) => {
				const priceA = Math.min(...(a.variants ?? []).map((v) => Number(v.price)));
				const priceB = Math.min(...(b.variants ?? []).map((v) => Number(v.price)));
				return priceA - priceB;
			});
		} else if (sortMode === "price-desc") {
			filteredProducts.sort((a, b) => {
				const priceA = Math.max(...(a.variants ?? []).map((v) => Number(v.price)));
				const priceB = Math.max(...(b.variants ?? []).map((v) => Number(v.price)));
				return priceB - priceA;
			});
		} else if (sortMode === "alphabetical") {
			filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
		} else if (sortMode === "oldest") {
			filteredProducts.sort((a, b) => {
				const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
				const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
				return dateA - dateB;
			});
		} else {
			// default: newest
			filteredProducts.sort((a, b) => {
				const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
				const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
				return dateB - dateA;
			});
		}

		return {
			...collection,
			productCollections: filteredProducts.map((p) => ({
				product: {
					...p,
					badgeText: p.badgeText || collection.badgeText,
					badgeColor: p.badgeColor || collection.badgeColor,
				},
			})),
			products: {
				data: filteredProducts.map((p) => ({
					...p,
					badgeText: p.badgeText || collection.badgeText,
					badgeColor: p.badgeColor || collection.badgeColor,
				})),
			},
		};
	},

	async cartGet({ cartId }) {
		const cart = await (await getDb()).query.carts.findFirst({
			where: eq(carts.id, cartId),
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

		if (!cart) return { id: cartId, lineItems: [] };

		// Format lineItems to match expected format (productVariant -> product)
		const formattedLineItems = cart.lineItems.map((item) => ({
			id: item.id,
			quantity: item.quantity,
			productVariant: {
				...item.variant,
				product: item.variant.product,
			},
		}));

		return { ...cart, lineItems: formattedLineItems };
	},

	async cartUpsert({ cartId, variantId, quantity }) {
		const id = cartId || `cart_${Math.random().toString(36).substring(7)}`;

		// Ensure cart exists
		await (await getDb()).insert(carts).values({ id }).onConflictDoNothing();

		if (quantity === 0) {
			// Remove item
			await (await getDb()).delete(cartItems).where(eq(cartItems.variantId, variantId));
		} else {
			// Check if item exists
			const existingItem = await (await getDb()).query.cartItems.findFirst({
				where: eq(cartItems.variantId, variantId),
			});

			if (existingItem) {
				const newQuantity = existingItem.quantity + quantity;
				if (newQuantity <= 0) {
					await (await getDb()).delete(cartItems).where(eq(cartItems.id, existingItem.id));
				} else {
					await (await getDb())
						.update(cartItems)
						.set({ quantity: newQuantity })
						.where(eq(cartItems.id, existingItem.id));
				}
			} else if (quantity > 0) {
				await (await getDb()).insert(cartItems).values({
					id: `item_${Math.random().toString(36).substring(7)}`,
					cartId: id,
					variantId: variantId,
					quantity: quantity,
				});
			}
		}

		return this.cartGet({ cartId: id });
	},

	async cartClear({ cartId }) {
		await (await getDb()).delete(cartItems).where(eq(cartItems.cartId, cartId));
	},

	async orderGet({ id }) {
		const order = await (await getDb()).query.orders.findFirst({
			where: eq(orders.id, id),
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
			},
		});

		if (order) {
			// Format to match expected Order format
			return {
				...order,
				orderData: {
					lineItems: order.items.map((item) => ({
						id: item.id.toString(),
						quantity: item.quantity,
						productVariant: {
							...item.variant,
							product: item.variant.product,
						},
					})),
					shippingAddress: order.shippingAddress,
					customer: { email: order.customerEmail },
				},
			};
		}

		// Fallback for demo
		return {
			id,
			lookup: `ORD-${id.substring(0, 5).toUpperCase()}`,
			orderData: {
				lineItems: [],
				shippingAddress: {
					firstName: "Client",
					lastName: "Demo",
					city: "Abidjan",
					country: "CI",
					address: "Plateau",
				},
				customer: { email: "demo@example.com" },
			},
		};
	},

	async orderCreate({ order }) {
		const { id, lookup, orderData } = order;

		await (await getDb()).insert(orders).values({
			id,
			lookup,
			status: "pending",
			subtotal: orderData.lineItems
				.reduce((acc, item) => acc + BigInt(item.productVariant.price) * BigInt(item.quantity), BigInt(0))
				.toString(),
			customerEmail: orderData.customer.email,
			shippingAddress: orderData.shippingAddress,
			paymentMethod: order.paymentMethod || null,
		});

		for (const item of orderData.lineItems) {
			await (await getDb()).insert(orderItems).values({
				orderId: id,
				variantId: item.productVariant.id,
				quantity: item.quantity,
				price: item.productVariant.price,
				// costPrice saved to variant, not orderItems (avoids migration)
			});
		}

		return order;
	},
};
