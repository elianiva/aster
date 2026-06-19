import { useQuery } from "@tanstack/react-query";
import { getWorkspace } from "~/server/rpc/workspace";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Message02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Workspace } from "~/server/features/workspace/service";

interface WorkspaceDetailProps {
  workspaceId: string;
}

export function WorkspaceDetail({ workspaceId }: WorkspaceDetailProps) {
  const { data: workspace, isLoading } = useQuery<Workspace | null>({
    queryKey: ["workspace", workspaceId],
    queryFn: () => getWorkspace({ data: { id: workspaceId } }),
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading workspace...</div>;
  }

  if (!workspace) {
    return <div className="text-muted-foreground">Workspace not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{workspace.topic}</h1>
        <Badge variant="outline">{workspace.id.slice(0, 8)}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{workspace.mission}</p>
        </CardContent>
      </Card>

      {workspace.currentKnowledge && (
        <Card>
          <CardHeader>
            <CardTitle>Current Knowledge</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{workspace.currentKnowledge}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Start Learning</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Begin a session with your teacher agent to start learning about {workspace.topic}.
          </p>
          <Button>
            <HugeiconsIcon icon={Message02Icon} className="mr-2 h-4 w-4" />
            Start Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
