import { createFileRoute } from '@tanstack/react-router'
import { WorkspacesPage } from '~/features/workspace'

export const Route = createFileRoute('/_sidebar/workspaces/')({
  component: WorkspacesPage,
})
