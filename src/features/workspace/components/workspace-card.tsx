import { Link, useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import type { Workspace } from "~/server/features/workspace/service";

export function WorkspaceCard({
  workspace,
  recentThread,
}: {
  workspace: Workspace;
  recentThread?: { id: string; name: string } | null;
}) {
  const navigate = useNavigate();

  return (
    <div
      className="group block border border-mauve-100 rounded-xl bg-card p-5 transition-colors hover:bg-accent/50 cursor-pointer"
      onClick={() => navigate({ to: "/workspaces/$workspaceId", params: { workspaceId: workspace.id } })}
    >
      <h3 className="font-semibold group-hover:text-accent-foreground transition-colors">
        {workspace.topic}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{workspace.mission}</p>
      {recentThread && (
        <Link
          to="/workspaces/$workspaceId/threads/$threadId"
          params={{ workspaceId: workspace.id, threadId: recentThread.id }}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline"
        >
          Continue: {recentThread.name || "Untitled thread"}
        </Link>
      )}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t text-xs text-muted-foreground">
        <span className="ml-auto">
          {formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
