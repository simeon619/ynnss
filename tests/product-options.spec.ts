import { expect, type Page, test } from "@playwright/test";

const PHONE = "+2250707070707";

async function fetchOTP(phone: string): Promise<string | null> {
	try {
		const response = await fetch(`http://localhost:3000/api/test/otp?phone=${encodeURIComponent(phone)}`);
		if (!response.ok) return null;
		const data = await response.json();
		return data.code;
	} catch {
		return null;
	}
}

async function selectStore(page: Page) {
	if (!page.url().includes("/select-store")) return;
	const manageStoreButton = page.locator('button:has-text("Gérer la boutique")').first();
	await expect(manageStoreButton).toBeVisible({ timeout: 10000 });
	await manageStoreButton.click();
	await page.waitForURL("**/manage**", { timeout: 15000 });
	await page.waitForLoadState("networkidle");
}

async function login(page: Page) {
	await page.goto("/login");
	await page.waitForLoadState("networkidle");

	if (page.url().includes("/manage")) return;
	if (page.url().includes("/select-store")) {
		await selectStore(page);
		return;
	}

	const phoneInput = page.locator("input#phone");
	await expect(phoneInput).toBeVisible();
	await phoneInput.fill(PHONE);

	await page.locator('button:has-text("Continuer")').click();
	await expect(page.locator("input#code")).toBeVisible();
	await page.waitForTimeout(1000);

	let otpCode = await fetchOTP(PHONE);
	if (!otpCode) {
		await page.waitForTimeout(2000);
		otpCode = await fetchOTP(PHONE);
	}
	if (!otpCode) throw new Error("Failed to fetch OTP");

	console.log(`Using OTP: ${otpCode}`);
	await page.locator("input#code").fill(otpCode);
	await page.locator('button:has-text("Connexion")').click();
	await page.waitForLoadState("networkidle");
	await page.waitForTimeout(1000);

	await selectStore(page);
}

async function navigateTo(page: Page, url: string) {
	await page.goto(url);
	await page.waitForLoadState("domcontentloaded");
	await page.waitForTimeout(500);
	// Handle potential redirect to select-store
	if (page.url().includes("/select-store")) {
		await selectStore(page);
		await page.goto(url);
		await page.waitForLoadState("domcontentloaded");
		await page.waitForTimeout(500);
	}
}

async function addOptionAndDelete(page: Page, url: string) {
	await navigateTo(page, url);

	const addOptionButton = page.locator("button").filter({ hasText: /AJOUTER UNE OPTION/i });
	await expect(addOptionButton).toBeVisible({ timeout: 10000 });
	await addOptionButton.click();

	const optionCard = page.locator("div.border-2.border-black:has(div.bg-black)").first();
	await expect(optionCard).toBeVisible({ timeout: 10000 });

	const nameInput = optionCard.locator('input[list^="labels-"]');
	await nameInput.fill("Couleur");

	const valueInput = optionCard.locator('input[placeholder="Ajouter..."]').first();
	await valueInput.fill("Rouge");
	await valueInput.press("Enter");

	await expect(optionCard.locator("span.bg-black", { hasText: "Rouge" })).toBeVisible({ timeout: 5000 });

	// Click X → inline OUI/NON confirmation appears
	const deleteButton = optionCard.locator('button[title="Supprimer cette option"]');
	await expect(deleteButton).toBeVisible();
	await deleteButton.click();

	// Confirm with OUI
	const ouiButton = page.locator("button", { hasText: "OUI" });
	await expect(ouiButton).toBeVisible({ timeout: 3000 });
	await ouiButton.click();

	await page.waitForTimeout(500);

	await expect(optionCard).not.toBeVisible();
	await expect(page.getByText("Créez votre première option")).toBeVisible();
}

test.describe.serial("Product Options", () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
	});

	test("should delete an option on the new product page", async ({ page }) => {
		await addOptionAndDelete(page, "/manage/products/new");
	});

	test("should delete an option on the edit product page", async ({ page }) => {
		await navigateTo(page, "/manage/products");

		const firstEditLink = page.locator('a[href^="/manage/products/"]').first();
		await expect(firstEditLink).toBeVisible({ timeout: 10000 });
		const href = await firstEditLink.getAttribute("href");

		await addOptionAndDelete(page, href as string);
	});

	test("should delete an option value when clicking the X button", async ({ page }) => {
		await navigateTo(page, "/manage/products/new");

		const addOptionButton = page.locator("button").filter({ hasText: /AJOUTER UNE OPTION/i });
		await expect(addOptionButton).toBeVisible({ timeout: 10000 });
		await addOptionButton.click();

		const optionCard = page.locator("div.border-2.border-black:has(div.bg-black)").first();
		await expect(optionCard).toBeVisible({ timeout: 10000 });

		const nameInput = optionCard.locator('input[list^="labels-"]');
		await nameInput.fill("Taille");

		const valueInput = optionCard.locator('input[placeholder="Ajouter..."]').first();

		await valueInput.fill("S");
		await valueInput.press("Enter");
		await expect(optionCard.locator("span.bg-black", { hasText: "S" })).toBeVisible({ timeout: 5000 });

		await valueInput.fill("M");
		await valueInput.press("Enter");
		await expect(optionCard.locator("span.bg-black", { hasText: "M" })).toBeVisible({ timeout: 5000 });

		const valueSTag = optionCard.locator("span.bg-black", { hasText: "S" });
		const deleteValueButton = valueSTag.locator("button");
		await deleteValueButton.click();

		await page.waitForTimeout(300);

		await expect(valueSTag).not.toBeVisible();
		await expect(optionCard.locator("span.bg-black", { hasText: "M" })).toBeVisible();
	});
});
