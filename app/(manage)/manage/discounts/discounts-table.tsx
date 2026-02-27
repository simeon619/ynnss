"use client";

import { Copy, Eye, EyeOff, Pencil, Search, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import { deleteCoupon, toggleCouponStatus } from "./actions";

export interface Coupon {
	id: string;
	code: string;
	type: "percentage" | "fixed";
	value: number;
	minAmount: string | null;
	maxUsage: number | null;
	usedCount: number | null;
	expiresAt: Date | null;
	status: string | null;
}

export function DiscountsTable({ initialCoupons }: { initialCoupons: Coupon[] }) {
	const [searchQuery, setSearchQuery] = useState("");
	const [isPending, startTransition] = useTransition();

	const filteredCoupons = initialCoupons.filter((c) =>
		c.code.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const handleCopy = (code: string) => {
		navigator.clipboard.writeText(code);
		toast.success("Code copié dans le presse-papiers");
	};

	const handleToggleStatus = (id: string, currentStatus: string) => {
		startTransition(async () => {
			try {
				await toggleCouponStatus(id, currentStatus);
				toast.success("Statut mis à jour");
			} catch (e) {
				toast.error("Erreur lors de la mise à jour");
			}
		});
	};

	const handleDelete = (id: string) => {
		if (!confirm("Voulez-vous vraiment supprimer ce code promo ?")) return;
		startTransition(async () => {
			try {
				await deleteCoupon(id);
				toast.success("Code promo supprimé");
			} catch (e) {
				toast.error("Erreur lors de la suppression");
			}
		});
	};

	return (
		<div className="flex flex-col gap-8">
			<div className="flex items-center gap-4">
				<div className="relative w-full">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black" size={16} strokeWidth={3} />
					<input
						type="text"
						placeholder="RECHERCHER UN CODE..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="h-12 w-full border-2 border-black bg-white pl-12 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none placeholder:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
					/>
				</div>
			</div>

			<div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader className="bg-black border-b-4 border-black">
							<TableRow className="hover:bg-transparent border-none h-14">
								<TableHead className="font-black text-white uppercase tracking-widest text-[10px] pl-6">
									Code
								</TableHead>
								<TableHead className="font-black text-white uppercase tracking-widest text-[10px]">
									Valeur
								</TableHead>
								<TableHead className="font-black text-white uppercase tracking-widest text-[10px]">
									Statut
								</TableHead>
								<TableHead className="font-black text-white uppercase tracking-widest text-[10px]">
									Utilisations
								</TableHead>
								<TableHead className="font-black text-white uppercase tracking-widest text-[10px]">
									Détails
								</TableHead>
								<TableHead className="text-right font-black text-white uppercase tracking-widest text-[10px] pr-6">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredCoupons.map((coupon) => {
								const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
								const isExhausted = coupon.maxUsage && (coupon.usedCount || 0) >= coupon.maxUsage;
								const isInactive = coupon.status === "inactive" || isExpired || isExhausted;

								return (
									<TableRow
										key={coupon.id}
										className={`group hover:bg-neutral-50 transition-colors border-b-2 border-black last:border-none ${
											isInactive ? "bg-neutral-50/50" : ""
										}`}
									>
										<TableCell className="pl-6 py-5">
											<button
												type="button"
												className="font-mono text-[11px] font-black tracking-[0.2em] bg-white border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white"
												onClick={() => handleCopy(coupon.code)}
											>
												{coupon.code.toUpperCase()}
											</button>
										</TableCell>
										<TableCell className="py-5">
											<span className="font-black text-black text-lg">
												{coupon.type === "percentage"
													? `${coupon.value}%`
													: formatMoney({
															amount: coupon.value.toString(),
															currency: "XOF",
															locale: "fr-CI",
														})}
											</span>
										</TableCell>
										<TableCell className="py-5">
											<span
												className={`text-[8px] font-black uppercase tracking-widest border-2 border-black px-2 py-0.5 ${
													coupon.status === "active" && !isExpired && !isExhausted
														? "bg-black text-white"
														: "bg-white"
												}`}
											>
												{isExpired
													? "Expiré"
													: isExhausted
														? "Épuisé"
														: coupon.status === "active"
															? "Actif"
															: "Inactif"}
											</span>
										</TableCell>
										<TableCell className="py-5">
											<div className="flex items-baseline gap-2">
												<span className="font-black text-black">{coupon.usedCount || 0}</span>
												{coupon.maxUsage && (
													<span className="text-black font-mono text-[9px] font-bold uppercase">
														/ {coupon.maxUsage}
													</span>
												)}
											</div>
											{coupon.maxUsage && (
												<div className="w-20 h-2 mt-2 border-2 border-black bg-white overflow-hidden">
													<div
														className="h-full bg-black"
														style={{
															width: `${Math.min(100, ((coupon.usedCount || 0) / coupon.maxUsage) * 100)}%`,
														}}
													/>
												</div>
											)}
										</TableCell>
										<TableCell className="py-5">
											<div className="flex flex-col gap-1">
												{coupon.minAmount && Number(coupon.minAmount) > 0 ? (
													<span className="text-[10px] font-black uppercase text-black">
														Dès {formatMoney({ amount: coupon.minAmount, currency: "XOF", locale: "fr-CI" })}
													</span>
												) : (
													<span className="text-[9px] font-mono font-bold text-black uppercase tracking-widest italic leading-none">
														Sans minimum
													</span>
												)}
												{coupon.expiresAt ? (
													<span
														className={`text-[9px] font-mono font-bold uppercase tracking-widest leading-none ${
															isExpired ? "text-black underline" : "text-black"
														}`}
													>
														Fin: {new Date(coupon.expiresAt).toLocaleDateString("fr-FR")}
													</span>
												) : (
													<span className="text-[9px] font-mono font-bold text-black uppercase tracking-widest italic leading-none">
														Ouvert
													</span>
												)}
											</div>
										</TableCell>
										<TableCell className="text-right pr-6 py-5">
											<div className="flex justify-end items-center gap-2">
												<button
													type="button"
													onClick={() => handleCopy(coupon.code)}
													className="p-2 border-2 border-black bg-white hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
													title="Copier le code"
												>
													<Copy size={16} strokeWidth={3} />
												</button>
												<Link
													href={`/manage/discounts/${coupon.id}`}
													className="p-2 border-2 border-black bg-white hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
													title="Modifier"
												>
													<Pencil size={16} strokeWidth={3} />
												</Link>
												<button
													type="button"
													onClick={() => handleToggleStatus(coupon.id, coupon.status || "active")}
													className={`p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white ${
														coupon.status === "active" ? "bg-white" : "bg-white"
													}`}
													title={coupon.status === "active" ? "Désactiver" : "Activer"}
												>
													{coupon.status === "active" ? (
														<EyeOff size={16} strokeWidth={3} />
													) : (
														<Eye size={16} strokeWidth={3} />
													)}
												</button>
												<button
													type="button"
													onClick={() => handleDelete(coupon.id)}
													className="p-2 border-2 border-black bg-black text-white hover:bg-white hover:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
													title="Supprimer"
												>
													<Trash2 size={16} strokeWidth={3} />
												</button>
											</div>
										</TableCell>
									</TableRow>
								);
							})}
							{filteredCoupons.length === 0 && (
								<TableRow className="hover:bg-transparent">
									<TableCell colSpan={6} className="py-20 text-center">
										<div className="flex flex-col items-center gap-4">
											<div className="p-4 border-2 border-dashed border-black">
												<Tag className="h-10 w-10 text-black" strokeWidth={2} />
											</div>
											<p className="text-[10px] font-mono font-bold text-black uppercase tracking-widest italic">
												Aucun code promo trouvé pour le moment.
											</p>
											{searchQuery && (
												<button
													type="button"
													onClick={() => setSearchQuery("")}
													className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-black hover:opacity-70"
												>
													Effacer la recherche
												</button>
											)}
										</div>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
