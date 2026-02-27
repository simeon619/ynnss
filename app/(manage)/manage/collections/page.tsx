import { FolderOpen, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardLayout, DashboardMain } from "@/components/dashboard/dashboard-layout";
import { getActiveStoreContext } from "@/lib/auth";
import { getTenantDb } from "@/lib/db";
import { deleteCollection } from "../actions";

export default async function CollectionsPage() {
	const _storeId = await getActiveStoreContext();
	if (!_storeId) throw new Error("No active store");
	const db = await getTenantDb(_storeId);
	const allCollections = await db.query.collections.findMany(); // Removed with: { parent: true }

	return (
		<DashboardLayout>
			<DashboardMain>
				<DashboardHeader
					title="Collections"
					description="Gérez vos thématiques (Soldes, Nouveautés, etc...)."
				>
					<Link
						href="/manage/collections/new"
						className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium h-9 px-4 py-2 border-2 border-black bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
					>
						<Plus size={16} />
						<span className="font-bold uppercase tracking-widest text-xs">CRÉER COLLECTION</span>
					</Link>
				</DashboardHeader>

				<div className="border-2 border-black bg-white overflow-x-auto mt-6">
					<table className="w-full text-left border-collapse whitespace-nowrap">
						<thead>
							<tr className="border-b-2 border-black bg-black text-white uppercase text-[10px] tracking-widest font-bold">
								<th className="p-3 border-r border-black w-[300px]">Nom</th>
								<th className="p-3 border-r border-black">Slug</th>
								<th className="p-3 border-r border-black">Description</th>
								<th className="p-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody>
							{allCollections.length === 0 ? (
								<tr>
									<td colSpan={4} className="h-48 text-center bg-white">
										<div className="flex flex-col items-center justify-center py-16 text-center">
											<div className="w-16 h-16 border-2 border-black flex items-center justify-center mb-4 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
												<FolderOpen size={24} className="text-black" />
											</div>
											<h3 className="text-sm font-black uppercase tracking-widest text-black mb-1">
												Aucune collection
											</h3>
											<p className="text-xs text-black font-mono">
												Créez votre première collection pour regrouper vos articles.
											</p>
										</div>
									</td>
								</tr>
							) : (
								allCollections.map((collection) => (
									<tr
										key={collection.id}
										className="group hover:bg-black hover:text-white border-b border-black text-sm"
									>
										<td className="p-3 border-r border-black font-black text-black">
											<Link
												href={`/manage/collections/${collection.id}`}
												className="hover:underline uppercase tracking-wide"
											>
												{collection.name}
											</Link>
										</td>
										<td className="p-3 border-r border-black">
											<span className="font-mono text-xs tracking-tighter bg-white p-1 px-2 inline-block border-2 border-black">
												{collection.slug}
											</span>
										</td>
										<td className="p-3 border-r border-black text-black font-mono text-xs truncate max-w-[200px]">
											{collection.description || "-"}
										</td>
										<td className="p-3 text-right">
											<form action={deleteCollection.bind(null, collection.id)} className="inline-block">
												<button
													type="submit"
													className="h-8 px-2 flex items-center justify-center text-black border-2 border-black hover:bg-black hover:text-white uppercase tracking-widest text-[10px] font-bold ml-auto"
												>
													<Trash2 size={12} className="mr-1.5" />
													Supprimer
												</button>
											</form>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</DashboardMain>
		</DashboardLayout>
	);
}
