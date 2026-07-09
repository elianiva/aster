import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { cn } from "~/lib/utils";

interface BreadcrumbEntry {
  label: string;
  to?: string;
  params?: Record<string, string>;
}

interface PageHeaderProps {
  backUrl?: string;
  breadcrumbs?: BreadcrumbEntry[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ backUrl, breadcrumbs, actions, className }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {backUrl ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.preventDefault();
            navigate({ to: backUrl });
          }}
          aria-label="Go back"
          className="justify-start w-fit"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
        </Button>
      ) : null}

      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <BreadcrumbItem key={crumb.label}>
                  {isLast || !crumb.to ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link to={crumb.to} params={crumb.params} />}>
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                  {!isLast ? <BreadcrumbSeparator /> : null}
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}

      {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
