"use client";

import { useState } from "react";

export function ProductOrganisation() {
	const [selectedCategoryId, setSelectedCategoryId] = useState("");
	const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
	const [tags, setTags] = useState<string[]>([]);
	const [newTag, setNewTag] = useState("");

	const toggleCollection = (slug: string) => {
		if (selectedCollections.includes(slug)) {
			setSelectedCollections((prev) => prev.filter((s) => s !== slug));
		} else {
			setSelectedCollections((prev) => [...prev, slug]);
		}
	};

	const addTag = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && newTag.trim()) {
			e.preventDefault();
			if (!tags.includes(newTag.trim())) {
				setTags([...tags, newTag.trim()]);
			}
			setNewTag("");
		}
	};

	const removeTag = (tag: string) => {
		setTags(tags.filter((t) => t !== tag));
	};

	return (
		<div className="w-full">
			<div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
				<div className="flex items-center gap-3 border-b-4 border-black px-6 py-4 bg-black">
					<span className="w-8 h-8 bg-white text-black flex items-center justify-center font-black text-lg">
						⊞
					</span>
					<h2 className="text-lg font-black uppercase tracking-tight text-white">ORGANISATION</h2>
				</div>

				<div className="p-6 space-y-6">
					<div className="space-y-2">
						<label className="text-xs font-black uppercase tracking-widest text-black">CATÉGORIE</label>
						<select
							name="categoryId"
							value={selectedCategoryId}
							onChange={(e) => setSelectedCategoryId(e.target.value)}
							className="w-full h-14 px-4 border-4 border-black bg-white focus:outline-none font-mono text-xs font-black uppercase"
						>
							<option value="">SÉLECTIONNER...</option>
						</select>
					</div>

					<div className="space-y-2">
						<label className="text-xs font-black uppercase tracking-widest text-black">COLLECTIONS</label>
						<select
							onChange={(e) => toggleCollection(e.target.value)}
							className="w-full h-14 px-4 border-4 border-black bg-white focus:outline-none font-mono text-xs font-black uppercase"
						>
							<option value="">AJOUTER...</option>
						</select>
						{selectedCollections.length > 0 && (
							<div className="flex flex-wrap gap-2 pt-2">
								{selectedCollections.map((s) => (
									<span
										key={s}
										className="inline-flex items-center gap-2 px-3 py-2 bg-black text-white text-xs font-black uppercase"
									>
										{s}
										<button type="button" onClick={() => toggleCollection(s)} className="hover:opacity-60">
											✕
										</button>
									</span>
								))}
							</div>
						)}
					</div>

					<div className="space-y-2">
						<label className="text-xs font-black uppercase tracking-widest text-black">TAGS</label>
						<input
							placeholder="SAISIR + ENTRÉE"
							value={newTag}
							onChange={(e) => setNewTag(e.target.value.toUpperCase())}
							onKeyDown={addTag}
							className="w-full h-14 px-4 border-4 border-dashed border-black bg-white focus:outline-none font-mono text-xs font-black uppercase"
						/>
						{tags.length > 0 && (
							<div className="flex flex-wrap gap-2 pt-2">
								{tags.map((t) => (
									<span
										key={t}
										className="inline-flex items-center gap-2 px-3 py-2 border-2 border-black bg-white text-xs font-black uppercase"
									>
										{t}
										<button type="button" onClick={() => removeTag(t)} className="hover:opacity-60">
											✕
										</button>
									</span>
								))}
							</div>
						)}
					</div>

					<div className="space-y-2">
						<label className="text-xs font-black uppercase tracking-widest text-black">BADGE PRODUIT</label>
						<div className="space-y-3">
							<input
								name="badgeText"
								placeholder="EX: NOUVEAU"
								className="w-full h-12 px-4 border-2 border-black bg-white focus:outline-none font-mono text-xs font-black uppercase"
							/>
							<div className="flex gap-2">
								<input
									type="color"
									name="badgeColorPicker"
									defaultValue="#000000"
									className="w-14 h-12 border-2 border-black bg-white cursor-pointer"
								/>
								<input
									name="badgeColor"
									placeholder="#000000"
									className="flex-1 h-12 px-4 border-2 border-black bg-white focus:outline-none font-mono text-xs font-bold"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
