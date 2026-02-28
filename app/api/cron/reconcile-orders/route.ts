import { and, eq, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTenantDb, globalDb } from "@/lib/db";
import { stores } from "@/lib/db/schema_global";
import { orders } from "@/lib/db/schema_tenant";
import { getWalletTransactions } from "@/lib/wave/wallets";

// Orders older than 10 minutes that are still pending
const STALE_THRESHOLD_MS = 10 * 60 * 1000;

type LedgerEntry = {
	externalReference: string | null;
	fundsStatus: string;
};

export async function POST(req: Request) {
	const secret = req.headers.get("x-cron-secret");
	if (secret !== process.env.CRON_SECRET) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const allStores = await globalDb.select().from(stores);
		const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);
		let totalConfirmed = 0;

		for (const store of allStores) {
			if (!store.waveWalletId) continue;

			const db = await getTenantDb(store.id);

			const staleOrders = await db
				.select({ id: orders.id })
				.from(orders)
				.where(
					and(eq(orders.status, "pending"), eq(orders.paymentMethod, "WAVE"), lt(orders.createdAt, cutoff)),
				);

			if (staleOrders.length === 0) continue;

			// Build set of paid order IDs from external references in the ledger
			// Each ledger entry has externalReference = "ord_{orderId}"
			const ledgerData = await getWalletTransactions(store.waveWalletId);
			const entries: LedgerEntry[] = Array.isArray(ledgerData)
				? ledgerData
				: (ledgerData?.transactions ?? []);

			const paidOrderIds = new Set<string>(
				entries
					.filter((e) => e.fundsStatus === "AVAILABLE" || e.fundsStatus === "LOCKED")
					.map((e) => e.externalReference?.replace(/^ord_/, "") ?? "")
					.filter(Boolean),
			);

			for (const order of staleOrders) {
				if (!paidOrderIds.has(order.id)) continue;

				await db.update(orders).set({ status: "paid" }).where(eq(orders.id, order.id));

				console.log(`[Cron] Reconciled order ${order.id} → paid (store: ${store.id})`);
				totalConfirmed++;
			}
		}

		return NextResponse.json({ success: true, confirmed: totalConfirmed });
	} catch (error) {
		console.error("[Cron] reconcile-orders error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
