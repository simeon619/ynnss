export type Option = {
	id: string;
	name: string;
	values: string[];
	type: "text" | "color" | "image";
	visuals?: Record<string, string>;
};

export const PREDEFINED_LABELS = [
	"Couleur",
	"Taille",
	"Matière",
	"Style",
	"Genre",
	"Saison",
	"Capacité",
	"Puissance",
	"Poids",
	"Longueur",
	"Parfum",
	"Pack",
	"Pointure",
	"Volume",
	"Texture",
];

export const PREDEFINED_LABELS_EN = [
	"Color",
	"Size",
	"Material",
	"Style",
	"Gender",
	"Season",
	"Capacity",
	"Wattage",
	"Weight",
	"Length",
	"Scent",
	"Pack",
];

export const PREDEFINED_VALUES: Record<string, string[]> = {
	Couleur: [
		"Noir",
		"Blanc",
		"Gris",
		"Bleu",
		"Rouge",
		"Vert",
		"Jaune",
		"Orange",
		"Violet",
		"Rose",
		"Marron",
		"Beige",
		"Ivoire",
		"Bordeaux",
		"Kaki",
		"Marine",
		"Blanc Cassé",
		"Crème",
		"Sable",
		"Anthracite",
		"Écru",
		"Doré",
		"Argenté",
		"Turquoise",
		"Coral",
		"Menthe",
		"Lavande",
		"Olive",
		"Prune",
	],
	Color: [
		"Black",
		"White",
		"Silver",
		"Gold",
		"Navy",
		"Charcoal",
		"Red",
		"Blue",
		"Green",
		"Yellow",
		"Orange",
		"Purple",
		"Pink",
		"Brown",
		"Grey",
		"Beige",
		"Ivory",
		"Cream",
		"Burgundy",
		"Teal",
		"Coral",
		"Mint",
		"Lavender",
		"Turquoise",
		"Olive",
		"Maroon",
		"Tan",
		"Khaki",
		"Camel",
		"Rose Gold",
	],
	Taille: [
		"XXS",
		"XS",
		"S",
		"M",
		"L",
		"XL",
		"XXL",
		"3XL",
		"4XL",
		"5XL",
		"Standard",
		"Large",
		"Unique",
		"28",
		"30",
		"32",
		"34",
		"36",
		"38",
	],
	Pointure: ["38", "39", "40", "41", "42", "43", "44", "45", "46", "47"],
	Capacité: ["250ml", "500ml", "1L", "1.5L", "2L", "3L", "5L", "10L", "50ml", "100ml", "150ml"],
	Size: [
		"XXS",
		"XS",
		"S",
		"M",
		"L",
		"XL",
		"XXL",
		"3XL",
		"4XL",
		"5XL",
		"Standard",
		"Large",
		"One Size",
		"Unique",
		"28",
		"30",
		"32",
		"34",
		"36",
		"38",
		"40",
		"42",
		"44",
		"46",
		"48",
		"50",
		"52",
		"54",
		"56",
	],
	Material: [
		"Cotton",
		"Polyester",
		"Wool",
		"Leather",
		"Silk",
		"Linen",
		"Denim",
		"Nylon",
		"Velvet",
		"Satin",
		"Cashmere",
		"Bamboo",
		"Lycra",
		"Spandex",
		"Viscose",
		"Modal",
		"Acrylic",
		"Faux Leather",
		"Suede",
		"Canvas",
		"Rubber",
		"Cork",
		"Wood",
		"Metal",
		"Ceramic",
	],
	Style: [
		"Classic",
		"Modern",
		"Vintage",
		"Sporty",
		"Casual",
		"Formal",
		"Chic",
		"Bohemian",
		"Minimalist",
		"Rustic",
		"Industrial",
		"Scandinavian",
		"Retro",
		"Streetwear",
		"Elegant",
	],
	Genre: ["Homme", "Femme", "Unisexe", "Enfant", "Garçon", "Fille", "Bébé", "Mixte"],
	Saison: ["Printemps", "Été", "Automne", "Hiver", "Toutes saisons"],
	Matière: [
		"Coton",
		"Polyester",
		"Laine",
		"Cuir",
		"Soie",
		"Lin",
		"Denim",
		"Nylon",
		"Velours",
		"Satin",
		"Cachemire",
		"Bambou",
		"Lycra",
		"Spandex",
		"Viscose",
		"Modal",
		"Acrylique",
		"Cuir synthétique",
		"Suède",
		"Toile",
		"Caoutchouc",
		"Liège",
		"Bois",
	],
	Gender: ["Men", "Women", "Unisex", "Kids", "Boys", "Girls", "Baby"],
	Season: ["Spring", "Summer", "Autumn", "Winter", "All Season"],
	Capacity: [
		"8GB",
		"16GB",
		"32GB",
		"64GB",
		"128GB",
		"256GB",
		"512GB",
		"1TB",
		"2TB",
		"500mAh",
		"1000mAh",
		"2000mAh",
		"5000mAh",
	],
	Wattage: ["5W", "10W", "15W", "20W", "30W", "40W", "50W", "60W", "75W", "100W", "150W", "200W"],
	Weight: [
		"50g",
		"100g",
		"150g",
		"200g",
		"250g",
		"300g",
		"400g",
		"500g",
		"750g",
		"1kg",
		"1.5kg",
		"2kg",
		"3kg",
		"5kg",
	],
	Length: [
		"30cm",
		"40cm",
		"50cm",
		"60cm",
		"70cm",
		"80cm",
		"90cm",
		"100cm",
		"120cm",
		"150cm",
		"180cm",
		"200cm",
	],
	Scent: [
		"Vanilla",
		"Lavender",
		"Rose",
		"Jasmine",
		"Sandalwood",
		"Cedar",
		"Citrus",
		"Mint",
		"Chocolate",
		"Coffee",
		"Coconut",
		"Fresh",
		"Floral",
		"Fruity",
	],
	Pack: [
		"1 Piece",
		"2 Pieces",
		"3 Pieces",
		"4 Pieces",
		"5 Pieces",
		"6 Pieces",
		"10 Pieces",
		"12 Pieces",
		"Pack of 2",
		"Pack of 3",
		"Pack of 5",
	],
};

type VariantCombination = Record<string, unknown>;
type LegacyVariantValue = { value: string };
type VariantWithCombinations = {
	combinations?: VariantCombination[] | null;
	selected?: boolean;
	stock?: string | number;
	manageInventory?: boolean | null;
};

export function generateCombinations(options: Option[]): VariantCombination[] {
	if (options.length === 0) return [];

	const [first, ...rest] = options;
	const restCombinations = generateCombinations(rest);

	const combinations: VariantCombination[] = [];

	first.values.forEach((value) => {
		if (restCombinations.length === 0) {
			combinations.push({ [first.name]: value });
		} else {
			restCombinations.forEach((combination) => {
				combinations.push({ [first.name]: value, ...combination });
			});
		}
	});

	return combinations;
}

export function formatVariantName(combination: VariantCombination | Record<string, unknown>): string {
	const values: string[] = [];
	Object.entries(combination).forEach(([key, value]) => {
		// Handle Legacy Complex Format
		if (key === "variantValue" && value && typeof value === "object" && "value" in value) {
			values.push((value as LegacyVariantValue).value);
		} else {
			values.push(String(value));
		}
	});
	return values.join(" / ");
}

export function generateId(): string {
	return Math.random().toString(36).substring(2, 9);
}

export function reconstructOptions(variants: VariantWithCombinations[]): Option[] {
	if (!variants || variants.length === 0) return [];

	const optionsMap = new Map<string, Set<string>>();

	variants.forEach((v) => {
		if (v.combinations && v.combinations.length > 0) {
			const combo = v.combinations[0];
			Object.entries(combo).forEach(([key, value]) => {
				// Check for Complex Format (Legacy)
				if (value && typeof value === "object" && "variantType" in value && "value" in value) {
					const complexValue = value as { value: string; variantType: { label: string } };
					const label = complexValue.variantType.label;
					const val = complexValue.value;

					if (!optionsMap.has(label)) {
						optionsMap.set(label, new Set());
					}
					optionsMap.get(label)?.add(String(val));
				} else {
					// Simple Format (New)
					if (!optionsMap.has(key)) {
						optionsMap.set(key, new Set());
					}
					optionsMap.get(key)?.add(String(value));
				}
			});
		}
	});

	return Array.from(optionsMap.entries()).map(([name, valuesSet], index) => ({
		id: `opt-${index}`,
		name,
		values: Array.from(valuesSet),
		type: "text" as const,
		visuals: {},
	}));
}

export function syncVariantStock(variants: VariantWithCombinations[], sourceIndex: number) {
	const source = variants[sourceIndex];
	if (!source) return variants;

	const hasSelection = variants.some((v) => v.selected);

	return variants.map((v, idx) => {
		// Don't update the source itself if it happens to be selected (redundant but safe)
		if (idx === sourceIndex) return v;

		const shouldUpdate = !hasSelection || v.selected;
		if (!shouldUpdate) return v;

		// Smart Sync Logic:
		// 1. If source is Infinite (manageInventory: false) -> Force Infinite on target.
		// 2. If source is Managed (manageInventory: true) ->
		//    - If target was Infinite or Empty/0 -> Set to source stock.
		//    - If target had a positive value -> KEEP IT (Don't overwrite).

		const isSourceInfinite = !source.manageInventory;

		if (isSourceInfinite) {
			return { ...v, manageInventory: false, stock: "" };
		}

		// Source is managed with a value (e.g., 50)
		const currentStock = Number(v.stock);
		// We simply check if there is a positive number
		const hasExistingStock = !Number.isNaN(currentStock) && currentStock > 0;

		if (hasExistingStock) {
			// Keep existing positive stock
			return v;
		}

		// Apply source stock to empty/infinite targets
		return {
			...v,
			manageInventory: true,
			stock: source.stock,
		};
	});
}
