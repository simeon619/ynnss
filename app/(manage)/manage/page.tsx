import { AlertCircle, Clock, DollarSign, Percent, PiggyBank, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { RevenueChart } from "./revenue-chart";

export default async function DashboardPage() {
	// Hardcoded test data - replace with actual stats
	const stats = {
		totalRevenue: 2500000,
		revenueTrend: 25.5,
		totalProfit: 875000,
		profitTrend: 32.0,
		profitMargin: 35.0,
		marginTrend: 5.2,
		totalOrders: 342,
		ordersTrend: 18.0,
		totalCost: 1625000,
		lowStockCount: 7,
		recentOrders: [],
		revenueData: [
			{ name: "01/02", total: 320000, profit: 112000 },
			{ name: "03/02", total: 180000, profit: 63000 },
			{ name: "05/02", total: 540000, profit: 189000 },
			{ name: "07/02", total: 290000, profit: 101500 },
			{ name: "09/02", total: 610000, profit: 213500 },
			{ name: "11/02", total: 420000, profit: 147000 },
			{ name: "13/02", total: 750000, profit: 262500 },
			{ name: "15/02", total: 380000, profit: 133000 },
			{ name: "17/02", total: 920000, profit: 322000 },
			{ name: "19/02", total: 560000, profit: 196000 },
			{ name: "21/02", total: 680000, profit: 238000 },
			{ name: "23/02", total: 430000, profit: 150500 },
			{ name: "25/02", total: 810000, profit: 283500 },
			{ name: "26/02", total: 340000, profit: 119000 },
		],
	};

	const revTrendNum = Number(stats.revenueTrend);
	const revTrendType = revTrendNum >= 0 ? "up" : "down";
	const ordersTrendNum = Number(stats.ordersTrend);
	const ordersTrendType = ordersTrendNum >= 0 ? "up" : "down";
	const profitTrendNum = Number(stats.profitTrend);
	const profitTrendType = profitTrendNum >= 0 ? "up" : "down";
	const marginTrendNum = Number(stats.marginTrend);
	const marginTrendType = marginTrendNum >= 0 ? "up" : "down";

	return (
		<div className="flex flex-col gap-6 p-6 overflow-auto flex-1 min-h-0 bg-white">
			<div className="flex flex-col gap-2">
				<h1 className="text-4xl font-black uppercase tracking-tighter">Tableau de Bord</h1>
				<p className="font-mono text-sm font-bold uppercase text-black">
					Statistiques et performances en temps réel
				</p>
			</div>

			{/* KPI Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 flex-shrink-0">
				<KpiCard
					title="Revenus"
					value={formatMoney({ amount: stats.totalRevenue.toString(), currency: "XOF", locale: "fr-CI" })}
					icon={<DollarSign size={20} />}
					trend={`${revTrendNum >= 0 ? "+" : ""}${stats.revenueTrend}%`}
					trendType={revTrendType}
					color="bg-white"
				/>
				<KpiCard
					title="Profit"
					value={formatMoney({ amount: stats.totalProfit.toString(), currency: "XOF", locale: "fr-CI" })}
					icon={<PiggyBank size={20} />}
					trend={`${profitTrendNum >= 0 ? "+" : ""}${stats.profitTrend}%`}
					trendType={profitTrendType}
					color="bg-black"
				/>
				<KpiCard
					title="Marge"
					value={`${stats.profitMargin}%`}
					icon={<Percent size={20} />}
					trend={`${marginTrendNum >= 0 ? "+" : ""}${stats.marginTrend}%`}
					trendType={marginTrendType}
					color="bg-white"
				/>
				<KpiCard
					title="Commandes"
					value={stats.totalOrders.toString()}
					icon={<ShoppingCart size={20} />}
					trend={`${ordersTrendNum >= 0 ? "+" : ""}${stats.ordersTrend}%`}
					trendType={ordersTrendType}
					color="bg-yellow-400"
				/>
				<KpiCard
					title="Coûts"
					value={formatMoney({ amount: stats.totalCost.toString(), currency: "XOF", locale: "fr-CI" })}
					icon={<DollarSign size={20} />}
					trend="STABLE"
					trendType="neutral"
					color="bg-white"
				/>
				<KpiCard
					title="Ruptures"
					value={stats.lowStockCount.toString()}
					icon={
						stats.lowStockCount > 0 ? (
							<AlertCircle size={20} className="text-red-600" />
						) : (
							<AlertCircle size={20} />
						)
					}
					trend={stats.lowStockCount > 0 ? "ALERTE" : "OK"}
					trendType={stats.lowStockCount > 0 ? "down" : "neutral"}
					color={stats.lowStockCount > 0 ? "bg-red-500" : "bg-white"}
				/>
			</div>

			{/* Chart & Orders */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
				{/* Revenue Chart — 2/3 width */}
				<div className="lg:col-span-2 border-4 border-black bg-white flex flex-col min-h-[400px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
					<div className="border-b-4 border-black px-4 py-3 bg-black flex items-center justify-between shrink-0">
						<h2 className="text-lg font-black text-white uppercase tracking-tight">Performances Revenus</h2>
						<span className="text-xs font-mono font-bold text-black bg-white px-2 py-1 uppercase">
							Derniers 30 jours
						</span>
					</div>
					<div className="flex-1 min-h-0 relative p-6">
						<RevenueChart data={stats.revenueData} />
					</div>
				</div>

				{/* Recent Orders — 1/3 width */}
				<div className="border-4 border-black bg-white flex flex-col min-h-[400px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
					<div className="flex flex-row items-center justify-between border-b-4 border-black px-4 py-3 bg-white shrink-0">
						<h2 className="text-lg font-black text-black uppercase tracking-tight">Commandes Récentes</h2>
						<Link
							href="/manage/orders"
							className="text-xs uppercase font-black border-2 border-black px-3 py-1 bg-yellow-400 text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
						>
							TOUT VOIR
						</Link>
					</div>
					<div className="flex flex-col divide-y-2 divide-black overflow-auto">
						{[
							{
								id: "1",
								customerEmail: "jean.doe@email.com",
								lookup: "ORD-001",
								subtotal: "125000",
								status: "payé",
							},
							{
								id: "2",
								customerEmail: "marie.durand@email.com",
								lookup: "ORD-002",
								subtotal: "89000",
								status: "attente",
							},
							{
								id: "3",
								customerEmail: "paul.martin@email.com",
								lookup: "ORD-003",
								subtotal: "245000",
								status: "payé",
							},
							{
								id: "4",
								customerEmail: "sophie.bernard@email.com",
								lookup: "ORD-004",
								subtotal: "67000",
								status: "expédié",
							},
							{
								id: "5",
								customerEmail: "luc.dubois@email.com",
								lookup: "ORD-005",
								subtotal: "156000",
								status: "payé",
							},
						].map((order) => (
							<div
								key={order.id}
								className="flex items-center justify-between px-4 py-4 hover:bg-black hover:text-white group"
							>
								<div className="flex items-center gap-3 min-w-0">
									<div className="w-10 h-10 flex items-center justify-center border-2 border-black bg-black shrink-0 group-hover:bg-white">
										<Clock size={18} strokeWidth={3} className="text-white group-hover:text-black" />
									</div>
									<div className="min-w-0">
										<p className="text-sm font-black text-black uppercase truncate leading-none mb-1">
											{order.customerEmail.split("@")[0]}
										</p>
										<p className="text-xs font-mono font-bold text-black uppercase">#{order.lookup}</p>
									</div>
								</div>
								<div className="flex flex-col items-end gap-1 shrink-0 pl-4">
									<div className="text-sm font-black font-mono">
										{formatMoney({ amount: order.subtotal, currency: "XOF", locale: "fr-CI" })}
									</div>
									<span
										className={`px-2 py-0.5 border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
											order.status === "payé"
												? "bg-black text-white"
												: order.status === "expédié"
													? "bg-black text-white"
													: "bg-yellow-400 text-black"
										}`}
									>
										{order.status}
									</span>
								</div>
							</div>
						))}
					</div>
					<div className="p-4 mt-auto border-t-4 border-black bg-white">
						<p className="text-center font-black text-xs uppercase tracking-[0.2em] text-black">
							— FIN DES RÉCENTES —
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function KpiCard({
	title,
	value,
	icon,
	trend,
	trendType,
	color = "bg-white",
}: {
	title: string;
	value: string;
	icon: React.ReactNode;
	trend: string;
	trendType: "up" | "down" | "neutral";
	color?: string;
}) {
	return (
		<div
			className={`border-4 border-black p-4 flex flex-col justify-between h-32 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${color}`}
		>
			<div className="flex items-start justify-between">
				<span className="text-xs font-black uppercase tracking-wider">{title}</span>
				<div className="p-1 border-2 border-black bg-white">{icon}</div>
			</div>

			<div className="flex items-end justify-between mt-2">
				<div
					className="text-xl md:text-2xl font-black truncate leading-none"
					style={{ fontVariantNumeric: "tabular-nums" }}
				>
					{value}
				</div>
				<div
					className={`text-[10px] font-black px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
						trendType === "up"
							? "bg-black text-white"
							: trendType === "down"
								? "bg-red-500 text-white"
								: "bg-black text-white"
					}`}
				>
					{trend}
				</div>
			</div>
		</div>
	);
}
