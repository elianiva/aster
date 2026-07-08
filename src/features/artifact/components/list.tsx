import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { cn } from "~/lib/utils";

const plugins = { cjk, code };

export interface ListProps {
  items: string[];
  ordered?: boolean;
  className?: string;
}

export function List({ items, ordered = false, className }: ListProps) {
  const listStyle = ordered ? "list-decimal" : "list-disc";
  const Tag = ordered ? "ol" : "ul";

  return (
    <Tag className={cn(`${listStyle} pl-5 space-y-1`, className)}>
      {items.map((item, i) => (
        <li key={i} className="text-sm">
          <Streamdown className="inline prose prose-sm dark:prose-invert" plugins={plugins}>
            {item}
          </Streamdown>
        </li>
      ))}
    </Tag>
  );
}
