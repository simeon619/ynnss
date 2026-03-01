"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
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
	ArrowLeft,
	ChevronDown,
	ChevronRight,
	GripVertical,
	Monitor,
	Plus,
	RotateCcw,
	Save,
	Send,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type {
	ThemeBuilderData,
	ThemeColorKey,
	ThemeContentModel,
	ThemeSectionInstance,
	ThemeSectionType,
	ThemeStyleTokens,
	ThemeTemplate,
} from "@/lib/theme-types";
import { THEME_COLOR_VALUES, toStorefrontCssVariables } from "@/lib/theme-utils";
import { cn } from "@/lib/utils";
import { publishThemeDraftAction, rollbackThemeAction, updateThemeDraftAction } from "./actions";

// ── Presets ────────────────────────────────────────────────────────────────────

interface ColorPreset {
	name: string;
	background: ThemeColorKey;
	foreground: ThemeColorKey;
	primary: ThemeColorKey;
	primaryForeground: ThemeColorKey;
	accent: ThemeColorKey;
}

const COLOR_PRESETS: ColorPreset[] = [
	{
		name: "CLASSIC",
		background: "white",
		foreground: "black",
		primary: "black",
		primaryForeground: "white",
		accent: "red",
	},
	{
		name: "NIGHT",
		background: "black",
		foreground: "white",
		primary: "white",
		primaryForeground: "black",
		accent: "neonGreen",
	},
	{
		name: "NEON",
		background: "black",
		foreground: "neonGreen",
		primary: "neonGreen",
		primaryForeground: "black",
		accent: "white",
	},
	{
		name: "ROUGE",
		background: "white",
		foreground: "black",
		primary: "red",
		primaryForeground: "white",
		accent: "black",
	},
	{
		name: "OCEAN",
		background: "white",
		foreground: "black",
		primary: "blue",
		primaryForeground: "white",
		accent: "red",
	},
];

const COLOR_OPTIONS: Array<{ value: ThemeColorKey; label: string }> = [
	{ value: "black", label: "Noir" },
	{ value: "white", label: "Blanc" },
	{ value: "red", label: "Rouge" },
	{ value: "blue", label: "Bleu" },
	{ value: "neonGreen", label: "Vert Neon" },
];

// ── Props ──────────────────────────────────────────────────────────────────────

interface ThemeStudioProps {
	initialData: ThemeBuilderData;
	collectionOptions: Array<{ id: string; name: string; slug: string }>;
}

// ── Sortable Section Item ──────────────────────────────────────────────────────

interface SortableSectionItemProps {
	section: ThemeSectionInstance;
	isFocused: boolean;
	onFocus: () => void;
	onRemove: () => void;
	children: React.ReactNode;
}

function SortableSectionItem({ section, isFocused, onFocus, onRemove, children }: SortableSectionItemProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: section.id,
	});
	const style: CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isFocused && ref.current) {
			ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
		}
	}, [isFocused]);

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn("border-2 border-black", isFocused && "ring-2 ring-red-500")}
		>
			<div
				role="button"
				tabIndex={0}
				ref={ref}
				className="flex items-center gap-1 bg-black text-white px-2 py-1 cursor-pointer"
				onClick={onFocus}
				onKeyDown={(e) => e.key === "Enter" && onFocus()}
			>
				<span {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-white">
					<GripVertical size={14} />
				</span>
				<span className="font-mono font-bold text-xs uppercase flex-1">
					{section.type === "hero" ? "HERO" : "PRODUCT GRID"} — {section.id}
				</span>
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onRemove();
					}}
					className="text-red-400 hover:text-red-200"
				>
					<Trash2 size={12} />
				</button>
			</div>
			{isFocused && <div className="p-3 bg-white">{children}</div>}
		</div>
	);
}

// ── Color Swatch ───────────────────────────────────────────────────────────────

function ColorSwatch({ colorKey }: { colorKey: ThemeColorKey }) {
	const hex = THEME_COLOR_VALUES[colorKey];
	return (
		<span
			className="inline-block w-4 h-4 border border-black align-middle"
			style={{ backgroundColor: hex }}
		/>
	);
}

// ── Color Select ──────────────────────────────────────────────────────────────

function ColorSelect({ value, onChange }: { value: ThemeColorKey; onChange: (v: ThemeColorKey) => void }) {
	return (
		<Select value={value} onValueChange={(v) => onChange(v as ThemeColorKey)}>
			<SelectTrigger className="h-8 border-2 border-black font-mono text-xs w-full">
				<SelectValue>
					<span className="flex items-center gap-2">
						<ColorSwatch colorKey={value} />
						{COLOR_OPTIONS.find((o) => o.value === value)?.label}
					</span>
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{COLOR_OPTIONS.map((opt) => (
					<SelectItem key={opt.value} value={opt.value}>
						<span className="flex items-center gap-2">
							<ColorSwatch colorKey={opt.value} />
							{opt.label}
						</span>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

// ── Collapsible Panel ─────────────────────────────────────────────────────────

function Panel({
	title,
	defaultOpen = true,
	children,
}: {
	title: string;
	defaultOpen?: boolean;
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2 bg-black text-white font-mono font-bold text-xs uppercase tracking-widest hover:bg-gray-900 select-none">
				{title}
				{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
			</CollapsibleTrigger>
			<CollapsibleContent>{children}</CollapsibleContent>
		</Collapsible>
	);
}

// ── Hero Section Editor ───────────────────────────────────────────────────────

function HeroEditor({
	settings,
	onChange,
}: {
	settings: ThemeSectionInstance & { type: "hero" };
	onChange: (updated: ThemeSectionInstance) => void;
}) {
	const s = settings.settings;
	const update = (key: string, value: string) => onChange({ ...settings, settings: { ...s, [key]: value } });

	return (
		<div className="space-y-2">
			{[
				["Titre", "title", s.title],
				["Sous-titre", "subtitle", s.subtitle],
				["CTA Primaire Label", "primaryCtaLabel", s.primaryCtaLabel],
				["CTA Primaire Lien", "primaryCtaHref", s.primaryCtaHref],
				["CTA Secondaire Label", "secondaryCtaLabel", s.secondaryCtaLabel],
				["CTA Secondaire Lien", "secondaryCtaHref", s.secondaryCtaHref],
				["Image URL", "image", s.image ?? ""],
			].map(([label, key, val]) => (
				<div key={key as string}>
					<Label className="font-mono text-xs uppercase">{label as string}</Label>
					<Input
						value={val as string}
						onChange={(e) => update(key as string, e.target.value)}
						className="h-8 border-2 border-black font-mono text-xs"
					/>
				</div>
			))}
		</div>
	);
}

// ── ProductGrid Section Editor ────────────────────────────────────────────────

function ProductGridEditor({
	settings,
	onChange,
	collectionOptions,
}: {
	settings: ThemeSectionInstance & { type: "productGrid" };
	onChange: (updated: ThemeSectionInstance) => void;
	collectionOptions: Array<{ id: string; name: string; slug: string }>;
}) {
	const s = settings.settings;
	const update = (key: string, value: string | number | boolean) =>
		onChange({ ...settings, settings: { ...s, [key]: value } });

	return (
		<div className="space-y-2">
			{[
				["Titre", "title", s.title],
				["Description", "description", s.description],
				["Lien Voir Tout", "viewAllHref", s.viewAllHref],
			].map(([label, key, val]) => (
				<div key={key as string}>
					<Label className="font-mono text-xs uppercase">{label as string}</Label>
					<Input
						value={val as string}
						onChange={(e) => update(key as string, e.target.value)}
						className="h-8 border-2 border-black font-mono text-xs"
					/>
				</div>
			))}
			<div>
				<Label className="font-mono text-xs uppercase">Collection</Label>
				<Select
					value={s.collectionId ?? "__none__"}
					onValueChange={(v) => update("collectionId", v === "__none__" ? "" : v)}
				>
					<SelectTrigger className="h-8 border-2 border-black font-mono text-xs">
						<SelectValue placeholder="Toutes" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__none__">Toutes</SelectItem>
						{collectionOptions.map((c) => (
							<SelectItem key={c.id} value={c.id}>
								{c.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div>
				<Label className="font-mono text-xs uppercase">Limite</Label>
				<Input
					type="number"
					value={s.limit}
					min={1}
					max={24}
					onChange={(e) => update("limit", Number.parseInt(e.target.value, 10))}
					className="h-8 border-2 border-black font-mono text-xs"
				/>
			</div>
		</div>
	);
}

// ── Mock Preview ──────────────────────────────────────────────────────────────

interface MockPreviewProps {
	cssVars: Record<string, string>;
	contentModel: ThemeContentModel;
	isMobile: boolean;
	onSectionClick: (sectionId: string) => void;
	focusedSectionId: string | null;
}

function MockPreview({
	cssVars,
	contentModel,
	isMobile,
	onSectionClick,
	focusedSectionId,
}: MockPreviewProps) {
	const { globals, templates } = contentModel;
	const homeTemplate = templates.home;

	return (
		<div
			style={cssVars as CSSProperties}
			className={cn(
				"border-2 border-black h-full overflow-y-auto transition-all duration-200",
				isMobile ? "max-w-[390px] mx-auto" : "w-full",
			)}
		>
			{/* Navbar */}
			<div
				className="px-4 py-3 font-black text-sm uppercase tracking-widest flex items-center gap-4"
				style={{
					background: "var(--primary)",
					color: "var(--primary-foreground)",
					borderBottom: `${cssVars["--store-border-width"]} solid var(--border)`,
				}}
			>
				<span>{globals.brandName}</span>
				<span className="text-xs font-normal opacity-60">{globals.brandTagline}</span>
			</div>

			{/* Sections */}
			<div
				className="divide-y-2 divide-black"
				style={{ background: "var(--background)", color: "var(--foreground)" }}
			>
				{homeTemplate.order.map((sectionId) => {
					const section = homeTemplate.sections[sectionId];
					if (!section) return null;
					const isFocused = focusedSectionId === sectionId;

					if (section.type === "hero") {
						const s = section.settings;
						return (
							<div
								key={sectionId}
								role="button"
								tabIndex={0}
								onClick={() => onSectionClick(sectionId)}
								onKeyDown={(e) => e.key === "Enter" && onSectionClick(sectionId)}
								className={cn(
									"p-6 cursor-pointer hover:opacity-80 transition-opacity border-l-4",
									isFocused ? "border-l-red-500" : "border-l-transparent",
								)}
							>
								<h2 className="font-black text-2xl uppercase mb-2">{s.title}</h2>
								<p className="text-sm mb-4 opacity-70">{s.subtitle}</p>
								<div className="flex gap-3">
									<span
										className="px-4 py-2 font-bold uppercase text-xs"
										style={{
											background: "var(--primary)",
											color: "var(--primary-foreground)",
											border: `${cssVars["--store-button-border-width"]} solid var(--border)`,
											boxShadow: cssVars["--store-hard-shadow"],
										}}
									>
										{s.primaryCtaLabel}
									</span>
									<span
										className="px-4 py-2 font-bold uppercase text-xs"
										style={{
											background: "var(--background)",
											color: "var(--foreground)",
											border: `${cssVars["--store-button-border-width"]} solid var(--border)`,
										}}
									>
										{s.secondaryCtaLabel}
									</span>
								</div>
								<div className="mt-2 text-xs font-mono opacity-40 select-none">
									[HERO — cliquer pour éditer]
								</div>
							</div>
						);
					}

					if (section.type === "productGrid") {
						const s = section.settings;
						return (
							<div
								key={sectionId}
								role="button"
								tabIndex={0}
								onClick={() => onSectionClick(sectionId)}
								onKeyDown={(e) => e.key === "Enter" && onSectionClick(sectionId)}
								className={cn(
									"p-4 cursor-pointer hover:opacity-80 transition-opacity border-l-4",
									isFocused ? "border-l-red-500" : "border-l-transparent",
								)}
							>
								<h3 className="font-black text-lg uppercase mb-1">{s.title}</h3>
								<p className="text-xs mb-3 opacity-60">{s.description}</p>
								<div className="grid grid-cols-3 gap-2">
									{Array.from({ length: Math.min(s.limit, 6) }).map((_, i) => (
										<div
											key={i}
											className="aspect-square"
											style={{
												background: "var(--secondary)",
												border: `${cssVars["--store-card-border-width"]} solid var(--border)`,
												boxShadow: cssVars["--store-hard-shadow"],
											}}
										/>
									))}
								</div>
								<div className="mt-2 text-xs font-mono opacity-40 select-none">
									[PRODUCT GRID — cliquer pour éditer]
								</div>
							</div>
						);
					}

					return null;
				})}
			</div>

			{/* Footer */}
			<div
				className="px-4 py-4 text-xs font-mono"
				style={{
					background: "var(--foreground)",
					color: "var(--background)",
					borderTop: `${cssVars["--store-border-width"]} solid var(--border)`,
				}}
			>
				<p className="font-bold mb-1">{globals.brandName}</p>
				<p className="opacity-70">{globals.footerDescription}</p>
				<p className="mt-2 opacity-50">{globals.footerCopyright}</p>
			</div>
		</div>
	);
}

// ── Main Theme Studio ─────────────────────────────────────────────────────────

export function ThemeStudio({ initialData, collectionOptions }: ThemeStudioProps) {
	const [isPending, startTransition] = useTransition();
	const [styleTokens, setStyleTokens] = useState<ThemeStyleTokens>(initialData.draft.styleTokens);
	const [contentModel, setContentModel] = useState<ThemeContentModel>(initialData.draft.contentModel);
	const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);
	const [isMobile, setIsMobile] = useState(false);

	const previewCssVars = useMemo(() => toStorefrontCssVariables(styleTokens), [styleTokens]);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	// ── Style token helpers ──────────────────────────────────────────────────

	function updateToken<K extends keyof ThemeStyleTokens>(key: K, value: ThemeStyleTokens[K]) {
		setStyleTokens((prev) => ({ ...prev, [key]: value }));
	}

	function applyPreset(preset: ColorPreset) {
		setStyleTokens((prev) => ({
			...prev,
			background: preset.background,
			foreground: preset.foreground,
			primary: preset.primary,
			primaryForeground: preset.primaryForeground,
			secondary: preset.background === "white" ? "white" : "black",
			secondaryForeground: preset.background === "white" ? "black" : "white",
			accent: preset.accent,
			border: preset.foreground,
		}));
	}

	// ── Content model helpers ────────────────────────────────────────────────

	function updateHomeTemplate(updater: (t: ThemeTemplate) => ThemeTemplate) {
		setContentModel((prev) => ({
			...prev,
			templates: { ...prev.templates, home: updater(prev.templates.home) },
		}));
	}

	function updateSection(sectionId: string, updated: ThemeSectionInstance) {
		updateHomeTemplate((t) => ({
			...t,
			sections: { ...t.sections, [sectionId]: updated },
		}));
	}

	function removeSection(sectionId: string) {
		updateHomeTemplate((t) => ({
			order: t.order.filter((id) => id !== sectionId),
			sections: Object.fromEntries(Object.entries(t.sections).filter(([id]) => id !== sectionId)),
		}));
		if (focusedSectionId === sectionId) setFocusedSectionId(null);
	}

	function addSection(type: ThemeSectionType) {
		const id = `${type}_${Date.now()}`;
		const newSection: ThemeSectionInstance =
			type === "hero"
				? {
						id,
						type: "hero",
						settings: {
							title: "Nouveau Hero",
							subtitle: "Sous-titre",
							image: null,
							primaryCtaLabel: "Acheter",
							primaryCtaHref: "#",
							secondaryCtaLabel: "Voir plus",
							secondaryCtaHref: "/products",
						},
					}
				: {
						id,
						type: "productGrid",
						settings: {
							title: "Produits",
							description: "Découvrez notre sélection",
							collectionId: null,
							limit: 6,
							showViewAll: true,
							viewAllHref: "/products",
						},
					};

		updateHomeTemplate((t) => ({
			order: [...t.order, id],
			sections: { ...t.sections, [id]: newSection },
		}));
		setFocusedSectionId(id);
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			updateHomeTemplate((t) => {
				const oldIndex = t.order.indexOf(active.id as string);
				const newIndex = t.order.indexOf(over.id as string);
				return { ...t, order: arrayMove(t.order, oldIndex, newIndex) };
			});
		}
	}

	// ── Actions ──────────────────────────────────────────────────────────────

	function handleSave() {
		startTransition(async () => {
			const result = await updateThemeDraftAction({ styleTokens, contentModel });
			if (result.success) toast.success("Brouillon sauvegardé");
			else toast.error("Erreur lors de la sauvegarde");
		});
	}

	function handlePublish() {
		startTransition(async () => {
			await updateThemeDraftAction({ styleTokens, contentModel });
			const result = await publishThemeDraftAction();
			if (result.success) toast.success("Thème publié avec succès !");
			else toast.error("Erreur lors de la publication");
		});
	}

	function handleRollback(versionId: string) {
		startTransition(async () => {
			const result = await rollbackThemeAction(versionId);
			if (result.success) {
				toast.success("Version restaurée");
			}
		});
	}

	// ── Preview click-to-edit ────────────────────────────────────────────────

	function handleSectionClickInPreview(sectionId: string) {
		setFocusedSectionId(sectionId);
	}

	const homeTemplate = contentModel.templates.home;

	// ── Render ───────────────────────────────────────────────────────────────

	return (
		<div className="flex flex-col h-full overflow-hidden bg-white">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-2 border-b-2 border-black bg-white shrink-0">
				<div className="flex items-center gap-3">
					<Link
						href="/manage/themes"
						className="flex items-center gap-1 border-2 border-black px-3 h-9 font-mono font-bold text-xs uppercase hover:bg-black hover:text-white transition-all"
					>
						<ArrowLeft size={14} />
						Retour
					</Link>
					<span className="font-black text-sm uppercase tracking-widest">THEME STUDIO</span>
					<Badge className="bg-yellow-400 text-black border-2 border-black font-mono text-xs">DRAFT</Badge>
				</div>
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						variant="outline"
						onClick={handleSave}
						disabled={isPending}
						className="border-2 border-black font-mono text-xs uppercase h-8"
					>
						<Save size={12} className="mr-1" />
						Sauvegarder
					</Button>
					<Button
						size="sm"
						onClick={handlePublish}
						disabled={isPending}
						className="bg-black text-white border-2 border-black font-mono text-xs uppercase h-8 hover:bg-white hover:text-black"
					>
						<Send size={12} className="mr-1" />
						Publier
					</Button>
				</div>
			</div>

			{/* Body */}
			<div className="flex flex-1 overflow-hidden">
				{/* Sidebar */}
				<div className="w-80 shrink-0 border-r-2 border-black overflow-y-auto bg-gray-50 flex flex-col">
					{/* Presets */}
					<Panel title="▶ PRESETS" defaultOpen>
						<div className="p-3 flex flex-wrap gap-2">
							{COLOR_PRESETS.map((preset) => (
								<button
									key={preset.name}
									type="button"
									onClick={() => applyPreset(preset)}
									className="px-2 py-1 text-xs font-mono font-bold border-2 border-black uppercase hover:bg-black hover:text-white transition-colors"
									style={{
										background: THEME_COLOR_VALUES[preset.background],
										color: THEME_COLOR_VALUES[preset.foreground],
									}}
								>
									{preset.name}
								</button>
							))}
						</div>
					</Panel>

					{/* Colors */}
					<Panel title="▼ COULEURS">
						<div className="p-3 space-y-3">
							{(
								[
									["Background", "background"],
									["Foreground", "foreground"],
									["Primary", "primary"],
									["Primary FG", "primaryForeground"],
									["Secondary", "secondary"],
									["Secondary FG", "secondaryForeground"],
									["Accent", "accent"],
									["Border", "border"],
								] as const
							).map(([label, key]) => (
								<div key={key} className="flex items-center gap-2">
									<Label className="font-mono text-xs uppercase w-24 shrink-0">{label}</Label>
									<ColorSelect value={styleTokens[key]} onChange={(v) => updateToken(key, v)} />
								</div>
							))}
							<div className="flex items-center gap-2">
								<Label className="font-mono text-xs uppercase w-24 shrink-0">Border W.</Label>
								<Select
									value={String(styleTokens.borderWidth)}
									onValueChange={(v) => updateToken("borderWidth", Number(v) as 2 | 4)}
								>
									<SelectTrigger className="h-8 border-2 border-black font-mono text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="2">2px</SelectItem>
										<SelectItem value="4">4px</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex items-center gap-2">
								<Label className="font-mono text-xs uppercase w-24 shrink-0">Shadow</Label>
								<Select
									value={styleTokens.hardShadow}
									onValueChange={(v) => updateToken("hardShadow", v as "sm" | "lg")}
								>
									<SelectTrigger className="h-8 border-2 border-black font-mono text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="sm">SM (4px)</SelectItem>
										<SelectItem value="lg">LG (6px)</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</Panel>

					{/* Sections */}
					<Panel title="▼ SECTIONS">
						<div className="p-3 space-y-2">
							<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
								<SortableContext items={homeTemplate.order} strategy={verticalListSortingStrategy}>
									{homeTemplate.order.map((sectionId) => {
										const section = homeTemplate.sections[sectionId];
										if (!section) return null;
										return (
											<SortableSectionItem
												key={sectionId}
												section={section}
												isFocused={focusedSectionId === sectionId}
												onFocus={() => setFocusedSectionId(focusedSectionId === sectionId ? null : sectionId)}
												onRemove={() => removeSection(sectionId)}
											>
												{section.type === "hero" ? (
													<HeroEditor
														settings={section as ThemeSectionInstance & { type: "hero" }}
														onChange={(updated) => updateSection(sectionId, updated)}
													/>
												) : (
													<ProductGridEditor
														settings={section as ThemeSectionInstance & { type: "productGrid" }}
														onChange={(updated) => updateSection(sectionId, updated)}
														collectionOptions={collectionOptions}
													/>
												)}
											</SortableSectionItem>
										);
									})}
								</SortableContext>
							</DndContext>
							<div className="flex gap-2 pt-1">
								<Button
									size="sm"
									variant="outline"
									onClick={() => addSection("hero")}
									className="border-2 border-black font-mono text-xs uppercase h-8 flex-1"
								>
									<Plus size={12} className="mr-1" /> Hero
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => addSection("productGrid")}
									className="border-2 border-black font-mono text-xs uppercase h-8 flex-1"
								>
									<Plus size={12} className="mr-1" /> Grid
								</Button>
							</div>
						</div>
					</Panel>

					{/* Texts */}
					<Panel title="▼ TEXTES">
						<div className="p-3 space-y-2">
							{(
								[
									["Marque", "brandName"],
									["Tagline", "brandTagline"],
									["Description footer", "footerDescription"],
									["Copyright", "footerCopyright"],
								] as const
							).map(([label, key]) => (
								<div key={key}>
									<Label className="font-mono text-xs uppercase">{label}</Label>
									<Input
										value={contentModel.globals[key]}
										onChange={(e) =>
											setContentModel((prev) => ({
												...prev,
												globals: { ...prev.globals, [key]: e.target.value },
											}))
										}
										className="h-8 border-2 border-black font-mono text-xs"
									/>
								</div>
							))}
						</div>
					</Panel>

					{/* History */}
					<Panel title="▼ HISTORIQUE" defaultOpen={false}>
						<div className="p-3 space-y-2">
							{initialData.history.length === 0 && (
								<p className="text-xs font-mono text-gray-500">Aucun historique</p>
							)}
							{initialData.history.map((version) => (
								<div key={version.id} className="flex items-center justify-between border-2 border-black p-2">
									<div>
										<span className="font-mono text-xs font-bold">v{version.versionNumber}</span>
										{version.kind === "published" && (
											<Badge className="ml-2 bg-green-400 text-black border border-black text-xs">LIVE</Badge>
										)}
										{version.publishedAt && (
											<p className="text-xs text-gray-500 font-mono">
												{new Date(version.publishedAt).toLocaleDateString()}
											</p>
										)}
									</div>
									{version.kind !== "published" && (
										<Button
											size="sm"
											variant="outline"
											onClick={() => handleRollback(version.id)}
											disabled={isPending}
											className="border-2 border-black font-mono text-xs uppercase h-7"
										>
											<RotateCcw size={10} className="mr-1" />
											Restorer
										</Button>
									)}
								</div>
							))}
						</div>
					</Panel>
				</div>

				{/* Preview */}
				<div className="flex-1 flex flex-col overflow-hidden bg-gray-200">
					{/* Preview toolbar */}
					<div className="flex items-center justify-end gap-2 px-4 py-2 border-b-2 border-black bg-white shrink-0">
						<span className="font-mono text-xs text-gray-500 mr-auto uppercase tracking-widest">Preview</span>
						<Button
							size="sm"
							variant={!isMobile ? "default" : "outline"}
							onClick={() => setIsMobile(false)}
							className={cn(
								"h-7 border-2 border-black font-mono text-xs",
								!isMobile ? "bg-black text-white" : "bg-white text-black",
							)}
						>
							<Monitor size={12} className="mr-1" />
							Desktop
						</Button>
						<Button
							size="sm"
							variant={isMobile ? "default" : "outline"}
							onClick={() => setIsMobile(true)}
							className={cn(
								"h-7 border-2 border-black font-mono text-xs",
								isMobile ? "bg-black text-white" : "bg-white text-black",
							)}
						>
							📱 Mobile
						</Button>
					</div>

					{/* Preview area */}
					<div className="flex-1 overflow-auto p-4">
						<MockPreview
							cssVars={previewCssVars}
							contentModel={contentModel}
							isMobile={isMobile}
							onSectionClick={handleSectionClickInPreview}
							focusedSectionId={focusedSectionId}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
