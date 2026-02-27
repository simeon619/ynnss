"use client";

import { Clock, Search, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { formatMoney } from "@/lib/money";

interface CartVariant {
	price: string;
	product: {
		name: string;
	} | null;
}

interface CartLineItem {
	variant: CartVariant | null;
	quantity: number;
}

interface Cart {
	id: string;
	updatedAt: Date | string | null;
	createdAt: Date | string | null;
	lineItems: CartLineItem[] | null;
}

export function CartsTable({ initialCarts }: { initialCarts: Cart[] }) {
	const [searchQuery, setSearchQuery] = useState("");

	// Filtrage très basique par ID
	const filteredCarts = initialCarts.filter((cart) => {
		const searchLower = searchQuery.toLowerCase();
		return cart.id.toLowerCase().includes(searchLower);
	});

	// Formatage
	const formatDate = (dateString: Date | string | null) => {
		if (!dateString) return "N/A";
		const d = new Date(dateString);
		return new Intl.DateTimeFormat("fr-FR", {
			day: "numeric",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(d);
	};

	// Calcul de la valeur financière du panier
	const calculateCartTotal = (cart: Cart) => {
		let total = 0;
		if (cart.lineItems && cart.lineItems.length > 0) {
			for (const item of cart.lineItems) {
				if (item.variant?.price) {
					total += Number.parseFloat(item.variant.price) * (item.quantity || 1);
				}
			}
		}
		return total;
	};

	const totalCarts = initialCarts.length;
	const potentialTotalRevenue = initialCarts.reduce((acc, cart) => acc + calculateCartTotal(cart), 0);

	return (
		<div className="space-y-12">
			{/* KPIs */}
			<div className="grid gap-8 md:grid-cols-3 mb-8">
				<div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col justify-between h-[160px]">
					<h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black">
						Paniers Actifs / Abandonnés
					</h3>
					<div className="flex items-center gap-4">
						<div className="p-3 border-2 border-black bg-black text-white">
							<ShoppingBag size={24} strokeWidth={3} />
						</div>
						<span className="text-5xl font-black tracking-tighter text-black font-mono">{totalCarts}</span>
					</div>
				</div>
				<div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col justify-between h-[160px]">
					<h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Valeur Potentielle</h3>
					<div className="flex items-end gap-2">
						<span className="text-4xl font-black tracking-tighter text-black font-mono tabular-nums">
							{formatMoney({ amount: potentialTotalRevenue.toString(), currency: "XOF", locale: "fr-CI" })}
						</span>
					</div>
				</div>
				<div className="border-4 border-black border-dashed bg-white p-6 flex flex-col justify-center items-center h-[160px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
					<span className="text-xs font-black text-black uppercase tracking-[0.2em] text-center leading-relaxed">
						Taux de conversion
						<br />
						<span className="bg-black text-white px-2 mt-2 inline-block">Bientôt disponible</span>
					</span>
				</div>
			</div>

			{/* Filters & Search - Brutalist */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black pb-6">
				<div className="flex items-center gap-2">
					<h2 className="text-2xl font-black uppercase tracking-tight text-black">Historique des paniers</h2>
				</div>
				<div className="flex gap-4 w-full md:w-auto">
					<div className="relative flex-1 md:w-80">
						<Search
							className="absolute left-4 top-1/2 -translate-y-1/2 text-black"
							size={18}
							strokeWidth={3}
						/>
						<input
							type="text"
							placeholder="RECHERCHER UN ID..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-12 pr-4 py-3 border-4 border-black focus:outline-none bg-white font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest placeholder:text-black/30"
						/>
					</div>
				</div>
			</div>

			{/* Brutalist Raw Table */}
			<div className="border-4 border-black bg-white overflow-x-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
				{filteredCarts.length === 0 ? (
					<div className="py-24 flex flex-col items-center justify-center text-center">
						<div className="w-20 h-20 border-4 border-black flex items-center justify-center mb-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
							<ShoppingBag className="h-10 w-10 text-black" strokeWidth={3} />
						</div>
						<h3 className="text-lg font-black uppercase tracking-[0.2em] text-black mb-2">
							Aucun panier trouvé
						</h3>
						<p className="text-xs text-black font-black uppercase tracking-widest">
							Il n'y a actuellement aucun panier en cours ou abandonné.
						</p>
					</div>
				) : (
					<table className="w-full text-left border-collapse whitespace-nowrap">
						<thead>
							<tr className="border-b-4 border-black bg-black text-white uppercase text-xs tracking-[0.2em] font-black">
								<th className="p-4 border-r-4 border-black">ID Panier</th>
								<th className="p-4 border-r-4 border-black">Activité</th>
								<th className="p-4 border-r-4 border-black">Détails</th>
								<th className="p-4 text-right">Valeur Potentielle</th>
							</tr>
						</thead>
						<tbody className="divide-y-4 divide-black">
							{filteredCarts.map((cart) => {
								const total = calculateCartTotal(cart);
								return (
									<tr key={cart.id} className="group hover:bg-black hover:text-white transition-none text-sm">
										<td className="p-4 border-r-4 border-black font-black">
											<div className="font-mono text-xs tracking-tighter bg-black text-white p-2 border-2 border-white group-hover:border-white group-hover:bg-white group-hover:text-black inline-block uppercase">
												{cart.id.split("_").pop()?.slice(0, 8).toUpperCase() || cart.id.slice(0, 8)}
											</div>
										</td>
										<td className="p-4 border-r-4 border-black font-black text-xs uppercase tracking-widest">
											<div className="flex flex-col gap-2">
												<span className="flex items-center gap-2">
													<Clock size={14} strokeWidth={3} /> MAJ: {formatDate(cart.updatedAt)}
												</span>
												<span className="opacity-60 text-[10px]">Créé : {formatDate(cart.createdAt)}</span>
											</div>
										</td>
										<td className="p-4 border-r-4 border-black">
											<span className="text-[10px] font-black border-2 border-black group-hover:border-white px-3 py-1 inline-flex items-center gap-2 uppercase tracking-[0.2em]">
												<ShoppingBag size={14} strokeWidth={3} />
												{cart.lineItems?.length || 0} Article(s)
											</span>
											<div className="mt-3 flex flex-col gap-1.5 max-w-[300px]">
												{cart.lineItems?.slice(0, 2).map((item, i) => (
													<div key={i} className="text-xs font-black uppercase tracking-tight truncate">
														<span className="bg-black text-white group-hover:bg-white group-hover:text-black px-1 mr-2">
															{item.quantity}X
														</span>{" "}
														{item.variant?.product?.name || "Produit inconnu"}
													</div>
												))}
												{(cart.lineItems?.length || 0) > 2 && (
													<div className="text-[9px] font-black uppercase tracking-[0.2em] mt-2 opacity-60">
														+ {(cart.lineItems?.length || 0) - 2} autre(s)...
													</div>
												)}
											</div>
										</td>
										<td className="p-4 text-right font-black text-2xl font-mono tabular-nums tracking-tighter">
											{total > 0
												? formatMoney({ amount: total.toString(), currency: "XOF", locale: "fr-CI" })
												: "---"}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
