import "server-only";
import { eq } from "drizzle-orm";
import type { JWTPayload } from "jose";
import { jwtVerify, SignJWT } from "jose";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { getJwtSecretOrThrow } from "./auth-secret";
import { globalDb } from "./db";
import { sessions } from "./db/schema_global";

const SECRET_KEY = getJwtSecretOrThrow();
const SESSION_COOKIE_NAME = "yns_auth_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type SessionPayload = {
	userId: string;
	phone: string;
	role: string;
	expiresAt: Date;
};

/**
 * Creates a JWT token, saves the session in DB, and sets the HTTP-only cookie
 */
export async function createSession(userId: string, phone: string, role: string) {
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
	const sessionId = `sess_${nanoid()}`;

	// 1. Save session to Database
	await globalDb.insert(sessions).values({
		id: sessionId,
		userId,
		expiresAt,
	});

	// 2. Create JWT payload
	const payload: SessionPayload = { userId, phone, role, expiresAt };
	const token = await new SignJWT(payload as unknown as JWTPayload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(expiresAt)
		.setJti(sessionId)
		.sign(SECRET_KEY);

	// 3. Set Cookie
	const cookieStore = await cookies();
	cookieStore.set(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		expires: expiresAt,
		path: "/",
	});

	return { sessionId, token };
}

/**
 * Verifies the JWT and returns the parsed payload if valid
 */
export async function verifySession(): Promise<SessionPayload | null> {
	const cookieStore = await cookies();
	const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

	if (!token) return null;

	try {
		const { payload } = await jwtVerify(token, SECRET_KEY);
		// Validate against DB session
		if (payload.jti) {
			const dbSession = await globalDb.query.sessions.findFirst({
				where: eq(sessions.id, payload.jti),
			});
			if (!dbSession || new Date() > dbSession.expiresAt) {
				return null;
			}
		}
		return payload as unknown as SessionPayload;
	} catch (error) {
		console.error("JWT Verification failed:", error);
		return null;
	}
}

/**
 * Deletes the session cookie and DB record
 */
export async function deleteSession() {
	const cookieStore = await cookies();
	const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

	if (token) {
		try {
			const { payload } = await jwtVerify(token, SECRET_KEY);
			if (payload.jti) {
				await globalDb.delete(sessions).where(eq(sessions.id, payload.jti));
			}
		} catch (e) {
			// Token might be expired, just remove cookie
		}
	}

	cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Gets the current store context from cookies (Phase 4 requirement)
 */
export async function getActiveStoreContext() {
	const cookieStore = await cookies();
	return cookieStore.get("active_store_id")?.value || null;
}

/**
 * Sets the current active store context cookie
 */
export async function setActiveStore(storeId: string) {
	const cookieStore = await cookies();
	cookieStore.set("active_store_id", storeId, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		// 30 days like session
		expires: new Date(Date.now() + SESSION_DURATION_MS),
	});
}
