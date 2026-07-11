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
import { FileX } from "lucide-react";

export function NotFound() {
  return (
    <Empty className="h-dvh">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileX />
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
