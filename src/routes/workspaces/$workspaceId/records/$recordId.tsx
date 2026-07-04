import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Renderer } from "@openuidev/react-lang";
import { asterLibrary } from "~/components/openui/library";
import { RecordRpc } from "~/server/rpc/titled-artifact-rpc"
import { Skeleton } from "~/components/ui/skeleton";

export const Route = createFileRoute(
  "/workspaces/$workspaceId/records/$recordId",
)({
  component: RouteRecordDetail,
});

function RouteRecordDetail() {
  const { workspaceId, recordId } = Route.useParams();

  const { data: record, isLoading } = useQuery(
    RecordRpc.getRecordContent(workspaceId, recordId),
  );

  if (isLoading) {
    return (
      <div className="flex h-full flex-col p-4">
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Record not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex-1 overflow-y-auto">
        <Renderer library={asterLibrary} response={record.content} isStreaming={false} />
      </div>
    </div>
  );
}
