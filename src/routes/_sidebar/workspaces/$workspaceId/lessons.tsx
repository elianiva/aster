import { createFileRoute } from '@tanstack/react-router'
import { LessonsPage } from '~/features/workspace/lessons'

export const Route = createFileRoute('/_sidebar/workspaces/$workspaceId/lessons')({
  component: LessonsPage,
})
