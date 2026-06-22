import { createFileRoute } from '@tanstack/react-router'
import { NotesTab } from '~/features/workspace/components/notes-tab'
import { Skeleton } from '~/components/ui/skeleton'

export const Route = createFileRoute('/workspaces/$workspaceId/notes')({
  component: RouteNotes,
  pendingComponent: NotesSkeleton,
})

function RouteNotes() {
  const { workspaceId } = Route.useParams();
  return <NotesTab workspaceId={workspaceId} />
}

function NotesSkeleton() {
  return (
    <div className="flex h-full flex-col p-4">
      <Skeleton className="h-6 w-20 mb-4" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}
