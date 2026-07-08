import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThreadRpc } from "~/features/thread/server/rpc"
import type { Thread } from "~/features/thread/server/service"
import { queryKeys } from "~/lib/query-keys"

export function useThreads(workspaceId: string) {
  const queryClient = useQueryClient();
  const listKey = queryKeys.threads.all(workspaceId);

	const { data: threads } = useSuspenseQuery({
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
        teachingMode: true,
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
    onSuccess: (thread) => {
      // Replace the optimistic entry (matched by name) with the server response
      queryClient.setQueryData<Thread[]>([...listKey, "list"], (cur) => {
        if (!cur) return [thread];
        const idx = cur.findIndex((t) => t.id !== thread.id && t.name === thread.name);
        if (idx === -1) return [thread, ...cur];
        const next = [...cur];
        next[idx] = thread;
        return next;
      });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: [...listKey, "list"] });

	return { threads, create, rename, remove, refetch };
}
