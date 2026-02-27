"use client";

import {
	Activity,
	AlertCircle,
	Archive,
	ArrowRight,
	Building2,
	ExternalLink,
	LogOut,
	MoreVertical,
	Package,
	Plus,
	Search,
	Settings,
	Store as StoreIcon,
	User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkline } from "@/components/ui/sparkline";
import { CURRENCY, LOCALE } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { archiveStoreAction, logoutAction, selectStoreAction, toggleStoreStatusAction } from "./actions";

interface Store {
	id: string;
	name: string;
	slug: string;
	status: string;
	subscriptionPlan: string;
	waveWalletId: string | null;
}

interface StoreMetric {
	totalRevenue: number;
	totalOrders: number;
	revenueTrend: number;
	sparklineData: number[];
}

interface StoreSelectorDashboardProps {
	stores: Store[];
	metrics: Record<string, StoreMetric>;
	userPhone: string;
	appUrl: string;
}

export function StoreSelectorDashboard({ stores, metrics, userPhone, appUrl }: StoreSelectorDashboardProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
	const router = useRouter();

	const filteredStores = stores.filter(
		(store) =>
			store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			store.slug.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const handleLogout = async () => {
		await logoutAction();
	};

	return (
		<main className="min-h-screen bg-[#f8fafc] text-slate-900">
			{/* Top Header */}
			<header className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 px-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
						<span className="text-white text-xs font-bold font-mono">YNS</span>
					</div>
					<span className="font-bold text-lg tracking-tight">Accounts</span>
				</div>

				<div className="flex items-center gap-4">
					<div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
						<div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-slate-600">
							<User size={14} />
						</div>
						<span className="text-sm font-medium text-slate-700">{userPhone}</span>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleLogout}
						className="text-slate-500 hover:text-red-600"
					>
						<LogOut size={20} />
					</Button>
				</div>
			</header>

			{/* Spacer for fixed header */}
			<div className="h-16" />

			<div className="max-w-6xl mx-auto pt-10 md:pt-16 pb-20 px-6">
				{/* Hero Section */}
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
					<div>
						<h1 className="text-4xl font-extrabold tracking-tight mb-3">Bonjour ! 👋</h1>
						<p className="text-slate-500 text-lg max-w-md">
							Sélectionnez une boutique pour commencer à vendre ou créez-en une nouvelle.
						</p>
					</div>
					<Button
						asChild
						size="lg"
						className="rounded-full px-6 shadow-xl shadow-slate-900/10 bg-slate-900 hover:bg-black text-white transition-all"
					>
						<Link href="/create-store" className="flex items-center gap-2">
							<Plus size={20} />
							<span>Nouvelle Boutique</span>
						</Link>
					</Button>
				</div>

				{/* Search Bar */}
				<div className="relative mb-12 group max-w-xl">
					<div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
						<Search
							className="text-slate-400 group-focus-within:text-slate-900 transition-colors duration-200"
							size={20}
						/>
					</div>
					<input
						type="text"
						placeholder="Rechercher une boutique..."
						className="w-full h-12 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all duration-200 shadow-sm hover:border-slate-300"
						style={{ paddingLeft: "48px", paddingRight: "48px" }}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					<div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
						<kbd className="hidden sm:flex h-5 items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-400">
							<span>/</span>
						</kbd>
					</div>
				</div>

				{/* Onboarding / Alerts Section */}
				{stores.some((s) => !s.waveWalletId) && (
					<div className="mb-8 border border-slate-200 bg-white rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow">
						<div className="flex gap-4 items-start">
							<div className="w-12 h-12 bg-slate-100 text-slate-800 rounded-full flex items-center justify-center shrink-0 border border-slate-200">
								<AlertCircle size={24} />
							</div>
							<div>
								<h3 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">
									Finalisez votre profil marchand
								</h3>
								<p className="text-slate-500 text-sm max-w-lg leading-relaxed">
									Pour commencer à recevoir des paiements en ligne et débloquer toutes les fonctionnalités
									UrbanFit, veuillez configurer vos informations de versement Wave/Orange Money.
								</p>
							</div>
						</div>
						<Button
							className="shrink-0 bg-slate-900 hover:bg-black text-white rounded-xl shadow-sm h-12 px-6 font-semibold transition-all"
							asChild
						>
							<Link href="/manage/settings/payments">
								Configurer maintenant <ArrowRight className="ml-2" size={18} />
							</Link>
						</Button>
					</div>
				)}

				{/* Grid */}
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-extrabold text-slate-900">Vos Boutiques</h2>
					<Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-200">
						{filteredStores.length} actives
					</Badge>
				</div>
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredStores.map((store) => {
						const m = metrics[store.id] || {
							totalRevenue: 0,
							totalOrders: 0,
							revenueTrend: 0,
							sparklineData: [],
						};
						const storeUrl = appUrl.replace("://", `://${store.slug}.`);
						const isPositive = m.revenueTrend >= 0;

						return (
							<div
								key={store.id}
								className="group relative bg-white border border-slate-200 rounded-3xl p-6 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col min-h-[220px]"
							>
								{/* Card Header */}
								<div className="flex items-start justify-between mb-6">
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-slate-100 group-hover:text-slate-800 transition-colors">
											<StoreIcon size={24} />
										</div>
										<div className="overflow-hidden">
											<div className="flex items-center gap-2 mb-1">
												<h2 className="font-bold text-lg text-slate-900 group-hover:text-black truncate transition-colors">
													{store.name}
												</h2>
												<Badge variant="secondary" className="text-[10px] uppercase font-bold px-1.5 py-0">
													{store.subscriptionPlan}
												</Badge>
											</div>
											<div className="flex items-center gap-2">
												<p className="text-sm text-slate-500 font-medium truncate italic">{store.slug}</p>
												{store.status === "active" ? (
													<span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">
														<span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
														Actif
													</span>
												) : (
													<span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-full">
														<span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
														Pause
													</span>
												)}
											</div>
										</div>
									</div>

									{/* Dropdown Menu */}
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-slate-400 hover:text-slate-900 -mr-2"
											>
												<MoreVertical size={18} />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-48">
											<DropdownMenuLabel>Accès Rapide</DropdownMenuLabel>
											<DropdownMenuItem onClick={() => selectStoreAction(store.id)}>
												<Activity className="mr-2 h-4 w-4" /> Vue d'ensemble
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={async () => {
													await selectStoreAction(store.id);
													router.push("/manage/products");
												}}
											>
												<Package className="mr-2 h-4 w-4" /> Produits
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem onClick={() => toggleStoreStatusAction(store.id)}>
												<Settings className="mr-2 h-4 w-4" />{" "}
												{store.status === "active" ? "Mettre en pause" : "Activer"}
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => setArchiveConfirmId(store.id)}
												className="text-red-600 focus:text-red-600 focus:bg-red-50"
											>
												<Archive className="mr-2 h-4 w-4" /> Archiver
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								{/* Metrics Grid */}
								<div className="grid grid-cols-2 gap-4 mb-6 relative">
									<div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50">
										<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
											Commandes
										</p>
										<p className="text-2xl font-black text-slate-800 tracking-tight">{m.totalOrders}</p>
									</div>
									<div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50 relative overflow-hidden flex flex-col justify-between">
										<div className="relative z-10">
											<div className="flex items-center justify-between mb-1.5">
												<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
													Revenu Brut
												</p>
												{m.totalRevenue > 0 && (
													<span
														className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isPositive ? "text-emerald-700 bg-emerald-100" : "text-rose-700 bg-rose-100"}`}
													>
														{isPositive ? "+" : ""}
														{m.revenueTrend}%
													</span>
												)}
											</div>
											<p className="text-xl font-black text-slate-800 tracking-tight truncate">
												{formatMoney({
													amount: BigInt(m.totalRevenue),
													currency: CURRENCY,
													locale: LOCALE,
												})}
											</p>
										</div>
										<div className="absolute bottom-0 left-0 right-0 opacity-20 pointer-events-none">
											{m.sparklineData.length > 0 && (
												<Sparkline
													data={m.sparklineData}
													width={160}
													height={40}
													color={isPositive ? "#10b981" : "#f43f5e"}
													strokeWidth={2.5}
													className="w-full"
												/>
											)}
										</div>
									</div>
								</div>

								{/* Archive Confirmation Overlay */}
								{archiveConfirmId === store.id && (
									<div className="absolute inset-0 bg-white/95 rounded-3xl flex flex-col items-center justify-center gap-4 z-10 p-6">
										<p className="text-sm font-bold text-center text-slate-900">
											Archiver <span className="text-black">{store.name}</span> ?
											<br />
											<span className="font-normal text-slate-500">Elle ne sera plus visible.</span>
										</p>
										<div className="flex gap-3">
											<button
												type="button"
												onClick={() => {
													archiveStoreAction(store.id);
													setArchiveConfirmId(null);
												}}
												className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700"
											>
												Oui, archiver
											</button>
											<button
												type="button"
												onClick={() => setArchiveConfirmId(null)}
												className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200"
											>
												Annuler
											</button>
										</div>
									</div>
								)}

								{/* Actions */}
								<div className="mt-auto pt-6 border-t border-slate-100 flex items-center gap-3">
									<button
										type="button"
										onClick={() => selectStoreAction(store.id)}
										className="flex-1 h-12 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-black hover:shadow-lg transition-all"
									>
										Gérer la boutique
									</button>
									<Button
										variant="outline"
										size="icon"
										className="h-12 w-12 rounded-xl border-slate-200 text-slate-500 hover:text-slate-900 focus:ring-2 focus:ring-slate-900"
										asChild
										title="Voir le site"
									>
										<Link href={storeUrl} target="_blank">
											<ExternalLink size={20} />
										</Link>
									</Button>
								</div>
							</div>
						);
					})}

					{filteredStores.length === 0 && (
						<div className="col-span-full py-20 bg-slate-100/50 rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
							<Building2 size={48} className="mb-4 opacity-20" />
							<p className="text-lg font-medium">Aucune boutique trouvée</p>
							<p className="text-sm">Essayez un autre mot-clé ou créez une boutique.</p>
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
