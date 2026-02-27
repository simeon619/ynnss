import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema_tenant";
import { deleteProduct, toggleProductStatus } from "./actions";

// Mock dependencies
vi.mock("@/lib/db", () => {
	const mockDb = {
		delete: vi.fn(() => ({
			where: vi.fn(),
		})),
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: vi.fn(),
			})),
		})),
		insert: vi.fn(() => ({
			values: vi.fn(() => ({
				returning: vi.fn(),
			})),
		})),
		run: vi.fn(),
		query: {
			products: { findMany: vi.fn(), findFirst: vi.fn() },
			orders: { findMany: vi.fn(), findFirst: vi.fn() },
		},
	};
	return {
		getTenantDb: vi.fn().mockResolvedValue(mockDb),
		db: mockDb,
	};
});

vi.mock("@/lib/db/schema_tenant", () => ({
	categories: {},
	collections: {},
	orders: {},
	products: {},
	shippingRates: {},
	shippingZones: {},
	variants: {},
	store_settings: {},
}));

vi.mock("@/lib/auth", () => ({
	verifySession: vi.fn().mockResolvedValue({ role: "MERCHANT", userId: "u1" }),
	getActiveStoreContext: vi.fn().mockResolvedValue("store_test"),
	deleteSession: vi.fn(),
}));

vi.mock("@/lib/category-utils", () => ({
	generateSlug: vi.fn((s) => s.toLowerCase().replace(/ /g, "-")),
	isCircular: vi.fn(() => false),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
}));

describe("manage actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("deleteProduct", () => {
		it("should delete product and revalidate paths", async () => {
			const productId = "prod_123";
			await deleteProduct(productId);

			expect(db.delete).toHaveBeenCalledWith(products);
			expect(revalidatePath).toHaveBeenCalledWith("/manage/products");
			expect(revalidatePath).toHaveBeenCalledWith("/");
		});
	});

	describe("toggleProductStatus", () => {
		it("should update product status and revalidate paths", async () => {
			const productId = "prod_123";
			await toggleProductStatus(productId, "published");

			expect(db.update).toHaveBeenCalledWith(products);
			expect(revalidatePath).toHaveBeenCalledWith("/manage/products");
		});
	});
});
