import { createFileRoute } from '@tanstack/react-router'
import { RecordsTab } from '~/features/workspace/components/records-tab'
import { Skeleton } from '~/components/ui/skeleton'

export const Route = createFileRoute('/workspaces/$workspaceId/records')({
  component: RouteRecords,
  pendingComponent: RecordsSkeleton,
})

function RouteRecords() {
  const { workspaceId } = Route.useParams();
  return <RecordsTab workspaceId={workspaceId} />
}

function RecordsSkeleton() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Skeleton className="h-[200px] w-full max-w-md rounded-xl" />
    </div>
  )
}
