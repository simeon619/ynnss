"use client";

import axios from "axios";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createProduct, updateProduct } from "../actions";
import { MediaSection } from "./sections/media-section";
import { SEOSection } from "./sections/seo-section";
import { VariantsSection } from "./sections/variants-section";
import type { ProductWithRelations } from "./types";
import { VariantDetailsSheet } from "./variant-details-sheet";
import {
	formatVariantName,
	generateCombinations,
	generateId,
	type Option,
	reconstructOptions,
} from "./variant-helpers";

interface ProductFormProps {
	product?: ProductWithRelations;
	categories?: { id: string; name: string }[];
	collections?: { id: string; name: string; slug: string }[];
	title?: string;
	description?: string;
	showOrganisation?: boolean;
}

export function ProductForm({ product, categories, collections, title, description }: ProductFormProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const [selectedCollections, setSelectedCollections] = useState<string[]>(product?.collections || []);
	const [tags, setTags] = useState<string[]>(product?.tags || []);
	const [newTag, setNewTag] = useState("");
	const [images, setImages] = useState<string[]>(product?.images || []);
	const [slug, setSlug] = useState(product?.slug || "");
	const [isAutoSlug, setIsAutoSlug] = useState(!product?.slug);
	const [name, setName] = useState(product?.name || "");
	const [selectedCategoryId, setSelectedCategoryId] = useState(product?.categoryId || "");
	const [activeTab, setActiveTab] = useState<"details" | "seo">("details");

	// Price & Inventory State (Simple Product)
	const [price, setPrice] = useState(String(product?.price || ""));
	const [costPrice, setCostPrice] = useState(String(product?.costPrice || ""));
	const [stock, setStock] = useState(String(product?.stock || ""));

	// Variant State
	const [options, setOptions] = useState<Option[]>(() => {
		if (product?.options && Array.isArray(product.options) && product.options.length > 0) {
			return product.options as Option[];
		}
		return product?.variants ? reconstructOptions(product.variants) : [];
	});

	const [variants, setVariants] = useState<Record<string, unknown>[]>(() => {
		if (!product?.variants || product.variants.length === 0) {
			return [
				{
					id: undefined,
					name: "Default Variant",
					combination: {},
					price: String(product?.price || ""),
					stock: product?.stock || 0,
					sku: product?.sku || "",
					width: "",
					height: "",
					depth: "",
					weight: "",
					costPrice: product?.costPrice || "",
					compareAtPrice: "",
					barcode: product?.barcode || "",
					shippable: true,
					isEnabled: true,
					isDefault: true,
					selected: false,
					manageInventory: false,
				},
			];
		}
		return product.variants.map((v) => ({
			...v,
			combination: v.combinations?.[0] || {},
			name: formatVariantName(v.combinations?.[0] || {}),
			price: String(v.price),
			stock: v.stock,
			width: v.width || "",
			height: v.height || "",
			depth: v.depth || "",
			weight: v.weight || "",
			costPrice: v.costPrice || "",
			compareAtPrice: v.compareAtPrice || "",
			barcode: v.barcode || "",
			shippable: v.shippable !== false,
			isEnabled: v.isEnabled !== false,
			isDefault: false,
			selected: false,
			manageInventory: v.manageInventory ?? true,
		}));
	});

	const [editingVariantIdx, setEditingVariantIdx] = useState<number | null>(null);

	const addOption = () => {
		const newOptions: Option[] = [
			...options,
			{ id: generateId(), name: "", values: [] as string[], type: "text" as const },
		];
		setOptions(newOptions);
		regenerateVariants(newOptions);
	};

	const removeOption = (index: number) => {
		const newOptions = options.filter((_, i) => i !== index);
		setOptions(newOptions);
		regenerateVariants(newOptions);
	};

	const moveOption = (index: number, direction: "up" | "down") => {
		if ((direction === "up" && index === 0) || (direction === "down" && index === options.length - 1)) {
			return;
		}
		const newOptions = [...options];
		const newIndex = direction === "up" ? index - 1 : index + 1;
		[newOptions[index], newOptions[newIndex]] = [newOptions[newIndex], newOptions[index]];
		setOptions(newOptions);
		regenerateVariants(newOptions);
	};

	const duplicateOption = (index: number) => {
		const optionToDuplicate = options[index];
		const newOption: Option = {
			...optionToDuplicate,
			id: generateId(),
			name: `${optionToDuplicate.name} (copie)`,
			values: [...optionToDuplicate.values],
			visuals: optionToDuplicate.visuals ? { ...optionToDuplicate.visuals } : undefined,
		};
		const newOptions = [...options];
		newOptions.splice(index + 1, 0, newOption);
		setOptions(newOptions);
		regenerateVariants(newOptions);
	};

	const updateOptionName = (index: number, name: string) => {
		const newOptions = options.map((opt, i) => (i === index ? { ...opt, name } : opt));
		setOptions(newOptions);
		regenerateVariants(newOptions);
	};

	const updateOptionValues = (index: number, values: string[]) => {
		const newOptions = options.map((opt, i) => (i === index ? { ...opt, values } : opt));
		setOptions(newOptions);
		regenerateVariants(newOptions);
	};

	const updateOptionType = (index: number, type: "text" | "color" | "image") => {
		const newOptions = options.map((opt, i) => (i === index ? { ...opt, type } : opt));
		setOptions(newOptions);
		regenerateVariants(newOptions);
	};

	const updateOptionVisual = (index: number, value: string, visual: string) => {
		const newOptions = options.map((opt, i) => {
			if (i === index) {
				const newVisuals = { ...(opt.visuals || {}) };
				newVisuals[value] = visual;
				return { ...opt, visuals: newVisuals };
			}
			return opt;
		});
		setOptions(newOptions);
	};

	const [uploadingVariantValue, setUploadingVariantValue] = useState<string | null>(null);

	const handleVariantImageUpload = async (index: number, value: string, file: File) => {
		try {
			setUploadingVariantValue(`${index}-${value}`);
			const { data } = await axios.post("/api/upload", {
				filename: file.name,
				contentType: file.type,
			});
			await axios.put(data.uploadUrl, file, {
				headers: { "Content-Type": file.type },
			});
			updateOptionVisual(index, value, data.publicUrl);
		} catch (error) {
			console.error("Variant image upload failed", error);
			alert("Failed to upload image");
		} finally {
			setUploadingVariantValue(null);
		}
	};

	const addOptionValue = (index: number, value: string) => {
		const cleanedValue = value.trim();
		if (!cleanedValue) return;
		if (options[index].values.includes(cleanedValue)) return;
		const newValues = [...options[index].values, cleanedValue];
		updateOptionValues(index, newValues);
	};

	const removeOptionValue = (optionIdx: number, valueIdx: number) => {
		const newValues = options[optionIdx].values.filter((_, i) => i !== valueIdx);
		updateOptionValues(optionIdx, newValues);
	};

	const regenerateVariants = (
		currentOptions: Option[],
		currentVariants: Record<string, unknown>[] = variants,
	) => {
		if (currentOptions.length === 0) {
			const existingDefault = currentVariants.find((v) => v.isDefault);
			if (existingDefault) {
				setVariants([
					{
						...existingDefault,
						name: "Default Variant",
						combination: {},
						selected: false,
						manageInventory: existingDefault.manageInventory ?? false,
					},
				]);
			} else {
				setVariants([
					{
						id: undefined,
						name: "Default Variant",
						combination: {},
						price: String(product?.price || ""),
						stock: product?.stock || 0,
						sku: product?.sku || "",
						width: "",
						height: "",
						depth: "",
						weight: "",
						costPrice: product?.costPrice || "",
						compareAtPrice: "",
						barcode: product?.barcode || "",
						shippable: true,
						isEnabled: true,
						isDefault: true,
						selected: false,
						manageInventory: false,
					},
				]);
			}
			return;
		}

		const combos = generateCombinations(currentOptions);
		if (combos.length === 0) {
			setVariants([]);
			return;
		}
		const newVariants = combos.map((c) => {
			const name = formatVariantName(c);
			const exactMatch = currentVariants.find((v) => v.name === name);
			if (exactMatch)
				return {
					...exactMatch,
					combination: c,
					name,
					isDefault: false,
					selected: exactMatch.selected || false,
				};

			const smartMatch = currentVariants.find((v) => {
				if (v.isDefault) return true;
				if (!v.combination) return false;
				return Object.entries(v.combination).every(
					([key, val]) => (c as Record<string, unknown>)[key] === val,
				);
			});

			if (smartMatch) {
				const { id, isDefault, ...inheritedProps } = smartMatch;
				return {
					...inheritedProps,
					name,
					combination: c,
					isEnabled: true,
					isDefault: false,
					selected: false,
				};
			}

			return {
				id: undefined,
				name,
				combination: c,
				price: price,
				stock: stock === "" ? 0 : Number(stock),
				sku: "",
				width: "",
				height: "",
				depth: "",
				weight: "",
				costPrice: costPrice,
				compareAtPrice: "",
				barcode: "",
				shippable: true,
				isEnabled: true,
				isDefault: false,
				selected: false,
				manageInventory: false,
			};
		});
		setVariants(newVariants);
	};

	const updateVariantField = (index: number, field: string | Record<string, unknown>, value?: unknown) => {
		setVariants((prevVariants) => {
			const newVariants = [...prevVariants];
			if (typeof field === "string") {
				newVariants[index] = { ...newVariants[index], [field]: value };
			} else {
				newVariants[index] = { ...newVariants[index], ...field };
			}
			return newVariants;
		});
	};

	const getVariantVisuals = (variant: Record<string, unknown>) => {
		const visuals: { type: "color" | "image"; value: string; label: string }[] = [];
		if (variant.combination) {
			Object.entries(variant.combination).forEach(([label, value]) => {
				const option = options.find((opt) => opt.name === label);
				if (
					option &&
					(option.type === "color" || option.type === "image") &&
					option.visuals?.[value as string]
				) {
					visuals.push({
						type: option.type,
						value: option.visuals[value as string],
						label: `${label}: ${value}`,
					});
				}
			});
		}
		return visuals;
	};

	const bulkUpdateVariants = (field: string, value: unknown) => {
		const hasSelection = variants.some((v) => v.selected);
		const newVariants = variants.map((v) => {
			const shouldUpdate = !hasSelection || v.selected;
			if (!shouldUpdate) return v;
			if (field === "selected") return { ...v, [field]: value };
			const currentVal = v[field as keyof typeof v];
			const isDefined =
				field === "price"
					? currentVal !== "" && currentVal !== "0" && currentVal !== 0
					: field === "stock"
						? currentVal !== "" && currentVal !== 0 && currentVal !== undefined && v.manageInventory
						: false;
			if (field === "stock") return { ...v, [field]: value, manageInventory: true };
			if (isDefined && field !== "attributes") return v;
			return { ...v, [field]: value };
		});
		setVariants(newVariants);
	};

	const duplicateSelectedVariants = () => {
		const selectedVariants = variants.filter((v) => v.selected);
		if (selectedVariants.length === 0) return;

		const newVariants = selectedVariants.map((v) => ({
			...v,
			id: generateId(),
			name: `${v.name} (copie)`,
			selected: false,
		}));

		setVariants([...variants, ...newVariants]);
	};

	const generateSKUs = () => {
		if (!name) return;
		const selectedVariants = variants.some((v) => v.selected);
		const baseProductCode = name
			.toUpperCase()
			.replace(/[^A-Z0-9]/g, "")
			.slice(0, 10);
		const newVariants = variants.map((v) => {
			const shouldUpdate = !selectedVariants || v.selected;
			const isDefined = v.sku && v.sku !== "";
			if (!shouldUpdate || isDefined) return v;
			const comboValues = Object.values(v.combination)
				.map((val) =>
					String(val)
						.toUpperCase()
						.replace(/[^A-Z0-9]/g, ""),
				)
				.filter(Boolean);
			const skuParts = [baseProductCode, ...comboValues];
			return { ...v, sku: skuParts.join("-") };
		});
		setVariants(newVariants);
	};

	const handleSubmit = (formData: FormData) => {
		formData.append("collections", JSON.stringify(selectedCollections));
		formData.append("images", JSON.stringify(images));
		formData.append("options", JSON.stringify(options));
		formData.append("variants", JSON.stringify(variants));
		formData.append("tags", JSON.stringify(tags));
		if (variants.length > 0) {
			const mainVariant = variants[0];
			formData.append("price", String(mainVariant.price || 0));
			formData.append("costPrice", String(mainVariant.costPrice || 0));
			formData.append("stock", String(mainVariant.stock || 0));
			formData.append("sku", mainVariant.sku || "");
			formData.append("barcode", mainVariant.barcode || "");
			formData.append("width", String(mainVariant.width || ""));
			formData.append("height", String(mainVariant.height || ""));
			formData.append("depth", String(mainVariant.depth || ""));
			formData.append("weight", String(mainVariant.weight || ""));
		} else {
			formData.append("price", "0");
			formData.append("stock", "0");
		}
		formData.set("slug", slug);
		startTransition(async () => {
			if (product) {
				await updateProduct(product.id, formData);
			} else {
				await createProduct(formData);
			}
		});
	};

	const handlePreSubmitValidation = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.error("Le nom du produit est obligatoire.");
			return;
		}

		if (!selectedCategoryId) {
			toast.error("Veuillez sélectionner une catégorie.");
			return;
		}

		const invalidVariants = variants.filter((v) => !v.price || Number(v.price) <= 0);
		if (invalidVariants.length > 0) {
			if (invalidVariants.length === 1 && variants.length === 1) {
				toast.error("Le prix du produit doit être supérieur à 0.");
			} else {
				const names = invalidVariants.map((v) => `"${v.name}"`).join(", ");
				toast.error(`Prix manquant ou invalide pour : ${names}`);
			}
			return;
		}

		const formData = new FormData(e.currentTarget);
		handleSubmit(formData);
	};


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
		<form onSubmit={handlePreSubmitValidation} className="w-full max-w-full min-w-0 space-y-8 pb-24">
			<div className="flex flex-col gap-2">
				<h1 className="text-4xl font-black uppercase tracking-tighter">{title}</h1>
				<p className="font-mono text-sm font-bold uppercase text-neutral-500">
					{description || "Remplissez les informations ci-dessous"}
				</p>
			</div>

			<div className="w-full max-w-full border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
				<div className="flex border-b-4 border-black">
					<button
						type="button"
						onClick={() => setActiveTab("details")}
						className={cn(
							"flex-1 px-6 py-4 text-sm font-black uppercase tracking-widest border-r-2 border-black",
							activeTab === "details"
								? "bg-black text-white"
								: "bg-white text-black hover:bg-black hover:text-white",
						)}
					>
						1. DÉTAILS
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("seo")}
						className={cn(
							"flex-1 px-6 py-4 text-sm font-black uppercase tracking-widest",
							activeTab === "seo"
								? "bg-black text-white"
								: "bg-white text-black hover:bg-black hover:text-white",
						)}
					>
						2. SEO
					</button>
				</div>

				<div className="p-6 bg-white w-full">
					{activeTab === "details" ? (
						<div className="space-y-6 w-full">
							{/* Grid 3 colonnes: Col1 (4/9) = INFORMATIONS+MÉDIAS+VARIANTES, Col2 (2/9) = ORGANISATION */}
							<div className="grid grid-cols-3 gap-6 w-full">
								{/* Colonne 1: INFORMATIONS + MÉDIAS + VARIANTES (empilées) - span 2 */}
								<div className="col-span-2 flex flex-col gap-6 w-full">
									<section className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
										<div className="flex items-center gap-3 border-b-4 border-black pb-4 mb-6">
											<span className="w-8 h-8 bg-black text-white flex items-center justify-center font-black text-lg">
												ℹ
											</span>
											<h2 className="text-lg font-black uppercase tracking-tight">INFORMATIONS GÉNÉRALES</h2>
										</div>
										<div className="space-y-6">
											<div className="space-y-2">
												<label
													htmlFor="name"
													className="text-xs font-black uppercase tracking-widest text-neutral-500"
												>
													NOM DU PRODUIT *
												</label>
												<input
													id="name"
													name="name"
													value={name}
													placeholder="EX: T-SHIRT PREMIUM COTON"
													required
													className="w-full h-14 px-4 border-4 border-black bg-white focus:outline-none font-mono text-sm font-bold uppercase tracking-tight"
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

											<div className="space-y-2">
												<div className="flex items-center justify-between">
													<label className="text-xs font-black uppercase tracking-widest text-neutral-500">
														SLUG (URL)
													</label>
													<button
														type="button"
														className={cn(
															"px-3 py-1.5 border-2 border-black text-[10px] font-black uppercase tracking-widest",
															isAutoSlug ? "bg-black text-white" : "bg-white",
														)}
														onClick={() => setIsAutoSlug(!isAutoSlug)}
													>
														{isAutoSlug ? "AUTO" : "MANUEL"}
													</button>
												</div>
												<div className="flex items-center gap-2">
													<span className="text-sm font-black text-neutral-400">/products/</span>
													<input
														id="slug"
														name="slug"
														value={slug}
														onChange={(e) => {
															setSlug(e.target.value);
															setIsAutoSlug(false);
														}}
														className="flex-1 h-12 px-4 border-2 border-black bg-white focus:outline-none font-mono text-sm font-bold"
														placeholder="mon-produit"
													/>
												</div>
											</div>

											<div className="space-y-2">
												<label
													htmlFor="description"
													className="text-xs font-black uppercase tracking-widest text-neutral-500"
												>
													DESCRIPTION
												</label>
												<textarea
													id="description"
													name="description"
													defaultValue={product?.description || ""}
													placeholder="DÉCRIVEZ CE PRODUIT EN DÉTAIL..."
													rows={6}
													className="w-full p-4 border-4 border-black bg-white focus:outline-none font-mono text-sm resize-none"
												/>
											</div>
										</div>
									</section>

									<section className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
										<div className="flex items-center gap-3 border-b-4 border-black pb-4 mb-6">
											<span className="w-8 h-8 bg-black text-white flex items-center justify-center font-black text-lg">
												📷
											</span>
											<h2 className="text-lg font-black uppercase tracking-tight">MÉDIAS & VISUELS</h2>
										</div>
										<MediaSection images={images} setImages={setImages} />
									</section>

									{/* VARIANTES & OPTIONS - dans la colonne de gauche */}
									<section className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
										<div className="flex items-center gap-3 border-b-4 border-black pb-4 mb-6">
											<span className="w-8 h-8 bg-black text-white flex items-center justify-center font-black text-lg">
												⊞
											</span>
											<h2 className="text-lg font-black uppercase tracking-tight">VARIANTES & OPTIONS</h2>
										</div>
										<VariantsSection
											options={options}
											variants={variants}
											regenerateVariants={regenerateVariants}
											updateOptionName={updateOptionName}
											updateOptionVisual={updateOptionVisual}
											handleVariantImageUpload={handleVariantImageUpload}
											uploadingVariantValue={uploadingVariantValue}
											updateOptionType={updateOptionType}
											removeOption={removeOption}
											moveOption={moveOption}
											duplicateOption={duplicateOption}
											addOption={addOption}
											addOptionValue={addOptionValue}
											removeOptionValue={removeOptionValue}
											bulkUpdateVariants={bulkUpdateVariants}
											duplicateSelectedVariants={duplicateSelectedVariants}
											updateVariantField={updateVariantField}
											setEditingVariantIdx={setEditingVariantIdx}
										/>
									</section>
								</div>

								{/* Colonne 2: ORGANISATION */}
								<div className="col-span-1 flex flex-col gap-6 w-full">
									<section className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
										<div className="flex items-center gap-3 border-b-4 border-black pb-4 mb-6">
											<span className="w-8 h-8 bg-black text-white flex items-center justify-center font-black text-lg">
												⊞
											</span>
											<h2 className="text-lg font-black uppercase tracking-tight">ORGANISATION</h2>
										</div>
										<div className="space-y-6">
											<div className="space-y-2">
												<label className="text-xs font-black uppercase tracking-widest text-neutral-500">
													CATÉGORIE <span className="text-red-600">*</span>
												</label>
												<select
													name="categoryId"
													value={selectedCategoryId}
													onChange={(e) => setSelectedCategoryId(e.target.value)}
													className="w-full h-14 px-4 border-4 border-black bg-white focus:outline-none font-mono text-xs font-black uppercase"
												>
													<option value="">SÉLECTIONNER...</option>
													{categories?.map((c) => (
														<option key={c.id} value={c.id}>
															{c.name.toUpperCase()}
														</option>
													))}
												</select>
											</div>

											<div className="space-y-2">
												<label className="text-xs font-black uppercase tracking-widest text-neutral-500">
													COLLECTIONS
												</label>
												<select
													onChange={(e) => toggleCollection(e.target.value)}
													className="w-full h-14 px-4 border-4 border-black bg-white focus:outline-none font-mono text-xs font-black uppercase"
												>
													<option value="">AJOUTER...</option>
													{collections?.map((c) => (
														<option key={c.id} value={c.slug} disabled={selectedCollections.includes(c.slug)}>
															{c.name.toUpperCase()}
														</option>
													))}
												</select>
												{selectedCollections.length > 0 && (
													<div className="flex flex-wrap gap-2 pt-2">
														{selectedCollections.map((s) => (
															<span
																key={s}
																className="inline-flex items-center gap-2 px-3 py-2 bg-black text-white text-xs font-black uppercase"
															>
																{collections?.find((c) => c.slug === s)?.name.toUpperCase()}
																<button
																	type="button"
																	onClick={() => toggleCollection(s)}
																	className="hover:text-white"
																>
																	✕
																</button>
															</span>
														))}
													</div>
												)}
											</div>

											<div className="space-y-2">
												<label className="text-xs font-black uppercase tracking-widest text-neutral-500">
													TAGS
												</label>
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
																<button
																	type="button"
																	onClick={() => removeTag(t)}
																	className="hover:text-white"
																>
																	✕
																</button>
															</span>
														))}
													</div>
												)}
											</div>

											<div className="space-y-2">
												<label className="text-xs font-black uppercase tracking-widest text-neutral-500">
													BADGE PRODUIT
												</label>
												<div className="space-y-3">
													<input
														name="badgeText"
														placeholder="EX: NOUVEAU"
														defaultValue={product?.badgeText || ""}
														className="w-full h-12 px-4 border-2 border-black bg-white focus:outline-none font-mono text-xs font-black uppercase"
													/>
													<div className="flex gap-2">
														<input
															type="color"
															name="badgeColorPicker"
															defaultValue={product?.badgeColor || "#000000"}
															className="w-14 h-12 border-2 border-black bg-white cursor-pointer"
														/>
														<input
															name="badgeColor"
															placeholder="#000000"
															defaultValue={product?.badgeColor || "#000000"}
															className="flex-1 h-12 px-4 border-2 border-black bg-white focus:outline-none font-mono text-xs font-bold"
														/>
													</div>
												</div>
											</div>
										</div>
									</section>
								</div>
							</div>
						</div>
					) : (
						<div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
							<SEOSection product={product} name={name} slug={slug} />
						</div>
					)}
				</div>
			</div>

			<div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
				<button
					type="button"
					onClick={() => router.back()}
					className="h-12 px-6 border-4 border-black bg-white text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white"
				>
					ANNULER
				</button>
				<button
					type="submit"
					disabled={isPending}
					className="h-12 px-8 border-4 border-black bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black flex items-center gap-3 disabled:opacity-50"
				>
					{isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" strokeWidth={3} />
					) : (
						<span className="text-lg">+</span>
					)}
					{product ? "METTRE À JOUR" : "CRÉER LE PRODUIT"}
				</button>
			</div>

			<VariantDetailsSheet
				variant={editingVariantIdx !== null ? variants[editingVariantIdx] : null}
				isOpen={editingVariantIdx !== null}
				onClose={() => setEditingVariantIdx(null)}
				onUpdate={(updatedVariant: unknown) => {
					if (editingVariantIdx !== null) {
						const newVariants = [...variants];
						newVariants[editingVariantIdx] = updatedVariant;
						setVariants(newVariants);
					}
				}}
				hasPrev={editingVariantIdx !== null && editingVariantIdx > 0}
				hasNext={editingVariantIdx !== null && editingVariantIdx < variants.length - 1}
				onPrev={(updatedVariant: unknown) => {
					if (editingVariantIdx !== null && editingVariantIdx > 0) {
						const newVariants = [...variants];
						newVariants[editingVariantIdx] = updatedVariant;
						setVariants(newVariants);
						setEditingVariantIdx(editingVariantIdx - 1);
					}
				}}
				onNext={(updatedVariant: unknown) => {
					if (editingVariantIdx !== null && editingVariantIdx < variants.length - 1) {
						const newVariants = [...variants];
						newVariants[editingVariantIdx] = updatedVariant;
						setVariants(newVariants);
						setEditingVariantIdx(editingVariantIdx + 1);
					}
				}}
				onSyncToAll={(attributes: unknown) => {
					setVariants((prev) => prev.map((v) => ({ ...v, attributes })));
				}}
			/>
		</form>
	);
}
