import type { ComponentProps } from "react";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis } from "recharts";
import { Line, LineChart as RechartsLineChart } from "recharts";
import { Pie, PieChart as RechartsPieChart, Cell } from "recharts";
import { Area, AreaChart as RechartsAreaChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "~/components/ui/chart";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export interface ChartDataset {
	label: string;
	data: number[];
}

export interface BarChartProps extends ComponentProps<"div"> {
	title?: string;
	labels: string[];
	datasets: ChartDataset[];
}

export function AsterBarChart({ title, labels, datasets, className, ...props }: BarChartProps) {
	const data = labels.map((label, i) => {
		const point: Record<string, string | number> = { name: label };
		datasets.forEach((ds) => { point[ds.label] = ds.data[i] ?? 0; });
		return point;
	});

	const config: ChartConfig = Object.fromEntries(
		datasets.map((ds, i) => [ds.label, { label: ds.label, color: COLORS[i % COLORS.length] }])
	);

	return (
		<div className={className} {...props}>
			{title && <p className="mb-2 text-sm font-medium">{title}</p>}
			<ChartContainer config={config} className="min-h-[200px] w-full">
				<RechartsBarChart data={data} accessibilityLayer>
					<CartesianGrid vertical={false} />
					<XAxis dataKey="name" tickLine={false} axisLine={false} />
					{datasets.map((ds) => (
						<Bar key={ds.label} dataKey={ds.label} fill={`var(--color-${ds.label})`} radius={4} />
					))}
					<ChartTooltip content={<ChartTooltipContent />} />
				</RechartsBarChart>
			</ChartContainer>
		</div>
	);
}

export interface LineChartProps extends ComponentProps<"div"> {
	title?: string;
	labels: string[];
	datasets: ChartDataset[];
}

export function AsterLineChart({ title, labels, datasets, className, ...props }: LineChartProps) {
	const data = labels.map((label, i) => {
		const point: Record<string, string | number> = { name: label };
		datasets.forEach((ds) => { point[ds.label] = ds.data[i] ?? 0; });
		return point;
	});

	const config: ChartConfig = Object.fromEntries(
		datasets.map((ds, i) => [ds.label, { label: ds.label, color: COLORS[i % COLORS.length] }])
	);

	return (
		<div className={className} {...props}>
			{title && <p className="mb-2 text-sm font-medium">{title}</p>}
			<ChartContainer config={config} className="min-h-[200px] w-full">
				<RechartsLineChart data={data} accessibilityLayer>
					<CartesianGrid vertical={false} />
					<XAxis dataKey="name" tickLine={false} axisLine={false} />
					{datasets.map((ds) => (
						<Line key={ds.label} type="monotone" dataKey={ds.label} stroke={`var(--color-${ds.label})`} strokeWidth={2} dot={false} />
					))}
					<ChartTooltip content={<ChartTooltipContent />} />
				</RechartsLineChart>
			</ChartContainer>
		</div>
	);
}

export interface PieChartProps extends ComponentProps<"div"> {
	title?: string;
	data: { name: string; value: number }[];
}

export function AsterPieChart({ title, data, className, ...props }: PieChartProps) {
	const config: ChartConfig = Object.fromEntries(
		data.map((d, i) => [d.name, { label: d.name, color: COLORS[i % COLORS.length] }])
	);

	return (
		<div className={className} {...props}>
			{title && <p className="mb-2 text-sm font-medium">{title}</p>}
			<ChartContainer config={config} className="min-h-[200px] w-full">
				<RechartsPieChart accessibilityLayer>
					{data.map((entry, i) => (
						<Pie key={entry.name} data={[entry]} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} strokeWidth={5}>
							<Cell fill={COLORS[i % COLORS.length]} />
						</Pie>
					))}
					<ChartTooltip content={<ChartTooltipContent />} />
				</RechartsPieChart>
			</ChartContainer>
		</div>
	);
}

export interface AreaChartProps extends ComponentProps<"div"> {
	title?: string;
	labels: string[];
	datasets: ChartDataset[];
}

export function AsterAreaChart({ title, labels, datasets, className, ...props }: AreaChartProps) {
	const data = labels.map((label, i) => {
		const point: Record<string, string | number> = { name: label };
		datasets.forEach((ds) => { point[ds.label] = ds.data[i] ?? 0; });
		return point;
	});

	const config: ChartConfig = Object.fromEntries(
		datasets.map((ds, i) => [ds.label, { label: ds.label, color: COLORS[i % COLORS.length] }])
	);

	return (
		<div className={className} {...props}>
			{title && <p className="mb-2 text-sm font-medium">{title}</p>}
			<ChartContainer config={config} className="min-h-[200px] w-full">
				<RechartsAreaChart data={data} accessibilityLayer>
					<CartesianGrid vertical={false} />
					<XAxis dataKey="name" tickLine={false} axisLine={false} />
					{datasets.map((ds) => (
						<Area key={ds.label} type="monotone" dataKey={ds.label} fill={`var(--color-${ds.label})`} fillOpacity={0.2} stroke={`var(--color-${ds.label})`} />
					))}
					<ChartTooltip content={<ChartTooltipContent />} />
				</RechartsAreaChart>
			</ChartContainer>
		</div>
	);
}
