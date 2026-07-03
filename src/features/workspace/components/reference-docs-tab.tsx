import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Renderer } from "@openuidev/react-lang";
import { asterLibrary } from "~/components/openui/library";
import { ReferenceRpc } from "~/server/rpc/references";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "~/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon } from "@hugeicons/core-free-icons";
import { Skeleton } from "~/components/ui/skeleton";

interface ReferenceDocsTabProps {
	workspaceId: string;
}

export function ReferenceDocsTab({ workspaceId }: ReferenceDocsTabProps) {
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const { data: references = [], isLoading } = useQuery(ReferenceRpc.listReferences(workspaceId));

	if (isLoading) {
		return (
			<div className="flex h-full flex-col p-4">
				<Skeleton className="mb-4 h-6 w-32" />
				<div className="flex flex-col gap-2">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="flex items-center justify-between rounded-lg border bg-card p-3">
							<Skeleton className="h-4 w-36" />
							<Skeleton className="h-3 w-16" />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (references.length === 0) {
		return (
			<div className="flex h-full items-center justify-center p-6">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<HugeiconsIcon icon={File02Icon} />
						</EmptyMedia>
						<EmptyTitle>No reference docs yet</EmptyTitle>
						<EmptyDescription>
							The agent creates cheat sheets and reference guides alongside your lessons.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		);
	}

	if (selectedId) {
		const reference = references.find((r) => r.id === selectedId);
		return (
			<ReferenceView
				workspaceId={workspaceId}
				referenceId={selectedId}
				title={reference?.title ?? "Reference"}
				onBack={() => setSelectedId(null)}
			/>
		);
	}

	return (
		<div className="flex h-full flex-col p-4">
			<h2 className="mb-4 text-lg font-semibold">Reference Docs</h2>
			<div className="flex flex-col gap-2">
				{references.map((reference) => (
					<button
						key={reference.id}
						type="button"
						onClick={() => setSelectedId(reference.id)}
						className="flex w-full items-center justify-between rounded-lg border bg-card p-3 text-left hover:bg-accent"
					>
						<span className="font-medium">{reference.title}</span>
						<span className="text-xs text-muted-foreground">
							{new Date(reference.createdAt).toLocaleDateString()}
						</span>
					</button>
				))}
			</div>
		</div>
	);
}

interface ReferenceViewProps {
	workspaceId: string;
	referenceId: string;
	title: string;
	onBack: () => void;
}

function ReferenceView({ workspaceId, referenceId, title, onBack }: ReferenceViewProps) {
	const { data: content, isLoading } = useQuery(
		ReferenceRpc.getReferenceContent(workspaceId, referenceId)
	);

	return (
		<div className="flex h-full flex-col p-4">
			<div className="mb-4 flex items-center gap-2">
				<button
					type="button"
					onClick={onBack}
					className="text-sm text-muted-foreground hover:text-foreground"
				>
					← Back
				</button>
				<h2 className="text-lg font-semibold">{title}</h2>
			</div>
			<div className="flex-1 overflow-y-auto">
				{isLoading ? (
					<div className="flex flex-col gap-3">
						<Skeleton className="h-4 w-48" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
					</div>
				) : content ? (
					<Renderer library={asterLibrary} response={content.content} isStreaming={false} />
				) : (
					<p className="text-sm text-muted-foreground">Failed to load reference content.</p>
				)}
			</div>
		</div>
	);
}
