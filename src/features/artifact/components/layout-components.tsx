import type { ComponentProps, ReactNode } from "react";
import { cn } from "~/lib/utils";

export interface StackProps extends ComponentProps<"div"> {
	children: ReactNode;
}

export function Stack({ children, className, ...props }: StackProps) {
	return (
		<div className={cn("flex flex-col gap-4", className)} {...props}>
			{children}
		</div>
	);
}

export interface BentoGridProps extends ComponentProps<"div"> {
	children: ReactNode;
	columns?: 2 | 3 | 4;
}

export function BentoGrid({ children, columns = 3, className, ...props }: BentoGridProps) {
	const gridClass = {
		2: "grid-cols-1 sm:grid-cols-2",
		3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
		4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
	}[columns];

	return (
		<div className={cn("grid", gridClass, "gap-4", className)} {...props}>
			{children}
		</div>
	);
}

export interface BentoCardProps extends ComponentProps<"div"> {
	children: ReactNode;
	span?: number;
}

export function BentoCard({ children, span, className, ...props }: BentoCardProps) {
	const spanClass = span ? `col-span-${Math.min(Math.max(span, 1), 12)}` : "";

	return (
		<div className={cn("rounded-lg bg-secondary/70 p-4", spanClass, className)} {...props}>
			{children}
		</div>
	);
}
