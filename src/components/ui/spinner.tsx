import { cn } from "~/lib/utils"
import { Loader2 } from "lucide-react"

function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 strokeWidth={2} data-slot="spinner" role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} />
  )
}

export { Spinner }
