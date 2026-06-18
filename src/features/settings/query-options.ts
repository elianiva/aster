import { queryOptions } from "@tanstack/react-query"
import { fetchProviders } from "./server-fns"

export const providersQueryOptions = queryOptions({
  queryKey: ["providers"],
  queryFn: () => fetchProviders(),
})
