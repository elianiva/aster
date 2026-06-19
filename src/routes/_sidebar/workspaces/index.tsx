import { createFileRoute } from '@tanstack/react-router'
import { WorkspacesPage } from '~/features/workspace/components'

export const Route = createFileRoute('/_sidebar/workspaces/')({
  component: WorkspacesPage,
})
