"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const THEME_NAV_ITEMS = [
	{ href: "/manage/themes", label: "Vue d'ensemble", exact: true },
	{ href: "/manage/themes/marketplace", label: "Marketplace", exact: false },
	{ href: "/manage/themes/publisher", label: "Publier", exact: false },
] as const;

export function ThemeNav() {
	const pathname = usePathname();

	return (
		<nav className="flex flex-wrap gap-1 p-1 bg-black/5 border-2 border-black/10">
			{THEME_NAV_ITEMS.map((item) => {
				const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
				return (
					<Link
						key={item.href}
						href={item.href}
						className={`relative h-11 px-6 text-[10px] font-black uppercase tracking-[0.25em] inline-flex items-center justify-center transition-all ${
							isActive
								? "bg-black text-white shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
								: "bg-white text-black hover:bg-neutral-100"
						}`}
					>
						{isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-neonGreen" />}
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
}
