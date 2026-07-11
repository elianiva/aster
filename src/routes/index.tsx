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
    <div className="min-h-screen flex items-center">
      <div className="mx-auto max-w-5xl p-6 bg-card rounded-2xl border border-border">
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
            <div key={i} className="rounded-xl bg-card border border-border p-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-2/3 mt-2" />
              <div className="flex items-center mt-4 pt-3 border-t">
                <Skeleton className="h-3 w-20 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
