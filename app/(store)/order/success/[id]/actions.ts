"use server";

import { eq } from "drizzle-orm";
import { getTenantDb } from "@/lib/db";
import { orders } from "@/lib/db/schema_tenant";

export async function confirmOrderPaymentAction(orderId: string, storeId: string) {
	if (!orderId || !storeId) return;

	const db = await getTenantDb(storeId);
	const order = await db.query.orders.findFirst({
		where: eq(orders.id, orderId),
	});

	if (!order || order.status !== "pending") return;

	await db.update(orders).set({ status: "paid" }).where(eq(orders.id, orderId));

	console.log(`[Order] Confirmed payment for order ${orderId} (store: ${storeId})`);
}
