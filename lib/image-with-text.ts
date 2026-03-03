import type { ImageWithTextSectionSettings } from "@/lib/theme-types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function isFilled(value: string | null | undefined) {
	return typeof value === "string" && value.trim().length > 0;
}

function cls(...values: Array<string | false | null | undefined>) {
	return values.filter(Boolean).join(" ");
}

// ── Sanitization ─────────────────────────────────────────────────────────────

export function sanitizeImageWithTextHtml(rawHtml: string) {
	return rawHtml
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
		.replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
		.replace(/\s(href|src)\s*=\s*(['"])javascript:.*?\2/gi, "");
}

// ── Derived state ────────────────────────────────────────────────────────────

export function getImageWithTextDerivedState(settings: ImageWithTextSectionSettings) {
	const sanitizedBodyHtml = sanitizeImageWithTextHtml(settings.bodyHtml || "<p></p>").trim() || "<p></p>";
	const hasEyebrow = isFilled(settings.eyebrow);
	const hasPrimaryCta = isFilled(settings.primaryButtonLabel) && isFilled(settings.primaryButtonHref);
	const hasSecondaryCta = isFilled(settings.secondaryButtonLabel) && isFilled(settings.secondaryButtonHref);
	const hasImage = isFilled(settings.image);
	const hasVideo = isFilled(settings.videoUrl);

	return {
		sanitizedBodyHtml,
		hasEyebrow,
		hasPrimaryCta,
		hasSecondaryCta,
		hasVisibleCtas: hasPrimaryCta || hasSecondaryCta,
		hasImage,
		hasVideo,
	};
}

// ── Class maps ───────────────────────────────────────────────────────────────

export const IMAGE_WITH_TEXT_TEXT_ALIGN_CLASS = {
	left: "items-start text-left",
	center: "items-center text-center",
	right: "items-end text-right",
} as const;

export const IMAGE_WITH_TEXT_CONTENT_WIDTH_CLASS = {
	sm: "max-w-xl",
	md: "max-w-2xl",
	lg: "max-w-3xl",
} as const;

export const IMAGE_WITH_TEXT_MEDIA_ASPECT_CLASS = {
	square: "aspect-square",
	landscape: "aspect-[4/3]",
	portrait: "aspect-[3/4]",
	video: "aspect-video",
} as const;

export const IMAGE_WITH_TEXT_VERTICAL_ALIGN_CLASS = {
	top: "items-start",
	center: "items-center",
	bottom: "items-end",
} as const;

// ── Class generators ─────────────────────────────────────────────────────────

export function getImageWithTextRootClass(settings: ImageWithTextSectionSettings) {
	return cls(
		"gap-8 lg:gap-12",
		settings.layoutVariant === "split"
			? cls("grid grid-cols-1 lg:grid-cols-2", IMAGE_WITH_TEXT_VERTICAL_ALIGN_CLASS[settings.verticalAlign])
			: "flex flex-col",
	);
}

export function getImageWithTextMediaContainerClass(settings: ImageWithTextSectionSettings) {
	return cls(
		"relative w-full overflow-hidden border-2 border-black bg-neutral-100",
		IMAGE_WITH_TEXT_MEDIA_ASPECT_CLASS[settings.mediaAspectRatio],
		settings.layoutVariant === "split"
			? settings.mediaPosition === "left"
				? "lg:order-1"
				: "lg:order-2"
			: "order-1",
	);
}

export function getImageWithTextTextContainerClass(settings: ImageWithTextSectionSettings) {
	return cls(
		"flex w-full min-w-0 flex-col justify-center gap-4",
		IMAGE_WITH_TEXT_TEXT_ALIGN_CLASS[settings.textAlign],
		IMAGE_WITH_TEXT_CONTENT_WIDTH_CLASS[settings.contentWidth],
		settings.layoutVariant === "split"
			? settings.mediaPosition === "left"
				? "lg:order-2"
				: "lg:order-1"
			: "order-2 mx-auto",
	);
}

export function getImageWithTextEyebrowClass(isVisible: boolean) {
	return cls(
		"border-2 border-black bg-white px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.2em]",
		!isVisible && "hidden",
	);
}

export function getImageWithTextCtaClass(kind: "primary" | "secondary", isVisible: boolean) {
	return cls(
		"inline-flex h-11 items-center justify-center border-2 border-black px-8 font-black uppercase",
		kind === "primary"
			? "bg-black text-white hover:bg-white hover:text-black"
			: "bg-white text-black hover:bg-black hover:text-white",
		!isVisible && "hidden",
	);
}

export function getImageWithTextCtaContainerClass(isVisible: boolean) {
	return cls("flex flex-wrap gap-3", !isVisible && "hidden");
}

export function getImageWithTextMediaSurfaceClass(kind: "image" | "video", activeKind: "image" | "video") {
	return cls("absolute inset-0", kind !== activeKind && "hidden");
}

export function getImageWithTextMediaPlaceholderClass() {
	return "flex h-full w-full items-center justify-center text-center text-sm font-black uppercase text-black/30";
}
