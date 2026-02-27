import { Calendar, ChevronLeft, CreditCard, Mail, MapPin, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import { getOrderDetails } from "../../actions";
import { OrderStatusActions } from "./order-status-actions";

export const metadata = {
	title: "Détail de la Commande | YNS",
};

interface OrderItem {
	id: string;
	quantity: number;
	price: string | number;
	variant: {
		sku: string | null;
		price: string | null;
		product: {
			name: string;
			images: string[] | null;
		} | null;
	} | null;
}

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
	const order = await getOrderDetails(params.id);

	if (!order) {
		notFound();
	}

	const formatDate = (dateString: Date | null) => {
		if (!dateString) return "N/A";
		return new Intl.DateTimeFormat("fr-FR", {
			day: "numeric",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(dateString);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "paid":
				return "bg-white text-black border-black";
			case "shipped":
				return "bg-black text-white border-black";
			case "cancelled":
				return "bg-white text-red-600 border-red-600";
			default:
				return "bg-white text-black border-black";
		}
	};

	const getStatusTranslation = (status: string) => {
		switch (status) {
			case "paid":
				return "Payée";
			case "shipped":
				return "Expédiée";
			case "cancelled":
				return "Annulée";
			case "pending":
				return "En attente";
			default:
				return status;
		}
	};

	const subtotal = Number(order.subtotal || 0);
	const shippingCost = Number(order.shippingCost || 0);
	const total = subtotal + shippingCost;

	return (
		<div className="space-y-8 max-w-5xl mx-auto pt-8 pb-16 px-4">
			{/* Navigation & Actions */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
				<div className="flex items-center gap-4">
					<Button
						variant="outline"
						size="icon"
						asChild
						className="h-10 w-10 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:translate-x-px hover:translate-y-px hover:shadow-none sm:flex hidden"
					>
						<Link href="/manage/orders">
							<ChevronLeft size={20} />
						</Link>
					</Button>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-2xl font-black tracking-tight text-black uppercase">
								Commande <span className="font-mono text-xl">{order.lookup}</span>
							</h1>
							<Badge
								variant="outline"
								className={`uppercase font-black border-2 px-2 py-0.5 rounded-none ${getStatusColor(order.status)}`}
							>
								{getStatusTranslation(order.status)}
							</Badge>
						</div>
						<div className="flex items-center gap-2 mt-2 text-black font-bold uppercase text-[10px] tracking-widest font-mono">
							<Calendar size={12} />
							<span>{formatDate(order.createdAt)}</span>
						</div>
					</div>
				</div>

				<OrderStatusActions
					orderId={order.id}
					currentStatus={order.status as "pending" | "paid" | "shipped" | "cancelled"}
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				{/* Colonne Principale: Articles */}
				<div className="md:col-span-2 space-y-8">
					<Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden bg-white">
						<CardHeader className="bg-black text-white border-b-2 border-black p-4">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
									<Package size={18} /> Articles commandés
								</CardTitle>
								<span className="text-xs font-mono font-bold uppercase">{order.items.length} produit(s)</span>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<div className="divide-y-2 divide-black">
								{(order.items as unknown as OrderItem[]).map((item) => (
									<div
										key={item.id}
										className="flex flex-col sm:flex-row p-4 gap-4 items-start sm:items-center justify-between hover:bg-black hover:text-white group"
									>
										<div className="flex items-start gap-4">
											<div className="relative w-16 h-16 bg-white border-2 border-black shrink-0 overflow-hidden">
												{item.variant?.product?.images?.[0] ? (
													<Image
														src={item.variant.product.images[0]}
														alt={item.variant.product.name}
														fill
														className="object-cover"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center text-black group-hover:text-white">
														<Package size={20} />
													</div>
												)}
											</div>
											<div>
												<p className="font-black uppercase text-sm">
													{item.variant?.product?.name || "Produit Inconnu"}
												</p>
												<p className="text-sm mt-1">
													{item.variant?.sku && (
														<span className="font-mono bg-black text-white px-1 mr-2 text-xs">
															{item.variant.sku}
														</span>
													)}
													<span className="font-mono">
														{item.variant?.price
															? formatMoney({
																	amount: item.variant.price,
																	currency: order.currency || "XOF",
																	locale: "fr-CI",
																})
															: "N/A"}
													</span>
												</p>
											</div>
										</div>
										<div className="flex items-center justify-between w-full sm:w-auto sm:text-right mt-2 sm:mt-0">
											<div className="text-xs font-black bg-black text-white group-hover:bg-white group-hover:text-black px-2 py-1 uppercase tracking-widest">
												x{item.quantity}
											</div>
											<div className="font-black text-lg sm:w-32 text-right font-mono tabular-nums">
												{formatMoney({
													amount: item.price.toString(),
													currency: order.currency || "XOF",
													locale: "fr-CI",
												})}
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Résumé Financier */}
					<Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white">
						<CardContent className="p-6">
							<div className="space-y-4">
								<div className="flex justify-between items-center">
									<span className="text-[10px] font-black uppercase tracking-widest">
										Sous-total ({order.items.length} articles)
									</span>
									<span className="font-black font-mono tabular-nums text-lg">
										{formatMoney({
											amount: subtotal.toString(),
											currency: order.currency || "XOF",
											locale: "fr-CI",
										})}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-[10px] font-black uppercase tracking-widest">Frais de livraison</span>
									<span className="font-black font-mono tabular-nums text-lg">
										{formatMoney({
											amount: shippingCost.toString(),
											currency: order.currency || "XOF",
											locale: "fr-CI",
										})}
									</span>
								</div>

								<div className="pt-6 mt-6 border-t-2 border-black flex justify-between items-center">
									<span className="text-sm font-black uppercase tracking-[0.2em]">Total payé</span>
									<span className="text-3xl font-black font-mono tabular-nums tracking-tighter">
										{formatMoney({
											amount: total.toString(),
											currency: order.currency || "XOF",
											locale: "fr-CI",
										})}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Colonne Latérale: Info Supplémentaires */}
				<div className="space-y-8">
					{/* Client */}
					<Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white overflow-hidden">
						<CardHeader className="p-4 border-b-2 border-black bg-white">
							<CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
								<Mail size={16} /> Client
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4">
							<div className="space-y-2">
								<p className="text-sm font-black uppercase">
									{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
								</p>
								<p className="text-xs font-mono font-bold break-all underline decoration-2 underline-offset-4">
									<a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a>
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Livraison */}
					<Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white overflow-hidden">
						<CardHeader className="p-4 border-b-2 border-black bg-white">
							<CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
								<MapPin size={16} /> Expédition
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4">
							{order.pickupPointId ? (
								<div className="space-y-3">
									<Badge
										variant="outline"
										className="bg-black text-white border-2 border-black rounded-none uppercase text-[10px] font-black py-0"
									>
										Point Relais
									</Badge>
									<div>
										<p className="text-sm font-black uppercase">{order.pickupPoint?.name}</p>
										<p className="text-xs font-mono font-bold mt-1 leading-relaxed uppercase">
											{order.pickupPoint?.address}
											<br />
											{order.pickupPoint?.city}
										</p>
									</div>
								</div>
							) : (
								<div className="space-y-3">
									<Badge
										variant="outline"
										className="bg-black text-white border-2 border-black rounded-none uppercase text-[10px] font-black py-0"
									>
										Livraison à Domicile
									</Badge>
									<p className="text-xs font-mono font-bold leading-relaxed uppercase">
										{order.shippingAddress?.address}
										<br />
										{order.shippingAddress?.city}, {order.shippingAddress?.country}
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Paiement */}
					<Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white overflow-hidden">
						<CardHeader className="p-4 border-b-2 border-black bg-white">
							<CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
								<CreditCard size={16} /> Paiement
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-[10px] font-black uppercase tracking-widest">Moyen</span>
								<span className="text-xs font-black uppercase">{order.paymentMethod || "---"}</span>
							</div>
							{order.transactionId && (
								<div className="pt-4 border-t-2 border-black flex flex-col gap-2">
									<span className="text-[9px] font-black uppercase tracking-widest text-black/60">
										ID Transaction
									</span>
									<span className="text-[10px] font-mono font-bold bg-white p-2 border-2 border-black break-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">
										{order.transactionId}
									</span>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
