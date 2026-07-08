import { ErrorBoundary } from "~/components/error-boundary";
import { Suspense, useState } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { WorkspaceRpc } from "~/features/workspace/server/rpc"
import { CountRpc } from "~/features/artifact/server/counts-rpc"
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

import {
  Chat01Icon,
  Notebook01Icon,
  File02Icon,
  Brain02Icon,
  Book02Icon,
  Link04Icon,
  StickyNote01Icon,
} from "@hugeicons/core-free-icons";

type Icon = typeof Chat01Icon;

const LEARN_TABS = [
  { label: "Threads", path: "/workspaces/$workspaceId/threads", icon: Chat01Icon, countKey: "threads" as const },
  { label: "Lessons", path: "/workspaces/$workspaceId/lessons", icon: Notebook01Icon, countKey: "lessons" as const },
  { label: "Reference Docs", path: "/workspaces/$workspaceId/reference-docs", icon: File02Icon, countKey: "references" as const },
  { label: "Records", path: "/workspaces/$workspaceId/records", icon: Brain02Icon, countKey: "records" as const },
] satisfies { label: string; path: string; icon: Icon; countKey: CountKey }[];

const REFERENCE_TABS = [
  { label: "Glossary", path: "/workspaces/$workspaceId/glossary", icon: Book02Icon, countKey: "glossary" as const },
  { label: "Resources", path: "/workspaces/$workspaceId/resources", icon: Link04Icon, countKey: "resources" as const },
  { label: "Notes", path: "/workspaces/$workspaceId/notes", icon: StickyNote01Icon, countKey: "notes" as const },
] satisfies { label: string; path: string; icon: Icon; countKey: CountKey }[];

type CountKey = "threads" | "lessons" | "records" | "references" | "glossary" | "resources" | "notes";

interface WorkspaceLayoutProps {
  workspaceId: string;
}

export function WorkspaceLayout({ workspaceId }: WorkspaceLayoutProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { data: workspace } = useSuspenseQuery(WorkspaceRpc.getWorkspace(workspaceId));
  const { data: counts } = useSuspenseQuery(CountRpc.getArtifactCounts(workspaceId));
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const countsFor = (key: CountKey): number => {
    if (!counts) return 0;
    return counts[key] ?? 0;
  };


  return (
    <SidebarProvider>
      <Sidebar side="left" className="border-none">
        <SidebarHeader className="p-4">
          <h1 className="mt-3 px-1 text-lg font-medium leading-tight truncate">
            {workspace!.topic}
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
                  const n = countsFor(tab.countKey);
                  return (
                    <SidebarMenuItem key={tab.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link to={tab.path} params={{ workspaceId }} />}
                      >
                        <HugeiconsIcon icon={tab.icon} className="size-4" />
                        {tab.label}
                        {n > 0 ? <CountBadge>{n}</CountBadge> : null}
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
                  const n = countsFor(tab.countKey);
                  return (
                    <SidebarMenuItem key={tab.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link to={tab.path} params={{ workspaceId }} />}
                      >
                        <HugeiconsIcon icon={tab.icon} className="size-4" />
                        {tab.label}
                        {n > 0 ? <CountBadge>{n}</CountBadge> : null}
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
        <main className="flex h-dvh md:h-full md:max-h-[calc(100svh-16px)] flex-col overflow-hidden rounded-2xl bg-card inset-shadow-sm border border-border/50">
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <ErrorBoundary>
              <Suspense fallback={<div className="flex-1" />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </SidebarInset>

      <WorkspaceSettingsModal
        workspace={workspace!}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </SidebarProvider>
  );
}

function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-accent px-1.5 text-xs font-medium text-sidebar-accent-foreground tabular-nums">
      {children}
    </span>
  );
}
