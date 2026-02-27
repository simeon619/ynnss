import type { Option } from "./variant-helpers";

export type ProductWithRelations = {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	summary: string | null;
	status: string | null;
	images: string[] | null;
	categoryId: string | null;
	collections: string[] | null;

	// SEO
	seoTitle: string | null;
	seoDescription: string | null;

	// Badge
	badgeText: string | null;
	badgeColor: string | null;

	// Organization
	vendor: string | null;
	tags: string[] | null;
	chargeTax: boolean | null;

	// Simple Product Fields
	price: string | null;
	costPrice: string | null;
	stock: number | null;
	sku: string | null;
	barcode: string | null;

	// Relations
	variants: Variant[];
	category?: Category | null;
	options?: Option[] | null;
};

export type Category = {
	id: string;
	name: string;
	slug: string;
};

export type Variant = {
	id: string;
	productId: string;
	price: string;
	stock: number;
	sku: string | null;
	barcode: string | null;
	weight: number | null;
	width: number | null;
	height: number | null;
	depth: number | null;
	shippable: boolean | null;
	images: string[] | null;
	combinations: Record<string, unknown>[] | null;

	// New Fields
	costPrice: string | null;
	compareAtPrice: string | null;
	digitalFileUrl: string | null;
	isEnabled: boolean | null;
	attributes?: { key: string; value: string }[] | null;
	digitalAttachments?: { name: string; url: string; size?: number }[] | null;
	manageInventory?: boolean | null;
};
