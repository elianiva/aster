import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty'
import { HugeiconsIcon } from '@hugeicons/react'
import { Target02Icon } from '@hugeicons/core-free-icons'

export function MissionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Missions</h1>
        <p className="text-muted-foreground">
          Your reason for learning in this workspace
        </p>
      </div>

      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Target02Icon} />
          </EmptyMedia>
          <EmptyTitle>No mission yet</EmptyTitle>
          <EmptyDescription>
            Your mission evolves as you progress. Start a session to define one.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
