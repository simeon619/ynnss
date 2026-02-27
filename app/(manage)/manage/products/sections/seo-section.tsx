"use client";

import { Globe, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SEOSectionProps {
	product?: {
		seoTitle?: string | null;
		seoDescription?: string | null;
		description?: string | null;
	};
	name: string;
	slug: string;
}

export function SEOSection({ product, name, slug }: SEOSectionProps) {
	return (
		<section className="p-8 md:p-10 border-4 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-12">
			<div className="flex items-center gap-3 border-b-4 border-black pb-4">
				<Globe size={24} strokeWidth={3} className="text-black" />
				<h2 className="text-xl font-black uppercase tracking-tightest">OPTIMISATION SEO</h2>
			</div>
			<div className="space-y-10">
				<div className="p-10 border-4 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-4xl">
					<div className="flex items-center gap-2 mb-6 text-[10px] font-black uppercase text-black">
						<Search size={14} strokeWidth={4} /> APERÇU GOOGLE SEARCH
					</div>
					<div className="space-y-2">
						<p className="text-black underline font-extrabold text-xl uppercase tracking-tight truncate">
							{product?.seoTitle || name || "TITRE DU PRODUIT"} | YNS
						</p>
						<p className="text-black font-mono text-xs font-bold">
							https://yns.store/products/{slug || "slug-du-produit"}
						</p>
						<p className="text-black font-mono text-xs font-medium leading-relaxed max-w-lg truncate">
							{product?.seoDescription || product?.description || "DESCRIPTION..."}
						</p>
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div className="space-y-2">
						<Label className="text-xs font-bold uppercase text-black">Méta Titre</Label>
						<Input
							name="seoTitle"
							defaultValue={product?.seoTitle || ""}
							placeholder="TITRE OPTIMISÉ"
							className="h-14 border-4 border-black font-mono text-[10px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
						/>
					</div>
					<div className="space-y-2">
						<Label className="text-[10px] font-black uppercase text-black">Méta Description</Label>
						<Textarea
							name="seoDescription"
							defaultValue={product?.seoDescription || ""}
							placeholder="DESCRIPTION CAPTIVANTE"
							rows={4}
							className="min-h-[100px] border-4 border-black font-mono text-xs shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] resize-none"
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
