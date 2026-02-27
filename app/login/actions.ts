"use server";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createSession } from "@/lib/auth";
import { globalDb } from "@/lib/db";
import { users } from "@/lib/db/schema_global";
import { generateOTP, verifyOTP } from "@/lib/verification";

export async function requestLoginOTP(formData: FormData) {
	const phone = (formData.get("phone") as string)?.trim().replace(/\s/g, "");
	if (!phone) throw new Error("Le numéro de téléphone est requis.");

	// We use null as the 'storeId' for global authentication
	// The 'phone' acts as the secure identifier for the OTP
	await generateOTP(null, phone, "user_login", phone);
	return { success: true };
}

export async function verifyLoginAndCreateSession(formData: FormData) {
	try {
		const phone = (formData.get("phone") as string)?.trim().replace(/\s/g, "");
		const code = (formData.get("code") as string)?.trim().replace(/\s/g, "");

		console.log(`[LOGIN ATTEMPT] Phone: '${phone}', Code: '${code}'`);

		if (!phone || !code) throw new Error("Numéro et code requis.");

		// 1. Verify OTP using the phone number as identifier
		const isValid = await verifyOTP(null, phone, code, "user_login");
		console.log(`[LOGIN ATTEMPT] verifyOTP result for ${phone}: ${isValid}`);

		if (!isValid) throw new Error("Code de vérification invalide ou expiré.");

		// 2. Check if user exists or create new
		let user = await globalDb.query.users.findFirst({
			where: eq(users.phone, phone),
		});

		if (!user) {
			console.log(`[LOGIN ATTEMPT] Creating new user for ${phone}`);
			const newUserId = `usr_${nanoid()}`;
			await globalDb.insert(users).values({
				id: newUserId,
				phone,
				role: "MERCHANT",
			});
			user = { id: newUserId, phone, role: "MERCHANT", createdAt: new Date() };
		} else {
			console.log(`[LOGIN ATTEMPT] Found existing user ${user.id} with role ${user.role}`);
		}

		// 3. Create Session
		console.log(`[LOGIN ATTEMPT] Creating session for ${user.id}...`);
		await createSession(user.id, user.phone, user.role);

		console.log(`[LOGIN ATTEMPT] Success! Redirecting...`);
		const redirectUrl = user.role === "ADMIN" ? "/admin" : "/select-store";
		return { success: true, redirectUrl };
	} catch (error: unknown) {
		console.error("[LOGIN CRITICAL ERROR]", error);
		// Return friendly error to client instead of 500
		throw new Error(
			error instanceof Error ? error.message : "Une erreur inattendue est survenue lors de la connexion.",
		);
	}
}
