import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/sections/product-grid";
import { commerce } from "@/lib/commerce";
import { generateSEOMetadata } from "@/lib/seo-utils";
import { YNSImage } from "@/lib/yns-image";

interface CollectionPageData {
	id: string;
	name: string;
	slug: string;
	description?: string | null;
	seoTitle?: string | null;
	seoDescription?: string | null;
	image?: string | null;
	bannerImage?: string | null;
	descriptionBottom?: string | null;
	productCollections: Array<{
		product: {
			id: string;
			name: string;
			slug: string;
			images?: string[];
			variants?: Array<{ price: string; images?: string[] }>;
			badgeText?: string | null;
			badgeColor?: string | null;
		};
	}>;
}

export async function generateMetadata(props: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
	const { slug } = await props.params;
	const fullSlug = slug.join("/");
	const collection = (await commerce.collectionGet({ idOrSlug: fullSlug })) as CollectionPageData | null;

	if (!collection) {
		return {};
	}

	return generateSEOMetadata({
		title: collection.seoTitle || collection.name,
		description: collection.seoDescription || collection.description,
		image: collection.image,
		addSuffix: true,
	});
}

function CollectionHeader({ collection }: { collection: CollectionPageData }) {
	return (
		<section className="relative overflow-hidden bg-secondary/30">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="py-12 sm:py-16 lg:py-20">
					<div className="max-w-2xl">
						<h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-foreground">
							{collection.name}
						</h1>
						{collection.description && (
							<p className="mt-4 text-lg text-muted-foreground leading-relaxed">
								{typeof collection.description === "string"
									? collection.description
									: "Explore our curated collection"}
							</p>
						)}
					</div>
				</div>
			</div>
			{(collection.bannerImage || collection.image) && (
				<div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
					<YNSImage
						src={(collection.bannerImage || collection.image) as string}
						alt={collection.name}
						fill
						className="object-cover opacity-30"
						priority
					/>
					<div className="absolute inset-0 bg-linear-to-r from-secondary/30 to-transparent" />
				</div>
			)}
		</section>
	);
}

function CollectionDescriptionBottom({ collection }: { collection: CollectionPageData }) {
	if (!collection.descriptionBottom) return null;
	return (
		<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t mt-12 mb-24">
			<div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
				<div dangerouslySetInnerHTML={{ __html: collection.descriptionBottom.replace(/\n/g, "<br/>") }} />
			</div>
		</section>
	);
}

function ProductGridSkeleton() {
	return (
		<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={`skeleton-${i}`}>
						<div className="aspect-square bg-secondary rounded-2xl mb-4 animate-pulse" />
						<div className="space-y-2">
							<div className="h-5 w-3/4 bg-secondary rounded animate-pulse" />
							<div className="h-5 w-1/4 bg-secondary rounded animate-pulse" />
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

function CollectionProducts({ collection }: { collection: CollectionPageData }) {
	const products = collection.productCollections.map((pc) => pc.product);

	return (
		<ProductGrid
			title={`${collection.name} Collection`}
			description={`${products.length} products`}
			products={products}
			showViewAll={false}
		/>
	);
}

export default async function CollectionPage(props: PageProps<"/collection/[...slug]">) {
	"use cache";
	cacheLife("minutes");

	const { slug } = await props.params;
	const fullSlug = slug.join("/");
	const collection = (await commerce.collectionGet({ idOrSlug: fullSlug })) as CollectionPageData | null;

	if (!collection) {
		notFound();
	}

	return (
		<main>
			<CollectionHeader collection={collection} />
			<Suspense fallback={<ProductGridSkeleton />}>
				<CollectionProducts collection={collection} />
			</Suspense>
			<CollectionDescriptionBottom collection={collection} />
		</main>
	);
}
