"use client";

import { useEffect, useRef } from "react";
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
	sanitizeImageWithTextHtml,
} from "@/lib/image-with-text";
import {
	parseThemePreviewStudioToRuntimeMessage,
	THEME_PREVIEW_PROTOCOL_VERSION,
	type ThemePreviewRuntimeToStudioMessage,
} from "@/lib/theme-preview-protocol";
import type {
	ThemeBlockInstance,
	ThemeContentModel,
	ThemeSectionInstance,
	ThemeStyleTokens,
	ThemeTemplate,
	ThemeTemplateKey,
} from "@/lib/theme-types";
import { toStorefrontCssVariables } from "@/lib/theme-utils";
import {
	getThemeVideoErrorPlaybackState,
	getThemeVideoInitialPlaybackState,
	getThemeVideoReadyPlaybackState,
	THEME_VIDEO_DECODE_ERROR_MESSAGE,
	THEME_VIDEO_FALLBACK_CLASS_NAME,
} from "@/lib/theme-video-preview";

function escapeHtmlAttribute(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

function escapeHtmlContent(value: string) {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function postToParent(message: ThemePreviewRuntimeToStudioMessage, targetOrigin = "*") {
	if (typeof window === "undefined") return;
	if (window.parent === window) return;
	window.parent.postMessage(message, targetOrigin);
}

function applyCssSnapshot(styleTokens: ThemeStyleTokens) {
	const cssVars = toStorefrontCssVariables(styleTokens);
	const root = document.querySelector(".storefront-theme") as HTMLElement | null;
	if (!root) return;
	for (const [key, value] of Object.entries(cssVars)) {
		root.style.setProperty(key, value);
	}
	root.setAttribute("data-theme-button-style", styleTokens.buttonStyle ?? "filled");
}

function applyHeroBlockSnapshot(blockNode: Element, block: ThemeBlockInstance) {
	if (block.type === "heroHeading") {
		const heading = blockNode.querySelector("[data-theme-field='heroHeading.text']");
		if (heading) heading.textContent = block.settings.text;
		return;
	}
	if (block.type === "heroText") {
		const text = blockNode.querySelector("[data-theme-field='heroText.text']");
		if (text) text.textContent = block.settings.text;
		return;
	}
	if (block.type === "heroButtonPrimary") {
		const button = blockNode.querySelector("[data-theme-field='heroButtonPrimary.label']");
		const link = blockNode.querySelector(
			"[data-theme-field='heroButtonPrimary.link']",
		) as HTMLAnchorElement | null;
		if (button) button.textContent = block.settings.label;
		if (link) link.href = block.settings.href;
		return;
	}
	if (block.type === "heroButtonSecondary") {
		const button = blockNode.querySelector("[data-theme-field='heroButtonSecondary.label']");
		const link = blockNode.querySelector(
			"[data-theme-field='heroButtonSecondary.link']",
		) as HTMLAnchorElement | null;
		if (button) button.textContent = block.settings.label;
		if (link) link.href = block.settings.href;
		return;
	}
	const media = blockNode.querySelector("[data-theme-field='heroMedia.image']") as HTMLElement | null;
	const overlay = blockNode.querySelector("[data-theme-field='heroMedia.overlay']") as HTMLElement | null;
	if (media) {
		media.style.backgroundImage = block.settings.image ? `url(${block.settings.image})` : "none";
	}
	if (overlay) {
		const opacity =
			typeof block.settings.overlayOpacity === "number" ? block.settings.overlayOpacity / 100 : 0.4;
		overlay.style.backgroundColor = block.settings.image ? `rgba(0,0,0,${opacity})` : "transparent";
	}
}

function applyHeroSnapshot(sectionNode: Element, section: Extract<ThemeSectionInstance, { type: "hero" }>) {
	const root = sectionNode.querySelector("[data-theme-hero-root]") as HTMLElement | null;
	if (root) {
		if (section.settings.backgroundColor) {
			root.style.backgroundColor = section.settings.backgroundColor;
		} else {
			root.style.backgroundColor = "";
		}
		if (section.settings.foregroundColor) {
			root.style.color = section.settings.foregroundColor;
		} else {
			root.style.color = "";
		}
	}

	const blocksContainer = sectionNode.querySelector("[data-theme-hero-blocks]");
	if (!blocksContainer) {
		return false;
	}

	const blocks = section.blocks ?? [];
	const enabledIds = new Set(blocks.filter((block) => !block.disabled).map((block) => block.id));

	for (const blockNode of sectionNode.querySelectorAll("[data-theme-block-id]")) {
		const nodeId = blockNode.getAttribute("data-theme-block-id");
		const shouldShow = nodeId ? enabledIds.has(nodeId) : false;
		(blockNode as HTMLElement).style.display = shouldShow ? "" : "none";
	}

	let needsReload = false;
	for (const block of blocks) {
		if (block.disabled) continue;
		const blockNode = sectionNode.querySelector(`[data-theme-block-id='${block.id}']`);
		if (!blockNode) {
			needsReload = true;
			continue;
		}
		if (blockNode.parentElement === blocksContainer) {
			blocksContainer.appendChild(blockNode);
		}
		applyHeroBlockSnapshot(blockNode, block);
	}

	return needsReload;
}

export function applyRichTextSnapshot(
	sectionNode: Element,
	section: Extract<ThemeSectionInstance, { type: "richText" }>,
) {
	const contentNode = sectionNode.querySelector("[data-theme-field='richText.contentHtml']");
	if (contentNode) {
		contentNode.innerHTML = sanitizeImageWithTextHtml(section.settings.contentHtml || "");
		contentNode.classList.add("theme-rich-text");

		// Handle alignment change
		const alignClasses = ["text-left", "text-center", "text-right"];
		const currentAlign = alignClasses.find((c) => contentNode.classList.contains(c));
		const nextAlign = `text-${section.settings.textAlign || "center"}`;

		if (currentAlign && currentAlign !== nextAlign) {
			contentNode.classList.remove(currentAlign);
			contentNode.classList.add(nextAlign);
		} else if (!currentAlign) {
			contentNode.classList.add(nextAlign);
		}
	}
	return false;
}

function renderImageSurfaceContent(section: Extract<ThemeSectionInstance, { type: "imageWithText" }>) {
	const { hasImage } = getImageWithTextDerivedState(section.settings);
	if (!hasImage) {
		return `<div data-theme-slot="imageWithText.imagePlaceholder" class="${getImageWithTextMediaPlaceholderClass()}">Image</div>`;
	}

	return `<img data-theme-field="imageWithText.image" class="h-full w-full object-cover" src="${escapeHtmlAttribute(section.settings.image || "")}" alt="${escapeHtmlAttribute(section.settings.title)}">`;
}

export function renderVideoSurfaceContent(section: Extract<ThemeSectionInstance, { type: "imageWithText" }>) {
	const { hasVideo } = getImageWithTextDerivedState(section.settings);
	if (!hasVideo) {
		return `<div data-theme-slot="imageWithText.videoPlaceholder" class="${getImageWithTextMediaPlaceholderClass()}">Video</div>`;
	}

	const attrs = [
		`data-theme-field="imageWithText.video"`,
		`class="h-full w-full object-cover"`,
		`src="${escapeHtmlAttribute(section.settings.videoUrl || "")}"`,
		"playsinline",
		'preload="metadata"',
	];

	if (section.settings.videoPoster) {
		attrs.push(`poster="${escapeHtmlAttribute(section.settings.videoPoster)}"`);
	}
	if (section.settings.videoAutoplay) {
		attrs.push("autoplay");
	}
	if (section.settings.videoAutoplay || section.settings.videoMuted) {
		attrs.push("muted");
	}
	if (section.settings.videoLoop) {
		attrs.push("loop");
	}
	if (section.settings.videoControls) {
		attrs.push("controls");
	}

	return [
		`<video ${attrs.join(" ")}></video>`,
		`<div data-theme-slot="imageWithText.videoDecodeFallback" class="${THEME_VIDEO_FALLBACK_CLASS_NAME}" hidden>${escapeHtmlContent(THEME_VIDEO_DECODE_ERROR_MESSAGE)}</div>`,
	].join("");
}

function setImageWithTextVideoState(
	videoSurface: HTMLElement,
	state: "idle" | "loading" | "ready" | "error",
) {
	videoSurface.dataset.videoState = state;

	if (typeof videoSurface.querySelector !== "function") {
		return;
	}

	const fallback = videoSurface.querySelector(
		"[data-theme-slot='imageWithText.videoDecodeFallback']",
	) as HTMLElement | null;
	const video = videoSurface.querySelector(
		"[data-theme-field='imageWithText.video']",
	) as HTMLVideoElement | null;

	if (fallback) {
		fallback.hidden = state !== "error";
	}

	if (video) {
		video.style.display = state === "error" ? "none" : "";
	}
}

function attachImageWithTextVideoState(videoSurface: HTMLElement) {
	if (typeof videoSurface.querySelector !== "function") {
		return;
	}

	const video = videoSurface.querySelector(
		"[data-theme-field='imageWithText.video']",
	) as HTMLVideoElement | null;
	if (!video) {
		setImageWithTextVideoState(videoSurface, getThemeVideoInitialPlaybackState(null));
		return;
	}

	const applyReadyState = () => setImageWithTextVideoState(videoSurface, getThemeVideoReadyPlaybackState());
	const applyErrorState = () => setImageWithTextVideoState(videoSurface, getThemeVideoErrorPlaybackState());

	setImageWithTextVideoState(
		videoSurface,
		getThemeVideoInitialPlaybackState(video.currentSrc || video.getAttribute("src")),
	);

	video.addEventListener("loadedmetadata", applyReadyState);
	video.addEventListener("canplay", applyReadyState);
	video.addEventListener("error", applyErrorState);

	if (video.error) {
		applyErrorState();
		return;
	}

	if (video.readyState > 0) {
		applyReadyState();
	}
}

function applyImageWithTextSnapshotInternal(
	sectionNode: Element,
	section: Extract<ThemeSectionInstance, { type: "imageWithText" }>,
) {
	const rootNode = sectionNode.querySelector("[data-theme-image-text-root]") as HTMLElement | null;
	const mediaContainer = sectionNode.querySelector("[data-theme-media-container]") as HTMLElement | null;
	const textContainer = sectionNode.querySelector("[data-theme-text-container]") as HTMLElement | null;
	const ctaContainer = sectionNode.querySelector("[data-theme-cta-container]") as HTMLElement | null;
	const eyebrowNode = sectionNode.querySelector(
		"[data-theme-field='imageWithText.eyebrow']",
	) as HTMLElement | null;
	const titleNode = sectionNode.querySelector(
		"[data-theme-field='imageWithText.title']",
	) as HTMLElement | null;
	const bodyNode = sectionNode.querySelector(
		"[data-theme-field='imageWithText.bodyHtml']",
	) as HTMLElement | null;
	const primaryLinkNode = sectionNode.querySelector(
		"[data-theme-field='imageWithText.primaryButtonLink']",
	) as HTMLAnchorElement | null;
	const primaryButtonNode = sectionNode.querySelector(
		"[data-theme-field='imageWithText.primaryButtonLabel']",
	) as HTMLElement | null;
	const secondaryLinkNode = sectionNode.querySelector(
		"[data-theme-field='imageWithText.secondaryButtonLink']",
	) as HTMLAnchorElement | null;
	const secondaryButtonNode = sectionNode.querySelector(
		"[data-theme-field='imageWithText.secondaryButtonLabel']",
	) as HTMLElement | null;
	const imageSurface = sectionNode.querySelector(
		"[data-theme-slot='imageWithText.imageSurface']",
	) as HTMLElement | null;
	const videoSurface = sectionNode.querySelector(
		"[data-theme-slot='imageWithText.videoSurface']",
	) as HTMLElement | null;

	if (
		!rootNode ||
		!mediaContainer ||
		!textContainer ||
		!eyebrowNode ||
		!titleNode ||
		!bodyNode ||
		!primaryLinkNode ||
		!primaryButtonNode ||
		!secondaryLinkNode ||
		!secondaryButtonNode ||
		!imageSurface ||
		!videoSurface
	) {
		return "missing_runtime_slot" as const;
	}

	const { sanitizedBodyHtml, hasEyebrow, hasPrimaryCta, hasSecondaryCta, hasVisibleCtas } =
		getImageWithTextDerivedState(section.settings);

	rootNode.dataset.layoutVariant = section.settings.layoutVariant;
	rootNode.dataset.verticalAlign = section.settings.verticalAlign;
	rootNode.className = getImageWithTextRootClass(section.settings);

	mediaContainer.dataset.mediaKind = section.settings.mediaKind;
	mediaContainer.dataset.mediaPosition = section.settings.mediaPosition;
	mediaContainer.dataset.mediaAspectRatio = section.settings.mediaAspectRatio;
	mediaContainer.className = getImageWithTextMediaContainerClass(section.settings);

	textContainer.dataset.textAlign = section.settings.textAlign;
	textContainer.dataset.contentWidth = section.settings.contentWidth;
	textContainer.className = getImageWithTextTextContainerClass(section.settings);

	eyebrowNode.textContent = section.settings.eyebrow || "";
	eyebrowNode.className = getImageWithTextEyebrowClass(hasEyebrow);
	eyebrowNode.setAttribute("aria-hidden", hasEyebrow ? "false" : "true");

	titleNode.textContent = section.settings.title;
	bodyNode.innerHTML = sanitizedBodyHtml;
	bodyNode.classList.add("theme-rich-text");

	if (ctaContainer) {
		ctaContainer.className = getImageWithTextCtaContainerClass(hasVisibleCtas);
		ctaContainer.setAttribute("aria-hidden", hasVisibleCtas ? "false" : "true");
	}

	primaryLinkNode.href = section.settings.primaryButtonHref || "#";
	primaryLinkNode.className = getImageWithTextCtaClass("primary", hasPrimaryCta);
	primaryLinkNode.setAttribute("aria-hidden", hasPrimaryCta ? "false" : "true");
	if (hasPrimaryCta) {
		primaryLinkNode.removeAttribute("tabindex");
	} else {
		primaryLinkNode.setAttribute("tabindex", "-1");
	}
	primaryButtonNode.textContent = section.settings.primaryButtonLabel;

	secondaryLinkNode.href = section.settings.secondaryButtonHref || "#";
	secondaryLinkNode.className = getImageWithTextCtaClass("secondary", hasSecondaryCta);
	secondaryLinkNode.setAttribute("aria-hidden", hasSecondaryCta ? "false" : "true");
	if (hasSecondaryCta) {
		secondaryLinkNode.removeAttribute("tabindex");
	} else {
		secondaryLinkNode.setAttribute("tabindex", "-1");
	}
	secondaryButtonNode.textContent = section.settings.secondaryButtonLabel;

	imageSurface.className = getImageWithTextMediaSurfaceClass("image", section.settings.mediaKind);
	videoSurface.className = getImageWithTextMediaSurfaceClass("video", section.settings.mediaKind);
	imageSurface.innerHTML = renderImageSurfaceContent(section);
	videoSurface.innerHTML = renderVideoSurfaceContent(section);
	attachImageWithTextVideoState(videoSurface);

	return null;
}

export function applyImageWithTextSnapshot(
	sectionNode: Element,
	section: Extract<ThemeSectionInstance, { type: "imageWithText" }>,
) {
	return applyImageWithTextSnapshotInternal(sectionNode, section) !== null;
}

function applyNewsletterSnapshot(
	sectionNode: Element,
	section: Extract<ThemeSectionInstance, { type: "newsletter" }>,
) {
	const titleNode = sectionNode.querySelector("[data-theme-field='newsletter.title']");
	const descriptionNode = sectionNode.querySelector("[data-theme-field='newsletter.description']");
	const buttonNode = sectionNode.querySelector("[data-theme-field='newsletter.buttonLabel']");
	const inputNode = sectionNode.querySelector(
		"[data-theme-field='newsletter.placeholder']",
	) as HTMLInputElement | null;

	if (titleNode) titleNode.textContent = section.settings.title;
	if (descriptionNode) descriptionNode.textContent = section.settings.description;
	if (buttonNode) buttonNode.textContent = section.settings.buttonLabel;
	if (inputNode) inputNode.placeholder = section.settings.placeholder;

	return false;
}

function applyProductGridSnapshot(
	sectionNode: Element,
	section: Extract<ThemeSectionInstance, { type: "productGrid" }>,
) {
	const titleNode = sectionNode.querySelector("[data-theme-field='productGrid.title']");
	const descriptionNode = sectionNode.querySelector("[data-theme-field='productGrid.description']");
	const viewAllLink = sectionNode.querySelector(
		"[data-theme-field='productGrid.viewAllLink']",
	) as HTMLAnchorElement | null;

	if (titleNode) titleNode.textContent = section.settings.title;
	if (descriptionNode) descriptionNode.textContent = section.settings.description;
	if (viewAllLink) viewAllLink.href = section.settings.viewAllHref;

	return false;
}

export function computeTemplateStructureState(template: ThemeTemplate, renderedSectionIds: string[]) {
	const expectedSectionIds = template.order.filter((sectionId) => Boolean(template.sections[sectionId]));
	const expectedSet = new Set(expectedSectionIds);
	const renderedIds = renderedSectionIds.filter((sectionId) => sectionId.trim().length > 0);
	const renderedKnownIds = renderedIds.filter((sectionId) => expectedSet.has(sectionId));
	const staleSectionIds = renderedIds.filter((sectionId) => !expectedSet.has(sectionId));
	const missingSectionIds = expectedSectionIds.filter((sectionId) => !renderedKnownIds.includes(sectionId));
	const hasOrderMismatch =
		expectedSectionIds.length !== renderedKnownIds.length ||
		expectedSectionIds.some((sectionId, index) => renderedKnownIds[index] !== sectionId);

	return {
		expectedSectionIds,
		missingSectionIds,
		staleSectionIds,
		hasOrderMismatch,
	};
}

function applyTemplateSnapshot(
	contentModel: ThemeContentModel,
	activeTemplate: keyof ThemeContentModel["templates"],
) {
	const template = contentModel.templates[activeTemplate];
	if (!template) {
		return { needsReload: false, reason: undefined };
	}

	const sectionNodes = Array.from(
		document.querySelectorAll(`[data-theme-template-key='${activeTemplate}'][data-theme-section-id]`),
	) as HTMLElement[];
	const sectionNodesById = sectionNodes.reduce<Map<string, HTMLElement>>((acc, node) => {
		const sectionId = node.dataset.themeSectionId;
		if (sectionId) {
			acc.set(sectionId, node);
		}
		return acc;
	}, new Map());
	const structureState = computeTemplateStructureState(template, Array.from(sectionNodesById.keys()));
	const staleIds = new Set(structureState.staleSectionIds);
	for (const sectionNode of sectionNodes) {
		const sectionId = sectionNode.dataset.themeSectionId;
		if (sectionId && staleIds.has(sectionId)) {
			sectionNode.style.display = "none";
		}
	}

	let needsReload = false;
	let reloadReason:
		| "template_structure_changed"
		| "missing_runtime_slot"
		| "unsupported_runtime_patch"
		| undefined;
	if (structureState.missingSectionIds.length > 0 || structureState.hasOrderMismatch) {
		needsReload = true;
		reloadReason = "template_structure_changed";
	}

	for (const sectionId of template.order) {
		const section = template.sections[sectionId];
		if (!section) continue;
		const sectionNode = sectionNodesById.get(section.id);
		if (!sectionNode) {
			needsReload = true;
			reloadReason ??= "template_structure_changed";
			continue;
		}

		sectionNode.style.display = section.disabled ? "none" : "";
		if (section.disabled) continue;

		if (section.type === "hero") {
			needsReload = applyHeroSnapshot(sectionNode, section) || needsReload;
			continue;
		}
		if (section.type === "richText") {
			needsReload = applyRichTextSnapshot(sectionNode, section) || needsReload;
			continue;
		}
		if (section.type === "imageWithText") {
			const imageWithTextReason = applyImageWithTextSnapshotInternal(sectionNode, section);
			if (imageWithTextReason) {
				needsReload = true;
				reloadReason ??= imageWithTextReason;
			}
			continue;
		}
		if (section.type === "newsletter") {
			needsReload = applyNewsletterSnapshot(sectionNode, section) || needsReload;
			continue;
		}
		if (section.type === "productGrid") {
			needsReload = applyProductGridSnapshot(sectionNode, section) || needsReload;
		}
	}

	return {
		needsReload,
		reason: reloadReason,
	};
}

function resolveExpectedStudioOrigin() {
	const params = new URLSearchParams(window.location.search);
	const originParam = params.get("themePreviewStudioOrigin");
	if (!originParam) {
		return null;
	}
	try {
		return new URL(originParam).origin;
	} catch {
		return null;
	}
}

function toTemplateKey(value: string | undefined): ThemeTemplateKey | null {
	if (
		value === "home" ||
		value === "product" ||
		value === "collection" ||
		value === "category" ||
		value === "checkout"
	) {
		return value;
	}
	return null;
}

export function ThemePreviewRuntimeBridge() {
	const isEnabledRef = useRef(false);
	const framePendingRef = useRef<number | null>(null);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (params.get("themePreview") !== "1") {
			return;
		}
		if (window.parent === window) {
			return;
		}
		isEnabledRef.current = true;

		const expectedStudioOrigin = resolveExpectedStudioOrigin();
		const canAcceptOrigin = (origin: string) => {
			if (!expectedStudioOrigin) {
				return true;
			}
			return origin === expectedStudioOrigin;
		};

		const handleMessage = (event: MessageEvent) => {
			if (!canAcceptOrigin(event.origin)) {
				return;
			}

			const message = parseThemePreviewStudioToRuntimeMessage(event.data);
			if (!message) {
				return;
			}

			if (message.type === "THEME_PREVIEW_FOCUS_SECTION") {
				const node = document.querySelector(
					`[data-theme-template-key='${message.payload.templateKey}'][data-theme-section-id='${message.payload.sectionId}']`,
				) as HTMLElement | null;
				if (!node) return;
				node.scrollIntoView({ behavior: "smooth", block: "center" });
				node.style.outline = "3px solid #ff2d2d";
				window.setTimeout(() => {
					node.style.outline = "";
				}, 800);
				return;
			}

			if (framePendingRef.current !== null) {
				window.cancelAnimationFrame(framePendingRef.current);
				framePendingRef.current = null;
			}

			framePendingRef.current = window.requestAnimationFrame(() => {
				applyCssSnapshot(message.payload.styleTokens);
				const snapshotResult = applyTemplateSnapshot(
					message.payload.contentModel,
					message.payload.activeTemplate,
				);

				if (snapshotResult.needsReload) {
					postToParent(
						{
							type: "THEME_PREVIEW_RELOAD_REQUIRED",
							protocolVersion: THEME_PREVIEW_PROTOCOL_VERSION,
							payload: { reason: snapshotResult.reason },
						},
						expectedStudioOrigin || "*",
					);
				}
			});
		};

		const handleClick = (event: MouseEvent) => {
			if (!isEnabledRef.current) return;
			const target = event.target as HTMLElement | null;
			const sectionNode = target?.closest(
				"[data-theme-template-key][data-theme-section-id]",
			) as HTMLElement | null;
			if (!sectionNode) return;

			const sectionId = sectionNode.dataset.themeSectionId;
			const templateKey = toTemplateKey(sectionNode.dataset.themeTemplateKey);
			if (!sectionId || !templateKey) return;

			postToParent(
				{
					type: "THEME_PREVIEW_SECTION_CLICK",
					protocolVersion: THEME_PREVIEW_PROTOCOL_VERSION,
					payload: { sectionId, templateKey },
				},
				expectedStudioOrigin || "*",
			);
		};

		window.addEventListener("message", handleMessage);
		document.addEventListener("click", handleClick, true);
		postToParent(
			{
				type: "THEME_PREVIEW_READY",
				protocolVersion: THEME_PREVIEW_PROTOCOL_VERSION,
			},
			expectedStudioOrigin || "*",
		);

		return () => {
			window.removeEventListener("message", handleMessage);
			document.removeEventListener("click", handleClick, true);
			if (framePendingRef.current !== null) {
				window.cancelAnimationFrame(framePendingRef.current);
			}
		};
	}, []);

	return null;
}
