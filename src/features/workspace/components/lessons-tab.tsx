import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notebook01Icon } from "@hugeicons/core-free-icons";

export function LessonsTab() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Notebook01Icon} />
          </EmptyMedia>
          <EmptyTitle>No lessons yet</EmptyTitle>
          <EmptyDescription>
            Lessons will appear here as your teacher agent generates them.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
