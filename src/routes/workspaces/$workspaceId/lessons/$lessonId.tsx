import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Renderer } from "@openuidev/react-lang";
import { asterLibrary } from "~/features/artifact/components/library"
import { LessonRpc } from "~/features/artifact/server/lessons"

export const Route = createFileRoute(
  "/workspaces/$workspaceId/lessons/$lessonId",
)({
  component: RouteLessonDetail,
});

function RouteLessonDetail() {
  const { workspaceId, lessonId } = Route.useParams();

	const { data: lesson } = useSuspenseQuery(
		LessonRpc.getLessonContent(workspaceId, lessonId),
	);


  if (!lesson) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Lesson not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex-1 overflow-y-auto mx-auto max-w-4xl">
        <Renderer library={asterLibrary} response={lesson.content} isStreaming={false} />
      </div>
    </div>
  );
}
