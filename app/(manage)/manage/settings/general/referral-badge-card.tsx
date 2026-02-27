"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { updateReferralBadge } from "./actions";

type Props = {
	showReferralBadge: boolean;
};

export function ReferralBadgeCard({ showReferralBadge }: Props) {
	const [isLoading, setIsLoading] = useState(false);
	const [isActive, setIsActive] = useState(showReferralBadge);

	async function handleSave() {
		setIsLoading(true);

		const result = await updateReferralBadge(isActive);

		if (result.success) {
			toast.success("Referral badge setting saved.");
		} else {
			toast.error(result.error || "Failed to save referral badge setting.");
		}

		setIsLoading(false);
	}

	return (
		<div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col">
			<div className="border-b-4 border-black p-4 bg-neutral-100 flex flex-col justify-center">
				<h2 className="text-sm font-black text-black uppercase tracking-widest">Badge de Parrainage</h2>
				<p className="mt-1 text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
					Passez à un plan supérieur pour masquer le badge 'Fait avec YNS' de votre vitrine.
				</p>
			</div>

			<div className="p-6">
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
					<div className="flex items-center space-x-3">
						<Switch
							id="referral-badge"
							checked={isActive}
							onCheckedChange={setIsActive}
							className="border-2 border-black data-[state=checked]:bg-black data-[state=unchecked]:bg-neutral-200"
						/>
						<label
							htmlFor="referral-badge"
							className="cursor-pointer text-[10px] font-bold text-black uppercase tracking-widest"
						>
							Afficher le Badge de Parrainage
						</label>
					</div>

					<button
						type="button"
						onClick={handleSave}
						disabled={isLoading || showReferralBadge === isActive}
						className="h-10 px-6 border-2 border-black bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-white hover:text-black hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all duration-200 disabled:opacity-50 flex items-center"
					>
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Enregistrer
					</button>
				</div>
			</div>
		</div>
	);
}
