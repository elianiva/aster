import { Link, useRouterState } from '@tanstack/react-router'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '~/components/ui/sidebar'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Home02Icon,
  BookOpen01Icon,
  Target02Icon,
  Notebook01Icon,
  Message02Icon,
  Brain02Icon,
  Settings02Icon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons'

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/', icon: Home02Icon },
  { label: 'Workspaces', to: '/workspaces', icon: BookOpen01Icon },
]

const WORKSPACE_NAV = [
  { label: 'Missions', to: '/workspaces/$workspaceId/missions', icon: Target02Icon },
  { label: 'Lessons', to: '/workspaces/$workspaceId/lessons', icon: Notebook01Icon },
  { label: 'Sessions', to: '/workspaces/$workspaceId/sessions', icon: Message02Icon },
  { label: 'Records', to: '/workspaces/$workspaceId/records', icon: Brain02Icon },
]

function NavLink({
  to,
  icon,
  label,
  params,
}: {
  to: string
  icon: typeof Home02Icon
  label: string
  params?: Record<string, string>
}) {
  const router = useRouterState()
  const href = params ? to.replace('$workspaceId', params.workspaceId ?? '') : to
  const isActive = router.location.pathname === href

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} render={<Link to={href} />}>
        <HugeiconsIcon icon={icon} />
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar({ params }: { params?: Record<string, string> }) {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <HugeiconsIcon icon={Brain02Icon} />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Aster</span>
                <span className="text-xs text-muted-foreground">Learning workspace</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {params?.workspaceId && (
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {WORKSPACE_NAV.map((item) => (
                  <NavLink key={item.to} {...item} params={params} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link to="/settings" />}>
              <HugeiconsIcon icon={Settings02Icon} />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <HugeiconsIcon icon={UserCircleIcon} />
              <span className="truncate">User</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
