import { beforeEach, describe, expect, test, vi } from "vitest";
import { adjustVariantStock } from "./actions";

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
	getActiveStoreContext: vi.fn().mockResolvedValue("store_test"),
}));

const { mockReturning, mockWhere, mockSet, mockUpdate } = vi.hoisted(() => {
	const mockReturning = vi.fn();
	const mockWhere = vi.fn(() => ({ returning: mockReturning }));
	const mockSet = vi.fn(() => ({ where: mockWhere }));
	const mockUpdate = vi.fn(() => ({ set: mockSet }));
	return { mockReturning, mockWhere, mockSet, mockUpdate };
});

vi.mock("@/lib/db", () => ({
	getTenantDb: vi.fn().mockResolvedValue({
		update: mockUpdate,
	}),
}));

vi.mock("@/lib/db/schema_tenant", () => ({
	variants: { id: "variants_table", stock: "stock_col" },
}));

describe("Inventory Actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockReturning.mockReset();
		mockWhere.mockReturnValue({ returning: mockReturning });
		mockSet.mockReturnValue({ where: mockWhere });
		mockUpdate.mockReturnValue({ set: mockSet });
	});

	test("adjustVariantStock correctly incrementally updates stock", async () => {
		mockReturning.mockResolvedValue([{ stock: 60 }]);

		const result = await adjustVariantStock("var_123", 10);

		expect(result.success).toBe(true);
		expect(result.newStock).toBe(60);
		expect(mockUpdate).toHaveBeenCalled();
	});

	test("adjustVariantStock correctly decrementally updates stock", async () => {
		mockReturning.mockResolvedValue([{ stock: -40 }]);

		const result = await adjustVariantStock("var_123", -100);

		expect(result.success).toBe(true);
		expect(result.newStock).toBe(-40);
	});

	test("adjustVariantStock handles invalid variant gracefully", async () => {
		mockReturning.mockResolvedValue([]);

		const result = await adjustVariantStock("invalid-id", 10);

		expect(result.success).toBe(false);
		expect(result.error).toBe("Variant not found");
	});
});
