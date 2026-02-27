"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateCompanyAddress } from "./actions";

type Props = {
	settings: {
		fullName: string | null;
		companyName: string | null;
		taxId: string | null;
		address1: string | null;
		address2: string | null;
		postalCode: string | null;
		city: string | null;
		state: string | null;
		country: string | null;
		phone: string | null;
	};
};

export function CompanyAddressCard({ settings }: Props) {
	const [isLoading, setIsLoading] = useState(false);
	const [country, setCountry] = useState(settings.country || "CI"); // Default to Cote d'Ivoire

	async function handleSubmit(formData: FormData) {
		setIsLoading(true);

		formData.set("country", country);

		const result = await updateCompanyAddress(formData);

		if (result.success) {
			toast.success("Company address saved successfully.");
		} else {
			toast.error(result.error || "Failed to save address.");
		}

		setIsLoading(false);
	}

	return (
		<div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col">
			<div className="border-b-4 border-black p-4 bg-neutral-100 flex flex-col justify-center">
				<h2 className="text-sm font-black text-black uppercase tracking-widest">
					Adresse de l'Entreprise / Boutique
				</h2>
				<p className="mt-1 text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
					Cette adresse apparaîtra sur vos factures et vos communications clients.
				</p>
			</div>

			<div className="p-6">
				<form action={handleSubmit} className="space-y-6">
					{/* Name & Company */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-2">
							<label
								htmlFor="fullName"
								className="text-[10px] font-bold text-black uppercase tracking-widest"
							>
								Nom Complet
							</label>
							<input
								type="text"
								id="fullName"
								name="fullName"
								defaultValue={settings.fullName || ""}
								placeholder="Jane Doe"
								required
								className="w-full h-12 px-3 border-2 border-black bg-white text-sm font-mono focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
							/>
						</div>
						<div className="space-y-2">
							<label
								htmlFor="companyName"
								className="text-[10px] font-bold text-black uppercase tracking-widest"
							>
								Entreprise (Optionnel)
							</label>
							<input
								type="text"
								id="companyName"
								name="companyName"
								defaultValue={settings.companyName || ""}
								placeholder="Votre Super Boutique Inc."
								className="w-full h-12 px-3 border-2 border-black bg-white text-sm font-mono focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<label htmlFor="taxId" className="text-[10px] font-bold text-black uppercase tracking-widest">
							ID Fiscale (Optionnel)
						</label>
						<input
							type="text"
							id="taxId"
							name="taxId"
							defaultValue={settings.taxId || ""}
							placeholder="ex. CI123456789"
							className="w-full h-12 px-3 border-2 border-black bg-white text-sm font-mono focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
						/>
					</div>

					{/* Address Line 1 */}
					<div className="space-y-2">
						<label htmlFor="address1" className="text-[10px] font-bold text-black uppercase tracking-widest">
							Adresse
						</label>
						<input
							type="text"
							id="address1"
							name="address1"
							defaultValue={settings.address1 || ""}
							placeholder="123 Rue du Commerce"
							required
							className="w-full h-12 px-3 border-2 border-black bg-white text-sm font-mono focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
						/>
					</div>

					{/* Address Line 2 */}
					<div className="space-y-2">
						<label htmlFor="address2" className="text-[10px] font-bold text-black uppercase tracking-widest">
							Complément (Optionnel)
						</label>
						<input
							type="text"
							id="address2"
							name="address2"
							defaultValue={settings.address2 || ""}
							placeholder="Appartement, Étage, etc."
							className="w-full h-12 px-3 border-2 border-black bg-white text-sm font-mono focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
						/>
					</div>

					{/* Geography row 1 */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-2">
							<label
								htmlFor="postalCode"
								className="text-[10px] font-bold text-black uppercase tracking-widest"
							>
								Code Postal
							</label>
							<input
								type="text"
								id="postalCode"
								name="postalCode"
								defaultValue={settings.postalCode || ""}
								placeholder="00225"
								required
								className="w-full h-12 px-3 border-2 border-black bg-white text-sm font-mono focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="city" className="text-[10px] font-bold text-black uppercase tracking-widest">
								Ville
							</label>
							<input
								type="text"
								id="city"
								name="city"
								defaultValue={settings.city || ""}
								placeholder="Abidjan"
								required
								className="w-full h-12 px-3 border-2 border-black bg-white text-sm font-mono focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
							/>
						</div>
					</div>

					{/* Geography row 2 */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-2">
							<label htmlFor="state" className="text-[10px] font-bold text-black uppercase tracking-widest">
								Région / État
							</label>
							<input
								type="text"
								id="state"
								name="state"
								defaultValue={settings.state || ""}
								placeholder="Lagunes"
								className="w-full h-12 px-3 border-2 border-black bg-white text-sm font-mono focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="country" className="text-[10px] font-bold text-black uppercase tracking-widest">
								Pays
							</label>
							<Select value={country} onValueChange={setCountry}>
								<SelectTrigger className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-0">
									<SelectValue placeholder="Sélectionnez un pays" />
								</SelectTrigger>
								<SelectContent className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
									<SelectItem value="CI" className="rounded-none font-mono">
										Côte d'Ivoire
									</SelectItem>
									<SelectItem value="SN" className="rounded-none font-mono">
										Senegal
									</SelectItem>
									<SelectItem value="FR" className="rounded-none font-mono">
										France
									</SelectItem>
									<SelectItem value="US" className="rounded-none font-mono">
										United States
									</SelectItem>
									<SelectItem value="GH" className="rounded-none font-mono">
										Ghana
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<label htmlFor="phone" className="text-[10px] font-bold text-black uppercase tracking-widest">
							Téléphone
						</label>
						<input
							type="tel"
							id="phone"
							name="phone"
							defaultValue={settings.phone || ""}
							placeholder="+225 0123456789"
							className="w-full h-12 px-3 border-2 border-black bg-white text-sm font-mono focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
						/>
					</div>

					<div className="pt-4 flex justify-end">
						<button
							type="submit"
							disabled={isLoading}
							className="h-10 px-6 border-2 border-black bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-white hover:text-black hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all duration-200 disabled:opacity-50 flex items-center"
						>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Enregistrer l'adresse
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
