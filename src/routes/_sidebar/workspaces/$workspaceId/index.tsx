import { createFileRoute } from '@tanstack/react-router'
import { WorkspaceDetail } from '~/features/workspace/components/detail'

export const Route = createFileRoute('/_sidebar/workspaces/$workspaceId/')({
  component: RouteWorkspaceDetail,
})

function RouteWorkspaceDetail() {
  const { workspaceId } = Route.useParams()
  return <WorkspaceDetail workspaceId={workspaceId} />
}
