// ============================================================================
// src/lib/tools/f5os-restconf-path-explainer/index.ts
// ----------------------------------------------------------------------------
// The self-contained {manifest, run, vectors} triple for the F5OS RESTCONF
// path explainer. Decode-only and offline: it parses the path text and
// contacts nothing.
// ============================================================================

export { decodeF5osPath, knownModules, run, F5osPathError } from "./compute";
export type { F5osPathDecode, PathSegment, ModuleFact } from "./compute";
export { verifyVectors, F5OS_VECTORS, GOLDEN_VECTOR_SET_ID } from "./golden-vectors";
export type { F5osVector } from "./golden-vectors";

/**
 * Tool manifest. `learnLinks` point at the articles a reader of an F5OS path
 * most likely needs next; `sources` are the references surfaced on the page.
 * Frozen so it cannot be mutated at runtime.
 */
export const manifest = Object.freeze({
  toolSlug: "f5os-restconf-path-explainer",
  learnLinks: [
    "learn/f5os-restconf-paths",
    "learn/as3-declaration-anatomy",
    "learn/bigip-declarative-onboarding-do",
  ],
  sources: Object.freeze([
    Object.freeze({
      id: "f5os-restconf",
      label: "F5OS RESTCONF API",
      url: "https://clouddocs.f5.com/api/f5os/",
    }),
    Object.freeze({
      id: "rfc8040",
      label: "RFC 8040 - RESTCONF Protocol",
      url: "https://www.rfc-editor.org/rfc/rfc8040",
    }),
    Object.freeze({
      id: "openconfig",
      label: "OpenConfig - vendor-neutral YANG models",
      url: "https://www.openconfig.net/",
    }),
  ]),
});
