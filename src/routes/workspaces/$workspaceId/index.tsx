import { createFileRoute } from '@tanstack/react-router'
import { WorkspaceDashboard } from '~/features/workspace/components/workspace-dashboard'

export const Route = createFileRoute('/workspaces/$workspaceId/')({
  component: RouteWorkspaceIndex,
})

function RouteWorkspaceIndex() {
  const { workspaceId } = Route.useParams()
  return <WorkspaceDashboard workspaceId={workspaceId} />
}
