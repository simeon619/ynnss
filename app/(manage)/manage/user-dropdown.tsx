"use client";

import { LogOut, User } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "./actions";

export function UserDropdown() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white"
				>
					<User size={18} strokeWidth={2.5} />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-56 border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white p-0"
			>
				<DropdownMenuLabel className="font-black text-[10px] uppercase tracking-widest text-black p-3 bg-white border-b-2 border-black">
					Mon Compte
				</DropdownMenuLabel>
				<DropdownMenuItem
					className="text-black focus:bg-black focus:text-white font-bold text-[10px] uppercase tracking-widest rounded-none p-3 cursor-pointer"
					onClick={async () => {
						await logoutAction();
					}}
				>
					<LogOut className="mr-2 h-4 w-4" strokeWidth={2.5} />
					<span>Déconnexion</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
