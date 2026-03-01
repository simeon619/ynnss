import { connection } from "next/server";
import { getActiveStoreContext } from "@/lib/auth";
import { getTenantDb } from "@/lib/db";
import { getStoreById } from "@/lib/storefront";
import { buildStorefrontBasePath } from "@/lib/storefront-paths";
import { getThemeBuilderDataByStoreId } from "@/lib/theme";
import { ThemeStudio } from "../../settings/theme/theme-studio";

export default async function ThemeCustomizePage() {
	await connection();
	const storeId = await getActiveStoreContext();
	if (!storeId) {
		throw new Error("No active store");
	}

	const db = await getTenantDb(storeId);
	const store = await getStoreById(storeId);
	const storefrontHref = buildStorefrontBasePath(store?.slug);
	const collectionOptions = await db.query.collections.findMany({
		columns: {
			id: true,
			name: true,
			slug: true,
		},
		orderBy: (table, { asc }) => [asc(table.name)],
	});
	const categoryOptions = await db.query.categories.findMany({
		columns: {
			id: true,
			name: true,
			slug: true,
		},
		orderBy: (table, { asc }) => [asc(table.name)],
	});
	const previewProducts = await db.query.products.findMany({
		columns: {
			id: true,
			name: true,
			slug: true,
			images: true,
			badgeText: true,
			badgeColor: true,
		},
		orderBy: (table, { desc }) => [desc(table.updatedAt)],
		limit: 24,
		with: {
			variants: {
				columns: {
					price: true,
					images: true,
				},
			},
		},
	});
	const collectionProductLinks = await db.query.collectionProducts.findMany({
		columns: {
			collectionId: true,
			productId: true,
			sortOrder: true,
		},
		orderBy: (table, { asc }) => [asc(table.collectionId), asc(table.sortOrder)],
	});

	const themeData = await getThemeBuilderDataByStoreId(storeId);
	return (
		<ThemeStudio
			initialData={themeData}
			collectionOptions={collectionOptions}
			categoryOptions={categoryOptions}
			previewProducts={previewProducts}
			collectionProductLinks={collectionProductLinks}
			storefrontHref={storefrontHref || "/"}
		/>
	);
}
