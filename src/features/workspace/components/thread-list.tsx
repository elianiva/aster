import { useState } from "react";
import { Button } from "~/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Message02Icon } from "@hugeicons/core-free-icons";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";

export interface Thread {
  id: string;
  name: string;
  isGeneral: boolean;
  lastMessage?: string;
  updatedAt: string;
}

interface ThreadListProps {
  threads: Thread[];
  selectedThreadId: string | null;
  onSelectThread: (id: string) => void;
  onCreateThread: (name: string) => void;
  onRenameThread: (id: string, name: string) => void;
  onDeleteThread: (id: string) => void;
}

export function ThreadList({
  threads,
  selectedThreadId,
  onSelectThread,
  onCreateThread,
  onRenameThread,
  onDeleteThread,
}: ThreadListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newThreadName, setNewThreadName] = useState("");
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleCreate = () => {
    if (newThreadName.trim()) {
      onCreateThread(newThreadName.trim());
      setNewThreadName("");
      setIsCreating(false);
    }
  };

  const handleRename = (id: string) => {
    if (editingName.trim()) {
      onRenameThread(id, editingName.trim());
      setEditingThreadId(null);
      setEditingName("");
    }
  };

  const startEditing = (thread: Thread) => {
    setEditingThreadId(thread.id);
    setEditingName(thread.name);
  };

  return (
    <div className="flex flex-col h-full border-r bg-muted/30">
      <div className="flex items-center justify-between p-3 border-b">
        <span className="text-sm font-medium text-muted-foreground">Threads</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsCreating(true)}
        >
          <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isCreating && (
          <div className="p-2 border-b">
            <Input
              value={newThreadName}
              onChange={(e) => setNewThreadName(e.target.value)}
              placeholder="Thread name..."
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setIsCreating(false);
                  setNewThreadName("");
                }
              }}
              onBlur={() => {
                if (!newThreadName.trim()) {
                  setIsCreating(false);
                }
              }}
            />
          </div>
        )}

        {threads.map((thread) => (
          <div
            key={thread.id}
            className={cn(
              "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors group",
              selectedThreadId === thread.id && "bg-accent"
            )}
            onClick={() => onSelectThread(thread.id)}
          >
            <HugeiconsIcon icon={Message02Icon} className="h-4 w-4 shrink-0 text-muted-foreground" />
            
            {editingThreadId === thread.id ? (
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="h-6 text-sm flex-1"
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename(thread.id);
                  if (e.key === "Escape") {
                    setEditingThreadId(null);
                    setEditingName("");
                  }
                }}
              />
            ) : (
              <span className="flex-1 truncate text-sm">{thread.name}</span>
            )}

            {!thread.isGeneral && (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs">⋯</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => startEditing(thread)}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDeleteThread(thread.id)}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
