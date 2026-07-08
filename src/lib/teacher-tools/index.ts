import { baseTools } from "./base";
import { artifactTools } from "./artifacts";
import { noteTools } from "./notes";
import { glossaryTools } from "./glossary";
import { resourceTools } from "./resources";

export function createTeacherTools(workspaceId: string, threadId: string, teachingMode: boolean) {
  const base = baseTools(workspaceId, threadId);

  if (!teachingMode) return base;

  return {
    ...base,
    ...artifactTools(workspaceId),
    ...noteTools(workspaceId),
    ...glossaryTools(workspaceId),
    ...resourceTools(workspaceId),
  };
}
