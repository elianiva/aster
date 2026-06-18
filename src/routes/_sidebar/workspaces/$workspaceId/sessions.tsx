import { createFileRoute } from '@tanstack/react-router'
import { SessionsPage } from '~/features/workspace/sessions'

export const Route = createFileRoute('/_sidebar/workspaces/$workspaceId/sessions')({
  component: SessionsPage,
})
