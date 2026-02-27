import { relations } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
	id: text("id").primaryKey(),
	// storeId removed
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	description: text("description"),
	summary: text("summary"),
	images: text("images", { mode: "json" }).$type<string[]>(), // Array of image URLs
	categoryId: text("category_id"), // Main structural classification
	collections: text("collections", { mode: "json" }).$type<string[]>(), // Marketing tags (slugs)
	status: text("status").default("published"), // published, draft, hidden

	// SEO
	seoTitle: text("seo_title"),
	seoDescription: text("seo_description"),

	// Badge
	badgeText: text("badge_text"),
	badgeColor: text("badge_color"), // Hex color

	// Organization
	vendor: text("vendor"),
	tags: text("tags", { mode: "json" }).$type<string[]>(), // Array of tags
	options: text("options", { mode: "json" }).$type<Record<string, unknown>[]>(), // Array of options (including visuals)
	chargeTax: integer("charge_tax", { mode: "boolean" }).default(false),

	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const productsRelations = relations(products, ({ one, many }) => ({
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id],
	}),
	variants: many(variants),
}));

export const variants = sqliteTable("variants", {
	id: text("id").primaryKey(),
	productId: text("product_id")
		.notNull()
		.references(() => products.id, { onDelete: "cascade" }),
	price: text("price").notNull(), // String for BigInt/Decimal precision
	stock: integer("stock").notNull().default(0),
	manageInventory: integer("manage_inventory", { mode: "boolean" }).default(false),
	sku: text("sku"),
	barcode: text("barcode"),

	// Pricing Details
	compareAtPrice: text("compare_at_price"), // For sales
	costPrice: text("cost_price"), // For profit calc

	// Shipping
	weight: real("weight"), // kg
	width: real("width"), // cm
	height: real("height"), // cm
	depth: real("depth"), // cm
	shippable: integer("shippable", { mode: "boolean" }).default(true),
	isEnabled: integer("is_enabled", { mode: "boolean" }).default(true),

	images: text("images", { mode: "json" }).$type<string[]>(),
	combinations: text("combinations", { mode: "json" }).$type<Record<string, unknown>[]>(), // Array of variant options
	attributes: text("attributes", { mode: "json" }).$type<{ key: string; value: string }[]>(), // Custom specifications
	digitalFileUrl: text("digital_file_url"),
});

export const variantsRelations = relations(variants, ({ one }) => ({
	product: one(products, {
		fields: [variants.productId],
		references: [products.id],
	}),
}));

export const orders = sqliteTable("orders", {
	id: text("id").primaryKey(),
	// storeId removed
	lookup: text("lookup").notNull().unique(), // e.g. ORD-123456
	status: text("status").notNull().default("pending"), // pending, paid, shipped, cancelled
	subtotal: text("subtotal").notNull(),
	currency: text("currency").notNull().default("XOF"),
	customerEmail: text("customer_email").notNull(),
	shippingAddress: text("shipping_address", { mode: "json" }).$type<{
		firstName: string;
		lastName: string;
		address: string;
		city: string;
		country: string;
	}>(),
	shippingRateId: text("shipping_rate_id"),
	shippingCost: text("shipping_cost").default("0"),
	coordinates: text("coordinates", { mode: "json" }).$type<{ lat: number; lng: number }>(), // Delivery GPS location
	pickupPointId: text("pickup_point_id").references(() => pickupPoints.id), // If it's a click & collect order
	paymentMethod: text("payment_method"), // WAVE, ORANGE_MONEY, etc.
	transactionId: text("transaction_id"),
	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
	items: many(orderItems),
	pickupPoint: one(pickupPoints, {
		fields: [orders.pickupPointId],
		references: [pickupPoints.id],
	}),
}));

export const orderItems = sqliteTable("order_items", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	orderId: text("order_id")
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),
	variantId: text("variant_id")
		.notNull()
		.references(() => variants.id),
	quantity: integer("quantity").notNull().default(1),
	price: text("price").notNull(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id],
	}),
	variant: one(variants, {
		fields: [orderItems.variantId],
		references: [variants.id],
	}),
}));

export const carts = sqliteTable("carts", {
	id: text("id").primaryKey(),

	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const cartsRelations = relations(carts, ({ many }) => ({
	lineItems: many(cartItems),
}));

export const cartItems = sqliteTable("cart_items", {
	id: text("id").primaryKey(),
	cartId: text("cart_id")
		.notNull()
		.references(() => carts.id, { onDelete: "cascade" }),
	variantId: text("variant_id")
		.notNull()
		.references(() => variants.id),
	quantity: integer("quantity").notNull().default(1),
	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
	cart: one(carts, {
		fields: [cartItems.cartId],
		references: [carts.id],
	}),
	variant: one(variants, {
		fields: [cartItems.variantId],
		references: [variants.id],
	}),
}));

export const coupons = sqliteTable("coupons", {
	id: text("id").primaryKey(),
	// storeId removed
	code: text("code").notNull().unique(),
	type: text("type").notNull(), // percentage, fixed
	value: real("value").notNull(),
	minAmount: text("min_amount").default("0"),
	maxUsage: integer("max_usage"),
	usedCount: integer("used_count").default(0),
	expiresAt: integer("expires_at", { mode: "timestamp" }),
	status: text("status").default("active"),
});

// Categories: Structural, Hierarchical (e.g. Men > Shoes)
export const categories = sqliteTable("categories", {
	id: text("id").primaryKey(),
	// storeId removed
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	description: text("description"),
	descriptionBottom: text("description_bottom"),
	parentId: text("parent_id"),
	image: text("image"),
	seoTitle: text("seo_title"),
	seoDescription: text("seo_description"),
	sortOrder: integer("sort_order").default(0),
	status: text("status").default("active"), // active, inactive
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
	parent: one(categories, {
		fields: [categories.parentId],
		references: [categories.id],
		relationName: "category_hierarchy",
	}),
	children: many(categories, {
		relationName: "category_hierarchy",
	}),
	products: many(products),
}));

export type CollectionRule = {
	id: string;
	field: "price" | "category" | "tag" | "vendor" | "stock" | "createdAt";
	operator: "eq" | "neq" | "gt" | "lt" | "contains" | "in" | "after" | "before";
	value: string | number | boolean | string[] | number[];
};

export type CollectionRules = {
	logicalOperator: "AND" | "OR";
	rules: CollectionRule[];
};

// Collections: Marketing, Thematic (e.g. Summer Sale, Valentine's)
export const collections = sqliteTable("collections", {
	id: text("id").primaryKey(),
	// storeId removed
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	description: text("description"),
	image: text("image"),
	bannerImage: text("banner_image"),
	seoTitle: text("seo_title"),
	seoDescription: text("seo_description"),
	descriptionBottom: text("description_bottom"),
	badgeText: text("badge_text"),
	badgeColor: text("badge_color"),
	type: text("type").default("manual"), // manual, automated
	rules: text("rules", { mode: "json" }).$type<CollectionRules | { minPrice?: number; maxPrice?: number }>(),
	defaultSort: text("default_sort").default("newest"), // newest, oldest, price-asc, price-desc, alphabetical, manual
	manualOrder: text("manual_order", { mode: "json" }).$type<string[]>(), // Array of product IDs for manual sorting
	activeFrom: text("active_from"), // ISO timestamp
	activeTo: text("active_to"), // ISO timestamp
});

export const collectionsRelations = relations(collections, ({ many }) => ({
	// Products relationship is implicit via the JSON array in products table for now
}));

export const shippingZones = sqliteTable("shipping_zones", {
	id: text("id").primaryKey(),
	// storeId removed
	name: text("name").notNull(), // e.g. "Abidjan", "Intérieur"
	description: text("description"),
	cities: text("cities", { mode: "json" }).$type<string[]>(), // Array of cities covered by this zone
	boundary: text("boundary", { mode: "json" }).$type<Record<string, unknown>>(), // GeoJSON Feature/Polygon
});

export const shippingRates = sqliteTable("shipping_rates", {
	id: text("id").primaryKey(),
	zoneId: text("zone_id")
		.notNull()
		.references(() => shippingZones.id, { onDelete: "cascade" }),
	name: text("name").notNull(), // e.g. "Standard", "Express"
	price: text("price").notNull(), // String for BigInt
	minAmount: text("min_amount").default("0"), // For free shipping threshold
	maxAmount: text("max_amount"),
	minWeight: real("min_weight"), // Minimum weight in kg
	maxWeight: real("max_weight"), // Maximum weight in kg
	deliveryTime: text("delivery_time"), // e.g. "2-5 business days"
	pickupPointId: text("pickup_point_id").references(() => pickupPoints.id), // Link to a specific store for pickup
});

export const shippingZonesRelations = relations(shippingZones, ({ many }) => ({
	rates: many(shippingRates),
}));

export const pickupPoints = sqliteTable("pickup_points", {
	id: text("id").primaryKey(),
	// storeId removed
	name: text("name").notNull(), // e.g. "Boutique Angré", "Point Relais Plateau"
	address: text("address").notNull(),
	city: text("city").notNull(),
	coordinates: text("coordinates", { mode: "json" }).$type<{ lat: number; lng: number }>(), // Exact location for map display
	phone: text("phone"),
	openingHours: text("opening_hours"), // e.g. "Lun-Ven 8h-18h"
	status: text("status").default("active"),
});

export const shippingRatesRelations = relations(shippingRates, ({ one }) => ({
	zone: one(shippingZones, {
		fields: [shippingRates.zoneId],
		references: [shippingZones.id],
	}),
	pickupPoint: one(pickupPoints, {
		fields: [shippingRates.pickupPointId],
		references: [pickupPoints.id],
	}),
}));

export const pickupPointsRelations = relations(pickupPoints, ({ many }) => ({
	rates: many(shippingRates),
	orders: many(orders),
}));

export const storeSettings = sqliteTable("store_settings", {
	// There will only be ONE row in this table per tenant DB.
	id: integer("id").primaryKey({ autoIncrement: true }),
	// storeId removed
	name: text("name").notNull().default("My Store"),
	currency: text("currency").notNull().default("XOF"),
	language: text("language").notNull().default("English (US)"),

	// Company Info
	fullName: text("full_name"),
	companyName: text("company_name"),
	taxId: text("tax_id"),
	address1: text("address1"),
	address2: text("address2"),
	postalCode: text("postal_code"),
	city: text("city"),
	state: text("state"),
	country: text("country"),
	phone: text("phone"),

	// Branding / Advanced
	showReferralBadge: integer("show_referral_badge", { mode: "boolean" }).default(true),

	// Storefront Appearance
	heroTitle: text("hero_title").default("Nouvelle Collection"),
	heroSubtitle: text("hero_subtitle").default("Découvrez nos derniers arrivages et tendances de la saison."),
	heroImage: text("hero_image"),
	featuredCollectionId: text("featured_collection_id"),

	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const payoutWallets = sqliteTable("payout_wallets", {
	id: text("id").primaryKey(),
	// storeId removed
	label: text("label").notNull(), // e.g., "Main Wave Account"
	phone: text("phone").notNull(),
	type: text("type").notNull().default("WAVE"), // WAVE, OM, etc.
	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
