import { Outlet, useMatches } from '@tanstack/react-router'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '~/components/ui/sidebar'
import { AppSidebar } from '~/components/app-sidebar'

export function SidebarLayout() {
  const matches = useMatches()
  const lastMatch = matches.at(-1)
  const params = lastMatch?.params ?? {}

  return (
    <SidebarProvider>
      <AppSidebar params={params} />
      <SidebarInset>
        <header className="flex h-12 items-center border-b px-4">
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
