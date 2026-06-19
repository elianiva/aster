import { useState } from "react";
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
import { createWorkspace } from "~/server/rpc/workspace";
import { useNavigate } from "@tanstack/react-router";

interface CreateWorkspaceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceForm({ open, onOpenChange }: CreateWorkspaceFormProps) {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [mission, setMission] = useState("");
  const [currentKnowledge, setCurrentKnowledge] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !mission.trim()) return;

    setIsSubmitting(true);
    try {
      const workspace = await createWorkspace({
        data: { topic: topic.trim(), mission: mission.trim(), currentKnowledge: currentKnowledge.trim() },
      });
      onOpenChange(false);
      setTopic("");
      setMission("");
      setCurrentKnowledge("");
      navigate({ to: "/workspaces/$workspaceId", params: { workspaceId: workspace.id } });
    } catch (error) {
      if (error && typeof error === "object" && "_tag" in error) {
        console.error(`[${error._tag}]`, error.message);
      } else {
        console.error("Failed to create workspace:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
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
              <label htmlFor="topic" className="text-sm font-medium">
                Topic <span className="text-muted-foreground">*</span>
              </label>
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
              <label htmlFor="mission" className="text-sm font-medium">
                Mission <span className="text-muted-foreground">*</span>
              </label>
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
              <label htmlFor="currentKnowledge" className="text-sm font-medium">
                Current Knowledge
              </label>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!topic.trim() || !mission.trim() || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
