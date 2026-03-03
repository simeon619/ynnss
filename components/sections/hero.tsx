import { ArrowRightIcon } from "lucide-react";
import { prependStorefrontBasePath } from "@/lib/storefront-paths";
import type { ThemeBlockInstance } from "@/lib/theme-types";
import { YnsLink } from "../yns-link";

interface HeroProps {
	title?: string | null;
	subtitle?: string | null;
	image?: string | null;
	primaryCtaLabel?: string;
	primaryCtaHref?: string;
	secondaryCtaLabel?: string;
	secondaryCtaHref?: string;
	basePath?: string;
	textAlign?: "left" | "center";
	overlayOpacity?: number;
	height?: "auto" | "md" | "lg" | "full";
	backgroundColor?: string | null;
	foregroundColor?: string | null;
	blocks?: ThemeBlockInstance[];
}

const HERO_HEIGHT_CLASSES = {
	auto: "py-16 sm:py-20 lg:py-28",
	md: "py-24 sm:py-32 lg:py-40",
	lg: "py-32 sm:py-40 lg:py-52",
	full: "min-h-[80vh] flex items-center",
} as const;

export function Hero({
	title,
	subtitle,
	image,
	primaryCtaLabel,
	primaryCtaHref,
	secondaryCtaLabel,
	secondaryCtaHref,
	basePath = "",
	textAlign = "left",
	overlayOpacity,
	height = "auto",
	backgroundColor,
	foregroundColor,
	blocks,
}: HeroProps) {
	const primaryHref = prependStorefrontBasePath(basePath, primaryCtaHref || "#products");
	const secondaryHref = prependStorefrontBasePath(basePath, secondaryCtaHref || "/products");
	const fallbackBlocks: ThemeBlockInstance[] = [
		{
			id: "legacy_hero_heading",
			type: "heroHeading",
			settings: { text: title || "Performance & Style sur le terrain" },
		},
		{
			id: "legacy_hero_text",
			type: "heroText",
			settings: {
				text:
					subtitle ||
					"Découvrez notre collection exclusive de maillots officiels, survêtements premium et sneakers de performance.",
			},
		},
		{
			id: "legacy_hero_primary",
			type: "heroButtonPrimary",
			settings: { label: primaryCtaLabel || "Voir la Collection", href: primaryHref },
		},
		{
			id: "legacy_hero_secondary",
			type: "heroButtonSecondary",
			settings: { label: secondaryCtaLabel || "Nouveautes", href: secondaryHref },
		},
		{
			id: "legacy_hero_media",
			type: "heroMedia",
			settings: { image: image || null, overlayOpacity },
		},
	];
	const resolvedBlocks = blocks && blocks.length > 0 ? blocks : fallbackBlocks;
	const mediaBlock = resolvedBlocks.find(
		(block): block is Extract<ThemeBlockInstance, { type: "heroMedia" }> =>
			block.type === "heroMedia" && !block.disabled,
	);
	const resolvedImage = mediaBlock?.settings.image || image;
	const resolvedOverlayOpacity = mediaBlock?.settings.overlayOpacity ?? overlayOpacity;
	const isCenter = textAlign === "center";
	const heightClass = HERO_HEIGHT_CLASSES[height] || HERO_HEIGHT_CLASSES.auto;
	const contentBlocks = resolvedBlocks.filter((block) => block.type !== "heroMedia");

	return (
		<section
			className="relative overflow-hidden bg-secondary/30"
			data-theme-section
			data-theme-section-type="hero"
			data-theme-hero-root
			style={{
				backgroundColor: backgroundColor || undefined,
				color: foregroundColor || undefined,
			}}
		>
			<div data-theme-hero-media-layer className="contents">
				{resolvedBlocks
					.filter((block) => block.type === "heroMedia")
					.map((block) => (
						<div
							key={block.id}
							data-theme-block-id={block.id}
							style={{ display: block.disabled ? "none" : undefined }}
						>
							<div
								data-theme-field="heroMedia.image"
								className="absolute inset-0 z-0 bg-cover bg-center"
								style={{
									backgroundImage: (block.type === "heroMedia" ? block.settings.image : resolvedImage)
										? `url(${(block.type === "heroMedia" ? block.settings.image : resolvedImage) || ""})`
										: "none",
								}}
							/>
							<div
								data-theme-field="heroMedia.overlay"
								className="absolute inset-0 z-0"
								style={{
									backgroundColor: (block.type === "heroMedia" ? block.settings.image : resolvedImage)
										? `rgba(0,0,0,${
												typeof (block.type === "heroMedia"
													? block.settings.overlayOpacity
													: resolvedOverlayOpacity) === "number"
													? (
															(block.type === "heroMedia"
																? block.settings.overlayOpacity
																: resolvedOverlayOpacity) || 40
														) / 100
													: 0.4
											})`
										: "transparent",
								}}
							/>
						</div>
					))}
			</div>
			<div
				className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isCenter ? "text-center" : ""}`}
				data-theme-container
			>
				<div className={heightClass}>
					<div className={isCenter ? "max-w-3xl mx-auto" : "max-w-2xl"}>
						<div data-theme-hero-blocks className="space-y-6">
							{contentBlocks.map((block) => {
								if (block.type === "heroHeading") {
									return (
										<div
											key={block.id}
											data-theme-block-id={block.id}
											style={{ display: block.disabled ? "none" : undefined }}
										>
											<h1
												data-theme-field="heroHeading.text"
												className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight uppercase italic ${
													resolvedImage ? "text-white" : "text-foreground"
												}`}
											>
												{block.settings.text}
											</h1>
										</div>
									);
								}

								if (block.type === "heroText") {
									return (
										<div
											key={block.id}
											data-theme-block-id={block.id}
											style={{ display: block.disabled ? "none" : undefined }}
										>
											<p
												data-theme-field="heroText.text"
												className={`text-lg sm:text-xl leading-relaxed ${
													resolvedImage ? "text-white/90" : "text-muted-foreground"
												}`}
											>
												{block.settings.text}
											</p>
										</div>
									);
								}

								if (block.type === "heroButtonPrimary") {
									return (
										<div
											key={block.id}
											data-theme-block-id={block.id}
											style={{ display: block.disabled ? "none" : undefined }}
											className={`flex ${isCenter ? "justify-center" : ""}`}
										>
											<YnsLink
												prefetch={"eager"}
												href={prependStorefrontBasePath(basePath, block.settings.href)}
												data-theme-role="button"
												data-theme-button-kind="primary"
												data-theme-field="heroButtonPrimary.link"
												className={`inline-flex items-center justify-center gap-2 border-black font-black uppercase ${
													resolvedImage
														? "bg-white text-black hover:bg-black hover:text-white"
														: "bg-black text-white hover:bg-white hover:text-black"
												}`}
												style={{ borderWidth: "var(--store-button-border-width, 4px)" }}
											>
												<span data-theme-field="heroButtonPrimary.label">{block.settings.label}</span>
												<ArrowRightIcon className="h-4 w-4" />
											</YnsLink>
										</div>
									);
								}

								if (block.type === "heroButtonSecondary") {
									return (
										<div
											key={block.id}
											data-theme-block-id={block.id}
											style={{ display: block.disabled ? "none" : undefined }}
											className={`flex ${isCenter ? "justify-center" : ""}`}
										>
											<YnsLink
												prefetch={"eager"}
												href={prependStorefrontBasePath(basePath, block.settings.href)}
												data-theme-role="button"
												data-theme-button-kind="secondary"
												data-theme-field="heroButtonSecondary.link"
												className={`inline-flex items-center justify-center gap-2 font-black uppercase ${
													resolvedImage
														? "border-white text-white hover:bg-white hover:text-black"
														: "border-black text-black hover:bg-black hover:text-white"
												}`}
												style={{ borderWidth: "var(--store-button-border-width, 4px)" }}
											>
												<span data-theme-field="heroButtonSecondary.label">{block.settings.label}</span>
											</YnsLink>
										</div>
									);
								}

								return null;
							})}
						</div>
					</div>
				</div>
			</div>
			{!resolvedImage && (
				<div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/3 h-full pointer-events-none hidden lg:block" />
			)}
		</section>
	);
}
