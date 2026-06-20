import { createFileRoute } from '@tanstack/react-router'
import { WorkspacesPage } from '~/features/workspace/components'
import { Skeleton } from '~/components/ui/skeleton'

export const Route = createFileRoute('/_sidebar/workspaces/')({
  component: WorkspacesPage,
  pendingComponent: WorkspacesSkeleton,
})

function WorkspacesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
