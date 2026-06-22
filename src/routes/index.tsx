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
    <div className="min-h-screen bg-background flex items-center">
      <div className="mx-auto max-w-5xl p-8 bg-linear-to-t from-mauve-50 to-mauve-white rounded-2xl border border-mauve-100 inset-shadow-sm inset-shadow-mauve-100/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-4 w-40 mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
