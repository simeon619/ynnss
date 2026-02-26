"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/money";

interface RevenueChartProps {
	data: { name: string; total: number; profit?: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
	const hasProfitData = data.some((d) => d.profit !== undefined);

	return (
		<ResponsiveContainer width="100%" height="100%">
			<AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
				<CartesianGrid strokeDasharray="0" stroke="#000000" vertical={false} />
				<XAxis
					dataKey="name"
					stroke="#000000"
					fontSize={12}
					fontWeight="900"
					tickLine={true}
					axisLine={true}
					minTickGap={30}
					dy={10}
					className="uppercase font-mono"
				/>
				<YAxis
					stroke="#000000"
					fontSize={12}
					fontWeight="900"
					tickLine={true}
					axisLine={true}
					tickFormatter={(value) => `${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
					className="font-mono"
				/>
				<Tooltip
					cursor={{ stroke: "#000000", strokeWidth: 2, strokeDasharray: "4 4" }}
					formatter={(value: number, name: string) => [
						<span className="font-mono font-black text-base" key={`${name}-${value}`}>
							{formatMoney({ amount: value.toString(), currency: "XOF", locale: "fr-CI" })}
						</span>,
						<span className="font-black uppercase tracking-widest text-[10px] ml-2" key={`${name}-label`}>
							{name === "total" ? "REVENUS" : "PROFIT"}
						</span>,
					]}
					contentStyle={{
						backgroundColor: "#ffffff",
						borderRadius: "0px",
						border: "4px solid #000000",
						boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
						padding: "16px",
					}}
					itemStyle={{ padding: "2px 0" }}
					labelStyle={{
						display: "none",
					}}
				/>
				<Area
					type="monotone"
					dataKey="total"
					stroke="#000000"
					strokeWidth={6}
					fillOpacity={0.1}
					fill="#000000"
					activeDot={{
						r: 8,
						stroke: "#000000",
						strokeWidth: 4,
						fill: "#ffffff",
					}}
				/>
				{hasProfitData && (
					<Area
						type="monotone"
						dataKey="profit"
						stroke="#000000"
						strokeWidth={4}
						fillOpacity={0.3}
						fill="#000000"
						activeDot={{
							r: 6,
							stroke: "#000000",
							strokeWidth: 3,
							fill: "#ffffff",
						}}
					/>
				)}
			</AreaChart>
		</ResponsiveContainer>
	);
}
