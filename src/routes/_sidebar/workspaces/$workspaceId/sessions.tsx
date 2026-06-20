import { createFileRoute } from '@tanstack/react-router'
import { SessionsPage } from '~/features/workspace/components/sessions'
import { Skeleton } from '~/components/ui/skeleton'

export const Route = createFileRoute('/_sidebar/workspaces/$workspaceId/sessions')({
  component: RouteSessions,
  pendingComponent: SessionsSkeleton,
})

function RouteSessions() {
  const { workspaceId } = Route.useParams()
  return <SessionsPage workspaceId={workspaceId} />
}

function SessionsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-56 mt-2" />
      </div>
      <Skeleton className="h-[200px] w-full rounded-xl" />
    </div>
  )
}
