import { YnsLink } from "@/components/yns-link";
import { commerce } from "@/lib/commerce";

interface FooterCategory {
	id: string;
	name: string;
	slug: string;
	parentId: string | null;
}

async function FooterCollections() {
	const { data: categories } = await commerce.categoryBrowse();
	const topLevelCategories = (categories as FooterCategory[]).filter(
		(category) => category.parentId === null,
	);

	return (
		<div>
			<h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Collections</h3>
			<ul className="mt-4 space-y-3">
				{topLevelCategories.map((category) => (
					<li key={category.id}>
						<YnsLink
							prefetch={"eager"}
							href={`/category/${category.slug}`}
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							{category.name}
						</YnsLink>
					</li>
				))}
			</ul>
		</div>
	);
}

export function Footer() {
	return (
		<footer className="border-t border-border bg-background">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="py-12 sm:py-16 flex flex-col sm:row gap-8 sm:gap-16">
					{/* Brand */}
					<div className="sm:max-w-xs">
						<YnsLink
							prefetch={"eager"}
							href="/"
							className="text-xl font-black text-foreground uppercase italic tracking-tighter"
						>
							UrbanFit
						</YnsLink>
						<p className="mt-4 text-sm text-muted-foreground leading-relaxed">
							Votre destination premium pour les maillots officiels, survêtements et sneakers de performance
							en Côte d'Ivoire.
						</p>
					</div>

					{/* Collections */}
					<FooterCollections />
				</div>

				{/* Bottom bar */}
				<div className="py-6 border-t border-border">
					<p className="text-sm text-muted-foreground">
						&copy; {new Date().getFullYear()} UrbanFit. Tous droits réservés.
					</p>
				</div>
			</div>
		</footer>
	);
}
