import { useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { WorkspaceRpc } from "~/features/workspace/server/rpc";
import { ThreadRpc } from "~/features/thread/server/rpc";
import { ResourceRpc } from "~/features/resource/server/rpc";
import { CountRpc } from "~/features/artifact/server/counts-rpc";
import { Button } from "~/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Chat01Icon,
  Add01Icon,
  BookOpen01Icon,
  Book02Icon,
  StickyNote01Icon,
  Link04Icon,
  LibraryIcon,
} from "@hugeicons/core-free-icons";

interface DashboardProps {
  workspaceId: string;
}

const THREAD_COLORS = [
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
] as const;
const STATS = [
  { icon: LibraryIcon, label: "Lessons", key: "lessons" as const },
  { icon: Book02Icon, label: "Glossary", key: "glossary" as const },
  { icon: StickyNote01Icon, label: "Notes", key: "notes" as const },
  { icon: BookOpen01Icon, label: "Records", key: "records" as const },
];

export function WorkspaceDashboard({ workspaceId }: DashboardProps) {
  const navigate = useNavigate();
  const { data: workspace } = useSuspenseQuery(WorkspaceRpc.getWorkspace(workspaceId));
  const { data: threads } = useSuspenseQuery(ThreadRpc.listThreads(workspaceId));
  const { data: resources = [] } = useSuspenseQuery(ResourceRpc.listResources(workspaceId));
  const { data: counts } = useSuspenseQuery(CountRpc.getArtifactCounts(workspaceId));

  if (!workspace) return null;

  const recentThreads = threads.slice(0, 4);
  const recentResources = resources.slice(0, 3);

  return (
    <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl space-y-5 p-8 pt-10">
        {/* — Mission banner — */}
        <div className="flex items-start justify-between gap-4 rounded-2xl border bg-card p-5">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">{workspace.topic}</h1>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-prose line-clamp-2">
              {workspace.mission}
            </p>
          </div>
          <Button
            onClick={() =>
              navigate({
                to: "/workspaces/$workspaceId/threads/$threadId",
                params: { workspaceId, threadId: "new" },
              })
            }
            className="shrink-0"
          >
            <HugeiconsIcon icon={Add01Icon} className="mr-2 h-4 w-4" />
            New Thread
          </Button>
        </div>

        {/* — Bento grid: threads (span-2) + stats (span-1) — */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Recent threads */}
          <div className="rounded-2xl border bg-card p-4 md:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <HugeiconsIcon icon={Chat01Icon} className="h-3.5 w-3.5" />
                Recent Threads
              </h2>
              {threads.length > 4 && (
                <button
                  onClick={() =>
                    navigate({ to: "/workspaces/$workspaceId/threads", params: { workspaceId } })
                  }
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all
                </button>
              )}
            </div>
            {recentThreads.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No conversations yet. Start a thread to begin.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {recentThreads.map((thread, i) => (
                  <button
                    key={thread.id}
                    onClick={() =>
                      navigate({
                        to: "/workspaces/$workspaceId/threads/$threadId",
                        params: { workspaceId, threadId: thread.id },
                      })
                    }
                    className="flex items-center gap-3 rounded-lg p-2 text-left text-sm transition-colors hover:bg-secondary/70"
                  >
                    <span
                      className={`inline-flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold ${THREAD_COLORS[i % THREAD_COLORS.length]}`}
                    >
                      {thread.name?.charAt(0)?.toUpperCase() ?? "T"}
                    </span>
                    <span className="truncate font-medium">{thread.name || "Untitled"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Overview stats */}
          <div className="rounded-2xl border bg-card p-4">
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Overview
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {STATS.map((s) => (
                <div
                  key={s.key}
                  className="flex flex-col items-center gap-0.5 rounded-xl bg-muted/50 p-3"
                >
                  <HugeiconsIcon icon={s.icon} className="size-4 text-muted-foreground" />
                  <span className="text-lg font-semibold tabular-nums leading-none">
                    {counts?.[s.key] ?? 0}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* — Resources — */}
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <HugeiconsIcon icon={Link04Icon} className="h-3.5 w-3.5" />
              Resources
            </h2>
            {resources.length > 3 && (
              <button
                onClick={() =>
                  navigate({ to: "/workspaces/$workspaceId/resources", params: { workspaceId } })
                }
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all
              </button>
            )}
          </div>
          {recentResources.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No resources yet. Add resources to ground your learning.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-3">
              {recentResources.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl bg-muted/50 p-3 transition-colors hover:bg-accent"
                >
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{r.type}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
