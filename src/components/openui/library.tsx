import { defineComponent, createLibrary } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { TextContent } from "~/components/text-content";
import { StatCard } from "~/components/stat-card";
import { Stack, BentoGrid, BentoCard } from "~/components/layout";
import { AsterBarChart, AsterLineChart, AsterPieChart, AsterAreaChart } from "~/components/charts";

export const TextContentComponent = defineComponent({
	name: "TextContent",
	description: "Renders markdown text. Use for all prose, explanations, code blocks, math, and diagrams.",
	props: z.object({
		content: z.string().describe("Markdown text content"),
		variant: z.enum(["default", "large-heavy", "large", "heavy", "muted"]).optional(),
	}),
	component: ({ props }) => (
		<TextContent content={props.content} variant={props.variant} />
	),
});

export const StatCardComponent = defineComponent({
	name: "StatCard",
	description: "Displays a metric with label, large value, and optional subtitle.",
	props: z.object({
		label: z.string(),
		value: z.string(),
		subtitle: z.string().optional(),
	}),
	component: ({ props }) => (
		<StatCard label={props.label} value={props.value} subtitle={props.subtitle} />
	),
});

export const StackComponent = defineComponent({
	name: "Stack",
	description: "Vertical flex layout. Use as root container for non-grid responses.",
	props: z.object({
		children: z.array(z.string()).describe("Array of component identifiers to render vertically"),
	}),
	component: ({ props, renderNode }) => (
		<Stack>{props.children.map(id => renderNode(id))}</Stack>
	),
});

export const BentoGridComponent = defineComponent({
	name: "BentoGrid",
	description: "CSS grid layout for dashboard-style compositions. Use with StatCards, charts, and mixed content.",
	props: z.object({
		children: z.array(z.string()).describe("Array of component identifiers to place in grid cells"),
		columns: z.enum(["2", "3", "4"]).optional(),
	}),
	component: ({ props, renderNode }) => (
		<BentoGrid columns={Number(props.columns ?? 3) as 2 | 3 | 4}>
			{props.children.map(id => renderNode(id))}
		</BentoGrid>
	),
});

export const BentoCardComponent = defineComponent({
	name: "BentoCard",
	description: "Card wrapper for grid items. Optional column span.",
	props: z.object({
		children: z.array(z.string()).describe("Array of component identifiers to render inside the card"),
		span: z.number().optional(),
	}),
	component: ({ props, renderNode }) => (
		<BentoCard span={props.span}>
			{props.children.map(id => renderNode(id))}
		</BentoCard>
	),
});

const BarChartComponent = defineComponent({
	name: "BarChart",
	description: "Bar chart for comparing quantities across categories.",
	props: z.object({
		title: z.string().optional(),
		labels: z.array(z.string()).describe("X-axis category labels"),
		datasets: z.array(z.object({
			label: z.string(),
			data: z.array(z.number()),
		})).describe("One or more data series"),
	}),
	component: ({ props }) => (
		<AsterBarChart title={props.title} labels={props.labels} datasets={props.datasets} />
	),
});

const LineChartComponent = defineComponent({
	name: "LineChart",
	description: "Line chart for showing trends over time.",
	props: z.object({
		title: z.string().optional(),
		labels: z.array(z.string()).describe("X-axis labels (typically time points)"),
		datasets: z.array(z.object({
			label: z.string(),
			data: z.array(z.number()),
		})).describe("One or more data series"),
	}),
	component: ({ props }) => (
		<AsterLineChart title={props.title} labels={props.labels} datasets={props.datasets} />
	),
});

const PieChartComponent = defineComponent({
	name: "PieChart",
	description: "Donut/pie chart for showing proportions.",
	props: z.object({
		title: z.string().optional(),
		data: z.array(z.object({
			name: z.string(),
			value: z.number(),
		})).describe("Slice data with name and value"),
	}),
	component: ({ props }) => (
		<AsterPieChart title={props.title} data={props.data} />
	),
});

const AreaChartComponent = defineComponent({
	name: "AreaChart",
	description: "Area chart for showing cumulative or stacked trends.",
	props: z.object({
		title: z.string().optional(),
		labels: z.array(z.string()).describe("X-axis labels"),
		datasets: z.array(z.object({
			label: z.string(),
			data: z.array(z.number()),
		})).describe("One or more data series"),
	}),
	component: ({ props }) => (
		<AsterAreaChart title={props.title} labels={props.labels} datasets={props.datasets} />
	),
});

export const asterLibrary = createLibrary({
	root: "Stack",
	components: [
		TextContentComponent,
		StatCardComponent,
		StackComponent,
		BentoGridComponent,
		BentoCardComponent,
		BarChartComponent,
		LineChartComponent,
		PieChartComponent,
		AreaChartComponent,
	],
});
