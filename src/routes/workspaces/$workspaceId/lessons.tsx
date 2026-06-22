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
    <div className="flex h-full flex-col p-4">
      <Skeleton className="h-6 w-20 mb-4" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex w-full items-center justify-between rounded-lg border p-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
