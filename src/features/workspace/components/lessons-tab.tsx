import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Renderer } from "@openuidev/react-lang";
import { asterLibrary } from "~/components/openui/library";
import { LessonRpc } from "~/server/rpc/lessons";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "~/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notebook01Icon } from "@hugeicons/core-free-icons";

interface LessonsTabProps {
	workspaceId: string;
}

export function LessonsTab({ workspaceId }: LessonsTabProps) {
	const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

	const { data: lessons = [], isLoading } = useQuery(LessonRpc.listLessons(workspaceId));

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center p-6">
				<p className="text-sm text-muted-foreground">Loading lessons…</p>
			</div>
		);
	}

	if (lessons.length === 0) {
		return (
			<div className="flex h-full items-center justify-center p-6">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<HugeiconsIcon icon={Notebook01Icon} />
						</EmptyMedia>
						<EmptyTitle>No lessons yet</EmptyTitle>
						<EmptyDescription>
							Lessons will appear here as your teacher agent generates them.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		);
	}

	if (selectedLessonId) {
		const lesson = lessons.find((l) => l.id === selectedLessonId);
		return (
			<LessonView
				workspaceId={workspaceId}
				lessonId={selectedLessonId}
				title={lesson?.title ?? "Lesson"}
				onBack={() => setSelectedLessonId(null)}
			/>
		);
	}

	return (
		<div className="flex h-full flex-col p-4">
			<h2 className="mb-4 text-lg font-semibold">Lessons</h2>
			<div className="flex flex-col gap-2">
				{lessons.map((lesson) => (
					<button
						key={lesson.id}
						type="button"
						onClick={() => setSelectedLessonId(lesson.id)}
						className="flex w-full items-center justify-between rounded-lg border bg-card p-3 text-left hover:bg-accent"
					>
						<span className="font-medium">{lesson.title}</span>
						<span className="text-xs text-muted-foreground">
							{new Date(lesson.createdAt).toLocaleDateString()}
						</span>
					</button>
				))}
			</div>
		</div>
	);
}

interface LessonViewProps {
	workspaceId: string;
	lessonId: string;
	title: string;
	onBack: () => void;
}

function LessonView({ workspaceId, lessonId, title, onBack }: LessonViewProps) {
	const { data: content, isLoading } = useQuery(LessonRpc.getLessonContent(workspaceId, lessonId));

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
				{isLoading ? (
					<p className="text-sm text-muted-foreground">Loading…</p>
				) : content ? (
					<Renderer library={asterLibrary} response={content} isStreaming={false} />
				) : (
					<p className="text-sm text-muted-foreground">Failed to load lesson content.</p>
				)}
			</div>
		</div>
	);
}
