import { createFileRoute, Outlet, useMatch, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LessonRpc } from "~/server/rpc/lessons";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notebook01Icon } from "@hugeicons/core-free-icons";

export const Route = createFileRoute("/workspaces/$workspaceId/lessons")({
  component: RouteLessons,
  pendingComponent: LessonsSkeleton,
});

function RouteLessons() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();
  const { data: lessons = [], isLoading } = useQuery(
    LessonRpc.listLessons(workspaceId),
  );

  const match = useMatch({ strict: false });
  const lessonId = (match?.params as { lessonId?: string })?.lessonId ?? null;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
      <div className="flex w-64 shrink-0 flex-col border-l bg-card p-3">
        <h2 className="mb-3 px-2 text-sm font-semibold">Lessons</h2>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Notebook01Icon} />
              </EmptyMedia>
              <EmptyTitle>No lessons yet</EmptyTitle>
              <EmptyDescription>
                Lessons will appear here as your teacher agent generates them.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-1">
            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                type="button"
                onClick={() =>
                  navigate({
                    to: `/workspaces/${workspaceId}/lessons/${lesson.id}`,
                  })
                }
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ${
                  lessonId === lesson.id ? "bg-accent" : ""
                }`}
              >
                <span className="truncate font-medium">{lesson.title}</span>
                <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                  {new Date(lesson.createdAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LessonsSkeleton() {
  return (
    <div className="flex h-full">
      <div className="flex-1 p-4">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="w-64 shrink-0 border-l p-3 space-y-2">
        <Skeleton className="h-4 w-16" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}
