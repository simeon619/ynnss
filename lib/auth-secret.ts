export function getJwtSecretOrThrow() {
	const secret = process.env.JWT_SECRET?.trim();

	if (!secret) {
		throw new Error("Missing JWT_SECRET. Set a strong JWT_SECRET (at least 32 characters).");
	}

	if (secret.length < 32) {
		throw new Error("Invalid JWT_SECRET. It must be at least 32 characters long.");
	}

	return new TextEncoder().encode(secret);
}
