import { File02Icon } from "@hugeicons/core-free-icons";
import { ArtifactTab } from "./artifact-tab";
import { ReferenceRpc } from "~/server/rpc/titled-artifact-rpc"

export function ReferenceDocsTab({ workspaceId }: { workspaceId: string }) {
	return (
		<ArtifactTab
			workspaceId={workspaceId}
			config={{
				icon: File02Icon,
				label: "Reference Docs",
				emptyTitle: "No reference docs yet",
				emptyDescription:
					"The agent creates cheat sheets and reference guides alongside your lessons.",
				detailFallbackTitle: "Reference",
				errorText: "Failed to load reference content.",
				listQuery: ReferenceRpc.listReferences,
				contentQuery: ReferenceRpc.getReferenceContent,
			}}
		/>
	);
}
