"use client";

import { Clock, Info, Loader2, MapPin, Truck } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { checkoutAction, getShippingRatesAction, validateCouponAction } from "@/app/(store)/checkout/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CURRENCY, LOCALE } from "@/lib/constants";
import { formatMoney } from "@/lib/money";

interface LineItem {
	productVariant: {
		id: string;
		price: string;
		product: { name: string };
	};
	quantity: number;
}

interface Cart {
	lineItems: LineItem[];
}

interface ShippingRate {
	id: string;
	name: string;
	price: string;
	deliveryTime?: string;
	pickupPoint?: {
		address: string;
		city: string;
		openingHours?: string;
		coordinates?: { lat: number; lng: number };
	};
	minAmount?: string;
}

interface CheckoutFormProps {
	cart: Cart;
	subtotal: string;
}

const LocationPicker = dynamic(() => import("@/components/shipping/location-picker-premium"), {
	ssr: false,
	loading: () => (
		<div className="h-[300px] w-full border-4 border-black bg-white flex items-center justify-center text-xs font-black uppercase tracking-widest">
			Chargement de la carte...
		</div>
	),
});

export function CheckoutForm({ cart, subtotal }: CheckoutFormProps) {
	const subtotalBI = BigInt(subtotal);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingRates, setIsLoadingRates] = useState(false);
	const [method, setMethod] = useState("WAVE");
	const [city, setCity] = useState("Abidjan");
	const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
	const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
	const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

	// Coupon State
	const [couponInput, setCouponInput] = useState("");
	const [appliedCoupon, setAppliedCoupon] = useState<{
		code: string;
		discountAmount: string;
		value: number;
		type: string;
	} | null>(null);
	const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(
		null,
	);
	const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

	const fetchRates = useCallback(
		async (currentCity: string, currentCoords?: { lat: number; lng: number }) => {
			if (!currentCity && !currentCoords) return;

			setIsLoadingRates(true);
			try {
				const rates = await getShippingRatesAction(currentCity, currentCoords || undefined);
				setShippingRates(rates);
				if (rates.length > 0) {
					setSelectedRate(rates[0]);
				} else {
					setSelectedRate(null);
				}
			} catch (error) {
				toast.error("Erreur lors de la récupération des tarifs de livraison.");
			} finally {
				setIsLoadingRates(false);
			}
		},
		[],
	);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (city || coordinates) {
				fetchRates(city, coordinates || undefined);
			}
		}, 500);
		return () => clearTimeout(timer);
	}, [city, coordinates, fetchRates]);

	const discountValue = appliedCoupon ? BigInt(appliedCoupon.discountAmount) : BigInt(0);
	const subtotalAfterDiscount = subtotalBI - discountValue;
	const total = subtotalAfterDiscount + (selectedRate ? BigInt(selectedRate.price) : BigInt(0));

	async function handleApplyCoupon() {
		if (!couponInput.trim()) return;
		setIsValidatingCoupon(true);
		setCouponMessage(null);

		try {
			const res = await validateCouponAction(couponInput, subtotal);
			if (res.valid && res.coupon) {
				setAppliedCoupon(res.coupon);
				setCouponMessage({ type: "success", text: `Code ${res.coupon.code} appliqué avec succès!` });
			} else {
				setAppliedCoupon(null);
				setCouponMessage({ type: "error", text: res.message || "Code invalide" });
			}
		} catch (error) {
			setCouponMessage({ type: "error", text: "Erreur lors de la validation." });
		} finally {
			setIsValidatingCoupon(false);
		}
	}

	async function handleSubmit(formData: FormData) {
		setIsLoading(true);
		formData.set("method", method);
		formData.set("shippingRateId", selectedRate?.id || "");
		if (coordinates) {
			formData.set("coordinates", JSON.stringify(coordinates));
		}
		if (appliedCoupon) {
			formData.set("couponCode", appliedCoupon.code);
		}

		try {
			const result = await checkoutAction(formData);
			if (result.success && result.paymentUrl) {
				window.location.href = result.paymentUrl;
			} else {
				toast.error(result.error || "Une erreur est survenue lors du paiement.");
			}
		} catch (error) {
			toast.error("Erreur de connexion au service de paiement.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<form action={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
			<div className="lg:col-span-7 space-y-8">
				<div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
					<div className="border-b-4 border-black p-4 bg-black">
						<h2 className="text-base font-black uppercase tracking-widest text-white">
							Informations de livraison
						</h2>
					</div>
					<div className="p-6 space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="firstName">Prénom</Label>
								<Input id="firstName" name="firstName" required disabled={isLoading} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="lastName">Nom</Label>
								<Input id="lastName" name="lastName" required disabled={isLoading} />
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" name="email" type="email" required disabled={isLoading} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone">Numéro de téléphone</Label>
							<Input
								id="phone"
								name="phone"
								type="tel"
								placeholder="+225 ..."
								required
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="address">Adresse (Quartier, Rue)</Label>
							<Input id="address" name="address" required disabled={isLoading} />
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="city">Ville</Label>
								<Input
									id="city"
									name="city"
									value={city}
									onChange={(e) => setCity(e.target.value)}
									disabled={isLoading}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="commune">Commune / Quartier</Label>
								<Input id="commune" name="commune" placeholder="Ex: Cocody Angré" disabled={isLoading} />
							</div>
						</div>

						{/* Map Location Picker */}
						<div className="space-y-3 pt-4 border-t-2 border-black">
							<div className="flex items-center justify-between">
								<Label className="text-xs font-black uppercase tracking-widest">Position GPS précise</Label>
								<div className="flex items-center gap-1.5 text-[10px] text-black font-black border-2 border-black bg-lime-400 px-2 py-1 uppercase">
									<Info size={12} />
									Optimise la livraison
								</div>
							</div>
							<p className="text-[10px] text-muted-foreground">
								Déplacez le marqueur sur la carte pour nous aider à trouver votre adresse exacte.
							</p>
							<LocationPicker
								onChange={setCoordinates}
								initialCoords={selectedRate?.pickupPoint?.coordinates || coordinates}
							/>
						</div>
					</div>
				</div>

				<div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
					<div className="border-b-4 border-black p-4 bg-black">
						<h2 className="text-base font-black uppercase tracking-widest text-white">
							Livraison & Paiement
						</h2>
					</div>
					<div className="p-6 space-y-6">
						{/* Shipping Selection */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label className="text-xs font-black uppercase tracking-widest">Options de Livraison</Label>
								{isLoadingRates && <Loader2 className="h-4 w-4 animate-spin" />}
							</div>

							{isLoadingRates ? (
								<div className="space-y-2">
									{[1, 2].map((i) => (
										<div
											key={i}
											className="h-16 w-full border-2 border-black bg-neutral-100 flex items-center justify-center text-xs font-black uppercase"
										/>
									))}
								</div>
							) : shippingRates.length > 0 ? (
								<RadioGroup
									value={selectedRate?.id}
									onValueChange={(val) => {
										const rate = shippingRates.find((r) => r.id === val);
										setSelectedRate(rate ?? null);
									}}
									className="gap-3"
								>
									{shippingRates.map((rate) => (
										<div
											key={rate.id}
											className={`flex items-center space-x-2 border-2 p-4 cursor-pointer ${
												selectedRate?.id === rate.id
													? "border-black bg-black text-white"
													: "border-black bg-white hover:bg-neutral-100"
											}`}
										>
											<RadioGroupItem value={rate.id} id={rate.id} className="sr-only" />
											<Label htmlFor={rate.id} className="flex-1 cursor-pointer">
												<div className="flex justify-between items-start">
													<div className="space-y-1">
														<div className="flex items-center gap-2">
															<span className="font-black text-sm uppercase tracking-tight">{rate.name}</span>
															{rate.deliveryTime && (
																<span className="flex items-center gap-1 text-[10px] border border-current px-1.5 py-0.5 font-black uppercase">
																	<Clock size={10} /> {rate.deliveryTime}
																</span>
															)}
															{rate.pickupPoint && (
																<span className="text-[10px] border-2 border-current px-1.5 py-0.5 font-black uppercase flex items-center gap-1">
																	<MapPin size={10} className="mr-1" /> Boutique
																</span>
															)}
														</div>
														{rate.pickupPoint && (
															<div className="space-y-1 mt-1.5">
																<p className="text-[11px] font-black underline underline-offset-2">
																	{rate.pickupPoint.address}, {rate.pickupPoint.city}
																</p>
																{rate.pickupPoint.openingHours && (
																	<p className="text-[10px] font-bold flex items-center gap-1">
																		<Clock size={10} /> {rate.pickupPoint.openingHours}
																	</p>
																)}
															</div>
														)}
														{rate.minAmount && BigInt(rate.minAmount) > 0n && (
															<p className="text-[10px] font-black uppercase">
																Offert dès{" "}
																{formatMoney({
																	amount: BigInt(rate.minAmount),
																	currency: CURRENCY,
																	locale: LOCALE,
																})}{" "}
																d'achat
															</p>
														)}
													</div>
													<div className="text-right">
														<span className="font-bold text-sm">
															{BigInt(rate.price) === 0n
																? "Gratuit"
																: formatMoney({
																		amount: BigInt(rate.price),
																		currency: CURRENCY,
																		locale: LOCALE,
																	})}
														</span>
													</div>
												</div>
											</Label>
										</div>
									))}
								</RadioGroup>
							) : (
								<div className="flex flex-col items-center justify-center p-8 border-4 border-dashed border-black bg-white text-black text-center">
									<Truck size={32} className="mb-3" />
									<p className="text-sm font-black uppercase">Aucun tarif disponible</p>
									<p className="text-[10px]">
										Veuillez affiner votre position sur la carte ou changer de ville.
									</p>
								</div>
							)}
						</div>

						<div className="space-y-4">
							<Label className="text-xs font-black uppercase tracking-widest">Moyen de Paiement</Label>
							<RadioGroup
								defaultValue="WAVE"
								onValueChange={setMethod}
								className="grid grid-cols-1 gap-4 sm:grid-cols-2"
							>
								<div>
									<RadioGroupItem value="WAVE" id="wave" className="peer sr-only" />
									<Label
										htmlFor="wave"
										className="flex flex-col items-center justify-between border-4 border-black bg-white p-4 peer-data-[state=checked]:bg-black peer-data-[state=checked]:text-white [&:has([data-state=checked])]:bg-black [&:has([data-state=checked])]:text-white cursor-pointer h-full hover:bg-black hover:text-white"
									>
										<span className="mb-2 font-bold uppercase tracking-wider text-xs">Wave</span>
										<span className="text-[9px] font-bold text-center leading-tight uppercase">
											Paiement instantané par QR Code
										</span>
									</Label>
								</div>
								<div>
									<RadioGroupItem value="ORANGE_MONEY" id="orange" className="peer sr-only" />
									<Label
										htmlFor="orange"
										className="flex flex-col items-center justify-between border-4 border-black bg-white p-4 peer-data-[state=checked]:bg-black peer-data-[state=checked]:text-white [&:has([data-state=checked])]:bg-black [&:has([data-state=checked])]:text-white cursor-pointer h-full hover:bg-black hover:text-white"
									>
										<span className="mb-2 font-bold uppercase tracking-wider text-xs">Orange Money</span>
										<span className="text-[9px] font-bold text-center leading-tight uppercase">
											Simple, rapide et sécurisé
										</span>
									</Label>
								</div>
							</RadioGroup>
						</div>
					</div>
				</div>
			</div>

			<div className="lg:col-span-5">
				<div className="sticky top-8 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
					<div className="border-b-4 border-black p-4 bg-black">
						<h2 className="text-base font-black uppercase tracking-widest text-white">
							Résumé de la commande
						</h2>
					</div>
					<div className="space-y-4 p-6">
						<div className="space-y-4">
							{cart.lineItems.map((item: LineItem) => (
								<div
									key={item.productVariant.id}
									className="flex justify-between text-sm border-b-2 border-black pb-4 last:border-b-0"
								>
									<div className="flex gap-4">
										<div className="h-12 w-12 border-2 border-black bg-neutral-100 flex items-center justify-center shrink-0">
											<Truck size={24} />
										</div>
										<div className="flex flex-col justify-center">
											<span className="font-black uppercase line-clamp-1 leading-tight mb-0.5">
												{item.productVariant.product.name}
											</span>
											<span className="text-[10px] font-black uppercase tracking-tighter">
												Quantité: {item.quantity}
											</span>
										</div>
									</div>
									<div className="flex flex-col justify-center items-end">
										<span className="font-black text-sm">
											{formatMoney({
												amount: BigInt(item.productVariant.price) * BigInt(item.quantity),
												currency: CURRENCY,
												locale: LOCALE,
											})}
										</span>
									</div>
								</div>
							))}
						</div>

						<div className="border-t-2 border-black pt-6 space-y-4">
							{/* Coupon Widget */}
							<div className="space-y-3 pb-4">
								<Label className="text-xs font-black uppercase tracking-widest">Code Promo</Label>
								<div className="flex gap-2">
									<Input
										placeholder="Entrez votre code"
										className="h-10 text-sm uppercase rounded-none border-2 border-black focus-visible:ring-0"
										value={couponInput}
										onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
										disabled={isValidatingCoupon || !!appliedCoupon}
									/>
									{appliedCoupon ? (
										<Button
											type="button"
											className="h-10 rounded-none border-2 border-black bg-white text-black font-black uppercase hover:bg-red-600 hover:text-white hover:border-red-600"
											onClick={() => {
												setAppliedCoupon(null);
												setCouponInput("");
												setCouponMessage(null);
											}}
										>
											Retirer
										</Button>
									) : (
										<Button
											type="button"
											className="h-10 rounded-none border-2 border-black bg-black text-white font-black uppercase hover:bg-white hover:text-black"
											onClick={handleApplyCoupon}
											disabled={isValidatingCoupon || !couponInput.trim()}
										>
											{isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Appliquer"}
										</Button>
									)}
								</div>
								{couponMessage && (
									<p
										className={`text-xs font-black uppercase ${couponMessage.type === "success" ? "text-green-600" : "text-red-600"}`}
									>
										{couponMessage.text}
									</p>
								)}
							</div>

							<div className="flex justify-between text-xs font-black uppercase tracking-widest pt-4 border-t-2 border-dashed border-black">
								<span>Sous-total</span>
								<span className="font-black font-mono tabular-nums">
									{formatMoney({ amount: subtotalBI, currency: CURRENCY, locale: LOCALE })}
								</span>
							</div>

							{appliedCoupon && (
								<div className="flex justify-between text-xs font-black text-green-600 uppercase tracking-widest">
									<span>Réduction ({appliedCoupon.code})</span>
									<span className="font-bold">
										-{formatMoney({ amount: discountValue, currency: CURRENCY, locale: LOCALE })}
									</span>
								</div>
							)}
							<div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
								<span>Livraison</span>
								<span className="font-bold">
									{selectedRate ? (
										BigInt(selectedRate.price) === 0n ? (
											<span className="text-green-600">Gratuit</span>
										) : (
											formatMoney({
												amount: BigInt(selectedRate.price),
												currency: CURRENCY,
												locale: LOCALE,
											})
										)
									) : (
										<span className="text-amber-600 font-black uppercase">En attente de position...</span>
									)}
								</span>
							</div>
						</div>

						<div className="pt-6 border-t-4 border-black flex justify-between items-center">
							<span className="text-xl font-black uppercase tracking-tighter">Total</span>
							<span className="text-3xl font-black font-mono tabular-nums tracking-tighter">
								{formatMoney({
									amount: total,
									currency: CURRENCY,
									locale: LOCALE,
								})}
							</span>
						</div>
					</div>
					<div className="p-6 border-t-4 border-black bg-white">
						<Button
							type="submit"
							className="w-full h-16 text-lg font-black uppercase tracking-widest rounded-none border-4 border-black bg-black text-white hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
							disabled={isLoading || isLoadingRates || !selectedRate}
						>
							{isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Confirmer & Payer"}
						</Button>
						{!selectedRate && !isLoadingRates && (
							<p className="mt-4 text-center text-[9px] text-black font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border-2 border-dashed border-black p-2">
								<Info size={12} />
								Sélectionnez une option de livraison
							</p>
						)}
					</div>
				</div>
			</div>
		</form>
	);
}
