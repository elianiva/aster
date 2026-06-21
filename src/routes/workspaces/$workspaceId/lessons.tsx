import { createFileRoute } from '@tanstack/react-router'
import { LessonsTab } from '~/features/workspace/components/lessons-tab'
import { Skeleton } from '~/components/ui/skeleton'

export const Route = createFileRoute('/workspaces/$workspaceId/lessons')({
  component: RouteLessons,
  pendingComponent: LessonsSkeleton,
})

function RouteLessons() {
  const { workspaceId } = Route.useParams();
  return <LessonsTab workspaceId={workspaceId} />
}

function LessonsSkeleton() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Skeleton className="h-[200px] w-full max-w-md rounded-xl" />
    </div>
  )
}
