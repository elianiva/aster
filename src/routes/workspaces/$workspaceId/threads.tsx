import { useState } from "react";
import { createFileRoute, Outlet, redirect, useMatch, useNavigate } from "@tanstack/react-router";
import { Skeleton } from "~/components/ui/skeleton";
import { useThreads } from "~/features/thread/hooks/use-threads"
import { ThreadList } from "~/features/thread/components/thread-list"

export const Route = createFileRoute("/workspaces/$workspaceId/threads")({
  component: RouteThreads,
  pendingComponent: ThreadsSkeleton,
  beforeLoad: ({ params, location }) => {
    if (location.pathname.endsWith("/threads")) {
      throw redirect({
        to: "/workspaces/$workspaceId/threads/$threadId",
        params: { workspaceId: params.workspaceId, threadId: "new" },
      });
    }
  },
});

function RouteThreads() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();
  const { threads, rename, remove } = useThreads(workspaceId);
  const [threadError, setThreadError] = useState<string | null>(null);

  const match = useMatch({ strict: false });
  const threadId = (match?.params as { threadId?: string })?.threadId ?? null;

  const handleRename = (id: string, name: string) => {
    setThreadError(null);
    rename.mutate(
      { id, name },
      {
        onError: (error) =>
          setThreadError(error instanceof Error ? error.message : "Failed to rename thread."),
      },
    );
  };

  const handleDelete = (id: string) => {
    setThreadError(null);
    remove.mutate(
      { id },
      {
        onSuccess: () => {
          if (threadId === id) {
            navigate({ to: `/workspaces/${workspaceId}/threads/new` });
          }
        },
        onError: (error) =>
          setThreadError(error instanceof Error ? error.message : "Failed to delete thread."),
      },
    );
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {threadError && (
          <div className="border-b border-destructive/20 bg-destructive/5 px-4 py-2 text-xs text-destructive" role="alert">
            {threadError}
          </div>
        )}
        <Outlet />
      </div>
      <ThreadList
        threads={threads}
        selectedThreadId={threadId === "new" ? null : threadId}
        onSelectThread={(id) => navigate({ to: `/workspaces/${workspaceId}/threads/${id}` })}
        onNewThread={() => navigate({ to: `/workspaces/${workspaceId}/threads/new` })}
        onRenameThread={handleRename}
        onDeleteThread={handleDelete}
      />
    </div>
  );
}

function ThreadsSkeleton() {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <Skeleton className="h-16 w-2/3 ml-auto rounded-2xl" />
          <Skeleton className="h-20 w-3/4 rounded-2xl" />
          <Skeleton className="h-12 w-1/2 ml-auto rounded-2xl" />
          <Skeleton className="h-24 w-3/4 rounded-2xl" />
        </div>
        <div className="border-t p-4">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
      <div className="w-64 shrink-0 border-l p-3">
        <div className="flex items-center justify-between px-2 py-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <div className="mt-1 space-y-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
              <Skeleton className="size-4 shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
