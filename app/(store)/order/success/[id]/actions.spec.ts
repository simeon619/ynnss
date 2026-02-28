/**
 * Tests for confirmOrderPaymentAction.
 *
 * Scenarios:
 * - Customer lands on success page after Wave payment → order confirmed
 * - Order already paid → no double-write
 * - Order does not exist → silent no-op (prevents URL fishing)
 * - Order exists but is cancelled/shipped → untouched
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { confirmOrderPaymentAction } from "./actions";

const { mockGetTenantDb } = vi.hoisted(() => ({
	mockGetTenantDb: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	getTenantDb: mockGetTenantDb,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockDb(order: { id: string; status: string } | null) {
	const mockUpdate = vi.fn(() => ({
		set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
	}));

	const db = {
		query: {
			orders: {
				findFirst: vi.fn().mockResolvedValue(order),
			},
		},
		update: mockUpdate,
	};

	return { db, mockUpdate };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("confirmOrderPaymentAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("marks a pending order as paid when customer lands on success page", async () => {
		const { db, mockUpdate } = makeMockDb({ id: "order_1", status: "pending" });
		mockGetTenantDb.mockResolvedValue(db);

		await confirmOrderPaymentAction("order_1", "store_1");

		expect(mockUpdate).toHaveBeenCalled();
	});

	it("does NOT update an already-paid order (idempotent)", async () => {
		const { db, mockUpdate } = makeMockDb({ id: "order_1", status: "paid" });
		mockGetTenantDb.mockResolvedValue(db);

		await confirmOrderPaymentAction("order_1", "store_1");

		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it("does nothing if the order does not exist (prevents fake URL confirmation)", async () => {
		const { db, mockUpdate } = makeMockDb(null);
		mockGetTenantDb.mockResolvedValue(db);

		await confirmOrderPaymentAction("order_fake", "store_1");

		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it("does not touch a shipped order", async () => {
		const { db, mockUpdate } = makeMockDb({ id: "order_1", status: "shipped" });
		mockGetTenantDb.mockResolvedValue(db);

		await confirmOrderPaymentAction("order_1", "store_1");

		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it("does not touch a cancelled order", async () => {
		const { db, mockUpdate } = makeMockDb({ id: "order_1", status: "cancelled" });
		mockGetTenantDb.mockResolvedValue(db);

		await confirmOrderPaymentAction("order_1", "store_1");

		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it("returns early if orderId is empty (guard against bad params)", async () => {
		const { db, mockUpdate } = makeMockDb(null);
		mockGetTenantDb.mockResolvedValue(db);

		await confirmOrderPaymentAction("", "store_1");

		// getTenantDb should not even be called
		expect(mockGetTenantDb).not.toHaveBeenCalled();
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it("returns early if storeId is empty", async () => {
		const { db, mockUpdate } = makeMockDb(null);
		mockGetTenantDb.mockResolvedValue(db);

		await confirmOrderPaymentAction("order_1", "");

		expect(mockGetTenantDb).not.toHaveBeenCalled();
		expect(mockUpdate).not.toHaveBeenCalled();
	});
});
