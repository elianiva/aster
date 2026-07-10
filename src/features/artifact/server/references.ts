import { createArtifactRpc } from "./kind-rpc";

const rpc = createArtifactRpc("reference", "referenceId");

export const ReferenceRpc = {
  listReferences: rpc.list,
  getReferenceContent: rpc.getContent,
  getReference: rpc.get,
};
