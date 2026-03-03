import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getTenantDb } from "@/lib/db";
import { storeSettings, storeThemeAssignments, storeThemeVersions } from "@/lib/db/schema_tenant";
import type { ThemeBuilderData, ThemeContentModel, ThemeStyleTokens, ThemeVersion } from "@/lib/theme-types";
import {
	createDefaultThemeContentModel,
	DEFAULT_THEME_STYLE_TOKENS,
	getGoogleFontUrl,
	hasActiveSections,
	legacyThemeContentToV2,
	parseLegacyThemeContentModel,
	toRenderSafeThemeContentModel,
	toStorefrontCssVariables,
	validateThemeContentModel,
	validateThemeStyleTokens,
} from "@/lib/theme-utils";

const THEME_ASSIGNMENT_ROW_ID = 1;
const PUBLISHED_HISTORY_LIMIT = 20;

type ThemeVersionRow = typeof storeThemeVersions.$inferSelect;

type ThemeDraftPatch = {
	styleTokens?: Partial<ThemeStyleTokens>;
	contentModel?: Partial<ThemeContentModel>;
};

type ThemeState = {
	draft: ThemeVersionRow;
	published: ThemeVersionRow;
};

type StoreSettingsRow = typeof storeSettings.$inferSelect;

function createLegacyContentFromSettings(settings: typeof storeSettings.$inferSelect | null | undefined) {
	const brandName = settings?.name?.trim() || "My Store";
	const defaults = createDefaultThemeContentModel(brandName);
	const homeTemplate = defaults.templates.home;
	const heroSectionId = homeTemplate.order[0];
	const productGridSectionId = homeTemplate.order[1];
	const heroSection = heroSectionId ? homeTemplate.sections[heroSectionId] : null;
	const productGridSection = productGridSectionId ? homeTemplate.sections[productGridSectionId] : null;

	if (heroSection?.type === "hero") {
		heroSection.settings = {
			title: settings?.heroTitle || heroSection.settings.title,
			subtitle: settings?.heroSubtitle || heroSection.settings.subtitle,
			image: settings?.heroImage || heroSection.settings.image,
			primaryCtaLabel: heroSection.settings.primaryCtaLabel,
			primaryCtaHref: heroSection.settings.primaryCtaHref,
			secondaryCtaLabel: heroSection.settings.secondaryCtaLabel,
			secondaryCtaHref: heroSection.settings.secondaryCtaHref,
		};
	}

	if (productGridSection?.type === "productGrid") {
		productGridSection.settings = {
			...productGridSection.settings,
			collectionId: settings?.featuredCollectionId || null,
		};
	}

	defaults.globals = {
		brandName,
		brandTagline: defaults.globals.brandTagline,
		footerDescription:
			"Votre destination premium pour les maillots officiels, survetements et sneakers de performance.",
		footerCopyright: `${brandName}. Tous droits reserves.`,
	};

	try {
		return validateThemeContentModel(defaults);
	} catch (err) {
		console.error("[Theme] createLegacyContentFromSettings validation failed, using raw defaults.", err);
		return defaults as ThemeContentModel;
	}
}

function parseThemeStyle(styleJson: ThemeVersionRow["styleJson"]) {
	try {
		return validateThemeStyleTokens(styleJson);
	} catch {
		return DEFAULT_THEME_STYLE_TOKENS;
	}
}

function parseThemeContent(contentJson: ThemeVersionRow["contentJson"], fallbackStoreName: string) {
	if (!contentJson || typeof contentJson !== "object") {
		return createDefaultThemeContentModel(fallbackStoreName);
	}

	const isV2 = "globals" in contentJson && "templates" in contentJson;

	if (isV2) {
		try {
			return validateThemeContentModel(contentJson);
		} catch (err) {
			console.error(
				"[Theme] validateThemeContentModel failed for V2 content, trying legacy fallback...",
				err,
			);
			// Fall through to legacy check if V2 validation fails
		}
	}

	try {
		const legacy = parseLegacyThemeContentModel(contentJson);
		return validateThemeContentModel(legacyThemeContentToV2(legacy));
	} catch (err2) {
		if (isV2) {
			console.error("[Theme] parseLegacyThemeContentModel also failed for V2 content, using defaults.");
		} else {
			console.error("[Theme] parseLegacyThemeContentModel failed for legacy content, using defaults.", err2);
		}
		return createDefaultThemeContentModel(fallbackStoreName);
	}
}

function mapVersion(row: ThemeVersionRow, fallbackStoreName: string): ThemeVersion {
	return {
		id: row.id,
		versionNumber: row.versionNumber,
		kind: row.kind === "published" ? "published" : "draft",
		styleTokens: parseThemeStyle(row.styleJson),
		contentModel: parseThemeContent(row.contentJson, fallbackStoreName),
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		publishedAt: row.publishedAt,
	};
}

function createFallbackPublishedThemeVersion(settings: StoreSettingsRow | null | undefined): ThemeVersion {
	const fallbackStoreName = settings?.name?.trim() || "My Store";
	return {
		id: "thm_fallback_published",
		versionNumber: 0,
		kind: "published",
		styleTokens: DEFAULT_THEME_STYLE_TOKENS,
		contentModel: createLegacyContentFromSettings(settings),
		createdAt: null,
		updatedAt: null,
		publishedAt: null,
	};
}

async function getStoreSettingsByStoreId(storeId: string) {
	const db = await getTenantDb(storeId);
	return db.query.storeSettings.findFirst();
}

async function getOrCreateStoreSettings(storeId: string) {
	const existing = await getStoreSettingsByStoreId(storeId);
	if (existing) return existing;

	const db = await getTenantDb(storeId);

	const [created] = await db
		.insert(storeSettings)
		.values({
			name: "My Store",
			currency: "XOF",
			language: "English (US)",
		})
		.returning();

	return created;
}

async function insertVersion(
	storeId: string,
	input: {
		versionNumber: number;
		kind: "draft" | "published";
		styleTokens: ThemeStyleTokens;
		contentModel: ThemeContentModel;
		publishedAt?: Date | null;
	},
) {
	const db = await getTenantDb(storeId);
	const [inserted] = await db
		.insert(storeThemeVersions)
		.values({
			id: `thm_${nanoid(16)}`,
			versionNumber: input.versionNumber,
			kind: input.kind,
			styleJson: input.styleTokens,
			contentJson: input.contentModel,
			publishedAt: input.publishedAt || null,
		})
		.returning();

	return inserted;
}

async function getLatestVersionNumber(storeId: string) {
	const db = await getTenantDb(storeId);
	const latest = await db.query.storeThemeVersions.findFirst({
		orderBy: (table, { desc: descFn }) => [descFn(table.versionNumber)],
	});
	return latest?.versionNumber || 0;
}

async function setAssignments(storeId: string, draftVersionId: string, publishedVersionId: string) {
	const db = await getTenantDb(storeId);
	const current = await db.query.storeThemeAssignments.findFirst({
		where: eq(storeThemeAssignments.id, THEME_ASSIGNMENT_ROW_ID),
	});

	if (current?.draftVersionId === draftVersionId && current?.publishedVersionId === publishedVersionId) {
		return;
	}

	await db
		.insert(storeThemeAssignments)
		.values({
			id: THEME_ASSIGNMENT_ROW_ID,
			draftVersionId,
			publishedVersionId,
		})
		.onConflictDoUpdate({
			target: storeThemeAssignments.id,
			set: {
				draftVersionId,
				publishedVersionId,
				updatedAt: new Date(),
			},
		});
}

async function purgePublishedHistory(storeId: string, keepIds: string[]) {
	const db = await getTenantDb(storeId);
	const publishedVersions = await db.query.storeThemeVersions.findMany({
		where: eq(storeThemeVersions.kind, "published"),
		orderBy: (table, { desc: descFn }) => [descFn(table.versionNumber)],
	});

	if (publishedVersions.length <= PUBLISHED_HISTORY_LIMIT) return;

	const removable = publishedVersions
		.slice(PUBLISHED_HISTORY_LIMIT)
		.map((version) => version.id)
		.filter((versionId) => !keepIds.includes(versionId));

	if (removable.length === 0) return;

	await db.delete(storeThemeVersions).where(inArray(storeThemeVersions.id, removable));
}

async function replaceActiveDraft(
	storeId: string,
	currentDraftId: string | null | undefined,
	nextDraftId: string,
) {
	if (!currentDraftId || currentDraftId === nextDraftId) return;

	const db = await getTenantDb(storeId);
	await db.delete(storeThemeVersions).where(eq(storeThemeVersions.id, currentDraftId));
}

function resolveStateFromRows(
	allVersions: ThemeVersionRow[],
	assignment: typeof storeThemeAssignments.$inferSelect | undefined,
) {
	const publishedFromAssignment =
		assignment?.publishedVersionId &&
		allVersions.find(
			(version) => version.id === assignment.publishedVersionId && version.kind === "published",
		);
	const draftFromAssignment =
		assignment?.draftVersionId &&
		allVersions.find((version) => version.id === assignment.draftVersionId && version.kind === "draft");

	return {
		published: publishedFromAssignment || allVersions.find((version) => version.kind === "published") || null,
		draft: draftFromAssignment || allVersions.find((version) => version.kind === "draft") || null,
	};
}

export async function ensureThemeStateByStoreId(storeId: string): Promise<ThemeState> {
	const settings = await getOrCreateStoreSettings(storeId);
	const db = await getTenantDb(storeId);
	const assignment = await db.query.storeThemeAssignments.findFirst({
		where: eq(storeThemeAssignments.id, THEME_ASSIGNMENT_ROW_ID),
	});

	const allVersions = await db.query.storeThemeVersions.findMany({
		orderBy: (table, { desc: descFn }) => [descFn(table.versionNumber)],
	});

	const fallbackStyle = DEFAULT_THEME_STYLE_TOKENS;
	const fallbackContent = createLegacyContentFromSettings(settings);
	const resolved = resolveStateFromRows(allVersions, assignment);

	let published = resolved.published;

	if (!published) {
		const nextVersionNumber = (allVersions[0]?.versionNumber || 0) + 1;
		published = await insertVersion(storeId, {
			versionNumber: nextVersionNumber,
			kind: "published",
			styleTokens: fallbackStyle,
			contentModel: fallbackContent,
			publishedAt: new Date(),
		});
	}

	let draft = resolved.draft;

	if (!draft) {
		const nextVersionNumber = (await getLatestVersionNumber(storeId)) + 1;
		draft = await insertVersion(storeId, {
			versionNumber: nextVersionNumber,
			kind: "draft",
			styleTokens: parseThemeStyle(published.styleJson),
			contentModel: parseThemeContent(published.contentJson, settings.name),
		});
	}

	await setAssignments(storeId, draft.id, published.id);
	return { draft, published };
}

async function getCurrentThemeState(storeId: string): Promise<ThemeState> {
	const ensured = await ensureThemeStateByStoreId(storeId);
	const db = await getTenantDb(storeId);
	const assignment = await db.query.storeThemeAssignments.findFirst({
		where: eq(storeThemeAssignments.id, THEME_ASSIGNMENT_ROW_ID),
	});

	if (!assignment?.draftVersionId || !assignment?.publishedVersionId) {
		return ensured;
	}

	const [draft, published] = await Promise.all([
		db.query.storeThemeVersions.findFirst({
			where: and(eq(storeThemeVersions.id, assignment.draftVersionId), eq(storeThemeVersions.kind, "draft")),
		}),
		db.query.storeThemeVersions.findFirst({
			where: and(
				eq(storeThemeVersions.id, assignment.publishedVersionId),
				eq(storeThemeVersions.kind, "published"),
			),
		}),
	]);

	return {
		draft: draft || ensured.draft,
		published: published || ensured.published,
	};
}

export async function getThemeBuilderDataByStoreId(storeId: string): Promise<ThemeBuilderData> {
	const settings = await getOrCreateStoreSettings(storeId);
	const state = await getCurrentThemeState(storeId);
	const db = await getTenantDb(storeId);
	const historyRows = await db.query.storeThemeVersions.findMany({
		where: eq(storeThemeVersions.kind, "published"),
		orderBy: (table, { desc: descFn }) => [descFn(table.versionNumber)],
		limit: PUBLISHED_HISTORY_LIMIT,
	});

	return {
		draft: mapVersion(state.draft, settings.name),
		published: mapVersion(state.published, settings.name),
		history: historyRows.map((row) => mapVersion(row, settings.name)),
	};
}

export async function updateThemeDraftByStoreId(storeId: string, patch: ThemeDraftPatch) {
	const settings = await getOrCreateStoreSettings(storeId);
	const state = await getCurrentThemeState(storeId);
	const db = await getTenantDb(storeId);
	const currentStyle = parseThemeStyle(state.draft.styleJson);
	const currentContent = parseThemeContent(state.draft.contentJson, settings.name);

	const nextStyle = validateThemeStyleTokens({
		...currentStyle,
		...(patch.styleTokens || {}),
	});
	const nextContent = validateThemeContentModel({
		...currentContent,
		...(patch.contentModel || {}),
	});

	await db
		.update(storeThemeVersions)
		.set({
			styleJson: nextStyle,
			contentJson: nextContent,
			updatedAt: new Date(),
		})
		.where(eq(storeThemeVersions.id, state.draft.id));

	const updatedDraft = await db.query.storeThemeVersions.findFirst({
		where: eq(storeThemeVersions.id, state.draft.id),
	});

	if (!updatedDraft) {
		throw new Error("Draft introuvable apres mise a jour.");
	}

	return mapVersion(updatedDraft, settings.name);
}

export async function createDraftFromPublishedByStoreId(storeId: string) {
	const settings = await getOrCreateStoreSettings(storeId);
	const state = await getCurrentThemeState(storeId);
	const publishedStyle = parseThemeStyle(state.published.styleJson);
	const publishedContent = parseThemeContent(state.published.contentJson, settings.name);
	const nextVersionNumber = (await getLatestVersionNumber(storeId)) + 1;

	const newDraft = await insertVersion(storeId, {
		versionNumber: nextVersionNumber,
		kind: "draft",
		styleTokens: publishedStyle,
		contentModel: publishedContent,
	});

	await setAssignments(storeId, newDraft.id, state.published.id);
	await replaceActiveDraft(storeId, state.draft.id, newDraft.id);

	return mapVersion(newDraft, settings.name);
}

export async function publishThemeDraftByStoreId(storeId: string) {
	const settings = await getOrCreateStoreSettings(storeId);
	const state = await getCurrentThemeState(storeId);
	const draftStyle = parseThemeStyle(state.draft.styleJson);
	const draftContent = parseThemeContent(state.draft.contentJson, settings.name);
	const hasHomeSectionsActive = hasActiveSections(draftContent.templates.home);
	if (!hasHomeSectionsActive) {
		throw new Error(
			"Publication bloquee: la page Accueil n'a aucune section active. Activez au moins une section avant de publier.",
		);
	}
	const publishedVersionNumber = (await getLatestVersionNumber(storeId)) + 1;

	const published = await insertVersion(storeId, {
		versionNumber: publishedVersionNumber,
		kind: "published",
		styleTokens: draftStyle,
		contentModel: draftContent,
		publishedAt: new Date(),
	});

	const draftVersionNumber = publishedVersionNumber + 1;
	const draft = await insertVersion(storeId, {
		versionNumber: draftVersionNumber,
		kind: "draft",
		styleTokens: draftStyle,
		contentModel: draftContent,
	});

	await setAssignments(storeId, draft.id, published.id);
	await replaceActiveDraft(storeId, state.draft.id, draft.id);
	await purgePublishedHistory(storeId, [published.id]);

	return {
		published: mapVersion(published, settings.name),
		draft: mapVersion(draft, settings.name),
	};
}

export async function rollbackThemeByStoreId(storeId: string, versionId: string) {
	const settings = await getOrCreateStoreSettings(storeId);
	const db = await getTenantDb(storeId);
	const state = await getCurrentThemeState(storeId);
	const rollbackTarget = await db.query.storeThemeVersions.findFirst({
		where: and(eq(storeThemeVersions.id, versionId), eq(storeThemeVersions.kind, "published")),
	});

	if (!rollbackTarget) {
		throw new Error("Version de publication introuvable.");
	}

	const rollbackStyle = parseThemeStyle(rollbackTarget.styleJson);
	const rollbackContent = parseThemeContent(rollbackTarget.contentJson, settings.name);
	const nextVersionNumber = (await getLatestVersionNumber(storeId)) + 1;
	const newDraft = await insertVersion(storeId, {
		versionNumber: nextVersionNumber,
		kind: "draft",
		styleTokens: rollbackStyle,
		contentModel: rollbackContent,
	});

	await setAssignments(storeId, newDraft.id, rollbackTarget.id);
	await replaceActiveDraft(storeId, state.draft.id, newDraft.id);
	await purgePublishedHistory(storeId, [rollbackTarget.id]);

	return {
		published: mapVersion(rollbackTarget, settings.name),
		draft: mapVersion(newDraft, settings.name),
	};
}

export async function getPublishedThemeByStoreId(storeId: string) {
	const settings = await getStoreSettingsByStoreId(storeId);
	const fallbackStoreName = settings?.name?.trim() || "My Store";
	const db = await getTenantDb(storeId);
	const assignment = await db.query.storeThemeAssignments.findFirst({
		where: eq(storeThemeAssignments.id, THEME_ASSIGNMENT_ROW_ID),
	});

	const publishedFromAssignment = assignment?.publishedVersionId
		? await db.query.storeThemeVersions.findFirst({
				where: and(
					eq(storeThemeVersions.id, assignment.publishedVersionId),
					eq(storeThemeVersions.kind, "published"),
				),
			})
		: null;
	if (publishedFromAssignment) {
		return mapVersion(publishedFromAssignment, fallbackStoreName);
	}

	const latestPublished = await db.query.storeThemeVersions.findFirst({
		where: eq(storeThemeVersions.kind, "published"),
		orderBy: (table, { desc: descFn }) => [descFn(table.versionNumber)],
	});
	if (latestPublished) {
		return mapVersion(latestPublished, fallbackStoreName);
	}

	return createFallbackPublishedThemeVersion(settings);
}

async function getDraftThemeByStoreId(storeId: string) {
	const settings = await getOrCreateStoreSettings(storeId);
	const state = await getCurrentThemeState(storeId);
	return mapVersion(state.draft, settings.name);
}

interface ResolveStorefrontThemeOptions {
	previewMode?: boolean;
}

export async function resolveStorefrontTheme(storeId: string, options: ResolveStorefrontThemeOptions = {}) {
	const sourceTheme = options.previewMode
		? await getDraftThemeByStoreId(storeId)
		: await getPublishedThemeByStoreId(storeId);
	const renderSafeContent = toRenderSafeThemeContentModel(sourceTheme.contentModel);
	if (renderSafeContent.fallbacks.length > 0) {
		console.warn("theme_runtime_fallback_applied", {
			storeId,
			fallbacks: renderSafeContent.fallbacks,
			previewMode: options.previewMode === true,
		});
	}

	return {
		styleTokens: sourceTheme.styleTokens,
		contentModel: renderSafeContent.contentModel,
		cssVariables: toStorefrontCssVariables(sourceTheme.styleTokens),
		buttonStyle: sourceTheme.styleTokens.buttonStyle ?? "filled",
		googleFontUrl: getGoogleFontUrl(
			sourceTheme.styleTokens.fontFamily,
			sourceTheme.styleTokens.headingFontFamily,
		),
	};
}
