import type { ReactNode } from "react";
import { CheckoutForm } from "@/app/(store)/checkout/checkout-form";
import { CategoryHeaderSection } from "@/components/sections/category-header-section";
import { CheckoutSummarySection } from "@/components/sections/checkout-summary-section";
import { CollectionHeaderSection } from "@/components/sections/collection-header-section";
import { Hero } from "@/components/sections/hero";
import { ImageWithTextSection } from "@/components/sections/image-with-text-section";
import { NewsletterSection } from "@/components/sections/newsletter-section";
import { ProductDetailsSection } from "@/components/sections/product-details-section";
import type { Product } from "@/components/sections/product-grid";
import { ProductGrid } from "@/components/sections/product-grid";
import { RichTextSection } from "@/components/sections/rich-text-section";
import { commerce } from "@/lib/commerce";
import { formatMoney } from "@/lib/money";
import type { ThemeRenderContext, ThemeSectionInstance, ThemeSectionType } from "@/lib/theme-types";
import { createDefaultSection } from "@/lib/theme-utils";

type SectionRendererArgs = {
	section: ThemeSectionInstance;
	basePath?: string;
	context?: ThemeRenderContext;
};

type SectionDefinition = {
	label: string;
	render: (args: SectionRendererArgs) => Promise<ReactNode> | ReactNode;
};

export const SECTION_REGISTRY: Record<ThemeSectionType, SectionDefinition> = {
	hero: {
		label: "Hero",
		render: ({ section, basePath = "" }) => {
			if (section.type !== "hero") return null;
			return (
				<Hero
					title={section.settings.title}
					subtitle={section.settings.subtitle}
					image={section.settings.image}
					primaryCtaLabel={section.settings.primaryCtaLabel}
					primaryCtaHref={section.settings.primaryCtaHref}
					secondaryCtaLabel={section.settings.secondaryCtaLabel}
					secondaryCtaHref={section.settings.secondaryCtaHref}
					basePath={basePath}
					textAlign={section.settings.textAlign}
					overlayOpacity={section.settings.overlayOpacity}
					height={section.settings.height}
					backgroundColor={section.settings.backgroundColor}
					foregroundColor={section.settings.foregroundColor}
					blocks={section.blocks}
				/>
			);
		},
	},
	productGrid: {
		label: "Product Grid",
		render: async ({ section, basePath = "", context }) => {
			if (section.type !== "productGrid") return null;
			const storeId = context?.storefront?.storeId;
			let products: Product[] | undefined;
			let title = section.settings.title;
			let description = section.settings.description;

			if (context?.collection?.products?.length) {
				products = context.collection.products;
				title = context.collection.name;
				description = `${context.collection.products.length} produits`;
			}

			if (context?.category?.products?.length) {
				products = context.category.products;
				title = context.category.name;
				description = `${context.category.products.length} produits`;
			}

			if ((section.settings.featuredProductIds?.length || 0) > 0) {
				const featuredProducts = (
					await Promise.all(
						(section.settings.featuredProductIds || []).map((productId) =>
							commerce.productGet({ idOrSlug: productId, storeId }),
						),
					)
				).filter((product): product is Product => Boolean(product));
				if (featuredProducts.length > 0) {
					products = featuredProducts;
				}
			} else if (section.settings.collectionId) {
				const collection = (await commerce.collectionGet({
					idOrSlug: section.settings.collectionId,
					storeId,
				})) as {
					name?: string;
					description?: string | null;
					productCollections?: Array<{ product: Product }>;
				} | null;

				if (collection?.productCollections?.length) {
					products = collection.productCollections.map((item) => item.product);
					title = collection.name || title;
					description = collection.description || `${products.length} produits`;
				}
			}

			return (
				<ProductGrid
					title={title}
					description={description}
					products={products}
					limit={section.settings.limit}
					showViewAll={section.settings.showViewAll}
					viewAllHref={section.settings.viewAllHref}
					basePath={basePath}
					currency={context?.storefront?.currency}
					locale={context?.storefront?.locale}
					storeId={storeId}
					columns={section.settings.columns}
					imageRatio={section.settings.imageRatio}
				/>
			);
		},
	},
	productDetails: {
		label: "Product Details",
		render: async ({ section, basePath = "", context }) => {
			if (section.type !== "productDetails") return null;
			if (!context?.product) return null;

			const currency = context.storefront?.currency || "XOF";
			const locale = context.storefront?.locale || "fr-CI";
			const storeId = context.storefront?.storeId;

			let relatedProducts: Product[] | undefined;
			if (section.settings.showRelatedProducts) {
				const browsed = (await commerce.productBrowse({
					limit: 5,
					active: true,
					storeId,
				})) as Product[] | undefined;
				relatedProducts = browsed?.filter((p) => p.id !== context.product?.id).slice(0, 4);
			}

			return (
				<ProductDetailsSection
					product={context.product}
					settings={section.settings}
					basePath={basePath}
					currency={currency}
					locale={locale}
					relatedProducts={relatedProducts}
				/>
			);
		},
	},
	collectionHeader: {
		label: "Collection Header",
		render: ({ section, context }) => {
			if (section.type !== "collectionHeader") return null;
			if (!context?.collection) return null;

			return (
				<CollectionHeaderSection
					name={context.collection.name}
					description={context.collection.description}
					image={context.collection.image}
					bannerImage={context.collection.bannerImage}
					showDescription={section.settings.showDescription}
					showImage={section.settings.showImage}
				/>
			);
		},
	},
	categoryHeader: {
		label: "Category Header",
		render: ({ section, basePath = "", context }) => {
			if (section.type !== "categoryHeader") return null;
			if (!context?.category) return null;

			return (
				<CategoryHeaderSection
					name={context.category.name}
					description={context.category.description}
					image={context.category.image}
					breadcrumbs={context.category.breadcrumbs}
					subcategories={context.category.children}
					showBreadcrumbs={section.settings.showBreadcrumbs}
					showDescription={section.settings.showDescription}
					showImage={section.settings.showImage}
					showSubcategories={section.settings.showSubcategories}
					basePath={basePath}
				/>
			);
		},
	},
	checkoutSummary: {
		label: "Checkout Summary",
		render: ({ section, context }) => {
			if (section.type !== "checkoutSummary") return null;
			if (!context?.checkout) return null;

			return (
				<CheckoutSummarySection
					title={section.settings.title}
					description={section.settings.description}
					lineItemsCount={context.checkout.cart.lineItems.length}
					subtotal={context.checkout.subtotal}
					currency={context.checkout.currency}
					locale={context.checkout.locale}
				/>
			);
		},
	},
	checkoutForm: {
		label: "Checkout Form",
		render: ({ section, context }) => {
			if (section.type !== "checkoutForm") return null;
			if (!context?.checkout) return null;

			const subtotalAmount = BigInt(context.checkout.subtotal);
			const subtotalLabel = formatMoney({
				amount: subtotalAmount,
				currency: context.checkout.currency,
				locale: context.checkout.locale,
			});

			return (
				<section className="max-w-6xl mx-auto px-4 py-12 lg:px-8" data-theme-section data-theme-container>
					<div className="mb-8">
						<h2 className="text-3xl font-bold tracking-tight">{section.settings.title}</h2>
						<p className="mt-2 text-sm font-bold uppercase text-muted-foreground">
							Sous-total: {subtotalLabel}
						</p>
					</div>
					<CheckoutForm
						cart={context.checkout.cart}
						subtotal={context.checkout.subtotal}
						currency={context.checkout.currency}
						locale={context.checkout.locale}
					/>
				</section>
			);
		},
	},
	richText: {
		label: "Rich Text",
		render: ({ section }) => {
			if (section.type !== "richText") return null;
			return <RichTextSection settings={section.settings} />;
		},
	},
	imageWithText: {
		label: "Image + Text",
		render: ({ section }) => {
			if (section.type !== "imageWithText") return null;
			return <ImageWithTextSection settings={section.settings} />;
		},
	},
	newsletter: {
		label: "Newsletter",
		render: ({ section }) => {
			if (section.type !== "newsletter") return null;
			return <NewsletterSection settings={section.settings} />;
		},
	},
};

export const THEME_SECTION_TYPES = Object.keys(SECTION_REGISTRY) as ThemeSectionType[];

export { createDefaultSection };
