"use client";

import { Check, ChevronDown, DollarSign, Package, Truck, XCircle } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateOrderStatusAction } from "../../actions";

type OrderStatus = "pending" | "paid" | "shipped" | "cancelled";

export function OrderStatusActions({
	orderId,
	currentStatus,
}: {
	orderId: string;
	currentStatus: OrderStatus;
}) {
	const [isPending, startTransition] = useTransition();

	const handleStatusChange = (newStatus: OrderStatus) => {
		startTransition(async () => {
			try {
				await updateOrderStatusAction(orderId, newStatus);
				toast.success("Statut mis à jour avec succès");
			} catch (error) {
				toast.error("Erreur lors de la mise à jour");
			}
		});
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white uppercase font-black tracking-widest h-10 px-6 transition-none"
					disabled={isPending}
				>
					Changer le statut <ChevronDown className="ml-2 h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-56 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white p-0"
			>
				<DropdownMenuItem
					onClick={() => handleStatusChange("pending")}
					disabled={currentStatus === "pending"}
					className="rounded-none focus:bg-black focus:text-white p-3 font-black uppercase text-xs tracking-widest cursor-pointer"
				>
					<Package className="mr-3 h-4 w-4" /> En attente
					{currentStatus === "pending" && <Check className="ml-auto h-4 w-4" />}
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => handleStatusChange("paid")}
					disabled={currentStatus === "paid"}
					className="rounded-none focus:bg-black focus:text-white p-3 font-black uppercase text-xs tracking-widest cursor-pointer"
				>
					<DollarSign className="mr-3 h-4 w-4" /> Payée
					{currentStatus === "paid" && <Check className="ml-auto h-4 w-4" />}
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => handleStatusChange("shipped")}
					disabled={currentStatus === "shipped"}
					className="rounded-none focus:bg-black focus:text-white p-3 font-black uppercase text-xs tracking-widest cursor-pointer"
				>
					<Truck className="mr-3 h-4 w-4" /> Expédiée
					{currentStatus === "shipped" && <Check className="ml-auto h-4 w-4" />}
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => handleStatusChange("cancelled")}
					disabled={currentStatus === "cancelled"}
					className="rounded-none focus:bg-red-600 focus:text-white p-3 font-black uppercase text-xs tracking-widest text-red-600 cursor-pointer"
				>
					<XCircle className="mr-3 h-4 w-4" /> Annulée
					{currentStatus === "cancelled" && <Check className="ml-auto h-4 w-4" />}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
