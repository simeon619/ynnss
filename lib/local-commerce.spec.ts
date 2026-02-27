import { describe, expect, it, vi } from "vitest";
import { db } from "./db";
import { LocalCommerceImplementation } from "./local-commerce";

process.env.STORE_ID = "test_store";

// Mock the database
vi.mock("./db", () => {
	const mockDb = {
		query: {
			products: {
				findMany: vi.fn(),
				findFirst: vi.fn(),
			},
		},
	};
	return {
		db: mockDb,
		getTenantDb: vi.fn().mockResolvedValue(mockDb),
	};
});

describe("local-commerce", () => {
	describe("productBrowse", () => {
		it("should fetch products with default limit", async () => {
			const mockProducts = [{ id: "1", name: "Product 1", status: "published" }];
			vi.mocked(db.query.products.findMany).mockResolvedValue(mockProducts);

			const result = await LocalCommerceImplementation.productBrowse();

			expect(db.query.products.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 10,
					where: expect.any(Object),
				}),
			);
			expect(result.data).toEqual(mockProducts);
		});

		it("should filter by active status", async () => {
			await LocalCommerceImplementation.productBrowse({ active: false });

			expect(db.query.products.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: undefined,
				}),
			);
		});
	});

	describe("productGet", () => {
		it("should fetch product by id or slug", async () => {
			const mockProduct = { id: "p1", slug: "prod-1", name: "Product 1" };
			vi.mocked(db.query.products.findFirst).mockResolvedValue(mockProduct);

			const result = await LocalCommerceImplementation.productGet({ idOrSlug: "prod-1" });

			expect(db.query.products.findFirst).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.any(Object),
				}),
			);
			expect(result).toEqual(mockProduct);
		});

		it("should return null if product not found", async () => {
			vi.mocked(db.query.products.findFirst).mockResolvedValue(null);

			const result = await LocalCommerceImplementation.productGet({ idOrSlug: "none" });
			expect(result).toBeNull();
		});
	});
});
