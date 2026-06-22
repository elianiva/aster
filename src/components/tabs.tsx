import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "~/lib/utils";

export interface TabsItem {
  label: string;
  content: ReactNode;
}

export interface AsterTabsProps extends ComponentProps<"div"> {
  items: TabsItem[];
}

export function AsterTabs({ items, className, ...props }: AsterTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className={cn("space-y-3", className)} {...props}>
      <div className="flex border-b">
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors relative",
              i === activeIndex
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            {i === activeIndex && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>
      <div>{items[activeIndex]?.content}</div>
    </div>
  );
}
