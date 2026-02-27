"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getActiveStoreContext } from "@/lib/auth";
import { getTenantDb } from "@/lib/db";
import { storeSettings } from "@/lib/db/schema_tenant";

async function getDb() {
	const storeId = await getActiveStoreContext();
	if (!storeId) throw new Error("Aucune boutique active.");
	return getTenantDb(storeId);
}

const generalSettingsSchema = z.object({
	name: z.string().min(1, "Store name is required"),
	currency: z.string().min(1, "Currency is required"),
	language: z.string().min(1, "Language is required"),
});

const companyAddressSchema = z.object({
	fullName: z.string().min(1, "Full name is required").optional().or(z.literal("")),
	companyName: z.string().optional().or(z.literal("")),
	taxId: z.string().optional().or(z.literal("")),
	address1: z.string().min(1, "Address is required").optional().or(z.literal("")),
	address2: z.string().optional().or(z.literal("")),
	postalCode: z.string().min(1, "Postal code is required").optional().or(z.literal("")),
	city: z.string().min(1, "City is required").optional().or(z.literal("")),
	state: z.string().optional().or(z.literal("")),
	country: z.string().min(1, "Country is required").optional().or(z.literal("")),
	phone: z.string().optional().or(z.literal("")),
});

export async function getStoreSettings() {
	const db = await getDb();
	let settings = await db.query.storeSettings.findFirst();

	if (!settings) {
		// Initialize default settings if none exist in the tenant DB
		const [newSettings] = await db
			.insert(storeSettings)
			.values({
				name: "My Next Store",
				currency: "XOF",
				language: "English (US)",
			})
			.returning();
		settings = newSettings;
	}

	return settings;
}

export async function updateGeneralSettings(formData: FormData) {
	try {
		const db = await getDb();
		const rawData = {
			name: formData.get("name"),
			currency: formData.get("currency"),
			language: formData.get("language"),
		};

		const validatedData = generalSettingsSchema.parse(rawData);
		await db.update(storeSettings).set(validatedData).run();

		revalidatePath("/manage/settings/general");
		return { success: true };
	} catch (error) {
		console.error("Failed to update general settings:", error);
		if (error instanceof z.ZodError) {
			return { success: false, error: error.issues[0].message };
		}
		return { success: false, error: "An unexpected error occurred." };
	}
}

export async function updateCompanyAddress(formData: FormData) {
	try {
		const db = await getDb();
		const rawData = {
			fullName: formData.get("fullName"),
			companyName: formData.get("companyName"),
			taxId: formData.get("taxId"),
			address1: formData.get("address1"),
			address2: formData.get("address2"),
			postalCode: formData.get("postalCode"),
			city: formData.get("city"),
			state: formData.get("state"),
			country: formData.get("country"),
			phone: formData.get("phone"),
		};

		const validatedData = companyAddressSchema.parse(rawData);
		await db
			.update(storeSettings)
			.set(validatedData as Record<string, unknown>)
			.run();

		revalidatePath("/manage/settings/general");
		return { success: true };
	} catch (error) {
		console.error("Failed to update company address:", error);
		if (error instanceof z.ZodError) {
			return { success: false, error: error.issues[0].message };
		}
		return { success: false, error: "An unexpected error occurred." };
	}
}

export async function updateReferralBadge(showReferralBadge: boolean) {
	try {
		const db = await getDb();
		await db.update(storeSettings).set({ showReferralBadge }).run();

		revalidatePath("/manage/settings/general");
		return { success: true };
	} catch (error) {
		console.error("Failed to update referral badge:", error);
		return { success: false, error: "An unexpected error occurred." };
	}
}
