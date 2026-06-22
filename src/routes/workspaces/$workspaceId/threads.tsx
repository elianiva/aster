import { useCallback } from "react";
import {
  createFileRoute,
  Outlet,
  redirect,
  useMatch,
  useNavigate,
} from "@tanstack/react-router";
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

  const match = useMatch({ strict: false });
  const threadId = (match?.params as { threadId?: string })?.threadId ?? null;

  const handleRename = useCallback(
    (id: string, name: string) => rename.mutate({ id, name }),
    [rename],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await remove.mutateAsync({ id });
      if (threadId === id) {
        navigate({ to: `/workspaces/${workspaceId}/threads/new` });
      }
    },
    [remove, threadId, navigate, workspaceId],
  );

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
      <ThreadList
        threads={threads}
        selectedThreadId={threadId === "new" ? null : threadId}
        onSelectThread={(id) =>
          navigate({ to: `/workspaces/${workspaceId}/threads/${id}` })
        }
        onNewThread={() =>
          navigate({ to: `/workspaces/${workspaceId}/threads/new` })
        }
        onRenameThread={handleRename}
        onDeleteThread={handleDelete}
      />
    </div>
  );
}

function ThreadsSkeleton() {
  return (
    <div className="flex h-full">
      <div className="w-64 shrink-0 border-r p-3 space-y-2">
        <Skeleton className="h-6 w-20" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-12 w-1/2 ml-auto" />
        </div>
        <div className="border-t p-4">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
