import { ArrowRight, Box, Layers, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function ManageThemesHomePage() {
	return (
		<div className="space-y-16 py-8">
			{/* Worklow Pipeline Visualization */}
			<section className="relative">
				<div className="flex items-center gap-4 mb-8">
					<div className="h-6 w-1 bg-black" />
					<h2 className="text-sm font-black uppercase tracking-[0.3em]">Lifecycle_Pipeline</h2>
				</div>

				<div className="grid gap-0 md:grid-cols-3 border-4 border-black bg-black">
					<WorkflowStep
						number="01"
						title="Architect"
						desc="Définissez les tokens, les couleurs et la structure de base."
						icon={<Layers className="w-5 h-5" />}
					/>
					<WorkflowStep
						number="02"
						title="Simulate"
						desc="Visualisez le rendu en temps réel sur tous les viewports."
						icon={<Box className="w-5 h-5" />}
					/>
					<WorkflowStep
						number="03"
						title="Deploy"
						desc="Publiez votre version stable vers la production."
						icon={<ShoppingBag className="w-5 h-5" />}
					/>
				</div>
			</section>

			{/* Main Quick Actions - Asymmetric Tension */}
			<div className="grid gap-8 lg:grid-cols-[1.2fr_1fr_1fr]">
				<Link
					href="/manage/themes/customize"
					className="group relative border-4 border-black bg-white p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[16px_16px_0px_0px_rgba(57,255,20,0.5)] flex flex-col justify-between min-h-[320px]"
				>
					<div>
						<p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400 group-hover:text-black transition-colors">
							Core_Engine
						</p>
						<h3 className="text-5xl font-black uppercase mt-4 leading-none tracking-tighter">
							Personnaliser
							<br />
							Storefront
						</h3>
					</div>
					<div className="flex items-end justify-between">
						<p className="text-xs font-bold uppercase max-w-[200px] leading-tight text-neutral-500 group-hover:text-black">
							Accédez à l'éditeur visuel avancé et gérez votre design system.
						</p>
						<div className="w-12 h-12 border-4 border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
							<ArrowRight className="w-6 h-6" />
						</div>
					</div>
				</Link>

				<Link
					href="/manage/themes/marketplace"
					className="group border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-all flex flex-col justify-between"
				>
					<div>
						<p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100">
							Global_Assets
						</p>
						<h3 className="text-2xl font-black uppercase mt-2 tracking-tighter">Marketplace</h3>
					</div>
					<p className="text-[10px] font-bold uppercase mt-4 opacity-60 group-hover:opacity-100">
						Explorez et installez des thèmes optimisés pour la conversion.
					</p>
				</Link>

				<Link
					href="/manage/themes/publisher"
					className="group border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-all flex flex-col justify-between"
				>
					<div>
						<p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100">
							Dev_Portal
						</p>
						<h3 className="text-2xl font-black uppercase mt-2 tracking-tighter">Publisher</h3>
					</div>
					<p className="text-[10px] font-bold uppercase mt-4 opacity-60 group-hover:opacity-100">
						Soumettez vos propres créations et gérez vos publications.
					</p>
				</Link>
			</div>
		</div>
	);
}

function WorkflowStep({
	number,
	title,
	desc,
	icon,
}: {
	number: string;
	title: string;
	desc: string;
	icon: React.ReactNode;
}) {
	return (
		<div className="relative bg-white border-black md:border-r-4 last:border-r-0 p-6 flex flex-col gap-4 group hover:bg-neutral-50 transition-colors">
			<div className="flex items-center justify-between">
				<span className="text-4xl font-black font-mono opacity-10 group-hover:opacity-20 transition-opacity italic leading-none">
					{number}
				</span>
				<div className="w-10 h-10 border-2 border-black flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
					{icon}
				</div>
			</div>
			<div>
				<h4 className="text-lg font-black uppercase tracking-tighter">{title}</h4>
				<p className="text-[10px] font-bold uppercase leading-relaxed text-neutral-500 mt-1">{desc}</p>
			</div>
			{/* Connecting line decoration */}
			<div className="hidden md:block absolute top-1/2 -right-3 w-6 h-[2px] bg-black z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
		</div>
	);
}
