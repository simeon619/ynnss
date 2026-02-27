import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getActiveStoreContext } from "@/lib/auth";
import { getTenantDb } from "@/lib/db";
import { collections } from "@/lib/db/schema_tenant";
import { getCollectionProducts } from "../../actions";
import { CollectionForm } from "../collection-form";

async function CollectionData({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
	const _storeId = await getActiveStoreContext();
	if (!_storeId) throw new Error("No active store");
	const db = await getTenantDb(_storeId);
	const { id } = await paramsPromise;
	const collection = await db.query.collections.findFirst({
		where: eq(collections.id, id),
	});

	if (!collection) {
		notFound();
	}

	const initialProducts = await getCollectionProducts(collection.slug);

	return <CollectionForm collection={collection} initialProducts={initialProducts} />;
}

export default function EditCollectionPage(props: { params: Promise<{ id: string }> }) {
	return (
		<div className="grid grid-cols-9 gap-6">
			<div className="col-span-6 space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Edit Collection</h1>
					<p className="text-gray-500">Update collection details.</p>
				</div>

				<Suspense fallback={<div>Loading collection form...</div>}>
					<CollectionData paramsPromise={props.params} />
				</Suspense>
			</div>
		</div>
	);
}
