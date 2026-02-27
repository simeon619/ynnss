import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCart } from "@/app/(store)/cart/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckoutForm } from "./checkout-form";

interface CheckoutLineItem {
	quantity: number;
	productVariant: { price: string };
}

export default async function CheckoutPage() {
	const cart = await getCart();

	if (!cart || cart.lineItems.length === 0) {
		redirect("/");
	}

	const subtotal = cart.lineItems.reduce((acc: bigint, item: CheckoutLineItem) => {
		return acc + BigInt(item.productVariant.price) * BigInt(item.quantity);
	}, BigInt(0));

	return (
		<div className="max-w-6xl mx-auto px-4 py-12 lg:px-8">
			<h1 className="text-3xl font-bold tracking-tight mb-8">Finaliser votre commande</h1>
			<Suspense fallback={<Skeleton className="h-[600px] w-full rounded-2xl" />}>
				<CheckoutForm cart={cart} subtotal={subtotal.toString()} />
			</Suspense>
		</div>
	);
}
