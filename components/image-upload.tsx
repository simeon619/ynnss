"use client";

import axios from "axios";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
	value: string[];
	onChange: (value: string[]) => void;
	onRemove: (value: string) => void;
}

export function ImageUpload({ value, onChange, onRemove }: ImageUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [confirmRemoveUrl, setConfirmRemoveUrl] = useState<string | null>(null);

	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			setIsUploading(true);
			const newUrls: string[] = [];

			try {
				for (const file of acceptedFiles) {
					// 1. Get Presigned URL
					const { data } = await axios.post("/api/upload", {
						filename: file.name,
						contentType: file.type,
					});

					// 2. Upload to S3 directly
					await axios.put(data.uploadUrl, file, {
						headers: {
							"Content-Type": file.type,
						},
					});

					// 3. Add Public URL
					newUrls.push(data.publicUrl);
				}

				onChange([...value, ...newUrls]);
			} catch (error) {
				console.error("Upload failed", error);
				alert("Failed to upload image.");
			} finally {
				setIsUploading(false);
			}
		},
		[value, onChange],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"image/png": [],
			"image/jpeg": [],
			"image/webp": [],
			"image/avif": [],
		},
		maxSize: 5 * 1024 * 1024, // 5MB
	});

	return (
		<div>
			<div className="flex flex-wrap gap-4">
				{/* Existing Images */}
				{value.map((url, idx) => (
					<div
						key={idx}
						className="relative w-[120px] h-[120px] overflow-hidden bg-white border-2 border-black group"
					>
						<Image src={url} alt={`Product ${idx}`} fill className="object-cover" />
						{confirmRemoveUrl === url ? (
							<div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-1">
								<span className="text-white text-[9px] font-bold uppercase">Supprimer ?</span>
								<div className="flex gap-1">
									<button
										type="button"
										onClick={() => {
											onRemove(url);
											setConfirmRemoveUrl(null);
										}}
										className="px-1.5 py-0.5 bg-white text-black text-[9px] font-bold uppercase border border-white hover:bg-red-500 hover:text-white hover:border-red-500"
									>
										OUI
									</button>
									<button
										type="button"
										onClick={() => setConfirmRemoveUrl(null)}
										className="px-1.5 py-0.5 bg-transparent text-white text-[9px] font-bold uppercase border border-white hover:bg-white hover:text-black"
									>
										NON
									</button>
								</div>
							</div>
						) : (
							<button
								type="button"
								onClick={() => setConfirmRemoveUrl(url)}
								className="absolute top-1 right-1 p-1 bg-black text-white"
							>
								<X size={12} />
							</button>
						)}
					</div>
				))}

				{/* Dropzone */}
				<div
					{...getRootProps()}
					className={cn(
						"w-[120px] h-[120px] border-2 border-dashed border-black flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-black hover:text-white",
						isDragActive ? "bg-black text-white" : "border-black",
					)}
				>
					<input {...getInputProps()} />
					{isUploading ? (
						<Loader2 className="h-5 w-5 text-white animate-spin" />
					) : (
						<Upload className="h-5 w-5 text-black" />
					)}
				</div>
			</div>
		</div>
	);
}
