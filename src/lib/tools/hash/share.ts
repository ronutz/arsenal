// ============================================================================
// src/lib/tools/hash/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the hash tool (posture "input-caution", the
// inventory's, with a derived form for files and a blocked case for text).
// The page has two answers, so it has two buttons, and a link never mixes
// them:
//
//   TEXT  The text box as typed, the algorithm shown (when it is not the
//         default SHA-256) and the compare box when it compares with the
//         text. The manifest says the input "may be a secret (e.g. a password
//         being hashed)", and a digest is no cover for one: an unsalted fast
//         hash of a weak password is recovered in seconds (the site's own
//         preimage finder shows it). So the popover cautions, and a text in
//         which the site's secrets check (src/lib/tools/code-to-image/
//         secrets.ts, reused as is) finds a credential gets no link at all
//         (blocked "secret", naming its label and line): a private key, an
//         Authorization header, an AWS access key ID, a JWT, a password in a
//         URL, a FortiOS ENC value, or a value set to a secret-looking name.
//   FILE  Never the file: no byte of it, nor its name, ever goes in a link.
//         The link carries the file's digest for the algorithm shown, in the
//         compare box's place, so the reader of the link chooses the same
//         file and the box says whether it matches: the use a published hash
//         exists for. (The page's VirusTotal link already carries the
//         SHA-256 outbound, when the reader follows it.)
//
// Arrival: a text link fills the text box and the page hashes it (Web Crypto,
// in the browser); a file link fills the compare box and waits for a file.
// The algorithm and the compare box take the link's values. Nothing is sent,
// nothing is read from disk without the reader choosing a file. An algorithm
// the page does not offer, a compare value of more than one line or longer
// than the box takes, a file link whose value is not a digest of the
// algorithm's length, or a text holding a credential, makes the whole link
// malformed: ignored, and stripped from the address either way.
// ============================================================================

import { HASH_ALGORITHMS, type HashAlgorithm } from "./compute"; // the engine's algorithms
import { scanSecrets } from "../code-to-image/secrets"; // the site's secrets check, reused as is
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The algorithm a link leaves out (the page's default). */
const DEFAULT_ALGORITHM: HashAlgorithm = "SHA-256"; // the page opens on it

/** The longest compare value a link carries: a sha512sum line with a long file name fits. */
export const MAX_EXPECTED = 1024; // characters

/** Hex digest length per algorithm, in hex digits: the same table compute.ts keeps for the compare box. */
const HEX_LENGTH: Readonly<Record<HashAlgorithm, number>> = Object.freeze({ "SHA-1": 40, "SHA-256": 64, "SHA-384": 96, "SHA-512": 128 }); // 160, 256, 384 and 512 bits

/** What the page encodes: the text answer, or the file answer. */
export type HashShareInput =
  | {
      /** The text answer. */
      part: "text";
      /** The text box as typed. */
      text: string;
      /** The algorithm shown. */
      algorithm: HashAlgorithm;
      /** The compare box as typed. */
      expected: string;
      /** True when the page shows the text's digests. */
      hasResult: boolean;
      /** True when the compare box compares with the text (no file hashed). */
      compareText: boolean;
    }
  | {
      /** The file answer. */
      part: "file";
      /** The file's hex digest for the algorithm shown, or null while no file is hashed. */
      hex: string | null;
      /** The algorithm shown. */
      algorithm: HashAlgorithm;
    };

/** What an arrival restores. */
export interface HashShareState {
  /** The text to hash, or null for a file link (the text box keeps its value). */
  text: string | null;
  /** The algorithm to show. */
  algorithm: HashAlgorithm;
  /** The compare box's value, or null when the link carried none (the box keeps its value). */
  expected: string | null;
}

/** What the secrets check found first in a text. */
export interface HashTextSecret {
  /** Its safe label (a header, attribute or key name, or the PEM label; never the secret). */
  label: string;
  /** Its 1-based line. */
  line: number;
}

/**
 * The first credential the site's secrets check finds in a text.
 * @param text the text box as typed
 * @returns the finding's label and line, or null
 */
export function findTextSecret(text: string): HashTextSecret | null {
  const normalised = text.replace(/\r\n?/g, "\n"); // the check reads line feeds only
  const first = scanSecrets(normalised, () => false)[0]; // a text has no comment syntax to honour
  return first ? { label: first.label, line: first.line } : null; // the first, by position
} // findTextSecret

/** The spec. */
export const HASH_SHARE: ShareSpec<HashShareInput, HashShareState> = Object.freeze({
  tool: "hash", // the slug
  posture: "input-caution", // the text as typed, with a caution; a file only as its digest
  carriesKey: "share.carries", // tools.hash.share.carries (a select on the part)
  names: ["input", "algorithm", "expected"], // text: input (+algorithm, +expected); file: expected (+algorithm)
  /** The text answer or the file answer, never both. */
  encode(s: HashShareInput): ShareEncoding {
    const p: Record<string, string> = {}; // the values
    if (s.algorithm !== DEFAULT_ALGORITHM) p.algorithm = s.algorithm; // the default is left out
    if (s.part === "file") { // the file answer
      if (s.hex === null) return { ok: false, reason: "empty" } as const; // no file hashed
      p.expected = s.hex; // its digest, never the file or its name
      return { ok: true, params: p } as const; // the values
    } // file
    if (!s.hasResult || s.text === "") return { ok: false, reason: "empty" } as const; // nothing hashed
    const secret = findTextSecret(s.text); // a credential in the text?
    if (secret !== null) return { ok: false, reason: "blocked", code: "secret", values: { label: secret.label, line: secret.line } } as const; // never in a link
    p.input = s.text; // the text as typed
    const expected = s.expected.trim(); // the compare box, if it compares with the text
    if (s.compareText && expected !== "" && expected.length <= MAX_EXPECTED && !/[\r\n]/.test(expected)) p.expected = expected; // as the box reads it
    return { ok: true, params: p } as const; // the values
  },
  /** A text without credentials, or a file's digest of the algorithm's length; an offered algorithm. */
  decode(v: Readonly<Record<string, string | null>>): HashShareState | null {
    const algorithm = v.algorithm === null || v.algorithm === undefined ? DEFAULT_ALGORITHM : HASH_ALGORITHMS.find((a) => a === v.algorithm); // absent: the default
    if (algorithm === undefined) return null; // not offered
    const expected = v.expected ?? null; // the compare value, if any
    if (expected !== null && (expected === "" || expected.length > MAX_EXPECTED || /[\r\n]/.test(expected))) return null; // one line, as the box holds it
    const text = v.input ?? null; // the text, if any
    if (text !== null) { // a text link
      if (text === "" || findTextSecret(text) !== null) return null; // never empty, never a credential
      return { text, algorithm, expected }; // the state to fill
    } // text
    if (expected === null || expected.length !== HEX_LENGTH[algorithm] || !/^[0-9a-f]+$/.test(expected)) return null; // a file link carries the digest
    return { text: null, algorithm, expected }; // the compare box only
  },
});
