import { Truck } from "lucide-react";
import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getActiveStoreContext } from "@/lib/auth";
import { getTenantDb } from "@/lib/db";
import { AddZoneDialog } from "./add-zone-dialog";
import { PickupPointsManager } from "./pickup-points";
import { ZoneCard } from "./zone-card";

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

export default async function ShippingPage() {
	const _storeId = await getActiveStoreContext();
	if (!_storeId) throw new Error("No active store");
	const db = await getTenantDb(_storeId);
	const zones = (await db.query.shippingZones.findMany({
		with: { rates: true },
	})) as ShippingZone[];

	const allPickupPoints = await db.query.pickupPoints.findMany();

	return (
		<div className="space-y-6 pb-16">
			<DashboardHeader
				title="EXPÉDITION & RETRAIT"
				description="Gérez vos zones de livraison et tarifs associés."
			>
				<Suspense fallback={<div className="h-10 w-36 bg-white border-4 border-black border-dashed" />}>
					<AddZoneDialog zones={zones.map((z) => ({ id: z.id, name: z.name }))} />
				</Suspense>
			</DashboardHeader>

			<div className="space-y-12 pt-8">
				{zones.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-24 text-center bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						<div className="w-20 h-20 border-4 border-black flex items-center justify-center mb-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
							<Truck size={40} className="text-black" strokeWidth={3} />
						</div>
						<h3 className="text-lg font-black uppercase tracking-[0.2em] text-black mb-2">
							Aucune zone configurée
						</h3>
						<p className="text-xs text-black font-black uppercase tracking-widest max-w-sm">
							Commencez par ajouter une zone (ex: "Abidjan" ou "National") pour proposer des modes de
							livraison.
						</p>
					</div>
				) : (
					zones.map((zone) => <ZoneCard key={zone.id} zone={zone} allPickupPoints={allPickupPoints} />)
				)}
			</div>

			<div className="space-y-8 pt-16">
				<div className="flex items-center gap-6">
					<h2 className="text-lg font-black text-black uppercase tracking-[0.2em]">Points de Retrait</h2>
					<div className="flex-1 h-1 bg-black" />
				</div>
				<Suspense
					fallback={<div className="h-[400px] w-full bg-white border-4 border-black border-dashed" />}
				>
					<PickupPointsManager pickupPoints={allPickupPoints} />
				</Suspense>
			</div>
		</div>
	);
}
