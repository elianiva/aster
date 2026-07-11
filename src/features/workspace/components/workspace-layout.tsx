import { ErrorBoundary } from "~/components/error-boundary";
import { Suspense, useState } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { WorkspaceRpc } from "~/features/workspace/server/rpc";
import { CountRpc } from "~/features/workspace/server/counts-rpc";
import { Button } from "~/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { WorkspaceSettingsModal } from "./workspace-settings-modal";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "~/components/ui/sidebar";

import { Settings, MessageCircle, Library, Book, Link2, StickyNote, LayoutGrid } from "lucide-react";

type Icon = LucideIcon;

type CountKey =
  | "threads"
  | "lessons"
  | "records"
  | "references"
  | "glossary"
  | "resources"
  | "notes"
  | "library";
const NAV_ITEMS = [
  {
    label: "Dashboard",
    path: "/workspaces/$workspaceId",
    icon: LayoutGrid,
    countKey: null as CountKey | null,
  },
  {
    label: "Threads",
    path: "/workspaces/$workspaceId/threads",
    icon: MessageCircle,
    countKey: "threads" as const,
  },
  {
    label: "Library",
    path: "/workspaces/$workspaceId/library",
    icon: Library,
    countKey: "library" as const,
  },
  {
    label: "Glossary",
    path: "/workspaces/$workspaceId/glossary",
    icon: Book,
    countKey: "glossary" as const,
  },
  {
    label: "Resources",
    path: "/workspaces/$workspaceId/resources",
    icon: Link2,
    countKey: "resources" as const,
  },
  {
    label: "Notes",
    path: "/workspaces/$workspaceId/notes",
    icon: StickyNote,
    countKey: "notes" as const,
  },
] satisfies { label: string; path: string; icon: Icon; countKey: CountKey | null }[];

interface WorkspaceLayoutProps {
  workspaceId: string;
}

export function WorkspaceLayout({ workspaceId }: WorkspaceLayoutProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { data: workspace } = useSuspenseQuery(WorkspaceRpc.getWorkspace(workspaceId));
  const { data: counts } = useSuspenseQuery(CountRpc.getArtifactCounts(workspaceId));
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const countsFor = (key: CountKey | null): number => {
    if (!counts || !key) return 0;
    if (key === "library") {
      return (counts.lessons ?? 0) + (counts.records ?? 0) + (counts.references ?? 0);
    }
    return counts[key] ?? 0;
  };

  return (
    <SidebarProvider>
      <Sidebar side="left" className="border-none" collapsible="icon">
        <SidebarHeader className="p-5 pb-3">
          <div className="group-data-[collapsible=icon]:hidden space-y-1">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <span className="text-sm leading-none">←</span>
              All Workspaces
            </Link>
            <h1 className="pt-0.5 text-base font-medium leading-tight truncate">
              {workspace!.topic}
            </h1>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((tab) => {
                  const resolvedPath = tab.path.replace("$workspaceId", workspaceId);
                  const isIndex = tab === NAV_ITEMS[0];
                  const isActive = isIndex
                    ? currentPath === resolvedPath
                    : currentPath === resolvedPath || currentPath.startsWith(resolvedPath + "/");
                  const n = countsFor(tab.countKey);
                  return (
                    <SidebarMenuItem key={tab.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link to={tab.path} params={{ workspaceId }} />}
                      >
                        <tab.icon className="size-4" />
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
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="p-0 md:p-2 md:pl-0 bg-sidebar">
        <main className="flex h-dvh md:h-full md:max-h-[calc(100svh-16px)] flex-col overflow-hidden rounded-2xl bg-card inset-shadow-sm">
          <div className="flex items-center gap-2 border-b px-3 py-2 md:hidden">
            <SidebarTrigger />
            <span className="text-sm font-medium truncate">{workspace!.topic}</span>
          </div>
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
