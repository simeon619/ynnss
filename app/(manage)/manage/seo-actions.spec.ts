import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { categories, collections, products } from "@/lib/db/schema_tenant";
import {
	createCategory,
	createCollection,
	createProduct,
	updateCategory,
	updateCollection,
	updateProduct,
} from "./actions";

const mockValues = vi.fn().mockImplementation(() => ({
	returning: vi.fn().mockImplementation(() => [{ id: "new_id" }]),
}));
const mockSet = vi.fn().mockImplementation(() => ({
	where: vi.fn(),
}));
const mockWhere = vi.fn();
const mockFrom = vi.fn(() => ({
	where: vi.fn(() => []),
}));

// Mock dependencies
vi.mock("@/lib/db", () => {
	const mockDb = {
		insert: vi.fn(() => ({
			values: mockValues,
		})),
		update: vi.fn(() => ({
			set: mockSet,
		})),
		delete: vi.fn(() => ({
			where: mockWhere,
		})),
		select: vi.fn(() => ({
			from: mockFrom,
		})),
		run: vi.fn(),
		query: {
			products: { findFirst: vi.fn(), findMany: vi.fn() },
			categories: { findFirst: vi.fn(), findMany: vi.fn() },
			collections: { findFirst: vi.fn(), findMany: vi.fn() },
		},
	};
	return {
		getTenantDb: vi.fn().mockResolvedValue(mockDb),
		db: mockDb,
	};
});

vi.mock("@/lib/db/schema_tenant", () => ({
	products: { id: "products_table" },
	categories: { id: "categories_table" },
	collections: { id: "collections_table" },
	variants: { id: "variants_table" },
	orders: {},
	shippingRates: {},
	shippingZones: {},
	store_settings: {},
	pickupPoints: {},
	carts: {},
}));

vi.mock("@/lib/auth", () => ({
	verifySession: vi.fn().mockResolvedValue({ role: "MERCHANT", userId: "u1" }),
	getActiveStoreContext: vi.fn().mockResolvedValue("store_test"),
	deleteSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
}));

vi.mock("@/lib/category-utils", () => ({
	generateSlug: vi.fn((s) => s.toLowerCase().replace(/ /g, "-")),
	isCircular: vi.fn(() => false),
}));

describe("SEO Server Actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Products SEO", () => {
		it("should include SEO fields when creating a product", async () => {
			const formData = new FormData();
			formData.append("name", "Test Product");
			formData.append("seoTitle", "SEO Title");
			formData.append("seoDescription", "SEO Description");

			await createProduct(formData).catch(() => {}); // catch redirect

			expect(db.insert).toHaveBeenCalledWith(products);
			const valuesCall = vi.mocked(mockValues).mock.calls[0][0];
			expect(valuesCall).toMatchObject({
				seoTitle: "SEO Title",
				seoDescription: "SEO Description",
			});
		});

		it("should include SEO fields when updating a product", async () => {
			const formData = new FormData();
			formData.append("name", "Updated Product");
			formData.append("seoTitle", "New SEO Title");
			formData.append("seoDescription", "New SEO Description");

			await updateProduct("prod_1", formData).catch(() => {});

			expect(db.update).toHaveBeenCalledWith(products);
			const setCall = vi.mocked(mockSet).mock.calls[0][0];
			expect(setCall).toMatchObject({
				seoTitle: "New SEO Title",
				seoDescription: "New SEO Description",
			});
		});
	});

	describe("Categories SEO", () => {
		it("should include SEO fields when creating a category", async () => {
			const formData = new FormData();
			formData.append("name", "Test Category");
			formData.append("seoTitle", "Cat SEO Title");
			formData.append("seoDescription", "Cat SEO Description");

			await createCategory(formData).catch(() => {});

			expect(db.insert).toHaveBeenCalledWith(categories);
			const valuesCall = vi.mocked(mockValues).mock.calls[0][0];
			expect(valuesCall).toMatchObject({
				seoTitle: "Cat SEO Title",
				seoDescription: "Cat SEO Description",
			});
		});

		it("should include SEO fields when updating a category", async () => {
			const formData = new FormData();
			formData.append("name", "Updated Category");
			formData.append("seoTitle", "New Cat SEO Title");
			formData.append("seoDescription", "New Cat SEO Description");

			await updateCategory("cat_1", formData).catch(() => {});

			expect(db.update).toHaveBeenCalledWith(categories);
			const setCall = vi.mocked(mockSet).mock.calls[0][0];
			expect(setCall).toMatchObject({
				seoTitle: "New Cat SEO Title",
				seoDescription: "New Cat SEO Description",
			});
		});
	});

	describe("Collections SEO", () => {
		it("should include SEO fields when creating a collection", async () => {
			const formData = new FormData();
			formData.append("name", "Test Collection");
			formData.append("seoTitle", "Col SEO Title");
			formData.append("seoDescription", "Col SEO Description");

			await createCollection(formData).catch(() => {});

			expect(db.insert).toHaveBeenCalledWith(collections);
			const valuesCall = vi.mocked(mockValues).mock.calls[0][0];
			expect(valuesCall).toMatchObject({
				seoTitle: "Col SEO Title",
				seoDescription: "Col SEO Description",
			});
		});

		it("should include SEO fields when updating a collection", async () => {
			const formData = new FormData();
			formData.append("name", "Updated Collection");
			formData.append("seoTitle", "New Col SEO Title");
			formData.append("seoDescription", "New Col SEO Description");

			await updateCollection("col_1", formData).catch(() => {});

			expect(db.update).toHaveBeenCalledWith(collections);
			const setCall = vi.mocked(mockSet).mock.calls[0][0];
			expect(setCall).toMatchObject({
				seoTitle: "New Col SEO Title",
				seoDescription: "New Col SEO Description",
			});
		});

		it("should auto-generate slug for collection if not provided", async () => {
			const formData = new FormData();
			formData.append("name", "Test Collection Name");

			await createCollection(formData).catch(() => {});

			const valuesCall = vi.mocked(db.insert(collections).values).mock.calls[0][0];
			expect(valuesCall.slug).toBe("test-collection-name");
		});
	});
});
