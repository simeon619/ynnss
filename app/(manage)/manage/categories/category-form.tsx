"use client";

import { ExternalLink, Link2, Link2Off, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState, useTransition } from "react";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { generateSlug } from "@/lib/category-utils";
import { createCategory, updateCategory } from "../actions";

interface CategoryFormProps {
	category?: {
		id: string;
		name: string;
		description: string | null;
		descriptionBottom: string | null;
		slug: string;
		parentId: string | null;
		image: string | null;
		seoTitle: string | null;
		seoDescription: string | null;
	};
	allCategories?: { id: string; name: string }[];
}

export function CategoryForm({ category, allCategories = [] }: CategoryFormProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [image, setImage] = useState<string>(category?.image || "");
	const [slug, setSlug] = useState<string>(category?.slug || "");
	const [isManualSlug, setIsManualSlug] = useState<boolean>(!!category?.slug);

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const name = e.target.value;
		if (!isManualSlug) {
			setSlug(generateSlug(name));
		}
	};

	const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSlug(e.target.value);
		setIsManualSlug(true);
	};

	const handleSubmit = (formData: FormData) => {
		// Add image to formData
		formData.append("image", image);

		startTransition(async () => {
			if (category) {
				await updateCategory(category.id, formData);
			} else {
				await createCategory(formData);
			}
		});
	};

	// Filter out self from parent options to avoid cycles
	const parentOptions = allCategories.filter((c) => c.id !== category?.id);

	return (
		<form action={handleSubmit} className="grid grid-cols-12 gap-6 pb-24">
			<div className="col-span-6 space-y-8">
				<Tabs defaultValue="details" className="w-full">
					<TabsList>
						<TabsTrigger value="details">Details</TabsTrigger>
						<TabsTrigger value="seo">SEO</TabsTrigger>
					</TabsList>

					<TabsContent value="details" forceMount className="mt-6 space-y-6 data-[state=inactive]:hidden">
						<Card>
							<CardHeader>
								<CardTitle>Category Details</CardTitle>
								<CardDescription>Basic information about your category.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-2">
									<Label htmlFor="name">Name</Label>
									<Input
										id="name"
										name="name"
										placeholder="e.g. Shoes"
										defaultValue={category?.name}
										onChange={handleNameChange}
										required
									/>
								</div>

								<div className="grid gap-2">
									<div className="flex items-center justify-between">
										<Label htmlFor="slug">Slug</Label>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className={`h-7 px-2 text-[10px] uppercase tracking-wider gap-1.5 ${
												isManualSlug
													? "text-black border-2 border-black"
													: "bg-black text-white hover:bg-white hover:text-black border-2 border-black"
											}`}
											onClick={() => {
												const newManual = !isManualSlug;
												setIsManualSlug(newManual);
												// If switching to auto, trigger a sync immediately
												if (!newManual) {
													const nameInput = document.getElementById("name") as HTMLInputElement;
													if (nameInput) setSlug(generateSlug(nameInput.value));
												}
											}}
										>
											{isManualSlug ? (
												<>
													<Link2Off size={12} />
													Manuel
												</>
											) : (
												<>
													<Link2 size={12} />
													Synchronisé
												</>
											)}
										</Button>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-black text-sm whitespace-nowrap font-mono">/category/</span>
										<Input
											id="slug"
											name="slug"
											placeholder="e.g. shoes (optional)"
											value={slug}
											onChange={handleSlugChange}
										/>
									</div>
									<p className="text-xs text-secondary-foreground/60">
										Le slug est utilisé dans l'URL de la catégorie.
									</p>
								</div>

								<div className="grid gap-2">
									<Label htmlFor="description">Description (shown above products)</Label>
									<Textarea
										id="description"
										name="description"
										placeholder="Describe this category..."
										defaultValue={category?.description || ""}
										rows={4}
									/>
								</div>

								<div className="grid gap-2">
									<Label htmlFor="descriptionBottom">Description (shown below products)</Label>
									<Textarea
										id="descriptionBottom"
										name="descriptionBottom"
										placeholder="Optional extra content shown at bottom of page..."
										defaultValue={category?.descriptionBottom || ""}
										rows={3}
									/>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="seo" forceMount className="mt-6 space-y-6 data-[state=inactive]:hidden">
						<Card>
							<CardHeader>
								<CardTitle>Search Engine Optimization</CardTitle>
								<CardDescription>Improve how this category appears in search results.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-2">
									<Label htmlFor="seoTitle">SEO Title</Label>
									<Input
										id="seoTitle"
										name="seoTitle"
										defaultValue={category?.seoTitle || ""}
										placeholder="e.g. Best Shoes | UrbanFit"
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="seoDescription">SEO Description</Label>
									<Textarea
										id="seoDescription"
										name="seoDescription"
										defaultValue={category?.seoDescription || ""}
										placeholder="Summary for Google search results..."
										rows={3}
									/>
								</div>

								{/* Search Preview */}
								<div className="mt-6 p-4 bg-white border-2 border-dashed border-black text-sm">
									<p className="font-medium text-black mb-2 uppercase text-[10px] tracking-wider">
										Search Preview
									</p>
									<div className="space-y-1">
										<p className="text-black font-bold text-base truncate underline">
											{category?.seoTitle || category?.name || "Category Name"} | UrbanFit
										</p>
										<p className="text-black font-mono text-xs truncate">
											https://urbanfit.shop/category/{category?.slug || "category-slug"}
										</p>
										<p className="text-black line-clamp-2">
											{category?.seoDescription ||
												category?.description ||
												"Category description will appear here..."}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>

			<div className="col-span-3 space-y-8">
				<Card>
					<CardHeader>
						<CardTitle>Media</CardTitle>
						<CardDescription>Thumbnail image for this category.</CardDescription>
					</CardHeader>
					<CardContent>
						<ImageUpload
							value={image ? [image] : []}
							onChange={(urls) => setImage(urls[0] || "")}
							onRemove={() => setImage("")}
						/>
						<p className="text-xs text-secondary-foreground/60 mt-4 leading-relaxed">
							Accepts SVG, PNG, JPG. Max size 2.5MB.
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Organization</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-2">
							<Label htmlFor="parentId">Parent Category</Label>
							<Select name="parentId" defaultValue={category?.parentId || "none"}>
								<SelectTrigger>
									<SelectValue placeholder="None (Top Level)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">None (Top Level)</SelectItem>
									{parentOptions.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				<div className="flex flex-col gap-3">
					<Button type="submit" size="lg" disabled={isPending} className="w-full">
						{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{category ? "Enregistrer les modifications" : "Créer la catégorie"}
					</Button>

					{category && (
						<Button variant="outline" type="button" className="w-full gap-2" asChild>
							<a href={`/category/${category.slug}`} target="_blank" rel="noreferrer">
								<ExternalLink size={16} />
								View in store
							</a>
						</Button>
					)}

					<Button
						type="button"
						variant="ghost"
						onClick={() => router.back()}
						disabled={isPending}
						className="w-full text-black"
					>
						Cancel
					</Button>
				</div>
			</div>
			<div className="col-span-3" />
		</form>
	);
}
