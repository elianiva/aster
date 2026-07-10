import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Message02Icon } from "@hugeicons/core-free-icons";
import type { Thread } from "~/features/thread/server/service";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { useState } from "react";

interface ThreadListProps {
  threads: Thread[];
  selectedThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onRenameThread: (id: string, name: string) => void;
  onDeleteThread: (id: string) => void;
}

export function ThreadList({
  threads,
  selectedThreadId,
  onSelectThread,
  onNewThread,
  onRenameThread,
  onDeleteThread,
}: ThreadListProps) {
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

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
    <Sidebar
      side="right"
      collapsible="none"
      style={{ "--sidebar-width": "16rem" } as React.CSSProperties}
    >
      <SidebarGroup className="h-full">
        <SidebarGroupLabel>Threads</SidebarGroupLabel>
        <SidebarGroupAction onClick={onNewThread} aria-label="New thread">
          <HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5" />
        </SidebarGroupAction>

        <SidebarContent className="px-0">
          <SidebarMenu>
            {threads.map((thread) => (
              <SidebarMenuItem key={thread.id}>
                {editingThreadId === thread.id ? (
                  <div className="px-2 py-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(thread.id);
                        if (e.key === "Escape") {
                          setEditingThreadId(null);
                          setEditingName("");
                        }
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <SidebarMenuButton
                      isActive={selectedThreadId === thread.id}
                      onClick={() => onSelectThread(thread.id)}
                    >
                      <HugeiconsIcon
                        icon={Message02Icon}
                        className={cn(
                          "h-4 w-4 shrink-0",
                          selectedThreadId === thread.id
                            ? "text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/60",
                        )}
                      />
                      <span className="truncate">
                        {thread.name.trim() ? thread.name : "New thread"}
                      </span>
                    </SidebarMenuButton>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <SidebarMenuAction
                            showOnHover
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Thread options"
                          />
                        }
                      >
                        <span className="text-xs leading-none">⋯</span>
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
                  </>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </SidebarGroup>
    </Sidebar>
  );
}

export type { Thread };
