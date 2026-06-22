import { useQuery } from "@tanstack/react-query";
import { Renderer } from "@openuidev/react-lang";
import { asterLibrary } from "~/components/openui/library";
import { NoteRpc } from "~/server/rpc/notes";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "~/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { StickyNote01Icon } from "@hugeicons/core-free-icons";
import { Skeleton } from "~/components/ui/skeleton";

interface NotesTabProps {
	workspaceId: string;
}

export function NotesTab({ workspaceId }: NotesTabProps) {
	const { data: note, isLoading } = useQuery(NoteRpc.getNote(workspaceId));

	if (isLoading) {
		return (
			<div className="flex h-full flex-col p-4">
				<Skeleton className="mb-4 h-4 w-40" />
				<div className="flex flex-col gap-3">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
				</div>
			</div>
		);
	}

	if (!note) {
		return (
			<div className="flex h-full items-center justify-center p-6">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<HugeiconsIcon icon={StickyNote01Icon} />
						</EmptyMedia>
						<EmptyTitle>No notes yet</EmptyTitle>
						<EmptyDescription>
							The agent will write notes about your preferences and progress as you learn.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col p-4">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-lg font-semibold">Notes</h2>
				<span className="text-xs text-muted-foreground">
					Updated {new Date(note.updatedAt).toLocaleDateString()}
				</span>
			</div>
			<div className="flex-1 overflow-y-auto">
				<Renderer library={asterLibrary} response={note.content} isStreaming={false} />
			</div>
		</div>
	);
}
