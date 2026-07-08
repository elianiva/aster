import { createFileRoute, Outlet, useMatch, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { RecordRpc } from "~/features/artifact/server/records"
import { Skeleton } from "~/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { Brain02Icon } from "@hugeicons/core-free-icons";

export const Route = createFileRoute("/workspaces/$workspaceId/records")({
  component: RouteRecords,
  pendingComponent: RecordsSkeleton,
});

function RouteRecords() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();
	const { data: records = [] } = useSuspenseQuery(
		RecordRpc.listRecords(workspaceId),
	);

  const match = useMatch({ strict: false });
  const recordId =
    (match?.params as { recordId?: string })?.recordId ?? null;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
      <div className="flex w-64 shrink-0 flex-col border-l bg-card p-3">
        <h2 className="mb-3 px-2 text-sm font-semibold">Records</h2>
        {records.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Brain02Icon} />
              </EmptyMedia>
              <EmptyTitle>No records yet</EmptyTitle>
              <EmptyDescription>
                Learning records will appear here as you progress through lessons.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-1">
            {records.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() =>
                  navigate({
                    to: `/workspaces/${workspaceId}/records/${record.id}`,
                  })
                }
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ${
                  recordId === record.id ? "bg-accent" : ""
                }`}
              >
                <span className="truncate font-medium">Record</span>
                <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                  {new Date(record.createdAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecordsSkeleton() {
  return (
    <div className="flex h-full">
      <div className="flex-1 p-4">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="w-64 shrink-0 border-l p-3 space-y-2">
        <Skeleton className="h-4 w-16" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}
