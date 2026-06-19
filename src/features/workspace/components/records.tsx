import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty'
import { HugeiconsIcon } from '@hugeicons/react'
import { Brain02Icon } from '@hugeicons/core-free-icons'

export function RecordsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Learning Records</h1>
        <p className="text-muted-foreground">
          What you have learned — tracks progress and key insights
        </p>
      </div>

      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Brain02Icon} />
          </EmptyMedia>
          <EmptyTitle>No records yet</EmptyTitle>
          <EmptyDescription>
            They accumulate as you complete lessons.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
