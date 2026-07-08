import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings02Icon, SlidersHorizontalIcon } from "@hugeicons/core-free-icons";

import { WorkspaceRpc } from "~/features/workspace/server/rpc"
import { GlobalSettingsPanel } from "~/features/settings/components/global-settings-panel";
import type { Workspace } from "~/features/workspace/server/service"
import { queryKeys } from "~/lib/query-keys"

interface WorkspaceSettingsModalProps {
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "workspace" | "global";
}

export function WorkspaceSettingsModal({
  workspace,
  open,
  onOpenChange,
  defaultTab = "workspace",
}: WorkspaceSettingsModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [topic, setTopic] = useState(workspace.topic);
  const [mission, setMission] = useState(workspace.mission);
  const [currentKnowledge, setCurrentKnowledge] = useState(workspace.currentKnowledge);

  const updateMutation = useMutation({
    ...WorkspaceRpc.updateWorkspace(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      onOpenChange(false);
    },
  });

  const deleteMutation = useMutation({
    ...WorkspaceRpc.deleteWorkspace(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      navigate({ to: "/" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !mission.trim()) return;

    updateMutation.mutate({
      id: workspace.id,
      topic: topic.trim(),
      mission: mission.trim(),
      currentKnowledge: currentKnowledge.trim(),
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: workspace.id });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Configure your workspace and global preferences.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue={defaultTab}>
            <TabsList className="w-full">
              <TabsTrigger value="workspace" className="flex-1">
                <HugeiconsIcon icon={SlidersHorizontalIcon} className="mr-1.5 size-4" />
                Workspace
              </TabsTrigger>
              <TabsTrigger value="global" className="flex-1">
                <HugeiconsIcon icon={Settings02Icon} className="mr-1.5 size-4" />
                Global
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workspace">
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="topic">
                      Topic <span className="text-muted-foreground">*</span>
                    </Label>
                    <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mission">
                      Mission <span className="text-muted-foreground">*</span>
                    </Label>
                    <Textarea
                      id="mission"
                      value={mission}
                      onChange={(e) => setMission(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="currentKnowledge">
                      Current Knowledge
                    </Label>
                    <Textarea
                      id="currentKnowledge"
                      value={currentKnowledge}
                      onChange={(e) => setCurrentKnowledge(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter className="flex justify-between sm:justify-between mt-4">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Workspace
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!topic.trim() || !mission.trim() || updateMutation.isPending}
                    >
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value="global">
              <GlobalSettingsPanel />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              <span className="block">This will permanently delete this workspace and all its contents:</span>
              <span className="block list-disc pl-5 mt-2 space-y-0.5 text-sm">
                <span className="block list-item">Threads</span>
                <span className="block list-item">Lessons</span>
                <span className="block list-item">Learning Records</span>
                <span className="block list-item">Reference Docs</span>
                <span className="block list-item">Glossary</span>
                <span className="block list-item">Resources</span>
                <span className="block list-item">Notes</span>
              </span>
              <span className="block mt-3">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
