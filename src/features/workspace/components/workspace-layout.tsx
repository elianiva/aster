import { useState } from "react";
import { Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { WorkspaceRpc } from "~/server/rpc/workspace";
import { Button } from "~/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeftIcon, Settings02Icon } from "@hugeicons/core-free-icons";
import { WorkspaceSettingsModal } from "./workspace-settings-modal";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "~/components/ui/sidebar";

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
    <SidebarProvider>
      <Sidebar side="left" className="border-none">
        <SidebarHeader className="p-4">
          <h1 className="mt-3 px-1 text-lg font-medium leading-tight truncate">
            Learning Workspace
          </h1>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <SidebarMenu>
            {TABS.map((tab) => {
              const isActive = matchRoute({ to: tab.to, params: { workspaceId } });
              return (
                <SidebarMenuItem key={tab.to}>
                  <SidebarMenuButton
                    isActive={!!isActive}
                    render={<Link to={tab.to} params={{ workspaceId }} />}
                  >
                    {tab.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={() => setSettingsOpen(true)}
          >
            <HugeiconsIcon icon={Settings02Icon} className="h-4 w-4" />
            Settings
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="p-3 bg-sidebar">
        <main className="bg-white rounded-2xl overflow-hidden border border-border/50 flex-1">
          <Outlet />
        </main>
      </SidebarInset>

      <WorkspaceSettingsModal
        workspace={workspace}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </SidebarProvider>
  );
}
