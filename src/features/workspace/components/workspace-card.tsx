import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Message02Icon, Notebook01Icon } from "@hugeicons/core-free-icons";
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
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon icon={Message02Icon} className="h-3.5 w-3.5" />
          {workspace.threadCount} {workspace.threadCount === 1 ? "thread" : "threads"}
        </span>
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon icon={Notebook01Icon} className="h-3.5 w-3.5" />
          {workspace.lessonCount} {workspace.lessonCount === 1 ? "lesson" : "lessons"}
        </span>
        <span className="ml-auto">
          {formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </Link>
  );
}
