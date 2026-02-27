export type VariantValue = {
	id: string;
	value: string;
	colorValue: string | null;
	variantType: {
		id: string;
		type: "string" | "color";
		label: string;
	};
};

export type Combination =
	| {
			variantValue: VariantValue;
	  }
	| Record<string, string | number>;

export type Variant = {
	id: string;
	price?: string;
	stock?: number | string; // Adding stock type here for completeness as used elsewhere
	isEnabled?: boolean;
	images: string[];
	combinations: Combination[];
	attributes?: { key: string; value: string }[];
	[key: string]: unknown; // Allow other properties
};

/**
 * Finds the variant that matches the current search parameters.
 * Supports both legacy (Complex) and new (Simple) data formats.
 */
export function findSelectedVariant(
	variants: Variant[],
	searchParams: URLSearchParams | ReadonlyURLSearchParams | Record<string, string>,
): Variant | undefined {
	if (!variants || variants.length === 0) return undefined;

	// Helper to get value from various searchParams types
	const getParam = (key: string): string | null => {
		if ("get" in searchParams && typeof searchParams.get === "function") {
			return searchParams.get(key);
		}
		return (searchParams as Record<string, string>)[key] || null;
	};

	// If no params, and only one variant, return it (optional behavior, but common)
	// However, the components usually handle this or duplicate logic.
	// Let's stick to strict matching for this utility to be pure.

	return variants.find((variant) =>
		variant.combinations.every((combination) => {
			// Handle Legacy Complex Format
			if (
				"variantValue" in combination &&
				combination.variantValue &&
				typeof combination.variantValue === "object" &&
				combination.variantValue.variantType
			) {
				return getParam(combination.variantValue.variantType.label) === combination.variantValue.value;
			}

			// Handle Simple Format (Key-Value)
			return Object.entries(combination).every(([key, value]) => {
				return getParam(key) === String(value);
			});
		}),
	);
}

// Type helper for ReadonlyURLSearchParams compatibility
interface ReadonlyURLSearchParams {
	get(name: string): string | null;
	getAll(name: string): string[];
	has(name: string): boolean;
	forEach(
		callbackfn: (value: string, key: string, parent: ReadonlyURLSearchParams) => void,
		thisArg?: unknown,
	): void;
	entries(): IterableIterator<[string, string]>;
	keys(): IterableIterator<string>;
	values(): IterableIterator<string>;
	toString(): string;
	size: number;
}
