import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/app/(store)/product/[slug]/add-to-cart-button";
import { ImageGallery } from "@/app/(store)/product/[slug]/image-gallery";
import { ProductAttributes } from "@/app/(store)/product/[slug]/product-attributes";
import { ProductFeatures } from "@/app/(store)/product/[slug]/product-features";
import { Badge } from "@/components/ui/badge";
import { YnsLink } from "@/components/yns-link";
import { commerce } from "@/lib/commerce";
import { CURRENCY, LOCALE } from "@/lib/constants";
import { formatMoney } from "@/lib/money";

import { generateSEOMetadata } from "@/lib/seo-utils";

interface ProductPageVariant {
	id: string;
	price: string;
	images: string[];
	combinations: Array<Record<string, string | number>>;
	stock?: string | number | null;
	manageInventory?: boolean | null;
	isEnabled?: boolean | null;
	attributes?: { key: string; value: string }[] | null;
}

interface ProductPageData {
	id: string;
	name: string;
	slug: string;
	description?: string | null;
	summary?: string | null;
	seoTitle?: string | null;
	seoDescription?: string | null;
	images: string[];
	options?: unknown[] | null;
	badgeText?: string | null;
	badgeColor?: string | null;
	variants: ProductPageVariant[];
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await props.params;
	const product = (await commerce.productGet({ idOrSlug: slug })) as ProductPageData | null;

	if (!product) {
		return {};
	}

	return generateSEOMetadata({
		title: product.seoTitle || product.name,
		description: product.seoDescription || product.summary || product.description,
		image: product.images?.[0],
		addSuffix: false,
	});
}

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
	"use cache";
	cacheLife("minutes");

	return <ProductDetails params={props.params} />;
}

const ProductDetails = async ({ params }: { params: Promise<{ slug: string }> }) => {
	const { slug } = await params;
	const product = (await commerce.productGet({ idOrSlug: slug })) as ProductPageData | null;

	if (!product) {
		notFound();
	}

	// Filter out disabled variants
	product.variants = product.variants.filter((variant) => variant.isEnabled !== false);

	const { minPrice, maxPrice } = product.variants.reduce(
		(acc, variant) => {
			const price = BigInt(variant.price);
			return {
				minPrice: price < acc.minPrice ? price : acc.minPrice,
				maxPrice: price > acc.maxPrice ? price : acc.maxPrice,
			};
		},
		{
			minPrice: product.variants[0] ? BigInt(product.variants[0].price) : BigInt(0),
			maxPrice: product.variants[0] ? BigInt(product.variants[0].price) : BigInt(0),
		},
	);

	const priceDisplay =
		product.variants.length > 1 && minPrice !== maxPrice
			? `${formatMoney({ amount: minPrice, currency: CURRENCY, locale: LOCALE })} - ${formatMoney({ amount: maxPrice, currency: CURRENCY, locale: LOCALE })}`
			: formatMoney({ amount: minPrice, currency: CURRENCY, locale: LOCALE });

	const allImages = Array.from(
		new Set([...product.images, ...product.variants.flatMap((variant) => variant.images)]),
	).filter((img) => img && img.trim() !== "");
	const normalizedVariants = product.variants.map((variant) => ({
		...variant,
		stock: variant.stock ?? "",
		isEnabled: variant.isEnabled ?? true,
		manageInventory: variant.manageInventory ?? false,
		attributes: variant.attributes ?? undefined,
	}));

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 animate-soft-fade-in">
			<div className="lg:grid lg:grid-cols-2 lg:gap-20 xl:gap-28">
				{/* Left: Image Gallery (sticky on desktop) */}
				<div className="relative">
					<ImageGallery images={allImages} productName={product.name} variants={normalizedVariants} />
				</div>

				{/* Right: Product Details */}
				<div className="mt-10 lg:mt-0 flex flex-col justify-start">
					{/* Breadcrumbs (Optional but premium) */}
					<div className="mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
						<YnsLink href="/" className="hover:text-foreground transition-colors">
							Accueil
						</YnsLink>
						<span>/</span>
						<span>Produit</span>
					</div>

					{/* Title, Price, Description */}
					<div className="space-y-5">
						{product.badgeText && (
							<Badge
								className="text-white border-0 px-3 py-0.5 text-[9px] uppercase tracking-wider w-fit rounded-full"
								style={{
									backgroundColor: product.badgeColor || "black",
								}}
							>
								{product.badgeText}
							</Badge>
						)}
						<h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-5xl text-balance leading-[1.15]">
							{product.name}
						</h1>

						<div className="flex items-baseline gap-4">
							<p className="text-2xl font-light tracking-tight text-foreground/90">{priceDisplay}</p>
						</div>

						<div className="h-px w-full bg-border/30" />

						{product.summary && (
							<p className="text-base text-muted-foreground leading-relaxed font-light">{product.summary}</p>
						)}
					</div>

					{/* Variant Selector, Quantity, Add to Cart, Trust Badges */}
					<div className="mt-10 pt-10 border-t border-border/40">
						<AddToCartButton
							variants={normalizedVariants}
							product={{
								id: product.id,
								name: product.name,
								slug: product.slug,
								images: product.images,
								options:
									(product.options as
										| Array<{ name: string; visuals?: Record<string, string> }>
										| undefined) ?? undefined,
							}}
						/>
						<ProductAttributes variants={normalizedVariants} />
					</div>
				</div>
			</div>

			{/* Features Section (full width below) */}
			<div className="mt-24 lg:mt-40">
				<ProductFeatures />
			</div>
		</div>
	);
};
