"use client";

import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { adjustVariantStock } from "./actions";
import { EditableStock } from "./editable-stock";

type VariantWithProduct = {
	id: string;
	stock: number;
	sku: string | null;
	price: string;
	images?: string[] | null;
	product: {
		id: string;
		name: string;
		images: string[] | null;
	};
};

export function InventoryTable({ variants }: { variants: VariantWithProduct[] }) {
	const [activeTab, setActiveTab] = useState<"all" | "low" | "out" | "in">("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [isPending, startTransition] = useTransition();

	// Calculate metrics
	const totalStockValue = variants.reduce((acc, v) => acc + v.stock * Number(v.price), 0);
	const lowStockCount = variants.filter((v) => v.stock > 0 && v.stock <= 10).length;
	const outOfStockCount = variants.filter((v) => v.stock === 0).length;
	const inStockCount = variants.filter((v) => v.stock > 10).length;

	// Reset pagination when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, []);

	// Filter variants
	const filteredVariants = variants.filter((v) => {
		const matchesSearch =
			v.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			v.sku?.toLowerCase().includes(searchQuery.toLowerCase());

		if (!matchesSearch) return false;

		switch (activeTab) {
			case "low":
				return v.stock > 0 && v.stock <= 10;
			case "out":
				return v.stock === 0;
			case "in":
				return v.stock > 10;
			default:
				return true;
		}
	});

	const totalPages = Math.max(1, Math.ceil(filteredVariants.length / itemsPerPage));
	const paginatedVariants = filteredVariants.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	const handleAdjust = (variantId: string, amount: number) => {
		startTransition(async () => {
			const result = await adjustVariantStock(variantId, amount);
			if (result.success) {
				toast.success(`Stock adjusted to ${result.newStock}`);
			} else {
				toast.error(result.error || "Failed to adjust stock");
			}
		});
	};

	const AdjustButton = ({
		variantId,
		amount,
		label,
	}: {
		variantId: string;
		amount: number;
		label: string;
	}) => (
		<button
			type="button"
			onClick={() => handleAdjust(variantId, amount)}
			disabled={isPending}
			className="px-2 py-0.5 text-xs font-mono border-r border-black last:border-r-0 hover:bg-black hover:text-white disabled:opacity-50"
		>
			{label}
		</button>
	);

	return (
		<div className="space-y-6">
			{/* Compact Metric Cards */}
			<div className="flex flex-row overflow-x-auto gap-2 md:gap-4 pb-2">
				<div className="border-2 border-black px-4 py-2 bg-white flex flex-col md:flex-row md:items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-w-[200px] flex-1">
					<span className="text-xs font-bold uppercase tracking-widest text-neutral-600">Total SKUs</span>
					<span className="text-xl font-black">{variants.length}</span>
				</div>

				<div className="border-2 border-black px-4 py-2 bg-white flex flex-col md:flex-row md:items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-w-[200px] flex-1">
					<span className="text-xs font-bold uppercase tracking-widest text-black">Low Stock</span>
					<span className="text-xl font-black text-black">{lowStockCount}</span>
				</div>

				<div className="border-2 border-black px-4 py-2 bg-white flex flex-col md:flex-row md:items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-w-[200px] flex-1">
					<span className="text-xs font-bold uppercase tracking-widest text-black">Out of Stock</span>
					<span className="text-xl font-black text-black">{outOfStockCount}</span>
				</div>

				<div className="border-2 border-black px-4 py-2 bg-black text-white flex flex-col md:flex-row md:items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-w-[200px] flex-1">
					<span className="text-xs font-bold uppercase tracking-widest text-white">Inventory Value</span>
					<span className="text-xl font-black">
						$
						{totalStockValue.toLocaleString(undefined, {
							minimumFractionDigits: 0,
							maximumFractionDigits: 0,
						})}
					</span>
				</div>
			</div>

			{/* Filters & Search - Compacted */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 border-b-2 border-black pb-3">
				<div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1">
					{(["all", "low", "out", "in"] as const).map((tab) => (
						<button
							type="button"
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={cn(
								"px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 whitespace-nowrap",
								activeTab === tab
									? "bg-black text-white border-black"
									: "bg-white text-black border-transparent hover:border-black",
							)}
						>
							{tab} (
							{tab === "all"
								? variants.length
								: tab === "low"
									? lowStockCount
									: tab === "out"
										? outOfStockCount
										: inStockCount}
							)
						</button>
					))}
				</div>
				<div className="flex gap-2 w-full md:w-auto">
					<select
						value={itemsPerPage}
						onChange={(e) => setItemsPerPage(Number(e.target.value))}
						className="border-2 border-black px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-0 cursor-pointer bg-white"
						title="Items per page"
					>
						<option value={10}>10 / page</option>
						<option value={20}>20 / page</option>
						<option value={50}>50 / page</option>
					</select>
					<div className="relative flex-1 md:w-56">
						<input
							type="text"
							placeholder="Search SKU or Name..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-3 pr-3 py-1.5 border-2 border-black focus:outline-none font-mono text-sm"
						/>
					</div>
				</div>
			</div>

			{/* Main Grid/Table */}
			<div className="border-2 border-black bg-white overflow-x-auto">
				<table className="w-full text-left border-collapse whitespace-nowrap">
					<thead>
						<tr className="border-b-2 border-black bg-black text-white uppercase text-[10px] tracking-widest font-bold">
							<th className="p-3 w-10 border-r border-black text-center">
								<input
									type="checkbox"
									className="w-3.5 h-3.5 border border-black rounded-none checked:bg-black focus:ring-black accent-black"
								/>
							</th>
							<th className="p-3 w-12 border-r border-black text-center">St</th>
							<th className="p-3 border-r border-black">Product Details</th>
							<th className="p-3 w-32 border-r border-black">SKU</th>
							<th className="p-3 w-20 border-r border-black text-right">Stock</th>
							<th className="p-3 w-48 text-center">Quick Adjust</th>
						</tr>
					</thead>
					<tbody>
						{paginatedVariants.map((variant) => {
							const image = variant.images?.[0] || variant.product.images?.[0];
							const statusColor =
								variant.stock === 0
									? "bg-red-500"
									: variant.stock <= 10
										? "border-2 border-black bg-white"
										: "bg-black";

							return (
								<tr
									key={variant.id}
									className="border-b border-black hover:bg-black hover:text-white group text-sm"
								>
									<td className="p-3 border-r border-black text-center">
										<input
											type="checkbox"
											className="w-3.5 h-3.5 border border-black rounded-none checked:bg-black focus:ring-black accent-black"
										/>
									</td>
									<td className="p-3 border-r border-black text-center">
										<div
											className={cn("w-2.5 h-2.5 mx-auto", statusColor)}
											title={
												variant.stock === 0 ? "Out of Stock" : variant.stock <= 10 ? "Low Stock" : "In Stock"
											}
										/>
									</td>
									<td className="p-3 border-r border-black">
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 bg-white border-2 border-black shrink-0 relative overflow-hidden flex justify-center items-center">
												{image ? (
													<Image src={image} alt={variant.product.name} fill className="object-cover" />
												) : (
													<ImageIcon className="w-3 h-3 text-black" />
												)}
											</div>
											<div className="truncate max-w-xs md:max-w-md">
												<div className="font-bold truncate">{variant.product.name}</div>
												<div className="text-[10px] text-black mt-0.5 font-mono uppercase">
													ID: {variant.id.slice(0, 8)}
												</div>
											</div>
										</div>
									</td>
									<td className="p-3 border-r border-black font-mono text-xs">{variant.sku || "—"}</td>
									<td className="p-3 border-r border-black text-right font-mono font-bold">
										<EditableStock variantId={variant.id} initialStock={variant.stock} />
									</td>
									<td className="p-2">
										<div className="flex border-2 border-black max-w-fit mx-auto bg-white divide-x divide-black">
											<AdjustButton variantId={variant.id} amount={-100} label="-100" />
											<AdjustButton variantId={variant.id} amount={-10} label="-10" />
											<AdjustButton variantId={variant.id} amount={-1} label="-1" />
											<AdjustButton variantId={variant.id} amount={1} label="+1" />
											<AdjustButton variantId={variant.id} amount={10} label="+10" />
											<AdjustButton variantId={variant.id} amount={100} label="+100" />
										</div>
									</td>
								</tr>
							);
						})}
						{paginatedVariants.length === 0 && (
							<tr>
								<td
									colSpan={6}
									className="p-8 text-center text-black font-mono text-sm uppercase tracking-widest"
								>
									No variants found
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination Controls */}
			{filteredVariants.length > 0 && (
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 border-t-2 border-dashed border-black">
					<div className="text-xs font-mono uppercase tracking-wider text-black">
						Showing <span className="text-black font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
						<span className="text-black font-bold">
							{Math.min(currentPage * itemsPerPage, filteredVariants.length)}
						</span>{" "}
						of <span className="text-black font-bold">{filteredVariants.length}</span> entries
					</div>
					<div className="flex items-center gap-1 font-mono text-xs">
						<button
							type="button"
							onClick={() => setCurrentPage((p) => p - 1)}
							disabled={currentPage === 1}
							className="flex items-center gap-1 px-3 py-1.5 border-2 border-black hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black"
						>
							<ChevronLeft className="w-3 h-3" /> Prev
						</button>
						<div className="px-4 py-1.5 font-bold">
							{currentPage} / {totalPages}
						</div>
						<button
							type="button"
							onClick={() => setCurrentPage((p) => p + 1)}
							disabled={currentPage === totalPages}
							className="flex items-center gap-1 px-3 py-1.5 border-2 border-black hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black"
						>
							Next <ChevronRight className="w-3 h-3" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
