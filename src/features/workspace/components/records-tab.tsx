import { Brain02Icon } from "@hugeicons/core-free-icons";
import { ArtifactTab } from "./artifact-tab";
import { RecordRpc } from "~/server/rpc/records";

export function RecordsTab({ workspaceId }: { workspaceId: string }) {
	return (
		<ArtifactTab
			workspaceId={workspaceId}
			config={{
				icon: Brain02Icon,
				label: "Learning Records",
				emptyTitle: "No records yet",
				emptyDescription:
					"Learning records will appear here as you progress through lessons.",
				detailFallbackTitle: "Learning Record",
				errorText: "Failed to load record content.",
				listQuery: RecordRpc.listRecords,
				contentQuery: RecordRpc.getRecordContent,
			}}
		/>
	);
}
