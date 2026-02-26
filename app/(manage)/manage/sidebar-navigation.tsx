"use client";

import {
	BarChart3,
	Folder,
	type LucideIcon,
	Package,
	Settings,
	ShoppingBag,
	ShoppingCart,
	Tag,
	Truck,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarNavigation() {
	const pathname = usePathname();

	const navItems = [
		{ href: "/manage", icon: BarChart3, label: "Vue d'ensemble" },
		{ href: "/manage/orders", icon: ShoppingCart, label: "Commandes" },
		{ href: "/manage/carts", icon: ShoppingBag, label: "Paniers" },
		{ href: "/manage/inventory", icon: Package, label: "Inventaire" },
		{ href: "/manage/products", icon: Tag, label: "Produits" },
		{ href: "/manage/categories", icon: Folder, label: "Catégories" },
		{ href: "/manage/collections", icon: Tag, label: "Collections" },
		{ href: "/manage/customers", icon: Users, label: "Clients" },
		{ href: "/manage/discounts", icon: Tag, label: "Réductions" },
	];

	const systemItems = [
		{ href: "/manage/settings/shipping", icon: Truck, label: "Livraison" },
		{ href: "/manage/settings/storefront", icon: Package, label: "Vitrine" },
		{ href: "/manage/settings/general", icon: Settings, label: "Réglages" },
	];

	const renderItem = (item: { href: string; icon: LucideIcon; label: string }) => {
		const isActive = item.href === "/manage" ? pathname === item.href : pathname.startsWith(item.href);
		const Icon = item.icon;

		return (
			<Link
				key={item.href}
				href={item.href}
				className={`flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest ${
					isActive
						? "bg-black text-white border-2 border-black"
						: "text-black bg-white border-2 border-transparent hover:border-black hover:bg-black hover:text-white"
				}`}
			>
				<Icon size={16} strokeWidth={isActive ? 3 : 2} />
				<span>{item.label}</span>
			</Link>
		);
	};

	return (
		<nav className="flex-1 overflow-y-auto p-4 space-y-2">
			{navItems.map(renderItem)}

			<div className="pt-6 pb-2 px-1 text-[10px] font-black text-black uppercase tracking-widest border-b-2 border-black mb-2">
				Système
			</div>
			{systemItems.map(renderItem)}
		</nav>
	);
}
