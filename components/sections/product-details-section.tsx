import { AddToCartButton } from "@/app/(store)/product/[slug]/add-to-cart-button";
import { ImageGallery } from "@/app/(store)/product/[slug]/image-gallery";
import { ProductAttributes } from "@/app/(store)/product/[slug]/product-attributes";
import { ProductFeatures } from "@/app/(store)/product/[slug]/product-features";
import type { Product } from "@/components/sections/product-grid";
import { Badge } from "@/components/ui/badge";
import { YnsLink } from "@/components/yns-link";
import { formatMoney } from "@/lib/money";
import { prependStorefrontBasePath } from "@/lib/storefront-paths";
import type { ProductDetailsSectionSettings, ThemeRenderProduct } from "@/lib/theme-types";
import { YNSImage } from "@/lib/yns-image";

interface ProductDetailsSectionProps {
	product: ThemeRenderProduct;
	settings: ProductDetailsSectionSettings;
	basePath?: string;
	currency: string;
	locale: string;
	relatedProducts?: Product[];
}

export function ProductDetailsSection({
	product,
	settings,
	basePath = "",
	currency,
	locale,
	relatedProducts,
}: ProductDetailsSectionProps) {
	const enabledVariants = product.variants.filter((variant) => variant.isEnabled !== false);
	if (enabledVariants.length === 0) {
		return null;
	}

	const firstPrice = enabledVariants[0] ? BigInt(enabledVariants[0].price) : BigInt(0);
	const { minPrice, maxPrice } = enabledVariants.reduce(
		(acc, variant) => {
			const price = BigInt(variant.price);
			return {
				minPrice: price < acc.minPrice ? price : acc.minPrice,
				maxPrice: price > acc.maxPrice ? price : acc.maxPrice,
			};
		},
		{
			minPrice: firstPrice,
			maxPrice: firstPrice,
		},
	);

	const priceDisplay =
		enabledVariants.length > 1 && minPrice !== maxPrice
			? `${formatMoney({ amount: minPrice, currency, locale })} - ${formatMoney({ amount: maxPrice, currency, locale })}`
			: formatMoney({ amount: minPrice, currency, locale });

	const allImages = Array.from(
		new Set([...product.images, ...enabledVariants.flatMap((variant) => variant.images)]),
	).filter((img) => Boolean(img && img.trim() !== ""));

	const normalizedVariants = enabledVariants.map((variant) => ({
		...variant,
		stock: variant.stock ?? "",
		isEnabled: variant.isEnabled ?? true,
		manageInventory: variant.manageInventory ?? false,
		attributes: variant.attributes ?? undefined,
	}));

	const isStacked = settings.layout === "stacked";

	return (
		<div
			className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-16"
			data-theme-section
			data-theme-container
		>
			<div
				className={isStacked ? "max-w-3xl mx-auto space-y-10" : "lg:grid lg:grid-cols-2 lg:gap-16 xl:gap-24"}
			>
				<div className="relative">
					<ImageGallery images={allImages} productName={product.name} variants={normalizedVariants} />
				</div>

				<div className="mt-7 sm:mt-10 lg:mt-0 flex flex-col justify-start">
					{settings.showBreadcrumbs && (
						<div className="mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
							<YnsLink
								href={prependStorefrontBasePath(basePath, "/")}
								className="hover:text-foreground transition-colors"
							>
								Accueil
							</YnsLink>
							<span>/</span>
							<span>Produit</span>
						</div>
					)}

					<div className="space-y-4 sm:space-y-5">
						{product.badgeText && (
							<Badge
								className="text-white border-0 px-3 py-0.5 text-[9px] uppercase tracking-wider w-fit"
								style={{
									backgroundColor: product.badgeColor || "black",
								}}
							>
								{product.badgeText}
							</Badge>
						)}
						<h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground lg:text-5xl text-balance leading-[1.15]">
							{product.name}
						</h1>

						<div className="flex items-baseline gap-4">
							<p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground/90 tabular-nums">
								{priceDisplay}
							</p>
						</div>

						<div className="h-px w-full bg-border/30" />

						{settings.showSummary && product.summary && (
							<p className="text-base text-muted-foreground leading-relaxed font-light">{product.summary}</p>
						)}
					</div>

					<div className="mt-8 sm:mt-10 pt-8 sm:pt-10 border-t border-border/40">
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
							currency={currency}
							locale={locale}
						/>
						<ProductAttributes variants={normalizedVariants} />
					</div>
				</div>
			</div>

			{settings.showFeatures && (
				<div className="mt-14 sm:mt-20 lg:mt-40">
					<ProductFeatures />
				</div>
			)}

			{settings.showRelatedProducts && relatedProducts && relatedProducts.length > 0 && (
				<div className="mt-14 sm:mt-20 lg:mt-32 border-t border-border/40 pt-12">
					<h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-8">
						Produits similaires
					</h2>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
						{relatedProducts.map((relProduct) => {
							const img = relProduct.images?.[0];
							const relPrice = relProduct.variants?.[0]?.price;
							return (
								<YnsLink
									key={relProduct.id}
									href={prependStorefrontBasePath(basePath, `/product/${relProduct.slug}`)}
									className="group block"
									data-theme-surface="card"
								>
									<div className="aspect-square overflow-hidden bg-secondary/20 border border-border">
										{img ? (
											<YNSImage
												src={img}
												alt={relProduct.name}
												width={400}
												height={400}
												className="h-full w-full object-cover transition-transform group-hover:scale-105"
											/>
										) : (
											<div className="h-full w-full flex items-center justify-center text-muted-foreground/30 text-xs uppercase">
												No image
											</div>
										)}
									</div>
									<div className="mt-3 space-y-1">
										<p className="text-xs font-bold uppercase tracking-tight truncate">{relProduct.name}</p>
										{relPrice && (
											<p className="text-xs font-black font-mono tabular-nums">
												{formatMoney({ amount: BigInt(relPrice), currency, locale })}
											</p>
										)}
									</div>
								</YnsLink>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
