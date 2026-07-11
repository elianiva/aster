import { Link, useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import type { Workspace } from "~/features/workspace/server/service";

export function WorkspaceCard({
  workspace,
  recentThread,
}: {
  workspace: Workspace;
  recentThread?: { id: string; name: string } | null;
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="flex flex-col items-start group rounded-xl border border-border bg-card p-4 transition-colors hover-fine:bg-accent/50 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring text-left w-full"
      onClick={() =>
        navigate({ to: "/workspaces/$workspaceId", params: { workspaceId: workspace.id } })
      }
    >
      <h3 className="font-semibold group-hover-fine:text-accent-foreground transition-colors">
        {workspace.topic}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2">{workspace.mission}</p>
      {recentThread && (
        <Link
          to="/workspaces/$workspaceId/threads/$threadId"
          params={{ workspaceId: workspace.id, threadId: recentThread.id }}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline line-clamp-1 text-ellipsis"
        >
          Continue: {recentThread.name || "Untitled thread"}
        </Link>
      )}
      <div className="flex items-center gap-4 mt-auto pt-3 border-t text-xs text-muted-foreground w-full">
        <span className="ml-auto">
          {formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </button>
  );
}
