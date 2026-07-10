import { createFileRoute } from '@tanstack/react-router'
import { ResourcesTab } from '~/features/resource/components/resources-tab'
import { Skeleton } from '~/components/ui/skeleton'

export const Route = createFileRoute('/workspaces/$workspaceId/resources')({
  component: RouteResources,
  pendingComponent: ResourcesSkeleton,
})

function RouteResources() {
  const { workspaceId } = Route.useParams();
  return <ResourcesTab workspaceId={workspaceId} />
}

function ResourcesSkeleton() {
  return (
    <div className="flex h-full flex-col items-center overflow-y-auto py-6">
      <Skeleton className="h-6 w-28 mb-6" />
      <div className="w-full max-w-3xl">
        <div className="flex gap-1 mb-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-16 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-9 w-full mb-4" />
        <div className="flex flex-col">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b px-2 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <Skeleton className="size-4 shrink-0" />
                <div className="min-w-0">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-36 mt-1" />
                </div>
              </div>
              <Skeleton className="ml-2 size-4 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
