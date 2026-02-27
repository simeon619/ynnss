import { Suspense } from "react";
import { CartProvider } from "@/app/(store)/cart/cart-context";
import { CartSidebar } from "@/app/(store)/cart/cart-sidebar";
import { CartButton } from "@/app/cart-button";
import { Footer } from "@/app/footer";
import { Navbar } from "@/app/navbar";
import { ReferralBadge } from "@/components/referral-badge";
import { YnsLink } from "@/components/yns-link";
import { commerce } from "@/lib/commerce";
import { getCartCookieJson } from "@/lib/cookies";
import { getTenantDb } from "@/lib/db";

async function getInitialCart() {
	const cartCookie = await getCartCookieJson();

	if (!cartCookie?.id) {
		return { cart: null, cartId: null };
	}

	try {
		const cart = await commerce.cartGet({ cartId: cartCookie.id });
		return { cart: cart ?? null, cartId: cartCookie.id };
	} catch {
		return { cart: null, cartId: cartCookie.id };
	}
}

async function CartProviderWrapper({
	children,
	store,
}: {
	children: React.ReactNode;
	store: { name: string };
}) {
	const { cart, cartId } = await getInitialCart();

	return (
		<CartProvider initialCart={cart} initialCartId={cartId}>
			<div className="flex min-h-screen flex-col">
				<header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-between h-16">
							<div className="flex items-center gap-8">
								<YnsLink prefetch={"eager"} href="/" className="text-xl font-bold">
									{store.name}
								</YnsLink>
								<Navbar />
							</div>
							<CartButton />
						</div>
					</div>
				</header>
				<div className="flex-1">{children}</div>
				<Footer />
				<ReferralBadge />
			</div>
			<CartSidebar />
		</CartProvider>
	);
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
	const storeId = process.env.STORE_ID;
	if (!storeId) throw new Error("STORE_ID est manquant");
	const db = await getTenantDb(storeId);
	const store = (await db.query.storeSettings.findFirst()) || { name: "Store" };

	return (
		<Suspense>
			<CartProviderWrapper store={store}>{children}</CartProviderWrapper>
		</Suspense>
	);
}
