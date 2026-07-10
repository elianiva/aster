import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "~/features/workspace/components/empty-state";
import { ChatView } from "~/features/thread/components/chat-view"

export const Route = createFileRoute(
  "/workspaces/$workspaceId/threads/$threadId",
)({
  component: RouteThreadId,
});

function RouteThreadId() {
  const { workspaceId, threadId } = Route.useParams();

  return (
    <>
      {threadId === "new" ? (
        <EmptyState workspaceId={workspaceId} />
      ) : (
        <ChatView workspaceId={workspaceId} threadId={threadId} />
      )}
    </>
  );
}
