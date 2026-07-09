import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { LibraryRpc } from "~/features/artifact/server/library-rpc";
import type { ArtifactKind } from "~/features/artifact/server/service";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { LibraryIcon } from "@hugeicons/core-free-icons";
import { cn } from "~/lib/utils";

const KIND_LABELS: Record<ArtifactKind, string> = {
  lesson: "Lesson",
  record: "Record",
  reference: "Ref Doc",
};

const FILTER_OPTIONS = [
  { label: "All", value: null },
  { label: "Lessons", value: "lesson" as ArtifactKind },
  { label: "Records", value: "record" as ArtifactKind },
  { label: "Ref Docs", value: "reference" as ArtifactKind },
];

interface LibraryListProps {
  workspaceId: string;
}

export function LibraryList({ workspaceId }: LibraryListProps) {
  const { data: items = [] } = useSuspenseQuery(LibraryRpc.listAllArtifacts(workspaceId));
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ArtifactKind | null>(null);

  const filtered = items.filter((item) => {
    const matchesType = activeFilter === null || item.kind === activeFilter;
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto py-6">
      <h1 className="mb-6 text-lg font-semibold">Library</h1>
      <div className="w-full max-w-3xl">
        <div className="mb-3 flex gap-1">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setActiveFilter(option.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                activeFilter === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <Input
          placeholder="Search library..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />
        {filtered.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={LibraryIcon} />
              </EmptyMedia>
              <EmptyTitle>{search ? "No matches" : "Library is empty"}</EmptyTitle>
              <EmptyDescription>
                {search
                  ? "Try a different search term."
                  : "Lessons, records, and reference docs will appear here as your teacher generates them."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col">
            {filtered.map((item) => (
              <Link
                key={item.id}
                to="/workspaces/$workspaceId/library/$artifactId"
                params={{ workspaceId, artifactId: item.id }}
                className="flex items-center justify-between border-b px-2 py-3 text-sm hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {KIND_LABELS[item.kind]}
                  </Badge>
                  <span className="font-medium">{item.title}</span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
