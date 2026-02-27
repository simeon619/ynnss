"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { addToCart } from "@/app/(store)/cart/actions";
import { useCart } from "@/app/(store)/cart/cart-context";
import { CURRENCY, LOCALE } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { findSelectedVariant, type Variant } from "@/lib/product-utils";
import { QuantitySelector } from "./quantity-selector";
import { TrustBadges } from "./trust-badges";
import { VariantSelector } from "./variant-selector";

type AddToCartButtonProps = {
	variants: Variant[];
	product: {
		id: string;
		name: string;
		slug: string;
		images: string[];
		options?: Array<{ name: string; visuals?: Record<string, string> }>;
	};
};

export function AddToCartButton({ variants, product }: AddToCartButtonProps) {
	const searchParams = useSearchParams();
	const [quantity, setQuantity] = useState(1);
	const [isPending, startTransition] = useTransition();
	const { openCart, dispatch } = useCart();

	const selectedVariant = useMemo(() => {
		if (variants.length === 1) {
			return variants[0];
		}

		if (searchParams.size === 0) {
			return undefined;
		}

		return findSelectedVariant(variants, searchParams);
	}, [variants, searchParams]);

	const totalPrice = useMemo(() => {
		if (!selectedVariant?.price) return null;
		try {
			return BigInt(selectedVariant.price) * BigInt(quantity);
		} catch (e) {
			return null;
		}
	}, [selectedVariant, quantity]);

	// Check stock status
	const isOutOfStock = useMemo(() => {
		if (!selectedVariant) return false;

		// If inventory is not managed, it's always in stock (Infinite)
		if (!selectedVariant.manageInventory) return false;

		// Otherwise check the stock level
		const stock = Number(selectedVariant.stock);
		return Number.isNaN(stock) || stock <= 0;
	}, [selectedVariant]);

	const buttonText = useMemo(() => {
		if (isPending) return "Adding...";
		if (!selectedVariant) return "Select options";

		if (isOutOfStock) return "Out of Stock";

		if (totalPrice) {
			return `Add to Cart — ${formatMoney({ amount: totalPrice, currency: CURRENCY, locale: LOCALE })}`;
		}
		return "Add to Cart";
	}, [isPending, selectedVariant, totalPrice, isOutOfStock]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedVariant) return;

		// Open cart sidebar
		openCart();

		// Execute server action with optimistic update
		startTransition(async () => {
			// Dispatch inside transition for optimistic update
			dispatch({
				type: "ADD_ITEM",
				item: {
					quantity,
					productVariant: {
						id: selectedVariant.id,
						price: selectedVariant.price || "0",
						images: selectedVariant.images,
						product,
					},
				},
			});

			await addToCart(selectedVariant.id, quantity);
			// Reset quantity after add
			setQuantity(1);
		});
	};

	return (
		<div className="space-y-10">
			{variants.length > 1 && (
				<VariantSelector
					variants={variants}
					selectedVariantId={selectedVariant?.id}
					options={product.options}
				/>
			)}

			<div className="space-y-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					<div className="w-full sm:w-[120px]">
						<QuantitySelector quantity={quantity} onQuantityChange={setQuantity} disabled={isPending} />
					</div>
					<form onSubmit={handleSubmit} className="flex-1">
						<button
							type="submit"
							disabled={isPending || !selectedVariant || isOutOfStock}
							className="group relative w-full h-12 overflow-hidden rounded-full bg-foreground text-primary-foreground text-[13px] font-semibold tracking-[0.15em] uppercase transition-all duration-500 hover:bg-foreground/90 premium-shadow disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<span className="relative z-10 flex items-center justify-center gap-2">{buttonText}</span>
						</button>
					</form>
				</div>
			</div>

			<div className="pt-6 border-t border-border/30">
				<TrustBadges />
			</div>
		</div>
	);
}
