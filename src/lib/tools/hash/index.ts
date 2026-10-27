// ============================================================================
// src/lib/tools/hash/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING HASH MODULE - a self-contained {manifest, run, vectors} triple.
// run() is async here (Web Crypto digest is a Promise); the manifest is
// otherwise the same D-49 shape as the other tools.
//
// inputDetector is a heuristic, not a regex: any text can be hashed, so there
// is no distinctive pattern to route on. executionClass is localOnly (the
// digest is one-way and safe to publish), but shareSafetyDefault is "fragment"
// because the INPUT may be a secret (e.g. a password being hashed), so a result
// permalink should keep it in the URL fragment, never an indexable path.
//
// 2026-10-26: FILE HASHING. The component also hashes a file the reader picks
// or drops, read by the browser through the W3C File API and hashed with Web
// Crypto; nothing is uploaded. The pure part (hashBytes, hashBlob, the size
// limit, describeByteSize, the VirusTotal link) lives in compute.ts and is
// re-exported here. run() is unchanged: the registry and the API still hash
// text only (a file cannot travel through the text API).
// ============================================================================

import { hashAll, HASH_ALGORITHMS, type HashResult } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  HASH_GOLDEN_VECTORS,
  HASH_REJECT_VECTORS,
} from "./golden-vectors";

export {
  GOLDEN_VECTOR_SET_ID,
  HASH_GOLDEN_VECTORS,
  HASH_REJECT_VECTORS,
  // 2026-10-26: the v1 + v2 runner (async), re-exported like the other tools' verifyVectors.
  verifyVectors,
} from "./golden-vectors";
export { HASH_ALGORITHMS } from "./compute";
export type { HashResult, HashDigest, HashAlgorithm } from "./compute";
// 2026-10-26: the file path's pure functions and constants, for the component.
export {
  hashBytes,
  hashBlob,
  decideFileSize,
  describeByteSize,
  virusTotalFileReportUrl,
  // 2026-10-27: the compare-with-expected-hash box.
  compareWithExpected,
  FILE_HASH_MAX_BYTES,
  VIRUSTOTAL_FILE_REPORT_PREFIX,
} from "./compute";
// 2026-10-26: their types.
export type {
  // 2026-10-27: the compare box's outcome.
  HashComparison,
  BytesHashResult,
  BlobHashOutcome,
  ByteSize,
  ByteUnit,
  FileSizeDecision,
  HashStepListener,
  ReadableBlob,
} from "./compute";

/** The D-49 declarative manifest for the Hash tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Hashing",
  toolSlug: "hash",
  // "file-hash" and "sha256sum" added 2026-10-26 with the file view.
  canonicalAliases: ["sha256", "sha", "digest", "checksum", "sha512", "file-hash", "sha256sum"],
  inputDetectors: [
    {
      // Any text is hashable, so there is no distinctive pattern. A low-priority
      // heuristic carries the example the schema requires.
      kind: "heuristic",
      priority: 1,
      example: "hash this text",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"], // the digest is one-way; nothing leaves the device
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["secret-redaction"], // input may be a secret
  shareSafetyDefault: "fragment", // keep a (possibly secret) input out of indexable URLs

  // -- Teaching & provenance --
  learnLinks: ["learn/hashing"],
  sources: [
    {
      id: "fips180-4",
      label: "FIPS 180-4 - Secure Hash Standard (SHA-1/256/384/512)",
      type: "nist",
      url: "https://csrc.nist.gov/pubs/fips/180-4/upd1/final",
      access_date: "2026-10-27", // re-read 2026-10-26 with the file view (was 2026-06-26), and again 2026-10-27
      scope: "definitions of the SHA family",
      status: "active",
    },
    {
      id: "rfc6234",
      label: "RFC 6234 - US Secure Hash Algorithms",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc6234",
      access_date: "2026-10-27", // re-read 2026-10-26 and 2026-10-27: its TEST1, TEST2_1, TEST2_2 and TEST3 digests are v2 byte vectors
      scope: "SHA + HMAC reference and test vectors",
      status: "active",
    },
    // 2026-10-26, the file view: how the browser hands over and reads a file.
    {
      id: "w3c-file-api",
      label: "W3C File API (Working Draft, 12 September 2026) - Blob size and type, File name, arrayBuffer(), read errors",
      type: "spec",
      url: "https://www.w3.org/TR/FileAPI/",
      access_date: "2026-10-27", // first read 2026-10-26; re-read 2026-10-27, unchanged
      scope: "what the browser reports for a file and how its bytes are read locally",
      status: "active",
    },
    // 2026-10-26: why there is a size limit (one buffer, copied, no streaming digest).
    {
      id: "w3c-webcrypto",
      label: "W3C Web Cryptography Level 2 - 14.3.5 The digest method; 32 SHA",
      type: "spec",
      url: "https://www.w3.org/TR/webcrypto/",
      access_date: "2026-10-27", // first read 2026-10-26; re-read 2026-10-27, unchanged
      scope: "digest() takes one BufferSource, copies its bytes and has no streaming form; SHA-1/256/384/512 names",
      status: "active",
    },
    // 2026-10-26: the file picker and the drop.
    {
      id: "whatwg-html-file-dnd",
      label: "WHATWG HTML - File Upload state (input type=file) and drag and drop (DataTransfer files and types)",
      type: "spec",
      url: "https://html.spec.whatwg.org/multipage/input.html#file-upload-state-(type=file)",
      access_date: "2026-10-27", // first read 2026-10-26; re-read 2026-10-27, unchanged
      scope: "choosing a file with the picker or by dropping it; the \"Files\" type during dragover",
      status: "active",
    },
    // 2026-10-26: the outbound lookup link's documented form.
    {
      id: "virustotal-most-recent-report",
      label: "VirusTotal - How can I link to the most recent report on a given file or URL?",
      type: "vendor-docs",
      url: "https://docs.virustotal.com/docs/most-recent-report",
      access_date: "2026-10-27", // first read 2026-10-26; re-read 2026-10-27, unchanged
      scope: "the file report link https://www.virustotal.com/gui/file/<SHA-256>/detection",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run - the registry-facing entry point. ASYNC: computes every supported
 * digest of the input's UTF-8 bytes via Web Crypto. Never throws.
 * @param input arbitrary text to hash
 */
export async function run(input: string): Promise<HashResult> {
  return hashAll(input);
}

export const goldenVectors = HASH_GOLDEN_VECTORS;
export const rejectVectors = HASH_REJECT_VECTORS;
