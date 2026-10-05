// ============================================================================
// src/lib/tools/bits-bytes/index.ts
// ----------------------------------------------------------------------------
// BITS, BYTES AND THROUGHPUT: the self-describing {manifest, run, vectors}
// triple (D-49).
//
// The oldest item in the catalogue by ancestry: a bits-and-bytes calculator
// sat on nutzmann.net in 2004 and on ntz.com.br in 2013. Rebuilt with exact
// arithmetic: a size in every unit of both conventions (SI decimal, IEC
// binary) with the bit count written out, a rate in bits and bytes per second
// and per minute, hour and day, and any two of size, rate and time giving the
// third, with an efficiency preset derived from RFC 2544 and the IP and TCP
// header minima, and a connection table from ITU-T V.90, ITU-T G.704 and IEEE
// 802.3-2022. Sources read 2026-10-04 (see compute.ts).
// ============================================================================

import { run as compute, SOURCES, type BitsBytesInput, type BitsBytesResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types and helpers.
export type { BitsBytesInput, BitsBytesResult, QuantityView, QuantityNote, SizeView, RateView, TransferView, Duration, UnitRow, ErrorCode, Kind, Source, Link } from "./compute";
export { SOURCES, LINKS, EFFICIENCY_PRESETS, SIZE_UNITS, RATE_UNITS, MAX_FIELD, parseQuantity, formatRatio } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors, pin } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "TLS & transport",
  // The slug.
  toolSlug: "bits-bytes",
  // Other names it answers to.
  canonicalAliases: ["bits-and-bytes", "data-size-converter", "throughput-calculator", "transfer-time", "bandwidth-calculator", "kib-vs-kb"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 1, pattern: "^\\d+(?:[.,]\\d+)?\\s*(?:[kKMGTPEZ]i?)?(?:bit|bits|byte|bytes|b|B)(?:/s|ps)?$", example: "{\"size\":\"56 KiB\",\"rate\":\"56 kbit/s\"}" },
  ],
  // Runs in the browser.
  capabilityBadge: "browser",
  // Nothing leaves the page.
  executionClass: ["localOnly"],
  // The API runs this same code.
  apiCapabilityClass: "local-equivalent",
  // The vector set.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile or oversized input is handled: each field is cut at 64 characters and parsed by one anchored expression; arithmetic is BigInt, so no value overflows.
  dangerousInputHandling: ["bounded-parse", "generated-code-only", "never-fetches"],
  // Nothing sensitive in a size or a rate: share by fragment.
  shareSafetyDefault: "fragment",
  // The Learn article written for it.
  learnLinks: ["learn/bits-bytes-and-the-two-kinds-of-kilo"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["mtu-mss", "cidr", "ascii-table"],
  // Sources, each read live on its access date.
  sources: SOURCES.map((s) => ({ ...s, status: "active" as const })),
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: BitsBytesInput): BitsBytesResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
