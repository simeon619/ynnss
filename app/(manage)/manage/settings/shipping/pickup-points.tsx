"use client";

import { Clock, MapPin, Navigation, Phone, Plus, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";
import { createPickupPoint, deletePickupPoint } from "@/app/(manage)/manage/actions";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

const LocationPicker = dynamic(() => import("@/components/shipping/location-picker-premium"), {
	ssr: false,
	loading: () => <div className="h-[300px] w-full bg-white border-4 border-black border-dashed" />,
});

interface PickupPoint {
	id: string;
	name: string;
	address: string;
	city: string;
	phone: string | null;
	openingHours: string | null;
	coordinates: { lat: number; lng: number } | null;
}

interface PickupPointsManagerProps {
	pickupPoints: PickupPoint[];
}

export function PickupPointsManager({ pickupPoints }: PickupPointsManagerProps) {
	const [isAdding, setIsAdding] = useState(false);
	const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

	return (
		<div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col rounded-none overflow-hidden">
			<div className="border-b-4 border-black bg-white p-6 flex flex-row items-center justify-between">
				<div>
					<h3 className="text-lg font-black text-black uppercase tracking-tight leading-none">
						Points de Retrait (Click & Collect)
					</h3>
					<p className="text-[10px] font-mono font-black text-black/60 uppercase tracking-widest mt-2">
						Gérez les emplacements physiques où vos clients peuvent récupérer leurs commandes.
					</p>
				</div>
				<Sheet open={isAdding} onOpenChange={setIsAdding}>
					<SheetTrigger asChild>
						<button
							type="button"
							className="text-xs font-black text-black uppercase tracking-widest border-4 border-black px-6 py-3 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-none flex items-center gap-3"
						>
							<Plus size={18} strokeWidth={4} /> Nouveau Point
						</button>
					</SheetTrigger>
					<SheetContent
						side="right"
						className="w-[90vw] sm:max-w-[540px] p-0 gap-0 border-l-4 border-black shadow-[-8px_0px_0px_0px_rgba(0,0,0,1)] overflow-y-auto rounded-none bg-white"
					>
						<div className="bg-white p-8 border-b-4 border-black sticky top-0 z-10">
							<SheetHeader>
								<SheetTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight text-black">
									<MapPin className="h-6 w-6 text-black" strokeWidth={4} />
									Ajouter un Point de Retrait
								</SheetTitle>
								<SheetDescription className="text-xs font-mono font-black text-black/60 uppercase tracking-widest mt-2">
									Configurez un nouvel emplacement pour le Click & Collect.
								</SheetDescription>
							</SheetHeader>
						</div>

						<form
							action={async (formData) => {
								if (coordinates) {
									formData.set("coordinates", JSON.stringify(coordinates));
								}
								try {
									await createPickupPoint(formData);
									toast.success("Point de retrait ajouté avec succès !");
									setIsAdding(false);
									setCoordinates(null);
								} catch (e) {
									toast.error("Erreur lors de l'ajout. Veuillez réessayer.");
								}
							}}
							className="p-8 space-y-8"
						>
							<div className="grid gap-8">
								{/* Basic Info Section */}
								<div className="space-y-6">
									<h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] flex items-center gap-3">
										<div className="w-3 h-3 bg-black" />
										Informations Générales
									</h4>

									<div className="grid gap-6">
										<div className="space-y-3">
											<label
												htmlFor="name"
												className="text-[10px] font-black uppercase tracking-widest text-black"
											>
												Nom du point (ex: Boutique Angré)
											</label>
											<div className="relative">
												<MapPin
													className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black"
													strokeWidth={3}
												/>
												<input
													id="name"
													name="name"
													placeholder="NOM DE LA BOUTIQUE..."
													className="w-full h-12 pl-12 border-4 border-black bg-white text-sm font-black uppercase tracking-widest placeholder:text-black/30 focus:outline-none focus:bg-black focus:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-none"
													required
												/>
											</div>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
											<div className="space-y-3">
												<label
													htmlFor="city"
													className="text-[10px] font-black uppercase tracking-widest text-black"
												>
													Ville
												</label>
												<div className="relative">
													<Navigation
														className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black"
														strokeWidth={3}
													/>
													<input
														id="city"
														name="city"
														placeholder="ABIDJAN"
														className="w-full h-12 pl-12 border-4 border-black bg-white text-sm font-black uppercase tracking-widest placeholder:text-black/30 focus:outline-none focus:bg-black focus:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-none"
														required
													/>
												</div>
											</div>
											<div className="space-y-3">
												<label
													htmlFor="phone"
													className="text-[10px] font-black uppercase tracking-widest text-black"
												>
													Téléphone
												</label>
												<div className="relative">
													<Phone
														className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black"
														strokeWidth={3}
													/>
													<input
														id="phone"
														name="phone"
														placeholder="+225 07..."
														className="w-full h-12 pl-12 border-4 border-black bg-white text-sm font-black uppercase tracking-widest placeholder:text-black/30 focus:outline-none focus:bg-black focus:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-none"
													/>
												</div>
											</div>
										</div>
									</div>
								</div>

								<div className="h-1 bg-black" />

								{/* Location Details */}
								<div className="space-y-6">
									<h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] flex items-center gap-3">
										<div className="w-3 h-3 bg-black" />
										Adresse & Horaires
									</h4>

									<div className="grid gap-6">
										<div className="space-y-3">
											<label
												htmlFor="address"
												className="text-[10px] font-black uppercase tracking-widest text-black"
											>
												Adresse Précise
											</label>
											<input
												id="address"
												name="address"
												placeholder="RUE, QUARTIER, REPÈRE..."
												className="w-full h-12 px-4 border-4 border-black bg-white text-sm font-black uppercase tracking-widest placeholder:text-black/30 focus:outline-none focus:bg-black focus:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-none"
												required
											/>
										</div>
										<div className="space-y-3">
											<label
												htmlFor="openingHours"
												className="text-[10px] font-black uppercase tracking-widest text-black"
											>
												Horaires d'ouverture
											</label>
											<div className="relative">
												<Clock
													className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black"
													strokeWidth={3}
												/>
												<input
													id="openingHours"
													name="openingHours"
													placeholder="LUN-SAM 9H00 - 19H30"
													className="w-full h-12 pl-12 border-4 border-black bg-white text-sm font-black uppercase tracking-widest placeholder:text-black/30 focus:outline-none focus:bg-black focus:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-none"
												/>
											</div>
										</div>
									</div>
								</div>

								<div className="h-1 bg-black" />

								{/* Map Section */}
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<label className="text-[10px] font-black uppercase tracking-widest text-black">
											Position GPS Exacte (Optionnel)
										</label>
										<span className="text-[9px] font-mono font-black text-black/40 uppercase">
											CLIQUEZ SUR LA CARTE POUR PLACER LE REPÈRE
										</span>
									</div>
									<div className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white group">
										<LocationPicker onChange={setCoordinates} />
									</div>
								</div>
							</div>

							<div className="pt-4 pb-12">
								<button
									type="submit"
									className="w-full h-16 border-4 border-black bg-black text-white text-base font-black uppercase tracking-[0.2em] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:bg-white hover:text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-none flex items-center justify-center gap-4"
								>
									<Plus size={24} strokeWidth={4} /> ENREGISTRER LE POINT DE RETRAIT
								</button>
							</div>
						</form>
					</SheetContent>
				</Sheet>
			</div>
			<div className="p-8">
				{pickupPoints.length === 0 ? (
					<div className="text-center py-24 border-4 border-dashed border-black bg-white flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						<div className="w-20 h-20 border-4 border-black bg-white flex items-center justify-center mb-6">
							<MapPin size={40} className="text-black/20" strokeWidth={3} />
						</div>
						<p className="text-lg font-black uppercase tracking-[0.2em] text-black">
							Aucun point de retrait configuré.
						</p>
						<p className="text-xs font-mono font-black text-black/60 uppercase tracking-widest mt-2">
							Ajoutez votre premier magasin pour activer le Click & Collect.
						</p>
					</div>
				) : (
					<div className="grid gap-8 md:grid-cols-2">
						{pickupPoints.map((point) => (
							<div
								key={point.id}
								className="group border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-none"
							>
								<div className="flex justify-between items-start mb-4">
									<h3 className="font-black text-lg uppercase tracking-tight text-black">{point.name}</h3>
									<button
										type="button"
										className="border-4 border-black p-2 bg-white hover:bg-red-600 hover:text-white transition-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
										onClick={async () => {
											if (confirm("Supprimer ce point de retrait ?")) {
												await deletePickupPoint(point.id);
												toast.success("Point supprimé.");
											}
										}}
									>
										<Trash2 size={18} strokeWidth={3} />
									</button>
								</div>
								<div className="space-y-2.5 text-xs font-mono font-black uppercase tracking-widest text-black/60">
									<div className="flex items-center gap-3">
										<MapPin size={16} className="text-black" strokeWidth={3} />
										<span className="text-black">
											{point.address}, {point.city}
										</span>
									</div>
									{point.phone && (
										<div className="flex items-center gap-3">
											<Phone size={16} className="text-black" strokeWidth={3} />
											<span className="text-black">{point.phone}</span>
										</div>
									)}
									{point.openingHours && (
										<div className="flex items-center gap-3">
											<Clock size={16} className="text-black" strokeWidth={3} />
											<span className="text-black">{point.openingHours}</span>
										</div>
									)}
								</div>
								{point.coordinates && (
									<div className="mt-6 flex items-center gap-2 text-[10px] font-mono font-black border-2 border-black bg-black text-white px-3 py-1.5 w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase">
										<Navigation size={12} strokeWidth={3} />
										{point.coordinates.lat.toFixed(5)}, {point.coordinates.lng.toFixed(5)}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
