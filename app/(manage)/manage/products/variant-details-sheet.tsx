"use client";

import {
	Camera,
	ChevronLeft,
	ChevronRight,
	DollarSign,
	FileIcon,
	Package,
	Plus,
	Tag,
	Trash2,
	Truck,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type VariantData = Record<string, unknown>;

interface VariantDetailsSheetProps {
	variant: VariantData;
	isOpen: boolean;
	onClose: () => void;
	onUpdate: (variant: VariantData) => void;
	hasPrev?: boolean;
	hasNext?: boolean;
	onPrev?: (currentVariant: VariantData) => void;
	onNext?: (currentVariant: VariantData) => void;
	onSyncToAll?: (attributes: { key: string; value: string }[]) => void;
}

export function VariantDetailsSheet({
	variant,
	isOpen,
	onClose,
	onUpdate,
	hasPrev,
	hasNext,
	onPrev,
	onNext,
	onSyncToAll,
}: VariantDetailsSheetProps) {
	const [localVariant, setLocalVariant] = useState<VariantData>(variant);
	const stockInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setLocalVariant(variant);
	}, [variant]);

	useEffect(() => {
		if (isOpen && localVariant?.manageInventory) {
			const timer = setTimeout(() => {
				stockInputRef.current?.focus();
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [isOpen, localVariant?.manageInventory]);

	if (!localVariant) return null;

	const handleChange = (field: string, value: unknown) => {
		setLocalVariant((prev) => ({ ...prev, [field]: value }));
	};

	const handleSave = () => {
		onUpdate(localVariant);
		onClose();
	};

	return (
		<Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="overflow-y-auto sm:max-w-lg bg-white p-0 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
				<SheetHeader className="px-4 py-4 bg-black text-white sticky top-0 z-20 border-b-4 border-black">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-0">
							<button
								type="button"
								onClick={() => onPrev?.(localVariant)}
								disabled={!hasPrev}
								className="p-3 text-white bg-black border-4 border-white hover:bg-white hover:text-black disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs active:translate-y-0.5"
								title="Variante précédente"
							>
								<ChevronLeft size={18} strokeWidth={4} />
							</button>
						</div>
						<div className="min-w-0 flex-1 px-2">
							<SheetTitle className="text-base font-black uppercase tracking-wider text-white truncate text-center">
								{localVariant.name}
							</SheetTitle>
						</div>
						<div className="flex items-center gap-0">
							<button
								type="button"
								onClick={() => onNext?.(localVariant)}
								disabled={!hasNext}
								className="p-3 text-white bg-black border-4 border-white hover:bg-white hover:text-black disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs active:translate-y-0.5"
								title="Variante suivante"
							>
								<ChevronRight size={18} strokeWidth={4} />
							</button>
							<button
								type="button"
								onClick={onClose}
								className="p-3 ml-2 text-white bg-black border-4 border-white hover:bg-white hover:text-black font-bold active:translate-y-0.5"
								title="Fermer"
							>
								<X size={18} strokeWidth={4} />
							</button>
						</div>
					</div>
				</SheetHeader>

				<div className="flex flex-col gap-3 p-4 pb-32">
					{/* Status */}
					<div className="flex items-center gap-3 p-3 border-2 border-black bg-white">
						<Checkbox
							id="isEnabled"
							checked={localVariant.isEnabled}
							onCheckedChange={(checked) => handleChange("isEnabled", checked)}
							className="h-5 w-5 data-[state=checked]:bg-black border-2 border-black rounded-none"
						/>
						<Label htmlFor="isEnabled" className="text-sm font-bold cursor-pointer uppercase">
							Variant active
						</Label>
					</div>

					{/* Variant Media */}
					<div className="p-3 border-2 border-black bg-white space-y-3">
						<div className="flex items-center gap-2">
							<Camera size={16} className="text-black" />
							<h3 className="text-sm font-black uppercase">Images</h3>
						</div>
						<ImageUpload
							value={localVariant.images || []}
							onChange={(images) => handleChange("images", images)}
							onRemove={(url) => {
								const updated = (localVariant.images || []).filter((img: string) => img !== url);
								handleChange("images", updated);
							}}
						/>
					</div>

					{/* Digital Attachments */}
					<div className="bg-white p-3 border-2 border-black space-y-3">
						<div className="flex items-center gap-2">
							<FileIcon size={16} className="text-black" />
							<h3 className="text-sm font-black uppercase">Pièces jointes</h3>
						</div>
						<div className="space-y-2">
							{((localVariant.digitalAttachments as { name: string; url: string }[]) || []).map(
								(file, index) => (
									<div key={index} className="flex items-center gap-2 p-2 border-2 border-black bg-white">
										<FileIcon size={14} className="text-black shrink-0" />
										<span className="flex-1 text-xs font-medium truncate">{file.name}</span>
										<button
											type="button"
											className="p-2 text-black hover:bg-black hover:text-white"
											onClick={() => {
												const updated = [...(localVariant.digitalAttachments || [])];
												updated.splice(index, 1);
												handleChange("digitalAttachments", updated);
											}}
										>
											<Trash2 size={14} />
										</button>
									</div>
								),
							)}
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="w-full text-sm font-bold border-2 border-black border-dashed hover:bg-black hover:text-white"
								onClick={() => {
									const input = document.createElement("input");
									input.type = "file";
									input.onchange = (e) => {
										const target = e.target as HTMLInputElement;
										const file = target.files?.[0];
										if (file) {
											const updated = [
												...(localVariant.digitalAttachments || []),
												{ name: file.name, url: URL.createObjectURL(file) },
											];
											handleChange("digitalAttachments", updated);
										}
									};
									input.click();
								}}
							>
								<Plus size={14} className="mr-1" /> Ajouter
							</Button>
						</div>
					</div>

					{/* Pricing */}
					<div className="p-3 border-2 border-black bg-white space-y-3">
						<div className="flex items-center gap-2">
							<DollarSign size={16} className="text-black" />
							<h3 className="text-sm font-black uppercase">Prix</h3>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<div className="grid gap-1">
								<Label htmlFor="price" className="text-xs font-bold uppercase">
									Prix de vente
								</Label>
								<Input
									id="price"
									value={localVariant.price ?? ""}
									onChange={(e) => handleChange("price", e.target.value)}
									className="h-10 bg-white border-2 border-black text-sm font-medium"
									placeholder="0"
								/>
							</div>
							<div className="grid gap-1">
								<Label htmlFor="costPrice" className="text-xs font-bold uppercase">
									Prix de revient
								</Label>
								<Input
									id="costPrice"
									value={localVariant.costPrice ?? ""}
									onChange={(e) => handleChange("costPrice", e.target.value)}
									className="h-10 bg-white border-2 border-black text-sm font-medium"
									placeholder="0"
								/>
							</div>
						</div>
						<div className="grid gap-1">
							<Label htmlFor="compareAtPrice" className="text-xs font-bold uppercase">
								Prix barré
							</Label>
							<Input
								id="compareAtPrice"
								value={localVariant.compareAtPrice ?? ""}
								onChange={(e) => handleChange("compareAtPrice", e.target.value)}
								className="h-10 bg-white border-2 border-black text-sm font-medium"
								placeholder="0"
							/>
						</div>
					</div>

					{/* Inventory */}
					<div className="p-3 border-2 border-black bg-white space-y-3">
						<div className="flex items-center gap-2">
							<Package size={16} className="text-black" />
							<h3 className="text-sm font-black uppercase">Inventaire</h3>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<div className="grid gap-1">
								<Label htmlFor="sku" className="text-xs font-bold uppercase">
									SKU
								</Label>
								<Input
									id="sku"
									value={localVariant.sku ?? ""}
									onChange={(e) => handleChange("sku", e.target.value)}
									className="h-10 bg-white border-2 border-black text-sm font-medium"
								/>
							</div>
							<div className="grid gap-1">
								<Label htmlFor="barcode" className="text-xs font-bold uppercase">
									Code-barres
								</Label>
								<Input
									id="barcode"
									value={localVariant.barcode ?? ""}
									onChange={(e) => handleChange("barcode", e.target.value)}
									className="h-10 bg-white border-2 border-black text-sm font-medium"
								/>
							</div>
						</div>
						<div className="grid gap-2">
							<Label className="text-xs font-bold uppercase">Stock</Label>
							{!localVariant.manageInventory ? (
								<button
									type="button"
									className="h-11 w-full font-bold text-sm text-black bg-white border-2 border-black hover:bg-black hover:text-white"
									onClick={() => {
										handleChange("manageInventory", true);
										handleChange("stock", "");
									}}
								>
									∞ Stock infini
								</button>
							) : (
								<div className="flex flex-col gap-2">
									<Input
										ref={stockInputRef}
										id="stock"
										type="number"
										value={
											localVariant.stock === 0 || localVariant.stock === "0" ? "" : (localVariant.stock ?? "")
										}
										placeholder="0"
										onChange={(e) => handleChange("stock", e.target.value)}
										className={cn(
											"h-11 text-sm font-bold bg-white border-2 border-black",
											(localVariant.stock === 0 || localVariant.stock === "0") &&
												"border-red-500 bg-red-50 text-red-600",
										)}
										autoFocus
									/>
									<div className="flex gap-1 justify-end">
										{[
											{ label: "-10", val: -10 },
											{ label: "-1", val: -1 },
											{ label: "+1", val: 1 },
											{ label: "+10", val: 10 },
										].map((btn) => (
											<button
												key={btn.label}
												type="button"
												className={cn(
													"px-3 py-2 text-sm font-bold border-2 border-black",
													btn.val > 0
														? "text-black hover:bg-black hover:text-white"
														: "text-black hover:bg-black hover:text-white",
												)}
												onClick={() => {
													const current = Number(localVariant.stock || 0);
													const next = Math.max(0, current + btn.val);
													handleChange("stock", String(next));
												}}
											>
												{btn.label}
											</button>
										))}
									</div>
									<button
										type="button"
										className="text-xs font-bold uppercase underline hover:no-underline"
										onClick={() => handleChange("manageInventory", false)}
									>
										Passer en stock infini
									</button>
								</div>
							)}
						</div>
					</div>

					{/* Shipping */}
					<div className="p-3 border-2 border-black bg-white space-y-3">
						<div className="flex items-center gap-2">
							<Truck size={16} className="text-black" />
							<h3 className="text-sm font-black uppercase">Expédition</h3>
						</div>
						<div className="flex items-center gap-3 p-2 border-2 border-black bg-white">
							<Switch
								id="shippable"
								checked={localVariant.shippable}
								onCheckedChange={(checked) => handleChange("shippable", checked)}
								className="data-[state=checked]:bg-black border-2 border-black"
							/>
							<Label htmlFor="shippable" className="text-sm font-bold cursor-pointer uppercase">
								Produit physique
							</Label>
						</div>
						{localVariant.shippable && (
							<div className="grid grid-cols-2 gap-2 pt-2 border-t-2 border-black">
								<div className="grid gap-1">
									<Label htmlFor="weight" className="text-xs font-bold uppercase">
										Poids (kg)
									</Label>
									<Input
										id="weight"
										value={localVariant.weight ?? ""}
										onChange={(e) => handleChange("weight", e.target.value)}
										className="h-10 bg-white border-2 border-black text-sm font-medium"
									/>
								</div>
								<div className="grid gap-1">
									<Label htmlFor="width" className="text-xs font-bold uppercase">
										Largeur
									</Label>
									<Input
										id="width"
										placeholder="L"
										value={localVariant.width ?? ""}
										onChange={(e) => handleChange("width", e.target.value)}
										className="h-10 bg-white border-2 border-black text-sm font-medium text-center"
									/>
								</div>
								<div className="grid gap-1">
									<Label htmlFor="height" className="text-xs font-bold uppercase">
										Hauteur
									</Label>
									<Input
										id="height"
										placeholder="H"
										value={localVariant.height ?? ""}
										onChange={(e) => handleChange("height", e.target.value)}
										className="h-10 bg-white border-2 border-black text-sm font-medium text-center"
									/>
								</div>
								<div className="grid gap-1">
									<Label htmlFor="depth" className="text-xs font-bold uppercase">
										Profondeur
									</Label>
									<Input
										id="depth"
										placeholder="P"
										value={localVariant.depth ?? ""}
										onChange={(e) => handleChange("depth", e.target.value)}
										className="h-10 bg-white border-2 border-black text-sm font-medium text-center"
									/>
								</div>
							</div>
						)}
					</div>

					{/* Attributes */}
					<div className="p-3 border-2 border-black bg-white space-y-2">
						<div className="flex items-center gap-2">
							<Tag size={16} className="text-black" />
							<h3 className="text-sm font-black uppercase">Attributs</h3>
						</div>
						<div className="space-y-2">
							{((localVariant.attributes as { key: string; value: string }[]) || []).map((attr, index) => (
								<div key={index} className="flex items-center gap-2 p-2 border-2 border-black bg-white">
									<div className="flex-1 grid grid-cols-2 gap-2">
										<Input
											placeholder="Clé"
											value={attr.key}
											onChange={(e) => {
												const updated = [...(localVariant.attributes || [])];
												updated[index].key = e.target.value;
												handleChange("attributes", updated);
											}}
											className="h-9 text-sm font-medium bg-white border-2 border-black"
										/>
										<Input
											placeholder="Valeur"
											value={attr.value}
											onChange={(e) => {
												const updated = [...(localVariant.attributes || [])];
												updated[index].value = e.target.value;
												handleChange("attributes", updated);
											}}
											className="h-9 text-sm font-medium bg-white border-2 border-black"
										/>
									</div>
									<button
										type="button"
										className="p-2 text-black hover:bg-black hover:text-white"
										onClick={() => {
											const updated = [...(localVariant.attributes || [])];
											updated.splice(index, 1);
											handleChange("attributes", updated);
										}}
									>
										<Trash2 size={14} />
									</button>
								</div>
							))}
							<button
								type="button"
								className="w-full py-2 text-sm font-bold border-2 border-black border-dashed hover:bg-black hover:text-white"
								onClick={() => {
									const updated = [...(localVariant.attributes || []), { key: "", value: "" }];
									handleChange("attributes", updated);
								}}
							>
								+ Ajouter
							</button>
						</div>
					</div>
				</div>

				<div className="px-4 py-4 bg-white border-t-4 border-black sticky bottom-0">
					<div className="flex gap-2">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 h-11 px-4 border-2 border-black font-bold text-sm hover:bg-black hover:text-white"
						>
							Annuler
						</button>
						<button
							type="button"
							onClick={handleSave}
							className="flex-1 h-11 px-6 bg-black text-white font-bold text-sm border-2 border-black hover:bg-white hover:text-black"
						>
							Enregistrer
						</button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
