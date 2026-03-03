"use client";

import { type ReactNode, useId, useMemo } from "react";
import { ThemeRichTextField } from "@/app/(manage)/manage/settings/theme/theme-rich-text-field";
import { SingleMediaUpload } from "@/components/single-media-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ThemeSectionInstance } from "@/lib/theme-types";
import { cn } from "@/lib/utils";

export interface ThemeLinkSuggestion {
	href: string;
	label: string;
	quick?: boolean;
}

interface ImageWithTextEditorProps {
	settings: ThemeSectionInstance & { type: "imageWithText" };
	onChange: (updated: ThemeSectionInstance) => void;
	linkSuggestions: ThemeLinkSuggestion[];
}

// ── Shared sub-components ────────────────────────────────────────────────────

function EditorCard({
	title,
	children,
	className,
}: {
	title: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("min-w-0 space-y-3 border-2 border-black p-3", className)}>
			<p className="font-mono text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
			{children}
		</div>
	);
}

function ToggleField<T extends string>({
	label,
	value,
	onChange,
	options,
	ariaLabel,
	disabled,
}: {
	label: string;
	value: T;
	onChange: (value: T) => void;
	options: ReadonlyArray<{ value: T; label: string }>;
	ariaLabel: string;
	disabled?: boolean;
}) {
	const gridColumnsClass =
		options.length === 2
			? "grid-cols-2"
			: options.length === 3
				? "grid-cols-3"
				: "grid-cols-2 md:grid-cols-4";

	return (
		<div className="min-w-0 space-y-2">
			<Label className="font-mono text-xs uppercase">{label}</Label>
			<ToggleGroup
				type="single"
				value={value}
				onValueChange={(nextValue) => {
					if (nextValue) onChange(nextValue as T);
				}}
				disabled={disabled}
				className={cn("grid w-full min-w-0 gap-2", gridColumnsClass)}
				aria-label={ariaLabel}
			>
				{options.map((option) => (
					<ToggleGroupItem
						key={option.value}
						value={option.value}
						variant="outline"
						size="sm"
						className={cn(
							"h-8 min-w-0 rounded-none border-2 border-black bg-white px-2 font-mono text-[10px] uppercase",
							"data-[state=on]:bg-black data-[state=on]:text-white",
							"hover:bg-black hover:text-white",
						)}
					>
						<span className="truncate">{option.label}</span>
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</div>
	);
}

function SwitchRow({
	label,
	checked,
	disabled,
	onCheckedChange,
}: {
	label: string;
	checked: boolean;
	disabled?: boolean;
	onCheckedChange: (checked: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between border-2 border-black px-3 py-2">
			<Label className="font-mono text-xs uppercase">{label}</Label>
			<Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
		</div>
	);
}

function ThemeLinkInput({
	label,
	value,
	onChange,
	suggestions,
	placeholder,
	inputAriaLabel,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	suggestions: ThemeLinkSuggestion[];
	placeholder: string;
	inputAriaLabel?: string;
}) {
	const datalistId = useId();
	const quickSuggestions = useMemo(
		() => suggestions.filter((suggestion) => suggestion.quick).slice(0, 6),
		[suggestions],
	);

	return (
		<div className="min-w-0 space-y-2">
			<Label className="font-mono text-xs uppercase">{label}</Label>
			<Input
				value={value}
				onChange={(event) => onChange(event.target.value)}
				list={datalistId}
				placeholder={placeholder}
				aria-label={inputAriaLabel}
				className="h-8 w-full min-w-0 border-2 border-black font-mono text-xs"
				spellCheck={false}
				autoCapitalize="none"
				autoCorrect="off"
			/>
			<datalist id={datalistId}>
				{suggestions.map((suggestion) => (
					<option key={suggestion.href} value={suggestion.href}>
						{suggestion.label}
					</option>
				))}
			</datalist>
			<div className="flex min-w-0 flex-wrap gap-1">
				{quickSuggestions.map((suggestion) => (
					<Button
						key={suggestion.href}
						type="button"
						size="sm"
						variant="outline"
						onClick={() => onChange(suggestion.href)}
						className={cn(
							"h-6 max-w-full truncate rounded-none border-2 border-black px-2 font-mono text-[10px] uppercase",
							value === suggestion.href
								? "bg-black text-white"
								: "bg-white text-black hover:bg-black hover:text-white",
						)}
					>
						{suggestion.label}
					</Button>
				))}
			</div>
		</div>
	);
}

function CtaFields({
	title,
	labelValue,
	hrefValue,
	onLabelChange,
	onHrefChange,
	linkSuggestions,
	labelAriaLabel,
	hrefAriaLabel,
	hrefPlaceholder,
}: {
	title: string;
	labelValue: string;
	hrefValue: string;
	onLabelChange: (value: string) => void;
	onHrefChange: (value: string) => void;
	linkSuggestions: ThemeLinkSuggestion[];
	labelAriaLabel: string;
	hrefAriaLabel: string;
	hrefPlaceholder: string;
}) {
	return (
		<div className="min-w-0 space-y-3 border-2 border-black p-3">
			<p className="font-mono text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
			<div>
				<Label className="font-mono text-xs uppercase">Label</Label>
				<Input
					value={labelValue}
					onChange={(event) => onLabelChange(event.target.value)}
					aria-label={labelAriaLabel}
					className="h-8 w-full min-w-0 border-2 border-black font-mono text-xs"
				/>
			</div>
			<ThemeLinkInput
				label="Lien"
				value={hrefValue}
				onChange={onHrefChange}
				suggestions={linkSuggestions}
				placeholder={hrefPlaceholder}
				inputAriaLabel={hrefAriaLabel}
			/>
		</div>
	);
}

// ── Main editor ──────────────────────────────────────────────────────────────

export function ImageWithTextEditor({ settings, onChange, linkSuggestions }: ImageWithTextEditorProps) {
	const s = settings.settings;
	const update = (key: string, value: unknown) => onChange({ ...settings, settings: { ...s, [key]: value } });
	const isSplit = s.layoutVariant === "split";

	return (
		<div className="min-w-0 space-y-4">
			{/* ── Contenu ───────────────────────────────────── */}
			<EditorCard title="Contenu">
				<div>
					<Label className="font-mono text-xs uppercase">Eyebrow</Label>
					<Input
						value={s.eyebrow || ""}
						onChange={(event) => update("eyebrow", event.target.value)}
						placeholder="A propos"
						aria-label="Image Text Eyebrow"
						className="h-8 w-full min-w-0 border-2 border-black font-mono text-xs"
					/>
				</div>
				<div>
					<Label className="font-mono text-xs uppercase">Titre</Label>
					<Input
						value={s.title}
						onChange={(event) => update("title", event.target.value)}
						placeholder="Titre de section"
						aria-label="Image Text Title"
						className="h-8 w-full min-w-0 border-2 border-black font-mono text-xs"
					/>
				</div>
				<ThemeRichTextField
					label="Corps"
					value={s.bodyHtml || "<p></p>"}
					onChange={(value) => update("bodyHtml", value)}
				/>
			</EditorCard>

			{/* ── Actions (CTAs) ────────────────────────────── */}
			<EditorCard title="Actions">
				<p className="font-mono text-[10px] uppercase text-black/70">
					Le bouton s'affiche uniquement si le label et le lien sont tous les deux remplis.
				</p>
				<div className="grid min-w-0 gap-3 md:grid-cols-2">
					<CtaFields
						title="CTA principal"
						labelValue={s.primaryButtonLabel}
						hrefValue={s.primaryButtonHref}
						onLabelChange={(v) => update("primaryButtonLabel", v)}
						onHrefChange={(v) => update("primaryButtonHref", v)}
						linkSuggestions={linkSuggestions}
						labelAriaLabel="Image Text Primary CTA Label"
						hrefAriaLabel="Image Text Primary CTA URL"
						hrefPlaceholder="/product/slug"
					/>
					<CtaFields
						title="CTA secondaire"
						labelValue={s.secondaryButtonLabel}
						hrefValue={s.secondaryButtonHref}
						onLabelChange={(v) => update("secondaryButtonLabel", v)}
						onHrefChange={(v) => update("secondaryButtonHref", v)}
						linkSuggestions={linkSuggestions}
						labelAriaLabel="Image Text Secondary CTA Label"
						hrefAriaLabel="Image Text Secondary CTA URL"
						hrefPlaceholder="/collections"
					/>
				</div>
			</EditorCard>

			{/* ── Media ─────────────────────────────────────── */}
			<EditorCard title="Media">
				<div className="grid min-w-0 gap-3 md:grid-cols-2">
					<ToggleField
						label="Type"
						value={s.mediaKind}
						onChange={(value) => update("mediaKind", value)}
						ariaLabel="Image Text Media Type"
						options={[
							{ value: "image", label: "Image" },
							{ value: "video", label: "Video" },
						]}
					/>
					<ToggleField
						label="Ratio"
						value={s.mediaAspectRatio}
						onChange={(value) => update("mediaAspectRatio", value)}
						ariaLabel="Image Text Media Ratio"
						options={[
							{ value: "square", label: "Carre" },
							{ value: "landscape", label: "Paysage" },
							{ value: "portrait", label: "Portrait" },
							{ value: "video", label: "16:9" },
						]}
					/>
				</div>

				{s.mediaKind === "image" ? (
					<SingleMediaUpload
						value={s.image || ""}
						onChange={(value) => update("image", value.trim() === "" ? null : value)}
						mediaType="image"
						aspectRatio={s.mediaAspectRatio}
					/>
				) : (
					<div className="min-w-0 space-y-3">
						<SingleMediaUpload
							value={s.videoUrl || ""}
							onChange={(value) => update("videoUrl", value.trim() === "" ? null : value)}
							mediaType="video"
							posterValue={s.videoPoster || ""}
							onPosterChange={(value) => update("videoPoster", value.trim() === "" ? null : value)}
							aspectRatio={s.mediaAspectRatio}
						/>
						<div className="grid min-w-0 gap-3 md:grid-cols-2">
							<SwitchRow
								label="Autoplay"
								checked={s.videoAutoplay}
								onCheckedChange={(checked) => {
									update("videoAutoplay", checked);
									if (checked) update("videoMuted", true);
								}}
							/>
							<SwitchRow
								label="Muet"
								checked={s.videoMuted}
								disabled={s.videoAutoplay}
								onCheckedChange={(checked) => update("videoMuted", checked)}
							/>
							<SwitchRow
								label="Boucle"
								checked={s.videoLoop}
								onCheckedChange={(checked) => update("videoLoop", checked)}
							/>
							<SwitchRow
								label="Controles"
								checked={s.videoControls}
								onCheckedChange={(checked) => update("videoControls", checked)}
							/>
						</div>
					</div>
				)}
			</EditorCard>

			{/* ── Mise en page ──────────────────────────────── */}
			<EditorCard title="Mise en page">
				<div className="grid min-w-0 gap-3 md:grid-cols-2">
					<ToggleField
						label="Disposition"
						value={s.layoutVariant}
						onChange={(value) => update("layoutVariant", value)}
						ariaLabel="Image Text Layout Variant"
						options={[
							{ value: "split", label: "Cote a cote" },
							{ value: "stacked", label: "Empile" },
						]}
					/>
					{isSplit && (
						<ToggleField
							label="Position media"
							value={s.mediaPosition}
							onChange={(value) => update("mediaPosition", value)}
							ariaLabel="Image Text Media Position"
							options={[
								{ value: "left", label: "Gauche" },
								{ value: "right", label: "Droite" },
							]}
						/>
					)}
					<ToggleField
						label="Largeur contenu"
						value={s.contentWidth}
						onChange={(value) => update("contentWidth", value)}
						ariaLabel="Image Text Content Width"
						options={[
							{ value: "sm", label: "Etroit" },
							{ value: "md", label: "Normal" },
							{ value: "lg", label: "Large" },
						]}
					/>
					{isSplit && (
						<ToggleField
							label="Alignement vertical"
							value={s.verticalAlign}
							onChange={(value) => update("verticalAlign", value)}
							ariaLabel="Image Text Vertical Align"
							options={[
								{ value: "top", label: "Haut" },
								{ value: "center", label: "Centre" },
								{ value: "bottom", label: "Bas" },
							]}
						/>
					)}
					<ToggleField
						label="Alignement texte"
						value={s.textAlign}
						onChange={(value) => update("textAlign", value)}
						ariaLabel="Image Text Text Align"
						options={[
							{ value: "left", label: "Gauche" },
							{ value: "center", label: "Centre" },
							{ value: "right", label: "Droite" },
						]}
					/>
				</div>
			</EditorCard>
		</div>
	);
}
