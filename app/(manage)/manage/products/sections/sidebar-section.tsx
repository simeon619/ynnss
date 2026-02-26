"use client";

import { LayoutGrid, Tag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SidebarSectionProps {
	categories: { id: string; name: string }[];
	selectedCategoryId: string;
	setSelectedCategoryId: (id: string) => void;
	collections: { id: string; name: string; slug: string }[];
	selectedCollections: string[];
	toggleCollection: (slug: string) => void;
	tags: string[];
	newTag: string;
	setNewTag: (tag: string) => void;
	addTag: (e: React.KeyboardEvent) => void;
	removeTag: (tag: string) => void;
	product?: { badgeText?: string | null; badgeColor?: string | null };
}

export function SidebarSection({
	categories,
	selectedCategoryId,
	setSelectedCategoryId,
	collections,
	selectedCollections,
	toggleCollection,
	tags,
	newTag,
	setNewTag,
	addTag,
	removeTag,
	product,
}: SidebarSectionProps) {
	return (
		<div className="w-full space-y-12">
			<section className="p-6 md:p-8 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8">
				<div className="flex items-center gap-3 border-b-4 border-black pb-4">
					<LayoutGrid size={18} strokeWidth={3} className="text-black" />
					<h2 className="text-base font-black uppercase tracking-tightest">ORGANISATION</h2>
				</div>
				<div className="space-y-8">
					<div className="space-y-1.5">
						<Label className="text-xs font-bold uppercase text-black">Catégorie</Label>
						<select
							name="categoryId"
							value={selectedCategoryId}
							onChange={(e) => setSelectedCategoryId(e.target.value)}
							className="w-full h-12 px-3 border-4 border-black bg-white font-mono text-xs font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
						>
							<option value="">SÉLECTIONNER...</option>
							{categories.map((c) => (
								<option key={c.id} value={c.id}>
									{c.name.toUpperCase()}
								</option>
							))}
						</select>
					</div>
					<div className="space-y-2">
						<Label className="text-[10px] font-black uppercase text-black">Collections</Label>
						<div className="flex flex-wrap gap-2 mb-2">
							{selectedCollections.map((s) => (
								<Badge
									key={s}
									className="bg-black text-white px-3 py-1 rounded-none border-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
								>
									<span className="text-[10px] font-bold uppercase">
										{(collections.find((c) => c.slug === s)?.name || s).toUpperCase()}
									</span>
									<button type="button" onClick={() => toggleCollection(s)}>
										<X size={12} />
									</button>
								</Badge>
							))}
						</div>
						<select
							onChange={(e) => toggleCollection(e.target.value)}
							className="w-full h-12 px-4 border-4 border-black bg-white font-mono text-xs font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
						>
							<option value="">AJOUTER...</option>
							{collections.map((c) => (
								<option key={c.id} value={c.slug} disabled={selectedCollections.includes(c.slug)}>
									{c.name.toUpperCase()}
								</option>
							))}
						</select>
					</div>
					<div className="space-y-2">
						<Label className="text-[10px] font-black uppercase text-black">Tags</Label>
						<div className="flex flex-wrap gap-2 mb-2">
							{tags.map((t) => (
								<Badge
									key={t}
									className="bg-white text-black border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1 flex items-center gap-2"
								>
									<span className="text-[10px] font-black uppercase">{t}</span>
									<button type="button" onClick={() => removeTag(t)}>
										<X size={12} />
									</button>
								</Badge>
							))}
						</div>
						<Input
							placeholder="AJOUTER UN TAG"
							value={newTag}
							onChange={(e) => setNewTag(e.target.value.toUpperCase())}
							onKeyDown={addTag}
							className="h-12 border-4 border-dashed border-black font-mono text-[10px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
						/>
					</div>
				</div>
			</section>

			<section className="p-6 md:p-8 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8">
				<div className="flex items-center gap-3 border-b-4 border-black pb-4">
					<Tag size={18} strokeWidth={3} className="text-black" />
					<h2 className="text-base font-black uppercase tracking-tightest">BADGE PRODUIT</h2>
				</div>
				<div className="space-y-6">
					<div className="space-y-2">
						<Label className="text-[10px] font-black uppercase text-black">Libellé</Label>
						<Input
							name="badgeText"
							placeholder="EX: NOUVEAU"
							defaultValue={product?.badgeText || ""}
							className="h-12 border-4 border-black font-mono text-[10px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
						/>
					</div>
					<div className="space-y-2">
						<Label className="text-[10px] font-black uppercase text-black">Couleur (HEX)</Label>
						<div className="flex gap-4">
							<input
								type="color"
								name="badgeColorPicker"
								defaultValue={product?.badgeColor || "#000000"}
								onChange={(e) => {
									const el = document.getElementsByName("badgeColor")[0] as HTMLInputElement;
									if (el) el.value = e.target.value.toUpperCase();
								}}
								className="w-12 h-12 border-4 border-black p-1 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
							/>
							<Input
								name="badgeColor"
								placeholder="#000000"
								defaultValue={product?.badgeColor || "#000000"}
								className="flex-1 h-12 border-4 border-black font-mono text-sm font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
							/>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
