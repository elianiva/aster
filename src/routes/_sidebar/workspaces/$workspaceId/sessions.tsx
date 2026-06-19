import { createFileRoute } from '@tanstack/react-router'
import { SessionsPage } from '~/features/workspace/components/sessions'

export const Route = createFileRoute('/_sidebar/workspaces/$workspaceId/sessions')({
  component: SessionsPage,
})
