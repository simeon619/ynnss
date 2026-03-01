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
	ExternalLink,
	GripVertical,
	Monitor,
	Plus,
	RotateCcw,
	Save,
	Send,
	Smartphone,
	Tablet,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { try_ as safe } from "safe-try";
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
	ThemeTemplateKey,
} from "@/lib/theme-types";
import { createDefaultSection, THEME_COLOR_VALUES, toStorefrontCssVariables } from "@/lib/theme-utils";
import { cn } from "@/lib/utils";
import { YNSImage } from "@/lib/yns-image";
import {
	createDraftFromPublishedAction,
	getThemeBuilderDataAction,
	publishThemeDraftAction,
	rollbackThemeAction,
	seedStoreDemoDataAction,
	updateThemeDraftAction,
} from "./actions";
import {
	addSectionToTemplate,
	canRemoveSection,
	canRestorePublishedVersion,
	clampProductGridLimit,
	findDemoProductGridReferences,
	getAllowedSectionTypes,
	getVisibleTemplateKeys,
	removeSectionFromTemplate,
	reorderSectionsInTemplate,
	THEME_TEMPLATE_OPTIONS,
	updateSectionInTemplate,
} from "./theme-studio.helpers";
import {
	buildDemoCatalog,
	computeScale,
	getViewportSpec,
	type PreviewViewportMode,
	resolvePreviewProductsForGrid,
	type ThemeStudioCategoryOption,
	type ThemeStudioCollectionOption,
	type ThemeStudioCollectionProductLink,
	type ThemeStudioPreviewProduct,
} from "./theme-studio.preview.helpers";

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

const SECTION_TYPE_LABELS: Record<ThemeSectionType, string> = {
	hero: "Hero",
	productGrid: "Product Grid",
	productDetails: "Product Details",
	collectionHeader: "Collection Header",
	categoryHeader: "Category Header",
	checkoutSummary: "Checkout Summary",
	checkoutForm: "Checkout Form",
};

interface ThemeStudioProps {
	initialData: ThemeBuilderData;
	collectionOptions: ThemeStudioCollectionOption[];
	categoryOptions: ThemeStudioCategoryOption[];
	previewProducts: ThemeStudioPreviewProduct[];
	collectionProductLinks: ThemeStudioCollectionProductLink[];
	storefrontHref: string;
}

interface SortableSectionItemProps {
	section: ThemeSectionInstance;
	isFocused: boolean;
	onFocus: () => void;
	onRemove: () => void;
	canRemove: boolean;
	onToggleDisabled: () => void;
	children: React.ReactNode;
}

function SortableSectionItem({
	section,
	isFocused,
	onFocus,
	onRemove,
	canRemove,
	onToggleDisabled,
	children,
}: SortableSectionItemProps) {
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
				onKeyDown={(event) => event.key === "Enter" && onFocus()}
			>
				<span {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-white">
					<GripVertical size={14} />
				</span>
				<span className="font-mono font-bold text-xs uppercase flex-1 truncate">
					{SECTION_TYPE_LABELS[section.type]} — {section.id}
				</span>
				<button
					type="button"
					onClick={(event) => {
						event.stopPropagation();
						onToggleDisabled();
					}}
					className={cn(
						"h-5 px-1.5 border border-white font-mono text-[10px] uppercase",
						section.disabled ? "bg-white text-black" : "bg-transparent text-white",
					)}
				>
					{section.disabled ? "OFF" : "ON"}
				</button>
				<button
					type="button"
					disabled={!canRemove}
					onClick={(event) => {
						event.stopPropagation();
						onRemove();
					}}
					className={cn(
						"text-red-400 hover:text-red-200",
						!canRemove && "opacity-30 cursor-not-allowed hover:text-red-400",
					)}
				>
					<Trash2 size={12} />
				</button>
			</div>
			{isFocused && <div className="p-3 bg-white">{children}</div>}
		</div>
	);
}

function ColorSwatch({ colorKey }: { colorKey: ThemeColorKey }) {
	const hex = THEME_COLOR_VALUES[colorKey];
	return (
		<span
			className="inline-block w-4 h-4 border border-black align-middle"
			style={{ backgroundColor: hex }}
		/>
	);
}

function ColorSelect({
	value,
	onChange,
}: {
	value: ThemeColorKey;
	onChange: (value: ThemeColorKey) => void;
}) {
	return (
		<Select value={value} onValueChange={(newValue) => onChange(newValue as ThemeColorKey)}>
			<SelectTrigger className="h-8 border-2 border-black font-mono text-xs w-full">
				<SelectValue>
					<span className="flex items-center gap-2">
						<ColorSwatch colorKey={value} />
						{COLOR_OPTIONS.find((option) => option.value === value)?.label}
					</span>
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{COLOR_OPTIONS.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						<span className="flex items-center gap-2">
							<ColorSwatch colorKey={option.value} />
							{option.label}
						</span>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

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

function HeroEditor({
	settings,
	onChange,
}: {
	settings: ThemeSectionInstance & { type: "hero" };
	onChange: (updated: ThemeSectionInstance) => void;
}) {
	const sectionSettings = settings.settings;
	const update = (key: string, value: string) =>
		onChange({ ...settings, settings: { ...sectionSettings, [key]: value } });

	return (
		<div className="space-y-2">
			{[
				["Titre", "title", sectionSettings.title],
				["Sous-titre", "subtitle", sectionSettings.subtitle],
				["CTA Primaire Label", "primaryCtaLabel", sectionSettings.primaryCtaLabel],
				["CTA Primaire Lien", "primaryCtaHref", sectionSettings.primaryCtaHref],
				["CTA Secondaire Label", "secondaryCtaLabel", sectionSettings.secondaryCtaLabel],
				["CTA Secondaire Lien", "secondaryCtaHref", sectionSettings.secondaryCtaHref],
				["Image URL", "image", sectionSettings.image ?? ""],
			].map(([label, key, value]) => (
				<div key={key as string}>
					<Label className="font-mono text-xs uppercase">{label as string}</Label>
					<Input
						value={value as string}
						onChange={(event) => update(key as string, event.target.value)}
						className="h-8 border-2 border-black font-mono text-xs"
					/>
				</div>
			))}
		</div>
	);
}

function ProductGridEditor({
	settings,
	onChange,
	collectionOptions,
}: {
	settings: ThemeSectionInstance & { type: "productGrid" };
	onChange: (updated: ThemeSectionInstance) => void;
	collectionOptions: ThemeStudioCollectionOption[];
}) {
	const sectionSettings = settings.settings;
	const update = (key: string, value: string | number | boolean) =>
		onChange({ ...settings, settings: { ...sectionSettings, [key]: value } });

	return (
		<div className="space-y-2">
			{[
				["Titre", "title", sectionSettings.title],
				["Description", "description", sectionSettings.description],
				["Lien Voir Tout", "viewAllHref", sectionSettings.viewAllHref],
			].map(([label, key, value]) => (
				<div key={key as string}>
					<Label className="font-mono text-xs uppercase">{label as string}</Label>
					<Input
						value={value as string}
						onChange={(event) => update(key as string, event.target.value)}
						className="h-8 border-2 border-black font-mono text-xs"
					/>
				</div>
			))}
			<div>
				<Label className="font-mono text-xs uppercase">Collection</Label>
				<Select
					value={sectionSettings.collectionId ?? "__none__"}
					onValueChange={(value) => update("collectionId", value === "__none__" ? "" : value)}
				>
					<SelectTrigger className="h-8 border-2 border-black font-mono text-xs">
						<SelectValue placeholder="Toutes" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__none__">Toutes</SelectItem>
						{collectionOptions.map((collection) => (
							<SelectItem key={collection.id} value={collection.id}>
								{collection.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div>
				<Label className="font-mono text-xs uppercase">Limite</Label>
				<Input
					type="number"
					value={sectionSettings.limit}
					min={1}
					max={24}
					onChange={(event) => {
						const parsed = Number.parseInt(event.target.value, 10);
						update("limit", clampProductGridLimit(parsed, sectionSettings.limit));
					}}
					className="h-8 border-2 border-black font-mono text-xs"
				/>
			</div>
			<div className="flex items-center justify-between border-2 border-black px-2 py-1.5">
				<Label className="font-mono text-xs uppercase">Afficher “Voir tout”</Label>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={() => update("showViewAll", !sectionSettings.showViewAll)}
					className={cn(
						"h-7 border-2 border-black font-mono text-[10px] uppercase",
						sectionSettings.showViewAll ? "bg-black text-white" : "bg-white text-black",
					)}
				>
					{sectionSettings.showViewAll ? "Oui" : "Non"}
				</Button>
			</div>
		</div>
	);
}

function ProductDetailsEditor({
	settings,
	onChange,
}: {
	settings: ThemeSectionInstance & { type: "productDetails" };
	onChange: (updated: ThemeSectionInstance) => void;
}) {
	const sectionSettings = settings.settings;
	const update = (key: "showBreadcrumbs" | "showSummary" | "showFeatures", value: boolean) =>
		onChange({ ...settings, settings: { ...sectionSettings, [key]: value } });

	return (
		<div className="space-y-2">
			{(
				[
					["Fil d'ariane", "showBreadcrumbs"],
					["Resume produit", "showSummary"],
					["Bloc features", "showFeatures"],
				] as const
			).map(([label, key]) => (
				<div key={key} className="flex items-center justify-between border-2 border-black px-2 py-1.5">
					<Label className="font-mono text-xs uppercase">{label}</Label>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={() => update(key, !sectionSettings[key])}
						className={cn(
							"h-7 border-2 border-black font-mono text-[10px] uppercase",
							sectionSettings[key] ? "bg-black text-white" : "bg-white text-black",
						)}
					>
						{sectionSettings[key] ? "Oui" : "Non"}
					</Button>
				</div>
			))}
		</div>
	);
}

function CollectionHeaderEditor({
	settings,
	onChange,
}: {
	settings: ThemeSectionInstance & { type: "collectionHeader" };
	onChange: (updated: ThemeSectionInstance) => void;
}) {
	const sectionSettings = settings.settings;
	const update = (key: "showDescription" | "showImage", value: boolean) =>
		onChange({ ...settings, settings: { ...sectionSettings, [key]: value } });

	return (
		<div className="space-y-2">
			{(
				[
					["Afficher description", "showDescription"],
					["Afficher image", "showImage"],
				] as const
			).map(([label, key]) => (
				<div key={key} className="flex items-center justify-between border-2 border-black px-2 py-1.5">
					<Label className="font-mono text-xs uppercase">{label}</Label>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={() => update(key, !sectionSettings[key])}
						className={cn(
							"h-7 border-2 border-black font-mono text-[10px] uppercase",
							sectionSettings[key] ? "bg-black text-white" : "bg-white text-black",
						)}
					>
						{sectionSettings[key] ? "Oui" : "Non"}
					</Button>
				</div>
			))}
		</div>
	);
}

function CategoryHeaderEditor({
	settings,
	onChange,
}: {
	settings: ThemeSectionInstance & { type: "categoryHeader" };
	onChange: (updated: ThemeSectionInstance) => void;
}) {
	const sectionSettings = settings.settings;
	const update = (
		key: "showBreadcrumbs" | "showDescription" | "showImage" | "showSubcategories",
		value: boolean,
	) => onChange({ ...settings, settings: { ...sectionSettings, [key]: value } });

	return (
		<div className="space-y-2">
			{(
				[
					["Fil d'ariane", "showBreadcrumbs"],
					["Description", "showDescription"],
					["Image", "showImage"],
					["Sous-categories", "showSubcategories"],
				] as const
			).map(([label, key]) => (
				<div key={key} className="flex items-center justify-between border-2 border-black px-2 py-1.5">
					<Label className="font-mono text-xs uppercase">{label}</Label>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={() => update(key, !sectionSettings[key])}
						className={cn(
							"h-7 border-2 border-black font-mono text-[10px] uppercase",
							sectionSettings[key] ? "bg-black text-white" : "bg-white text-black",
						)}
					>
						{sectionSettings[key] ? "Oui" : "Non"}
					</Button>
				</div>
			))}
		</div>
	);
}

function CheckoutSummaryEditor({
	settings,
	onChange,
}: {
	settings: ThemeSectionInstance & { type: "checkoutSummary" };
	onChange: (updated: ThemeSectionInstance) => void;
}) {
	const sectionSettings = settings.settings;
	const update = (key: "title" | "description", value: string) =>
		onChange({ ...settings, settings: { ...sectionSettings, [key]: value } });

	return (
		<div className="space-y-2">
			<div>
				<Label className="font-mono text-xs uppercase">Titre</Label>
				<Input
					value={sectionSettings.title}
					onChange={(event) => update("title", event.target.value)}
					className="h-8 border-2 border-black font-mono text-xs"
				/>
			</div>
			<div>
				<Label className="font-mono text-xs uppercase">Description</Label>
				<Input
					value={sectionSettings.description}
					onChange={(event) => update("description", event.target.value)}
					className="h-8 border-2 border-black font-mono text-xs"
				/>
			</div>
		</div>
	);
}

function CheckoutFormEditor({
	settings,
	onChange,
}: {
	settings: ThemeSectionInstance & { type: "checkoutForm" };
	onChange: (updated: ThemeSectionInstance) => void;
}) {
	const sectionSettings = settings.settings;

	return (
		<div>
			<Label className="font-mono text-xs uppercase">Titre</Label>
			<Input
				value={sectionSettings.title}
				onChange={(event) =>
					onChange({ ...settings, settings: { ...sectionSettings, title: event.target.value } })
				}
				className="h-8 border-2 border-black font-mono text-xs"
			/>
		</div>
	);
}

function formatPreviewMoney(rawPrice: string | undefined) {
	if (!rawPrice) return "—";
	try {
		const parsed = BigInt(rawPrice);
		const formatted = parsed.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
		return `${formatted} XOF`;
	} catch {
		return rawPrice;
	}
}

function resolvePreviewPrice(product: ThemeStudioPreviewProduct) {
	const parsedPrices = product.variants
		.map((variant) => {
			try {
				return BigInt(variant.price);
			} catch {
				return null;
			}
		})
		.filter((price): price is bigint => price !== null);

	if (parsedPrices.length === 0) {
		return "—";
	}

	const [firstPrice] = parsedPrices;
	if (!firstPrice) {
		return "—";
	}

	const { min, max } = parsedPrices.reduce(
		(acc, price) => ({
			min: price < acc.min ? price : acc.min,
			max: price > acc.max ? price : acc.max,
		}),
		{ min: firstPrice, max: firstPrice },
	);

	if (min !== max) {
		return `${formatPreviewMoney(min.toString())} - ${formatPreviewMoney(max.toString())}`;
	}

	return formatPreviewMoney(min.toString());
}

function resolvePreviewImage(product: ThemeStudioPreviewProduct) {
	const fromProduct = product.images?.[0];
	if (fromProduct) return fromProduct;

	const fromVariants = product.variants.find((variant) => (variant.images?.length || 0) > 0)?.images?.[0];
	return fromVariants ?? null;
}

interface MockPreviewProps {
	cssVars: Record<string, string>;
	globals: ThemeContentModel["globals"];
	template: ThemeTemplate;
	templateKey: ThemeTemplateKey;
	previewViewport: PreviewViewportMode;
	previewProducts: ThemeStudioPreviewProduct[];
	collectionProductLinks: ThemeStudioCollectionProductLink[];
	onSectionClick: (sectionId: string) => void;
	focusedSectionId: string | null;
}

function MockPreview({
	cssVars,
	globals,
	template,
	templateKey,
	previewViewport,
	previewProducts,
	collectionProductLinks,
	onSectionClick,
	focusedSectionId,
}: MockPreviewProps) {
	const visibleSections = template.order
		.map((sectionId) => template.sections[sectionId])
		.filter((section) => Boolean(section && !section.disabled));

	return (
		<div
			style={cssVars as CSSProperties}
			className="border-2 border-black h-full overflow-y-auto transition-none"
		>
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
				<span className="ml-auto text-[10px] font-mono opacity-70 uppercase">{templateKey}</span>
			</div>

			<div
				className="divide-y-2 divide-black"
				style={{ background: "var(--background)", color: "var(--foreground)" }}
			>
				{visibleSections.length === 0 && (
					<div className="p-6 text-xs font-mono uppercase opacity-60">
						Aucune section active pour ce template.
					</div>
				)}

				{visibleSections.map((section) => {
					if (!section) return null;
					const isFocused = focusedSectionId === section.id;

					if (section.type === "hero") {
						const sectionSettings = section.settings;
						return (
							<div
								key={section.id}
								role="button"
								tabIndex={0}
								onClick={() => onSectionClick(section.id)}
								onKeyDown={(event) => event.key === "Enter" && onSectionClick(section.id)}
								className={cn(
									"p-6 cursor-pointer hover:opacity-80 transition-opacity border-l-4",
									isFocused ? "border-l-red-500" : "border-l-transparent",
								)}
							>
								<h2 className="font-black text-2xl uppercase mb-2">{sectionSettings.title}</h2>
								<p className="text-sm mb-4 opacity-70">{sectionSettings.subtitle}</p>
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
										{sectionSettings.primaryCtaLabel}
									</span>
									<span
										className="px-4 py-2 font-bold uppercase text-xs"
										style={{
											background: "var(--background)",
											color: "var(--foreground)",
											border: `${cssVars["--store-button-border-width"]} solid var(--border)`,
										}}
									>
										{sectionSettings.secondaryCtaLabel}
									</span>
								</div>
								<div className="mt-2 text-xs font-mono opacity-40 select-none">
									[HERO — cliquer pour éditer]
								</div>
							</div>
						);
					}

					if (section.type === "productDetails") {
						return (
							<div
								key={section.id}
								role="button"
								tabIndex={0}
								onClick={() => onSectionClick(section.id)}
								onKeyDown={(event) => event.key === "Enter" && onSectionClick(section.id)}
								className={cn(
									"p-4 cursor-pointer hover:opacity-80 transition-opacity border-l-4",
									isFocused ? "border-l-red-500" : "border-l-transparent",
								)}
							>
								<h3 className="font-black text-lg uppercase mb-1">PRODUCT DETAILS</h3>
								<div className="grid gap-3 sm:grid-cols-2">
									<div className="border-2 border-black p-3 text-xs font-mono uppercase">Galerie + infos</div>
									<div className="border-2 border-black p-3 text-xs font-mono uppercase">
										Prix + add to cart
									</div>
								</div>
								<p className="mt-3 text-[10px] font-mono opacity-60 uppercase">
									Breadcrumbs: {section.settings.showBreadcrumbs ? "ON" : "OFF"} · Resume:{" "}
									{section.settings.showSummary ? "ON" : "OFF"} · Features:{" "}
									{section.settings.showFeatures ? "ON" : "OFF"}
								</p>
								<div className="mt-2 text-xs font-mono opacity-40 select-none">[PRODUCT DETAILS]</div>
							</div>
						);
					}

					if (section.type === "collectionHeader") {
						return (
							<div
								key={section.id}
								role="button"
								tabIndex={0}
								onClick={() => onSectionClick(section.id)}
								onKeyDown={(event) => event.key === "Enter" && onSectionClick(section.id)}
								className={cn(
									"p-4 cursor-pointer hover:opacity-80 transition-opacity border-l-4",
									isFocused ? "border-l-red-500" : "border-l-transparent",
								)}
							>
								<h3 className="font-black text-lg uppercase mb-1">COLLECTION HEADER</h3>
								<div className="border-2 border-black p-4">
									<p className="text-xl font-black uppercase">Collection Name</p>
									{section.settings.showDescription && (
										<p className="text-xs opacity-70 mt-2">Collection description preview text.</p>
									)}
									{section.settings.showImage && (
										<div className="mt-3 h-24 border-2 border-black bg-neutral-200" />
									)}
								</div>
								<div className="mt-2 text-xs font-mono opacity-40 select-none">[COLLECTION HEADER]</div>
							</div>
						);
					}

					if (section.type === "categoryHeader") {
						return (
							<div
								key={section.id}
								role="button"
								tabIndex={0}
								onClick={() => onSectionClick(section.id)}
								onKeyDown={(event) => event.key === "Enter" && onSectionClick(section.id)}
								className={cn(
									"p-4 cursor-pointer hover:opacity-80 transition-opacity border-l-4",
									isFocused ? "border-l-red-500" : "border-l-transparent",
								)}
							>
								<h3 className="font-black text-lg uppercase mb-1">CATEGORY HEADER</h3>
								{section.settings.showBreadcrumbs && (
									<p className="text-[10px] font-mono uppercase opacity-60">Accueil / Category / Current</p>
								)}
								<div className="border-2 border-black p-4 mt-2">
									<p className="text-xl font-black uppercase">Category Name</p>
									{section.settings.showDescription && (
										<p className="text-xs opacity-70 mt-2">Category description preview text.</p>
									)}
									{section.settings.showImage && (
										<div className="mt-3 h-20 border-2 border-black bg-neutral-200" />
									)}
								</div>
								{section.settings.showSubcategories && (
									<div className="mt-2 flex gap-2">
										<span className="px-2 py-1 border-2 border-black text-[10px] uppercase">Sub A</span>
										<span className="px-2 py-1 border-2 border-black text-[10px] uppercase">Sub B</span>
									</div>
								)}
								<div className="mt-2 text-xs font-mono opacity-40 select-none">[CATEGORY HEADER]</div>
							</div>
						);
					}

					if (section.type === "checkoutSummary") {
						return (
							<div
								key={section.id}
								role="button"
								tabIndex={0}
								onClick={() => onSectionClick(section.id)}
								onKeyDown={(event) => event.key === "Enter" && onSectionClick(section.id)}
								className={cn(
									"p-4 cursor-pointer hover:opacity-80 transition-opacity border-l-4",
									isFocused ? "border-l-red-500" : "border-l-transparent",
								)}
							>
								<h3 className="font-black text-lg uppercase mb-1">{section.settings.title}</h3>
								<p className="text-xs mb-2 opacity-70">{section.settings.description}</p>
								<div className="grid grid-cols-2 gap-2">
									<div className="border-2 border-black p-2 text-[10px] uppercase font-mono">Articles: 3</div>
									<div className="border-2 border-black p-2 text-[10px] uppercase font-mono">
										Sous-total: 89 700 XOF
									</div>
								</div>
								<div className="mt-2 text-xs font-mono opacity-40 select-none">[CHECKOUT SUMMARY]</div>
							</div>
						);
					}

					if (section.type === "checkoutForm") {
						return (
							<div
								key={section.id}
								role="button"
								tabIndex={0}
								onClick={() => onSectionClick(section.id)}
								onKeyDown={(event) => event.key === "Enter" && onSectionClick(section.id)}
								className={cn(
									"p-4 cursor-pointer hover:opacity-80 transition-opacity border-l-4",
									isFocused ? "border-l-red-500" : "border-l-transparent",
								)}
							>
								<h3 className="font-black text-lg uppercase mb-1">{section.settings.title}</h3>
								<div className="grid gap-2 sm:grid-cols-2">
									<div className="border-2 border-black p-2 text-[10px] uppercase font-mono">
										Infos client
									</div>
									<div className="border-2 border-black p-2 text-[10px] uppercase font-mono">Livraison</div>
									<div className="border-2 border-black p-2 text-[10px] uppercase font-mono">Paiement</div>
									<div className="border-2 border-black p-2 text-[10px] uppercase font-mono">Validation</div>
								</div>
								<div className="mt-2 text-xs font-mono opacity-40 select-none">[CHECKOUT FORM]</div>
							</div>
						);
					}

					if (section.type !== "productGrid") {
						return null;
					}

					const sectionSettings = section.settings;
					const resolvedProducts = resolvePreviewProductsForGrid({
						collectionId: sectionSettings.collectionId,
						limit: sectionSettings.limit,
						previewProducts,
						collectionProductLinks,
					});
					const gridColumnsClass = previewViewport === "desktop" ? "grid-cols-3" : "grid-cols-2";

					return (
						<div
							key={section.id}
							role="button"
							tabIndex={0}
							onClick={() => onSectionClick(section.id)}
							onKeyDown={(event) => event.key === "Enter" && onSectionClick(section.id)}
							className={cn(
								"p-4 cursor-pointer hover:opacity-80 transition-opacity border-l-4",
								isFocused ? "border-l-red-500" : "border-l-transparent",
							)}
						>
							<h3 className="font-black text-lg uppercase mb-1">{sectionSettings.title}</h3>
							<p className="text-xs mb-3 opacity-60">{sectionSettings.description}</p>
							<div className={cn("grid gap-3", gridColumnsClass)}>
								{resolvedProducts.map((product) => {
									const previewImage = resolvePreviewImage(product);
									return (
										<div
											key={product.id}
											className="border-2 border-black p-2 bg-white"
											style={{
												borderWidth: "var(--store-card-border-width)",
												boxShadow: cssVars["--store-hard-shadow"],
											}}
										>
											<div className="relative aspect-square border-2 border-black bg-neutral-200 overflow-hidden">
												{previewImage ? (
													<YNSImage
														src={previewImage}
														alt={product.name}
														fill
														sizes="(max-width: 768px) 50vw, 33vw"
														className="absolute inset-0 h-full w-full object-cover"
													/>
												) : (
													<div className="h-full w-full flex items-center justify-center text-[10px] font-black uppercase text-black/50 p-2 text-center">
														{product.name}
													</div>
												)}
												{(product.badgeText || product.isMock) && (
													<span
														className="absolute left-1 top-1 px-1 py-0.5 text-[9px] font-black uppercase border border-black"
														style={{ background: product.badgeColor || "#ffffff", color: "#000000" }}
													>
														{product.isMock ? "MOCK" : product.badgeText}
													</span>
												)}
											</div>
											<div className="mt-2">
												<p className="text-[10px] font-black uppercase truncate">{product.name}</p>
												<p className="text-[10px] font-mono font-black tabular-nums">
													{resolvePreviewPrice(product)}
												</p>
											</div>
										</div>
									);
								})}
							</div>
							{sectionSettings.showViewAll && (
								<div className="mt-3 inline-flex border-2 border-black px-2 py-1 text-[10px] font-mono uppercase">
									Voir tout
								</div>
							)}
							<div className="mt-2 text-xs font-mono opacity-40 select-none">
								[PRODUCT GRID — cliquer pour éditer]
							</div>
						</div>
					);
				})}
			</div>

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

function createNewSection(sectionType: ThemeSectionType, sectionId: string): ThemeSectionInstance {
	return createDefaultSection(sectionType, sectionId);
}

type PreviewSurfaceMode = "studio" | "runtime";
type PreviewDataMode = "real" | "demo";
const PREVIEW_DATA_MODE_STORAGE_KEY = "yns.themeStudio.previewDataMode";

export function normalizeStorefrontBaseHref(href: string) {
	if (!href || href === "/") {
		return "";
	}

	return href.endsWith("/") ? href.slice(0, -1) : href;
}

export function buildRuntimeTemplatePath(
	templateKey: ThemeTemplateKey,
	fallbacks: {
		productSlug: string | null;
		collectionSlug: string | null;
		categorySlug: string | null;
	},
) {
	if (templateKey === "product") {
		return fallbacks.productSlug ? `/product/${fallbacks.productSlug}` : "/";
	}

	if (templateKey === "collection") {
		return fallbacks.collectionSlug ? `/collection/${fallbacks.collectionSlug}` : "/";
	}

	if (templateKey === "category") {
		return fallbacks.categorySlug ? `/category/${fallbacks.categorySlug}` : "/";
	}

	if (templateKey === "checkout") {
		return "/checkout";
	}

	return "/";
}

export function ThemeStudio({
	initialData,
	collectionOptions,
	categoryOptions,
	previewProducts,
	collectionProductLinks,
	storefrontHref,
}: ThemeStudioProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [themeData, setThemeData] = useState<ThemeBuilderData>(initialData);
	const [styleTokens, setStyleTokens] = useState<ThemeStyleTokens>(initialData.draft.styleTokens);
	const [contentModel, setContentModel] = useState<ThemeContentModel>(initialData.draft.contentModel);
	const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);
	const [previewViewport, setPreviewViewport] = useState<PreviewViewportMode>("desktop");
	const [previewSurface, setPreviewSurface] = useState<PreviewSurfaceMode>("studio");
	const [previewDataMode, setPreviewDataMode] = useState<PreviewDataMode>("real");
	const [activeTemplate, setActiveTemplate] = useState<ThemeTemplateKey>("home");
	const [isAdvancedTemplates, setIsAdvancedTemplates] = useState(false);
	const previewContainerRef = useRef<HTMLDivElement>(null);
	const [previewContainerWidth, setPreviewContainerWidth] = useState(0);
	const demoCatalog = useMemo(() => buildDemoCatalog(), []);

	const previewCssVars = useMemo(() => toStorefrontCssVariables(styleTokens), [styleTokens]);
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);
	const previewViewportSpec = useMemo(() => getViewportSpec(previewViewport), [previewViewport]);
	const previewScale = useMemo(
		() => computeScale(previewContainerWidth, previewViewportSpec.width),
		[previewContainerWidth, previewViewportSpec.width],
	);
	const scaledPreviewWidth = Math.max(1, Math.floor(previewViewportSpec.width * previewScale));

	const visibleTemplateKeys = useMemo(
		() => getVisibleTemplateKeys(isAdvancedTemplates),
		[isAdvancedTemplates],
	);
	const usesDemoDataset = previewDataMode === "demo";
	const effectiveCollectionOptions = usesDemoDataset ? demoCatalog.collections : collectionOptions;
	const effectiveCategoryOptions = usesDemoDataset ? demoCatalog.categories : categoryOptions;
	const effectivePreviewProducts =
		usesDemoDataset && previewSurface === "studio" ? demoCatalog.products : previewProducts;
	const effectiveCollectionProductLinks =
		usesDemoDataset && previewSurface === "studio" ? demoCatalog.collectionLinks : collectionProductLinks;
	const previewCatalogStatsLabel = `${effectivePreviewProducts.length} products / ${effectiveCollectionOptions.length} collections / ${effectiveCategoryOptions.length} categories`;
	const activeTemplateData = contentModel.templates[activeTemplate];
	const allowedSectionTypes = useMemo(() => getAllowedSectionTypes(activeTemplate), [activeTemplate]);
	const runtimePreviewHref = useMemo(() => {
		const baseHref = normalizeStorefrontBaseHref(storefrontHref);
		const routePath = buildRuntimeTemplatePath(activeTemplate, {
			productSlug: previewProducts[0]?.slug || null,
			collectionSlug: collectionOptions[0]?.slug || null,
			categorySlug: categoryOptions[0]?.slug || null,
		});

		if (!baseHref) {
			return routePath;
		}

		if (routePath === "/") {
			return baseHref;
		}

		return `${baseHref}${routePath}`;
	}, [activeTemplate, categoryOptions, collectionOptions, previewProducts, storefrontHref]);

	useEffect(() => {
		const node = previewContainerRef.current;
		if (!node) return;

		const updateWidth = () => setPreviewContainerWidth(node.clientWidth);
		updateWidth();

		const observer = new ResizeObserver((entries) => {
			const [entry] = entries;
			if (!entry) return;
			setPreviewContainerWidth(entry.contentRect.width);
		});

		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		try {
			const savedValue = window.localStorage.getItem(PREVIEW_DATA_MODE_STORAGE_KEY);
			if (savedValue === "demo" || savedValue === "real") {
				setPreviewDataMode(savedValue);
			}
		} catch {
			// Ignore localStorage access errors in strict browser privacy contexts.
		}
	}, []);

	useEffect(() => {
		try {
			window.localStorage.setItem(PREVIEW_DATA_MODE_STORAGE_KEY, previewDataMode);
		} catch {
			// Ignore localStorage access errors in strict browser privacy contexts.
		}
	}, [previewDataMode]);

	useEffect(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, []);

	function updateToken<Key extends keyof ThemeStyleTokens>(key: Key, value: ThemeStyleTokens[Key]) {
		setStyleTokens((previous) => ({ ...previous, [key]: value }));
	}

	function applyPreset(preset: ColorPreset) {
		setStyleTokens((previous) => ({
			...previous,
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

	function updateSection(sectionId: string, updated: ThemeSectionInstance) {
		setContentModel((previous) => updateSectionInTemplate(previous, activeTemplate, sectionId, updated));
	}

	function removeSection(sectionId: string) {
		const section = activeTemplateData.sections[sectionId];
		if (!section) return;

		const canRemove = canRemoveSection(activeTemplateData, activeTemplate, sectionId, section);
		if (!canRemove) {
			toast.error("Cette section est obligatoire pour ce template.");
			return;
		}

		setContentModel((previous) => removeSectionFromTemplate(previous, activeTemplate, sectionId));
		if (focusedSectionId === sectionId) {
			setFocusedSectionId(null);
		}
	}

	function toggleSectionDisabled(sectionId: string) {
		const section = activeTemplateData.sections[sectionId];
		if (!section) return;
		updateSection(sectionId, { ...section, disabled: !section.disabled });
	}

	function addSection(sectionType: ThemeSectionType) {
		if (!allowedSectionTypes.includes(sectionType)) {
			return;
		}

		const sectionId = `${sectionType}_${Date.now()}`;
		const section = createNewSection(sectionType, sectionId);
		setContentModel((previous) => addSectionToTemplate(previous, activeTemplate, section));
		setFocusedSectionId(sectionId);
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		setContentModel((previous) =>
			reorderSectionsInTemplate(previous, activeTemplate, String(active.id), String(over.id)),
		);
	}

	function toggleAdvancedMode() {
		setIsAdvancedTemplates((previous) => {
			const next = !previous;
			if (!next) {
				setActiveTemplate("home");
				setFocusedSectionId(null);
			}
			return next;
		});
	}

	async function syncThemeData() {
		const [syncError, syncResult] = await safe(getThemeBuilderDataAction());
		if (syncError || !syncResult) {
			return false;
		}

		setThemeData(syncResult);
		setStyleTokens(syncResult.draft.styleTokens);
		setContentModel(syncResult.draft.contentModel);
		setFocusedSectionId(null);
		return true;
	}

	function validateNoDemoReferencesBeforePersist() {
		const demoReferences = findDemoProductGridReferences(contentModel);
		if (demoReferences.length === 0) {
			return true;
		}

		const firstReference = demoReferences[0];
		const location = firstReference
			? `${firstReference.templateKey} / ${firstReference.sectionId}`
			: "theme content";
		toast.error(
			`Sauvegarde/publication bloquee: reference fictive detectee (${location}). Supprimez les IDs demo_ ou repassez en mode REAL.`,
		);
		return false;
	}

	function handleSave() {
		startTransition(async () => {
			if (!validateNoDemoReferencesBeforePersist()) {
				return;
			}

			const [saveError, saveResult] = await safe(updateThemeDraftAction({ styleTokens, contentModel }));
			if (saveError || !saveResult?.success) {
				toast.error("Erreur lors de la sauvegarde.");
				return;
			}

			const synced = await syncThemeData();
			if (!synced) {
				toast.error("Brouillon sauvegardé, mais impossible de rafraîchir les données.");
				return;
			}

			toast.success("Brouillon sauvegardé.");
		});
	}

	function handlePublish() {
		startTransition(async () => {
			if (!validateNoDemoReferencesBeforePersist()) {
				return;
			}

			const [updateError, updateResult] = await safe(updateThemeDraftAction({ styleTokens, contentModel }));
			if (updateError || !updateResult?.success) {
				toast.error("Erreur lors de la préparation de la publication.");
				return;
			}

			const [publishError, publishResult] = await safe(publishThemeDraftAction());
			if (publishError || !publishResult?.success) {
				const errorMessage =
					publishError instanceof Error && publishError.message.trim().length > 0
						? publishError.message
						: "Erreur lors de la publication.";
				toast.error(errorMessage);
				return;
			}

			const synced = await syncThemeData();
			if (!synced) {
				toast.error("Thème publié, mais impossible de rafraîchir les données.");
				return;
			}

			toast.success("Thème publié avec succès.");
		});
	}

	function handleRollback(versionId: string) {
		startTransition(async () => {
			const [rollbackError, rollbackResult] = await safe(rollbackThemeAction(versionId));
			if (rollbackError || !rollbackResult?.success) {
				toast.error("Erreur pendant la restauration.");
				return;
			}

			const synced = await syncThemeData();
			if (!synced) {
				toast.error("Version restaurée, mais impossible de rafraîchir les données.");
				return;
			}

			toast.success("Version restaurée.");
		});
	}

	function handleResetDraft() {
		startTransition(async () => {
			const [resetError, resetResult] = await safe(createDraftFromPublishedAction());
			if (resetError || !resetResult?.success) {
				toast.error("Impossible de réinitialiser le brouillon.");
				return;
			}

			const synced = await syncThemeData();
			if (!synced) {
				toast.error("Brouillon réinitialisé, mais impossible de rafraîchir les données.");
				return;
			}

			toast.success("Brouillon réinitialisé depuis la version LIVE.");
		});
	}

	function handleSectionClickInPreview(sectionId: string) {
		setFocusedSectionId(sectionId);
	}

	function handleSeedStoreDemoData() {
		startTransition(async () => {
			const [seedError, seedResult] = await safe(seedStoreDemoDataAction());
			if (seedError || !seedResult?.success) {
				const message =
					seedError instanceof Error && seedError.message.trim().length > 0
						? seedError.message
						: "Erreur pendant le seed.";
				toast.error(message);
				return;
			}

			if (!seedResult.seeded) {
				toast.error(`Seed refuse: boutique non vide (${JSON.stringify(seedResult.footprint)}).`);
				return;
			}

			toast.success("Seed boutique termine. Donnees reelles rechargees.");
			router.refresh();
		});
	}

	return (
		<div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white">
			<div className="flex items-center justify-between px-4 py-2 border-b-2 border-black bg-white shrink-0 gap-2">
				<div className="flex items-center gap-3 min-w-0">
					<Link
						href="/manage/themes"
						className="flex items-center gap-1 border-2 border-black px-3 h-9 font-mono font-bold text-xs uppercase hover:bg-black hover:text-white transition-all"
					>
						<ArrowLeft size={14} />
						Retour
					</Link>
					<span className="font-black text-sm uppercase tracking-widest">THEME STUDIO</span>
					<Badge className="bg-yellow-400 text-black border-2 border-black font-mono text-xs">
						DRAFT v{themeData.draft.versionNumber}
					</Badge>
					<Badge className="bg-green-400 text-black border-2 border-black font-mono text-xs">
						LIVE v{themeData.published.versionNumber}
					</Badge>
					{previewDataMode === "demo" && (
						<Badge className="bg-blue-500 text-white border-2 border-black font-mono text-xs uppercase">
							Demo Data Active
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						variant="outline"
						onClick={handleSeedStoreDemoData}
						disabled={isPending}
						className="border-2 border-black font-mono text-xs uppercase h-8"
					>
						Seeder boutique vide
					</Button>
					<div className="flex items-center border-2 border-black h-8">
						<button
							type="button"
							onClick={() => setPreviewDataMode("real")}
							className={cn(
								"h-full px-2 font-mono text-[10px] font-bold uppercase border-r-2 border-black",
								previewDataMode === "real" ? "bg-black text-white" : "bg-white text-black",
							)}
						>
							Mode: Real
						</button>
						<button
							type="button"
							onClick={() => setPreviewDataMode("demo")}
							className={cn(
								"h-full px-2 font-mono text-[10px] font-bold uppercase",
								previewDataMode === "demo" ? "bg-black text-white" : "bg-white text-black",
							)}
						>
							Mode: Demo
						</button>
					</div>
					<Button
						size="sm"
						variant="outline"
						asChild
						className="border-2 border-black font-mono text-xs uppercase h-8"
					>
						<Link href={storefrontHref} target="_blank" rel="noreferrer">
							<ExternalLink size={12} className="mr-1" />
							Voir Boutique
						</Link>
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={handleResetDraft}
						disabled={isPending}
						className="border-2 border-black font-mono text-xs uppercase h-8"
					>
						<RotateCcw size={12} className="mr-1" />
						Reset Draft
					</Button>
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

			<div className="flex flex-1 overflow-hidden">
				<div className="w-80 shrink-0 border-r-2 border-black overflow-y-auto bg-gray-50 flex flex-col">
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
									<ColorSelect value={styleTokens[key]} onChange={(value) => updateToken(key, value)} />
								</div>
							))}
							<div className="flex items-center gap-2">
								<Label className="font-mono text-xs uppercase w-24 shrink-0">Border W.</Label>
								<Select
									value={String(styleTokens.borderWidth)}
									onValueChange={(value) => updateToken("borderWidth", Number(value) as 2 | 4)}
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
								<Label className="font-mono text-xs uppercase w-24 shrink-0">Card W.</Label>
								<Select
									value={String(styleTokens.cardBorderWidth)}
									onValueChange={(value) => updateToken("cardBorderWidth", Number(value) as 2 | 4)}
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
								<Label className="font-mono text-xs uppercase w-24 shrink-0">Button W.</Label>
								<Select
									value={String(styleTokens.buttonBorderWidth)}
									onValueChange={(value) => updateToken("buttonBorderWidth", Number(value) as 2 | 4)}
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
									onValueChange={(value) => updateToken("hardShadow", value as "sm" | "lg")}
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

					<Panel title="▼ TEMPLATES">
						<div className="p-3 space-y-3">
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={toggleAdvancedMode}
								className={cn(
									"w-full h-8 border-2 border-black font-mono text-[10px] uppercase",
									isAdvancedTemplates ? "bg-black text-white" : "bg-white text-black",
								)}
							>
								Mode avancé: {isAdvancedTemplates ? "ON" : "OFF"}
							</Button>
							<div className="grid grid-cols-2 gap-2">
								{THEME_TEMPLATE_OPTIONS.filter((option) => visibleTemplateKeys.includes(option.key)).map(
									(option) => (
										<button
											key={option.key}
											type="button"
											onClick={() => {
												setActiveTemplate(option.key);
												setFocusedSectionId(null);
											}}
											className={cn(
												"h-8 border-2 border-black font-mono text-[10px] uppercase",
												activeTemplate === option.key
													? "bg-black text-white"
													: "bg-white text-black hover:bg-black hover:text-white",
											)}
										>
											{option.label}
										</button>
									),
								)}
							</div>
						</div>
					</Panel>

					<Panel title="▼ SECTIONS">
						<div className="p-3 space-y-2">
							<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
								<SortableContext items={activeTemplateData.order} strategy={verticalListSortingStrategy}>
									{activeTemplateData.order.map((sectionId) => {
										const section = activeTemplateData.sections[sectionId];
										if (!section) return null;

										return (
											<SortableSectionItem
												key={sectionId}
												section={section}
												isFocused={focusedSectionId === sectionId}
												onFocus={() => setFocusedSectionId(focusedSectionId === sectionId ? null : sectionId)}
												onRemove={() => removeSection(sectionId)}
												canRemove={canRemoveSection(activeTemplateData, activeTemplate, sectionId, section)}
												onToggleDisabled={() => toggleSectionDisabled(sectionId)}
											>
												{section.type === "hero" && (
													<HeroEditor
														settings={section as ThemeSectionInstance & { type: "hero" }}
														onChange={(updated) => updateSection(sectionId, updated)}
													/>
												)}
												{section.type === "productGrid" && (
													<ProductGridEditor
														settings={section as ThemeSectionInstance & { type: "productGrid" }}
														onChange={(updated) => updateSection(sectionId, updated)}
														collectionOptions={effectiveCollectionOptions}
													/>
												)}
												{section.type === "productDetails" && (
													<ProductDetailsEditor
														settings={section as ThemeSectionInstance & { type: "productDetails" }}
														onChange={(updated) => updateSection(sectionId, updated)}
													/>
												)}
												{section.type === "collectionHeader" && (
													<CollectionHeaderEditor
														settings={section as ThemeSectionInstance & { type: "collectionHeader" }}
														onChange={(updated) => updateSection(sectionId, updated)}
													/>
												)}
												{section.type === "categoryHeader" && (
													<CategoryHeaderEditor
														settings={section as ThemeSectionInstance & { type: "categoryHeader" }}
														onChange={(updated) => updateSection(sectionId, updated)}
													/>
												)}
												{section.type === "checkoutSummary" && (
													<CheckoutSummaryEditor
														settings={section as ThemeSectionInstance & { type: "checkoutSummary" }}
														onChange={(updated) => updateSection(sectionId, updated)}
													/>
												)}
												{section.type === "checkoutForm" && (
													<CheckoutFormEditor
														settings={section as ThemeSectionInstance & { type: "checkoutForm" }}
														onChange={(updated) => updateSection(sectionId, updated)}
													/>
												)}
											</SortableSectionItem>
										);
									})}
								</SortableContext>
							</DndContext>

							{activeTemplateData.order.length === 0 && (
								<div className="border-2 border-black p-2 text-xs font-mono uppercase text-gray-500">
									Aucune section sur ce template.
								</div>
							)}

							<div className="grid grid-cols-1 gap-2 pt-1">
								{allowedSectionTypes.map((sectionType) => (
									<Button
										key={sectionType}
										size="sm"
										variant="outline"
										onClick={() => addSection(sectionType)}
										className="border-2 border-black font-mono text-xs uppercase h-8"
									>
										<Plus size={12} className="mr-1" /> {SECTION_TYPE_LABELS[sectionType]}
									</Button>
								))}
							</div>
						</div>
					</Panel>

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
										onChange={(event) =>
											setContentModel((previous) => ({
												...previous,
												globals: { ...previous.globals, [key]: event.target.value },
											}))
										}
										className="h-8 border-2 border-black font-mono text-xs"
									/>
								</div>
							))}
						</div>
					</Panel>

					<Panel title="▼ HISTORIQUE" defaultOpen={false}>
						<div className="p-3 space-y-2">
							{themeData.history.length === 0 && (
								<p className="text-xs font-mono text-gray-500">Aucun historique</p>
							)}
							{themeData.history.map((version) => {
								const isLive = version.id === themeData.published.id;
								const canRestore = canRestorePublishedVersion(version.id, themeData.published.id);

								return (
									<div
										key={version.id}
										className="flex items-center justify-between border-2 border-black p-2"
									>
										<div>
											<span className="font-mono text-xs font-bold">v{version.versionNumber}</span>
											{isLive && (
												<Badge className="ml-2 bg-green-400 text-black border border-black text-xs">
													LIVE
												</Badge>
											)}
											{version.publishedAt && (
												<p className="text-xs text-gray-500 font-mono">
													{new Date(version.publishedAt).toLocaleDateString()}
												</p>
											)}
										</div>
										{canRestore && (
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleRollback(version.id)}
												disabled={isPending}
												className="border-2 border-black font-mono text-xs uppercase h-7"
											>
												<RotateCcw size={10} className="mr-1" />
												Restaurer
											</Button>
										)}
									</div>
								);
							})}
						</div>
					</Panel>
				</div>

				<div className="flex-1 flex flex-col overflow-hidden bg-gray-200">
					<div className="flex items-center justify-end gap-2 px-4 py-2 border-b-2 border-black bg-white shrink-0">
						<span className="font-mono text-xs text-gray-500 mr-auto uppercase tracking-widest">
							Preview ({activeTemplate}) · data {previewDataMode.toUpperCase()}
						</span>
						{previewSurface === "studio" && (
							<span className="font-mono text-[10px] text-black/60 uppercase">
								{previewCatalogStatsLabel}
							</span>
						)}
						<Button
							size="sm"
							variant={previewSurface === "studio" ? "default" : "outline"}
							onClick={() => setPreviewSurface("studio")}
							className={cn(
								"h-7 border-2 border-black font-mono text-xs",
								previewSurface === "studio" ? "bg-black text-white" : "bg-white text-black",
							)}
						>
							Studio
						</Button>
						<Button
							size="sm"
							variant={previewSurface === "runtime" ? "default" : "outline"}
							onClick={() => setPreviewSurface("runtime")}
							className={cn(
								"h-7 border-2 border-black font-mono text-xs",
								previewSurface === "runtime" ? "bg-black text-white" : "bg-white text-black",
							)}
						>
							Runtime LIVE
						</Button>
						<Button
							size="sm"
							variant={previewViewport === "desktop" ? "default" : "outline"}
							onClick={() => setPreviewViewport("desktop")}
							disabled={previewSurface === "runtime"}
							className={cn(
								"h-7 border-2 border-black font-mono text-xs",
								previewViewport === "desktop"
									? "bg-black text-white"
									: "bg-white text-black disabled:opacity-40",
							)}
						>
							<Monitor size={12} className="mr-1" />
							Desktop
						</Button>
						<Button
							size="sm"
							variant={previewViewport === "tablet" ? "default" : "outline"}
							onClick={() => setPreviewViewport("tablet")}
							disabled={previewSurface === "runtime"}
							className={cn(
								"h-7 border-2 border-black font-mono text-xs",
								previewViewport === "tablet"
									? "bg-black text-white"
									: "bg-white text-black disabled:opacity-40",
							)}
						>
							<Tablet size={12} className="mr-1" />
							Tablet
						</Button>
						<Button
							size="sm"
							variant={previewViewport === "mobile" ? "default" : "outline"}
							onClick={() => setPreviewViewport("mobile")}
							disabled={previewSurface === "runtime"}
							className={cn(
								"h-7 border-2 border-black font-mono text-xs",
								previewViewport === "mobile"
									? "bg-black text-white"
									: "bg-white text-black disabled:opacity-40",
							)}
						>
							<Smartphone size={12} className="mr-1" />
							Mobile
						</Button>
					</div>

					<div ref={previewContainerRef} className="flex-1 overflow-auto p-4">
						{previewSurface === "studio" ? (
							<div className="mx-auto transition-none" style={{ width: `${scaledPreviewWidth}px` }}>
								<div
									style={{
										width: `${previewViewportSpec.width}px`,
										transform: `scale(${previewScale})`,
										transformOrigin: "top left",
									}}
								>
									<MockPreview
										cssVars={previewCssVars}
										globals={contentModel.globals}
										template={activeTemplateData}
										templateKey={activeTemplate}
										previewViewport={previewViewport}
										previewProducts={effectivePreviewProducts}
										collectionProductLinks={effectiveCollectionProductLinks}
										onSectionClick={handleSectionClickInPreview}
										focusedSectionId={focusedSectionId}
									/>
								</div>
							</div>
						) : (
							<div className="h-full flex flex-col gap-3">
								<p className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/70">
									Runtime preview (version LIVE actuelle): {runtimePreviewHref}
								</p>
								<div className="flex-1 min-h-[640px] border-4 border-black bg-white">
									<iframe
										title="Storefront Runtime Preview"
										src={runtimePreviewHref}
										className="h-full w-full border-0"
									/>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
