import { createFileRoute } from "@tanstack/react-router";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notebook01Icon } from "@hugeicons/core-free-icons";

export const Route = createFileRoute("/workspaces/$workspaceId/lessons/")({
  component: RouteLessonsIndex,
});

function RouteLessonsIndex() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Notebook01Icon} />
          </EmptyMedia>
          <EmptyTitle>Select a lesson</EmptyTitle>
          <EmptyDescription>
            Choose a lesson from the list to view its content.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
