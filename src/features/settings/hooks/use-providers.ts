import { queryOptions } from "@tanstack/react-query";
import { fetchProviders } from "~/server/rpc/settings";

export const providersQueryOptions = queryOptions({
  queryKey: ["providers"],
  queryFn: () => fetchProviders(),
});
