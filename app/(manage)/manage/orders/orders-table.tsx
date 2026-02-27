"use client";

import { Eye, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export function OrdersTable({
	initialOrders,
}: {
	initialOrders: {
		id: string;
		lookup: string;
		customerEmail: string;
		status: string;
		subtotal: string;
		currency: string;
		createdAt: Date | string | null;
	}[];
}) {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	// Filtrage
	const filteredOrders = initialOrders.filter((order) => {
		const searchLower = searchQuery.toLowerCase();
		const matchesSearch =
			order.lookup?.toLowerCase().includes(searchLower) ||
			order.customerEmail?.toLowerCase().includes(searchLower) ||
			order.id.toLowerCase().includes(searchLower);

		const matchesStatus = statusFilter === "all" || order.status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	// Formatage des dates
	const formatDate = (dateString: string | Date | null) => {
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

	const getStatusColor = (status: string) => {
		switch (status) {
			case "paid":
				return "bg-white text-black border-2 border-black";
			case "shipped":
				return "bg-black text-white border-black";
			case "cancelled":
				return "bg-black text-white border-black";
			default:
				return "bg-white text-black border-2 border-black";
		}
	};

	const getStatusTranslation = (status: string) => {
		switch (status) {
			case "paid":
				return "Payée";
			case "shipped":
				return "Expédiée";
			case "cancelled":
				return "Annulée";
			case "pending":
				return "En attente";
			default:
				return status;
		}
	};

	const orderCounts = {
		all: initialOrders.length,
		pending: initialOrders.filter((o) => o.status === "pending").length,
		paid: initialOrders.filter((o) => o.status === "paid").length,
		shipped: initialOrders.filter((o) => o.status === "shipped").length,
		cancelled: initialOrders.filter((o) => o.status === "cancelled").length,
	};

	return (
		<div className="space-y-6">
			{/* Filters & Search - Brutalist */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 border-b-2 border-black pb-3">
				<div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1">
					{(["all", "pending", "paid", "shipped", "cancelled"] as const).map((tab) => (
						<button
							type="button"
							key={tab}
							onClick={() => setStatusFilter(tab)}
							className={cn(
								"px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 whitespace-nowrap",
								statusFilter === tab
									? "bg-black text-white border-black"
									: "bg-white text-black border-transparent hover:border-black",
							)}
						>
							{tab === "all" ? "Toutes" : getStatusTranslation(tab)} ({orderCounts[tab]})
						</button>
					))}
				</div>
				<div className="flex gap-2 w-full md:w-auto">
					<div className="relative flex-1 md:w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={14} />
						<input
							type="text"
							placeholder="ID, Email..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-9 pr-3 py-1.5 border border-black focus:outline-none focus:ring-1 focus:ring-black font-mono text-sm bg-white"
						/>
					</div>
				</div>
			</div>

			{/* Brutalist Raw Table */}
			<div className="border-2 border-black bg-white overflow-x-auto">
				{filteredOrders.length === 0 ? (
					<div className="py-16 flex flex-col items-center justify-center text-center">
						<div className="w-16 h-16 border-2 border-black flex items-center justify-center mb-4 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
							<Search className="h-6 w-6 text-black" />
						</div>
						<h3 className="text-sm font-black uppercase tracking-widest text-black mb-1">Aucune commande</h3>
						<p className="text-xs text-black font-mono">
							Modifiez vos filtres ou effectuez une nouvelle recherche.
						</p>
					</div>
				) : (
					<table className="w-full text-left border-collapse whitespace-nowrap">
						<thead>
							<tr className="border-b-2 border-black bg-black text-white uppercase text-[10px] tracking-widest font-bold">
								<th className="p-3 border-r border-black">Référence</th>
								<th className="p-3 border-r border-black">Date</th>
								<th className="p-3 border-r border-black">Client</th>
								<th className="p-3 border-r border-black">Statut</th>
								<th className="p-3 border-r border-black text-right">Total</th>
								<th className="w-12 p-3 text-center"></th>
							</tr>
						</thead>
						<tbody>
							{filteredOrders.map((order) => (
								<tr
									key={order.id}
									className="group cursor-pointer hover:bg-black hover:text-white border-b border-black text-sm"
									onClick={() => router.push(`/manage/orders/${order.id}`)}
								>
									<td className="p-3 border-r border-black">
										<div className="font-bold">{order.lookup}</div>
										<div className="text-[10px] text-black mt-0.5 font-mono uppercase">
											ID: {order.id.split("_").pop()?.slice(0, 8)}
										</div>
									</td>
									<td className="p-3 border-r border-black font-mono text-xs">
										{formatDate(order.createdAt)}
									</td>
									<td className="p-3 border-r border-black">
										<span className="font-bold text-black">{order.customerEmail.split("@")[0]}</span>
										<span className="text-black">@{order.customerEmail.split("@")[1]}</span>
									</td>
									<td className="p-3 border-r border-black">
										<span
											className={cn(
												"text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border",
												getStatusColor(order.status),
											)}
										>
											{getStatusTranslation(order.status)}
										</span>
									</td>
									<td className="p-3 border-r border-black text-right font-black">
										{formatMoney({
											amount: (order.subtotal || "0").toString(),
											currency: order.currency || "XOF",
											locale: "fr-CI",
										})}
									</td>
									<td className="p-2 text-center">
										<button
											type="button"
											className="p-1.5 border-2 border-black bg-white text-black hover:bg-black hover:text-white"
										>
											<Eye size={14} />
										</button>
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
