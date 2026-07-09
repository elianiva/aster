import { createFileRoute } from "@tanstack/react-router";
import { LibraryList } from "~/features/artifact/components/library-list";

export const Route = createFileRoute("/workspaces/$workspaceId/library/")({
  component: RouteLibraryIndex,
});

function RouteLibraryIndex() {
  const { workspaceId } = Route.useParams();
  return <LibraryList workspaceId={workspaceId} />;
}
