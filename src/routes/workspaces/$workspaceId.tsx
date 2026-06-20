import { createFileRoute } from '@tanstack/react-router'
import { WorkspaceLayout } from '~/features/workspace/components/workspace-layout'

export const Route = createFileRoute('/workspaces/$workspaceId')({
  component: RouteWorkspaceLayout,
})

function RouteWorkspaceLayout() {
  const { workspaceId } = Route.useParams()
  return <WorkspaceLayout workspaceId={workspaceId} />
}
