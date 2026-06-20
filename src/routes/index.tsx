import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '~/features/workspace/components/home-page'
import { Skeleton } from '~/components/ui/skeleton'

export const Route = createFileRoute('/')({
  component: RouteHome,
  pendingComponent: HomeSkeleton,
})

function RouteHome() {
  return <HomePage />
}

function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
