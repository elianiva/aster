import { createFileRoute } from '@tanstack/react-router'
import { MissionsPage } from '~/features/workspace/missions'

export const Route = createFileRoute('/_sidebar/workspaces/$workspaceId/missions')({
  component: MissionsPage,
})
