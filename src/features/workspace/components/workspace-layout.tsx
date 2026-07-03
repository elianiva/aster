import { Suspense, useState } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { WorkspaceRpc } from "~/server/rpc/workspace";
import { CountRpc } from "~/server/rpc/counts";
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
  const { data: workspace, isLoading: workspaceLoading, error } = useQuery(WorkspaceRpc.getWorkspace(workspaceId));
  const { data: counts } = useQuery(CountRpc.getArtifactCounts(workspaceId));
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const countsFor = (key: CountKey): number => {
    if (key === "threads") return workspace?.threadCount ?? 0;
    if (key === "lessons") return workspace?.lessonCount ?? 0;
    if (!counts) return 0;
    return counts[key] ?? 0;
  };

  if (workspaceLoading) {
    return <WorkspaceSidebarSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 text-destructive">
        {error instanceof Error ? error.message : "Failed to load workspace"}
      </div>
    );
  }

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

function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-accent px-1.5 text-xs font-medium text-sidebar-accent-foreground tabular-nums">
      {children}
    </span>
  );
}

function SidebarSkeletonRow() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <div className="size-4 rounded bg-sidebar-accent animate-pulse" />
      <div className="h-3.5 flex-1 rounded bg-sidebar-accent animate-pulse" />
    </div>
  );
}

function WorkspaceSidebarSkeleton() {
  return (
    <SidebarProvider>
      <Sidebar side="left" className="border-none">
        <SidebarHeader className="p-4">
          <div className="mt-3 h-6 w-3/4 rounded bg-sidebar-accent animate-pulse" />
        </SidebarHeader>

        <SidebarContent className="p-2">
          <SidebarGroup>
            <SidebarGroupLabel>
              <div className="h-3 w-12 rounded bg-sidebar-accent animate-pulse" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({ length: 4 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarSkeletonRow />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>
              <div className="h-3 w-16 rounded bg-sidebar-accent animate-pulse" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({ length: 3 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarSkeletonRow />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="p-0 md:p-2 md:pl-0 bg-sidebar">
        <main className="flex h-dvh md:h-full md:max-h-[calc(100svh-16px)] flex-col overflow-hidden rounded-2xl bg-white inset-shadow-sm border border-border/50">
          <div className="flex-1" />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
