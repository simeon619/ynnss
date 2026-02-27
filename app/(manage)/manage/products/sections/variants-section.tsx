"use client";

import { ChevronDown, ChevronUp, Loader2, Palette, Plus, Settings2, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { type Option, PREDEFINED_LABELS, PREDEFINED_LABELS_EN, PREDEFINED_VALUES } from "../variant-helpers";

type VariantRow = {
	id?: string;
	name: string;
	sku?: string;
	price: string | number;
	stock: string | number;
	selected: boolean;
	isEnabled: boolean;
	manageInventory?: boolean;
	[key: string]: unknown;
};

interface VariantsSectionProps {
	options: Option[];
	variants: VariantRow[];
	regenerateVariants: (options: Option[]) => void;
	updateOptionName: (index: number, name: string) => void;
	updateOptionType: (index: number, type: "text" | "color" | "image") => void;
	updateOptionVisual: (index: number, value: string, visual: string) => void;
	handleVariantImageUpload: (index: number, value: string, file: File) => Promise<void>;
	uploadingVariantValue: string | null;
	removeOption: (index: number) => void;
	moveOption: (index: number, direction: "up" | "down") => void;
	duplicateOption: (index: number) => void;
	addOption: () => void;
	addOptionValue: (index: number, value: string) => void;
	removeOptionValue: (optionIdx: number, valueIdx: number) => void;
	bulkUpdateVariants: (field: string, value: unknown) => void;
	duplicateSelectedVariants: () => void;
	updateVariantField: (index: number, field: string | Record<string, unknown>, value?: unknown) => void;
	setEditingVariantIdx: (index: number | null) => void;
	getVariantVisuals: (
		variant: Record<string, unknown>,
	) => { type: "color" | "image"; value: string; label: string }[];
}

export function VariantsSection({
	options,
	variants,
	regenerateVariants,
	updateOptionName,
	updateOptionType,
	updateOptionVisual,
	handleVariantImageUpload,
	uploadingVariantValue,
	removeOption,
	moveOption,
	duplicateOption,
	addOption,
	addOptionValue,
	removeOptionValue,
	bulkUpdateVariants,
	duplicateSelectedVariants,
	updateVariantField,
	setEditingVariantIdx,
	getVariantVisuals,
}: VariantsSectionProps) {
	const [valueInputs, setValueInputs] = useState<Record<number, string>>({});
	const [colorInputs, setColorInputs] = useState<Record<number, string>>({});
	const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);

	const handleAddValue = (idx: number) => {
		const val = (valueInputs[idx] || "").trim();
		if (!val) return;
		addOptionValue(idx, val);
		if (options[idx].type === "color" && colorInputs[idx]) {
			updateOptionVisual(idx, val, colorInputs[idx]);
		}
		setValueInputs((prev) => ({ ...prev, [idx]: "" }));
	};

	return (
		<div className="space-y-4">
			{/* ═══ HEADER WITH PROGRESS ═══ */}
			<div className="bg-black p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 bg-white flex items-center justify-center">
							<Settings2 className="text-black" size={16} strokeWidth={2.5} />
						</div>
						<div>
							<h3 className="text-white font-bold text-sm">VARIANTES & OPTIONS</h3>
							<p className="text-neutral-400 text-xs">
								{options.length > 0
									? `${options.length} opt → ${variants.length} var`
									: "Définissez vos options"}
							</p>
						</div>
					</div>
					{variants.length > 0 && (
						<div className="text-right">
							<div className="text-xl font-black text-white">{variants.length}</div>
						</div>
					)}
				</div>
			</div>

			{/* ═══ OPTIONS ═══ */}
			<div className="space-y-3">
				{options.length === 0 && (
					<div className="border-4 border-dashed border-black p-6 text-center bg-white">
						<div className="w-12 h-12 bg-black flex items-center justify-center mx-auto mb-3">
							<Palette className="text-white" size={24} />
						</div>
						<p className="text-sm font-bold text-black mb-1">Créez votre première option</p>
						<p className="text-xs text-black mb-3">Taille, Couleur, Matière...</p>
						<button
							type="button"
							onClick={addOption}
							className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs font-bold border-2 border-black hover:bg-white hover:text-black"
						>
							<Plus size={12} /> Ajouter
						</button>
					</div>
				)}

				{options.map((option, idx) => {
					const optionKey = Object.keys(PREDEFINED_VALUES).find(
						(k) => k.toLowerCase() === option.name.toLowerCase(),
					);
					const predefinedSuggestions = (PREDEFINED_VALUES[optionKey || ""] || []).filter(
						(v) => !option.values.includes(v),
					);

					return (
						<div key={option.id} className="border-2 border-black bg-white overflow-hidden">
							{/* Card header */}
							<div className="bg-black px-3 py-1.5 flex items-center justify-between gap-2">
								<div className="flex items-center gap-1">
									<button
										type="button"
										onClick={() => moveOption(idx, "up")}
										disabled={idx === 0}
										className="h-4 w-4 flex items-center justify-center text-white hover:bg-white hover:text-black disabled:opacity-20 disabled:cursor-not-allowed"
										title="Monter"
									>
										<ChevronUp size={10} />
									</button>
									<button
										type="button"
										onClick={() => moveOption(idx, "down")}
										disabled={idx === options.length - 1}
										className="h-4 w-4 flex items-center justify-center text-white hover:bg-white hover:text-black disabled:opacity-20 disabled:cursor-not-allowed"
										title="Descendre"
									>
										<ChevronDown size={10} />
									</button>
									<span className="text-[9px] font-bold uppercase text-white ml-1">
										{option.name || `OPTION ${idx + 1}`}
									</span>
								</div>
								<div className="flex items-center gap-1">
									<button
										type="button"
										onClick={() => duplicateOption(idx)}
										className="h-5 w-5 flex items-center justify-center text-white hover:bg-white hover:text-black"
										title="Dupliquer"
									>
										<Plus size={11} />
									</button>
									{confirmDeleteIdx === idx ? (
										<div className="flex items-center gap-1">
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													removeOption(idx);
													setConfirmDeleteIdx(null);
												}}
												className="h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-[8px] font-bold hover:bg-red-600"
											>
												OUI
											</button>
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													setConfirmDeleteIdx(null);
												}}
												className="h-5 px-1.5 flex items-center justify-center bg-white text-black text-[8px] font-bold hover:bg-neutral-200"
											>
												NON
											</button>
										</div>
									) : (
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												setConfirmDeleteIdx(idx);
											}}
											className="h-5 w-5 flex items-center justify-center text-white hover:bg-white hover:text-black"
											title="Supprimer cette option"
											aria-label={`Supprimer l'option ${option.name || idx + 1}`}
										>
											<X size={11} />
										</button>
									)}
								</div>
							</div>

							<div className="p-3 space-y-3">
								{/* Name + Type */}
								<div className="grid grid-cols-2 gap-2">
									<div className="space-y-1">
										<label className="text-[8px] font-bold uppercase text-black">Nom</label>
										<input
											list={`labels-${idx}`}
											value={option.name}
											onChange={(e) => updateOptionName(idx, e.target.value)}
											placeholder="Taille, Couleur..."
											className="w-full h-8 px-2 border-2 border-black bg-white focus:outline-none text-xs font-medium"
										/>
										<datalist id={`labels-${idx}`}>
											{[...PREDEFINED_LABELS, ...PREDEFINED_LABELS_EN].map((label) => (
												<option key={label} value={label} />
											))}
										</datalist>
									</div>

									<div className="space-y-1">
										<label className="text-[8px] font-bold text-black">Type</label>
										<select
											value={option.type}
											onChange={(e) => updateOptionType(idx, e.target.value as "text" | "color" | "image")}
											className="w-full h-8 px-2 border-2 border-black bg-white focus:outline-none text-xs font-medium"
										>
											<option value="text">⊞ TEXTE</option>
											<option value="color">◉ COULEUR</option>
											<option value="image">⊟ IMAGE</option>
										</select>
									</div>
								</div>

								{/* Current values */}
								{option.values.length > 0 && (
									<div className="space-y-1">
										<label className="text-[8px] font-bold text-black">
											Valeurs ({option.values.length})
										</label>
										<div className="flex flex-wrap gap-1.5">
											{option.values.map((val, valIdx) => (
												<span
													key={valIdx}
													className="inline-flex items-center gap-1 border border-black bg-black text-white px-2 py-0.5 text-[8px] font-bold"
												>
													{option.type === "color" && option.visuals?.[val] && (
														<span
															className="w-2.5 h-2.5 border border-white/40 shrink-0"
															style={{ backgroundColor: option.visuals[val] }}
														/>
													)}
													{val}
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															removeOptionValue(idx, valIdx);
														}}
														className="opacity-60 hover:opacity-100 ml-0.5"
														aria-label={`Supprimer la valeur ${val}`}
													>
														<X size={8} />
													</button>
												</span>
											))}
										</div>
									</div>
								)}

								{/* Add new value */}
								<div className="space-y-1">
									<label className="text-[8px] font-bold text-black">
										{option.type === "color" ? "Couleur" : option.type === "image" ? "Image" : "Valeur"}
									</label>

									{option.type === "color" ? (
										<div className="flex gap-1.5">
											<input
												type="color"
												value={colorInputs[idx] || "#000000"}
												onChange={(e) => setColorInputs((prev) => ({ ...prev, [idx]: e.target.value }))}
												className="h-8 w-9 border-2 border-black bg-white cursor-pointer shrink-0"
												title="Couleur"
											/>
											<input
												value={valueInputs[idx] || ""}
												onChange={(e) =>
													setValueInputs((prev) => ({
														...prev,
														[idx]: e.target.value,
													}))
												}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														handleAddValue(idx);
													}
												}}
												placeholder="Nom..."
												className="flex-1 h-8 px-2 border-2 border-black bg-white focus:outline-none text-xs"
											/>
											<button
												type="button"
												onClick={() => handleAddValue(idx)}
												className="h-8 w-8 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white shrink-0"
											>
												<Plus size={12} />
											</button>
										</div>
									) : option.type === "image" ? (
										<div className="flex gap-1.5">
											<input
												value={valueInputs[idx] || ""}
												onChange={(e) =>
													setValueInputs((prev) => ({
														...prev,
														[idx]: e.target.value,
													}))
												}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														handleAddValue(idx);
													}
												}}
												placeholder="Nom"
												className="flex-1 h-8 px-2 border-2 border-black bg-white focus:outline-none text-xs"
											/>
											<label
												className={cn(
													"h-8 px-3 flex items-center gap-1 border-2 border-black bg-white text-[8px] font-medium cursor-pointer hover:bg-black hover:text-white shrink-0",
													uploadingVariantValue === `${idx}-${valueInputs[idx]}` && "opacity-50 cursor-wait",
												)}
											>
												{uploadingVariantValue === `${idx}-${valueInputs[idx]}` ? (
													<Loader2 size={10} className="animate-spin" />
												) : (
													<Plus size={10} />
												)}
												IMG
												<input
													type="file"
													accept="image/*"
													className="hidden"
													onChange={(e) => {
														const file = e.target.files?.[0];
														const val = (valueInputs[idx] || "").trim();
														if (!file || !val) return;
														addOptionValue(idx, val);
														handleVariantImageUpload(idx, val, file);
														setValueInputs((prev) => ({ ...prev, [idx]: "" }));
													}}
												/>
											</label>
										</div>
									) : (
										<div className="flex gap-1.5">
											<input
												value={valueInputs[idx] || ""}
												onChange={(e) =>
													setValueInputs((prev) => ({
														...prev,
														[idx]: e.target.value,
													}))
												}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														handleAddValue(idx);
													}
												}}
												placeholder="Ajouter..."
												className="flex-1 h-8 px-2 border-2 border-black bg-white focus:outline-none text-xs"
											/>
											<button
												type="button"
												onClick={() => handleAddValue(idx)}
												className="h-8 w-8 flex items-center justify-center border-2 border-black bg-black text-white hover:bg-white hover:text-black shrink-0"
											>
												<Plus size={12} />
											</button>
										</div>
									)}

									{/* Predefined suggestions */}
									{predefinedSuggestions.length > 0 && (
										<div className="pt-1">
											<span className="text-[7px] font-medium text-black">Suggestions :</span>
											<div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto mt-1">
												{predefinedSuggestions.slice(0, 12).map((val) => (
													<button
														key={val}
														type="button"
														onClick={() => addOptionValue(idx, val)}
														className="px-1.5 py-0.5 border border-black bg-white text-[7px] text-black hover:bg-black hover:text-white"
													>
														+ {val}
													</button>
												))}
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					);
				})}

				<button
					type="button"
					onClick={addOption}
					className="w-full h-12 border-4 border-dashed border-black flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest bg-white hover:bg-black hover:text-white text-black"
				>
					<Plus size={15} strokeWidth={3} /> AJOUTER UNE OPTION
				</button>
			</div>

			{/* ═══ VARIANTES GÉNÉRÉES ═══ */}
			{variants.length > 0 && (
				<div className="space-y-2">
					<div className="flex items-center justify-between bg-black text-white px-3 py-2 border-2 border-b-0 border-black">
						<div className="flex items-center gap-2">
							<Settings2 size={14} className="text-white" />
							<h3 className="text-xs font-bold text-white">VARIANTES ({variants.length})</h3>
						</div>
						<button
							type="button"
							onClick={() => regenerateVariants(options)}
							className="px-2 py-1 border-2 border-white text-[8px] font-medium text-white hover:bg-white hover:text-black"
						>
							Regénérer
						</button>
					</div>

					{variants.filter((v) => v.selected).length > 0 && (
						<div className="flex items-center gap-2 bg-black text-white px-3 py-1.5">
							<span className="text-[8px] font-medium">
								{variants.filter((v) => v.selected).length} sélection
							</span>
							<div className="w-px h-3 bg-white/20" />
							<button
								type="button"
								onClick={() => bulkUpdateVariants("isEnabled", true)}
								className="text-[8px] font-medium text-white hover:underline"
							>
								Activer
							</button>
							<button
								type="button"
								onClick={() => bulkUpdateVariants("isEnabled", false)}
								className="text-[8px] font-medium text-white hover:underline"
							>
								Désactiver
							</button>
							<button
								type="button"
								onClick={() => duplicateSelectedVariants()}
								className="text-[8px] font-medium text-white hover:underline"
							>
								Copier
							</button>
						</div>
					)}

					<div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
						<table className="w-full text-left">
							<thead>
								<tr className="bg-black">
									<th className="p-2 w-8">
										<input
											type="checkbox"
											onChange={(e) => bulkUpdateVariants("selected", e.target.checked)}
											className="w-4 h-4 accent-white cursor-pointer"
										/>
									</th>
									<th className="p-2 font-bold text-[9px] uppercase text-white tracking-wide">Variante</th>
									<th className="p-2 font-bold text-[9px] uppercase text-white tracking-wide w-32">
										Prix (XOF) <span className="text-red-400">*</span>
									</th>
									<th className="p-2 font-bold text-[9px] uppercase text-white tracking-wide w-28">Stock</th>
									<th className="p-2 font-bold text-[9px] uppercase text-white tracking-wide w-16 text-center">
										Actif
									</th>
									<th className="p-2 w-20" />
								</tr>
							</thead>
							<tbody className="divide-y-2 divide-black">
								{variants.map((v, i) => {
									const stockNum = Number(v.stock);
									const isInfinite = !v.manageInventory;
									const isOutOfStock = !isInfinite && (Number.isNaN(stockNum) || stockNum === 0);
									const isLow = !isInfinite && !isOutOfStock && stockNum > 0 && stockNum <= 5;

									return (
										<tr
											key={i}
											className={cn(
												v.selected ? "bg-neutral-200" : "hover:bg-neutral-100",
												!v.isEnabled && "opacity-50",
											)}
										>
											<td className="p-2">
												<input
													type="checkbox"
													checked={v.selected}
													onChange={(e) => updateVariantField(i, "selected", e.target.checked)}
													className="w-4 h-4 border-2 border-black accent-black cursor-pointer"
												/>
											</td>
											<td className="p-2">
												<div className="flex items-center gap-1.5">
													{getVariantVisuals(v).map((visual, vi) =>
														visual.type === "color" ? (
															<span
																key={vi}
																className="w-3 h-3 border border-black shrink-0"
																style={{ backgroundColor: visual.value }}
																title={visual.label}
															/>
														) : null,
													)}
													<div className="text-[10px] font-bold uppercase">{v.name}</div>
												</div>
												{v.sku && <div className="text-[8px] text-neutral-400">{v.sku}</div>}
											</td>
											<td className="p-2">
												<div className="relative">
													<input
														type="text"
														inputMode="numeric"
														value={v.price}
														onChange={(e) => {
															const val = e.target.value.replace(/[^\d]/g, "");
															updateVariantField(i, "price", val);
														}}
														className={`w-full h-10 px-3 pr-8 border-2 focus:outline-none font-mono font-bold text-base text-right ${!v.price || Number(v.price) <= 0 ? "border-red-600 bg-red-50" : "border-black bg-white"}`}
														placeholder="0"
													/>
													<span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
														XOF
													</span>
												</div>
											</td>
											<td className="p-2">
												{isInfinite ? (
													<span className="text-xs font-black text-white bg-black px-2 py-1 border-2 border-black">
														∞ Infini
													</span>
												) : (
													<input
														type="text"
														inputMode="numeric"
														value={v.stock}
														onChange={(e) => {
															const val = e.target.value.replace(/[^\d]/g, "");
															updateVariantField(i, "stock", val);
														}}
														className={cn(
															"w-full h-10 px-3 border-2 bg-white focus:outline-none font-mono font-bold text-base text-right",
															isOutOfStock && "border-red-500 bg-red-50 text-red-600",
															isLow && "border-black bg-white",
															!isOutOfStock && !isLow && "border-black",
														)}
														placeholder="0"
													/>
												)}
											</td>
											<td className="p-2 text-center">
												<button
													type="button"
													onClick={() => updateVariantField(i, "isEnabled", !v.isEnabled)}
													className={cn(
														"text-[9px] font-bold px-3 py-1.5 border-2 border-black",
														v.isEnabled ? "bg-black text-white" : "bg-white text-black",
													)}
												>
													{v.isEnabled ? "ON" : "OFF"}
												</button>
											</td>
											<td className="p-2">
												<button
													type="button"
													onClick={() => setEditingVariantIdx(i)}
													className="text-[9px] font-bold px-3 py-1.5 border-2 border-black hover:bg-black hover:text-white"
												>
													Details
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
