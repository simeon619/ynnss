import { describe, expect, it, vi } from "vitest";
import { db } from "./db";
import { LocalCommerceImplementation } from "./local-commerce";

process.env.STORE_ID = "test_store";

vi.mock("./db", () => {
	const mockDb = {
		query: {
			collections: { findFirst: vi.fn() },
			products: { findMany: vi.fn() },
		},
	};
	return {
		db: mockDb,
		getTenantDb: vi.fn().mockResolvedValue(mockDb),
	};
});

describe("automated-collections", () => {
	it("should filter products based on minPrice rule", async () => {
		const mockCollection = {
			id: "c1",
			slug: "expensive",
			type: "automated",
			rules: { minPrice: 100 },
		};
		const mockProducts = [
			{ id: "p1", name: "Cheap", variants: [{ price: "50" }] },
			{ id: "p2", name: "Expensive", variants: [{ price: "150" }] },
		];

		vi.mocked(db.query.collections.findFirst).mockResolvedValue(mockCollection);
		vi.mocked(db.query.products.findMany).mockResolvedValue(mockProducts);

		const result = await LocalCommerceImplementation.collectionGet({ idOrSlug: "expensive" });

		expect(result.products.data).toHaveLength(1);
		expect(result.products.data[0].id).toBe("p2");
	});

	it("should filter products based on maxPrice rule", async () => {
		const mockCollection = {
			id: "c2",
			slug: "budget",
			type: "automated",
			rules: { maxPrice: 100 },
		};
		const mockProducts = [
			{ id: "p1", name: "Cheap", variants: [{ price: "50" }] },
			{ id: "p2", name: "Expensive", variants: [{ price: "150" }] },
		];

		vi.mocked(db.query.collections.findFirst).mockResolvedValue(mockCollection);
		vi.mocked(db.query.products.findMany).mockResolvedValue(mockProducts);

		const result = await LocalCommerceImplementation.collectionGet({ idOrSlug: "budget" });

		expect(result.products.data).toHaveLength(1);
		expect(result.products.data[0].id).toBe("p1");
	});

	it("should filter products based on both min and max price rules", async () => {
		const mockCollection = {
			id: "c3",
			slug: "mid-range",
			type: "automated",
			rules: { minPrice: 80, maxPrice: 120 },
		};
		const mockProducts = [
			{ id: "p1", name: "Cheap", variants: [{ price: "50" }] },
			{ id: "p2", name: "Mid", variants: [{ price: "100" }] },
			{ id: "p3", name: "Expensive", variants: [{ price: "150" }] },
		];

		vi.mocked(db.query.collections.findFirst).mockResolvedValue(mockCollection);
		vi.mocked(db.query.products.findMany).mockResolvedValue(mockProducts);

		const result = await LocalCommerceImplementation.collectionGet({ idOrSlug: "mid-range" });

		expect(result.products.data).toHaveLength(1);
		expect(result.products.data[0].id).toBe("p2");
	});

	it("should return all products if rules are empty", async () => {
		const mockCollection = {
			id: "c4",
			slug: "all",
			type: "automated",
			rules: {},
		};
		const mockProducts = [
			{ id: "p1", name: "Cheap", variants: [{ price: "50" }] },
			{ id: "p2", name: "Expensive", variants: [{ price: "150" }] },
		];

		vi.mocked(db.query.collections.findFirst).mockResolvedValue(mockCollection);
		vi.mocked(db.query.products.findMany).mockResolvedValue(mockProducts);

		const result = await LocalCommerceImplementation.collectionGet({ idOrSlug: "all" });

		expect(result.products.data).toHaveLength(2);
	});

	it("should filter products based on category rule", async () => {
		const mockCollection = {
			id: "c5",
			slug: "sneakers",
			type: "automated",
			rules: {
				logicalOperator: "AND",
				rules: [{ id: "r1", field: "category", operator: "eq", value: "cat_sneakers" }],
			},
		};
		const mockProducts = [
			{ id: "p1", name: "Shoe", categoryId: "cat_sneakers", variants: [{ price: "100" }] },
			{ id: "p2", name: "Shirt", categoryId: "cat_shirts", variants: [{ price: "100" }] },
		];

		vi.mocked(db.query.collections.findFirst).mockResolvedValue(mockCollection);
		vi.mocked(db.query.products.findMany).mockResolvedValue(mockProducts);

		const result = await LocalCommerceImplementation.collectionGet({ idOrSlug: "sneakers" });

		expect(result.products.data).toHaveLength(1);
		expect(result.products.data[0].id).toBe("p1");
	});

	it("should handle logical OR operator", async () => {
		const mockCollection = {
			id: "c6",
			slug: "nike-or-cheap",
			type: "automated",
			rules: {
				logicalOperator: "OR",
				rules: [
					{ id: "r1", field: "vendor", operator: "eq", value: "Nike" },
					{ id: "r2", field: "price", operator: "lt", value: 50 },
				],
			},
		};
		const mockProducts = [
			{ id: "p1", name: "Nike Shoe", vendor: "Nike", variants: [{ price: "100" }] },
			{ id: "p2", name: "Cheap Shoe", vendor: "Adidas", variants: [{ price: "30" }] },
			{ id: "p3", name: "Expensive Shoe", vendor: "Adidas", variants: [{ price: "200" }] },
		];

		vi.mocked(db.query.collections.findFirst).mockResolvedValue(mockCollection);
		vi.mocked(db.query.products.findMany).mockResolvedValue(mockProducts);

		const result = await LocalCommerceImplementation.collectionGet({ idOrSlug: "nike-or-cheap" });

		expect(result.products.data).toHaveLength(2);
		const ids = result.products.data.map((p: { id: string }) => p.id);
		expect(ids).toContain("p1");
		expect(ids).toContain("p2");
	});

	it("should filter products based on stock levels", async () => {
		const mockCollection = {
			id: "c7",
			slug: "in-stock-only",
			type: "automated",
			rules: {
				logicalOperator: "AND",
				rules: [{ id: "r1", field: "stock", operator: "gt", value: 5 }],
			},
		};
		const mockProducts = [
			{ id: "p1", name: "High Stock", variants: [{ stock: 10 }] },
			{ id: "p2", name: "Low Stock", variants: [{ stock: 3 }] },
			{ id: "p3", name: "Out of Stock", variants: [{ stock: 0 }] },
		];

		vi.mocked(db.query.collections.findFirst).mockResolvedValue(mockCollection);
		vi.mocked(db.query.products.findMany).mockResolvedValue(mockProducts);

		const result = await LocalCommerceImplementation.collectionGet({ idOrSlug: "in-stock-only" });

		expect(result.products.data).toHaveLength(1);
		expect(result.products.data[0].id).toBe("p1");
	});

	it("should filter products based on tags (contains)", async () => {
		const mockCollection = {
			id: "c8",
			slug: "summer-gear",
			type: "automated",
			rules: {
				logicalOperator: "AND",
				rules: [{ id: "r1", field: "tag", operator: "contains", value: "summer" }],
			},
		};
		const mockProducts = [
			{ id: "p1", name: "Summer Shirt", tags: ["summer", "casual"] },
			{ id: "p2", name: "Winter Coat", tags: ["winter", "warm"] },
			{ id: "p3", name: "Spring Hat", tags: ["spring", "light"] },
		];

		vi.mocked(db.query.collections.findFirst).mockResolvedValue(mockCollection);
		vi.mocked(db.query.products.findMany).mockResolvedValue(mockProducts);

		const result = await LocalCommerceImplementation.collectionGet({ idOrSlug: "summer-gear" });

		expect(result.products.data).toHaveLength(1);
		expect(result.products.data[0].id).toBe("p1");
	});

	it("should filter products based on creation date (last X days)", async () => {
		const now = new Date();
		const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
		const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();

		const mockCollection = {
			id: "c9",
			slug: "new-arrivals",
			type: "automated",
			rules: {
				logicalOperator: "AND",
				rules: [{ id: "r1", field: "createdAt", operator: "after", value: 10 }], // last 10 days
			},
		};
		const mockProducts = [
			{ id: "p1", name: "New Product", createdAt: fiveDaysAgo, variants: [{ price: "10" }] },
			{ id: "p2", name: "Old Product", createdAt: fifteenDaysAgo, variants: [{ price: "10" }] },
		];

		vi.mocked(db.query.collections.findFirst).mockResolvedValue(mockCollection);
		vi.mocked(db.query.products.findMany).mockResolvedValue(mockProducts);

		const result = await LocalCommerceImplementation.collectionGet({ idOrSlug: "new-arrivals" });

		expect(result.products.data).toHaveLength(1);
		expect(result.products.data[0].id).toBe("p1");
	});
});
