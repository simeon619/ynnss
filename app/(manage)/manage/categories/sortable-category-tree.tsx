"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	type DragMoveEvent,
	type DragOverEvent,
	DragOverlay,
	type DragStartEvent,
	type DropAnimation,
	defaultDropAnimationSideEffects,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	ChevronDown,
	ChevronRight,
	Edit2,
	Eye,
	GripVertical,
	ImageIcon,
	Loader2,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { buildTree, type Category, flattenTree, getDescendants, type TreeItem } from "@/lib/category-utils";
import { cn } from "@/lib/utils";
import { YNSImage } from "@/lib/yns-image";
import { deleteCategories, deleteCategory, toggleCategoryStatus, updateCategoryHierarchy } from "../actions";

interface SortableCategoryTreeProps {
	categories: Category[];
}

const INDENTATION_WIDTH = 32;

export function SortableCategoryTree({ categories: initialCategories }: SortableCategoryTreeProps) {
	const [categories, setCategories] = useState(initialCategories);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [overId, setOverId] = useState<string | null>(null);
	const [offsetLeft, setOffsetLeft] = useState(0);
	const [isSaving, setIsSaving] = useState(false);
	const [expandedIds, setExpandedIds] = useState<Set<string>>(
		new Set(initialCategories.map((c: Category) => c.id)), // Auto-expand all valid parents initially
	);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		setCategories(initialCategories);
	}, [initialCategories]);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	// Transform flat categories into a stable flattened tree for dnd-kit
	const flattenedItems = useMemo(() => {
		const tree = buildTree(categories);
		return flattenTree(tree, expandedIds);
	}, [categories, expandedIds]);

	const activeItem = useMemo(
		() => flattenedItems.find((item) => item.id === activeId),
		[activeId, flattenedItems],
	);

	const handleDragStart = ({ active }: DragStartEvent) => {
		setActiveId(active.id as string);
	};

	const handleDragMove = ({ delta }: DragMoveEvent) => {
		setOffsetLeft(delta.x);
	};

	const handleDragOver = ({ over }: DragOverEvent) => {
		setOverId((over?.id as string) || null);
	};

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		const activeIndex = flattenedItems.findIndex((i) => i.id === active.id);
		const overIndex = over ? flattenedItems.findIndex((i) => i.id === over.id) : -1;

		if (over && overIndex !== -1) {
			// When dragging UP with rightward offset (nesting intent),
			// place the item AFTER the target so the target becomes 'previousItem'
			// and nesting works naturally
			const nestingIntent = offsetLeft > INDENTATION_WIDTH / 2;
			const effectiveOverIndex =
				nestingIntent && activeIndex > overIndex && active.id !== over.id
					? Math.min(overIndex + 1, flattenedItems.length - 1)
					: overIndex;

			const newFlattenedItems = arrayMove(flattenedItems, activeIndex, effectiveOverIndex);

			// New position of the dragged item
			const newIndex = effectiveOverIndex;
			const previousItem = newIndex > 0 ? newFlattenedItems[newIndex - 1] : null;

			// Calculate depth based on offset, but constrained by previous item
			let projectedDepth = (activeItem?.depth ?? 0) + Math.round(offsetLeft / INDENTATION_WIDTH);
			const maxDepth = previousItem ? previousItem.depth + 1 : 0;
			projectedDepth = Math.max(0, Math.min(projectedDepth, maxDepth));

			// Find new parent
			let newParentId: string | null = null;
			if (projectedDepth > 0 && previousItem) {
				if (projectedDepth === previousItem.depth + 1) {
					newParentId = previousItem.id;
				} else {
					// Search upwards for parent at projectedDepth - 1
					for (let i = newIndex - 1; i >= 0; i--) {
						if (newFlattenedItems[i].depth === projectedDepth - 1) {
							newParentId = newFlattenedItems[i].id;
							break;
						}
					}
				}
			}

			// Prevent circular dependency: newParentId cannot be the item itself or a descendant
			if (newParentId) {
				const isCircular = (targetId: string, potentialParentId: string): boolean => {
					if (targetId === potentialParentId) return true;
					const potentialParent = categories.find((c: Category) => c.id === potentialParentId);
					if (potentialParent?.parentId) {
						return isCircular(targetId, potentialParent.parentId);
					}
					return false;
				};

				if (isCircular(activeId ?? "", newParentId)) {
					console.warn("Prevented circular dependency");
					newParentId = activeItem?.parentId ?? null;
				}
			}

			// Update everyone's sortOrder and the active item's parentId/depth
			const updates = newFlattenedItems.map((item, index) => {
				if (item.id === active.id) {
					return { id: item.id, parentId: newParentId, sortOrder: index };
				}
				return { id: item.id, parentId: item.parentId, sortOrder: index };
			});

			// Check if anything actually changed before proceeding
			const hasChanged = updates.some((update) => {
				const current = categories.find((c: Category) => c.id === update.id);
				return current?.parentId !== update.parentId || current?.sortOrder !== update.sortOrder;
			});

			if (!hasChanged) {
				resetState();
				return;
			}

			// Optimistic update with recalculated depths for visual consistency
			setCategories((prev: Category[]) => {
				const next = [...prev];
				updates.forEach((u) => {
					const idx = next.findIndex((p) => p.id === u.id);
					if (idx !== -1) {
						next[idx] = { ...next[idx], parentId: u.parentId, sortOrder: u.sortOrder };
					}
				});
				return next;
			});

			// Persist to DB
			setIsSaving(true);
			updateCategoryHierarchy(updates)
				.then(() => {
					console.log("Hierarchy saved successfully");
				})
				.catch((err) => {
					console.error("Failed to save hierarchy:", err);
					toast.error("Échec de l'enregistrement de la hiérarchie.");
				})
				.finally(() => setIsSaving(false));
		}

		resetState();
	};

	const resetState = () => {
		setActiveId(null);
		setOverId(null);
		setOffsetLeft(0);
	};

	const toggleExpansion = (id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const toggleSelection = (id: string) => {
		const isSelecting = !selectedIds.has(id);

		if (isSelecting) {
			setSelectedIds((prev) => {
				const next = new Set(prev);
				next.add(id);
				return next;
			});

			// Proactive Proposal: If it has children not yet selected, offer to select them
			const descendants = getDescendants(categories, id);
			const unselectedDescendants = descendants.filter((dId) => !selectedIds.has(dId));

			if (unselectedDescendants.length > 0) {
				const itemName = categories.find((c: Category) => c.id === id)?.name || "cette catégorie";
				toast(`Séléctionner la branche ?`, {
					description: `Voulez-vous aussi sélectionner les ${unselectedDescendants.length} sous-catégories de "${itemName}" ?`,
					action: {
						label: "Tout sélectionner",
						onClick: () => {
							setSelectedIds((current) => {
								const updated = new Set(current);
								unselectedDescendants.forEach((dId) => updated.add(dId));
								return updated;
							});
							toast.success(`${unselectedDescendants.length} sous-catégories ajoutées`);
						},
					},
					duration: 5000,
				});
			}
		} else {
			// Recursive Deselection: Always deselect children when parent is deselected for UI consistency
			setSelectedIds((prev) => {
				const next = new Set(prev);
				const deselectDescendants = (parentId: string, currentSet: Set<string>) => {
					const descendants = getDescendants(categories, parentId);
					descendants.forEach((dId) => currentSet.delete(dId));
				};

				next.delete(id);
				deselectDescendants(id, next);
				return next;
			});
		}
	};

	const toggleSelectAll = () => {
		if (selectedIds.size === flattenedItems.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(flattenedItems.map((i) => i.id)));
		}
	};

	return (
		<div className="space-y-4">
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={handleDragStart}
				onDragMove={handleDragMove}
				onDragOver={handleDragOver}
				onDragEnd={handleDragEnd}
			>
				<div className="border-2 border-black bg-white overflow-hidden min-h-[200px] relative">
					{isSaving && (
						<div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
							<Loader2 className="animate-spin text-black" size={32} />
						</div>
					)}

					<div className="border-b-2 border-black px-4 h-[54px] flex items-center text-[10px] font-bold text-white uppercase tracking-widest bg-black sticky top-0 z-20">
						<div className="flex-1 flex items-center gap-4">
							<div className="flex items-center gap-2">
								<Checkbox
									className="rounded-none border-black focus:ring-black data-[state=checked]:bg-black data-[state=checked]:text-white"
									checked={flattenedItems.length > 0 && selectedIds.size === flattenedItems.length}
									onCheckedChange={toggleSelectAll}
									aria-label="Select all categories"
								/>
								{selectedIds.size > 0 ? (
									<div className="flex items-center gap-2">
										<span className="text-[10px] uppercase font-bold text-black">
											{selectedIds.size} sélectionné(s)
										</span>
										<button
											type="button"
											className="h-8 flex items-center px-2 text-white font-bold uppercase hover:underline"
											onClick={async () => {
												const ids = Array.from(selectedIds);

												// Optimistic update
												setCategories((prev: Category[]) =>
													prev.filter((c: Category) => !ids.includes(c.id)),
												);
												setSelectedIds(new Set());

												try {
													await deleteCategories(ids);
													toast.success(`${ids.length} catégories supprimées`);
												} catch (error) {
													console.error(error);
													toast.error("Erreur lors de la suppression groupée");
												}
											}}
										>
											<Trash2 size={14} className="mr-1" />
											Supprimer
										</button>
									</div>
								) : (
									<span>Nom</span>
								)}
							</div>
						</div>
						<div className="w-48 hidden md:block">Slug</div>
						<div className="w-48 hidden lg:block text-center">Produits</div>
						<div className="w-48 hidden lg:block text-center">Status</div>
						<div className="w-64 text-right">Actions</div>
					</div>

					<SortableContext items={flattenedItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
						<div className="divide-y">
							{flattenedItems.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-16 text-center bg-white">
									<div className="w-16 h-16 border-2 border-black flex items-center justify-center mb-4 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
										<GripVertical size={24} className="text-black" />
									</div>
									<h3 className="text-sm font-black uppercase tracking-widest text-black mb-1">
										Aucune catégorie
									</h3>
									<p className="text-xs text-black font-mono">
										Commencez par créer votre première catégorie pour organiser vos produits.
									</p>
								</div>
							) : (
								flattenedItems.map((item) => (
									<SortableItem
										key={item.id}
										item={item}
										isPlaceholder={item.id === overId && activeId !== item.id}
										isExpanded={expandedIds.has(item.id)}
										isSelected={selectedIds.has(item.id)}
										onToggleExpansion={() => toggleExpansion(item.id)}
										onToggleSelection={() => toggleSelection(item.id)}
										hasChildren={categories.some((c) => c.parentId === item.id)}
										onDelete={(id) => setCategories((prev) => prev.filter((c) => c.id !== id))}
										onStatusToggle={async (id, status) => {
											// Optimistic update
											setCategories((prev: Category[]) =>
												prev.map((c: Category) => (c.id === id ? { ...c, status } : c)),
											);
											try {
												await toggleCategoryStatus(id, status);
											} catch (error) {
												console.error(error);
												toast.error("Erreur lors du changement de statut");
												// Rollback
												setCategories((prev: Category[]) =>
													prev.map((c: Category) =>
														c.id === id ? { ...c, status: status === "active" ? "inactive" : "active" } : c,
													),
												);
											}
										}}
									/>
								))
							)}
						</div>
					</SortableContext>
				</div>

				<DragOverlay dropAnimation={dropAnimationConfig}>
					{activeId && activeItem ? (
						<div
							className={cn(
								"border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-95 flex items-center h-[54px] min-w-[600px] relative overflow-hidden font-mono text-xs",
								getDepthColor(activeItem.depth).row,
								"bg-white",
							)}
							style={{ transform: `translateX(${offsetLeft}px)` }}
						>
							<div
								className={cn(
									"absolute left-0 top-0 bottom-0 w-[6px]",
									getDepthColor(activeItem.depth).indicator,
								)}
							/>
							<div className="flex items-center px-4 w-full">
								<GripVertical className={cn("mr-2", getDepthColor(activeItem.depth).icon)} size={16} />
								{activeItem.image ? (
									<div className="w-8 h-8 overflow-hidden mr-3 shrink-0 border-2 border-black">
										<YNSImage src={activeItem.image} alt="" fill className="object-cover" />
									</div>
								) : (
									<div className="w-8 h-8 bg-white flex items-center justify-center mr-3 shrink-0 border-2 border-black">
										<ImageIcon size={14} className="text-black" />
									</div>
								)}
								<span className="font-bold text-black uppercase tracking-widest leading-none">
									{activeItem.name}
								</span>
							</div>
						</div>
					) : null}
				</DragOverlay>
			</DndContext>

			<div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-black font-bold px-1 pb-4">
				<div className="flex items-center gap-1">
					<ChevronRight size={12} />
					<span>Glisser: Droite (Imbriquer) / Gauche (Désimbriquer)</span>
				</div>
				{isSaving && (
					<span className="text-white bg-black px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
						Enregistrement...
					</span>
				)}
			</div>
		</div>
	);
}

const getDepthColor = (depth: number) => {
	switch (depth) {
		case 0:
			// Root: Brutalist Black
			return {
				indicator: "bg-black",
				icon: "text-black",
				row: "bg-white",
			};
		case 1:
			// Level 1: Dark Slate
			return {
				indicator: "bg-black",
				icon: "text-black",
				row: "bg-white",
			};
		case 2:
			// Level 2: Soft Slate
			return {
				indicator: "bg-black",
				icon: "text-black",
				row: "bg-white",
			};
		default:
			// Level 3+: Minimal
			return {
				indicator: "bg-black",
				icon: "text-black",
				row: "bg-transparent",
			};
	}
};

const dropAnimationConfig: DropAnimation = {
	sideEffects: defaultDropAnimationSideEffects({
		styles: {
			active: {
				opacity: "0.5",
			},
		},
	}),
};

function SortableItem({
	item,
	isPlaceholder,
	isExpanded,
	isSelected,
	onToggleExpansion,
	onToggleSelection,
	hasChildren,
	onDelete,
	onStatusToggle,
}: {
	item: TreeItem;
	isPlaceholder?: boolean;
	isExpanded?: boolean;
	isSelected?: boolean;
	onToggleExpansion?: () => void;
	onToggleSelection?: () => void;
	hasChildren?: boolean;
	onDelete?: (id: string) => void;
	onStatusToggle?: (id: string, status: "active" | "inactive") => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: item.id,
	});

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
		paddingLeft: `${item.depth * INDENTATION_WIDTH}px`,
		opacity: isDragging ? 0.3 : 1,
	};

	const colors = getDepthColor(item.depth);

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"group flex items-center h-[54px] hover:bg-black hover:text-white border-b border-black last:border-0 relative font-mono text-xs",
				colors.row,
				isPlaceholder && "opacity-50",
				isSelected && "bg-yellow-100",
			)}
		>
			<div className={cn("absolute left-0 top-0 bottom-0 w-[6px]", colors.indicator)} />

			<div className="flex-1 flex items-center gap-4 min-w-0 pr-4">
				<div className={cn("w-8 flex items-center justify-center", isSelected && "opacity-100")}>
					<Checkbox
						className="rounded-none border-black focus:ring-black data-[state=checked]:bg-black data-[state=checked]:text-white"
						checked={isSelected}
						onCheckedChange={onToggleSelection}
						aria-label={`Select ${item.name}`}
					/>
				</div>

				<div className="flex items-center gap-2 truncate min-w-0 flex-1">
					<button
						type="button"
						{...attributes}
						{...listeners}
						className={cn("p-2 -ml-2 cursor-grab active:cursor-grabbing", colors.icon)}
					>
						<GripVertical size={16} />
					</button>

					<div className="w-6 flex items-center justify-center shrink-0">
						{hasChildren ? (
							<button
								type="button"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									onToggleExpansion?.();
								}}
								className="p-1 text-black hover:bg-black hover:text-white cursor-pointer"
							>
								{isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
							</button>
						) : (
							<div className="w-4" />
						)}
					</div>

					<div className="flex items-center gap-3 truncate min-w-0">
						{item.image ? (
							<div className="w-8 h-8 overflow-hidden shrink-0 border-2 border-black relative">
								<YNSImage src={item.image} alt={item.name} fill className="object-cover" />
							</div>
						) : (
							<div className="w-8 h-8 bg-white flex items-center justify-center shrink-0 border-2 border-black">
								<ImageIcon size={12} className="text-black" />
							</div>
						)}
						<div className="flex flex-col min-w-0">
							<Link
								href={`/manage/categories/${item.id}`}
								className="font-bold uppercase hover:underline truncate"
							>
								{item.name}
							</Link>
							{item.fullPath && (
								<span className="text-[10px] text-black truncate leading-tight">{item.fullPath}</span>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="w-48 hidden md:block font-mono text-xs text-black truncate px-2">{item.slug}</div>

			<div className="w-48 hidden lg:block text-center">
				<span className="inline-flex items-center px-2 py-0.5 border border-black bg-white text-black font-bold text-[10px] uppercase tracking-widest leading-none">
					{item.productCount} produits
				</span>
			</div>

			<div className="w-48 hidden lg:flex items-center justify-center">
				<div className="flex items-center justify-center">
					<Switch
						checked={item.status === "active"}
						onCheckedChange={(checked) => onStatusToggle?.(item.id, checked ? "active" : "inactive")}
						aria-label="Toggle status"
					/>
				</div>
			</div>

			<div className="w-64 flex items-center justify-end gap-1 pr-2">
				<Link
					href={`/manage/categories/${item.id}`}
					className="h-8 px-2 flex items-center text-black font-bold text-[10px] uppercase tracking-widest hover:bg-black hover:text-white border-2 border-transparent hover:border-black"
				>
					<Edit2 size={12} className="mr-1.5" />
					Modif
				</Link>

				<a
					href={`/category/${item.slug}`}
					target="_blank"
					rel="noreferrer"
					className="h-8 px-2 flex items-center text-black font-bold text-[10px] uppercase tracking-widest hover:bg-black hover:text-white border-2 border-transparent hover:border-black"
				>
					<Eye size={12} className="mr-1.5" />
					Voir
				</a>

				<button
					type="button"
					className="h-8 px-2 flex items-center text-black hover:bg-black hover:text-white border-2 border-transparent hover:border-black"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						toast(`Supprimer "${item.name}" ?`, {
							description: "Cette action est irréversible.",
							action: {
								label: "Supprimer",
								onClick: async () => {
									onDelete?.(item.id);
									try {
										await deleteCategory(item.id);
										toast.success("Catégorie supprimée");
									} catch (error) {
										console.error(error);
										toast.error("Erreur lors de la suppression");
									}
								},
							},
							cancel: {
								label: "Annuler",
								onClick: () => {},
							},
							duration: 10000,
						});
					}}
				>
					<Trash2 size={12} />
				</button>
			</div>
		</div>
	);
}
