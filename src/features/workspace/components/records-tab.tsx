import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Renderer } from "@openuidev/react-lang";
import { asterLibrary } from "~/components/openui/library";
import { RecordRpc } from "~/server/rpc/records";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "~/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { Brain02Icon } from "@hugeicons/core-free-icons";
import { Skeleton } from "~/components/ui/skeleton";

interface RecordsTabProps {
	workspaceId: string;
}

export function RecordsTab({ workspaceId }: RecordsTabProps) {
	const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

	const { data: records = [], isLoading } = useQuery(RecordRpc.listRecords(workspaceId));

	if (isLoading) {
		return (
			<div className="flex h-full flex-col p-4">
				<Skeleton className="mb-4 h-6 w-32" />
				<div className="flex flex-col gap-2">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="flex items-center justify-between rounded-lg border bg-card p-3">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-3 w-16" />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (records.length === 0) {
		return (
			<div className="flex h-full items-center justify-center p-6">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<HugeiconsIcon icon={Brain02Icon} />
						</EmptyMedia>
						<EmptyTitle>No records yet</EmptyTitle>
						<EmptyDescription>
							Learning records will appear here as you progress through lessons.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		);
	}

	if (selectedRecordId) {
		return (
			<RecordView
				workspaceId={workspaceId}
				recordId={selectedRecordId}
				onBack={() => setSelectedRecordId(null)}
			/>
		);
	}

	return (
		<div className="flex h-full flex-col p-4">
			<h2 className="mb-4 text-lg font-semibold">Learning Records</h2>
			<div className="flex flex-col gap-2">
				{records.map((record) => (
					<button
						key={record.id}
						type="button"
						onClick={() => setSelectedRecordId(record.id)}
						className="flex w-full items-center justify-between rounded-lg border bg-card p-3 text-left hover:bg-accent"
					>
						<span className="text-sm text-muted-foreground">Record</span>
						<span className="text-xs text-muted-foreground">
							{new Date(record.createdAt).toLocaleDateString()}
						</span>
					</button>
				))}
			</div>
		</div>
	);
}

interface RecordViewProps {
	workspaceId: string;
	recordId: string;
	onBack: () => void;
}

function RecordView({ workspaceId, recordId, onBack }: RecordViewProps) {
	const { data: content, isLoading } = useQuery(
		RecordRpc.getRecordContent(workspaceId, recordId)
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
				<h2 className="text-lg font-semibold">Learning Record</h2>
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
					<p className="text-sm text-muted-foreground">Failed to load record content.</p>
				)}
			</div>
		</div>
	);
}
