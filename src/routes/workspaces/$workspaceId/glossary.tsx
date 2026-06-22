import { createFileRoute } from '@tanstack/react-router'
import { GlossaryTab } from '~/features/workspace/components/glossary-tab'
import { Skeleton } from '~/components/ui/skeleton'

export const Route = createFileRoute('/workspaces/$workspaceId/glossary')({
  component: RouteGlossary,
  pendingComponent: GlossarySkeleton,
})

function RouteGlossary() {
  const { workspaceId } = Route.useParams();
  return <GlossaryTab workspaceId={workspaceId} />
}

function GlossarySkeleton() {
  return (
    <div className="flex h-full flex-col p-4">
      <Skeleton className="h-6 w-24 mb-4" />
      <Skeleton className="h-9 w-full mb-4" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
