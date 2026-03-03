import type { NewsletterSectionSettings } from "@/lib/theme-types";

interface NewsletterSectionProps {
	settings: NewsletterSectionSettings;
}

export function NewsletterSection({ settings }: NewsletterSectionProps) {
	return (
		<section
			className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20"
			data-theme-section
			data-theme-container
		>
			<div className="border-4 border-black p-8 sm:p-12 text-center">
				<h2
					className="text-2xl sm:text-3xl font-black uppercase tracking-tight"
					data-theme-field="newsletter.title"
				>
					{settings.title}
				</h2>
				<p
					className="mt-3 text-base text-muted-foreground max-w-xl mx-auto"
					data-theme-field="newsletter.description"
				>
					{settings.description}
				</p>
				<div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
					<input
						type="email"
						placeholder={settings.placeholder}
						data-theme-field="newsletter.placeholder"
						className="flex-1 h-12 border-2 border-black px-4 text-sm font-bold uppercase bg-white focus:outline-none focus:ring-0"
					/>
					<button
						type="button"
						data-theme-role="button"
						data-theme-button-kind="primary"
						data-theme-field="newsletter.buttonLabel"
						className="border-2 border-black bg-black text-white font-black uppercase hover:bg-white hover:text-black"
					>
						{settings.buttonLabel}
					</button>
				</div>
			</div>
		</section>
	);
}
