import { z } from "zod";
import type {
	CategoryHeaderSectionSettings,
	CheckoutFormSectionSettings,
	CheckoutSummarySectionSettings,
	CollectionHeaderSectionSettings,
	HeroSectionSettings,
	ImageWithTextSectionSettings,
	LegacyThemeContentModel,
	NewsletterSectionSettings,
	ProductDetailsSectionSettings,
	ProductGridSectionSettings,
	RichTextSectionSettings,
	ThemeBlockInstance,
	ThemeContentModel,
	ThemeCustomColors,
	ThemeFontFamily,
	ThemeSectionInstance,
	ThemeSectionType,
	ThemeStyleTokens,
	ThemeTemplate,
	ThemeTemplateKey,
} from "@/lib/theme-types";

export const THEME_COLOR_VALUES = {
	black: "#000000",
	white: "#ffffff",
	red: "#ff2d2d",
	blue: "#0055ff",
	neonGreen: "#39ff14",
} as const;

export const FONT_FAMILY_MAP: Record<ThemeFontFamily, string> = {
	system: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
	inter: '"Inter", ui-sans-serif, system-ui, sans-serif',
	"space-grotesk": '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
	oswald: '"Oswald", ui-sans-serif, system-ui, sans-serif',
	"bebas-neue": '"Bebas Neue", ui-sans-serif, system-ui, sans-serif',
	montserrat: '"Montserrat", ui-sans-serif, system-ui, sans-serif',
	poppins: '"Poppins", ui-sans-serif, system-ui, sans-serif',
	playfair: '"Playfair Display", ui-serif, Georgia, serif',
	roboto: '"Roboto", ui-sans-serif, system-ui, sans-serif',
	"jetbrains-mono": '"JetBrains Mono", ui-monospace, monospace',
};

export const HEADING_SCALE_MAP: Record<string, { h1: string; h2: string; h3: string }> = {
	compact: { h1: "2rem", h2: "1.5rem", h3: "1.25rem" },
	default: { h1: "2.5rem", h2: "1.875rem", h3: "1.5rem" },
	large: { h1: "3rem", h2: "2.25rem", h3: "1.75rem" },
	dramatic: { h1: "4rem", h2: "2.5rem", h3: "2rem" },
};

export const SECTION_SPACING_MAP: Record<string, string> = {
	none: "0rem",
	sm: "1.5rem",
	md: "3rem",
	lg: "5rem",
	xl: "8rem",
};

export const CONTENT_MAX_WIDTH_MAP: Record<string, string> = {
	narrow: "64rem",
	default: "80rem",
	wide: "96rem",
	full: "100%",
};

export const BUTTON_SIZE_MAP: Record<string, { height: string; paddingX: string; fontSize: string }> = {
	sm: { height: "2rem", paddingX: "1rem", fontSize: "0.75rem" },
	md: { height: "2.5rem", paddingX: "1.5rem", fontSize: "0.875rem" },
	lg: { height: "3rem", paddingX: "2rem", fontSize: "1rem" },
};

const GOOGLE_FONT_NAMES: Partial<Record<ThemeFontFamily, string>> = {
	inter: "Inter",
	"space-grotesk": "Space+Grotesk",
	oswald: "Oswald",
	"bebas-neue": "Bebas+Neue",
	montserrat: "Montserrat",
	poppins: "Poppins",
	playfair: "Playfair+Display",
	roboto: "Roboto",
	"jetbrains-mono": "JetBrains+Mono",
};

const themeColorSchema = z.enum(["black", "white", "red", "blue", "neonGreen"]);
const borderWidthSchema = z.union([z.literal(2), z.literal(4)]);
const radiusSchema = z.union([z.literal(0), z.literal(2), z.literal(4), z.literal(8)]);
const fontFamilySchema = z.enum([
	"system",
	"inter",
	"space-grotesk",
	"oswald",
	"bebas-neue",
	"montserrat",
	"poppins",
	"playfair",
	"roboto",
	"jetbrains-mono",
]);
const shadowLevelSchema = z.enum(["none", "sm", "lg", "xl"]);
const fontWeightSchema = z.union([
	z.literal(400),
	z.literal(500),
	z.literal(600),
	z.literal(700),
	z.literal(800),
	z.literal(900),
]);
const baseFontSizeSchema = z.union([
	z.literal(14),
	z.literal(15),
	z.literal(16),
	z.literal(17),
	z.literal(18),
]);
const headingScaleSchema = z.enum(["compact", "default", "large", "dramatic"]);
const sectionSpacingSchema = z.enum(["none", "sm", "md", "lg", "xl"]);
const contentMaxWidthSchema = z.enum(["narrow", "default", "wide", "full"]);
const buttonStyleSchema = z.enum(["filled", "outline"]);
const buttonSizeSchema = z.enum(["sm", "md", "lg"]);
const heroBlockTypeSchema = z.enum([
	"heroHeading",
	"heroText",
	"heroButtonPrimary",
	"heroButtonSecondary",
	"heroMedia",
]);

const hexColorSchema = z
	.string()
	.regex(/^#[0-9a-fA-F]{6}$/)
	.optional();

function sanitizeRichTextHtml(rawHtml: string) {
	return rawHtml
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
		.replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
		.replace(/\s(href|src)\s*=\s*(['"])javascript:.*?\2/gi, "");
}

function htmlEscape(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function legacyRichTextToHtml(content: string) {
	return content
		.split(/\n{2,}/)
		.map((paragraph) => paragraph.trim())
		.filter((paragraph) => paragraph.length > 0)
		.map((paragraph) => `<p>${htmlEscape(paragraph)}</p>`)
		.join("");
}

function isAllowedMediaSource(value: string) {
	if (value.startsWith("/")) {
		return true;
	}

	try {
		const parsed = new URL(value);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}

const mediaSourceSchema = z.string().trim().max(4000).refine(isAllowedMediaSource, {
	message: "media source must be an absolute http(s) URL or a root-relative path",
});

const imageSourceSchema = mediaSourceSchema;

const nullableImageSourceSchema = z
	.union([imageSourceSchema, z.literal(""), z.null()])
	.transform((value) => (value === "" ? null : value));

const nullableMediaSourceSchema = z
	.union([mediaSourceSchema, z.literal(""), z.null()])
	.transform((value) => (value === "" ? null : value));

const customColorsSchema = z
	.object({
		background: hexColorSchema,
		foreground: hexColorSchema,
		primary: hexColorSchema,
		primaryForeground: hexColorSchema,
		secondary: hexColorSchema,
		secondaryForeground: hexColorSchema,
		accent: hexColorSchema,
		border: hexColorSchema,
	})
	.optional();

export const themeStyleTokensSchema = z
	.object({
		background: themeColorSchema,
		foreground: themeColorSchema,
		primary: themeColorSchema,
		primaryForeground: themeColorSchema,
		secondary: themeColorSchema,
		secondaryForeground: themeColorSchema,
		accent: themeColorSchema,
		border: themeColorSchema,
		borderWidth: borderWidthSchema,
		cardBorderWidth: borderWidthSchema,
		buttonBorderWidth: borderWidthSchema,
		hardShadow: shadowLevelSchema,
		radius: radiusSchema,
		fontFamily: fontFamilySchema,
		customColors: customColorsSchema,
		headingFontFamily: fontFamilySchema.optional(),
		headingFontWeight: fontWeightSchema.optional(),
		baseFontSize: baseFontSizeSchema.optional(),
		headingScale: headingScaleSchema.optional(),
		sectionSpacingY: sectionSpacingSchema.optional(),
		contentMaxWidth: contentMaxWidthSchema.optional(),
		buttonStyle: buttonStyleSchema.optional(),
		buttonSize: buttonSizeSchema.optional(),
	})
	.superRefine((value, context) => {
		const resolvedBg = resolveColor(value.background, value.customColors, "background");
		const resolvedFg = resolveColor(value.foreground, value.customColors, "foreground");
		const resolvedPrimary = resolveColor(value.primary, value.customColors, "primary");
		const resolvedPrimaryFg = resolveColor(value.primaryForeground, value.customColors, "primaryForeground");
		const resolvedSecondary = resolveColor(value.secondary, value.customColors, "secondary");
		const resolvedSecondaryFg = resolveColor(
			value.secondaryForeground,
			value.customColors,
			"secondaryForeground",
		);

		if (resolvedBg === resolvedFg) {
			context.addIssue({
				path: ["foreground"],
				code: z.ZodIssueCode.custom,
				message: "foreground must differ from background",
			});
		}

		if (resolvedPrimary === resolvedPrimaryFg) {
			context.addIssue({
				path: ["primaryForeground"],
				code: z.ZodIssueCode.custom,
				message: "primaryForeground must differ from primary",
			});
		}

		if (resolvedSecondary === resolvedSecondaryFg) {
			context.addIssue({
				path: ["secondaryForeground"],
				code: z.ZodIssueCode.custom,
				message: "secondaryForeground must differ from secondary",
			});
		}
	});

const heroSectionSettingsSchema = z.object({
	title: z.string().trim().min(1).max(120),
	subtitle: z.string().trim().min(1).max(280),
	image: nullableImageSourceSchema,
	primaryCtaLabel: z.string().trim().min(1).max(40),
	primaryCtaHref: z.string().trim().min(1).max(160),
	secondaryCtaLabel: z.string().trim().min(1).max(40),
	secondaryCtaHref: z.string().trim().min(1).max(160),
	textAlign: z.enum(["left", "center"]).optional(),
	overlayOpacity: z.number().min(0).max(100).optional(),
	height: z.enum(["auto", "md", "lg", "full"]).optional(),
	backgroundColor: z
		.union([
			z
				.string()
				.trim()
				.regex(/^#[0-9a-fA-F]{6}$/),
			z.literal(""),
			z.null(),
		])
		.transform((value) => (value === "" ? null : value))
		.optional(),
	foregroundColor: z
		.union([
			z
				.string()
				.trim()
				.regex(/^#[0-9a-fA-F]{6}$/),
			z.literal(""),
			z.null(),
		])
		.transform((value) => (value === "" ? null : value))
		.optional(),
});

const productGridSectionSettingsSchema = z.object({
	title: z.string().trim().min(1).max(120),
	description: z.string().trim().min(1).max(280),
	collectionId: z
		.union([z.string().trim().max(120), z.literal(""), z.null()])
		.transform((value) => (value === "" ? null : value)),
	featuredProductIds: z.array(z.string().trim().min(1).max(120)).max(24).optional(),
	limit: z.number().int().min(1).max(24),
	showViewAll: z.boolean(),
	viewAllHref: z.string().trim().min(1).max(160),
	columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
	imageRatio: z.enum(["square", "portrait", "landscape"]).optional(),
});

const productDetailsSectionSettingsSchema = z.object({
	showBreadcrumbs: z.boolean(),
	showSummary: z.boolean(),
	showFeatures: z.boolean(),
	layout: z.enum(["side-by-side", "stacked"]).optional(),
	showRelatedProducts: z.boolean().optional(),
});

const collectionHeaderSectionSettingsSchema = z.object({
	showDescription: z.boolean(),
	showImage: z.boolean(),
});

const categoryHeaderSectionSettingsSchema = z.object({
	showBreadcrumbs: z.boolean(),
	showDescription: z.boolean(),
	showImage: z.boolean(),
	showSubcategories: z.boolean(),
});

const checkoutSummarySectionSettingsSchema = z.object({
	title: z.string().trim().min(1).max(120),
	description: z.string().trim().min(1).max(240),
});

const checkoutFormSectionSettingsSchema = z.object({
	title: z.string().trim().min(1).max(120),
});

const richTextSectionSettingsSchema = z
	.object({
		contentHtml: z.string().trim().max(12000).optional(),
		content: z.string().trim().max(4000).optional(),
		textAlign: z.enum(["left", "center", "right"]),
	})
	.superRefine((value, context) => {
		if (!value.contentHtml && !value.content) {
			context.addIssue({
				path: ["contentHtml"],
				code: z.ZodIssueCode.custom,
				message: "contentHtml or content is required",
			});
		}
	})
	.transform((value) => {
		const html = value.contentHtml
			? sanitizeRichTextHtml(value.contentHtml)
			: legacyRichTextToHtml(value.content || "");
		const trimmedHtml = html.trim();
		return {
			contentHtml: trimmedHtml.length > 0 ? trimmedHtml : "<p></p>",
			content: value.content,
			textAlign: value.textAlign,
		};
	});

const heroHeadingBlockSchema = z.object({
	id: z.string().trim().min(1).max(160),
	type: z.literal("heroHeading"),
	disabled: z.boolean().optional(),
	settings: z.object({
		text: z.string().trim().min(1).max(120),
	}),
});

const heroTextBlockSchema = z.object({
	id: z.string().trim().min(1).max(160),
	type: z.literal("heroText"),
	disabled: z.boolean().optional(),
	settings: z.object({
		text: z.string().trim().min(1).max(280),
	}),
});

const heroButtonPrimaryBlockSchema = z.object({
	id: z.string().trim().min(1).max(160),
	type: z.literal("heroButtonPrimary"),
	disabled: z.boolean().optional(),
	settings: z.object({
		label: z.string().trim().min(1).max(40),
		href: z.string().trim().min(1).max(200),
	}),
});

const heroButtonSecondaryBlockSchema = z.object({
	id: z.string().trim().min(1).max(160),
	type: z.literal("heroButtonSecondary"),
	disabled: z.boolean().optional(),
	settings: z.object({
		label: z.string().trim().min(1).max(40),
		href: z.string().trim().min(1).max(200),
	}),
});

const heroMediaBlockSchema = z.object({
	id: z.string().trim().min(1).max(160),
	type: z.literal("heroMedia"),
	disabled: z.boolean().optional(),
	settings: z.object({
		image: nullableImageSourceSchema,
		overlayOpacity: z.number().min(0).max(100).optional(),
	}),
});

const heroBlockSchema = z.discriminatedUnion("type", [
	heroHeadingBlockSchema,
	heroTextBlockSchema,
	heroButtonPrimaryBlockSchema,
	heroButtonSecondaryBlockSchema,
	heroMediaBlockSchema,
]);

const imageWithTextSectionSettingsSchema = z
	.object({
		eyebrow: z.string().trim().max(40).optional(),
		title: z.string().trim().min(1).max(120),
		bodyHtml: z.string().trim().max(12000).optional(),
		body: z.string().trim().max(4000).optional(),
		text: z.string().trim().max(500).optional(),
		mediaKind: z.enum(["image", "video"]).optional(),
		image: nullableImageSourceSchema.optional(),
		videoUrl: nullableMediaSourceSchema.optional(),
		videoPoster: nullableImageSourceSchema.optional(),
		layoutVariant: z.enum(["split", "stacked"]).optional(),
		mediaPosition: z.enum(["left", "right"]).optional(),
		imagePosition: z.enum(["left", "right"]).optional(),
		mediaAspectRatio: z.enum(["square", "landscape", "portrait", "video"]).optional(),
		contentWidth: z.enum(["sm", "md", "lg"]).optional(),
		verticalAlign: z.enum(["top", "center", "bottom"]).optional(),
		textAlign: z.enum(["left", "center", "right"]).optional(),
		primaryButtonLabel: z.string().trim().max(40).optional(),
		primaryButtonHref: z.string().trim().max(160).optional(),
		secondaryButtonLabel: z.string().trim().max(40).optional(),
		secondaryButtonHref: z.string().trim().max(160).optional(),
		buttonLabel: z.string().trim().max(40).optional(),
		buttonHref: z.string().trim().max(160).optional(),
		videoAutoplay: z.boolean().optional(),
		videoMuted: z.boolean().optional(),
		videoLoop: z.boolean().optional(),
		videoControls: z.boolean().optional(),
	})
	.superRefine((value, context) => {
		if (!value.bodyHtml && !value.body && !value.text) {
			context.addIssue({
				path: ["bodyHtml"],
				code: z.ZodIssueCode.custom,
				message: "bodyHtml or body is required",
			});
		}
	})
	.transform((value) => {
		const bodyHtml = sanitizeRichTextHtml(
			value.bodyHtml || legacyRichTextToHtml(value.body || value.text || ""),
		).trim();
		const mediaKind = value.mediaKind || (value.videoUrl ? "video" : "image");
		const videoAutoplay = value.videoAutoplay ?? true;
		const videoMuted = videoAutoplay ? true : (value.videoMuted ?? true);

		return {
			eyebrow: value.eyebrow,
			title: value.title,
			bodyHtml: bodyHtml || "<p></p>",
			body: value.body || value.text,
			text: value.text,
			mediaKind,
			image: value.image ?? null,
			videoUrl: value.videoUrl ?? null,
			videoPoster: value.videoPoster ?? null,
			layoutVariant: value.layoutVariant || "split",
			mediaPosition: value.mediaPosition || value.imagePosition || "left",
			mediaAspectRatio: value.mediaAspectRatio || "landscape",
			contentWidth: value.contentWidth || "md",
			verticalAlign: value.verticalAlign || "center",
			textAlign: value.textAlign || "left",
			primaryButtonLabel: value.primaryButtonLabel ?? value.buttonLabel ?? "",
			primaryButtonHref: value.primaryButtonHref ?? value.buttonHref ?? "",
			secondaryButtonLabel: value.secondaryButtonLabel ?? "",
			secondaryButtonHref: value.secondaryButtonHref ?? "",
			videoAutoplay,
			videoMuted,
			videoLoop: value.videoLoop ?? true,
			videoControls: value.videoControls ?? false,
		};
	});

const newsletterSectionSettingsSchema = z.object({
	title: z.string().trim().min(1).max(120),
	description: z.string().trim().min(1).max(280),
	buttonLabel: z.string().trim().min(1).max(40),
	placeholder: z.string().trim().min(1).max(80),
});

const heroSectionSchema = z.object({
	id: z.string().trim().min(1).max(120),
	type: z.literal("hero"),
	disabled: z.boolean().optional(),
	settings: heroSectionSettingsSchema,
	blocks: z.array(heroBlockSchema).max(20).optional(),
});

const productGridSectionSchema = z.object({
	id: z.string().trim().min(1).max(120),
	type: z.literal("productGrid"),
	disabled: z.boolean().optional(),
	settings: productGridSectionSettingsSchema,
});

const productDetailsSectionSchema = z.object({
	id: z.string().trim().min(1).max(120),
	type: z.literal("productDetails"),
	disabled: z.boolean().optional(),
	settings: productDetailsSectionSettingsSchema,
});

const collectionHeaderSectionSchema = z.object({
	id: z.string().trim().min(1).max(120),
	type: z.literal("collectionHeader"),
	disabled: z.boolean().optional(),
	settings: collectionHeaderSectionSettingsSchema,
});

const categoryHeaderSectionSchema = z.object({
	id: z.string().trim().min(1).max(120),
	type: z.literal("categoryHeader"),
	disabled: z.boolean().optional(),
	settings: categoryHeaderSectionSettingsSchema,
});

const checkoutSummarySectionSchema = z.object({
	id: z.string().trim().min(1).max(120),
	type: z.literal("checkoutSummary"),
	disabled: z.boolean().optional(),
	settings: checkoutSummarySectionSettingsSchema,
});

const checkoutFormSectionSchema = z.object({
	id: z.string().trim().min(1).max(120),
	type: z.literal("checkoutForm"),
	disabled: z.boolean().optional(),
	settings: checkoutFormSectionSettingsSchema,
});

const richTextSectionSchema = z.object({
	id: z.string().trim().min(1).max(120),
	type: z.literal("richText"),
	disabled: z.boolean().optional(),
	settings: richTextSectionSettingsSchema,
});

const imageWithTextSectionSchema = z.object({
	id: z.string().trim().min(1).max(120),
	type: z.literal("imageWithText"),
	disabled: z.boolean().optional(),
	settings: imageWithTextSectionSettingsSchema,
});

const newsletterSectionSchema = z.object({
	id: z.string().trim().min(1).max(120),
	type: z.literal("newsletter"),
	disabled: z.boolean().optional(),
	settings: newsletterSectionSettingsSchema,
});

const themeSectionInstanceSchema = z.discriminatedUnion("type", [
	heroSectionSchema,
	productGridSectionSchema,
	productDetailsSectionSchema,
	collectionHeaderSectionSchema,
	categoryHeaderSectionSchema,
	checkoutSummarySectionSchema,
	checkoutFormSectionSchema,
	richTextSectionSchema,
	imageWithTextSectionSchema,
	newsletterSectionSchema,
]);

const themeTemplateSchema = z
	.object({
		order: z.array(z.string().trim().min(1).max(120)).max(30),
		sections: z.record(themeSectionInstanceSchema),
	})
	.superRefine((value, context) => {
		const sectionIds = new Set(Object.keys(value.sections));
		const missing = value.order.filter((sectionId) => !sectionIds.has(sectionId));
		if (missing.length > 0) {
			context.addIssue({
				path: ["order"],
				code: z.ZodIssueCode.custom,
				message: `order references unknown sections: ${missing.join(", ")}`,
			});
		}
	});

const themeGlobalsSchema = z.object({
	brandName: z.string().trim().min(1).max(80),
	brandTagline: z.string().trim().max(160),
	footerDescription: z.string().trim().min(1).max(260),
	footerCopyright: z.string().trim().min(1).max(140),
});

const themeTemplatesSchema = z.object({
	home: themeTemplateSchema,
	product: themeTemplateSchema,
	collection: themeTemplateSchema,
	category: themeTemplateSchema,
	checkout: themeTemplateSchema,
});

export const THEME_TEMPLATE_ALLOWED_SECTION_TYPES: Record<ThemeTemplateKey, ThemeSectionType[]> = {
	home: ["hero", "productGrid", "richText", "imageWithText", "newsletter"],
	product: ["productDetails", "productGrid", "richText", "imageWithText"],
	collection: ["collectionHeader", "productGrid", "richText", "imageWithText"],
	category: ["categoryHeader", "productGrid", "richText", "imageWithText"],
	checkout: ["checkoutSummary", "checkoutForm"],
};

export const THEME_TEMPLATE_REQUIRED_SECTION_TYPES: Record<ThemeTemplateKey, ThemeSectionType[]> = {
	home: ["hero", "productGrid"],
	product: ["productDetails"],
	collection: ["collectionHeader", "productGrid"],
	category: ["categoryHeader", "productGrid"],
	checkout: ["checkoutSummary", "checkoutForm"],
};

const THEME_TEMPLATE_KEYS = ["home", "product", "collection", "category", "checkout"] as const;

export const themeContentModelSchema = z.object({
	globals: themeGlobalsSchema,
	templates: themeTemplatesSchema,
});

export const legacyThemeContentModelSchema = z.object({
	brandName: z.string().trim().min(1).max(80).optional(),
	brandTagline: z.string().trim().max(160).optional(),
	heroTitle: z.string().trim().max(120).optional(),
	heroSubtitle: z.string().trim().max(280).optional(),
	heroImage: nullableImageSourceSchema,
	heroPrimaryCtaLabel: z.string().trim().max(40).optional(),
	heroPrimaryCtaHref: z.string().trim().max(160).optional(),
	heroSecondaryCtaLabel: z.string().trim().max(40).optional(),
	heroSecondaryCtaHref: z.string().trim().max(160).optional(),
	featuredCollectionId: z
		.union([z.string().trim().max(120), z.literal(""), z.null()])
		.transform((value) => (value === "" ? null : value))
		.optional(),
	footerDescription: z.string().trim().max(260).optional(),
	footerCopyright: z.string().trim().max(140).optional(),
});

export const DEFAULT_THEME_STYLE_TOKENS: ThemeStyleTokens = {
	background: "white",
	foreground: "black",
	primary: "black",
	primaryForeground: "white",
	secondary: "white",
	secondaryForeground: "black",
	accent: "red",
	border: "black",
	borderWidth: 2,
	cardBorderWidth: 2,
	buttonBorderWidth: 2,
	hardShadow: "sm",
	radius: 0,
	fontFamily: "system",
};

const HERO_BLOCK_TYPE_ORDER = [
	"heroHeading",
	"heroText",
	"heroButtonPrimary",
	"heroButtonSecondary",
	"heroMedia",
] as const satisfies ReadonlyArray<ThemeBlockInstance["type"]>;

function createHeroBlockId(sectionId: string, blockType: ThemeBlockInstance["type"]) {
	return `${sectionId}__${blockType}`;
}

function createDefaultHeroBlocks(sectionId: string, settings: HeroSectionSettings): ThemeBlockInstance[] {
	return [
		{
			id: createHeroBlockId(sectionId, "heroHeading"),
			type: "heroHeading",
			settings: { text: settings.title },
		},
		{
			id: createHeroBlockId(sectionId, "heroText"),
			type: "heroText",
			settings: { text: settings.subtitle },
		},
		{
			id: createHeroBlockId(sectionId, "heroButtonPrimary"),
			type: "heroButtonPrimary",
			settings: {
				label: settings.primaryCtaLabel,
				href: settings.primaryCtaHref,
			},
		},
		{
			id: createHeroBlockId(sectionId, "heroButtonSecondary"),
			type: "heroButtonSecondary",
			settings: {
				label: settings.secondaryCtaLabel,
				href: settings.secondaryCtaHref,
			},
		},
		{
			id: createHeroBlockId(sectionId, "heroMedia"),
			type: "heroMedia",
			settings: {
				image: settings.image,
				overlayOpacity: settings.overlayOpacity,
			},
		},
	];
}

type HeroSectionInstance = Extract<ThemeSectionInstance, { type: "hero" }>;

function mergeHeroBlockSettings(block: ThemeBlockInstance, fallback: ThemeBlockInstance): ThemeBlockInstance {
	if (block.type === "heroHeading" && fallback.type === "heroHeading") {
		return {
			...fallback,
			...block,
			settings: {
				...fallback.settings,
				...block.settings,
			},
		};
	}
	if (block.type === "heroText" && fallback.type === "heroText") {
		return {
			...fallback,
			...block,
			settings: {
				...fallback.settings,
				...block.settings,
			},
		};
	}
	if (block.type === "heroButtonPrimary" && fallback.type === "heroButtonPrimary") {
		return {
			...fallback,
			...block,
			settings: {
				...fallback.settings,
				...block.settings,
			},
		};
	}
	if (block.type === "heroButtonSecondary" && fallback.type === "heroButtonSecondary") {
		return {
			...fallback,
			...block,
			settings: {
				...fallback.settings,
				...block.settings,
			},
		};
	}
	if (block.type === "heroMedia" && fallback.type === "heroMedia") {
		return {
			...fallback,
			...block,
			settings: {
				...fallback.settings,
				...block.settings,
			},
		};
	}
	return fallback;
}

export function normalizeHeroBlocks(section: HeroSectionInstance): ThemeBlockInstance[] {
	const fallbackBlocks = createDefaultHeroBlocks(section.id, section.settings);
	const fallbackByType = Object.fromEntries(fallbackBlocks.map((block) => [block.type, block])) as Record<
		ThemeBlockInstance["type"],
		ThemeBlockInstance
	>;

	const normalized: ThemeBlockInstance[] = [];
	const usedIds = new Set<string>();
	const ordered = section.blocks ?? [];

	for (const currentBlock of ordered) {
		if (!heroBlockTypeSchema.safeParse(currentBlock.type).success) {
			continue;
		}
		const fallbackBlock = fallbackByType[currentBlock.type];
		if (!fallbackBlock) {
			continue;
		}

		let nextId = currentBlock.id?.trim() || createHeroBlockId(section.id, currentBlock.type);
		while (usedIds.has(nextId)) {
			nextId = `${nextId}_dup`;
		}
		usedIds.add(nextId);
		const merged = mergeHeroBlockSettings(currentBlock, fallbackBlock);
		normalized.push({
			...merged,
			id: nextId,
		});
	}

	for (const type of HERO_BLOCK_TYPE_ORDER) {
		if (normalized.some((block) => block.type === type)) {
			continue;
		}
		const fallbackBlock = fallbackByType[type];
		if (!fallbackBlock) {
			continue;
		}
		let nextId = fallbackBlock.id;
		while (usedIds.has(nextId)) {
			nextId = `${nextId}_dup`;
		}
		usedIds.add(nextId);
		normalized.push({ ...fallbackBlock, id: nextId });
	}

	return normalized;
}

function createDefaultHeroSection(sectionId = "hero_main"): ThemeSectionInstance {
	const settings: HeroSectionSettings = {
		title: "NOUVELLE COLLECTION",
		subtitle: "Découvrez nos nouveaux produits et exclusivités.",
		image: null,
		primaryCtaLabel: "Voir la collection",
		primaryCtaHref: "#products",
		secondaryCtaLabel: "Nouveautés",
		secondaryCtaHref: "/products",
		backgroundColor: null,
		foregroundColor: null,
	};

	return {
		id: sectionId,
		type: "hero",
		settings,
		blocks: createDefaultHeroBlocks(sectionId, settings),
	};
}

function createDefaultProductGridSection(): ThemeSectionInstance {
	const settings: ProductGridSectionSettings = {
		title: "Featured Products",
		description: "Handpicked favorites from our collection",
		collectionId: null,
		featuredProductIds: [],
		limit: 6,
		showViewAll: true,
		viewAllHref: "/products",
	};

	return {
		id: "products_main",
		type: "productGrid",
		settings,
	};
}

function createDefaultProductDetailsSection(): ThemeSectionInstance {
	const settings: ProductDetailsSectionSettings = {
		showBreadcrumbs: true,
		showSummary: true,
		showFeatures: true,
	};

	return {
		id: "product_details_main",
		type: "productDetails",
		settings,
	};
}

function createDefaultCollectionHeaderSection(): ThemeSectionInstance {
	const settings: CollectionHeaderSectionSettings = {
		showDescription: true,
		showImage: true,
	};

	return {
		id: "collection_header_main",
		type: "collectionHeader",
		settings,
	};
}

function createDefaultCategoryHeaderSection(): ThemeSectionInstance {
	const settings: CategoryHeaderSectionSettings = {
		showBreadcrumbs: true,
		showDescription: true,
		showImage: true,
		showSubcategories: true,
	};

	return {
		id: "category_header_main",
		type: "categoryHeader",
		settings,
	};
}

function createDefaultCheckoutSummarySection(): ThemeSectionInstance {
	const settings: CheckoutSummarySectionSettings = {
		title: "Recapitulatif",
		description: "Verifiez les articles et le total avant paiement.",
	};

	return {
		id: "checkout_summary_main",
		type: "checkoutSummary",
		settings,
	};
}

function createDefaultCheckoutFormSection(): ThemeSectionInstance {
	const settings: CheckoutFormSectionSettings = {
		title: "Finaliser votre commande",
	};

	return {
		id: "checkout_form_main",
		type: "checkoutForm",
		settings,
	};
}

function createDefaultRichTextSection(): ThemeSectionInstance {
	const content =
		"Ajoutez votre texte ici. Vous pouvez décrire votre marque, vos valeurs ou toute information utile.";
	const settings: RichTextSectionSettings = {
		content,
		contentHtml: legacyRichTextToHtml(content),
		textAlign: "center",
	};

	return {
		id: "richText_main",
		type: "richText",
		settings,
	};
}

function createDefaultImageWithTextSection(): ThemeSectionInstance {
	const settings: ImageWithTextSectionSettings = {
		eyebrow: "À propos",
		title: "Notre histoire",
		body: "Découvrez ce qui nous rend uniques et pourquoi nos clients nous font confiance.",
		bodyHtml: "<p>Découvrez ce qui nous rend uniques et pourquoi nos clients nous font confiance.</p>",
		text: "Découvrez ce qui nous rend uniques et pourquoi nos clients nous font confiance.",
		mediaKind: "image",
		image: null,
		videoUrl: null,
		videoPoster: null,
		layoutVariant: "split",
		mediaPosition: "left",
		mediaAspectRatio: "landscape",
		contentWidth: "md",
		verticalAlign: "center",
		textAlign: "left",
		primaryButtonLabel: "En savoir plus",
		primaryButtonHref: "/about",
		secondaryButtonLabel: "",
		secondaryButtonHref: "",
		videoAutoplay: true,
		videoMuted: true,
		videoLoop: true,
		videoControls: false,
	};

	return {
		id: "imageWithText_main",
		type: "imageWithText",
		settings,
	};
}

function createDefaultNewsletterSection(): ThemeSectionInstance {
	const settings: NewsletterSectionSettings = {
		title: "Restez informé",
		description: "Inscrivez-vous pour recevoir nos dernières offres et nouveautés.",
		buttonLabel: "S'inscrire",
		placeholder: "Votre email",
	};

	return {
		id: "newsletter_main",
		type: "newsletter",
		settings,
	};
}

function createDefaultHomeTemplate(): ThemeTemplate {
	const hero = createDefaultHeroSection();
	const productGrid = createDefaultProductGridSection();

	return {
		order: [hero.id, productGrid.id],
		sections: {
			[hero.id]: hero,
			[productGrid.id]: productGrid,
		},
	};
}

export function createDefaultSection(sectionType: ThemeSectionType, id: string): ThemeSectionInstance {
	if (sectionType === "hero") {
		return createDefaultHeroSection(id);
	}
	if (sectionType === "productGrid") {
		return { ...createDefaultProductGridSection(), id };
	}
	if (sectionType === "productDetails") {
		return { ...createDefaultProductDetailsSection(), id };
	}
	if (sectionType === "collectionHeader") {
		return { ...createDefaultCollectionHeaderSection(), id };
	}
	if (sectionType === "categoryHeader") {
		return { ...createDefaultCategoryHeaderSection(), id };
	}
	if (sectionType === "checkoutSummary") {
		return { ...createDefaultCheckoutSummarySection(), id };
	}
	if (sectionType === "richText") {
		return { ...createDefaultRichTextSection(), id };
	}
	if (sectionType === "imageWithText") {
		return { ...createDefaultImageWithTextSection(), id };
	}
	if (sectionType === "newsletter") {
		return { ...createDefaultNewsletterSection(), id };
	}
	return { ...createDefaultCheckoutFormSection(), id };
}

function createDefaultTemplate(templateKey: ThemeTemplateKey): ThemeTemplate {
	if (templateKey === "home") {
		return createDefaultHomeTemplate();
	}

	const requiredTypes = THEME_TEMPLATE_REQUIRED_SECTION_TYPES[templateKey];
	const sections = requiredTypes.map((sectionType) =>
		createDefaultSection(sectionType, `${sectionType}_main`),
	);

	return {
		order: sections.map((section) => section.id),
		sections: Object.fromEntries(sections.map((section) => [section.id, section])),
	};
}

export function createDefaultThemeContentModel(storeName = "My Store"): ThemeContentModel {
	return {
		globals: {
			brandName: storeName,
			brandTagline: "Boutique e-commerce brutaliste",
			footerDescription: "Une boutique moderne et percutante, pensée pour convertir.",
			footerCopyright: "Tous droits réservés.",
		},
		templates: {
			home: createDefaultTemplate("home"),
			product: createDefaultTemplate("product"),
			collection: createDefaultTemplate("collection"),
			category: createDefaultTemplate("category"),
			checkout: createDefaultTemplate("checkout"),
		},
	};
}

export function legacyThemeContentToV2(legacy: Partial<LegacyThemeContentModel>): ThemeContentModel {
	const model = createDefaultThemeContentModel(legacy.brandName || "My Store");
	const home = model.templates.home;

	const hero = home.sections[home.order[0]];
	if (hero?.type === "hero") {
		hero.settings = {
			title: legacy.heroTitle || hero.settings.title,
			subtitle: legacy.heroSubtitle || hero.settings.subtitle,
			image: legacy.heroImage || hero.settings.image,
			primaryCtaLabel: legacy.heroPrimaryCtaLabel || hero.settings.primaryCtaLabel,
			primaryCtaHref: legacy.heroPrimaryCtaHref || hero.settings.primaryCtaHref,
			secondaryCtaLabel: legacy.heroSecondaryCtaLabel || hero.settings.secondaryCtaLabel,
			secondaryCtaHref: legacy.heroSecondaryCtaHref || hero.settings.secondaryCtaHref,
			backgroundColor: null,
			foregroundColor: null,
		};
		hero.blocks = normalizeHeroBlocks(hero);
	}

	const productGrid = home.sections[home.order[1]];
	if (productGrid?.type === "productGrid") {
		productGrid.settings = {
			...productGrid.settings,
			collectionId: legacy.featuredCollectionId || null,
		};
	}

	model.globals = {
		brandName: legacy.brandName || model.globals.brandName,
		brandTagline: legacy.brandTagline || model.globals.brandTagline,
		footerDescription: legacy.footerDescription || model.globals.footerDescription,
		footerCopyright: legacy.footerCopyright || model.globals.footerCopyright,
	};

	return model;
}

export function validateThemeStyleTokens(value: unknown) {
	return themeStyleTokensSchema.parse(value);
}

function normalizeTemplateSectionOrder(template: ThemeTemplate) {
	const dedupedOrder = template.order.filter(
		(sectionId, index) => template.order.indexOf(sectionId) === index,
	);
	const filteredOrder = dedupedOrder.filter((sectionId) => Boolean(template.sections[sectionId]));
	const missingOrderIds = Object.keys(template.sections).filter(
		(sectionId) => !filteredOrder.includes(sectionId),
	);
	return [...filteredOrder, ...missingOrderIds];
}

function createSectionId(sectionType: ThemeSectionType, template: ThemeTemplate) {
	const base = `${sectionType}_main`;
	if (!template.sections[base]) {
		return base;
	}

	let index = 2;
	while (template.sections[`${base}_${index}`]) {
		index += 1;
	}

	return `${base}_${index}`;
}

function normalizeThemeSection(section: ThemeSectionInstance): ThemeSectionInstance {
	if (section.type === "hero") {
		return {
			...section,
			blocks: normalizeHeroBlocks(section),
		};
	}

	if (section.type === "richText") {
		const contentHtml = sanitizeRichTextHtml(
			section.settings.contentHtml || legacyRichTextToHtml(section.settings.content || ""),
		).trim();
		return {
			...section,
			settings: {
				...section.settings,
				contentHtml: contentHtml || "<p></p>",
			},
		};
	}

	return section;
}

function normalizeTemplateForKey(template: ThemeTemplate, templateKey: ThemeTemplateKey) {
	const allowedSectionTypes = THEME_TEMPLATE_ALLOWED_SECTION_TYPES[templateKey];
	const normalizedSections = Object.fromEntries(
		Object.entries(template.sections)
			.filter(([, section]) => allowedSectionTypes.includes(section.type))
			.map(([sectionId, section]) => [sectionId, normalizeThemeSection(section)] as const),
	) as ThemeTemplate["sections"];

	let normalizedTemplate: ThemeTemplate = {
		order: normalizeTemplateSectionOrder({ order: template.order, sections: normalizedSections }),
		sections: normalizedSections,
	};

	const requiredSectionTypes = THEME_TEMPLATE_REQUIRED_SECTION_TYPES[templateKey];
	for (const requiredType of requiredSectionTypes) {
		const hasRequiredType = normalizedTemplate.order.some(
			(sectionId) => normalizedTemplate.sections[sectionId]?.type === requiredType,
		);

		if (hasRequiredType) {
			continue;
		}

		const sectionId = createSectionId(requiredType, normalizedTemplate);
		const section = createDefaultSection(requiredType, sectionId);
		normalizedTemplate = {
			order: [...normalizedTemplate.order, section.id],
			sections: {
				...normalizedTemplate.sections,
				[section.id]: section,
			},
		};
	}

	return normalizedTemplate;
}

export function normalizeThemeContentModel(contentModel: ThemeContentModel) {
	return {
		...contentModel,
		templates: {
			home: normalizeTemplateForKey(contentModel.templates.home, "home"),
			product: normalizeTemplateForKey(contentModel.templates.product, "product"),
			collection: normalizeTemplateForKey(contentModel.templates.collection, "collection"),
			category: normalizeTemplateForKey(contentModel.templates.category, "category"),
			checkout: normalizeTemplateForKey(contentModel.templates.checkout, "checkout"),
		},
	};
}

export type ThemeRuntimeFallbackAction = "reactivated_first_section" | "injected_required_section";

export interface ThemeRuntimeFallback {
	templateKey: ThemeTemplateKey;
	action: ThemeRuntimeFallbackAction;
	sectionIds: string[];
}

export interface RenderSafeThemeContentModelResult {
	contentModel: ThemeContentModel;
	fallbacks: ThemeRuntimeFallback[];
}

export function hasActiveSections(template: ThemeTemplate) {
	return template.order.some((sectionId) => {
		const section = template.sections[sectionId];
		return Boolean(section && !section.disabled);
	});
}

function ensureTemplateHasActiveSection(template: ThemeTemplate, templateKey: ThemeTemplateKey) {
	if (hasActiveSections(template)) {
		return {
			template,
			fallback: null as ThemeRuntimeFallback | null,
		};
	}

	const firstSectionId = template.order.find((sectionId) => Boolean(template.sections[sectionId]));
	if (firstSectionId) {
		const firstSection = template.sections[firstSectionId];
		if (!firstSection) {
			return {
				template,
				fallback: null as ThemeRuntimeFallback | null,
			};
		}

		return {
			template: {
				...template,
				sections: {
					...template.sections,
					[firstSectionId]: {
						...firstSection,
						disabled: false,
					},
				},
			},
			fallback: {
				templateKey,
				action: "reactivated_first_section",
				sectionIds: [firstSectionId],
			},
		};
	}

	const requiredSectionType = THEME_TEMPLATE_REQUIRED_SECTION_TYPES[templateKey][0];
	if (!requiredSectionType) {
		return {
			template,
			fallback: null as ThemeRuntimeFallback | null,
		};
	}

	const sectionId = createSectionId(requiredSectionType, template);
	const section = createDefaultSection(requiredSectionType, sectionId);

	return {
		template: {
			order: [...template.order, sectionId],
			sections: {
				...template.sections,
				[sectionId]: section,
			},
		},
		fallback: {
			templateKey,
			action: "injected_required_section",
			sectionIds: [sectionId],
		},
	};
}

export function toRenderSafeThemeContentModel(
	contentModel: ThemeContentModel,
): RenderSafeThemeContentModelResult {
	const normalized = normalizeThemeContentModel(contentModel);
	const ensuredByTemplate = THEME_TEMPLATE_KEYS.map(
		(templateKey) =>
			[templateKey, ensureTemplateHasActiveSection(normalized.templates[templateKey], templateKey)] as const,
	);
	const templates = {
		...normalized.templates,
		...Object.fromEntries(ensuredByTemplate.map(([templateKey, ensured]) => [templateKey, ensured.template])),
	};
	const fallbacks = ensuredByTemplate
		.map(([, ensured]) => ensured.fallback)
		.filter((fallback): fallback is ThemeRuntimeFallback => Boolean(fallback));

	return {
		contentModel: {
			...normalized,
			templates,
		},
		fallbacks,
	};
}

export function validateThemeContentModel(value: unknown) {
	const parsed = themeContentModelSchema.parse(value);
	return normalizeThemeContentModel(parsed);
}

export function parseLegacyThemeContentModel(value: unknown) {
	return legacyThemeContentModelSchema.parse(value);
}

export function resolveColor(
	presetKey: string,
	customColors: ThemeCustomColors | undefined,
	field: keyof ThemeCustomColors,
) {
	const custom = customColors?.[field];
	if (custom) return custom;
	return THEME_COLOR_VALUES[presetKey as keyof typeof THEME_COLOR_VALUES] || presetKey;
}

function normalizeShadow(level: ThemeStyleTokens["hardShadow"]) {
	if (level === "none") return "none";
	if (level === "xl") return "8px 8px 0px 0px rgba(0,0,0,1)";
	if (level === "lg") return "6px 6px 0px 0px rgba(0,0,0,1)";
	return "4px 4px 0px 0px rgba(0,0,0,1)";
}

export function getGoogleFontUrl(bodyFont: ThemeFontFamily, headingFont?: ThemeFontFamily): string | null {
	const fonts = new Set<string>();

	const bodyName = GOOGLE_FONT_NAMES[bodyFont];
	if (bodyName) fonts.add(bodyName);

	if (headingFont) {
		const headingName = GOOGLE_FONT_NAMES[headingFont];
		if (headingName) fonts.add(headingName);
	}

	if (fonts.size === 0) return null;

	const families = Array.from(fonts)
		.map((name) => `family=${name}:wght@400;500;600;700;800;900`)
		.join("&");

	return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export function toStorefrontCssVariables(styleTokens: ThemeStyleTokens) {
	const background = resolveColor(styleTokens.background, styleTokens.customColors, "background");
	const foreground = resolveColor(styleTokens.foreground, styleTokens.customColors, "foreground");
	const primary = resolveColor(styleTokens.primary, styleTokens.customColors, "primary");
	const primaryForeground = resolveColor(
		styleTokens.primaryForeground,
		styleTokens.customColors,
		"primaryForeground",
	);
	const secondary = resolveColor(styleTokens.secondary, styleTokens.customColors, "secondary");
	const secondaryForeground = resolveColor(
		styleTokens.secondaryForeground,
		styleTokens.customColors,
		"secondaryForeground",
	);
	const accent = resolveColor(styleTokens.accent, styleTokens.customColors, "accent");
	const border = resolveColor(styleTokens.border, styleTokens.customColors, "border");

	const bodyFontStack = FONT_FAMILY_MAP[styleTokens.fontFamily];
	const headingFontFamily = styleTokens.headingFontFamily
		? FONT_FAMILY_MAP[styleTokens.headingFontFamily]
		: bodyFontStack;
	const headingFontWeight = String(styleTokens.headingFontWeight ?? 900);
	const baseFontSize = `${styleTokens.baseFontSize ?? 16}px`;
	const headingScale = HEADING_SCALE_MAP[styleTokens.headingScale ?? "default"] ?? HEADING_SCALE_MAP.default;
	const sectionSpacing = SECTION_SPACING_MAP[styleTokens.sectionSpacingY ?? "md"] ?? SECTION_SPACING_MAP.md;
	const contentMaxWidth =
		CONTENT_MAX_WIDTH_MAP[styleTokens.contentMaxWidth ?? "default"] ?? CONTENT_MAX_WIDTH_MAP.default;
	const buttonSizeValues = BUTTON_SIZE_MAP[styleTokens.buttonSize ?? "md"] ?? BUTTON_SIZE_MAP.md;
	const radius = `${styleTokens.radius}px`;

	return {
		"--background": background,
		"--foreground": foreground,
		"--primary": primary,
		"--primary-foreground": primaryForeground,
		"--secondary": secondary,
		"--secondary-foreground": secondaryForeground,
		"--muted": secondary,
		"--muted-foreground": secondaryForeground,
		"--accent": accent,
		"--accent-foreground": foreground,
		"--border": border,
		"--input": border,
		"--ring": accent,
		"--radius": radius,
		"--store-border-width": `${styleTokens.borderWidth}px`,
		"--store-card-border-width": `${styleTokens.cardBorderWidth}px`,
		"--store-button-border-width": `${styleTokens.buttonBorderWidth}px`,
		"--store-hard-shadow": normalizeShadow(styleTokens.hardShadow),
		"--store-font-family": bodyFontStack,
		"--store-heading-font-family": headingFontFamily,
		"--store-heading-font-weight": headingFontWeight,
		"--store-base-font-size": baseFontSize,
		"--store-h1-size": headingScale.h1,
		"--store-h2-size": headingScale.h2,
		"--store-h3-size": headingScale.h3,
		"--store-section-spacing-y": sectionSpacing,
		"--store-content-max-width": contentMaxWidth,
		"--store-button-height": buttonSizeValues.height,
		"--store-button-padding-x": buttonSizeValues.paddingX,
		"--store-button-font-size": buttonSizeValues.fontSize,
		"--store-button-style": styleTokens.buttonStyle ?? "filled",
	};
}
