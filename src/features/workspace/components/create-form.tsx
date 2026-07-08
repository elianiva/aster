import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { WorkspaceRpc } from "~/server/rpc/workspace";
import { queryKeys } from "~/server/rpc/query-keys";
import { useNavigate } from "@tanstack/react-router";

interface CreateWorkspaceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceForm({ open, onOpenChange }: CreateWorkspaceFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState("");
  const [mission, setMission] = useState("");
  const [currentKnowledge, setCurrentKnowledge] = useState("");

  const createMutation = useMutation({
    ...WorkspaceRpc.createWorkspace(),
    onSuccess: (workspace) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      onOpenChange(false);
      setTopic("");
      setMission("");
      setCurrentKnowledge("");
      navigate({ to: "/workspaces/$workspaceId", params: { workspaceId: workspace.id } });
    },
  });
  const errorMessage = createMutation.isError
    ? createMutation.error instanceof Error
      ? createMutation.error.message
      : "Failed to create workspace. Please try again."
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !mission.trim()) return;

    createMutation.mutate({
      topic: topic.trim(),
      mission: mission.trim(),
      currentKnowledge: currentKnowledge.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Set up your learning workspace. Your teacher agent will use this context to generate personalized lessons.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="topic">
                Topic <span className="text-muted-foreground">*</span>
              </Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., React, Yoga, Guitar, Machine Learning"
              />
              <p className="text-xs text-muted-foreground">
                What do you want to learn?
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mission">
                Mission <span className="text-muted-foreground">*</span>
              </Label>
              <Textarea
                id="mission"
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="e.g., I want to build a personal portfolio website to showcase my work"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Why do you want to learn this? Your mission grounds every lesson in real-world goals.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currentKnowledge">
                Current Knowledge
              </Label>
              <Textarea
                id="currentKnowledge"
                value={currentKnowledge}
                onChange={(e) => setCurrentKnowledge(e.target.value)}
                placeholder="e.g., I know HTML/CSS basics, completed a JavaScript course last year"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                What do you already know about this topic? This helps your teacher find the right starting point.
              </p>
            </div>
          </div>
          <DialogFooter>
            {errorMessage && (
              <p className="text-xs text-destructive sm:mr-auto" role="alert">
                {errorMessage}
              </p>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!topic.trim() || !mission.trim() || createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
