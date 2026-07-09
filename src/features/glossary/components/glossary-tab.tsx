import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useDeferredValue, useMemo } from "react";
import { GlossaryRpc } from "~/features/glossary/server/rpc"
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "~/components/ui/empty";
import { Input } from "~/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { Book02Icon } from "@hugeicons/core-free-icons";
import { Search02Icon } from "@hugeicons/core-free-icons";

interface GlossaryTabProps {
	workspaceId: string;
}

export function GlossaryTab({ workspaceId }: GlossaryTabProps) {
	const { data: terms = [] } = useSuspenseQuery(GlossaryRpc.listGlossary(workspaceId));
	const [query, setQuery] = useState("");
	const deferredQuery = useDeferredValue(query);

	const filtered = useMemo(() => {
		const q = deferredQuery.trim().toLowerCase();
		if (!q) return terms;
		return terms.filter(
			(t) =>
				t.term.toLowerCase().includes(q) ||
				t.definition.toLowerCase().includes(q),
		);
	}, [terms, deferredQuery]);


	if (terms.length === 0) {
		return (
			<div className="flex h-full items-center justify-center p-6">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<HugeiconsIcon icon={Book02Icon} />
						</EmptyMedia>
						<EmptyTitle>No glossary terms yet</EmptyTitle>
						<EmptyDescription>
							The agent will add terms here as you learn them. Terms appear once you understand a concept, not before.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<h2 className="mb-4 text-lg font-semibold">Glossary</h2>
			<div className="relative mb-4">
				<HugeiconsIcon
					icon={Search02Icon}
					className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search terms..."
					className="pl-9"
				/>
			</div>
			<div className="flex flex-col gap-2 overflow-y-auto">
				{filtered.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						No terms match "{query}".
					</p>
				) : (
					filtered.map((term) => (
						<div
							key={term.id}
							className="rounded-lg border bg-card p-4"
						>
							<h3 className="font-medium">{term.term}</h3>
							<p className="mt-1 text-sm text-muted-foreground">{term.definition}</p>
							{term.avoid ? (
								<p className="mt-2 text-xs text-muted-foreground/70">
									Avoid: {term.avoid}
								</p>
							) : null}
						</div>
					))
				)}
			</div>
		</div>
	);
}
