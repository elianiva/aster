import { Suspense, useState } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { WorkspaceRpc } from "~/server/rpc/workspace";
import { Button } from "~/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings02Icon } from "@hugeicons/core-free-icons";
import { WorkspaceSettingsModal } from "./workspace-settings-modal";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "~/components/ui/sidebar";

const LEARN_TABS = [
  { label: "Threads", path: "/workspaces/$workspaceId/threads" },
  { label: "Lessons", path: "/workspaces/$workspaceId/lessons" },
  { label: "Reference Docs", path: "/workspaces/$workspaceId/reference-docs" },
  { label: "Records", path: "/workspaces/$workspaceId/records" },
] as const;

const REFERENCE_TABS = [
  { label: "Glossary", path: "/workspaces/$workspaceId/glossary" },
  { label: "Resources", path: "/workspaces/$workspaceId/resources" },
  { label: "Notes", path: "/workspaces/$workspaceId/notes" },
] as const;

interface WorkspaceLayoutProps {
  workspaceId: string;
}

export function WorkspaceLayout({ workspaceId }: WorkspaceLayoutProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { data: workspace } = useSuspenseQuery(WorkspaceRpc.getWorkspace(workspaceId));
  const router = useRouterState();
  const currentPath = router.location.pathname;

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
          <SidebarGroup>
            <SidebarGroupLabel>Learn</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {LEARN_TABS.map((tab) => {
                  const basePath = `/workspaces/${workspaceId}/${tab.path.split("/").pop()}`;
                  const isActive = currentPath.startsWith(basePath);
                  return (
                    <SidebarMenuItem key={tab.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link to={tab.path} params={{ workspaceId }} />}
                      >
                        {tab.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Reference</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {REFERENCE_TABS.map((tab) => {
                  const basePath = `/workspaces/${workspaceId}/${tab.path.split("/").pop()}`;
                  const isActive = currentPath.startsWith(basePath);
                  return (
                    <SidebarMenuItem key={tab.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link to={tab.path} params={{ workspaceId }} />}
                      >
                        {tab.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
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

      <SidebarInset className="p-0 md:p-2 md:pl-0 bg-sidebar">
        <main className="flex h-dvh md:h-full md:max-h-[calc(100svh-16px)] flex-col overflow-hidden rounded-2xl bg-white inset-shadow-sm border border-border/50">
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <Suspense fallback={<div className="flex-1" />}>
              <Outlet />
            </Suspense>
          </div>
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
