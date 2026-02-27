"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function TransferOwnershipCard() {
	const [isLoading, setIsLoading] = useState(false);

	async function handleSubmit(formData: FormData) {
		setIsLoading(true);

		const email = formData.get("email");

		// This is a placeholder since full auth/transfer logic isn't defined yet
		// We simulate the API call here
		await new Promise((resolve) => setTimeout(resolve, 1000));

		if (email) {
			toast.success(`Transfer invitation sent to ${email}`);
		} else {
			toast.error("Please enter a valid email address.");
		}

		setIsLoading(false);
	}

	return (
		<div className="border-4 border-red-600 bg-white shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] flex flex-col">
			<div className="border-b-4 border-red-600 p-4 bg-red-50 flex items-center gap-2">
				<AlertCircle className="h-5 w-5 text-red-600" strokeWidth={3} />
				<h2 className="text-sm font-black text-red-600 uppercase tracking-widest">Transférer la Propriété</h2>
			</div>

			<div className="p-6">
				<p className="text-[10px] font-mono font-bold text-neutral-600 uppercase tracking-widest leading-relaxed">
					Transférer la propriété annulera votre abonnement actuel et enverra une invitation au nouveau
					propriétaire. Cette action est irréversible une fois acceptée.
				</p>

				<form action={handleSubmit} className="mt-6 space-y-4">
					<div className="flex flex-col md:flex-row gap-4 max-w-lg items-end">
						<div className="flex-1 space-y-2 w-full">
							<label htmlFor="email" className="text-[10px] font-bold text-black uppercase tracking-widest">
								Email du nouveau propriétaire
							</label>
							<input
								type="email"
								id="email"
								name="email"
								placeholder="nouveau-proprio@exemple.com"
								required
								className="w-full h-10 px-3 border-2 border-black focus:outline-none focus:border-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow text-sm font-mono"
							/>
						</div>
						<button
							type="submit"
							disabled={isLoading}
							className="h-10 px-6 border-2 border-red-600 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-white hover:text-red-600 hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all duration-200 disabled:opacity-50 flex items-center shrink-0"
						>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Transférer
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
