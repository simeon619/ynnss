"use client";

import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	Clock,
	Globe,
	GripVertical,
	Info,
	LayoutGrid,
	Loader2,
	Package,
	Plus,
	Search,
	Settings2,
	Trash2,
} from "lucide-react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { useEffect, useRef, useState, useTransition } from "react";
import { SingleImageUpload } from "@/components/single-image-upload";
import type { CollectionRule, CollectionRules } from "@/lib/db/schema_tenant";
import { cn } from "@/lib/utils";
import { createCollection, getCategories, getVendors, searchProducts, updateCollection } from "../actions";

interface CollectionFormProps {
	collection?: {
		id: string;
		name: string;
		description: string | null;
		slug: string;
		seoTitle: string | null;
		seoDescription: string | null;
		type: string | null;
		rules: CollectionRules | { minPrice?: number; maxPrice?: number } | null;
		image: string | null;
		bannerImage: string | null;
		descriptionBottom: string | null;
		badgeText: string | null;
		badgeColor: string | null;
		defaultSort?: string | null;
		manualOrder?: string[] | null;
		activeFrom?: string | null;
		activeTo?: string | null;
	};
	initialProducts?: { id: string; title: string; image: string | null; price: number }[];
}

function SortableItem({
	id,
	product,
	onRemove,
}: {
	id: string;
	product: { id: string; title: string; image: string | null; price: number };
	onRemove: () => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 20 : "auto",
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"flex items-center justify-between p-3 bg-white border-2 border-black mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
				isDragging && "shadow-none translate-x-0.5 translate-y-0.5 z-50",
			)}
		>
			<div className="flex items-center gap-3 flex-1">
				<div
					{...attributes}
					{...listeners}
					className="cursor-grab hover:text-black p-1 border-r-2 border-black -ml-3 mr-2 bg-white px-2"
				>
					<GripVertical className="h-4 w-4 text-black" />
				</div>
				<div className="relative h-10 w-10 border-2 border-black bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					{product.images?.[0] ? (
						<Image src={product.images[0]} alt="" fill className="object-cover" />
					) : (
						<Package className="h-5 w-5 text-black" />
					)}
				</div>
				<div className="min-w-0">
					<p className="text-xs font-black uppercase tracking-tight truncate">{product.name}</p>
					<p className="text-[10px] font-mono font-bold text-black">{product.price} XOF</p>
				</div>
			</div>
			<button
				type="button"
				onClick={onRemove}
				className="h-8 w-8 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
			>
				<Trash2 className="h-4 w-4" strokeWidth={3} />
			</button>
		</div>
	);
}

export function CollectionForm({ collection, initialProducts = [] }: CollectionFormProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [type, setType] = useState(collection?.type || "manual");
	const [activeTab, setActiveTab] = useState("details");

	const [rules, setRules] = useState<CollectionRules>(() => {
		if (collection?.rules && "logicalOperator" in collection.rules) {
			return collection.rules;
		}
		if (collection?.rules && ("minPrice" in collection.rules || "maxPrice" in collection.rules)) {
			const oldRules = collection.rules as { minPrice?: number; maxPrice?: number };
			const newRules: CollectionRule[] = [];
			if (oldRules.minPrice) {
				newRules.push({ id: "r1", field: "price", operator: "gt", value: oldRules.minPrice });
			}
			if (oldRules.maxPrice) {
				newRules.push({ id: "r2", field: "price", operator: "lt", value: oldRules.maxPrice });
			}
			return { logicalOperator: "AND", rules: newRules };
		}
		return { logicalOperator: "AND", rules: [] };
	});

	const [categoriesList, setCategoriesList] = useState<{ id: string; name: string }[]>([]);
	const [vendorsList, setVendorsList] = useState<string[]>([]);

	useEffect(() => {
		getCategories().then(setCategoriesList);
		getVendors().then(setVendorsList);
	}, []);

	const [selectedProducts, setSelectedProducts] =
		useState<{ id: string; title: string; image: string | null; price: number }[]>(initialProducts);
	const [searchResults, setSearchResults] = useState<
		{ id: string; title: string; image: string | null; price: number }[]
	>([]);
	const [showSearchResults, setShowSearchResults] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [productSearch, setProductSearch] = useState("");
	const [image, setImage] = useState(collection?.image || "");
	const [bannerImage, setBannerImage] = useState(collection?.bannerImage || "");
	const [defaultSort, setDefaultSort] = useState(collection?.defaultSort || "newest");
	const [activeFrom, setActiveFrom] = useState(
		collection?.activeFrom ? new Date(collection.activeFrom).toISOString().slice(0, 16) : "",
	);
	const [activeTo, setActiveTo] = useState(
		collection?.activeTo ? new Date(collection.activeTo).toISOString().slice(0, 16) : "",
	);

	const searchContainerRef = useRef<HTMLDivElement>(null);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = (event: { active: { id: string }; over: { id: string } | null }) => {
		const { active, over } = event;

		if (active.id !== over.id) {
			setSelectedProducts((items) => {
				const oldIndex = items.findIndex((i) => i.id === active.id);
				const newIndex = items.findIndex((i) => i.id === over.id);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
				setShowSearchResults(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	useEffect(() => {
		const timer = setTimeout(async () => {
			if (productSearch.trim().length >= 2) {
				setIsSearching(true);
				setShowSearchResults(true);
				try {
					const results = await searchProducts(productSearch);
					setSearchResults(results);
				} catch (error) {
					console.error("Search failed", error);
				} finally {
					setIsSearching(false);
				}
			} else {
				setSearchResults([]);
				setShowSearchResults(false);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [productSearch]);

	const toggleProduct = (product: { id: string; name: string; price: string | null }) => {
		setSelectedProducts((prev) =>
			prev.find((p) => p.id === product.id) ? prev.filter((p) => p.id !== product.id) : [...prev, product],
		);
	};

	const addRule = () => {
		setRules((prev) => ({
			...prev,
			rules: [
				...prev.rules,
				{
					id: Math.random().toString(36).substring(7),
					field: "price",
					operator: "gt",
					value: 0,
				},
			],
		}));
	};

	const removeRule = (id: string) => {
		setRules((prev) => ({
			...prev,
			rules: prev.rules.filter((r) => r.id !== id),
		}));
	};

	const updateRule = (id: string, updates: Partial<CollectionRule>) => {
		setRules((prev) => ({
			...prev,
			rules: prev.rules.map((r) => (r.id === id ? ({ ...r, ...updates } as CollectionRule) : r)),
		}));
	};

	const handleSubmit = (formData: FormData) => {
		startTransition(async () => {
			const finalFormData = new FormData();
			formData.forEach((value, key) => {
				finalFormData.append(key, value);
			});

			finalFormData.set("type", type);
			finalFormData.set("image", image);
			finalFormData.set("bannerImage", bannerImage);
			finalFormData.set("defaultSort", defaultSort);
			const rawFrom = (formData.get("activeFrom") as string) || activeFrom;
			const rawTo = (formData.get("activeTo") as string) || activeTo;

			finalFormData.set("activeFrom", rawFrom ? new Date(rawFrom).toISOString() : "");
			finalFormData.set("activeTo", rawTo ? new Date(rawTo).toISOString() : "");

			if (type === "automated") {
				finalFormData.set("rules", JSON.stringify(rules));
				finalFormData.set("productIds", JSON.stringify([]));
				finalFormData.set("manualOrder", JSON.stringify([]));
			} else {
				const productIds = selectedProducts.map((p) => p.id);
				finalFormData.set("productIds", JSON.stringify(productIds));
				finalFormData.set("manualOrder", JSON.stringify(productIds));
				finalFormData.set("rules", "null");
			}

			if (collection?.id) {
				await updateCollection(collection.id, finalFormData);
			} else {
				await createCollection(finalFormData);
			}
			router.refresh();
			router.push("/manage/collections");
		});
	};

	return (
		<form action={handleSubmit} className="pb-32 space-y-12">
			<input type="hidden" name="type" value={type} />
			<input type="hidden" name="image" value={image} />
			<input type="hidden" name="bannerImage" value={bannerImage} />

			{/* Custom Brutalist Tabs */}
			<div className="border-b-4 border-black flex gap-1 -mb-6 relative z-10">
				<button
					type="button"
					onClick={() => setActiveTab("details")}
					className={cn(
						"px-6 py-3 text-xs font-black uppercase tracking-widest border-2 border-b-0 border-black",
						activeTab === "details"
							? "bg-black text-white shadow-none"
							: "bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
					)}
				>
					DÉTAILS
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("seo")}
					className={cn(
						"px-6 py-3 text-xs font-black uppercase tracking-widest border-2 border-b-0 border-black",
						activeTab === "seo"
							? "bg-black text-white shadow-none"
							: "bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
					)}
				>
					SEO
				</button>
			</div>

			<div className="space-y-12 bg-white p-8 pt-12 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
				{activeTab === "details" ? (
					<div className="space-y-12">
						{/* Basic Info Section */}
						<section className="space-y-6">
							<div className="flex items-center gap-2 border-b-2 border-black pb-2">
								<Info size={18} strokeWidth={3} />
								<h2 className="text-xl font-black uppercase tracking-tighter">INFORMATIONS GÉNÉRALES</h2>
							</div>

							<div className="grid gap-6">
								<div className="space-y-2">
									<label
										htmlFor="name"
										className="text-[10px] font-black uppercase tracking-widest text-black"
									>
										Nom de la collection
									</label>
									<input
										id="name"
										name="name"
										placeholder="EX: VENTES D'ÉTÉ"
										defaultValue={collection?.name}
										required
										className="w-full h-12 px-4 border-2 border-black bg-white focus:outline-none font-mono text-sm font-bold uppercase tracking-tight shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
									/>
								</div>

								<div className="space-y-2">
									<label
										htmlFor="slug"
										className="text-[10px] font-black uppercase tracking-widest text-black"
									>
										Slug (URL)
									</label>
									<input
										id="slug"
										name="slug"
										placeholder="EX: ventes-ete"
										defaultValue={collection?.slug}
										className="w-full h-12 px-4 border-2 border-black bg-white focus:outline-none font-mono text-sm font-bold tracking-tight shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
									/>
									<p className="text-[9px] font-mono font-bold text-black uppercase tracking-widest leading-none">
										Auto-généré si laissé vide.
									</p>
								</div>

								<div className="grid sm:grid-cols-2 gap-6">
									<div className="space-y-2">
										<label
											htmlFor="description"
											className="text-[10px] font-black uppercase tracking-widest text-black"
										>
											Description Haute
										</label>
										<textarea
											id="description"
											name="description"
											placeholder="DÉCRIVEZ CETTE COLLECTION..."
											defaultValue={collection?.description || ""}
											rows={4}
											className="w-full p-4 border-2 border-black bg-white focus:outline-none font-mono text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] resize-none"
										/>
									</div>
									<div className="space-y-2">
										<label
											htmlFor="descriptionBottom"
											className="text-[10px] font-black uppercase tracking-widest text-black"
										>
											Description Basse
										</label>
										<textarea
											id="descriptionBottom"
											name="descriptionBottom"
											defaultValue={collection?.descriptionBottom || ""}
											placeholder="TEXTE ADDITIONNEL EN BAS DE PAGE..."
											rows={4}
											className="w-full p-4 border-2 border-black bg-white focus:outline-none font-mono text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] resize-none"
										/>
									</div>
								</div>
							</div>
						</section>

						{/* Display & Sorting Section */}
						<section className="space-y-6">
							<div className="flex items-center gap-2 border-b-2 border-black pb-2">
								<LayoutGrid size={18} strokeWidth={3} />
								<h2 className="text-xl font-black uppercase tracking-tighter">TRI & AFFICHAGE</h2>
							</div>

							<div className="grid sm:grid-cols-2 gap-6">
								<div className="space-y-2">
									<label
										htmlFor="defaultSort"
										className="text-[10px] font-black uppercase tracking-widest text-black"
									>
										Ordre de tri par défaut
									</label>
									<select
										id="defaultSort"
										name="defaultSort"
										value={defaultSort}
										onChange={(e) => setDefaultSort(e.target.value)}
										className="w-full h-12 px-4 border-2 border-black bg-white focus:outline-none appearance-none font-mono text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
									>
										<option value="newest">Plus récent</option>
										<option value="oldest">Plus ancien</option>
										<option value="price-asc">Prix Croissant</option>
										<option value="price-desc">Prix Décroissant</option>
										<option value="alphabetical">A-Z</option>
										<option value="manual">Manuel (Drag & Drop)</option>
									</select>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<label
											htmlFor="badgeText"
											className="text-[10px] font-black uppercase tracking-widest text-black"
										>
											Texte Badge
										</label>
										<input
											id="badgeText"
											name="badgeText"
											placeholder="EX: PROMO"
											defaultValue={collection?.badgeText || ""}
											className="w-full h-12 px-4 border-2 border-black bg-white focus:outline-none font-mono text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
										/>
									</div>
									<div className="space-y-2">
										<label
											htmlFor="badgeColor"
											className="text-[10px] font-black uppercase tracking-widest text-black"
										>
											Couleur Badge
										</label>
										<div className="flex gap-2 h-12">
											<input
												id="badgeColor"
												name="badgeColor"
												type="color"
												className="w-12 h-full border-2 border-black bg-white p-1 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
												defaultValue={collection?.badgeColor || "#000000"}
											/>
											<div className="flex-1 flex items-center px-4 border-2 border-black bg-white font-mono text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
												{collection?.badgeColor || "#000000"}
											</div>
										</div>
									</div>
								</div>
							</div>
						</section>

						{/* Media Section */}
						<section className="space-y-6">
							<div className="flex items-center gap-2 border-b-2 border-black pb-2">
								<Plus size={18} strokeWidth={3} />
								<h2 className="text-xl font-black uppercase tracking-tighter">MÉDIAS & VISUELS</h2>
							</div>

							<div className="grid sm:grid-cols-2 gap-12">
								<div className="space-y-4">
									<label className="text-[10px] font-black uppercase tracking-widest text-black">
										Image de couverture (Carrée)
									</label>
									<div className="border-4 border-dashed border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
										<SingleImageUpload
											value={image}
											onChange={setImage}
											aspectRatio="square"
											className="w-full aspect-square"
										/>
									</div>
								</div>
								<div className="space-y-4">
									<label className="text-[10px] font-black uppercase tracking-widest text-black">
										Bannière Hero (Paysage)
									</label>
									<div className="border-4 border-dashed border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
										<SingleImageUpload
											value={bannerImage}
											onChange={setBannerImage}
											aspectRatio="banner"
											className="h-full w-full"
										/>
									</div>
								</div>
							</div>
						</section>

						{/* Scheduling Section */}
						<section className="space-y-6">
							<div className="flex items-center gap-2 border-b-2 border-black pb-2">
								<Clock className="h-4 w-4" strokeWidth={3} />
								<h2 className="text-xl font-black uppercase tracking-tighter">PLANIFICATION</h2>
							</div>

							<div className="grid sm:grid-cols-2 gap-6">
								<div className="space-y-2">
									<label
										htmlFor="activeFrom"
										className="text-[10px] font-black uppercase tracking-widest text-black"
									>
										Active à partir de
									</label>
									<div className="flex gap-2">
										<input
											id="activeFrom"
											name="activeFrom"
											type="datetime-local"
											value={activeFrom}
											onChange={(e) => setActiveFrom(e.target.value)}
											className="flex-1 h-12 px-4 border-2 border-black bg-white font-mono text-[10px] font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
										/>
										{activeFrom && (
											<button
												type="button"
												onClick={() => setActiveFrom("")}
												className="w-12 h-12 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white"
											>
												<Trash2 size={16} strokeWidth={3} />
											</button>
										)}
									</div>
								</div>
								<div className="space-y-2">
									<label
										htmlFor="activeTo"
										className="text-[10px] font-black uppercase tracking-widest text-black"
									>
										Expire le
									</label>
									<div className="flex gap-2">
										<input
											id="activeTo"
											name="activeTo"
											type="datetime-local"
											value={activeTo}
											onChange={(e) => setActiveTo(e.target.value)}
											className="flex-1 h-12 px-4 border-2 border-black bg-white font-mono text-[10px] font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
										/>
										{activeTo && (
											<button
												type="button"
												onClick={() => setActiveTo("")}
												className="w-12 h-12 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white"
											>
												<Trash2 size={16} strokeWidth={3} />
											</button>
										)}
									</div>
								</div>
							</div>
						</section>

						{/* Products Selection Section */}
						<section className="space-y-8 pt-6 border-t-4 border-black">
							<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
								<div className="space-y-1">
									<h2 className="text-2xl font-black uppercase tracking-tighter">SÉLECTION DE PRODUITS</h2>
									<p className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
										Choisissez comment remplir cette collection.
									</p>
								</div>

								{/* Brutalist Radio Group */}
								<div className="flex border-2 border-black p-1 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
									<button
										type="button"
										onClick={() => setType("manual")}
										className={cn(
											"px-4 py-2 text-[10px] font-black uppercase tracking-widest",
											type === "manual"
												? "bg-black text-white"
												: "bg-white text-black hover:bg-black hover:text-white",
										)}
									>
										Manuel
									</button>
									<button
										type="button"
										onClick={() => setType("automated")}
										className={cn(
											"px-4 py-2 text-[10px] font-black uppercase tracking-widest",
											type === "automated"
												? "bg-black text-white"
												: "bg-white text-black hover:bg-black hover:text-white",
										)}
									>
										Automatique
									</button>
								</div>
							</div>

							<div className="bg-white border-4 border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
								{type === "automated" ? (
									<div className="space-y-6">
										<div className="flex items-center justify-between border-b-2 border-black pb-4">
											<div className="space-y-1">
												<h4 className="text-sm font-black uppercase tracking-tight">Règles Intelligentes</h4>
												<p className="text-[10px] font-mono text-black font-bold uppercase tracking-widest">
													Match automatique selon les conditions.
												</p>
											</div>
											<div className="flex items-center gap-3 border-2 border-black p-2 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
												<span className="text-[9px] font-black uppercase tracking-widest px-2">
													Doit matcher :
												</span>
												<select
													value={rules.logicalOperator}
													onChange={(e) =>
														setRules((prev) => ({ ...prev, logicalOperator: e.target.value as "AND" | "OR" }))
													}
													className="bg-transparent font-mono text-[9px] font-black uppercase tracking-widest focus:outline-none"
												>
													<option value="AND">Toutes les règles</option>
													<option value="OR">Une des règles</option>
												</select>
											</div>
										</div>

										<div className="space-y-4">
											{rules.rules.map((rule) => (
												<div
													key={rule.id}
													className="flex flex-col sm:flex-row items-stretch gap-4 p-4 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group"
												>
													<div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
														<select
															value={rule.field}
															onChange={(e) =>
																updateRule(rule.id, {
																	field: e.target.value as CollectionRule["field"],
																	value:
																		e.target.value === "stock" ||
																		e.target.value === "price" ||
																		e.target.value === "createdAt"
																			? 0
																			: "",
																})
															}
															className="h-10 px-3 border-2 border-black bg-white font-mono text-[10px] font-black uppercase tracking-widest focus:outline-none"
														>
															<option value="price">Prix</option>
															<option value="category">Catégorie</option>
															<option value="tag">Tag</option>
															<option value="vendor">Vendeur</option>
															<option value="stock">Stock</option>
															<option value="createdAt">Date Créé</option>
														</select>

														<select
															value={rule.operator}
															onChange={(e) =>
																updateRule(rule.id, {
																	operator: e.target.value as CollectionRule["operator"],
																})
															}
															className="h-10 px-3 border-2 border-black bg-white font-mono text-[10px] font-black uppercase tracking-widest focus:outline-none"
														>
															{rule.field === "price" || rule.field === "stock" ? (
																<>
																	<option value="gt">supérieur à</option>
																	<option value="lt">inférieur à</option>
																	<option value="eq">égal à</option>
																</>
															) : rule.field === "createdAt" ? (
																<>
																	<option value="after">après (X jours)</option>
																	<option value="before">avant</option>
																</>
															) : (
																<>
																	<option value="eq">égal à</option>
																	<option value="neq">différent de</option>
																	<option value="contains">contient</option>
																</>
															)}
														</select>

														<div className="flex-1">
															{rule.field === "category" ? (
																<select
																	value={String(rule.value)}
																	onChange={(e) => updateRule(rule.id, { value: e.target.value })}
																	className="w-full h-10 px-3 border-2 border-black bg-white font-mono text-[10px] font-black uppercase tracking-widest focus:outline-none"
																>
																	<option value="">Sélectionner...</option>
																	{categoriesList.map((cat) => (
																		<option key={cat.id} value={cat.id}>
																			{cat.name}
																		</option>
																	))}
																</select>
															) : rule.field === "vendor" ? (
																<input
																	value={String(rule.value)}
																	onChange={(e) => updateRule(rule.id, { value: e.target.value })}
																	placeholder="Vendeur..."
																	className="w-full h-10 px-3 border-2 border-black bg-white font-mono text-[10px] font-black uppercase tracking-widest focus:outline-none"
																/>
															) : (
																<input
																	type={
																		rule.field === "price" ||
																		rule.field === "stock" ||
																		rule.field === "createdAt"
																			? "number"
																			: "text"
																	}
																	value={String(rule.value)}
																	onChange={(e) =>
																		updateRule(rule.id, {
																			value:
																				rule.field === "price" ||
																				rule.field === "stock" ||
																				rule.field === "createdAt"
																					? Number(e.target.value)
																					: e.target.value,
																		})
																	}
																	className="w-full h-10 px-3 border-2 border-black bg-white font-mono text-[10px] font-black uppercase tracking-widest focus:outline-none"
																	placeholder="Valeur..."
																/>
															)}
														</div>
													</div>
													<button
														type="button"
														onClick={() => removeRule(rule.id)}
														className="w-10 h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
													>
														<Trash2 size={16} strokeWidth={3} />
													</button>
												</div>
											))}
										</div>

										<button
											type="button"
											onClick={addRule}
											className="w-full h-12 flex items-center justify-center gap-2 border-2 border-dashed border-black hover:bg-black hover:text-white text-[10px] font-black uppercase tracking-[0.2em]"
										>
											<Plus size={16} strokeWidth={3} />
											Ajouter une condition
										</button>
									</div>
								) : (
									<div className="space-y-8">
										{/* Search Bar */}
										<div className="relative" ref={searchContainerRef}>
											<Search
												className="absolute left-4 top-1/2 -translate-y-1/2 text-black"
												size={18}
												strokeWidth={3}
											/>
											<input
												placeholder="RECHERCHER DES PRODUITS À AJOUTER..."
												value={productSearch}
												onChange={(e) => setProductSearch(e.target.value)}
												onFocus={() => {
													if (searchResults.length > 0) setShowSearchResults(true);
												}}
												className="w-full h-14 pl-12 pr-4 border-4 border-black bg-white focus:outline-none font-mono text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
											/>
											{isSearching && (
												<div className="absolute right-4 top-1/2 -translate-y-1/2">
													<Loader2 className="h-5 w-5 animate-spin text-black" strokeWidth={3} />
												</div>
											)}

											{/* Search Results Dropdown */}
											{searchResults.length > 0 && showSearchResults && (
												<div className="absolute z-50 w-full mt-2 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[400px] overflow-auto">
													{searchResults.map((p) => (
														<div
															key={p.id}
															role="button"
															tabIndex={0}
															onKeyDown={(e) => e.key === "Enter" && toggleProduct(p)}
															className="flex items-center gap-4 p-4 hover:bg-black hover:text-white cursor-pointer border-b-2 border-black last:border-none group"
															onClick={() => toggleProduct(p)}
														>
															<div
																className={cn(
																	"w-6 h-6 border-2 border-black flex items-center justify-center",
																	selectedProducts.some((sp) => sp.id === p.id)
																		? "bg-black text-white"
																		: "bg-white group-hover:bg-black",
																)}
															>
																{selectedProducts.some((sp) => sp.id === p.id) && (
																	<Plus size={14} strokeWidth={4} />
																)}
															</div>
															<div className="flex-1 flex items-center gap-4">
																<div className="relative w-10 h-10 border-2 border-black bg-white overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
																	{p.images?.[0] ? (
																		<Image src={p.images[0]} alt="" fill className="object-cover" />
																	) : (
																		<Package size={20} className="w-full h-full p-2 text-black" />
																	)}
																</div>
																<div className="flex flex-col">
																	<span className="text-xs font-black uppercase tracking-tight">
																		{p.name}
																	</span>
																	<span className="text-[10px] font-mono font-bold text-black">
																		{p.price} XOF
																	</span>
																</div>
															</div>
														</div>
													))}
												</div>
											)}
										</div>

										{/* Selected Products List */}
										<div className="space-y-4">
											<div className="flex items-center justify-between border-b-2 border-black pb-2">
												<h4 className="text-sm font-black uppercase tracking-widest">
													Produits sélectionnés ({selectedProducts.length})
												</h4>
												{selectedProducts.length > 0 && (
													<span className="text-[9px] font-mono font-bold text-black uppercase tracking-widest italic">
														Glissez pour réorganiser
													</span>
												)}
											</div>

											{selectedProducts.length > 0 ? (
												<div className="grid gap-3 max-h-[600px] overflow-auto pr-2">
													<DndContext
														sensors={sensors}
														collisionDetection={closestCenter}
														onDragEnd={handleDragEnd}
													>
														<SortableContext
															items={selectedProducts.map((p) => p.id)}
															strategy={verticalListSortingStrategy}
														>
															{selectedProducts.map((p) => (
																<SortableItem
																	key={p.id}
																	id={p.id}
																	product={p}
																	onRemove={() => toggleProduct(p)}
																/>
															))}
														</SortableContext>
													</DndContext>
												</div>
											) : (
												<div className="py-20 flex flex-col items-center justify-center text-center bg-white border-2 border-dashed border-black">
													<div className="w-16 h-16 border-2 border-black flex items-center justify-center mb-4 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
														<Package className="h-6 w-6 text-black" strokeWidth={3} />
													</div>
													<h3 className="text-sm font-black uppercase tracking-widest text-black mb-1">
														Aucun produit sélectionné
													</h3>
													<p className="text-xs text-black font-mono">
														Utilisez la barre de recherche ci-dessus pour ajouter des produits.
													</p>
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</section>
					</div>
				) : (
					/* SEO TAB */
					<div className="space-y-12">
						<section className="space-y-6">
							<div className="flex items-center gap-2 border-b-2 border-black pb-2">
								<Globe size={18} strokeWidth={3} />
								<h2 className="text-xl font-black uppercase tracking-tighter">OPTIMISATION SEO</h2>
							</div>

							<div className="grid gap-6">
								<div className="space-y-2">
									<label
										htmlFor="seoTitle"
										className="text-[10px] font-black uppercase tracking-widest text-black"
									>
										Titre SEO
									</label>
									<input
										id="seoTitle"
										name="seoTitle"
										defaultValue={collection?.seoTitle || ""}
										placeholder="EX: VENTES D'ÉTÉ | URBANFIT"
										className="w-full h-12 px-4 border-2 border-black bg-white focus:outline-none font-mono text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
									/>
								</div>
								<div className="space-y-2">
									<label
										htmlFor="seoDescription"
										className="text-[10px] font-black uppercase tracking-widest text-black"
									>
										Description SEO (Meta)
									</label>
									<textarea
										id="seoDescription"
										name="seoDescription"
										defaultValue={collection?.seoDescription || ""}
										placeholder="RÉSUMÉ POUR LES MOTEURS DE RECHERCHE..."
										rows={3}
										className="w-full p-4 border-2 border-black bg-white focus:outline-none font-mono text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] resize-none"
									/>
								</div>

								{/* Google Preview Brutalist */}
								<div className="mt-4 p-6 border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
									<div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest text-black">
										<Globe size={12} strokeWidth={3} />
										Aperçu Google Search
									</div>
									<div className="space-y-2">
										<p className="text-black font-black text-xl underline cursor-pointer uppercase tracking-tight">
											{collection?.seoTitle || collection?.name || "NOM DE LA COLLECTION"} | YNS
										</p>
										<p className="text-black font-mono text-xs font-bold lowercase tracking-tighter">
											https://votre-boutique.com/collections/{collection?.slug || "collection-slug"}
										</p>
										<p className="text-black font-mono text-xs font-medium leading-relaxed">
											{collection?.seoDescription ||
												collection?.description ||
												"La description de votre collection telle qu'elle apparaîtra dans les résultats de recherche..."}
										</p>
									</div>
								</div>
							</div>
						</section>
					</div>
				)}
			</div>

			{/* Brutalist Sticky Actions bar */}
			<div className="fixed bottom-0 left-0 lg:left-64 right-0 z-50 flex items-center justify-center pointer-events-none p-6 pb-8 bg-linear-to-t from-white via-white/80 to-transparent">
				<div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-6 p-4 pointer-events-auto">
					<button
						type="button"
						onClick={() => router.back()}
						className="h-12 px-6 border-2 border-black bg-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white"
					>
						ANNULER
					</button>

					<div className="w-1 h-8 bg-black/10" />

					<button
						type="submit"
						disabled={isPending}
						className="h-12 px-8 border-2 border-black bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-white hover:text-black flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" strokeWidth={3} />
						) : (
							<Settings2 className="h-4 w-4" strokeWidth={3} />
						)}
						{collection ? "METTRE À JOUR LA COLLECTION" : "CRÉER LA COLLECTION"}
					</button>
				</div>
			</div>
		</form>
	);
}
