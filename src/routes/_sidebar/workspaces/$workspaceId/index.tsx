import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

export const Route = createFileRoute('/_sidebar/workspaces/$workspaceId/')({
  component: WorkspaceDetail,
})

function WorkspaceDetail() {
  const { workspaceId } = Route.useParams()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Workspace</h1>
        <Badge variant="outline">{workspaceId}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No mission set yet. Start a session with your teacher agent to define one.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
