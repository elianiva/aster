import { useState, useDeferredValue } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { GlossaryRpc } from "~/features/glossary/server/rpc";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "~/components/ui/empty";
import { Input } from "~/components/ui/input";
import { Book, Search } from "lucide-react";

interface GlossaryTabProps {
	workspaceId: string;
}

export function GlossaryTab({ workspaceId }: GlossaryTabProps) {
	const { data: terms = [] } = useSuspenseQuery(GlossaryRpc.listGlossary(workspaceId));
	const [query, setQuery] = useState("");
	const deferredQuery = useDeferredValue(query);

	const filtered = (() => {
		const q = deferredQuery.trim().toLowerCase();
		if (!q) return terms;
		return terms.filter(
			(t) =>
				t.term.toLowerCase().includes(q) ||
				t.definition.toLowerCase().includes(q),
		);
	})();

	if (terms.length === 0) {
		return (
			<div className="flex h-full items-center justify-center p-6">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Book />
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
		<div className="flex h-full flex-col items-center overflow-y-auto py-6">
			<h1 className="mb-6 text-lg font-semibold">Glossary</h1>
			<div className="w-full max-w-3xl">
				<div className="relative mb-4">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search terms..."
						className="pl-9"
					/>
				</div>
				{filtered.length === 0 ? (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Book />
							</EmptyMedia>
							<EmptyTitle>{query ? "No matches" : "No glossary terms yet"}</EmptyTitle>
							<EmptyDescription>
								{query
									? "Try a different search term."
									: "The agent will add terms here as you learn them. Terms appear once you understand a concept, not before."}
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
				<div className="flex flex-col divide-y">
					{filtered.map((term) => (
						<div
							key={term.id}
							className="px-2 py-3"
						>
							<dt className="font-medium text-sm">{term.term}</dt>
							<dd className="mt-1 text-sm text-muted-foreground">{term.definition}</dd>
							{term.avoid ? (
								<dd className="mt-1 text-xs text-muted-foreground/70">
									Avoid: {term.avoid}
								</dd>
							) : null}
						</div>
					))}
				</div>
				)}
			</div>
		</div>
	);
}
