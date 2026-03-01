import { ThemeNav } from "./theme-nav";

export default function ManageThemesHubLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative min-h-screen bg-[#F0F0F0] font-sans text-black selection:bg-black selection:text-white pb-32 overflow-hidden">
			{/* Background Blueprint Grid */}
			<div
				className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
				style={{
					backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
					backgroundSize: "60px 60px",
				}}
			/>

			<div className="relative z-10 space-y-12 pt-8 px-4">
				{/* Massive Architectural Header */}
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-8 border-black pb-8">
					<div className="space-y-2">
						<div className="flex items-center gap-3">
							<div className="h-4 w-4 bg-neonGreen shadow-[0_0_15px_rgba(57,255,20,0.5)]" />
							<span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">
								System_Module.02
							</span>
						</div>
						<h1 className="text-6xl md:text-9xl font-black uppercase leading-none tracking-tighter">
							THEME
							<br />
							STUDIO
						</h1>
					</div>

					<div className="max-w-md text-right border-l-4 md:border-l-0 md:border-r-4 border-black pl-4 md:pl-0 md:pr-4 py-2">
						<p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">
							Status_Report
						</p>
						<p className="text-sm font-mono font-bold uppercase italic leading-tight">
							Environnement de conception actif. Prêt pour déploiement.
						</p>
					</div>
				</div>

				<ThemeNav />

				<main className="relative">{children}</main>
			</div>
		</div>
	);
}
