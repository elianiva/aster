import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Renderer } from "@openuidev/react-lang";
import { asterLibrary } from "~/components/openui/library";
import { LessonRpc } from "~/server/rpc/titled-artifact-rpc"
import { Skeleton } from "~/components/ui/skeleton";

export const Route = createFileRoute(
  "/workspaces/$workspaceId/lessons/$lessonId",
)({
  component: RouteLessonDetail,
});

function RouteLessonDetail() {
  const { workspaceId, lessonId } = Route.useParams();

  const { data: lesson, isLoading: isLoadingLesson } = useQuery(
    LessonRpc.getLessonContent(workspaceId, lessonId),
  );

  if (isLoadingLesson) {
    return (
      <div className="flex h-full flex-col p-4">
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

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
