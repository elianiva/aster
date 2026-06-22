import { useCallback, useState } from "react";
import { createFileRoute, Outlet, redirect, useMatch, useNavigate } from "@tanstack/react-router";
import { Skeleton } from "~/components/ui/skeleton";
import { useThreads } from "~/features/workspace/hooks/use-threads";
import { ThreadList } from "~/features/workspace/components/thread-list";

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
  const { query, rename, remove } = useThreads(workspaceId);
  const threads = query.data ?? [];
  const [threadError, setThreadError] = useState<string | null>(null);

  const match = useMatch({ strict: false });
  const threadId = (match?.params as { threadId?: string })?.threadId ?? null;

  const handleRename = useCallback(
    (id: string, name: string) => {
      setThreadError(null);
      rename.mutate(
        { id, name },
        {
          onError: (error) =>
            setThreadError(error instanceof Error ? error.message : "Failed to rename thread."),
        },
      );
    },
    [rename],
  );

  const handleDelete = useCallback(
    (id: string) => {
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
    },
    [remove, threadId, navigate, workspaceId],
  );

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
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-12 w-1/2 ml-auto" />
        </div>
        <div className="border-t p-4">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      <div className="w-64 shrink-0 border-l p-3 space-y-2">
        <div className="flex items-center justify-between px-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}
