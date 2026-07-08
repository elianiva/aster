export const queryKeys = {
  workspaces: {
    all: ["workspaces"] as const,
    list: () => [...queryKeys.workspaces.all, "list"] as const,
    detail: (id: string) => [...queryKeys.workspaces.all, id] as const,
    recentThreads: () => [...queryKeys.workspaces.all, "recentThreads"] as const,
  },
  threads: {
    all: (workspaceId: string) => ["threads", workspaceId] as const,
    list: (workspaceId: string) => [...queryKeys.threads.all(workspaceId), "list"] as const,
    detail: (threadId: string) => ["thread", threadId] as const,
  },
  settings: {
    all: ["settings"] as const,
    providers: () => [...queryKeys.settings.all, "providers"] as const,
  },
  counts: {
    all: (workspaceId: string) => ["counts", workspaceId] as const,
  },
  glossary: {
    all: (workspaceId: string) => ["glossary", workspaceId] as const,
    list: (workspaceId: string) => [...queryKeys.glossary.all(workspaceId), "list"] as const,
  },
  notes: {
    all: (workspaceId: string) => ["notes", workspaceId] as const,
    get: (workspaceId: string) => [...queryKeys.notes.all(workspaceId), "get"] as const,
  },
  resources: {
    all: (workspaceId: string) => ["resources", workspaceId] as const,
    list: (workspaceId: string) => [...queryKeys.resources.all(workspaceId), "list"] as const,
  },
  lessons: {
    all: (workspaceId: string) => ["lessons", workspaceId] as const,
    list: (workspaceId: string) => [...queryKeys.lessons.all(workspaceId), "list"] as const,
  },
  records: {
    all: (workspaceId: string) => ["records", workspaceId] as const,
    list: (workspaceId: string) => [...queryKeys.records.all(workspaceId), "list"] as const,
  },
  references: {
    all: (workspaceId: string) => ["references", workspaceId] as const,
    list: (workspaceId: string) => [...queryKeys.references.all(workspaceId), "list"] as const,
  },
} as const;
