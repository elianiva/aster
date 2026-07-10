import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Renderer } from "@openuidev/react-lang";
import { asterLibrary } from "~/features/artifact/components/library";
import { LibraryRpc } from "~/features/artifact/server/library-rpc";
import { PageHeader } from "~/features/artifact/components/page-header";

export const Route = createFileRoute(
  "/workspaces/$workspaceId/library/$artifactId",
)({
  component: RouteArtifactDetail,
});

function RouteArtifactDetail() {
  const { workspaceId, artifactId } = Route.useParams();
  const { data: artifact } = useSuspenseQuery(
    LibraryRpc.getArtifactById(workspaceId, artifactId),
  );

  if (!artifact?.content) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Artifact not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader
          backUrl="/workspaces/$workspaceId/library"
          breadcrumbs={[
            { label: "Library", to: "/workspaces/$workspaceId/library", params: { workspaceId } },
            { label: artifact.title },
          ]}
        />
      </div>
      <div className="flex-1 overflow-y-auto py-6">
        <div className="mx-auto max-w-3xl">
          <Renderer library={asterLibrary} response={artifact.content} isStreaming={false} />
        </div>
      </div>
    </div>
  );
}
