"use client";

import { Award, Hammer, Leaf, type LucideIcon } from "lucide-react";

type Feature = {
	title: string;
	description: string;
	icon?: LucideIcon;
};

type ProductFeaturesProps = {
	features?: Feature[];
};

const defaultFeatures: Feature[] = [
	{
		title: "Sustainable Materials",
		description: "Crafted from responsibly sourced materials with minimal environmental impact.",
	},
	{
		title: "Expert Craftsmanship",
		description: "Each piece is carefully made by skilled artisans with attention to detail.",
	},
	{
		title: "Quality Guaranteed",
		description: "Built to last with premium components and rigorous quality standards.",
	},
];

const defaultIcons = [Leaf, Hammer, Award];

export function ProductFeatures({ features = defaultFeatures }: ProductFeaturesProps) {
	// Static features only
	const allFeatures = features;

	return (
		<section className="border-y border-border/30 py-16 lg:py-24 animate-soft-fade-in">
			<div className="max-w-4xl mx-auto">
				<div className="mb-14 text-center space-y-3">
					<h2 className="text-[10px] uppercase tracking-[0.3em] font-semibold text-muted-foreground/40">
						Notre philosophie
					</h2>
					<p className="text-2xl lg:text-4xl font-light tracking-tight text-balance">
						L'excellence au service de votre passion
					</p>
				</div>
				<div className="grid gap-12 md:grid-cols-3">
					{allFeatures.map((feature, index) => {
						const Icon = feature.icon ?? defaultIcons[index % defaultIcons.length];
						return (
							<div
								key={`${feature.title}-${index}`}
								className="group flex flex-col items-center text-center space-y-4"
							>
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/30 transition-all duration-500 group-hover:bg-foreground group-hover:scale-105">
									<Icon className="h-4 w-4 text-foreground/80 transition-colors duration-500 group-hover:text-primary-foreground" />
								</div>
								<div className="space-y-1.5">
									<h3 className="text-[11px] font-bold uppercase tracking-[0.1em]">{feature.title}</h3>
									<p className="text-[13px] text-muted-foreground/70 leading-relaxed font-light">
										{feature.description}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
