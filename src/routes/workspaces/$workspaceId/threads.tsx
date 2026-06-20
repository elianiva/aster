import { createFileRoute } from '@tanstack/react-router'
import { ThreadsTab } from '~/features/workspace/components/threads-tab'
import { Skeleton } from '~/components/ui/skeleton'

export const Route = createFileRoute('/workspaces/$workspaceId/threads')({
  component: RouteThreads,
  pendingComponent: ThreadsSkeleton,
})

function RouteThreads() {
  const { workspaceId } = Route.useParams()
  return <ThreadsTab workspaceId={workspaceId} />
}

function ThreadsSkeleton() {
  return (
    <div className="flex h-full">
      <div className="w-64 shrink-0 border-r p-3 space-y-2">
        <Skeleton className="h-6 w-20" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-12 w-1/2 ml-auto" />
        </div>
        <div className="border-t p-4">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}
