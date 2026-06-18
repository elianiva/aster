import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '~/features/settings/page'
import { getSettings } from '~/features/settings/server-fns'

export const Route = createFileRoute('/_sidebar/settings')({
  loader: async () => {
    const settings = await getSettings()
    return { settings }
  },
  component: RouteSettings,
})

function RouteSettings() {
  const { settings } = Route.useLoaderData()
  return <SettingsPage settings={settings} />
}
