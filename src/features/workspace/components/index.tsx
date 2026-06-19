import { Button } from '~/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty'
import { HugeiconsIcon } from '@hugeicons/react'
import { BookOpen01Icon } from '@hugeicons/core-free-icons'

export function WorkspacesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground">Your learning topic containers</p>
        </div>
        <Button>New Workspace</Button>
      </div>

      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={BookOpen01Icon} />
          </EmptyMedia>
          <EmptyTitle>No workspaces yet</EmptyTitle>
          <EmptyDescription>
            Create a workspace to start learning with your teacher agent.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>Create Workspace</Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
