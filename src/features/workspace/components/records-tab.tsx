import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { Brain02Icon } from "@hugeicons/core-free-icons";

export function RecordsTab() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Brain02Icon} />
          </EmptyMedia>
          <EmptyTitle>No records yet</EmptyTitle>
          <EmptyDescription>
            Learning records will appear here as you progress through lessons.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
