// ============================================================================
// src/lib/tools/rpki-origin-validation/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the route origin
// validation calculator (RFC 6811 section 2, worked against VRPs the reader
// supplies; nothing is fetched).
// ============================================================================

import { run, type RovInput, type RovResult } from "./compute"; // the engine
import { GOLDEN_VECTOR_SET_ID, ROV_GOLDEN_VECTORS, ROV_REJECT_VECTORS } from "./golden-vectors"; // the vectors

export { run, RovError, toAsdot } from "./compute"; // the engine's public functions
export type { RovInput, RovResult, RovErrorCode, VrpReport, VrpRelation, MaxLengthNote, RovNoteCode, Family } from "./compute"; // its types
export { GOLDEN_VECTOR_SET_ID, ROV_GOLDEN_VECTORS, ROV_REJECT_VECTORS, verifyVectors } from "./golden-vectors"; // the vectors

/** The D-49 declarative manifest for the route origin validation calculator. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking & addressing", // equals the catalogue family (D-73)
  toolSlug: "rpki-origin-validation", // the route segment and i18n key
  canonicalAliases: [ // what readers search for
    "route origin validation", // the operation's usual name
    "rov", // its acronym
    "rpki validation", // the infrastructure it uses
    "roa check", // the object it compares with
    "vrp", // Validated ROA Payload
    "prefix origin validation", // RFC 6811's own title
    "maxlength", // the ROA field RFC 9319 is about
  ], // aliases
  inputDetectors: [ // the omnibox detector
    {
      // A Route line: a prefix and an AS written with "AS" (asplain or asdot).
      // Anchored, two bounded character classes and one optional group, no
      // nested quantifier: linear (ReDoS-safe). The "AS" keeps a bare prefix
      // routed to the CIDR and IPv6 tools instead.
      kind: "regex", // a regular expression
      pattern: "^\\s*[0-9A-Fa-f:.]{2,45}/\\d{1,3}\\s+[Aa][Ss]\\d{1,10}(\\.\\d{1,5})?\\s*$", // "<prefix> AS<n>"
      priority: 5, // below the address tools' own detectors
      example: "192.0.2.0/24 AS64496", // golden vector rfc6811-valid's Route
    },
  ], // detectors

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // the reader supplies the VRPs; no RPKI fetch, no clock
  apiCapabilityClass: "local-equivalent", // the API runs the same engine on the same input

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the dated set id
  dangerousInputHandling: ["redos-guard", "bounded-input"], // linear parsers; 20,000 VRPs and 1,000,000 characters at most
  shareSafetyDefault: "fragment", // a VRP list can be long and is the reader's own data

  // -- Teaching & provenance --
  // The tool's own article first; the BGP security article states the RPKI layer this tool computes.
  learnLinks: ["learn/route-origin-validation-worked-by-hand", "learn/bgp-and-the-routing-chokepoint", "learn/bgp-primer"], // articles
  sources: [ // every document the engine and the vectors rest on, each read on 2026-10-19
    {
      id: "rfc6811", // the algorithm
      label: "RFC 6811, BGP Prefix Origin Validation, January 2013: section 2 (Covered, Matched, NotFound, Valid, Invalid; NONE and AS 0) and section 2.1 (pseudo-code)", // what it pins
      type: "standard", // Proposed Standard, updated by RFC 8481 and RFC 8893
      url: "https://www.rfc-editor.org/rfc/rfc6811.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the tool was built
      status: "active", // current
    },
    {
      id: "rfc9582", // the ROA profile
      label: "RFC 9582, A Profile for Route Origin Authorizations (ROAs), May 2024: sections 4.2 and 4.3.2.2 (maxLength range and meaning) and Appendix A", // what it pins
      type: "standard", // Proposed Standard; obsoletes RFC 6482
      url: "https://www.rfc-editor.org/rfc/rfc9582.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the tool was built
      status: "active", // current
    },
    {
      id: "rfc6483", // AS 0 ROAs
      label: "RFC 6483, Validation of Route Origination Using the Resource Certificate Public Key Infrastructure (PKI) and Route Origin Authorizations (ROAs), February 2012: section 4 (Disavowal of Routing Origination)", // what it pins
      type: "rfc", // Informational
      url: "https://www.rfc-editor.org/rfc/rfc6483.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the tool was built
      status: "active", // current
    },
    {
      id: "rfc7607", // AS 0 in BGP
      label: "RFC 7607, Codification of AS 0 Processing, August 2015: sections 1 and 2", // what it pins
      type: "standard", // Proposed Standard; updates RFC 4271
      url: "https://www.rfc-editor.org/rfc/rfc7607.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the tool was built
      status: "active", // current
    },
    {
      id: "rfc9319", // maxLength advice
      label: "RFC 9319, The Use of maxLength in the Resource Public Key Infrastructure (RPKI), October 2022: Abstract and sections 3 and 5", // what it pins
      type: "standard", // BCP 185
      url: "https://www.rfc-editor.org/rfc/rfc9319.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the tool was built
      status: "active", // current
    },
    {
      id: "rfc8416", // SLURM
      label: "RFC 8416, Simplified Local Internet Number Resource Management with the RPKI (SLURM), August 2018: sections 3.1, 3.2, 3.4.1 and 3.5", // what it pins
      type: "standard", // Proposed Standard
      url: "https://www.rfc-editor.org/rfc/rfc8416.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the tool was built
      status: "active", // current
    },
    {
      id: "rfc5396", // AS number notation
      label: "RFC 5396, Textual Representation of Autonomous System (AS) Numbers, December 2008: sections 2 and 3 (asplain, asdot+, asdot)", // what it pins
      type: "standard", // Proposed Standard
      url: "https://www.rfc-editor.org/rfc/rfc5396.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the tool was built
      status: "active", // current
    },
    {
      id: "documentation-values", // the vectors' addresses and AS numbers
      label: "RFC 5737 section 3 (IPv4), RFC 3849 (IPv6) and RFC 5398 section 4 (AS numbers): documentation values used by every example", // what it pins
      type: "rfc", // Informational
      url: "https://www.rfc-editor.org/rfc/rfc5398.txt", // fetched 2026-10-19, HTTP 200 (RFC 5737 and RFC 3849 the same day)
      access_date: "2026-10-19", // read the day the tool was built
      status: "active", // current
    },
  ], // sources
  credits: [ // who built it
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ], // credits
});

/**
 * runTool: the registry-facing entry point.
 * @param input { route, vrps } as the page and the API pass it
 * @returns the RFC 6811 state with its per-VRP reasoning
 */
export function runTool(input: RovInput): RovResult {
  return run(input); // the engine
}

// Vectors, exposed by the conventional names the golden-vector runner expects.
export const goldenVectors = ROV_GOLDEN_VECTORS; // accept vectors
export const rejectVectors = ROV_REJECT_VECTORS; // reject vectors
