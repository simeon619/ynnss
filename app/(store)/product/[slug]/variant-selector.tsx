"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { YNSImage } from "@/lib/yns-image";

type VariantValue = {
	id: string;
	value: string;
	colorValue: string | null;
	variantType: {
		id: string;
		type: "string" | "color";
		label: string;
	};
};

type Combination =
	| {
			variantValue: VariantValue;
	  }
	| Record<string, string | number>;

type Variant = {
	id: string;
	combinations: Combination[];
	images?: string[];
};

type VariantOption = {
	id: string;
	value: string;
	colorValue: string | null;
};

type VariantGroup = {
	label: string;
	type: "string" | "color";
	options: VariantOption[];
};

type VariantSelectorProps = {
	variants: Variant[];
	selectedVariantId: string | undefined;
	options?: Array<{ name: string; visuals?: Record<string, string> }>;
};

const COLOR_MAP: Record<string, string> = {
	rouge: "#FF0000",
	red: "#FF0000",
	bleu: "#0000FF",
	blue: "#0000FF",
	vert: "#008000",
	green: "#008000",
	noir: "#000000",
	black: "#000000",
	blanc: "#FFFFFF",
	white: "#FFFFFF",
	jaune: "#FFFF00",
	yellow: "#FFFF00",
	rose: "#FFC0CB",
	pink: "#FFC0CB",
	violet: "#EE82EE",
	purple: "#800080",
	orange: "#FFA500",
	gris: "#808080",
	grey: "#808080",
	gray: "#808080",
	marron: "#800000",
	brown: "#A52A2A",
	marine: "#000080",
	navy: "#000080",
	cyan: "#00FFFF",
	magenta: "#FF00FF",
	gold: "#FFD700",
	silver: "#C0C0C0",
};

function processVariants(
	variants: Variant[],
	options: Array<{ name: string; visuals?: Record<string, string> }> | undefined,
) {
	const allOptions = variants.flatMap((variant) =>
		variant.combinations.flatMap((combination) => {
			const firstValue = Object.values(combination)[0];
			const isComplex =
				firstValue && typeof firstValue === "object" && "variantType" in firstValue && "value" in firstValue;

			if (isComplex) {
				const val = firstValue as VariantValue;
				return [
					{
						label: val.variantType.label,
						value: val.value,
						id: val.id,
						type: val.variantType.type,
						colorValue: val.colorValue,
					},
				];
			}

			return Object.entries(combination as Record<string, string | number>).map(([label, value]) => ({
				label,
				value: String(value),
				id: String(value),
				type: "string" as "string" | "color",
				colorValue: null as string | null,
			}));
		}),
	);

	const seenOptionIds = new Map<string, Set<string>>();

	const groupedByLabel = allOptions.reduce(
		(acc, option) => {
			const { label, type, value, id } = option;
			let { colorValue } = option;

			const labelLower = label.toLowerCase();
			const isVisual =
				labelLower.includes("couleur") ||
				labelLower.includes("color") ||
				labelLower.includes("texture") ||
				labelLower.includes("matière") ||
				labelLower.includes("motif");

			if (!acc[label]) {
				acc[label] = {
					label,
					type: (isVisual ? "color" : type) as "string" | "color",
					options: [],
				};
				seenOptionIds.set(label, new Set());
			}

			const seenIds = seenOptionIds.get(label);
			// Deduplicate by VALUE, not ID. This handles legacy/new format mismatches where
			// the same value (e.g., "M") might have different internal IDs.
			if (seenIds && !seenIds.has(value)) {
				seenIds.add(value);

				// Swatch Logic
				if (isVisual) {
					// 1. Check options (User defined in dashboard)
					if (options) {
						const optionDef = options.find((o) => o.name === label);
						if (optionDef?.visuals?.[value]) {
							colorValue = optionDef.visuals[value];
						}
					}

					// 2. Check if we already have a colorValue (from Complex format)
					if (!colorValue) {
						// 2. Try to map color name to hex
						const valueLower = value.toLowerCase();
						if (COLOR_MAP[valueLower]) {
							colorValue = COLOR_MAP[valueLower];
						} else {
							// 3. Try to find a representative image from variants
							const variantWithImage = variants.find((v) =>
								v.combinations.some((c) => {
									if ("variantValue" in c) {
										return (c.variantValue as VariantValue).value === value;
									}
									const entry = (c as Record<string, string | number>)[label];
									return entry !== undefined && String(entry) === value;
								}),
							);
							if (variantWithImage?.images?.length) {
								colorValue = `image:${variantWithImage.images[0]}`;
							}
						}
					}
				}

				acc[label].options.push({
					id,
					value,
					colorValue,
				});
			}

			return acc;
		},
		{} as Record<string, VariantGroup>,
	);

	return Object.values(groupedByLabel);
}

export function VariantSelector({ variants, selectedVariantId, options }: VariantSelectorProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const variantGroups = useMemo(() => processVariants(variants, options), [variants, options]);

	const { optionsByValue, optionsById } = useMemo(() => {
		const optionsByValue = new Map(
			variantGroups.map((g) => [g.label, new Map(g.options.map((o) => [o.value, o]))]),
		);
		const optionsById = new Map(
			variantGroups.map((g) => [g.label, new Map(g.options.map((o) => [o.id, o]))]),
		);
		return { optionsByValue, optionsById };
	}, [variantGroups]);

	const selectedOptions = useMemo(() => {
		const paramsOptions: Record<string, string> = {};
		searchParams.forEach((valueName, key) => {
			const optionByValue = optionsByValue.get(key);
			const option = optionByValue?.get(valueName);
			if (option) {
				paramsOptions[key] = option.id;
			}
		});
		return paramsOptions;
	}, [searchParams, optionsByValue]);

	const handleOptionSelect = (label: string, optionId: string) => {
		const newSelectedOptions = { ...selectedOptions, [label]: optionId };

		const params = Object.entries(newSelectedOptions).reduce((acc, [key, value]) => {
			const option = optionsById.get(key)?.get(value);
			if (option) {
				acc.set(key, option.value);
			}
			return acc;
		}, new URLSearchParams());
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	};

	useEffect(() => {
		if (variants.length <= 1 || searchParams.size > 0) return;

		const firstVariant = variants[0];
		if (firstVariant?.combinations?.length > 0) {
			const combo = firstVariant.combinations[0];
			const params = new URLSearchParams();

			if ("variantValue" in combo) {
				// Complex (Legacy)
				firstVariant.combinations.forEach((c) => {
					if ("variantValue" in c) {
						const val = c.variantValue as VariantValue;
						params.set(val.variantType.label, val.value);
					}
				});
			} else {
				// Simple format
				Object.entries(combo).forEach(([key, value]) => {
					params.set(key, String(value));
				});
			}
			router.replace(`${pathname}?${params.toString()}`, { scroll: false });
		}
	}, [variants, searchParams.size, pathname]);

	if (variantGroups.length === 0) return null;

	return (
		<div className="space-y-7">
			{variantGroups.map((group) => {
				const selectedOptionId = selectedOptions[group.label];
				const selectedOption = selectedOptionId
					? optionsById.get(group.label)?.get(selectedOptionId)
					: undefined;

				return (
					<div key={group.label} className="animate-soft-fade-in">
						{group.type === "color" ? (
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/60">
										{group.label}
									</span>
									{selectedOption && (
										<span className="text-[11px] font-medium text-foreground tracking-tight">
											{selectedOption.value}
										</span>
									)}
								</div>
								<div className="flex flex-wrap gap-3">
									{group.options.map((option) => {
										const isSelected = selectedOptions[group.label] === option.id;
										const isTexture = option.colorValue?.startsWith("image:");
										const textureUrl = isTexture ? option.colorValue?.replace("image:", "") : null;
										const colorHex = isTexture ? null : (option.colorValue ?? "#E5E5E5");

										return (
											<button
												key={option.id}
												type="button"
												onClick={() => handleOptionSelect(group.label, option.id)}
												className={cn(
													"group relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300",
													isSelected
														? "ring-1 ring-foreground ring-offset-2 ring-offset-background"
														: "hover:ring-1 hover:ring-muted-foreground/20 hover:ring-offset-2 hover:ring-offset-background",
												)}
												aria-label={option.value}
												title={option.value}
											>
												<span
													className={cn(
														"h-full w-full rounded-full transition-transform duration-300 group-hover:scale-95 overflow-hidden relative border border-black/5",
														isSelected ? "scale-95" : "scale-100",
													)}
													style={{ backgroundColor: colorHex ?? undefined }}
												>
													{isTexture && textureUrl && (
														<YNSImage src={textureUrl} alt={option.value} fill className="object-cover" />
													)}
													{!colorHex && !isTexture && (
														<span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold opacity-30">
															{option.value.charAt(0).toUpperCase()}
														</span>
													)}
												</span>
											</button>
										);
									})}
								</div>
							</div>
						) : (
							<div className="space-y-3">
								<span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/60">
									{group.label}
								</span>
								<div className="flex flex-wrap gap-2">
									{group.options.map((option) => {
										const isSelected = selectedOptions[group.label] === option.id;
										return (
											<button
												key={option.id}
												type="button"
												onClick={() => handleOptionSelect(group.label, option.id)}
												className={cn(
													"flex h-10 min-w-12 items-center justify-center rounded-full border px-4 text-[13px] transition-all duration-300",
													isSelected
														? "border-foreground bg-foreground text-primary-foreground premium-shadow"
														: "border-border hover:border-muted-foreground/30",
												)}
											>
												<span className="font-medium">{option.value}</span>
											</button>
										);
									})}
								</div>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
