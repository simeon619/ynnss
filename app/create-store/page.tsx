"use client";

import { ArrowRight, Loader2, StoreIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createStoreAction } from "./actions";

export default function CreateStorePage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	async function handleSubmit(formData: FormData) {
		setIsLoading(true);
		try {
			await createStoreAction(formData);
			toast.success("Boutique créée avec succès !");
			router.push("/manage");
		} catch (error: unknown) {
			toast.error(error instanceof Error ? error.message : "Erreur lors de la création.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
			<div className="w-full max-w-md bg-white border rounded-2xl p-8 shadow-sm">
				<div className="flex justify-center mb-6">
					<div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
						<StoreIcon className="h-8 w-8 text-blue-600" />
					</div>
				</div>

				<h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Créez votre boutique</h1>
				<p className="text-center text-slate-500 mb-8">
					Donnez un nom à votre nouvel espace de vente. Vous pourrez le modifier plus tard.
				</p>

				<form action={handleSubmit} className="space-y-6">
					<div className="space-y-2">
						<label htmlFor="name" className="text-sm font-medium text-slate-700">
							Nom de la boutique
						</label>
						<input
							type="text"
							id="name"
							name="name"
							required
							disabled={isLoading}
							placeholder="Ex: Ma Super Boutique"
							className="w-full h-11 px-4 rounded-xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
						/>
					</div>

					<Button type="submit" className="w-full h-11 rounded-xl text-base" disabled={isLoading}>
						{isLoading ? (
							<Loader2 className="h-5 w-5 animate-spin" />
						) : (
							<span className="flex items-center gap-2">
								Créer ma boutique <ArrowRight className="h-4 w-4" />
							</span>
						)}
					</Button>
				</form>
			</div>
		</main>
	);
}
