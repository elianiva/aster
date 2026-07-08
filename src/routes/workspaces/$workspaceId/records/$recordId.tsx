import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Renderer } from "@openuidev/react-lang";
import { asterLibrary } from "~/components/openui/library";
import { RecordRpc } from "~/server/rpc/titled-artifact-rpc"

export const Route = createFileRoute(
  "/workspaces/$workspaceId/records/$recordId",
)({
  component: RouteRecordDetail,
});

function RouteRecordDetail() {
  const { workspaceId, recordId } = Route.useParams();

	const { data: record } = useSuspenseQuery(
		RecordRpc.getRecordContent(workspaceId, recordId),
	);


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
