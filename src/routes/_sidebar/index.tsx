import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  BookOpen01Icon,
  Brain02Icon,
  Message02Icon,
  Target02Icon,
} from '@hugeicons/core-free-icons'

export const Route = createFileRoute('/_sidebar/')({
  component: Dashboard,
})

const STATS = [
  { title: 'Workspaces', value: '0', icon: BookOpen01Icon },
  { title: 'Missions', value: '0', icon: Target02Icon },
  { title: 'Sessions', value: '0', icon: Message02Icon },
  { title: 'Records', value: '0', icon: Brain02Icon },
]

function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your learning overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{stat.title}</CardTitle>
                <HugeiconsIcon icon={stat.icon} className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Get Started</CardTitle>
            <Badge variant="secondary">New</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Create a workspace to begin learning. Workspaces are containers for your
            learning topics with missions, lessons, and a teacher agent.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
