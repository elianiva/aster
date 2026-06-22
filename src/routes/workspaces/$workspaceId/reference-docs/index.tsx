import { createFileRoute } from "@tanstack/react-router";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon } from "@hugeicons/core-free-icons";

export const Route = createFileRoute(
  "/workspaces/$workspaceId/reference-docs/",
)({
  component: RouteReferenceDocsIndex,
});

function RouteReferenceDocsIndex() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={File02Icon} />
          </EmptyMedia>
          <EmptyTitle>Select a reference doc</EmptyTitle>
          <EmptyDescription>
            Choose a reference document from the list to view its content.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
