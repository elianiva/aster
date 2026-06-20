import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/workspaces/$workspaceId/')({
  component: RouteWorkspaceIndex,
})

function RouteWorkspaceIndex() {
  const { workspaceId } = Route.useParams()
  return <Navigate to="/workspaces/$workspaceId/threads" params={{ workspaceId }} />
}
