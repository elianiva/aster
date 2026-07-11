import { Link } from "@tanstack/react-router";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { buttonVariants } from "~/components/ui/button-variants";
import { cn } from "~/lib/utils";
import { X } from "lucide-react";

export function DefaultErrorComponent() {
  // Errors that escape route loaders/components land here. The thrown message
  // is logged server-side with a request id; show a recoverable fallback.
  return (
    <Empty className="h-dvh">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <X  />
        </EmptyMedia>
        <EmptyTitle>Something went wrong</EmptyTitle>
        <EmptyDescription>
          An unexpected error occurred while loading this page. Please try again.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link to="/" className={cn(buttonVariants({ variant: "outline" }))} reloadDocument>
          Back to Dashboard
        </Link>
      </EmptyContent>
    </Empty>
  );
}
