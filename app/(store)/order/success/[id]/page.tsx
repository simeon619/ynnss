import { CheckCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { YnsLink } from "@/components/yns-link";
import { commerce } from "@/lib/commerce";
import { verifyCustomerSession } from "@/lib/customer-auth";
import { getOrderDownloadItemsForPhone } from "@/lib/customer-downloads";
import { formatMoney } from "@/lib/money";
import { getStorefrontFormatting } from "@/lib/store-settings";
import { getStorefrontBasePath, getStorefrontStoreId } from "@/lib/storefront";
import { prependStorefrontBasePath } from "@/lib/storefront-paths";
import { YNSImage } from "@/lib/yns-image";
import { confirmOrderPaymentAction } from "./actions";

export default async function OrderSuccessPage(props: { params: Promise<{ id: string }> }) {
	return <OrderDetails params={props.params} />;
}

const OrderDetails = async ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = await params;
	const storeId = await getStorefrontStoreId();
	await confirmOrderPaymentAction(id, storeId);
	const order = await commerce.orderGet({ id });
	const { currency, locale } = await getStorefrontFormatting();
	const storefrontBasePath = await getStorefrontBasePath();

	if (!order) {
		notFound();
	}

	const lineItems = order.orderData.lineItems;
	const shippingAddress = order.orderData.shippingAddress;
	const shipping = order.orderData.shipping;
	const customer = order.orderData.customer;

	const subtotal = lineItems.reduce((acc: bigint, item: OrderLineItem) => {
		return acc + BigInt(item.productVariant.price) * BigInt(item.quantity);
	}, BigInt(0));

	const shippingCost = shipping ? BigInt(shipping.price) : BigInt(0);
	const total = subtotal + shippingCost;
	const customerSession = await verifyCustomerSession(storeId);
	const downloadableItems = customerSession
		? await getOrderDownloadItemsForPhone(storeId, id, customerSession.phone)
		: [];

	return (
		<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			{/* Success Header */}
			<div className="text-center mb-10">
				<div className="flex justify-center mb-4">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
						<CheckCircle className="h-8 w-8 text-green-600" />
					</div>
				</div>
				<h1 className="text-3xl font-semibold tracking-tight">Thank you for your order!</h1>
				<p className="text-muted-foreground mt-2">Order #{order.lookup} has been confirmed</p>
				{customer?.email && (
					<p className="text-sm text-muted-foreground mt-1">
						A confirmation email will be sent to {customer.email}
					</p>
				)}
			</div>

			{/* Order Items */}
			<div className="border border-border rounded-lg overflow-hidden">
				<div className="bg-secondary/50 px-6 py-4 border-b border-border">
					<h2 className="font-medium">Order Items</h2>
				</div>
				<div className="divide-y divide-border">
					{lineItems.map((item: OrderLineItem) => (
						<OrderItem
							key={item.id}
							item={item}
							currency={currency}
							locale={locale}
							storefrontBasePath={storefrontBasePath}
						/>
					))}
				</div>

				{/* Order Summary */}
				<div className="bg-secondary/30 px-6 py-4 space-y-2">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Subtotal</span>
						<span>{formatMoney({ amount: subtotal, currency, locale })}</span>
					</div>
					{shipping && (
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">Shipping ({shipping.name})</span>
							<span>{formatMoney({ amount: shippingCost, currency, locale })}</span>
						</div>
					)}
					<div className="flex items-center justify-between font-semibold pt-2 border-t border-border">
						<span>Total</span>
						<span>{formatMoney({ amount: total, currency, locale })}</span>
					</div>
				</div>
			</div>

			{/* Shipping Address */}
			{shippingAddress && (
				<div className="border border-border rounded-lg overflow-hidden mt-6">
					<div className="bg-secondary/50 px-6 py-4 border-b border-border">
						<h2 className="font-medium">Shipping Address</h2>
					</div>
					<div className="px-6 py-4 text-sm text-muted-foreground">
						{shippingAddress.name && <p className="text-foreground font-medium">{shippingAddress.name}</p>}
						{shippingAddress.line1 && <p>{shippingAddress.line1}</p>}
						{shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
						<p>
							{[shippingAddress.city, shippingAddress.state, shippingAddress.postalCode]
								.filter(Boolean)
								.join(", ")}
						</p>
						{shippingAddress.country && <p>{shippingAddress.country}</p>}
					</div>
				</div>
			)}

			{/* Continue Shopping Button */}
			<div className="mt-8 text-center">
				<Button asChild>
					<YnsLink prefetch="eager" href={prependStorefrontBasePath(storefrontBasePath, "/")}>
						Continue Shopping
					</YnsLink>
				</Button>
			</div>

			{/* Digital Downloads */}
			<div className="mt-8 border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
				<div className="border-b-4 border-black bg-black px-6 py-4">
					<h2 className="text-sm font-black uppercase tracking-widest text-white">
						Téléchargements numériques
					</h2>
				</div>
				<div className="space-y-3 p-6">
					{downloadableItems.length > 0 ? (
						downloadableItems.map((item) => (
							<div
								key={item.id}
								className="flex flex-col gap-3 border-2 border-black p-3 md:flex-row md:items-center md:justify-between"
							>
								<div className="space-y-1">
									<p className="font-mono text-sm font-bold">{item.filename}</p>
									<p className="text-[10px] font-mono uppercase text-neutral-500">
										Source: {item.sourceType}
									</p>
								</div>
								<a
									href={`/api/customer/downloads/${item.id}/link`}
									target="_blank"
									rel="noreferrer"
									className="inline-flex h-10 items-center justify-center border-2 border-black bg-black px-4 text-xs font-black uppercase tracking-widest text-white hover:bg-white hover:text-black"
								>
									Télécharger
								</a>
							</div>
						))
					) : customerSession ? (
						<p className="text-xs font-black uppercase text-neutral-600">
							Aucun fichier numérique lié à cette commande.
						</p>
					) : (
						<div className="space-y-3">
							<p className="text-xs font-black uppercase text-neutral-600">
								Connectez-vous avec votre téléphone pour récupérer vos fichiers.
							</p>
							<YnsLink
								prefetch="eager"
								href={prependStorefrontBasePath(
									storefrontBasePath,
									`/account/login?redirect=${encodeURIComponent(`/order/success/${id}`)}`,
								)}
								className="inline-flex h-10 items-center justify-center border-2 border-black bg-black px-4 text-xs font-black uppercase tracking-widest text-white hover:bg-white hover:text-black"
							>
								Se connecter
							</YnsLink>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

type OrderLineItem = {
	id: string;
	quantity: number;
	productVariant: {
		id: string;
		price: string;
		images: string[];
		product: {
			id: string;
			name: string;
			slug: string;
			images: string[];
		};
	};
};

function OrderItem({
	item,
	currency,
	locale,
	storefrontBasePath,
}: {
	item: OrderLineItem;
	currency: string;
	locale: string;
	storefrontBasePath: string;
}) {
	const { productVariant, quantity } = item;
	const { product } = productVariant;

	const image = productVariant.images[0] ?? product.images[0];
	const price = BigInt(productVariant.price);
	const lineTotal = price * BigInt(quantity);

	return (
		<div className="flex gap-4 p-6">
			{/* Product Image */}
			<YnsLink
				prefetch="eager"
				href={prependStorefrontBasePath(storefrontBasePath, `/product/${product.slug}`)}
				className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary"
			>
				{image && <YNSImage src={image} alt={product.name} fill className="object-cover" sizes="80px" />}
			</YnsLink>

			{/* Product Details */}
			<div className="flex min-w-0 flex-1 flex-col justify-between">
				<div>
					<YnsLink
						prefetch="eager"
						href={prependStorefrontBasePath(storefrontBasePath, `/product/${product.slug}`)}
						className="text-sm font-medium leading-tight text-foreground hover:underline line-clamp-2"
					>
						{product.name}
					</YnsLink>
					<p className="text-sm text-muted-foreground mt-1">Qty: {quantity}</p>
				</div>
				<p className="text-sm font-semibold">{formatMoney({ amount: lineTotal, currency, locale })}</p>
			</div>
		</div>
	);
}
