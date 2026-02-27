"use client";

import { Clock, DollarSign, Filter, Mail, Search, User } from "lucide-react";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

interface Customer {
	id: string;
	name: string;
	email: string;
	totalOrders: number;
	totalSpent: number;
	lastOrderAt: string | null;
	status: "new" | "returning" | "vip";
}

export function CustomersTable({ initialCustomers }: { initialCustomers: Customer[] }) {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredCustomers = initialCustomers.filter((customer) => {
		const searchLower = searchQuery.toLowerCase();
		return (
			customer.name.toLowerCase().includes(searchLower) ||
			customer.email.toLowerCase().includes(searchLower) ||
			customer.id.toLowerCase().includes(searchLower)
		);
	});

	const getStatusColor = (status: string) => {
		switch (status) {
			case "vip":
				return "bg-black text-white border-black";
			case "returning":
				return "bg-white text-black border-2 border-black";
			case "new":
				return "bg-white text-black border-2 border-dashed border-black";
			default:
				return "bg-white text-black border-2 border-black";
		}
	};

	const getStatusTranslation = (status: string) => {
		switch (status) {
			case "new":
				return "Nouveau";
			case "returning":
				return "Fidèle";
			case "vip":
				return "VIP";
			default:
				return status;
		}
	};

	return (
		<div className="space-y-6">
			{/* Filters & Search - Refined Brutalist */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 border-b-2 border-black pb-3">
				<div className="flex items-center gap-2">
					<h2 className="text-lg font-black uppercase tracking-tight text-black">Base de données clients</h2>
				</div>
				<div className="flex gap-2 w-full md:w-auto">
					<div className="relative flex-1 md:w-64">
						<Search
							className="absolute left-3 top-1/2 -translate-y-1/2 text-black"
							size={14}
							strokeWidth={3}
						/>
						<input
							type="text"
							placeholder="RECHERCHER UN CLIENT..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-10 w-full pl-9 pr-3 border-2 border-black bg-white focus:outline-none font-mono text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
						/>
					</div>
					<button
						type="button"
						className="flex items-center gap-2 px-3 h-10 border-2 border-black bg-white hover:bg-black hover:text-white text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
					>
						<Filter size={14} strokeWidth={3} />
						Filtrer
					</button>
				</div>
			</div>

			{/* Brutalist Raw Table */}
			<div className="border-2 border-black bg-white overflow-x-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
				{filteredCustomers.length === 0 ? (
					<div className="py-16 flex flex-col items-center justify-center text-center">
						<div className="w-16 h-16 border-2 border-black flex items-center justify-center mb-4 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
							<User className="h-6 w-6 text-black" strokeWidth={3} />
						</div>
						<h3 className="text-sm font-black uppercase tracking-widest text-black mb-1">
							Aucun client trouvé
						</h3>
						<p className="text-xs text-black font-mono">
							Modifiez votre recherche ou ajoutez un nouveau client.
						</p>
					</div>
				) : (
					<table className="w-full text-left border-collapse whitespace-nowrap">
						<thead>
							<tr className="border-b-2 border-black bg-black text-white uppercase text-[10px] tracking-widest font-black">
								<th className="p-4 border-r-2 border-black">Client</th>
								<th className="p-4 border-r-2 border-black">Statut</th>
								<th className="p-4 border-r-2 border-black text-center">Commandes</th>
								<th className="p-4 border-r-2 border-black text-right">Total Dépensé</th>
								<th className="p-4">Dernière activité</th>
							</tr>
						</thead>
						<tbody>
							{filteredCustomers.map((customer) => (
								<tr
									key={customer.id}
									className="group hover:bg-black hover:text-white border-b border-black text-sm"
								>
									<td className="p-4 border-r-2 border-black">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
												<User size={20} strokeWidth={2.5} />
											</div>
											<div className="flex flex-col">
												<span className="font-black text-black uppercase tracking-tight">
													{customer.name}
												</span>
												<span className="text-[10px] text-black font-mono tracking-tighter lowercase flex items-center gap-1">
													<Mail size={10} strokeWidth={3} /> {customer.email}
												</span>
											</div>
										</div>
									</td>
									<td className="p-4 border-r-2 border-black">
										<span
											className={cn(
												"text-[9px] uppercase font-black tracking-widest px-2 py-1 border-2",
												getStatusColor(customer.status),
											)}
										>
											{getStatusTranslation(customer.status)}
										</span>
									</td>
									<td className="p-4 border-r-2 border-black text-center font-black text-lg">
										<div className="flex flex-col items-center">
											<span className="leading-none">{customer.totalOrders}</span>
											<span className="text-[8px] font-mono text-black uppercase tracking-widest mt-1">
												COMMANDES
											</span>
										</div>
									</td>
									<td className="p-4 border-r-2 border-black text-right font-black text-black">
										<div className="flex items-center justify-end gap-1 text-lg">
											<DollarSign size={14} strokeWidth={3} className="text-black opacity-20" />
											{formatMoney({
												amount: customer.totalSpent.toString(),
												currency: "XOF",
												locale: "fr-CI",
											})}
										</div>
									</td>
									<td className="p-4 font-mono text-[10px] uppercase font-bold text-black">
										<div className="flex items-center gap-2">
											<Clock size={12} strokeWidth={3} className="text-black" />
											{customer.lastOrderAt || "AUCUNE COMMANDE"}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
