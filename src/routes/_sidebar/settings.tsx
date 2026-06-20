import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '~/features/settings/components/page'
import { Skeleton } from '~/components/ui/skeleton'

export const Route = createFileRoute('/_sidebar/settings')({
  component: SettingsPage,
  pendingComponent: SettingsSkeleton,
})

function SettingsSkeleton() {
  return (
    <div className="space-y-6 mx-auto max-w-2xl">
      <div>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-56 mt-2" />
      </div>
      <div className="rounded-xl border p-6 space-y-4">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
    </div>
  )
}
