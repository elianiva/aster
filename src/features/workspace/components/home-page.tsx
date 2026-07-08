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
import { BookOpen01Icon, Add01Icon, Settings02Icon } from "@hugeicons/core-free-icons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { WorkspaceRpc } from "~/features/workspace/server/rpc"
import { CreateWorkspaceForm } from "./create-form";
import { WorkspaceCard } from "./workspace-card";
import { SettingsDialog } from "~/features/settings/components/global-settings-dialog";

export function HomePage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { data: workspaces } = useSuspenseQuery(WorkspaceRpc.listWorkspaces());
  const { data: recentThreads } = useSuspenseQuery(WorkspaceRpc.recentThreads());
  const recentByWorkspace = new Map(recentThreads.map((rt) => [rt.workspaceId, { id: rt.threadId, name: rt.threadName }]));

  return (
    <div className="min-h-screen bg-background flex items-center">
      <div className="mx-auto max-w-5xl p-8 bg-card rounded-2xl border border-border inset-shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-medium text-primary tracking-tight">Aster</h1>
            <p className="text-muted-foreground">Your learning workspaces</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
              <HugeiconsIcon icon={Settings02Icon} className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              <HugeiconsIcon icon={Add01Icon} className="mr-2 h-4 w-4" />
              New Workspace
            </Button>
          </div>
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
              <WorkspaceCard key={workspace.id} workspace={workspace} recentThread={recentByWorkspace.get(workspace.id)} />
            ))}
          </div>
        )}
      </div>

      <CreateWorkspaceForm open={showCreateForm} onOpenChange={setShowCreateForm} />
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}
