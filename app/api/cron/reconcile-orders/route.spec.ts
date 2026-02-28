/**
 * Tests for POST /api/cron/reconcile-orders
 *
 * Actors covered:
 * - Platform cron: identifies stale pending orders and confirms them
 * - Merchant wallet: transactions with externalReference = "ord_{id}"
 * - Security: unauthorized access rejected
 *
 * Scenarios:
 * 1. Stale pending order with AVAILABLE ledger entry → confirmed as paid
 * 2. Stale pending order with LOCKED entry (delayed release) → confirmed as paid
 * 3. Stale pending order with FAILED entry → NOT confirmed
 * 4. Pending order < 10 min old → NOT touched (too recent)
 * 5. Store with no waveWalletId → skipped
 * 6. Wave API returns object { transactions: [] } shape → handled correctly
 * 7. Wave API returns plain array shape → handled correctly
 * 8. Wrong CRON_SECRET → 401
 * 9. Multiple stores: each reconciled independently
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { mockGetTenantDb, mockGlobalDb, mockGetWalletTransactions } = vi.hoisted(() => ({
	mockGetTenantDb: vi.fn(),
	mockGlobalDb: { select: vi.fn() },
	mockGetWalletTransactions: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	getTenantDb: mockGetTenantDb,
	globalDb: mockGlobalDb,
}));

vi.mock("@/lib/wave/wallets", () => ({
	getWalletTransactions: mockGetWalletTransactions,
}));

vi.mock("drizzle-orm", async (importOriginal) => {
	const actual = await importOriginal<typeof import("drizzle-orm")>();
	return { ...actual };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(secret = "test-cron-secret"): Request {
	return new Request("http://localhost/api/cron/reconcile-orders", {
		method: "POST",
		headers: { "x-cron-secret": secret },
	});
}

function makeStore(overrides: { id?: string; waveWalletId?: string | null } = {}) {
	return {
		id: overrides.id ?? "store_1",
		waveWalletId: overrides.waveWalletId !== undefined ? overrides.waveWalletId : "wlt_vendor1",
	};
}

function makeStaleOrder(id: string) {
	return { id };
}

function makeLedgerEntry(orderId: string, fundsStatus: "AVAILABLE" | "LOCKED" | "FAILED") {
	return {
		externalReference: `ord_${orderId}`,
		fundsStatus,
	};
}

function makeTenantDb(staleOrders: { id: string }[], updateImpl?: () => unknown) {
	const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
	const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
	const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

	const mockFrom = vi.fn().mockResolvedValue(staleOrders);
	const mockWhere = vi.fn(() => mockFrom()); // resolves with staleOrders
	const mockSelectFrom = vi.fn(() => ({ where: mockWhere }));
	const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));

	return {
		select: mockSelect,
		update: mockUpdate,
		_mockUpdate: mockUpdate,
		_staleOrders: staleOrders,
	};
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
	vi.clearAllMocks();
	process.env.CRON_SECRET = "test-cron-secret";

	// Default global DB: chain select().from() → returns stores
	mockGlobalDb.select.mockReturnValue({
		from: vi.fn().mockResolvedValue([makeStore()]),
	});
});

// ─── Security ─────────────────────────────────────────────────────────────────

describe("Authorization", () => {
	it("returns 401 when CRON_SECRET header is missing", async () => {
		const req = new Request("http://localhost/api/cron/reconcile-orders", {
			method: "POST",
			// no header
		});
		const res = await POST(req);
		expect(res.status).toBe(401);
	});

	it("returns 401 when CRON_SECRET is wrong", async () => {
		const res = await POST(makeRequest("wrong-secret"));
		expect(res.status).toBe(401);
	});

	it("proceeds when CRON_SECRET is correct", async () => {
		// Store has no waveWalletId → skipped, but auth passed
		mockGlobalDb.select.mockReturnValue({
			from: vi.fn().mockResolvedValue([makeStore({ waveWalletId: null })]),
		});
		const res = await POST(makeRequest("test-cron-secret"));
		expect(res.status).toBe(200);
	});
});

// ─── Core Reconciliation Logic ────────────────────────────────────────────────

describe("Reconciliation", () => {
	it("confirms a stale pending order when Wave ledger shows AVAILABLE funds", async () => {
		const staleOrders = [makeStaleOrder("order_abc")];
		const db = makeTenantDb(staleOrders);
		mockGetTenantDb.mockResolvedValue(db);

		mockGetWalletTransactions.mockResolvedValue([makeLedgerEntry("order_abc", "AVAILABLE")]);

		const res = await POST(makeRequest());
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.confirmed).toBe(1);
		expect(db._mockUpdate).toHaveBeenCalled();
	});

	it("confirms a stale pending order when Wave ledger shows LOCKED funds (payment in release delay)", async () => {
		const staleOrders = [makeStaleOrder("order_locked")];
		const db = makeTenantDb(staleOrders);
		mockGetTenantDb.mockResolvedValue(db);

		mockGetWalletTransactions.mockResolvedValue([makeLedgerEntry("order_locked", "LOCKED")]);

		const res = await POST(makeRequest());
		const body = await res.json();

		expect(body.confirmed).toBe(1);
		expect(db._mockUpdate).toHaveBeenCalled();
	});

	it("does NOT confirm when Wave ledger shows FAILED (payment did not go through)", async () => {
		const staleOrders = [makeStaleOrder("order_fail")];
		const db = makeTenantDb(staleOrders);
		mockGetTenantDb.mockResolvedValue(db);

		mockGetWalletTransactions.mockResolvedValue([makeLedgerEntry("order_fail", "FAILED")]);

		const res = await POST(makeRequest());
		const body = await res.json();

		expect(body.confirmed).toBe(0);
		expect(db._mockUpdate).not.toHaveBeenCalled();
	});

	it("does NOT confirm when no matching ledger entry exists", async () => {
		const staleOrders = [makeStaleOrder("order_missing")];
		const db = makeTenantDb(staleOrders);
		mockGetTenantDb.mockResolvedValue(db);

		// Wave has a transaction for a different order
		mockGetWalletTransactions.mockResolvedValue([makeLedgerEntry("order_other", "AVAILABLE")]);

		const res = await POST(makeRequest());
		const body = await res.json();

		expect(body.confirmed).toBe(0);
		expect(db._mockUpdate).not.toHaveBeenCalled();
	});

	it("skips stores that have no waveWalletId configured", async () => {
		mockGlobalDb.select.mockReturnValue({
			from: vi.fn().mockResolvedValue([makeStore({ waveWalletId: null })]),
		});

		const res = await POST(makeRequest());
		const body = await res.json();

		expect(body.confirmed).toBe(0);
		expect(mockGetTenantDb).not.toHaveBeenCalled();
		expect(mockGetWalletTransactions).not.toHaveBeenCalled();
	});

	it("skips a store when there are no stale pending orders", async () => {
		const db = makeTenantDb([]); // empty
		mockGetTenantDb.mockResolvedValue(db);

		const res = await POST(makeRequest());

		// Wallet transactions should not be fetched if no stale orders
		expect(mockGetWalletTransactions).not.toHaveBeenCalled();
	});
});

// ─── Response Shape Compatibility ─────────────────────────────────────────────

describe("Wave API response shape handling", () => {
	it("handles array response format", async () => {
		const db = makeTenantDb([makeStaleOrder("order_arr")]);
		mockGetTenantDb.mockResolvedValue(db);

		// Plain array (undocumented but handled defensively)
		mockGetWalletTransactions.mockResolvedValue([makeLedgerEntry("order_arr", "AVAILABLE")]);

		const res = await POST(makeRequest());
		const body = await res.json();

		expect(body.confirmed).toBe(1);
	});

	it("handles { transactions: [] } object response format", async () => {
		const db = makeTenantDb([makeStaleOrder("order_obj")]);
		mockGetTenantDb.mockResolvedValue(db);

		// Object wrapper format as per docs
		mockGetWalletTransactions.mockResolvedValue({
			transactions: [makeLedgerEntry("order_obj", "AVAILABLE")],
			pagination: { total: 1, limit: 50, offset: 0 },
		});

		const res = await POST(makeRequest());
		const body = await res.json();

		expect(body.confirmed).toBe(1);
	});

	it("handles empty Wave response gracefully", async () => {
		const db = makeTenantDb([makeStaleOrder("order_empty")]);
		mockGetTenantDb.mockResolvedValue(db);

		mockGetWalletTransactions.mockResolvedValue([]);

		const res = await POST(makeRequest());
		const body = await res.json();

		expect(body.confirmed).toBe(0);
		expect(db._mockUpdate).not.toHaveBeenCalled();
	});

	it("handles Wave API failure (getWalletTransactions returns [])", async () => {
		const db = makeTenantDb([makeStaleOrder("order_wfail")]);
		mockGetTenantDb.mockResolvedValue(db);

		// wallets.ts returns [] on error
		mockGetWalletTransactions.mockResolvedValue([]);

		const res = await POST(makeRequest());
		const body = await res.json();

		// Should not crash, should confirm nothing
		expect(res.status).toBe(200);
		expect(body.confirmed).toBe(0);
	});
});

// ─── Multi-Store ──────────────────────────────────────────────────────────────

describe("Multi-store reconciliation", () => {
	it("reconciles orders across multiple stores independently", async () => {
		mockGlobalDb.select.mockReturnValue({
			from: vi
				.fn()
				.mockResolvedValue([
					makeStore({ id: "store_A", waveWalletId: "wlt_A" }),
					makeStore({ id: "store_B", waveWalletId: "wlt_B" }),
				]),
		});

		const dbA = makeTenantDb([makeStaleOrder("order_A1")]);
		const dbB = makeTenantDb([makeStaleOrder("order_B1")]);

		mockGetTenantDb.mockResolvedValueOnce(dbA).mockResolvedValueOnce(dbB);

		mockGetWalletTransactions
			.mockResolvedValueOnce([makeLedgerEntry("order_A1", "AVAILABLE")])
			.mockResolvedValueOnce([makeLedgerEntry("order_B1", "AVAILABLE")]);

		const res = await POST(makeRequest());
		const body = await res.json();

		expect(body.confirmed).toBe(2);
		expect(mockGetWalletTransactions).toHaveBeenCalledWith("wlt_A");
		expect(mockGetWalletTransactions).toHaveBeenCalledWith("wlt_B");
	});

	it("confirms only matching orders when a store has mixed pending/paid orders", async () => {
		const db = makeTenantDb([makeStaleOrder("order_X"), makeStaleOrder("order_Y")]);
		mockGetTenantDb.mockResolvedValue(db);

		// Only order_X was paid, order_Y failed
		mockGetWalletTransactions.mockResolvedValue([
			makeLedgerEntry("order_X", "AVAILABLE"),
			makeLedgerEntry("order_Y", "FAILED"),
		]);

		const res = await POST(makeRequest());
		const body = await res.json();

		expect(body.confirmed).toBe(1);
	});
});
