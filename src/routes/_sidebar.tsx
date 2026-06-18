import { createFileRoute } from '@tanstack/react-router'
import { SidebarLayout } from '~/components/ui/sidebar-layout'

export const Route = createFileRoute('/_sidebar')({
  component: SidebarLayout,
})
