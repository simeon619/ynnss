"use client";

import { Loader2, RefreshCw, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createCoupon, updateCoupon } from "./actions";

interface Coupon {
	id: string;
	code: string;
	type: "percentage" | "fixed";
	value: number;
	minAmount: string | null;
	maxUsage: number | null;
	usedCount: number | null;
	expiresAt: Date | null;
	status: string | null;
}

export function DiscountForm({ initialData }: { initialData?: Coupon }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const [code, setCode] = useState(initialData?.code || "");
	const [type, setType] = useState<"percentage" | "fixed">(initialData?.type || "percentage");
	const [value, setValue] = useState(initialData?.value?.toString() || "");
	const [minAmount, setMinAmount] = useState(initialData?.minAmount || "");
	const [maxUsage, setMaxUsage] = useState(initialData?.maxUsage?.toString() || "");
	const [hasExpiration, setHasExpiration] = useState(!!initialData?.expiresAt);
	const [expiresAt, setExpiresAt] = useState(
		initialData?.expiresAt ? new Date(initialData.expiresAt).toISOString().split("T")[0] : "",
	);

	const generateRandomCode = () => {
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		let result = "";
		for (let i = 0; i < 8; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		setCode(result);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!code || !value) {
			toast.error("Veuillez remplir les champs obligatoires");
			return;
		}

		startTransition(async () => {
			try {
				const data = {
					code,
					type,
					value: Number(value),
					minAmount: minAmount || undefined,
					maxUsage: maxUsage ? Number.parseInt(maxUsage, 10) : null,
					expiresAt: hasExpiration && expiresAt ? new Date(expiresAt) : null,
				};

				if (initialData) {
					await updateCoupon(initialData.id, data);
					toast.success("Code promo mis à jour");
				} else {
					await createCoupon(data);
					toast.success("Code promo créé");
				}

				router.push("/manage/discounts");
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
				toast.error(errorMessage);
			}
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-10 pb-12 overflow-visible">
			<div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
				<div className="p-6 border-b-4 border-black bg-black flex items-center gap-4">
					<div className="p-3 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
						<Tag className="h-6 w-6 text-black" strokeWidth={3} />
					</div>
					<div className="space-y-1">
						<h3 className="text-sm font-black uppercase tracking-[0.2em] text-black">
							Configuration du Code Promo
						</h3>
						<p className="text-[10px] font-mono font-bold text-white uppercase tracking-widest leading-none">
							Définissez les règles et la valeur de votre réduction.
						</p>
					</div>
				</div>

				<div className="p-8 space-y-10">
					{/* Code and Basic Settings */}
					<div className="space-y-6">
						<div className="space-y-3">
							<label htmlFor="code" className="text-[10px] font-black uppercase tracking-[0.2em] text-black">
								Code Promo <span className="text-red-500">*</span>
							</label>
							<div className="flex flex-col md:flex-row gap-4">
								<input
									id="code"
									placeholder="EX: SUMMER2026"
									value={code}
									onChange={(e) => setCode(e.target.value.toUpperCase())}
									className="flex-1 h-12 px-4 border-2 border-black bg-white text-lg font-mono font-black uppercase tracking-widest focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
									required
								/>
								<button
									type="button"
									onClick={generateRandomCode}
									className="h-12 px-6 border-2 border-black bg-white text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
								>
									<RefreshCw size={14} strokeWidth={3} />
									Générer
								</button>
							</div>
							<p className="text-[9px] font-mono font-bold text-black uppercase tracking-widest px-1">
								Le code que les clients devront saisir au moment du paiement.
							</p>
						</div>

						{/* Type of Discount */}
						<div className="space-y-4 pt-4">
							<span className="text-[10px] font-black uppercase tracking-[0.2em] text-black">
								Type de remise
							</span>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<button
									type="button"
									onClick={() => setType("percentage")}
									className={`h-14 px-6 border-2 border-black text-xs font-black uppercase tracking-widest flex items-center justify-center gap-4 ${
										type === "percentage"
											? "bg-black text-white bg-black text-white"
											: "bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white"
									}`}
								>
									<div
										className={`w-3.5 h-3.5 border-2 border-current flex items-center justify-center ${
											type === "percentage" ? "bg-white" : ""
										}`}
									>
										{type === "percentage" && <div className="w-1.5 h-1.5 bg-black" />}
									</div>
									Pourcentage (%)
								</button>
								<button
									type="button"
									onClick={() => setType("fixed")}
									className={`h-14 px-6 border-2 border-black text-xs font-black uppercase tracking-widest flex items-center justify-center gap-4 ${
										type === "fixed"
											? "bg-black text-white bg-black text-white"
											: "bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white"
									}`}
								>
									<div
										className={`w-3.5 h-3.5 border-2 border-current flex items-center justify-center ${
											type === "fixed" ? "bg-white" : ""
										}`}
									>
										{type === "fixed" && <div className="w-1.5 h-1.5 bg-black" />}
									</div>
									Montant fixe (XOF)
								</button>
							</div>
						</div>

						<div className="space-y-3 pt-4">
							<label htmlFor="value" className="text-[10px] font-black uppercase tracking-[0.2em] text-black">
								Valeur de la remise <span className="text-red-500">*</span>
							</label>
							<div className="relative w-full md:w-1/2">
								<input
									id="value"
									type="number"
									min="0"
									step={type === "percentage" ? "1" : "any"}
									max={type === "percentage" ? "100" : undefined}
									value={value}
									onChange={(e) => setValue(e.target.value)}
									className="w-full h-12 px-4 border-2 border-black bg-white text-xl font-black focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
									required
								/>
								<div className="absolute right-4 top-1/2 -translate-y-1/2 text-black font-black text-sm">
									{type === "percentage" ? "%" : "XOF"}
								</div>
							</div>
						</div>
					</div>

					{/* Conditions Section */}
					<div className="space-y-8 pt-10 border-t-2 border-black">
						<div className="flex items-center gap-3">
							<div className="w-2 h-6 bg-black" />
							<h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-black">
								Conditions d'utilisation (Optionnel)
							</h4>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div className="space-y-3">
								<label
									htmlFor="minAmount"
									className="text-[10px] font-black uppercase tracking-[0.2em] text-black"
								>
									Montant d'achat minimum (XOF)
								</label>
								<input
									id="minAmount"
									type="number"
									min="0"
									placeholder="0"
									value={minAmount}
									onChange={(e) => setMinAmount(e.target.value)}
									className="w-full h-10 px-4 border-2 border-black bg-white text-xs font-bold focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
								/>
								<p className="text-[9px] font-mono font-bold text-black uppercase tracking-widest px-1">
									Laissez vide si pas de minimum.
								</p>
							</div>

							<div className="space-y-3">
								<label
									htmlFor="maxUsage"
									className="text-[10px] font-black uppercase tracking-[0.2em] text-black"
								>
									Nombre limite d'utilisations
								</label>
								<input
									id="maxUsage"
									type="number"
									min="1"
									placeholder="Ex: 50"
									value={maxUsage}
									onChange={(e) => setMaxUsage(e.target.value)}
									className="w-full h-10 px-4 border-2 border-black bg-white text-xs font-bold focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
								/>
								<p className="text-[9px] font-mono font-bold text-black uppercase tracking-widest px-1">
									Le code deviendra inactif après ce seuil.
								</p>
							</div>
						</div>
					</div>

					{/* Expiration Section */}
					<div className="space-y-6 pt-10 border-t-2 border-black">
						<div className="flex items-center justify-between bg-white p-6 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
							<div className="space-y-1">
								<h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-black">
									Date d'expiration
								</h4>
								<p className="text-[9px] font-mono font-bold text-black uppercase tracking-widest">
									Désactivez automatiquement ce code après une date précise.
								</p>
							</div>
							<button
								type="button"
								onClick={() => setHasExpiration(!hasExpiration)}
								className={`w-12 h-7 border-2 border-black transition-all relative ${
									hasExpiration ? "bg-black" : "bg-white border-2 border-black"
								}`}
							>
								<div
									className={`absolute top-0 w-5 h-[24px] border border-black bg-white transition-all ${
										hasExpiration ? "left-5.5" : "left-0"
									}`}
									style={{ left: hasExpiration ? "20px" : "0" }}
								/>
							</button>
						</div>

						{hasExpiration && (
							<div className="space-y-3">
								<label
									htmlFor="expiresAt"
									className="text-[10px] font-black uppercase tracking-[0.2em] text-black"
								>
									Expire le <span className="text-red-500">*</span>
								</label>
								<input
									id="expiresAt"
									type="date"
									value={expiresAt}
									onChange={(e) => setExpiresAt(e.target.value)}
									className="w-full md:w-1/2 h-12 px-4 border-2 border-black bg-white text-[10px] font-black uppercase focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
									required={hasExpiration}
								/>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="flex flex-col md:flex-row justify-end gap-6 pt-4">
				<button
					type="button"
					onClick={() => router.back()}
					disabled={isPending}
					className="h-12 px-8 border-2 border-black bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
				>
					Annuler
				</button>
				<button
					type="submit"
					disabled={isPending}
					className="h-12 px-10 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-white hover:text-black disabled:opacity-50 inline-flex items-center gap-3"
				>
					{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
					{isPending ? "SAUVEGARDE..." : initialData ? "METTRE À JOUR LE CODE" : "CRÉER LE CODE PROMO"}
				</button>
			</div>
		</form>
	);
}
