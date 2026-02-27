import { getActiveStoreContext } from "@/lib/auth";
import { getTenantDb } from "@/lib/db";
import { ProductForm } from "../product-form";

async function ProductData() {
	const _storeId = await getActiveStoreContext();
	if (!_storeId) throw new Error("No active store");
	const db = await getTenantDb(_storeId);
	const categories = await db.query.categories.findMany();
	const allCollections = await db.query.collections.findMany();

	return {
		categories,
		collections: allCollections,
	};
}

export default async function NewProductPage() {
	const { categories, collections } = await ProductData();

	return (
		<ProductForm
			title="AJOUTER UN PRODUIT"
			description="Créez un nouveau produit dans votre catalogue."
			categories={categories}
			collections={collections}
		/>
	);
}
