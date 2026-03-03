import { notFound } from "next/navigation";
import { connection } from "next/server";
import { type CSSProperties, Suspense } from "react";

import { CartProvider } from "@/app/(store)/cart/cart-context";
import { CartSidebar } from "@/app/(store)/cart/cart-sidebar";
import { StorefrontBasePathProvider } from "@/app/(store)/storefront-base-path-context";
import { CartButton } from "@/app/cart-button";
import { Footer } from "@/app/footer";
import { Navbar } from "@/app/navbar";
import { ReferralBadge } from "@/components/referral-badge";
import { ThemePreviewRuntimeBridge } from "@/components/theme-preview-runtime-bridge";
import { YnsLink } from "@/components/yns-link";
import { commerce } from "@/lib/commerce";
import { getCartCookieJson } from "@/lib/cookies";
import { getTenantDb } from "@/lib/db";
import { getFormattingFromSettings } from "@/lib/store-settings";
import { getStoreBySlug } from "@/lib/storefront";
import { buildStorefrontBasePath, prependStorefrontBasePath } from "@/lib/storefront-paths";
import { resolveStorefrontTheme } from "@/lib/theme";

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

function StoreUnavailable({ storeName }: { storeName: string }) {
	return (
		<div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
			<div className="w-full max-w-xl border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
				<p className="text-xs font-black uppercase tracking-[0.2em] mb-3">Store Status</p>
				<h1 className="text-3xl font-black uppercase mb-4">{storeName}</h1>
				<p className="text-sm font-bold uppercase">
					Cette boutique est temporairement indisponible. Revenez plus tard.
				</p>
			</div>
		</div>
	);
}

async function CartProviderWrapper({
	children,
	store,
	theme,
	basePath,
}: {
	children: React.ReactNode;
	store: {
		name: string;
		showReferralBadge: boolean | null;
		currency: string | null;
		language: string | null;
	};
	theme: {
		contentModel: {
			globals: {
				brandName: string;
				brandTagline: string;
				footerDescription: string;
				footerCopyright: string;
			};
		};
		cssVariables: Record<string, string>;
		buttonStyle: string;
	};
	basePath: string;
}) {
	const { cart, cartId } = await getInitialCart();
	const { currency, locale } = getFormattingFromSettings(store);
	const brandName = theme.contentModel.globals.brandName || store.name;
	const brandTagline = theme.contentModel.globals.brandTagline;

	return (
		<StorefrontBasePathProvider basePath={basePath}>
			<CartProvider initialCart={cart} initialCartId={cartId}>
				<div
					className="storefront-theme flex min-h-screen flex-col"
					style={theme.cssVariables as CSSProperties}
					data-theme-button-style={theme.buttonStyle}
				>
					<ThemePreviewRuntimeBridge />
					<header className="sticky top-0 z-50 border-b border-border bg-background">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
							<div className="flex items-center justify-between h-16">
								<div className="flex items-center gap-8">
									<div className="flex flex-col">
										<YnsLink
											prefetch={"eager"}
											href={prependStorefrontBasePath(basePath, "/")}
											className="text-xl font-black uppercase tracking-tight"
										>
											{brandName}
										</YnsLink>
										{brandTagline && (
											<span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
												{brandTagline}
											</span>
										)}
									</div>
									<Navbar basePath={basePath} />
								</div>
								<CartButton />
							</div>
						</div>
					</header>
					<div className="flex-1">{children}</div>
					<Footer
						basePath={basePath}
						brandName={brandName}
						footerDescription={theme.contentModel.globals.footerDescription}
						footerCopyright={theme.contentModel.globals.footerCopyright}
					/>
					{store.showReferralBadge !== false && <ReferralBadge />}
				</div>
				<CartSidebar currency={currency} locale={locale} />
			</CartProvider>
		</StorefrontBasePathProvider>
	);
}

export default async function StoreSlugLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ storeSlug: string }>;
}) {
	await connection();
	const { storeSlug } = await params;
	const globalStore = await getStoreBySlug(storeSlug);
	if (!globalStore) {
		notFound();
	}

	if (globalStore.status === "suspended") {
		return <StoreUnavailable storeName={globalStore.name} />;
	}

	const storeId = globalStore.id;
	const db = await getTenantDb(storeId);
	const store = (await db.query.storeSettings.findFirst()) || {
		name: globalStore.name || "Store",
		showReferralBadge: true,
		currency: "XOF",
		language: "Français",
	};
	const theme = await resolveStorefrontTheme(storeId);
	const basePath = buildStorefrontBasePath(storeSlug);

	return (
		<Suspense>
			<CartProviderWrapper store={store} theme={theme} basePath={basePath}>
				{children}
			</CartProviderWrapper>
		</Suspense>
	);
}
