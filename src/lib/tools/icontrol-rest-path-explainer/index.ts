// ============================================================================
// The {manifest, run, vectors} triple for the iControl REST path explainer.
// Decode-only and offline: it parses the URL text and contacts nothing.
// ============================================================================

export { decodeIControlPath, knownModules, run, IControlPathError } from "./compute";
export type { IControlDecode, ObjectPath, ModuleFact, QueryOption } from "./compute";
export { verifyVectors, ICONTROL_VECTORS, GOLDEN_VECTOR_SET_ID } from "./golden-vectors";
export type { IControlVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolSlug: "icontrol-rest-path-explainer",
  learnLinks: [
    "learn/icontrol-rest-paths",
    "learn/f5os-restconf-paths",
  ],
  sources: Object.freeze([
    Object.freeze({ id: "icontrol-rest", label: "F5 iControl REST API reference", url: "https://clouddocs.f5.com/api/icontrol-rest/" }),
    Object.freeze({ id: "icontrol-userguide", label: "iControl REST user guide", url: "https://clouddocs.f5.com/api/icontrol-rest/APIRef_tm_ltm.html" }),
  ]),
});
