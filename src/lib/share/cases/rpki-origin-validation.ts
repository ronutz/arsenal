// ============================================================================
// src/lib/share/cases/rpki-origin-validation.ts
// ----------------------------------------------------------------------------
// Share cases of the route origin validation calculator: the Route goes as
// #input= and the VRP list as vrps, both as typed; a half share is ignored.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { RPKI_ORIGIN_VALIDATION_SHARE } from "../../tools/rpki-origin-validation/share"; // the spec
import { ROV_GOLDEN_VECTORS } from "../../tools/rpki-origin-validation/golden-vectors"; // the tool's own vectors

/** A vector's two inputs as the page's boxes show them (a SLURM object as indented JSON, as the page writes it). */
const boxes = (id: string): { input: string; vrps: string } => {
  const v = ROV_GOLDEN_VECTORS.find((x) => x.id === id); // the vector
  const vrps = v ? (typeof v.input.vrps === "string" ? v.input.vrps : JSON.stringify(v.input.vrps, null, 2)) : ""; // as RpkiOriginValidationTool's vrpText
  return { input: v?.input.route ?? "", vrps }; // the two boxes ("" if renamed: the case then fails loudly)
}; // boxes

/** The cases. */
export const RPKI_SHARE_CASES = defineShareCases(Object.freeze({
  spec: RPKI_ORIGIN_VALIDATION_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: boxes("rfc6811-one-match-wins"), params: boxes("rfc6811-one-match-wins"), restored: boxes("rfc6811-one-match-wins") }, // the page's Example: two VRPs, one Matches
    { id: "ipv6-asdot", state: boxes("rfc9582-appendix-a"), params: boxes("rfc9582-appendix-a"), restored: boxes("rfc9582-appendix-a") }, // IPv6, AS 65536 in asdot
    { id: "slurm-json", state: boxes("rfc8416-fig7-filters"), params: boxes("rfc8416-fig7-filters"), restored: boxes("rfc8416-fig7-filters") }, // a SLURM file: braces, quotes, colons
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "", vrps: "" } }, // both blank
    { id: "route-only", state: { input: "192.0.2.0/24 AS64496", vrps: "" } }, // no list: the page computes nothing
    { id: "list-only", state: { input: " ", vrps: "192.0.2.0/24 24 AS64496" } }, // no Route
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "absent", values: { input: null, vrps: null } }, // not there
    { id: "no-list", values: { input: "192.0.2.0/24 AS64496", vrps: null } }, // half a share
    { id: "no-route", values: { input: null, vrps: "192.0.2.0/24 24 AS64496" } }, // the other half
    { id: "blank-route", values: { input: "  ", vrps: "192.0.2.0/24 24 AS64496" } }, // a blank Route
  ],
}));
