import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardLayout, DashboardMain } from "@/components/dashboard/dashboard-layout";
import { getActiveStoreContext } from "@/lib/auth";
import { getTenantDb } from "@/lib/db";
import { ProductsTable } from "./products-table";
import type { ProductWithRelations } from "./types";

export default async function ProductsPage() {
	const _storeId = await getActiveStoreContext();
	if (!_storeId) throw new Error("No active store");
	const db = await getTenantDb(_storeId);
	const allProducts = await db.query.products.findMany({
		with: {
			variants: true,
			category: true,
		},
	});

	const allCategories = await db.query.categories.findMany({
		orderBy: (categories, { asc }) => [asc(categories.name)],
	});

	return (
		<DashboardLayout>
			<DashboardMain>
				<DashboardHeader title="Products" description="Manage your sports apparel catalog and inventory." />
				<ProductsTable
					products={allProducts as unknown as ProductWithRelations[]}
					categories={allCategories}
				/>
			</DashboardMain>
		</DashboardLayout>
	);
}
