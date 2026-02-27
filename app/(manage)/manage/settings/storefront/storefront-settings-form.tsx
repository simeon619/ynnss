"use client";

import { ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateStorefrontSettings } from "./actions";

interface StorefrontSettingsFormProps {
	initialSettings: {
		heroTitle: string | null;
		heroSubtitle: string | null;
		heroImage: string | null;
	};
}

export function StorefrontSettingsForm({ initialSettings }: StorefrontSettingsFormProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const [heroTitle, setHeroTitle] = useState(initialSettings.heroTitle || "");
	const [heroSubtitle, setHeroSubtitle] = useState(initialSettings.heroSubtitle || "");
	const [heroImage, setHeroImage] = useState(initialSettings.heroImage || "");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!heroTitle.trim() || !heroSubtitle.trim()) {
			toast.error("Le titre et le sous-titre sont obligatoires.");
			return;
		}

		startTransition(async () => {
			try {
				await updateStorefrontSettings({
					heroTitle: heroTitle.trim(),
					heroSubtitle: heroSubtitle.trim(),
					heroImage: heroImage.trim() || null,
				});

				toast.success("Paramètres de la vitrine mis à jour", {
					description: "Les modifications seront visibles sur votre boutique immédiatement.",
				});
				router.refresh();
			} catch (err: unknown) {
				const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue.";
				toast.error(errorMessage);
			}
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-12 pb-16">
			<div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden rounded-none">
				<div className="p-8 border-b-4 border-black bg-white flex items-center gap-6">
					<div className="p-4 border-4 border-black bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						<ImageIcon className="h-8 w-8" strokeWidth={3} />
					</div>
					<div className="space-y-2">
						<h3 className="text-xl font-black uppercase tracking-tight text-black">
							En-tête de page (Hero Section)
						</h3>
						<p className="text-xs font-mono font-black text-black/60 uppercase tracking-widest leading-none">
							C'est la première chose que vos clients voient en arrivant sur votre boutique.
						</p>
					</div>
				</div>

				<div className="p-8 space-y-12">
					<div className="space-y-4">
						<label htmlFor="heroTitle" className="text-xs font-black uppercase tracking-[0.2em] text-black">
							Titre principal <span className="text-red-600 font-black">*</span>
						</label>
						<input
							id="heroTitle"
							value={heroTitle}
							onChange={(e) => setHeroTitle(e.target.value)}
							placeholder="EX: NOUVELLE COLLECTION 2026"
							className="w-full h-16 px-6 border-4 border-black bg-white text-2xl font-black uppercase tracking-tight focus:outline-none focus:bg-black focus:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-none placeholder:text-black/20"
							required
						/>
						<p className="text-[10px] font-mono font-black text-black/60 uppercase tracking-widest px-1">
							Privilégiez un titre court et impactant.
						</p>
					</div>

					<div className="space-y-4">
						<label
							htmlFor="heroSubtitle"
							className="text-xs font-black uppercase tracking-[0.2em] text-black"
						>
							Sous-titre <span className="text-red-600 font-black">*</span>
						</label>
						<textarea
							id="heroSubtitle"
							value={heroSubtitle}
							onChange={(e) => setHeroSubtitle(e.target.value)}
							placeholder="EX: DÉCOUVREZ NOS DERNIERS ARRIVAGES..."
							className="w-full min-h-[160px] p-6 border-4 border-black bg-white text-base font-black uppercase tracking-wide leading-relaxed focus:outline-none focus:bg-black focus:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-none placeholder:text-black/20 resize-none"
							required
						/>
						<p className="text-[10px] font-mono font-black text-black/60 uppercase tracking-widest px-1">
							Décrivez votre boutique ou mettez en avant une offre (2-3 lignes max).
						</p>
					</div>

					<div className="pt-12 border-t-4 border-black">
						<label
							htmlFor="heroImage"
							className="text-xs font-black uppercase tracking-[0.2em] text-black block mb-6"
						>
							Image de fond (URL optionnelle)
						</label>
						<div className="flex flex-col md:flex-row gap-8 items-start">
							<div className="relative w-full md:w-64 h-40 border-4 border-black bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
								{heroImage ? (
									<Image
										src={heroImage}
										alt="Aperçu"
										fill
										className="object-cover"
										onError={() => {
											setHeroImage("");
											toast.error("L'URL de l'image semble invalide.");
										}}
									/>
								) : (
									<ImageIcon size={48} className="text-black/10" strokeWidth={3} />
								)}
							</div>
							<div className="flex-1 w-full space-y-4">
								<input
									id="heroImage"
									value={heroImage}
									onChange={(e) => setHeroImage(e.target.value)}
									placeholder="HTTPS://IMAGES.UNSPLASH.COM/..."
									className="w-full h-14 px-6 border-4 border-black bg-white text-xs font-black uppercase focus:outline-none focus:bg-black focus:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-none placeholder:text-black/20"
								/>
								<p className="text-[10px] font-mono font-black text-black/60 uppercase tracking-widest leading-relaxed">
									Saisissez le lien d'une image haute résolution. Laissez vide pour utiliser l'image par
									défaut.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="flex flex-col sm:flex-row justify-end gap-8 pt-6">
				<button
					type="button"
					onClick={() => router.back()}
					disabled={isPending}
					className="h-16 px-10 border-4 border-black bg-white text-black text-sm font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-none disabled:opacity-50"
				>
					Annuler
				</button>
				<button
					type="submit"
					disabled={isPending}
					className="h-16 px-12 bg-black text-white text-sm font-black uppercase tracking-[0.2em] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-none disabled:opacity-50 inline-flex items-center gap-4"
				>
					{isPending ? <Loader2 className="h-6 w-6 animate-spin" strokeWidth={3} /> : null}
					{isPending ? "ENREGISTREMENT..." : "SAUVEGARDER LES MODIFICATIONS"}
				</button>
			</div>
		</form>
	);
}
