import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import type { Workspace } from "~/server/features/workspace/service";

export function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <Link
      key={workspace.id}
      to="/workspaces/$workspaceId"
      params={{ workspaceId: workspace.id }}
      className="group block border border-mauve-100 rounded-xl bg-card p-5 transition-colors hover:bg-accent/50"
    >
      <h3 className="font-semibold group-hover:text-accent-foreground transition-colors">
        {workspace.topic}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{workspace.mission}</p>
      <div className="flex items-center gap-4 mt-4 pt-3 border-t text-xs text-muted-foreground">
        <span className="ml-auto">
          {formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </Link>
  );
}
