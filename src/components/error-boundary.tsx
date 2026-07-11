import { Component, type ReactNode } from "react";
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

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex h-full items-center justify-center p-6">
          <Empty className="max-w-md">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <X  />
              </EmptyMedia>
              <EmptyTitle>Something went wrong</EmptyTitle>
              <EmptyDescription>
                {this.state.error?.message ?? "An unexpected error occurred."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link to="/" className={cn(buttonVariants({ variant: "outline" }))} reloadDocument>
                Back to Dashboard
              </Link>
            </EmptyContent>
          </Empty>
        </div>
      );
    }
    return this.props.children;
  }
}
