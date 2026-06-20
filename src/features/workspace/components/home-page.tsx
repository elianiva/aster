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
import { BookOpen01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { WorkspaceRpc } from "~/server/rpc/workspace";
import { Link } from "@tanstack/react-router";
import { CreateWorkspaceForm } from "./create-form";

export function HomePage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: workspaces } = useSuspenseQuery(WorkspaceRpc.listWorkspaces());

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Aster</h1>
            <p className="text-muted-foreground mt-1">Your learning workspaces</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <HugeiconsIcon icon={Add01Icon} className="mr-2 h-4 w-4" />
            New Workspace
          </Button>
        </div>

        {workspaces.length === 0 ? (
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <Link
                key={workspace.id}
                to="/workspaces/$workspaceId"
                params={{ workspaceId: workspace.id }}
                className="group block rounded-xl border bg-card p-5 transition-colors hover:bg-accent/50"
              >
                <h3 className="font-semibold group-hover:text-accent-foreground transition-colors">
                  {workspace.topic}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  {workspace.mission}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateWorkspaceForm open={showCreateForm} onOpenChange={setShowCreateForm} />
    </div>
  );
}
