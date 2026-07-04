import { Notebook01Icon } from "@hugeicons/core-free-icons";
import { ArtifactTab } from "./artifact-tab";
import { LessonRpc } from "~/server/rpc/titled-artifact-rpc"

export function LessonsTab({ workspaceId }: { workspaceId: string }) {
	return (
		<ArtifactTab
			workspaceId={workspaceId}
			config={{
				icon: Notebook01Icon,
				label: "Lessons",
				emptyTitle: "No lessons yet",
				emptyDescription:
					"Lessons will appear here as your teacher agent generates them.",
				detailFallbackTitle: "Lesson",
				errorText: "Failed to load lesson content.",
				listQuery: LessonRpc.listLessons,
				contentQuery: LessonRpc.getLessonContent,
			}}
		/>
	);
}
