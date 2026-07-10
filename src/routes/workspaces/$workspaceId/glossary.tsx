import { createFileRoute } from '@tanstack/react-router'
import { GlossaryTab } from '~/features/glossary/components/glossary-tab'
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
    <div className="flex h-full flex-col">
      <Skeleton className="h-6 w-28 mb-4" />
      <div className="relative mb-4">
        <Skeleton className="absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Skeleton className="h-9 w-full pl-9" />
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-muted p-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-2/3 mt-1" />
            <Skeleton className="h-3 w-1/2 mt-2" />
          </div>
        ))}
      </div>
    </div>
  )
}
