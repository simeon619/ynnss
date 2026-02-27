import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/sections/product-grid";
import { Button } from "@/components/ui/button";
import { commerce } from "@/lib/commerce";
import { generateSEOMetadata } from "@/lib/seo-utils";
import { YNSImage } from "@/lib/yns-image";

interface CategoryPageData {
	id: string;
	name: string;
	slug: string;
	description?: string | null;
	seoTitle?: string | null;
	seoDescription?: string | null;
	image?: string | null;
	children: Array<{ id: string; name: string; slug: string }>;
	breadcrumbs: Array<{ id: string; name: string; slug: string }>;
	products?: {
		data: Array<{
			id: string;
			name: string;
			slug: string;
			images?: string[];
			variants?: Array<{ price: string }>;
		}>;
	};
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await props.params;
	const category = (await commerce.categoryGet({ idOrSlug: slug })) as CategoryPageData | null;

	if (!category) {
		return {};
	}

	return generateSEOMetadata({
		title: category.seoTitle || category.name,
		description: category.seoDescription || category.description,
		image: category.image,
		addSuffix: true,
	});
}

function Breadcrumbs({
	breadcrumbs,
	current,
}: {
	breadcrumbs: Array<{ id: string; name: string; slug: string }>;
	current: string;
}) {
	return (
		<nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm" aria-label="Breadcrumb">
			<ol className="flex items-center space-x-2">
				<li>
					<Link href="/" className="text-muted-foreground hover:text-foreground">
						Accueil
					</Link>
				</li>
				{breadcrumbs.map((crumb) => (
					<li key={crumb.id} className="flex items-center space-x-2">
						<span className="text-muted-foreground">/</span>
						<Link href={`/category/${crumb.slug}`} className="text-muted-foreground hover:text-foreground">
							{crumb.name}
						</Link>
					</li>
				))}
				<li className="flex items-center space-x-2">
					<span className="text-muted-foreground">/</span>
					<span className="text-foreground font-medium" aria-current="page">
						{current}
					</span>
				</li>
			</ol>
		</nav>
	);
}

function CategoryHeader({ category }: { category: CategoryPageData }) {
	return (
		<section className="relative overflow-hidden bg-secondary/30">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="py-12 sm:py-16 lg:py-20">
					<div className="max-w-2xl">
						<h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-foreground">
							{category.name}
						</h1>
						{category.description && (
							<p className="mt-4 text-lg text-muted-foreground leading-relaxed">{category.description}</p>
						)}
					</div>
				</div>
			</div>
			{category.image && (
				<div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
					<YNSImage
						src={category.image}
						alt={category.name}
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

function SubCategories({ children }: { children: Array<{ id: string; name: string; slug: string }> }) {
	if (!children || children.length === 0) return null;

	return (
		<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b">
			<h2 className="text-lg font-semibold mb-4">Sous-catégories</h2>
			<div className="flex flex-wrap gap-3">
				{children.map((child) => (
					<Button key={child.id} variant="outline" asChild>
						<Link href={`/category/${child.slug}`}>{child.name}</Link>
					</Button>
				))}
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

async function CategoryProducts({ category }: { category: CategoryPageData }) {
	// If categoryGet returns products inside the category object (as implemented in local-commerce)
	// we use that. Note: local-commerce returns { ...category, products: { data: [...] } }
	const products = category.products?.data || [];

	return (
		<ProductGrid
			title={`${category.name}`}
			description={`${products.length} produits`}
			products={products}
			showViewAll={false}
		/>
	);
}

export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
	"use cache";
	cacheLife("minutes");

	const { slug } = await props.params;
	const category = (await commerce.categoryGet({ idOrSlug: slug })) as CategoryPageData | null;

	if (!category) {
		notFound();
	}

	return (
		<main>
			<Breadcrumbs breadcrumbs={category.breadcrumbs || []} current={category.name} />
			<CategoryHeader category={category} />
			<SubCategories>{category.children}</SubCategories>
			<Suspense fallback={<ProductGridSkeleton />}>
				<CategoryProducts category={category} />
			</Suspense>
		</main>
	);
}
