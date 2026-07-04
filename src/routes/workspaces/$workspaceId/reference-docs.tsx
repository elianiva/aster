import { createFileRoute, Outlet, useMatch, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ReferenceRpc } from "~/server/rpc/titled-artifact-rpc"
import { Skeleton } from "~/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon } from "@hugeicons/core-free-icons";

export const Route = createFileRoute("/workspaces/$workspaceId/reference-docs")({
  component: RouteReferenceDocs,
  pendingComponent: ReferenceDocsSkeleton,
});

function RouteReferenceDocs() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();
  const { data: references = [], isLoading } = useQuery(
    ReferenceRpc.listReferences(workspaceId),
  );

  const match = useMatch({ strict: false });
  const referenceId =
    (match?.params as { referenceId?: string })?.referenceId ?? null;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
      <div className="flex w-64 shrink-0 flex-col border-l bg-card p-3">
        <h2 className="mb-3 px-2 text-sm font-semibold">Reference Docs</h2>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : references.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={File02Icon} />
              </EmptyMedia>
              <EmptyTitle>No reference docs yet</EmptyTitle>
              <EmptyDescription>
                The agent creates cheat sheets and reference guides alongside your lessons.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-1">
            {references.map((reference) => (
              <button
                key={reference.id}
                type="button"
                onClick={() =>
                  navigate({
                    to: `/workspaces/${workspaceId}/reference-docs/${reference.id}`,
                  })
                }
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ${
                  referenceId === reference.id ? "bg-accent" : ""
                }`}
              >
                <span className="truncate font-medium">{reference.title}</span>
                <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                  {new Date(reference.createdAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReferenceDocsSkeleton() {
  return (
    <div className="flex h-full">
      <div className="flex-1 p-4">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="w-64 shrink-0 border-l p-3 space-y-2">
        <Skeleton className="h-4 w-24" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}
