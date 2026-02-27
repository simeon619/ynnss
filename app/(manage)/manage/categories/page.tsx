import { count, eq } from "drizzle-orm";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardLayout, DashboardMain } from "@/components/dashboard/dashboard-layout";
import { getActiveStoreContext } from "@/lib/auth";
import { getTenantDb } from "@/lib/db";
import { categories, products } from "@/lib/db/schema_tenant";
import { SortableCategoryTree } from "./sortable-category-tree";

export default async function CategoriesPage() {
	const _storeId = await getActiveStoreContext();
	if (!_storeId) throw new Error("No active store");
	const db = await getTenantDb(_storeId);
	const allCategories = await (await getTenantDb((await getActiveStoreContext())!))
		.select({
			id: categories.id,
			name: categories.name,
			slug: categories.slug,
			parentId: categories.parentId,
			image: categories.image,
			sortOrder: categories.sortOrder,
			status: categories.status,
			productCount: count(products.id),
		})
		.from(categories)
		.leftJoin(products, eq(categories.id, products.categoryId))
		.groupBy(categories.id)
		.orderBy(categories.sortOrder);

	// Cast to simpler type for the client component
	const serializableCategories = allCategories.map((c) => ({
		id: c.id,
		name: c.name,
		slug: c.slug,
		parentId: c.parentId,
		image: c.image,
		sortOrder: c.sortOrder ?? 0,
		status: (c.status as "active" | "inactive") ?? "active",
		productCount: c.productCount as number,
	}));

	return (
		<DashboardLayout>
			<DashboardMain className="col-span-8">
				<DashboardHeader
					title="Catégories"
					description="Gérez la hiérarchie de vos produits en faisant glisser les éléments pour les imbriquer ou les réorganiser."
				>
					<Link
						href="/manage/categories/new"
						className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium h-9 px-4 py-2 border-2 border-black bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
					>
						<Plus size={16} />
						<span className="font-bold uppercase tracking-widest text-xs">Ajouter une catégorie</span>
					</Link>
				</DashboardHeader>

				<div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 border-b-2 border-black pb-3 mb-6">
					<div className="relative w-full sm:w-[350px]">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={14} />
						<input
							type="text"
							placeholder="Rechercher une catégorie..."
							className="w-full pl-9 pr-3 py-1.5 border-2 border-black focus:outline-none font-mono text-sm bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
						/>
					</div>
				</div>

				<SortableCategoryTree categories={serializableCategories} />
			</DashboardMain>
		</DashboardLayout>
	);
}
