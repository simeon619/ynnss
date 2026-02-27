import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getJwtSecretOrThrow } from "@/lib/auth-secret";

const SECRET_KEY = getJwtSecretOrThrow();
const SESSION_COOKIE_NAME = "yns_auth_session";

export async function proxy(request: NextRequest) {
	const authCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
	const isAuthPage =
		request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/otp-verify");
	const isManageRoute = request.nextUrl.pathname.startsWith("/manage");

	// 1. If not authenticated and trying to access protected route -> Redirect to /login
	if (isManageRoute && !authCookie) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// 2. Validate token (in Edge runtime, only jwtVerify works)
	if (authCookie) {
		try {
			// Verify signature and expiration
			await jwtVerify(authCookie, SECRET_KEY);

			// If trying to access /login while already authenticated -> Redirect to dashboard
			if (isAuthPage) {
				return NextResponse.redirect(new URL("/manage", request.url));
			}
		} catch (error) {
			// Invalid or expired token: Clear cookie and redirect to login
			console.log("[Middleware] Invalid auth token:", error);
			const response = NextResponse.redirect(new URL("/login", request.url));
			response.cookies.delete(SESSION_COOKIE_NAME);
			return response;
		}
	}

	return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico, sitemap.xml, robots.txt (metadata files)
		 * - public files (images, fonts, etc.)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
