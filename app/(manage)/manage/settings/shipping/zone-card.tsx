"use client";

import { ChevronDown, MapPin, Store, Trash2, Truck } from "lucide-react";
import { useState } from "react";
import { CURRENCY, LOCALE } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { deleteShippingRate, deleteShippingZone } from "../../actions";
import { CreateRateDialog } from "./create-rate-dialog";
import { EditRateDialog } from "./edit-rate-dialog";

type ShippingRate = {
	id: string;
	name: string;
	price: string;
	minAmount: string | null;
	minWeight: number | null;
	maxWeight: number | null;
	deliveryTime: string | null;
	pickupPointId: string | null;
};

type ShippingZone = {
	id: string;
	name: string;
	cities: string[] | null;
	rates: ShippingRate[];
};

export function ZoneCard({
	zone,
	allPickupPoints,
}: {
	zone: ShippingZone;
	allPickupPoints: { id: string; name: string; city: string; [key: string]: unknown }[];
}) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col mb-12 last:mb-0 rounded-none overflow-hidden">
			<div
				className="border-b-4 border-black bg-white flex flex-row items-center justify-between p-6 cursor-pointer hover:bg-black hover:text-white group transition-none"
				onClick={() => setIsExpanded(!isExpanded)}
				onKeyDown={(e) => e.key === "Enter" && setIsExpanded(!isExpanded)}
				role="button"
				tabIndex={0}
			>
				<div className="flex items-center gap-6">
					<div className="w-12 h-12 border-4 border-black bg-white group-hover:bg-white group-hover:text-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-none">
						<MapPin size={24} className="text-black" strokeWidth={3} />
					</div>
					<div>
						<h3 className="text-lg font-black text-black group-hover:text-white uppercase tracking-tight">
							{zone.name}
						</h3>
						<div className="flex flex-wrap gap-2 mt-2">
							{zone.cities && zone.cities.length > 0 ? (
								zone.cities.map((city: string) => (
									<span
										key={city}
										className="text-[10px] font-black text-black group-hover:text-black group-hover:bg-white uppercase tracking-widest border-2 border-black px-2 py-0.5 bg-white"
									>
										{city}
									</span>
								))
							) : (
								<span className="text-[10px] font-mono font-black text-black group-hover:text-white uppercase tracking-widest leading-none">
									TOUTES LES VILLES
								</span>
							)}
						</div>
					</div>
				</div>
				<div className="flex items-center gap-6">
					<div className="hidden sm:block text-[10px] font-black text-black group-hover:text-black group-hover:bg-white uppercase tracking-widest border-4 border-black px-3 py-1 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						{zone.rates.length} TARIF(S)
					</div>
					<form action={deleteShippingZone.bind(null, zone.id)} onClick={(e) => e.stopPropagation()}>
						<button
							type="submit"
							className="text-[10px] font-black text-black group-hover:text-black uppercase tracking-widest border-4 border-black px-4 py-2 bg-white hover:bg-red-600 hover:text-white transition-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
						>
							<span className="hidden sm:inline">SUPPRIMER</span>
							<Trash2 size={14} className="sm:hidden" strokeWidth={3} />
						</button>
					</form>
					<div
						className={cn("text-black group-hover:text-white transition-none", isExpanded && "rotate-180")}
					>
						<ChevronDown size={24} strokeWidth={4} />
					</div>
				</div>
			</div>

			{isExpanded && (
				<div className="flex flex-col bg-white">
					<div className="divide-y-4 divide-black">
						{zone.rates.length === 0 ? (
							<div className="p-16 text-center flex flex-col items-center">
								<p className="text-sm font-black text-black uppercase tracking-[0.2em]">Aucun tarif défini</p>
								<p className="text-xs font-mono font-black text-black/60 mt-2 uppercase tracking-widest">
									Ajoutez un tarif de livraison ou de retrait.
								</p>
							</div>
						) : (
							zone.rates.map((rate) => (
								<div
									key={rate.id}
									className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 hover:bg-black hover:text-white group/rate transition-none"
								>
									<div className="flex items-center gap-6">
										<div
											className={cn(
												"h-12 w-12 border-4 border-black flex items-center justify-center shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover/rate:bg-white group-hover/rate:text-black transition-none",
												rate.pickupPointId ? "bg-white" : "bg-white",
											)}
										>
											{rate.pickupPointId ? (
												<Store size={22} className="text-black" strokeWidth={3} />
											) : (
												<Truck size={22} className="text-black" strokeWidth={3} />
											)}
										</div>
										<div className="min-w-0">
											<p className="text-base font-black text-black group-hover/rate:text-white uppercase tracking-tight truncate">
												{rate.name}
											</p>
											<div className="flex flex-wrap items-center gap-x-4 mt-1">
												{rate.minAmount && rate.minAmount !== "0" && (
													<span className="text-[10px] font-black text-black group-hover/rate:text-white uppercase tracking-widest whitespace-nowrap leading-none">
														DÈS{" "}
														{formatMoney({
															amount: BigInt(rate.minAmount),
															currency: CURRENCY,
															locale: LOCALE,
														})}
													</span>
												)}
												{(rate.minWeight !== null || rate.maxWeight !== null) && (
													<span className="text-[10px] font-mono text-black/60 group-hover/rate:text-white/60 font-black uppercase tracking-widest leading-none">
														{rate.minWeight ?? 0}KG - {rate.maxWeight ?? "∞"}KG
													</span>
												)}
												{rate.deliveryTime && (
													<span className="text-[10px] font-mono text-black/60 group-hover/rate:text-white/60 font-black uppercase tracking-widest leading-none">
														{rate.deliveryTime}
													</span>
												)}
												{rate.pickupPointId && (
													<span className="text-[10px] font-black text-black group-hover/rate:text-white uppercase tracking-widest flex items-center gap-1 leading-none underline decoration-2 underline-offset-4">
														<MapPin size={10} strokeWidth={3} />
														{
															allPickupPoints.find(
																(p: Record<string, unknown>) => p.id === rate.pickupPointId,
															)?.name as string
														}
													</span>
												)}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-6">
										<div className="text-xl font-black text-black group-hover/rate:text-white font-mono tracking-tighter tabular-nums">
											{rate.price === "0"
												? "GRATUIT"
												: formatMoney({
														amount: BigInt(rate.price),
														currency: CURRENCY,
														locale: LOCALE,
													})}
										</div>
										<EditRateDialog rate={rate} pickupPoints={allPickupPoints} />
										<form action={deleteShippingRate.bind(null, rate.id)}>
											<button
												type="submit"
												className="w-10 h-10 border-4 border-black flex items-center justify-center bg-white text-black hover:bg-red-600 hover:text-white transition-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
											>
												<Trash2 size={18} strokeWidth={3} />
											</button>
										</form>
									</div>
								</div>
							))
						)}
					</div>
					<div className="p-6 bg-white border-t-4 border-black flex justify-center">
						<CreateRateDialog zoneId={zone.id} pickupPoints={allPickupPoints} />
					</div>
				</div>
			)}
		</div>
	);
}
