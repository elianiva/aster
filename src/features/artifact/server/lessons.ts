import { createArtifactRpc } from "./kind-rpc";

const rpc = createArtifactRpc("lesson", "lessonId");

export const LessonRpc = {
  listLessons: rpc.list,
  getLessonContent: rpc.getContent,
  getLesson: rpc.get,
};
