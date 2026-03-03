import { ThemeVideo } from "@/components/theme-video";
import { YnsLink } from "@/components/yns-link";
import {
	getImageWithTextCtaClass,
	getImageWithTextCtaContainerClass,
	getImageWithTextDerivedState,
	getImageWithTextEyebrowClass,
	getImageWithTextMediaContainerClass,
	getImageWithTextMediaPlaceholderClass,
	getImageWithTextMediaSurfaceClass,
	getImageWithTextRootClass,
	getImageWithTextTextContainerClass,
} from "@/lib/image-with-text";
import type { ImageWithTextSectionSettings } from "@/lib/theme-types";
import { YNSImage } from "@/lib/yns-image";

interface ImageWithTextSectionProps {
	settings: ImageWithTextSectionSettings;
}

export function ImageWithTextSection({ settings }: ImageWithTextSectionProps) {
	const {
		sanitizedBodyHtml,
		hasEyebrow,
		hasPrimaryCta,
		hasSecondaryCta,
		hasVisibleCtas,
		hasImage,
		hasVideo,
	} = getImageWithTextDerivedState(settings);

	return (
		<section
			className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8"
			data-theme-section
			data-theme-container
		>
			<div
				data-theme-image-text-root
				data-layout-variant={settings.layoutVariant}
				data-vertical-align={settings.verticalAlign}
				className={getImageWithTextRootClass(settings)}
			>
				<div
					data-theme-image-container
					data-theme-media-container
					data-media-kind={settings.mediaKind}
					data-media-position={settings.mediaPosition}
					data-media-aspect-ratio={settings.mediaAspectRatio}
					className={getImageWithTextMediaContainerClass(settings)}
				>
					<div
						data-theme-slot="imageWithText.imageSurface"
						className={getImageWithTextMediaSurfaceClass("image", settings.mediaKind)}
					>
						{hasImage ? (
							<div className="relative h-full w-full">
								<YNSImage
									src={settings.image || ""}
									alt={settings.title}
									fill
									sizes="(max-width: 1024px) 100vw, 50vw"
									data-theme-field="imageWithText.image"
									className="object-cover"
								/>
							</div>
						) : (
							<div
								data-theme-slot="imageWithText.imagePlaceholder"
								className={getImageWithTextMediaPlaceholderClass()}
							>
								Image
							</div>
						)}
					</div>
					<div
						data-theme-slot="imageWithText.videoSurface"
						className={getImageWithTextMediaSurfaceClass("video", settings.mediaKind)}
					>
						{hasVideo ? (
							<ThemeVideo
								src={settings.videoUrl || ""}
								poster={settings.videoPoster || undefined}
								autoPlay={settings.videoAutoplay}
								muted={settings.videoAutoplay ? true : settings.videoMuted}
								loop={settings.videoLoop}
								controls={settings.videoControls}
								contextLabel="Image with text video"
								className="h-full w-full object-cover"
							/>
						) : (
							<div
								data-theme-slot="imageWithText.videoPlaceholder"
								className={getImageWithTextMediaPlaceholderClass()}
							>
								Video
							</div>
						)}
					</div>
				</div>

				<div
					data-theme-text-container
					data-text-align={settings.textAlign}
					data-content-width={settings.contentWidth}
					className={getImageWithTextTextContainerClass(settings)}
				>
					<p
						className={getImageWithTextEyebrowClass(hasEyebrow)}
						data-theme-slot="imageWithText.eyebrow"
						data-theme-field="imageWithText.eyebrow"
						aria-hidden={!hasEyebrow}
					>
						{settings.eyebrow || ""}
					</p>
					<h2
						className="text-3xl font-black uppercase tracking-tight sm:text-4xl"
						data-theme-field="imageWithText.title"
					>
						{settings.title}
					</h2>
					<div
						className="theme-rich-text w-full text-base leading-relaxed"
						data-theme-field="imageWithText.bodyHtml"
						dangerouslySetInnerHTML={{ __html: sanitizedBodyHtml || "<p></p>" }}
					/>
					<div
						data-theme-cta-container
						aria-hidden={!hasVisibleCtas}
						className={getImageWithTextCtaContainerClass(hasVisibleCtas)}
					>
						<YnsLink
							href={settings.primaryButtonHref || "#"}
							data-theme-role="button"
							data-theme-slot="imageWithText.primaryCta"
							data-theme-field="imageWithText.primaryButtonLink"
							aria-hidden={!hasPrimaryCta}
							className={getImageWithTextCtaClass("primary", hasPrimaryCta)}
							tabIndex={hasPrimaryCta ? undefined : -1}
						>
							<span data-theme-field="imageWithText.primaryButtonLabel">{settings.primaryButtonLabel}</span>
						</YnsLink>
						<YnsLink
							href={settings.secondaryButtonHref || "#"}
							data-theme-role="button"
							data-theme-slot="imageWithText.secondaryCta"
							data-theme-field="imageWithText.secondaryButtonLink"
							aria-hidden={!hasSecondaryCta}
							className={getImageWithTextCtaClass("secondary", hasSecondaryCta)}
							tabIndex={hasSecondaryCta ? undefined : -1}
						>
							<span data-theme-field="imageWithText.secondaryButtonLabel">
								{settings.secondaryButtonLabel}
							</span>
						</YnsLink>
					</div>
				</div>
			</div>
		</section>
	);
}
