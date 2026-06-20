import { Link } from "@tanstack/react-router";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { FileNotFoundIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function NotFound() {
  return (
    <Empty className="h-dvh">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={FileNotFoundIcon} />
        </EmptyMedia>
        <EmptyTitle>Page Not Found</EmptyTitle>
        <EmptyDescription>
          The page you're looking for doesn't exist or has been moved.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link to="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to Dashboard
        </Link>
      </EmptyContent>
    </Empty>
  );
}
