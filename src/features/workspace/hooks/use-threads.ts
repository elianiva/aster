import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThreadRpc } from "~/server/rpc/thread";
import { WorkspaceRpc } from "~/server/rpc/workspace";
import type { Thread } from "~/server/features/thread/service";

export function useThreads(workspaceId: string) {
  const queryClient = useQueryClient();
  const listKey = ThreadRpc.thread(workspaceId);

  const query = useQuery({
    ...ThreadRpc.listThreads(workspaceId),
    refetchOnWindowFocus: true,
  });

  const create = useMutation({
    ...ThreadRpc.createThread(),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: [...listKey, "list"] });
      const prev = queryClient.getQueryData<Thread[]>([...listKey, "list"]);
      const optimistic: Thread = {
        id: crypto.randomUUID(),
        workspaceId: input.workspaceId,
        name: input.name ?? "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<Thread[]>([...listKey, "list"], (cur) =>
        cur ? [optimistic, ...cur] : [optimistic],
      );
      return { prev, optimistic };
    },
    onError: (_e, _input, ctx) => {
      if (ctx?.prev) queryClient.setQueryData([...listKey, "list"], ctx.prev);
    },
    onSuccess: (thread, _input, ctx) => {
      queryClient.setQueryData<Thread[]>([...listKey, "list"], (cur) =>
        (cur ?? []).map((t) => (t.id === ctx?.optimistic.id ? thread : t)),
      );
    },
  });

  const rename = useMutation({
    ...ThreadRpc.renameThread(),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: [...listKey, "list"] });
      const prev = queryClient.getQueryData<Thread[]>([...listKey, "list"]);
      queryClient.setQueryData<Thread[]>([...listKey, "list"], (cur) =>
        (cur ?? []).map((t) => (t.id === input.id ? { ...t, name: input.name } : t)),
      );
      return { prev };
    },
    onError: (_e, _input, ctx) => {
      if (ctx?.prev) queryClient.setQueryData([...listKey, "list"], ctx.prev);
    },
  });

  const remove = useMutation({
    ...ThreadRpc.deleteThread(),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: [...listKey, "list"] });
      const prev = queryClient.getQueryData<Thread[]>([...listKey, "list"]);
      queryClient.setQueryData<Thread[]>([...listKey, "list"], (cur) =>
        (cur ?? []).filter((t) => t.id !== input.id),
      );
      return { prev };
    },
    onError: (_e, _input, ctx) => {
      if (ctx?.prev) queryClient.setQueryData([...listKey, "list"], ctx.prev);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WorkspaceRpc.workspace() });
    },
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: [...listKey, "list"] });

  return { query, create, rename, remove, refetch };
}
