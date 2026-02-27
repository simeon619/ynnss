"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sidebarNavItems = [
	{
		title: "General",
		href: "/manage/settings/general",
	},
	{
		title: "Storefront",
		href: "/manage/settings/storefront",
	},
	{
		title: "Shipping",
		href: "/manage/settings/shipping",
	},
	{
		title: "Payments",
		href: "/manage/settings/payments",
	},
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	return (
		<div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 p-6 min-h-[calc(100vh-(--spacing(16)))]">
			<aside className="lg:-mx-4 lg:w-1/5 overflow-x-auto">
				<nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
					{sidebarNavItems.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"justify-start flex h-10 items-center border-2 border-black rounded-none px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-none",
								pathname === item.href ? "bg-black text-white" : "bg-white text-black",
							)}
						>
							{item.title}
						</Link>
					))}
				</nav>
			</aside>
			<div className="flex-1 lg:max-w-4xl">{children}</div>
		</div>
	);
}
