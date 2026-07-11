import { Menu, MessageSquare, Plus } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
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
          <Plus className="h-3.5 w-3.5" />
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
                      <MessageSquare
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

function ThreadListContent({
  threads,
  selectedThreadId,
  onSelectThread,
  onNewThread,
  onRenameThread,
  onDeleteThread,
  onThreadSelected,
}: ThreadListProps & { onThreadSelected?: () => void }) {
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

  const handleSelectThread = (id: string) => {
    onThreadSelected?.();
    onSelectThread(id);
  };

  const handleNewThread = () => {
    onThreadSelected?.();
    onNewThread();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium text-sidebar-foreground">
          Threads
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleNewThread}
          aria-label="New thread"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {threads.map((thread) => (
          <div key={thread.id} className="relative">
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
                <button
                  onClick={() => handleSelectThread(thread.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                    "hover:bg-sidebar-accent/60",
                    selectedThreadId === thread.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80",
                  )}
                >
                  <MessageSquare
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
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1 opacity-0 hover:bg-sidebar-accent/60 group-hover:opacity-100"
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
          </div>
        ))}
      </div>
    </div>
  );
}

export function ThreadListTrigger({
  threads,
  selectedThreadId,
  onSelectThread,
  onNewThread,
  onRenameThread,
  onDeleteThread,
}: ThreadListProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Open thread list" />
        }
      >
        <Menu className="h-4 w-4" />
      </SheetTrigger>
      <SheetContent side="right" className="w-[18rem] p-0" showCloseButton>
        <ThreadListContent
          threads={threads}
          selectedThreadId={selectedThreadId}
          onSelectThread={onSelectThread}
          onNewThread={onNewThread}
          onRenameThread={onRenameThread}
          onDeleteThread={onDeleteThread}
          onThreadSelected={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

export type { Thread };
