import { useState } from "react";
import { useSuspenseQuery, type UseSuspenseQueryOptions } from "@tanstack/react-query";
import { Renderer } from "@openuidev/react-lang";
import { asterLibrary } from "~/features/artifact/components/library"
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "~/components/ui/empty";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

export interface ArtifactItem {
	id: string;
	title: string;
	createdAt: string;
}

export interface ArtifactContent {
	content: string | null;
}

export interface ArtifactConfig {
	icon: IconSvgElement;
	label: string;
	emptyTitle: string;
	emptyDescription: string;
	detailFallbackTitle: string;
	errorText: string;
	listQuery: (workspaceId: string) => object;
	contentQuery: (workspaceId: string, id: string) => object;
}

interface ArtifactTabProps {
	workspaceId: string;
	config: ArtifactConfig;
}

export function ArtifactTab({ workspaceId, config }: ArtifactTabProps) {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const options = config.listQuery(workspaceId) as UseSuspenseQueryOptions;
	const resp = useSuspenseQuery(options);
	const items = (resp.data ?? []) as ArtifactItem[];


	if (items.length === 0) {
		return (
			<div className="flex h-full items-center justify-center p-6">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<HugeiconsIcon icon={config.icon} />
						</EmptyMedia>
						<EmptyTitle>{config.emptyTitle}</EmptyTitle>
						<EmptyDescription>{config.emptyDescription}</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		);
	}

	if (selectedId) {
		const item = items.find((a) => a.id === selectedId);
		return (
			<ArtifactDetailView
				workspaceId={workspaceId}
				itemId={selectedId}
				title={item?.title ?? config.detailFallbackTitle}
				onBack={() => setSelectedId(null)}
				contentQuery={config.contentQuery}
				errorText={config.errorText}
			/>
		);
	}

	return (
		<div className="flex h-full flex-col p-4">
			<h2 className="mb-4 text-lg font-semibold">{config.label}</h2>
			<div className="flex flex-col gap-2">
				{items.map((item) => (
					<button
						key={item.id}
						type="button"
						onClick={() => setSelectedId(item.id)}
						className="flex w-full items-center justify-between rounded-lg border bg-card p-3 text-left hover:bg-accent"
					>
						<span className="font-medium">{item.title}</span>
						<span className="text-xs text-muted-foreground">
							{new Date(item.createdAt).toLocaleDateString()}
						</span>
					</button>
				))}
			</div>
		</div>
	);
}

interface ArtifactDetailViewProps {
	workspaceId: string;
	itemId: string;
	title: string;
	onBack: () => void;
	contentQuery: (workspaceId: string, id: string) => object;
	errorText: string;
}

function ArtifactDetailView({
  workspaceId,
  itemId,
  title,
  onBack,
  contentQuery,
  errorText,
}: ArtifactDetailViewProps) {
	const options = contentQuery(workspaceId, itemId) as UseSuspenseQueryOptions;
	const resp = useSuspenseQuery(options);
	const content: ArtifactContent | null = (resp.data ?? null) as ArtifactContent | null;

	return (
		<div className="flex h-full flex-col p-4">
			<div className="mb-4 flex items-center gap-2">
				<button
					type="button"
					onClick={onBack}
					className="text-sm text-muted-foreground hover:text-foreground"
				>
					← Back
				</button>
				<h2 className="text-lg font-semibold">{title}</h2>
			</div>
			<div className="flex-1 overflow-y-auto">
				{content ? (
					<Renderer
						library={asterLibrary}
						response={content.content}
						isStreaming={false}
					/>
				) : (
					<p className="text-sm text-muted-foreground">{errorText}</p>
				)}
			</div>
		</div>
	);
}