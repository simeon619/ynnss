"use client";

import { ArrowRight, ShieldCheck, StoreIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestLoginOTP, verifyLoginAndCreateSession } from "./actions";

export default function LoginPage() {
	const [step, setStep] = useState(1);
	const [phone, setPhone] = useState("");
	const [code, setCode] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleRequestOTP = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!phone) {
			toast.error("Veuillez entrer votre numéro.");
			return;
		}

		setIsLoading(true);
		try {
			const formData = new FormData();
			formData.append("phone", phone);
			await requestLoginOTP(formData);
			setStep(2);
			toast.success("Code envoyé par SMS !");
		} catch (error: unknown) {
			toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerify = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!code || code.length !== 6) {
			toast.error("Veuillez entrer le code à 6 chiffres.");
			return;
		}

		setIsLoading(true);
		try {
			const formData = new FormData();
			formData.append("phone", phone);
			formData.append("code", code);
			const result = await verifyLoginAndCreateSession(formData);

			toast.success("Authentification réussie !");
			if (result?.redirectUrl) {
				router.push(result.redirectUrl);
			} else {
				router.push("/manage");
			}
			router.refresh();
		} catch (error: unknown) {
			toast.error(error instanceof Error ? error.message : "Code invalide.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<main className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
			{/* Left Content (Branding) */}
			<div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-slate-50 relative overflow-hidden">
				<div className="relative z-10">
					<div className="flex items-center gap-3 text-2xl font-bold mb-16">
						<StoreIcon className="h-8 w-8 text-blue-500" />
						Your Next Store{" "}
						<span className="text-slate-500 text-sm font-medium border border-slate-700 rounded-full px-2 py-0.5 ml-2">
							SaaS
						</span>
					</div>
					<h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
						Gérez toutes vos <br />
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
							boutiques
						</span>{" "}
						en un clic.
					</h1>
					<p className="text-slate-400 text-lg max-w-md">
						Une plateforme unifiée pour piloter vos ventes, votre inventaire et vos paiements Wave en toute
						sécurité.
					</p>
				</div>

				<div className="relative z-10 flex items-center gap-4 text-sm text-slate-400">
					<ShieldCheck className="h-5 w-5" />
					Connexion 100% sécurisée sans mot de passe
				</div>

				{/* Decorative Background */}
				<div className="absolute -bottom-1/2 -right-1/2 w-[1000px] h-[1000px] rounded-full bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 blur-3xl" />
			</div>

			{/* Right Content (Form) */}
			<div className="flex flex-col items-center justify-center p-8 lg:p-12 relative">
				<div className="w-full max-w-sm space-y-8">
					<div className="text-center lg:text-left">
						<h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
							{step === 1 ? "Connectez-vous à votre espace" : "Vérification de sécurité"}
						</h2>
						<p className="text-sm text-slate-500">
							{step === 1
								? "Saisissez votre numéro de téléphone pour recevoir un code d'accès unique."
								: `Nous avons envoyé un code à 6 chiffres au ${phone}.`}
						</p>
					</div>

					{step === 1 ? (
						<form onSubmit={handleRequestOTP} className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="phone">Numéro de téléphone</Label>
								<Input
									id="phone"
									type="tel"
									placeholder="+2250759091098"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									required
									className="h-12 text-lg"
								/>
							</div>
							<Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
								{isLoading ? "Envoi en cours..." : "Continuer"}
								{!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
							</Button>
						</form>
					) : (
						<form onSubmit={handleVerify} className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="code">Code de vérification</Label>
								<Input
									id="code"
									type="text"
									inputMode="numeric"
									maxLength={6}
									placeholder="000000"
									value={code}
									onChange={(e) => setCode(e.target.value)}
									required
									className="h-12 text-lg text-center tracking-[0.5em] font-mono"
								/>
							</div>
							<div className="flex gap-3">
								<Button type="button" variant="outline" className="h-12 px-4" onClick={() => setStep(1)}>
									Retour
								</Button>
								<Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
									{isLoading ? "Vérification..." : "Connexion"}
								</Button>
							</div>
						</form>
					)}
				</div>
			</div>
		</main>
	);
}
