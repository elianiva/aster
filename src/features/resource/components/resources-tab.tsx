import { useSuspenseQuery } from "@tanstack/react-query";
import { ResourceRpc } from "~/features/resource/server/rpc"
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "~/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link04Icon } from "@hugeicons/core-free-icons";

interface ResourcesTabProps {
	workspaceId: string;
}

export function ResourcesTab({ workspaceId }: ResourcesTabProps) {
	const { data: resources = [] } = useSuspenseQuery(ResourceRpc.listResources(workspaceId));


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

	const knowledge = resources.filter((r) => r.type === "knowledge");
	const wisdom = resources.filter((r) => r.type === "wisdom");

	return (
		<div className="flex h-full flex-col overflow-y-auto">
			<h2 className="mb-4 text-lg font-semibold">Resources</h2>
			<ResourceSection title="Knowledge" items={knowledge} />
			{wisdom.length > 0 ? <ResourceSection title="Wisdom" items={wisdom} /> : null}
		</div>
	);
}

function ResourceSection({
	title,
	items,
}: {
	title: string;
	items: { id: string; title: string; url: string; annotation: string }[];
}) {
	if (items.length === 0) return null;
	return (
		<section className="mb-6">
			<h3 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h3>
			<div className="flex flex-col gap-2">
				{items.map((resource) => (
					<a
						key={resource.id}
						href={resource.url}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-start gap-3 rounded-lg border bg-card p-3 hover:bg-accent"
					>
						<HugeiconsIcon
							icon={Link04Icon}
							className="mt-0.5 size-4 shrink-0 text-muted-foreground"
						/>
						<div className="min-w-0 flex-1">
							<p className="font-medium leading-tight">{resource.title}</p>
							<p className="mt-1 text-sm text-muted-foreground">{resource.annotation}</p>
						</div>
					</a>
				))}
			</div>
		</section>
	);
}
