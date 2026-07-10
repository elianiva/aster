import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ResourceRpc } from "~/features/resource/server/rpc";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "~/components/ui/empty";
import { Link04Icon, ArrowUpRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

type ResourceType = "knowledge" | "wisdom";

const FILTER_OPTIONS = [
	{ label: "All", value: null },
	{ label: "Knowledge", value: "knowledge" as ResourceType },
	{ label: "Wisdom", value: "wisdom" as ResourceType },
] as const;

interface ResourcesTabProps {
	workspaceId: string;
}

export function ResourcesTab({ workspaceId }: ResourcesTabProps) {
	const { data: resources = [] } = useSuspenseQuery(ResourceRpc.listResources(workspaceId));
	const [search, setSearch] = useState("");
	const [activeFilter, setActiveFilter] = useState<ResourceType | null>(null);

	const filtered = resources.filter((r) => {
		const matchesType = activeFilter === null || r.type === activeFilter;
		const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase())
			|| r.annotation.toLowerCase().includes(search.toLowerCase());
		return matchesType && matchesSearch;
	});

	if (resources.length === 0) {
		return (
			<div className="flex h-full items-center justify-center p-6">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<HugeiconsIcon icon={Link04Icon} />
						</EmptyMedia>
						<EmptyTitle>No resources yet</EmptyTitle>
						<EmptyDescription>
							The agent curates trusted sources here as it finds them for your lessons.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col items-center overflow-y-auto py-6">
			<h1 className="mb-6 text-lg font-semibold">Resources</h1>
			<div className="w-full max-w-3xl">
				<div className="mb-3 flex gap-1">
					{FILTER_OPTIONS.map((option) => (
						<button
							key={option.label}
							type="button"
							onClick={() => setActiveFilter(option.value)}
							className={cn(
								"rounded-full px-3 py-1 text-xs font-medium transition-colors",
								activeFilter === option.value
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground hover:text-foreground",
							)}
						>
							{option.label}
						</button>
					))}
				</div>
				<Input
					placeholder="Search resources..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="mb-4"
				/>
				{filtered.length === 0 ? (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<HugeiconsIcon icon={Link04Icon} />
							</EmptyMedia>
							<EmptyTitle>{search ? "No matches" : "No resources yet"}</EmptyTitle>
							<EmptyDescription>
								{search
									? "Try a different search term."
									: "The agent curates trusted sources here as it finds them for your lessons."}
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
					<div className="flex flex-col">
						{filtered.map((resource) => (
							<a
								key={resource.id}
								href={resource.url}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center justify-between border-b px-2 py-3 text-sm hover:bg-accent"
							>
								<div className="flex min-w-0 items-center gap-2">
									<HugeiconsIcon
										icon={Link04Icon}
										className="size-4 shrink-0 text-muted-foreground"
									/>
									<div className="min-w-0">
										<p className="font-medium truncate">{resource.title}</p>
										<p className="mt-0.5 text-xs text-muted-foreground truncate">
											{resource.annotation}
										</p>
									</div>
								</div>
								<HugeiconsIcon
									icon={ArrowUpRight02Icon}
									className="ml-2 size-4 shrink-0 text-muted-foreground"
								/>
							</a>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
