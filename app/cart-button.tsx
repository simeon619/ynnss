"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/app/(store)/cart/cart-context";

export function CartButton() {
	const { itemCount, openCart } = useCart();

	return (
		<button
			type="button"
			onClick={openCart}
			className="p-2 hover:bg-black hover:text-white border-2 border-transparent hover:border-black relative"
			aria-label="Shopping cart"
		>
			<ShoppingCart className="w-6 h-6" />
			{itemCount > 0 ? (
				<span className="absolute -top-1 -right-1 bg-black text-white text-xs w-5 h-5 flex items-center justify-center font-black">
					{itemCount}
				</span>
			) : null}
		</button>
	);
}
