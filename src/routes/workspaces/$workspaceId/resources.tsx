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
    <div className="flex h-full flex-col p-4">
      <Skeleton className="h-6 w-28 mb-4" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
