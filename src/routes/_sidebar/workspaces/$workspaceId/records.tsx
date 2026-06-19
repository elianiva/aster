import { createFileRoute } from '@tanstack/react-router'
import { RecordsPage } from '~/features/workspace/components/records'

export const Route = createFileRoute('/_sidebar/workspaces/$workspaceId/records')({
  component: RecordsPage,
})
