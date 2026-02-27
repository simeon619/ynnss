import { ArrowRight } from "lucide-react";
import { cacheLife } from "next/cache";
import { Badge } from "@/components/ui/badge";
import { commerce } from "@/lib/commerce";
import { CURRENCY, LOCALE } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { YNSImage } from "@/lib/yns-image";
import { YnsLink } from "../yns-link";

export interface Product {
	id: string;
	name: string;
	slug: string;
	images?: string[] | null;
	variants?: Array<{ price: string; images?: string[] | null }>;
	badgeText?: string | null;
	badgeColor?: string | null;
}

type ProductGridProps = {
	title?: string;
	description?: string;
	products?: Product[];
	limit?: number;
	showViewAll?: boolean;
	viewAllHref?: string;
};

export async function ProductGrid({
	title = "Featured Products",
	description = "Handpicked favorites from our collection",
	products,
	limit = 6,
	showViewAll = true,
	viewAllHref = "/products",
}: ProductGridProps) {
	"use cache";
	cacheLife("minutes");

	const displayProducts: Product[] = products ?? (await commerce.productBrowse({ active: true, limit })).data;

	return (
		<section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
			<div className="flex items-end justify-between mb-12">
				<div>
					<h2 className="text-2xl sm:text-3xl font-medium text-foreground">{title}</h2>
					<p className="mt-2 text-muted-foreground">{description}</p>
				</div>
				{showViewAll && (
					<YnsLink
						prefetch={"eager"}
						href={viewAllHref}
						className="hidden sm:inline-flex items-center gap-1 text-sm font-black uppercase underline hover:no-underline"
					>
						View all
						<ArrowRight className="h-4 w-4" />
					</YnsLink>
				)}
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
				{displayProducts.map((product: Product, index: number) => {
					const variants = "variants" in product ? product.variants : null;
					const firstVariantPrice = variants?.[0] ? BigInt(variants[0].price) : null;
					const { minPrice, maxPrice } =
						variants && firstVariantPrice !== null
							? variants.reduce(
									(acc: { minPrice: bigint; maxPrice: bigint }, v: { price: string }) => {
										const price = BigInt(v.price);
										return {
											minPrice: price < acc.minPrice ? price : acc.minPrice,
											maxPrice: price > acc.maxPrice ? price : acc.maxPrice,
										};
									},
									{ minPrice: firstVariantPrice, maxPrice: firstVariantPrice },
								)
							: { minPrice: null, maxPrice: null };

					const priceDisplay =
						variants && variants.length > 1 && minPrice && maxPrice && minPrice !== maxPrice
							? `${formatMoney({ amount: minPrice, currency: CURRENCY, locale: LOCALE })} - ${formatMoney({ amount: maxPrice, currency: CURRENCY, locale: LOCALE })}`
							: minPrice
								? formatMoney({ amount: minPrice, currency: CURRENCY, locale: LOCALE })
								: null;

					const allImages = [
						...(product.images ?? []),
						...(variants
							?.flatMap((variant) => variant.images ?? [])
							.filter((img: string) => !(product.images ?? []).includes(img)) ?? []),
					];
					const primaryImage = allImages[0];
					const secondaryImage = allImages[1];

					return (
						<YnsLink
							prefetch={"eager"}
							key={product.id}
							href={`/product/${product.slug}`}
							className="group relative"
						>
							<div className="relative aspect-square bg-neutral-100 border-2 border-black overflow-hidden mb-4">
								{product.badgeText && (
									<div className="absolute top-2 left-2 z-10">
										<Badge
											className="text-white border-0"
											style={{
												backgroundColor: product.badgeColor || "black",
											}}
										>
											{product.badgeText}
										</Badge>
									</div>
								)}
								{primaryImage && (
									<YNSImage
										src={primaryImage}
										alt={product.name}
										fill
										sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
										className="object-cover group-hover:opacity-0"
										priority={Boolean(index < 3)}
									/>
								)}
								{secondaryImage && (
									<YNSImage
										src={secondaryImage}
										alt={`${product.name} - alternate view`}
										fill
										sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
										className="object-cover opacity-0 group-hover:opacity-100"
									/>
								)}
							</div>
							<div className="space-y-1">
								<h3 className="text-base font-black uppercase">{product.name}</h3>
								<p className="text-base font-black font-mono tabular-nums">{priceDisplay}</p>
							</div>
						</YnsLink>
					);
				})}
			</div>

			{showViewAll && (
				<div className="mt-12 text-center sm:hidden">
					<YnsLink
						prefetch={"eager"}
						href={viewAllHref}
						className="inline-flex items-center gap-1 text-sm font-black uppercase underline hover:no-underline"
					>
						View all products
						<ArrowRight className="h-4 w-4" />
					</YnsLink>
				</div>
			)}
		</section>
	);
}
