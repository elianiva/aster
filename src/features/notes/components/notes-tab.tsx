import { useSuspenseQuery } from "@tanstack/react-query";
import { Renderer } from "@openuidev/react-lang";
import { asterLibrary } from "~/components/ai-elements/library"
import { NoteRpc } from "~/features/notes/server/rpc"
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "~/components/ui/empty";
import { StickyNote } from "lucide-react";

interface NotesTabProps {
	workspaceId: string;
}

export function NotesTab({ workspaceId }: NotesTabProps) {
	const { data: note } = useSuspenseQuery(NoteRpc.getNote(workspaceId));


	if (!note) {
		return (
			<div className="flex h-full items-center justify-center p-6">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<StickyNote />
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
		<div className="flex h-full flex-col">
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
