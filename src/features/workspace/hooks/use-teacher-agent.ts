import { useAgent } from "agents/react";

/**
 * Connect to the TeacherAgent DO for a given thread.
 * `name` is the DO instance key: `${workspaceId}::${threadId}`.
 * The `prefix` matches the Think vite plugin's `routePrefix` ("/api/agents").
 */
export function useTeacherAgent(name: string) {
  return useAgent({
    agent: "teacher",
    prefix: "api/agents",
    name,
  });
}
