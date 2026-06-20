import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

import { WorkspaceRpc } from "~/server/rpc/workspace";
import type { Workspace } from "~/server/features/workspace/service";

interface WorkspaceSettingsModalProps {
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkspaceSettingsModal({
  workspace,
  open,
  onOpenChange,
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
      queryClient.invalidateQueries({ queryKey: WorkspaceRpc.workspace() });
      onOpenChange(false);
    },
  });

  const deleteMutation = useMutation({
    ...WorkspaceRpc.deleteWorkspace(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WorkspaceRpc.workspace() });
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
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Workspace Settings</DialogTitle>
              <DialogDescription>
                Update your workspace details or delete it.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="topic" className="text-sm font-medium">
                  Topic <span className="text-muted-foreground">*</span>
                </label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="mission" className="text-sm font-medium">
                  Mission <span className="text-muted-foreground">*</span>
                </label>
                <Textarea
                  id="mission"
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="currentKnowledge" className="text-sm font-medium">
                  Current Knowledge
                </label>
                <Textarea
                  id="currentKnowledge"
                  value={currentKnowledge}
                  onChange={(e) => setCurrentKnowledge(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex justify-between sm:justify-between">
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
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete this workspace and all its threads, lessons, and records. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
