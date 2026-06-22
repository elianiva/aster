import type { ComponentProps } from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  XAxis,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  Area,
  AreaChart as RechartsAreaChart,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "~/components/ui/chart";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export interface ChartDataset {
  label: string;
  data: number[];
}

export interface ChartPieData {
  name: string;
  value: number;
}

export type ChartType = "bar" | "line" | "pie" | "area";

export interface ChartProps extends ComponentProps<"div"> {
  type: ChartType;
  title?: string;
  labels?: string[];
  datasets?: ChartDataset[];
  data?: ChartPieData[];
}

export function Chart({ type, title, labels = [], datasets = [], data = [], className, ...props }: ChartProps) {
  if (type === "pie") {
    return <PieChartInner title={title} data={data} className={className} {...props} />;
  }

  return <XYChartInner type={type} title={title} labels={labels} datasets={datasets} className={className} {...props} />;
}

function PieChartInner({ title, data, className, ...props }: { title?: string; data: ChartPieData[] } & ComponentProps<"div">) {
  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.name, { label: d.name, color: COLORS[i % COLORS.length] }]),
  );

  return (
    <div className={className} {...props}>
      {title && <p className="mb-2 text-sm font-medium">{title}</p>}
      <ChartContainer config={config} className="min-h-[200px] w-full">
        <RechartsPieChart accessibilityLayer>
          {data.map((entry, i) => (
            <Pie
              key={entry.name}
              data={[entry]}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={80}
              strokeWidth={5}
            >
              <Cell fill={COLORS[i % COLORS.length]} />
            </Pie>
          ))}
          <ChartTooltip content={<ChartTooltipContent />} />
        </RechartsPieChart>
      </ChartContainer>
    </div>
  );
}

function XYChartInner({
  type,
  title,
  labels,
  datasets,
  className,
  ...props
}: {
  type: "bar" | "line" | "area";
  title?: string;
  labels: string[];
  datasets: ChartDataset[];
} & ComponentProps<"div">) {
  const chartData = labels.map((label, i) => {
    const point: Record<string, string | number> = { name: label };
    datasets.forEach((ds) => {
      point[ds.label] = ds.data[i] ?? 0;
    });
    return point;
  });

  const config: ChartConfig = Object.fromEntries(
    datasets.map((ds, i) => [ds.label, { label: ds.label, color: COLORS[i % COLORS.length] }]),
  );

  const ChartComponent = {
    bar: RechartsBarChart,
    line: RechartsLineChart,
    area: RechartsAreaChart,
  }[type];

  const DataComponent = { bar: Bar, line: Line, area: Area }[type];

  return (
    <div className={className} {...props}>
      {title && <p className="mb-2 text-sm font-medium">{title}</p>}
      <ChartContainer config={config} className="min-h-[200px] w-full">
        <ChartComponent data={chartData} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          {datasets.map((ds) => (
            <DataComponent
              key={ds.label}
              {...(type === "line" ? { type: "monotone" as const, strokeWidth: 2, dot: false } : {})}
              {...(type === "area" ? { type: "monotone" as const, fillOpacity: 0.2 } : {})}
              dataKey={ds.label}
              fill={`var(--color-${ds.label})`}
              stroke={type !== "bar" ? `var(--color-${ds.label})` : undefined}
              {...(type === "bar" ? { radius: 4 } : {})}
            />
          ))}
          <ChartTooltip content={<ChartTooltipContent />} />
        </ChartComponent>
      </ChartContainer>
    </div>
  );
}
