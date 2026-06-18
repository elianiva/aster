import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty'
import { HugeiconsIcon } from '@hugeicons/react'
import { Message02Icon } from '@hugeicons/core-free-icons'

export function SessionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
        <p className="text-muted-foreground">
          Conversations with your teacher agent
        </p>
      </div>

      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Message02Icon} />
          </EmptyMedia>
          <EmptyTitle>No sessions yet</EmptyTitle>
          <EmptyDescription>
            Start chatting with your teacher agent.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
