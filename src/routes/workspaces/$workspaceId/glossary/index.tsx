import { createFileRoute } from "@tanstack/react-router";
import { GlossaryTab } from "~/features/glossary/components/glossary-tab";
import { Skeleton } from "~/components/ui/skeleton";

export const Route = createFileRoute("/workspaces/$workspaceId/glossary/")({
	component: RouteGlossaryIndex,
	pendingComponent: GlossarySkeleton,
});

function RouteGlossaryIndex() {
	const { workspaceId } = Route.useParams();
	return <GlossaryTab workspaceId={workspaceId} />;
}

function GlossarySkeleton() {
	return (
		<div className="flex h-full flex-col items-center overflow-y-auto py-6">
			<Skeleton className="h-6 w-28 mb-6" />
			<div className="w-full max-w-3xl">
				<div className="relative mb-4">
					<Skeleton className="absolute left-3 top-1/2 size-4 -translate-y-1/2" />
					<Skeleton className="h-9 w-full pl-9" />
				</div>
				<div className="flex flex-col">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="flex items-center justify-between border-b px-2 py-3">
							<div className="min-w-0">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-48 mt-1" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
