import { ArrowRightIcon } from "lucide-react";
import { YnsLink } from "../yns-link";

interface HeroProps {
	title?: string | null;
	subtitle?: string | null;
	image?: string | null;
}

export function Hero({ title, subtitle, image }: HeroProps) {
	return (
		<section className="relative overflow-hidden bg-secondary/30">
			{image && (
				<div
					className="absolute inset-0 z-0 bg-cover bg-center"
					style={{ backgroundImage: `url(${image})` }}
				/>
			)}
			{image && <div className="absolute inset-0 z-0 bg-black/40" />} {/* Dark overlay for text legibility */}
			<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="py-16 sm:py-20 lg:py-28">
					<div className="max-w-2xl">
						<h1
							className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight uppercase italic ${image ? "text-white" : "text-foreground"}`}
						>
							{title || "Performance & Style sur le terrain"}
						</h1>
						<p
							className={`mt-6 text-lg sm:text-xl leading-relaxed ${image ? "text-white/90" : "text-muted-foreground"}`}
						>
							{subtitle ||
								"Découvrez notre collection exclusive de maillots officiels, survêtements premium et sneakers de performance."}
						</p>
						<div className="mt-10 flex flex-col sm:flex-row gap-4">
							<YnsLink
								prefetch={"eager"}
								href="#products"
								className={`inline-flex items-center justify-center gap-2 h-12 px-8 border-4 border-black text-base font-black uppercase ${image ? "bg-white text-black hover:bg-black hover:text-white" : "bg-black text-white hover:bg-white hover:text-black"}`}
							>
								Voir la Collection
								<ArrowRightIcon className="h-4 w-4" />
							</YnsLink>
							<YnsLink
								prefetch={"eager"}
								href="/collection/sneakers"
								className={`inline-flex items-center justify-center gap-2 h-12 px-8 border-4 text-base font-black uppercase ${image ? "border-white text-white hover:bg-white hover:text-black" : "border-black text-black hover:bg-black hover:text-white"}`}
							>
								Sneakers
							</YnsLink>
						</div>
					</div>
				</div>
			</div>
			{!image && (
				<div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/3 h-full pointer-events-none hidden lg:block" />
			)}
		</section>
	);
}
