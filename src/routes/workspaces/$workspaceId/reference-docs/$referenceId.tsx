import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Renderer } from "@openuidev/react-lang";
import { asterLibrary } from "~/features/artifact/components/library"
import { ReferenceRpc } from "~/features/artifact/server/references"

export const Route = createFileRoute(
  "/workspaces/$workspaceId/reference-docs/$referenceId",
)({
  component: RouteReferenceDetail,
});

function RouteReferenceDetail() {
  const { workspaceId, referenceId } = Route.useParams();

	const { data: reference } = useSuspenseQuery(
		ReferenceRpc.getReferenceContent(workspaceId, referenceId),
	);


  if (!reference) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Reference not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex-1 overflow-y-auto">
        <Renderer library={asterLibrary} response={reference.content} isStreaming={false} />
      </div>
    </div>
  );
}
