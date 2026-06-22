import { createFileRoute } from "@tanstack/react-router";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { Brain02Icon } from "@hugeicons/core-free-icons";

export const Route = createFileRoute("/workspaces/$workspaceId/records/")({
  component: RouteRecordsIndex,
});

function RouteRecordsIndex() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Brain02Icon} />
          </EmptyMedia>
          <EmptyTitle>Select a record</EmptyTitle>
          <EmptyDescription>
            Choose a learning record from the list to view its content.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
