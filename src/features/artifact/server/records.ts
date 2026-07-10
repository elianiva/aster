import { createArtifactRpc } from "./kind-rpc";

const rpc = createArtifactRpc("record", "recordId");

export const RecordRpc = {
  listRecords: rpc.list,
  getRecordContent: rpc.getContent,
  getRecord: rpc.get,
};
