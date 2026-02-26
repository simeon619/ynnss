import { eq } from "drizzle-orm";

import { ChevronRight, ExternalLink, Search, User } from "lucide-react";

import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminBodyLock } from "@/components/admin/admin-body-lock";
import { CommandPalette } from "@/components/admin/command-palette";
import { Toaster } from "@/components/ui/sonner";
import { getActiveStoreContext, setActiveStore, verifySession } from "@/lib/auth";
import { globalDb } from "@/lib/db";
import { stores } from "@/lib/db/schema_global";
import { SidebarNavigation } from "./sidebar-navigation";
import { UserDropdown } from "./user-dropdown";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	await connection(); // Important in Next.js 15+ to opt into dynamic rendering properly before accessing cookies().
	const session = await verifySession();
	if (!session || !session.userId) {
		redirect("/login");
	}

	// Strict Separation: Admins stay in /admin
	if (session.role === "ADMIN") {
		redirect("/admin");
	}

	const activeStoreId = await getActiveStoreContext();

	const userStores = await globalDb.query.stores.findMany({
		where: eq(stores.ownerId, session.userId),
	});

	if (userStores.length === 0) {
		// User has no stores -> Onboarding
		redirect("/create-store");
	}

	// Verify the chosen activeStoreId is actually valid for this user
	const activeStore = activeStoreId ? userStores.find((s) => s.id === activeStoreId) : null;

	if (!activeStore) {
		// If they have only 1 store, auto-select it
		if (userStores.length === 1) {
			const autoStoreId = userStores[0].id;
			await setActiveStore(autoStoreId);
			// Force a redirect to ensure the cookie is processed and the context is fresh
			redirect("/manage");
		}

		// Otherwise, they must select a store
		redirect("/select-store");
	}

	return (
		<div className="flex h-screen w-full bg-white overflow-hidden font-sans">
			<AdminBodyLock />
			<Toaster richColors position="top-right" />
			<CommandPalette />
			{/* Sidebar - Desktop */}
			<aside className="hidden w-64 flex-col border-r-2 border-black bg-white md:flex z-10">
				<div className="flex h-16 items-center border-b-2 border-black px-6">
					<Link
						href="/manage"
						className="flex items-center gap-2 font-black text-xl tracking-tighter uppercase"
					>
						<div className="w-8 h-8 bg-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
							<span className="text-white text-xs font-bold font-mono">UF</span>
						</div>
						<span>Dashboard</span>
					</Link>
				</div>

				<SidebarNavigation />

				<div className="border-t-2 border-black p-4 space-y-4">
					<Link
						href="/"
						target="_blank"
						className="flex items-center justify-center gap-2 w-full h-10 border-2 border-black bg-white text-[10px] font-black uppercase tracking-widest text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white"
					>
						<ExternalLink size={14} />
						<span>Voir Boutique</span>
					</Link>
					<div className="flex items-center gap-3 p-3 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
						<div className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center shrink-0">
							<User size={16} className="text-black" />
						</div>
						<div className="flex-1 overflow-hidden">
							<p className="text-xs font-black truncate uppercase tracking-wider">{session.phone}</p>
							<p className="text-[10px] text-black truncate font-mono uppercase tracking-widest flex items-center gap-1">
								<span className="w-1.5 h-1.5 bg-black block"></span>
								{session.role}
							</p>
						</div>
					</div>
				</div>
			</aside>

			{/* Main Content */}
			<div className="flex flex-1 w-full flex-col overflow-hidden min-w-0">
				{/* Header */}
				<header className="flex h-14 items-center justify-between border-b-2 border-black bg-white px-4 z-10 relative">
					<div className="flex items-center gap-4">
						<div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-black">
							<Link
								href="/manage"
								className="hover:text-black hover:underline decoration-2 underline-offset-4"
							>
								Manage
							</Link>
							<ChevronRight size={14} className="mx-2" />
							<span className="text-black font-black">Dashboard</span>
						</div>
					</div>

					<div className="flex items-center gap-4">
						<div className="relative hidden lg:block">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={14} />
							<input
								type="text"
								placeholder="Rechercher... (⌘K)"
								className="h-10 w-64 border-2 border-black bg-white pl-9 pr-4 text-[10px] font-bold uppercase tracking-widest font-mono focus:outline-none focus:ring-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
							/>
						</div>
						<UserDropdown />
					</div>
				</header>

				{/* Viewport - Scrollable */}
				<main className="flex-1 overflow-auto p-4 lg:p-6 min-h-0 w-full">{children}</main>
			</div>
		</div>
	);
}
