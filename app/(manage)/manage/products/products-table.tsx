"use client";

import {
	CheckSquare,
	ChevronLeft,
	ChevronRight,
	ExternalLink,
	Eye,
	EyeOff,
	Filter,
	MoreHorizontal,
	Package,
	Plus,
	Search,
	Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { bulkDeleteProducts, bulkUpdateProductStatus } from "../actions";
import { ProductDetailsSidebar } from "./product-details-sidebar";
import type { ProductWithRelations } from "./types";

interface ProductsTableProps {
	products: ProductWithRelations[];
	categories: { id: string; name: string }[];
}

export function ProductsTable({ products, categories }: ProductsTableProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string | null>(null);
	const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
	const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(null);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isPending, startTransition] = useTransition();

	const itemsPerPage = 10;

	const filteredProducts = products.filter((product) => {
		const matchesSearch =
			product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			product.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
			product.category?.name.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesStatus = statusFilter ? product.status === statusFilter : true;
		const matchesCategory = categoryFilter ? product.categoryId === categoryFilter : true;

		return matchesSearch && matchesStatus && matchesCategory;
	});

	// Pagination Logic
	const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

	// Reset pagination when filters change
	if (currentPage > totalPages && totalPages > 0) {
		setCurrentPage(1);
	}

	const handleRowClick = (product: ProductWithRelations) => {
		setSelectedProduct(product);
		setIsSidebarOpen(true);
	};

	const handleNext = () => {
		if (!selectedProduct) return;
		const currentIndex = filteredProducts.findIndex((p) => p.id === selectedProduct.id);
		const nextIndex = (currentIndex + 1) % filteredProducts.length;
		setSelectedProduct(filteredProducts[nextIndex]);
	};

	const handlePrevious = () => {
		if (!selectedProduct) return;
		const currentIndex = filteredProducts.findIndex((p) => p.id === selectedProduct.id);
		const previousIndex = (currentIndex - 1 + filteredProducts.length) % filteredProducts.length;
		setSelectedProduct(filteredProducts[previousIndex]);
	};

	// Checkbox Selection Logic
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedIds(new Set(paginatedProducts.map((p) => p.id)));
		} else {
			setSelectedIds(new Set());
		}
	};

	const handleSelectOne = (id: string, checked: boolean) => {
		const newSelected = new Set(selectedIds);
		if (checked) {
			newSelected.add(id);
		} else {
			newSelected.delete(id);
		}
		setSelectedIds(newSelected);
	};

	const isAllSelected = paginatedProducts.length > 0 && selectedIds.size === paginatedProducts.length;

	// Bulk Actions
	const handleBulkStatusChange = (status: "published" | "draft" | "hidden") => {
		if (selectedIds.size === 0) return;
		startTransition(async () => {
			try {
				await bulkUpdateProductStatus(Array.from(selectedIds), status);
				toast.success(`Statut mis à jour pour ${selectedIds.size} produit(s)`);
				setSelectedIds(new Set());
			} catch (e) {
				toast.error("Erreur lors de la mise à jour");
			}
		});
	};

	const handleBulkDelete = () => {
		if (selectedIds.size === 0) return;
		if (!confirm(`T'es sûr de vouloir supprimer ${selectedIds.size} produit(s) ?`)) return;
		startTransition(async () => {
			try {
				await bulkDeleteProducts(Array.from(selectedIds));
				toast.success(`${selectedIds.size} produit(s) supprimé(s)`);
				setSelectedIds(new Set());
			} catch (e) {
				toast.error("Erreur lors de la suppression");
			}
		});
	};

	return (
		<div className="flex flex-col gap-6 h-full relative">
			{/* BULK ACTION BAR (Floating Brutalist style) */}
			{selectedIds.size > 0 && (
				<div className="absolute left-1/2 -translate-x-1/2 top-4 z-50 bg-black border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] rounded-none px-4 py-2 flex items-center gap-4 ">
					<span className="text-white text-sm font-bold uppercase tracking-widest pl-2 font-mono">
						{selectedIds.size} sélectionné(s)
					</span>
					<div className="w-px h-4 bg-white/20 mx-1"></div>
					<button
						type="button"
						onClick={() => handleBulkStatusChange("published")}
						disabled={isPending}
						className="text-white hover:underline flex items-center text-xs font-bold uppercase tracking-widest"
					>
						<Eye size={14} className="mr-2" /> Publier
					</button>
					<button
						type="button"
						onClick={() => handleBulkStatusChange("hidden")}
						disabled={isPending}
						className="text-white hover:underline flex items-center text-xs font-bold uppercase tracking-widest"
					>
						<EyeOff size={14} className="mr-2" /> Cacher
					</button>
					<button
						type="button"
						onClick={() => handleBulkStatusChange("draft")}
						disabled={isPending}
						className="text-white hover:underline flex items-center text-xs font-bold uppercase tracking-widest"
					>
						<CheckSquare size={14} className="mr-2" /> Brouillon
					</button>
					<div className="w-px h-4 bg-white/20 mx-1"></div>
					<button
						type="button"
						onClick={handleBulkDelete}
						disabled={isPending}
						className="text-white hover:underline flex items-center text-xs font-bold uppercase tracking-widest"
					>
						<Trash2 size={14} className="mr-2" /> Supprimer
					</button>
				</div>
			)}

			<div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 border-b-2 border-black pb-3">
				<div className="flex flex-wrap items-center gap-2 flex-1 w-full lg:max-w-2xl">
					<div className="relative w-full sm:w-[250px] shrink-0">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={14} />
						<input
							type="text"
							placeholder="Rechercher..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-9 pr-3 py-1.5 border-2 border-black focus:outline-none font-mono text-sm bg-white"
						/>
					</div>

					{/* Status Filter */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="flex items-center gap-2 px-3 py-1.5 border-2 border-black bg-white hover:bg-black hover:text-white text-xs font-bold uppercase tracking-widest"
							>
								<Filter size={14} className="text-black" />
								<span>Statut</span>
								{statusFilter && <span className="ml-1 bg-black text-white px-1.5 py-0">{statusFilter}</span>}
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="start"
							className="w-48 rounded-none border-black font-mono text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
						>
							<DropdownMenuCheckboxItem
								checked={statusFilter === null}
								onCheckedChange={() => setStatusFilter(null)}
								className="rounded-none cursor-pointer"
							>
								Tous les statuts
							</DropdownMenuCheckboxItem>
							<DropdownMenuCheckboxItem
								checked={statusFilter === "published"}
								onCheckedChange={() => setStatusFilter("published")}
								className="rounded-none cursor-pointer"
							>
								Publiés
							</DropdownMenuCheckboxItem>
							<DropdownMenuCheckboxItem
								checked={statusFilter === "draft"}
								onCheckedChange={() => setStatusFilter("draft")}
								className="rounded-none cursor-pointer"
							>
								Brouillons
							</DropdownMenuCheckboxItem>
							<DropdownMenuCheckboxItem
								checked={statusFilter === "hidden"}
								onCheckedChange={() => setStatusFilter("hidden")}
								className="rounded-none cursor-pointer"
							>
								Cachés
							</DropdownMenuCheckboxItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Category Filter */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="flex items-center gap-2 px-3 py-1.5 border-2 border-black bg-white hover:bg-black hover:text-white text-xs font-bold uppercase tracking-widest"
							>
								<Filter size={14} className="text-black" />
								<span>Catégorie</span>
								{categoryFilter && (
									<span className="ml-1 bg-black text-white px-1.5 py-0 truncate max-w-[80px]">
										{categories.find((c) => c.id === categoryFilter)?.name || "Sélectionné"}
									</span>
								)}
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="start"
							className="w-48 max-h-[300px] overflow-y-auto rounded-none border-black font-mono text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
						>
							<DropdownMenuCheckboxItem
								checked={categoryFilter === null}
								onCheckedChange={() => setCategoryFilter(null)}
								className="rounded-none cursor-pointer"
							>
								Toutes les catégories
							</DropdownMenuCheckboxItem>
							{categories.map((c) => (
								<DropdownMenuCheckboxItem
									key={c.id}
									checked={categoryFilter === c.id}
									onCheckedChange={() => setCategoryFilter(c.id)}
									className="rounded-none cursor-pointer"
								>
									{c.name}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<Button asChild className="gap-2 shrink-0 rounded-none border-2 border-black">
					<Link href="/manage/products/new">
						<Plus size={16} />
						<span className="font-bold uppercase tracking-widest text-xs">Ajouter</span>
					</Link>
				</Button>
			</div>

			<div className="border-2 border-black bg-white overflow-x-auto">
				{paginatedProducts.length === 0 ? (
					<div className="py-16 flex flex-col items-center justify-center text-center">
						<div className="w-16 h-16 border border-black flex items-center justify-center mb-4 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
							<Package className="h-6 w-6 text-black" />
						</div>
						<h3 className="text-sm font-black uppercase tracking-widest text-black mb-1">
							Aucun produit trouvé
						</h3>
						<p className="text-xs text-black font-mono">
							Modifiez vos filtres ou effectuez une nouvelle recherche.
						</p>
					</div>
				) : (
					<table className="w-full text-left border-collapse whitespace-nowrap">
						<thead>
							<tr className="border-b border-black bg-black text-white uppercase text-[10px] tracking-widest font-bold">
								<th className="p-3 w-10 border-r border-black text-center">
									<input
										type="checkbox"
										checked={isAllSelected}
										onChange={(e) => handleSelectAll(e.target.checked)}
										aria-label="Tout sélectionner"
										className="w-3.5 h-3.5 border border-black rounded-none checked:bg-black focus:ring-black accent-black"
									/>
								</th>
								<th className="p-3 w-16 border-r border-black text-center">Img</th>
								<th className="p-3 border-r border-black">Produit</th>
								<th className="p-3 border-r border-black">Catégorie</th>
								<th className="p-3 border-r border-black">Statut</th>
								<th className="p-3 border-r border-black">Inventaire</th>
								<th className="p-3 border-r border-black text-right">Prix min.</th>
								<th className="p-3 border-r border-black text-right">Marge</th>
								<th className="w-20 p-3 text-center"></th>
							</tr>
						</thead>
						<tbody>
							{paginatedProducts.map((product) => {
								const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
								const minPrice =
									product.variants.length > 0 ? Math.min(...product.variants.map((v) => Number(v.price))) : 0;
								const minCostPrice =
									product.variants.length > 0
										? Math.min(...product.variants.map((v) => Number(v.costPrice || 0)))
										: 0;
								const marginPercent =
									minPrice > 0 && minCostPrice > 0 ? ((minPrice - minCostPrice) / minPrice) * 100 : null;

								const isSelected = selectedIds.has(product.id);

								return (
									<tr
										key={product.id}
										className={cn(
											"group cursor-pointer hover:bg-neutral-100 border-b border-black text-sm",
											isSelected && "bg-yellow-100",
										)}
										onClick={() => handleRowClick(product)}
									>
										<td
											className="p-3 border-r border-black text-center"
											onClick={(e) => e.stopPropagation()}
										>
											<input
												type="checkbox"
												checked={isSelected}
												onChange={(e) => handleSelectOne(product.id, e.target.checked)}
												className="w-3.5 h-3.5 border border-black rounded-none checked:bg-black focus:ring-black accent-black"
												aria-label={`Sélectionner ${product.name}`}
											/>
										</td>
										<td className="p-3 border-r border-black text-center">
											<div className="w-8 h-8 mx-auto bg-white flex items-center justify-center overflow-hidden border border-black relative">
												{product.images?.[0] ? (
													<Image src={product.images[0]} alt="" fill className="object-cover" />
												) : (
													<Package size={14} className="text-black" />
												)}
											</div>
										</td>
										<td className="p-3 border-r border-black">
											<div className="flex flex-col">
												<span className="font-bold text-black group-hover:underline underline-offset-2">
													{product.name}
												</span>
												<span className="text-[10px] text-black font-mono uppercase tracking-widest mt-0.5">
													{product.slug}
												</span>
											</div>
										</td>
										<td className="p-3 border-r border-black font-mono text-xs">
											{product.category?.name || <span className="text-black">---</span>}
										</td>
										<td className="p-3 border-r border-black">
											<span
												className={cn(
													"text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border",
													product.status === "published" && "bg-black text-white border-black",
													product.status === "draft" && "bg-white text-black border-black border-dashed",
													product.status === "hidden" &&
														"bg-white text-black border-neutral-200 border-dashed",
												)}
											>
												{product.status || "Unknown"}
											</span>
										</td>
										<td className="p-3 border-r border-black font-mono">
											<div className="flex items-center gap-2">
												<span className={`font-bold ${totalStock <= 5 ? "text-red-600" : "text-black"}`}>
													{totalStock}{" "}
													<span className="font-normal text-black text-[10px] uppercase tracking-widest">
														en stock
													</span>
												</span>
												{product.variants.length > 1 && (
													<span className="text-[10px] font-bold bg-black text-white border border-black px-1.5 py-0.5 text-black">
														{product.variants.length} VAR.
													</span>
												)}
											</div>
										</td>
										<td className="p-3 border-r border-black text-right font-black">
											{formatMoney({ amount: minPrice.toString(), currency: "XOF", locale: "fr-CI" })}
										</td>
										<td className="p-3 border-r border-black text-right">
											{marginPercent !== null ? (
												<span
													className={cn(
														"text-xs font-bold px-2 py-1 border border-black",
														marginPercent >= 30 && "bg-white text-black",
														marginPercent >= 15 && marginPercent < 30 && "bg-yellow-100 text-black",
														marginPercent < 15 && marginPercent > 0 && "bg-white text-black border-red-600",
														marginPercent <= 0 && "bg-black text-white",
													)}
												>
													{marginPercent.toFixed(0)}%
												</span>
											) : (
												<span className="text-xs text-black">---</span>
											)}
										</td>
										<td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
											<div className="flex items-center justify-center gap-1 ">
												<Link
													href={`/product/${product.slug}`}
													target="_blank"
													className="p-1.5 border border-transparent hover:border-black hover:bg-black hover:text-white transition-colors text-black"
												>
													<ExternalLink size={14} />
												</Link>
												<Link
													href={`/manage/products/${product.id}`}
													className="p-1.5 border border-transparent hover:border-black hover:bg-black hover:text-white transition-colors text-black"
												>
													<MoreHorizontal size={14} />
												</Link>
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}
			</div>

			{/* Pagination Controls - Brutalist */}
			{totalPages > 1 && (
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 border-t-2 border-dashed border-black">
					<div className="text-xs font-mono uppercase tracking-wider text-black">
						Affichage de <span className="text-black font-bold">{startIndex + 1}</span> à{" "}
						<span className="text-black font-bold">
							{Math.min(startIndex + itemsPerPage, filteredProducts.length)}
						</span>{" "}
						sur <span className="text-black font-bold">{filteredProducts.length}</span> produits
					</div>
					<div className="flex items-center gap-1 font-mono text-xs">
						<button
							type="button"
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
							className="flex items-center gap-1 px-3 py-1.5 border border-black hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black"
						>
							<ChevronLeft className="w-3 h-3" /> Prec
						</button>
						<div className="px-4 py-1.5 font-bold">
							{currentPage} / {totalPages}
						</div>
						<button
							type="button"
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages}
							className="flex items-center gap-1 px-3 py-1.5 border border-black hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black"
						>
							Suiv <ChevronRight className="w-3 h-3" />
						</button>
					</div>
				</div>
			)}

			<ProductDetailsSidebar
				product={selectedProduct}
				isOpen={isSidebarOpen}
				onClose={() => setIsSidebarOpen(false)}
				onNext={handleNext}
				onPrevious={handlePrevious}
			/>
		</div>
	);
}
