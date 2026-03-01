"use client";

import { ArrowDown, ArrowLeft, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type CSSProperties, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
	ThemeBuilderData,
	ThemeColorKey,
	ThemeContentModel,
	ThemeSectionType,
	ThemeStyleTokens,
	ThemeTemplate,
	ThemeTemplateKey,
} from "@/lib/theme-types";
import { THEME_COLOR_VALUES, toStorefrontCssVariables } from "@/lib/theme-utils";
import {
	createDraftFromPublishedAction,
	publishThemeDraftAction,
	rollbackThemeAction,
	updateThemeDraftAction,
} from "./actions";

const THEME_COLOR_OPTIONS = [
	{ value: "black", label: "Noir" },
	{ value: "white", label: "Blanc" },
	{ value: "red", label: "Rouge" },
	{ value: "blue", label: "Bleu" },
	{ value: "neonGreen", label: "Vert Neon" },
] as const;

const TEMPLATE_OPTIONS: Array<{ key: ThemeTemplateKey; label: string }> = [
	{ key: "home", label: "Accueil" },
	{ key: "product", label: "Produit" },
	{ key: "collection", label: "Collection" },
	{ key: "category", label: "Catégorie" },
	{ key: "checkout", label: "Checkout" },
];

interface ThemeBuilderProps {
	initialData: ThemeBuilderData;
	collectionOptions: Array<{ id: string; name: string; slug: string }>;
}

export function ThemeBuilder({ initialData, collectionOptions }: ThemeBuilderProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [styleTokens, setStyleTokens] = useState<ThemeStyleTokens>(initialData.draft.styleTokens);
	const [contentModel, setContentModel] = useState<ThemeContentModel>(initialData.draft.contentModel);
	const [activeTemplate, setActiveTemplate] = useState<ThemeTemplateKey>("home");
	const [isAdvancedTemplates, setIsAdvancedTemplates] = useState(false);
	const [restoreVersionId, setRestoreVersionId] = useState(initialData.history[0]?.id || "");

	const previewCssVariables = useMemo(() => toStorefrontCssVariables(styleTokens), [styleTokens]);
	const template = contentModel.templates[activeTemplate];
	const visibleTemplateOptions = isAdvancedTemplates
		? TEMPLATE_OPTIONS
		: TEMPLATE_OPTIONS.filter((option) => option.key === "home");

	function updateStyleToken<Key extends keyof ThemeStyleTokens>(key: Key, value: ThemeStyleTokens[Key]) {
		setStyleTokens((previous) => ({
			...previous,
			[key]: value,
		}));
	}

	function updateContentModel(updater: (previous: ThemeContentModel) => ThemeContentModel) {
		setContentModel((previous) => updater(previous));
	}

	function updateTemplate(
		templateKey: ThemeTemplateKey,
		updater: (templateValue: ThemeTemplate) => ThemeTemplate,
	) {
		updateContentModel((previous) => ({
			...previous,
			templates: {
				...previous.templates,
				[templateKey]: updater(previous.templates[templateKey]),
			},
		}));
	}

	function addSection(type: ThemeSectionType) {
		const nextId = `${type}_${Date.now()}`;
		const nextSection =
			type === "hero"
				? {
						id: nextId,
						type: "hero" as const,
						settings: {
							title: "NOUVELLE COLLECTION",
							subtitle: "Découvrez nos nouveaux produits et exclusivités.",
							image: null,
							primaryCtaLabel: "Voir la collection",
							primaryCtaHref: "#products",
							secondaryCtaLabel: "Nouveautés",
							secondaryCtaHref: "/products",
						},
					}
				: {
						id: nextId,
						type: "productGrid" as const,
						settings: {
							title: "Produits en vedette",
							description: "Sélection des meilleurs produits de votre boutique",
							collectionId: null,
							limit: 6,
							showViewAll: true,
							viewAllHref: "/products",
						},
					};

		updateTemplate(activeTemplate, (current) => ({
			...current,
			order: [...current.order, nextId],
			sections: {
				...current.sections,
				[nextId]: nextSection,
			},
		}));
	}

	function removeSection(sectionId: string) {
		updateTemplate(activeTemplate, (current) => {
			const nextSections = { ...current.sections };
			delete nextSections[sectionId];
			return {
				...current,
				order: current.order.filter((id) => id !== sectionId),
				sections: nextSections,
			};
		});
	}

	function toggleSection(sectionId: string) {
		updateTemplate(activeTemplate, (current) => {
			const section = current.sections[sectionId];
			if (!section) return current;
			return {
				...current,
				sections: {
					...current.sections,
					[sectionId]: {
						...section,
						disabled: !section.disabled,
					},
				},
			};
		});
	}

	function moveSection(sectionId: string, direction: "up" | "down") {
		updateTemplate(activeTemplate, (current) => {
			const index = current.order.indexOf(sectionId);
			if (index === -1) return current;
			const targetIndex = direction === "up" ? index - 1 : index + 1;
			if (targetIndex < 0 || targetIndex >= current.order.length) return current;

			const nextOrder = [...current.order];
			const currentId = nextOrder[index];
			const targetId = nextOrder[targetIndex];
			if (!currentId || !targetId) return current;
			nextOrder[index] = targetId;
			nextOrder[targetIndex] = currentId;
			return { ...current, order: nextOrder };
		});
	}

	function updateSectionSettings(
		sectionId: string,
		updater: (current: ThemeTemplate["sections"][string]) => ThemeTemplate["sections"][string],
	) {
		updateTemplate(activeTemplate, (current) => {
			const section = current.sections[sectionId];
			if (!section) return current;
			return {
				...current,
				sections: {
					...current.sections,
					[sectionId]: updater(section),
				},
			};
		});
	}

	function handleSaveDraft() {
		startTransition(async () => {
			try {
				await updateThemeDraftAction({
					styleTokens,
					contentModel,
				});
				toast.success("Brouillon enregistre.");
				router.refresh();
			} catch (error) {
				toast.error(error instanceof Error ? error.message : "Echec de sauvegarde.");
			}
		});
	}

	function handlePublish() {
		startTransition(async () => {
			try {
				await updateThemeDraftAction({
					styleTokens,
					contentModel,
				});
				await publishThemeDraftAction();
				toast.success("Theme publie.");
				router.refresh();
			} catch (error) {
				toast.error(error instanceof Error ? error.message : "Publication impossible.");
			}
		});
	}

	function handleCancelChanges() {
		startTransition(async () => {
			try {
				await createDraftFromPublishedAction();
				toast.success("Le brouillon a ete restaure depuis la version publiee.");
				router.refresh();
			} catch (error) {
				toast.error(error instanceof Error ? error.message : "Impossible d'annuler les changements.");
			}
		});
	}

	function handleRestoreVersion() {
		if (!restoreVersionId) {
			toast.error("Selectionnez une version a restaurer.");
			return;
		}

		startTransition(async () => {
			try {
				await rollbackThemeAction(restoreVersionId);
				toast.success("Version restauree et republiee.");
				router.refresh();
			} catch (error) {
				toast.error(error instanceof Error ? error.message : "Rollback impossible.");
			}
		});
	}

	return (
		<div className="min-h-screen bg-neutral-100 text-black p-4 md:p-8 pb-32">
			<div className="max-w-7xl mx-auto space-y-8">
				<div className="flex flex-col lg:flex-row gap-6 lg:items-end lg:justify-between">
					<div>
						<Link
							href="/manage/themes"
							className="inline-flex items-center gap-1 border-2 border-black px-3 h-9 font-mono font-bold text-xs uppercase hover:bg-black hover:text-white transition-all mb-4"
						>
							<ArrowLeft size={14} />
							Retour
						</Link>
						<p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Theme Studio</p>
						<h1 className="text-4xl md:text-6xl font-black uppercase leading-none">Configurer mon thème</h1>
						<p className="mt-3 text-xs font-bold uppercase text-neutral-600">
							Flux simple: Identité → Sections → Enregistrer → Publier.
						</p>
					</div>
					<div className="border-4 border-black bg-white p-4 min-w-[240px]">
						<div className="flex items-center justify-between text-xs font-black uppercase">
							<span>Draft</span>
							<span className="font-mono">v{initialData.draft.versionNumber}</span>
						</div>
						<div className="flex items-center justify-between text-xs font-black uppercase mt-2">
							<span>En ligne</span>
							<span className="font-mono">v{initialData.published.versionNumber}</span>
						</div>
					</div>
				</div>

				<section className="border-4 border-black bg-white p-5">
					<h2 className="text-sm font-black uppercase">Guide rapide</h2>
					<div className="mt-3 grid gap-3 md:grid-cols-4">
						<div className="border-2 border-black p-3">
							<p className="text-[10px] font-black uppercase tracking-[0.2em]">1</p>
							<p className="mt-2 text-xs font-black uppercase">Identité</p>
							<p className="mt-1 text-[10px] font-bold uppercase text-neutral-600">Nom, slogan, footer.</p>
						</div>
						<div className="border-2 border-black p-3">
							<p className="text-[10px] font-black uppercase tracking-[0.2em]">2</p>
							<p className="mt-2 text-xs font-black uppercase">Sections</p>
							<p className="mt-1 text-[10px] font-bold uppercase text-neutral-600">
								Ajouter, déplacer, activer/désactiver.
							</p>
						</div>
						<div className="border-2 border-black p-3">
							<p className="text-[10px] font-black uppercase tracking-[0.2em]">3</p>
							<p className="mt-2 text-xs font-black uppercase">Brouillon</p>
							<p className="mt-1 text-[10px] font-bold uppercase text-neutral-600">Cliquez Enregistrer.</p>
						</div>
						<div className="border-2 border-black p-3">
							<p className="text-[10px] font-black uppercase tracking-[0.2em]">4</p>
							<p className="mt-2 text-xs font-black uppercase">Mise en ligne</p>
							<p className="mt-1 text-[10px] font-bold uppercase text-neutral-600">Cliquez Publier.</p>
						</div>
					</div>
				</section>

				<div className="grid lg:grid-cols-[1fr_420px] gap-8">
					<div className="border-4 border-black bg-white">
						<div className="border-b-4 border-black bg-black text-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em]">
							Aperçu en direct ({activeTemplate})
						</div>
						<div className="p-4 bg-neutral-200">
							<div
								className="storefront-theme border-4 border-black bg-background text-foreground min-h-[560px]"
								style={previewCssVariables as CSSProperties}
							>
								<TemplatePreview template={template} brandName={contentModel.globals.brandName} />
							</div>
						</div>
					</div>

					<div className="space-y-6">
						<Tabs defaultValue="globals">
							<TabsList className="w-full h-14 rounded-none border-4 border-black bg-white p-0 grid grid-cols-3">
								<TabsTrigger
									value="globals"
									className="rounded-none border-r-4 border-black font-black uppercase data-[state=active]:bg-black data-[state=active]:text-white"
								>
									1. Identité
								</TabsTrigger>
								<TabsTrigger
									value="templates"
									className="rounded-none border-r-4 border-black font-black uppercase data-[state=active]:bg-black data-[state=active]:text-white"
								>
									2. Sections
								</TabsTrigger>
								<TabsTrigger
									value="style"
									className="rounded-none font-black uppercase data-[state=active]:bg-black data-[state=active]:text-white"
								>
									3. Style
								</TabsTrigger>
							</TabsList>

							<TabsContent value="style" className="mt-6 space-y-6">
								<section className="bg-white border-4 border-black p-4 space-y-4">
									<h3 className="text-sm font-black uppercase">Couleurs</h3>
									<p className="text-[10px] font-bold uppercase text-neutral-600">
										Choisissez les couleurs principales de votre thème.
									</p>
									<div className="grid grid-cols-2 gap-4">
										<ColorPickerField
											label="Background"
											value={styleTokens.background}
											onChange={(value) => updateStyleToken("background", value)}
										/>
										<ColorPickerField
											label="Foreground"
											value={styleTokens.foreground}
											onChange={(value) => updateStyleToken("foreground", value)}
										/>
										<ColorPickerField
											label="Primary"
											value={styleTokens.primary}
											onChange={(value) => updateStyleToken("primary", value)}
										/>
										<ColorPickerField
											label="Primary Foreground"
											value={styleTokens.primaryForeground}
											onChange={(value) => updateStyleToken("primaryForeground", value)}
										/>
										<ColorPickerField
											label="Secondary"
											value={styleTokens.secondary}
											onChange={(value) => updateStyleToken("secondary", value)}
										/>
										<ColorPickerField
											label="Secondary Foreground"
											value={styleTokens.secondaryForeground}
											onChange={(value) => updateStyleToken("secondaryForeground", value)}
										/>
										<ColorPickerField
											label="Accent"
											value={styleTokens.accent}
											onChange={(value) => updateStyleToken("accent", value)}
										/>
										<ColorPickerField
											label="Border"
											value={styleTokens.border}
											onChange={(value) => updateStyleToken("border", value)}
										/>
									</div>
								</section>

								<section className="bg-white border-4 border-black p-4 space-y-4">
									<h3 className="text-sm font-black uppercase">Bordures et ombres</h3>
									<p className="text-[10px] font-bold uppercase text-neutral-600">
										Réglez l’épaisseur des bordures et la dureté des ombres.
									</p>
									<NumberToggleField
										label="Border"
										value={styleTokens.borderWidth}
										onChange={(value) => updateStyleToken("borderWidth", value)}
									/>
									<NumberToggleField
										label="Cards"
										value={styleTokens.cardBorderWidth}
										onChange={(value) => updateStyleToken("cardBorderWidth", value)}
									/>
									<NumberToggleField
										label="Buttons"
										value={styleTokens.buttonBorderWidth}
										onChange={(value) => updateStyleToken("buttonBorderWidth", value)}
									/>
									<ShadowToggleField
										label="Shadows"
										value={styleTokens.hardShadow}
										onChange={(value) => updateStyleToken("hardShadow", value)}
									/>
								</section>
							</TabsContent>

							<TabsContent value="globals" className="mt-6 space-y-4">
								<section className="bg-white border-4 border-black p-4 space-y-4">
									<h3 className="text-sm font-black uppercase">Identité boutique</h3>
									<p className="text-[10px] font-bold uppercase text-neutral-600">
										Ces textes sont réutilisés dans la navbar et le footer.
									</p>
									<TextInputField
										label="Nom de la marque"
										value={contentModel.globals.brandName}
										onChange={(value) =>
											updateContentModel((previous) => ({
												...previous,
												globals: { ...previous.globals, brandName: value },
											}))
										}
									/>
									<TextInputField
										label="Slogan"
										value={contentModel.globals.brandTagline}
										onChange={(value) =>
											updateContentModel((previous) => ({
												...previous,
												globals: { ...previous.globals, brandTagline: value },
											}))
										}
									/>
									<TextareaField
										label="Description du footer"
										value={contentModel.globals.footerDescription}
										onChange={(value) =>
											updateContentModel((previous) => ({
												...previous,
												globals: { ...previous.globals, footerDescription: value },
											}))
										}
									/>
									<TextInputField
										label="Copyright"
										value={contentModel.globals.footerCopyright}
										onChange={(value) =>
											updateContentModel((previous) => ({
												...previous,
												globals: { ...previous.globals, footerCopyright: value },
											}))
										}
									/>
								</section>
							</TabsContent>

							<TabsContent value="templates" className="mt-6 space-y-4">
								<section className="bg-white border-4 border-black p-4 space-y-4">
									<div className="flex items-center justify-between gap-3">
										<h3 className="text-sm font-black uppercase">Page à configurer</h3>
										<button
											type="button"
											onClick={() => {
												setIsAdvancedTemplates((previous) => !previous);
												if (isAdvancedTemplates) {
													setActiveTemplate("home");
												}
											}}
											className={`h-9 px-3 border-2 border-black text-[10px] font-black uppercase ${
												isAdvancedTemplates
													? "bg-black text-white"
													: "bg-white text-black hover:bg-black hover:text-white"
											}`}
										>
											Mode avancé: {isAdvancedTemplates ? "ON" : "OFF"}
										</button>
									</div>
									<p className="text-[10px] font-bold uppercase text-neutral-600">
										Mode simple: commencez par la page Accueil. Activez le mode avancé pour Produit,
										Collection, Catégorie et Checkout.
									</p>
									<div className="grid grid-cols-2 gap-2">
										{visibleTemplateOptions.map((option) => (
											<button
												type="button"
												key={option.key}
												onClick={() => setActiveTemplate(option.key)}
												className={`h-10 border-2 border-black font-black uppercase text-xs ${
													activeTemplate === option.key
														? "bg-black text-white"
														: "bg-white text-black hover:bg-black hover:text-white"
												}`}
											>
												{option.label}
											</button>
										))}
									</div>
								</section>

								<section className="bg-white border-4 border-black p-4 space-y-4">
									<div className="flex items-center justify-between gap-2">
										<h3 className="text-sm font-black uppercase">Sections ({activeTemplate})</h3>
										<div className="flex gap-2">
											<button
												type="button"
												onClick={() => addSection("hero")}
												className="h-8 px-3 border-2 border-black font-black uppercase text-[10px] hover:bg-black hover:text-white"
											>
												<Plus className="inline h-3 w-3 mr-1" />
												Hero
											</button>
											<button
												type="button"
												onClick={() => addSection("productGrid")}
												className="h-8 px-3 border-2 border-black font-black uppercase text-[10px] hover:bg-black hover:text-white"
											>
												<Plus className="inline h-3 w-3 mr-1" />
												Product Grid
											</button>
										</div>
									</div>

									{template.order.length === 0 ? (
										<div className="border-2 border-black p-4 text-xs font-black uppercase">
											Aucune section sur cette page.
										</div>
									) : (
										<div className="space-y-3">
											{template.order.map((sectionId, index) => {
												const section = template.sections[sectionId];
												if (!section) return null;
												return (
													<div key={sectionId} className="border-2 border-black p-3 space-y-3">
														<div className="flex items-center justify-between gap-3">
															<div className="flex items-center gap-2">
																<Badge className="rounded-none border-2 border-black bg-white text-black uppercase">
																	{section.type}
																</Badge>
																<span className="text-xs font-mono">{section.id}</span>
																{section.disabled && (
																	<span className="text-[10px] font-black uppercase text-red-600">
																		désactivée
																	</span>
																)}
															</div>
															<div className="flex items-center gap-1">
																<button
																	type="button"
																	onClick={() => moveSection(sectionId, "up")}
																	disabled={index === 0}
																	className="h-8 w-8 border-2 border-black flex items-center justify-center disabled:opacity-30 hover:bg-black hover:text-white"
																>
																	<ArrowUp className="h-4 w-4" />
																</button>
																<button
																	type="button"
																	onClick={() => moveSection(sectionId, "down")}
																	disabled={index === template.order.length - 1}
																	className="h-8 w-8 border-2 border-black flex items-center justify-center disabled:opacity-30 hover:bg-black hover:text-white"
																>
																	<ArrowDown className="h-4 w-4" />
																</button>
																<button
																	type="button"
																	onClick={() => toggleSection(sectionId)}
																	className="h-8 px-3 border-2 border-black text-[10px] font-black uppercase hover:bg-black hover:text-white"
																>
																	{section.disabled ? "Activer" : "Désactiver"}
																</button>
																<button
																	type="button"
																	onClick={() => removeSection(sectionId)}
																	className="h-8 w-8 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white"
																>
																	<Trash2 className="h-4 w-4" />
																</button>
															</div>
														</div>

														{section.type === "hero" ? (
															<div className="grid gap-3">
																<TextInputField
																	label="Titre"
																	value={section.settings.title}
																	onChange={(value) =>
																		updateSectionSettings(sectionId, (current) =>
																			current.type !== "hero"
																				? current
																				: {
																						...current,
																						settings: { ...current.settings, title: value },
																					},
																		)
																	}
																/>
																<TextareaField
																	label="Sous-titre"
																	value={section.settings.subtitle}
																	onChange={(value) =>
																		updateSectionSettings(sectionId, (current) =>
																			current.type !== "hero"
																				? current
																				: {
																						...current,
																						settings: { ...current.settings, subtitle: value },
																					},
																		)
																	}
																/>
																<TextInputField
																	label="URL image"
																	value={section.settings.image || ""}
																	onChange={(value) =>
																		updateSectionSettings(sectionId, (current) =>
																			current.type !== "hero"
																				? current
																				: {
																						...current,
																						settings: { ...current.settings, image: value || null },
																					},
																		)
																	}
																/>
																<TextInputField
																	label="Texte CTA principal"
																	value={section.settings.primaryCtaLabel}
																	onChange={(value) =>
																		updateSectionSettings(sectionId, (current) =>
																			current.type !== "hero"
																				? current
																				: {
																						...current,
																						settings: { ...current.settings, primaryCtaLabel: value },
																					},
																		)
																	}
																/>
																<TextInputField
																	label="Lien CTA principal"
																	value={section.settings.primaryCtaHref}
																	onChange={(value) =>
																		updateSectionSettings(sectionId, (current) =>
																			current.type !== "hero"
																				? current
																				: {
																						...current,
																						settings: { ...current.settings, primaryCtaHref: value },
																					},
																		)
																	}
																/>
																<TextInputField
																	label="Texte CTA secondaire"
																	value={section.settings.secondaryCtaLabel}
																	onChange={(value) =>
																		updateSectionSettings(sectionId, (current) =>
																			current.type !== "hero"
																				? current
																				: {
																						...current,
																						settings: { ...current.settings, secondaryCtaLabel: value },
																					},
																		)
																	}
																/>
																<TextInputField
																	label="Lien CTA secondaire"
																	value={section.settings.secondaryCtaHref}
																	onChange={(value) =>
																		updateSectionSettings(sectionId, (current) =>
																			current.type !== "hero"
																				? current
																				: {
																						...current,
																						settings: { ...current.settings, secondaryCtaHref: value },
																					},
																		)
																	}
																/>
															</div>
														) : (
															<div className="grid gap-3">
																<TextInputField
																	label="Titre"
																	value={section.settings.title}
																	onChange={(value) =>
																		updateSectionSettings(sectionId, (current) =>
																			current.type !== "productGrid"
																				? current
																				: {
																						...current,
																						settings: { ...current.settings, title: value },
																					},
																		)
																	}
																/>
																<TextareaField
																	label="Description"
																	value={section.settings.description}
																	onChange={(value) =>
																		updateSectionSettings(sectionId, (current) =>
																			current.type !== "productGrid"
																				? current
																				: {
																						...current,
																						settings: { ...current.settings, description: value },
																					},
																		)
																	}
																/>
																<SelectField
																	label="Collection"
																	value={section.settings.collectionId || ""}
																	options={[
																		{ value: "", label: "Auto (toutes)" },
																		...collectionOptions.map((collection) => ({
																			value: collection.id,
																			label: collection.name,
																		})),
																	]}
																	onChange={(value) =>
																		updateSectionSettings(sectionId, (current) =>
																			current.type !== "productGrid"
																				? current
																				: {
																						...current,
																						settings: {
																							...current.settings,
																							collectionId: value || null,
																						},
																					},
																		)
																	}
																/>
																<TextInputField
																	label="Nombre de produits"
																	value={`${section.settings.limit}`}
																	onChange={(value) =>
																		updateSectionSettings(sectionId, (current) =>
																			current.type !== "productGrid"
																				? current
																				: {
																						...current,
																						settings: {
																							...current.settings,
																							limit: Number(value) || 6,
																						},
																					},
																		)
																	}
																/>
																<TextInputField
																	label="Lien Voir tout"
																	value={section.settings.viewAllHref}
																	onChange={(value) =>
																		updateSectionSettings(sectionId, (current) =>
																			current.type !== "productGrid"
																				? current
																				: {
																						...current,
																						settings: { ...current.settings, viewAllHref: value },
																					},
																		)
																	}
																/>
																<div className="flex items-center justify-between border-2 border-black h-12 px-3">
																	<span className="text-[10px] font-black uppercase">
																		Afficher "Voir tout"
																	</span>
																	<button
																		type="button"
																		onClick={() =>
																			updateSectionSettings(sectionId, (current) =>
																				current.type !== "productGrid"
																					? current
																					: {
																							...current,
																							settings: {
																								...current.settings,
																								showViewAll: !current.settings.showViewAll,
																							},
																						},
																			)
																		}
																		className={`h-8 px-4 border-2 border-black font-black uppercase text-[10px] ${
																			section.settings.showViewAll
																				? "bg-black text-white"
																				: "bg-white text-black"
																		}`}
																	>
																		{section.settings.showViewAll ? "Oui" : "Non"}
																	</button>
																</div>
															</div>
														)}
													</div>
												);
											})}
										</div>
									)}
								</section>
							</TabsContent>
						</Tabs>

						<section className="bg-white border-4 border-black p-4 space-y-3">
							<h3 className="text-sm font-black uppercase">Historique</h3>
							<select
								value={restoreVersionId}
								onChange={(event) => setRestoreVersionId(event.target.value)}
								className="h-11 w-full border-2 border-black px-3 font-mono text-xs"
							>
								<option value="">Choisir une version</option>
								{initialData.history.map((version) => (
									<option key={version.id} value={version.id}>
										v{version.versionNumber} -{" "}
										{version.publishedAt ? new Date(version.publishedAt).toLocaleString() : "N/A"}
									</option>
								))}
							</select>
							<button
								type="button"
								onClick={handleRestoreVersion}
								disabled={isPending || !restoreVersionId}
								className="h-11 w-full border-2 border-black font-black uppercase text-xs hover:bg-black hover:text-white disabled:opacity-50"
							>
								Restaurer cette version
							</button>
						</section>
					</div>
				</div>
			</div>

			<div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4">
				<div className="border-4 border-black bg-black text-white p-2 flex flex-col md:flex-row gap-2">
					<div className="flex-1 border-2 border-white/25 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em]">
						{isPending ? "Traitement..." : "Prêt"}
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={handleSaveDraft}
							disabled={isPending}
							className="h-12 px-6 border-2 border-black bg-white text-black text-xs font-black uppercase hover:bg-neutral-200 disabled:opacity-50"
						>
							Enregistrer brouillon
						</button>
						<button
							type="button"
							onClick={handlePublish}
							disabled={isPending}
							className="h-12 px-6 border-2 border-black bg-lime-400 text-black text-xs font-black uppercase hover:brightness-110 disabled:opacity-50"
						>
							Publier
						</button>
						<button
							type="button"
							onClick={handleCancelChanges}
							disabled={isPending}
							className="h-12 w-12 border-2 border-white/25 flex items-center justify-center hover:bg-white/10 disabled:opacity-50"
						>
							<RotateCcw className="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function ColorPickerField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: ThemeColorKey;
	onChange: (value: ThemeColorKey) => void;
}) {
	return (
		<div className="space-y-2">
			<label className="text-[9px] font-black uppercase tracking-wider text-neutral-500 block">{label}</label>
			<div className="flex flex-wrap gap-1.5">
				{THEME_COLOR_OPTIONS.map((option) => (
					<button
						type="button"
						key={option.value}
						onClick={() => onChange(option.value)}
						className={`w-7 h-7 border-2 ${
							value === option.value
								? "border-black ring-2 ring-black ring-offset-1"
								: "border-black/10 hover:border-black/40"
						}`}
						style={{ backgroundColor: THEME_COLOR_VALUES[option.value] }}
						title={option.label}
					/>
				))}
			</div>
		</div>
	);
}

function NumberToggleField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: 2 | 4;
	onChange: (value: 2 | 4) => void;
}) {
	return (
		<div className="flex items-center justify-between gap-4">
			<label className="text-[10px] font-black uppercase tracking-[0.1em] text-black">{label}</label>
			<div className="flex border-4 border-black">
				{[2, 4].map((itemValue) => (
					<button
						type="button"
						key={itemValue}
						onClick={() => onChange(itemValue as 2 | 4)}
						className={`px-4 py-1 text-xs font-black ${
							value === itemValue ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"
						}`}
					>
						{itemValue}PX
					</button>
				))}
			</div>
		</div>
	);
}

function ShadowToggleField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: "sm" | "lg";
	onChange: (value: "sm" | "lg") => void;
}) {
	return (
		<div className="flex items-center justify-between gap-4">
			<label className="text-[10px] font-black uppercase tracking-[0.1em] text-black">{label}</label>
			<div className="flex border-4 border-black">
				{["sm", "lg"].map((itemValue) => (
					<button
						type="button"
						key={itemValue}
						onClick={() => onChange(itemValue as "sm" | "lg")}
						className={`px-4 py-1 text-xs font-black uppercase ${
							value === itemValue ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"
						}`}
					>
						{itemValue}
					</button>
				))}
			</div>
		</div>
	);
}

function TextInputField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="space-y-2">
			<label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">{label}</label>
			<input
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="w-full h-12 border-2 border-black bg-white px-3 text-xs font-black uppercase tracking-wide focus:outline-none focus:ring-0"
			/>
		</div>
	);
}

function TextareaField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="space-y-2">
			<label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">{label}</label>
			<textarea
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="w-full min-h-[96px] border-2 border-black bg-white p-3 text-xs font-black uppercase tracking-wide resize-none focus:outline-none focus:ring-0"
			/>
		</div>
	);
}

function SelectField({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: string;
	options: Array<{ value: string; label: string }>;
	onChange: (value: string) => void;
}) {
	return (
		<div className="space-y-2">
			<label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">{label}</label>
			<select
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="w-full h-12 border-2 border-black bg-white px-3 text-xs font-black uppercase tracking-wide focus:outline-none focus:ring-0"
			>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
}

function TemplatePreview({ template, brandName }: { template: ThemeTemplate; brandName: string }) {
	return (
		<div className="min-h-[560px] flex flex-col">
			<div className="h-14 border-b border-black px-4 flex items-center justify-between">
				<span className="text-sm font-black uppercase">{brandName}</span>
				<span className="text-[10px] font-black uppercase">{template.order.length} sections</span>
			</div>
			<div className="p-4 space-y-4">
				{template.order.map((sectionId) => {
					const section = template.sections[sectionId];
					if (!section || section.disabled) return null;
					if (section.type === "hero") {
						return (
							<div key={sectionId} className="border-2 border-black p-4 space-y-2">
								<p className="text-[10px] font-black uppercase">Hero</p>
								<h3 className="text-xl font-black uppercase">{section.settings.title}</h3>
								<p className="text-xs uppercase">{section.settings.subtitle}</p>
								<div className="flex gap-2 pt-1">
									<span className="h-8 px-3 border-2 border-black bg-black text-white text-[10px] font-black uppercase inline-flex items-center">
										{section.settings.primaryCtaLabel}
									</span>
									<span className="h-8 px-3 border-2 border-black text-[10px] font-black uppercase inline-flex items-center">
										{section.settings.secondaryCtaLabel}
									</span>
								</div>
							</div>
						);
					}

					return (
						<div key={sectionId} className="border-2 border-black p-4 space-y-3">
							<p className="text-[10px] font-black uppercase">Product Grid</p>
							<h3 className="text-sm font-black uppercase">{section.settings.title}</h3>
							<p className="text-[10px] uppercase">{section.settings.description}</p>
							<div className="grid grid-cols-2 gap-3 pt-1">
								{Array.from({ length: 4 }).map((_, index) => (
									<div key={`preview-card-${index}`} className="border-2 border-black p-2">
										<div className="h-14 border-2 border-black bg-neutral-200 mb-2" />
										<p className="text-[10px] font-black uppercase">Produit {index + 1}</p>
									</div>
								))}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
