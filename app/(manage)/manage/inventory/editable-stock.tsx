"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { adjustVariantStock } from "./actions";

interface EditableStockProps {
	variantId: string;
	initialStock: number;
}

export function EditableStock({ variantId, initialStock }: EditableStockProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [value, setValue] = useState(initialStock.toString());
	const [isPending, startTransition] = useTransition();
	const inputRef = useRef<HTMLInputElement>(null);

	// Sync local state if parent prop changes while not editing
	useEffect(() => {
		if (!isEditing) {
			setValue(initialStock.toString());
		}
	}, [initialStock, isEditing]);

	const handleEditStart = () => {
		if (!isPending) {
			setIsEditing(true);
			// Focus input on next tick
			setTimeout(() => {
				inputRef.current?.focus();
				inputRef.current?.select();
			}, 0);
		}
	};

	const handleSave = () => {
		const numValue = Number.parseInt(value, 10);

		if (Number.isNaN(numValue)) {
			// Revert on invalid input
			setValue(initialStock.toString());
			setIsEditing(false);
			return;
		}

		if (numValue === initialStock) {
			// No change
			setIsEditing(false);
			return;
		}

		// Calculate the adjustment amount required
		const adjustment = numValue - initialStock;

		setIsEditing(false);
		startTransition(async () => {
			const result = await adjustVariantStock(variantId, adjustment);
			if (result.success) {
				toast.success(`Stock updated to ${result.newStock}`);
			} else {
				toast.error(result.error || "Failed to adjust stock");
				setValue(initialStock.toString()); // Revert on failure
			}
		});
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleSave();
		} else if (e.key === "Escape") {
			setValue(initialStock.toString());
			setIsEditing(false);
		}
	};

	if (isEditing) {
		return (
			<input
				ref={inputRef}
				type="number"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onBlur={handleSave}
				onKeyDown={handleKeyDown}
				disabled={isPending}
				className={cn(
					"w-16 text-right font-mono font-bold border-2 border-black focus:outline-none focus:ring-0 px-1 py-0.5",
					isPending && "opacity-50",
				)}
			/>
		);
	}

	return (
		<button
			type="button"
			onClick={handleEditStart}
			className={cn(
				"cursor-pointer hover:underline decoration-black underline-offset-4 decoration-2 px-2 py-1 outline-none",
				isPending ? "opacity-50 cursor-not-allowed" : "hover:bg-black hover:text-white",
			)}
			title="Click to edit"
		>
			{initialStock}
		</button>
	);
}
