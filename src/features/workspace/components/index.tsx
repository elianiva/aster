import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { BookOpen01Icon } from "@hugeicons/core-free-icons";
import { useQuery } from "@tanstack/react-query";
import { listWorkspaces } from "~/server/rpc/workspace";
import { Link } from "@tanstack/react-router";
import { CreateWorkspaceForm } from "./create-form";
import type { Workspace } from "~/server/features/workspace/service";

export function WorkspacesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: workspaces = [], isLoading } = useQuery<Workspace[]>({
    queryKey: ["workspaces"],
    queryFn: () => listWorkspaces({ data: undefined }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground">Your learning topic containers</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>New Workspace</Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading workspaces...</div>
      ) : workspaces.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={BookOpen01Icon} />
            </EmptyMedia>
            <EmptyTitle>No workspaces yet</EmptyTitle>
            <EmptyDescription>
              Create a workspace to start learning with your teacher agent.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setShowCreateForm(true)}>Create Workspace</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              to="/workspaces/$workspaceId"
              params={{ workspaceId: workspace.id }}
              className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <h3 className="font-semibold">{workspace.topic}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {workspace.mission}
              </p>
            </Link>
          ))}
        </div>
      )}

      <CreateWorkspaceForm open={showCreateForm} onOpenChange={setShowCreateForm} />
    </div>
  );
}
