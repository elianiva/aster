import { useState } from "react";
import { Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { WorkspaceRpc } from "~/server/rpc/workspace";
import { Button } from "~/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeftIcon, Settings02Icon } from "@hugeicons/core-free-icons";
import { cn } from "~/lib/utils";
import { WorkspaceSettingsModal } from "./workspace-settings-modal";

const TABS = [
  { label: "Threads", to: "/workspaces/$workspaceId/threads" },
  { label: "Lessons", to: "/workspaces/$workspaceId/lessons" },
  { label: "Records", to: "/workspaces/$workspaceId/records" },
] as const;

interface WorkspaceLayoutProps {
  workspaceId: string;
}

export function WorkspaceLayout({ workspaceId }: WorkspaceLayoutProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { data: workspace } = useSuspenseQuery(WorkspaceRpc.getWorkspace(workspaceId));
  const matchRoute = useMatchRoute();

  if (!workspace) {
    return <div className="p-6 text-muted-foreground">Workspace not found</div>;
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center border-b px-4 gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeftIcon} className="h-4 w-4" />
        </Link>
        <h1 className="font-semibold truncate">{workspace.topic}</h1>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSettingsOpen(true)}
          >
            <HugeiconsIcon icon={Settings02Icon} className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="flex h-10 shrink-0 border-b px-4 gap-1">
        {TABS.map((tab) => {
          const isActive = matchRoute({ to: tab.to, params: { workspaceId } });
          return (
            <Link
              key={tab.to}
              to={tab.to}
              params={{ workspaceId }}
              className={cn(
                "flex items-center px-3 text-sm font-medium transition-colors relative",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-foreground" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      <WorkspaceSettingsModal
        workspace={workspace}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}
