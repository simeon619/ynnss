"use client";

import { ChevronLeft, ChevronRight, Edit, ExternalLink, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import { toggleProductStatus } from "../actions";
import type { ProductWithRelations } from "./types";

interface ProductDetailsSidebarProps {
	product: ProductWithRelations | null;
	isOpen: boolean;
	onClose: () => void;
	onNext?: () => void;
	onPrevious?: () => void;
}

export function ProductDetailsSidebar({
	product,
	isOpen,
	onClose,
	onNext,
	onPrevious,
}: ProductDetailsSidebarProps) {
	if (!product) return null;

	const handleStatusChange = async (status: "published" | "draft" | "hidden") => {
		await toggleProductStatus(product.id, status);
	};

	const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);

	return (
		<Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="overflow-y-auto sm:max-w-xl bg-white p-0 border-l-4 border-black">
				{/* Header */}
				<div className="bg-black text-white sticky top-0 z-10 border-b-4 border-black">
					<div className="flex items-center justify-between p-4 pb-3">
						<div className="flex items-center gap-4">
							<div className="w-16 h-16 bg-white border-2 border-white flex items-center justify-center overflow-hidden relative shrink-0">
								{product.images?.[0] ? (
									<Image src={product.images[0]} alt="" fill className="object-cover" />
								) : (
									<Package size={24} className="text-black" />
								)}
							</div>
							<div>
								<SheetTitle className="text-base font-black uppercase tracking-tight text-white">
									{product.name}
								</SheetTitle>
								<div className="flex items-center gap-2 mt-1">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<button
												type="button"
												className="outline-none border-2 border-white px-2 py-0.5 text-[10px] font-black uppercase text-white hover:bg-white hover:text-black"
											>
												{product.status}
											</button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="start" className="border-2 border-black">
											<DropdownMenuItem
												className="font-bold uppercase text-xs"
												onClick={() => handleStatusChange("published")}
											>
												Published
											</DropdownMenuItem>
											<DropdownMenuItem
												className="font-bold uppercase text-xs"
												onClick={() => handleStatusChange("draft")}
											>
												Draft
											</DropdownMenuItem>
											<DropdownMenuItem
												className="font-bold uppercase text-xs"
												onClick={() => handleStatusChange("hidden")}
											>
												Hidden
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
									<span className="text-xs text-white/70 font-mono">/{product.slug}</span>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-1">
							<button
								type="button"
								onClick={onPrevious}
								className="h-8 w-8 flex items-center justify-center border-2 border-white text-white hover:bg-white hover:text-black"
							>
								<ChevronLeft size={18} strokeWidth={3} />
							</button>
							<button
								type="button"
								onClick={onNext}
								className="h-8 w-8 flex items-center justify-center border-2 border-white text-white hover:bg-white hover:text-black"
							>
								<ChevronRight size={18} strokeWidth={3} />
							</button>
						</div>
					</div>

					<div className="flex items-center gap-3 px-4 pb-4">
						<Link
							href={`/manage/products/${product.id}`}
							className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-black uppercase border-2 border-white hover:bg-black hover:text-white"
						>
							<Edit size={12} strokeWidth={3} />
							MODIFIER
						</Link>
						<Link
							href={`/product/${product.slug}`}
							target="_blank"
							className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-black uppercase border-2 border-white hover:bg-white hover:text-black"
						>
							<ExternalLink size={12} strokeWidth={3} />
							VOIR
						</Link>
					</div>
				</div>

				<div className="p-6 space-y-8">
					{/* Product Details Section */}
					<section className="space-y-3">
						<h3 className="text-xs font-black text-black uppercase tracking-wider border-b-2 border-black pb-2">
							DÉTAILS PRODUIT
						</h3>
						<div className="grid grid-cols-2 gap-4 bg-white p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
							<div className="space-y-1">
								<p className="text-[10px] font-black text-black uppercase tracking-tight">Catégorie</p>
								<p className="text-sm font-bold text-black">
									{product.category?.name || <span className="text-black font-mono italic">—</span>}
								</p>
							</div>
							<div className="space-y-1">
								<p className="text-[10px] font-black text-black uppercase tracking-tight">Stock total</p>
								<p className="text-sm font-bold font-mono text-black">
									{totalStock} / {product.variants.length} var.
								</p>
							</div>
							<div className="space-y-1 col-span-2">
								<p className="text-[10px] font-black text-black uppercase tracking-tight">Description</p>
								<p className="text-sm text-black font-mono leading-relaxed line-clamp-3">
									{product.description || <span className="italic">Aucune description.</span>}
								</p>
							</div>
						</div>
					</section>

					{/* Inventory Section */}
					<section className="space-y-3 pb-12">
						<div className="flex items-center justify-between border-b-2 border-black pb-2">
							<h3 className="text-xs font-black text-black uppercase tracking-wider">
								INVENTAIRE & VARIANTES
							</h3>
							<span className="text-[10px] font-black bg-black text-white px-2 py-0.5">
								{product.variants.length} VAR.
							</span>
						</div>

						<div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
							<Table>
								<TableHeader className="bg-black">
									<TableRow className="border-black hover:bg-black">
										<TableHead className="text-[10px] font-black text-white uppercase">Variante</TableHead>
										<TableHead className="text-[10px] font-black text-white uppercase">Prix</TableHead>
										<TableHead className="text-[10px] font-black text-white uppercase text-right">
											Stock
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{product.variants.map((variant) => (
										<TableRow key={variant.id} className="border-black hover:bg-neutral-100">
											<TableCell className="py-3">
												<div className="flex flex-col gap-0.5">
													<span className="text-xs font-black uppercase text-black">
														{variant.combinations?.map((c) => c.value).join(" × ") || "Standard"}
													</span>
													<span className="text-[10px] text-black font-mono uppercase">
														{variant.sku || "NO SKU"}
													</span>
												</div>
											</TableCell>
											<TableCell className="py-3">
												<span className="text-sm font-black font-mono text-black">
													{formatMoney({ amount: variant.price, currency: "XOF", locale: "fr-CI" })}
												</span>
											</TableCell>
											<TableCell className="text-right py-3">
												<span
													className={`text-[10px] font-black px-2 py-1 border-2 border-black font-mono ${
														variant.stock > 10
															? "bg-white text-black"
															: variant.stock > 0
																? "bg-white text-black border-black"
																: "bg-black text-white"
													}`}
												>
													{variant.stock}
												</span>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</section>
				</div>
			</SheetContent>
		</Sheet>
	);
}
