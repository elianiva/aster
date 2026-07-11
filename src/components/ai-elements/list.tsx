import { Streamdown } from "streamdown";
import { cn } from "~/lib/utils";
import { streamdownPlugins } from "~/lib/streamdown-plugins";

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
          <Streamdown className="inline prose" plugins={streamdownPlugins}>
            {item}
          </Streamdown>
        </li>
      ))}
    </Tag>
  );
}
