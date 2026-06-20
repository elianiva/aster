import { createFileRoute } from '@tanstack/react-router'
import { SessionChat } from '~/features/workspace/components/session-chat'
import { Skeleton } from '~/components/ui/skeleton'

export const Route = createFileRoute('/_sidebar/workspaces/$workspaceId/sessions/$sessionId')({
  component: RouteSessionChat,
  pendingComponent: SessionChatSkeleton,
})

function RouteSessionChat() {
  const { workspaceId, sessionId } = Route.useParams()
  return <SessionChat workspaceId={workspaceId} sessionId={sessionId} />
}

function SessionChatSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 p-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-12 w-1/2 ml-auto" />
        <Skeleton className="h-24 w-3/4" />
      </div>
      <div className="border-t p-4">
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}
