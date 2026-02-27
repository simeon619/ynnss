import { connection } from "next/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getActiveStoreContext } from "@/lib/auth";
import { getTenantDb } from "@/lib/db";
import { StorefrontSettingsForm } from "./storefront-settings-form";

export default async function StorefrontSettingsPage() {
	await connection();
	const storeId = await getActiveStoreContext();
	if (!storeId) throw new Error("No active store");

	const db = await getTenantDb(storeId);
	const settings = await db.query.storeSettings.findFirst();

	if (!settings) throw new Error("Store settings not found");

	return (
		<div className="space-y-6 pb-12">
			<DashboardHeader
				title="VITRINE (STOREFRONT)"
				description="Personnalisez l'apparence de votre boutique publique: la bannière, les textes d'accueil et les produits mis en avant."
			/>

			<StorefrontSettingsForm initialSettings={settings} />
		</div>
	);
}
