import { createFileRoute } from '@tanstack/react-router'
import { WorkspaceDetail } from '~/features/workspace/components/detail'
import { Skeleton } from '~/components/ui/skeleton'

export const Route = createFileRoute('/_sidebar/workspaces/$workspaceId/')({
  component: RouteWorkspaceDetail,
  pendingComponent: WorkspaceDetailSkeleton,
})

function RouteWorkspaceDetail() {
  const { workspaceId } = Route.useParams()
  return <WorkspaceDetail workspaceId={workspaceId} />
}

function WorkspaceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-[148px] w-full rounded-xl" />
      <Skeleton className="h-[108px] w-full rounded-xl" />
    </div>
  )
}
