"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateGeneralSettings } from "./actions";

type Props = {
	settings: {
		name: string;
		currency: string;
		language: string;
	};
};

export function GeneralCard({ settings }: Props) {
	const [isLoading, setIsLoading] = useState(false);
	const [currency, setCurrency] = useState(settings.currency);
	const [language, setLanguage] = useState(settings.language);

	async function handleSubmit(formData: FormData) {
		setIsLoading(true);

		// Manually append the select values since they aren't part of standard Form element data
		formData.set("currency", currency);
		formData.set("language", language);

		const result = await updateGeneralSettings(formData);

		if (result.success) {
			toast.success("General settings saved successfully.");
		} else {
			toast.error(result.error || "Failed to save settings.");
		}

		setIsLoading(false);
	}

	return (
		<div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col rounded-none overflow-hidden">
			<div className="border-b-4 border-black p-6 bg-white flex flex-col justify-center">
				<h2 className="text-xl font-black text-black uppercase tracking-tight">Paramètres Généraux</h2>
				<p className="mt-2 text-xs font-mono font-bold text-black uppercase tracking-widest leading-relaxed">
					Ces informations sont utilisées pour identifier de manière unique votre boutique.
				</p>
			</div>

			<div className="p-8">
				<form action={handleSubmit} className="space-y-8">
					<div className="space-y-3">
						<label htmlFor="name" className="text-[10px] font-black text-black uppercase tracking-[0.2em]">
							Nom de la Boutique
						</label>
						<input
							type="text"
							id="name"
							name="name"
							defaultValue={settings.name}
							required
							className="w-full h-12 px-4 border-4 border-black bg-white text-sm font-black uppercase tracking-widest focus:outline-none focus:bg-black focus:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-none"
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						<div className="space-y-3">
							<label
								htmlFor="currency"
								className="text-[10px] font-black text-black uppercase tracking-[0.2em]"
							>
								Devise
							</label>
							<Select value={currency} onValueChange={setCurrency}>
								<SelectTrigger className="h-12 border-4 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-0 font-black uppercase text-xs tracking-widest">
									<SelectValue placeholder="SÉLECTIONNEZ LA DEVISE" />
								</SelectTrigger>
								<SelectContent className="border-4 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-0 bg-white">
									<SelectItem
										value="XOF"
										className="rounded-none font-black uppercase text-xs tracking-widest p-3 focus:bg-black focus:text-white"
									>
										FCFA (XOF)
									</SelectItem>
									<SelectItem
										value="USD"
										className="rounded-none font-black uppercase text-xs tracking-widest p-3 focus:bg-black focus:text-white"
									>
										US DOLLAR (USD)
									</SelectItem>
									<SelectItem
										value="EUR"
										className="rounded-none font-black uppercase text-xs tracking-widest p-3 focus:bg-black focus:text-white"
									>
										EURO (EUR)
									</SelectItem>
									<SelectItem
										value="CAD"
										className="rounded-none font-black uppercase text-xs tracking-widest p-3 focus:bg-black focus:text-white"
									>
										CANADIAN DOLLAR (CAD)
									</SelectItem>
									<SelectItem
										value="GBP"
										className="rounded-none font-black uppercase text-xs tracking-widest p-3 focus:bg-black focus:text-white"
									>
										BRITISH POUND (GBP)
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-3">
							<label
								htmlFor="language"
								className="text-[10px] font-black text-black uppercase tracking-[0.2em]"
							>
								Langue
							</label>
							<Select value={language} onValueChange={setLanguage}>
								<SelectTrigger className="h-12 border-4 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-0 font-black uppercase text-xs tracking-widest">
									<SelectValue placeholder="SÉLECTIONNEZ LA LANGUE" />
								</SelectTrigger>
								<SelectContent className="border-4 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-0 bg-white">
									<SelectItem
										value="English (US)"
										className="rounded-none font-black uppercase text-xs tracking-widest p-3 focus:bg-black focus:text-white"
									>
										ENGLISH (US)
									</SelectItem>
									<SelectItem
										value="English (UK)"
										className="rounded-none font-black uppercase text-xs tracking-widest p-3 focus:bg-black focus:text-white"
									>
										ENGLISH (UK)
									</SelectItem>
									<SelectItem
										value="Français"
										className="rounded-none font-black uppercase text-xs tracking-widest p-3 focus:bg-black focus:text-white"
									>
										FRANÇAIS
									</SelectItem>
									<SelectItem
										value="Español"
										className="rounded-none font-black uppercase text-xs tracking-widest p-3 focus:bg-black focus:text-white"
									>
										ESPAÑOL
									</SelectItem>
									<SelectItem
										value="Deutsch"
										className="rounded-none font-black uppercase text-xs tracking-widest p-3 focus:bg-black focus:text-white"
									>
										DEUTSCH
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="pt-6 flex justify-end">
						<button
							type="submit"
							disabled={isLoading}
							className="h-14 px-8 border-4 border-black bg-black text-white text-xs font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-white hover:text-black hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-none disabled:opacity-50 flex items-center"
						>
							{isLoading && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
							ENREGISTRER LES PARAMÈTRES
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
