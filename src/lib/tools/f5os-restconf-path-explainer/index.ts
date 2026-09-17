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
    "learn/reading-what-a-bigip-says-about-itself",
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
    // The ":443/api" front door and the version it arrived in. F5's own
    // automation guides for rSeries and VELOS document BOTH doors but name no
    // version; this DevCentral codeshare (2 December 2022) is where the version
    // is stated, and the 1.8.0 release note below is the corroboration.
    Object.freeze({
      id: "f5os-api-port-1-8",
      label: "F5 DevCentral codeshare, 2 December 2022 - automating F5OS config backup: as of F5OS 1.8, \":8888/restconf\" can be replaced with \":443/api\"",
      url: "https://community.f5.com/kb/codeshare/f5-velosrseriesf5os-code-for-automating-config-backup-with-the-new-restconf-api-/305521",
    }),
    Object.freeze({
      id: "f5os-a-180-relnotes",
      label: "F5OS-A 1.8.0 fixes and known issues, item 1572137-2 - upload and download API should work with \"/api\" and \"/restconf\"",
      url: "https://techdocs.f5.com/kb/en-us/products/f5os-a/releasenotes/related/relnote-supplement-f5os-a-1-8-0.html",
    }),
  ]),
});
