"use client";

import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DetailsSectionProps {
	name: string;
	setName: (name: string) => void;
	slug: string;
	setSlug: (slug: string) => void;
	isAutoSlug: boolean;
	setIsAutoSlug: (isAutoSlug: boolean) => void;
	description?: string;
}

export function DetailsSection({
	name,
	setName,
	slug,
	setSlug,
	isAutoSlug,
	setIsAutoSlug,
	description,
}: DetailsSectionProps) {
	return (
		<section className="p-8 md:p-10 border-4 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-10">
			<div className="flex items-center gap-3 border-b-4 border-black pb-4">
				<Info size={20} strokeWidth={3} className="text-black" />
				<h2 className="text-xl font-black uppercase tracking-tightest">INFORMATIONS GÉNÉRALES</h2>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-black">
					Nom du produit
				</Label>
				<Input
					id="name"
					name="name"
					value={name}
					className="h-12 px-4 border-4 border-black bg-white font-mono text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
					required
					onChange={(e) => {
						setName(e.target.value);
						if (isAutoSlug)
							setSlug(
								e.target.value
									.toLowerCase()
									.trim()
									.replace(/[^\w\s-]/g, "")
									.replace(/[\s_-]+/g, "-")
									.replace(/^-+|-+$/g, ""),
							);
					}}
				/>
			</div>

			<div className="grid gap-2">
				<div className="flex items-center justify-between">
					<Label className="text-xs font-bold uppercase tracking-wider text-black">
						Slug (URL): /product/{slug || "..."}
					</Label>
					<button
						type="button"
						className="h-8 px-4 border-4 border-black bg-white text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
						onClick={() => setIsAutoSlug(!isAutoSlug)}
					>
						{isAutoSlug ? "MANUEL" : "AUTO"}
					</button>
				</div>
				<Input
					id="slug"
					name="slug"
					value={slug}
					onChange={(e) => {
						setSlug(e.target.value);
						setIsAutoSlug(false);
					}}
					className="h-12 px-4 border-4 border-black font-mono text-xs font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
				/>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-black">
					Description
				</Label>
				<Textarea
					id="description"
					name="description"
					defaultValue={description}
					rows={6}
					className="w-full p-6 border-4 border-black font-mono text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] resize-none"
				/>
			</div>
		</section>
	);
}
