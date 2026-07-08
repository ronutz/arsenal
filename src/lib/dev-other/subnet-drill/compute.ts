// ============================================================================
// src/lib/dev-other/subnet-drill/compute.ts
// ----------------------------------------------------------------------------
// SUBNETTING DRILL TRAINER — the first /dev/other resident (green room).
//
// WHY GREEN (not catalogue): this tool's essence is RANDOMNESS and PERSISTENT
// STATE — two axes the catalogue holds nowhere. It GENERATES exercises from a
// seed and REMEMBERS your streak in localStorage. The catalogue's tools are
// pure input->output functions with golden vectors; a generator's output
// legitimately differs every run, so "the correct output" is undefined for
// the tool as a whole. What IS deterministic — and IS pinned by vectors — is
// (a) generation given a fixed seed, and (b) grading given a fixed question.
// A seeded PRNG makes the generator itself reproducible, which is how an
// inherently-random tool still earns tests.
//
// The subnet MATH is not reimplemented: generation and the canonical answers
// reuse the live cidr engine (ipToInt/intToIp/prefixSize/maskForPrefix), so
// the arithmetic the trainer quizzes is the SAME arithmetic the cidr tool
// ships, already golden-vectored on the main floor. This module adds only the
// question shapes, the seeded PRNG, and the grader.
// ============================================================================

import { ipToInt, intToIp, maskForPrefix, prefixSize } from "@/lib/tools/cidr/compute";

// ----------------------------------------------------------------------------
// Seeded PRNG — mulberry32. Small, fast, well-distributed, and fully
// reproducible: the same seed yields the same stream forever, which is what
// lets golden vectors assert generated questions.
// ----------------------------------------------------------------------------

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] from a PRNG unit float. */
function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

// ----------------------------------------------------------------------------
// Difficulty & question kinds
// ----------------------------------------------------------------------------

export type Difficulty = "easy" | "medium" | "hard";

export type QuestionKind =
  | "network-address" // given A.B.C.D/p, what is the network address?
  | "broadcast-address" // ...the broadcast address?
  | "usable-hosts" // ...how many usable hosts?
  | "netmask" // ...the dotted-decimal mask for /p?
  | "host-count-to-prefix" // smallest prefix fitting N hosts?
  | "contains-host"; // is H inside A.B.C.D/p? (yes/no)

/** Prefix ranges per difficulty keep the mental math age-appropriate:
 *  easy sticks to octet boundaries, hard roams the hard middles. */
const PREFIX_BANDS: Record<Difficulty, [number, number]> = {
  easy: [24, 30],
  medium: [16, 30],
  hard: [8, 31],
};

const KINDS_BY_DIFFICULTY: Record<Difficulty, QuestionKind[]> = {
  easy: ["network-address", "netmask", "usable-hosts"],
  medium: ["network-address", "broadcast-address", "usable-hosts", "netmask", "contains-host"],
  hard: [
    "network-address",
    "broadcast-address",
    "usable-hosts",
    "netmask",
    "host-count-to-prefix",
    "contains-host",
  ],
};

export interface DrillQuestion {
  /** Stable id derived from seed+index, so a question can be re-graded later. */
  id: string;
  kind: QuestionKind;
  /** The prompt's fixed parts, already resolved to strings for display. */
  prompt: {
    /** Present for address/mask/contains kinds. */
    cidr?: string;
    /** Present for host-count-to-prefix. */
    hostCount?: number;
    /** Present for contains-host. */
    host?: string;
  };
  /** The canonical answer, and the accepted-answer matcher lives in grade(). */
  answer: string;
  /** Answer shape, so the UI can pick an input control and validate. */
  answerType: "ipv4" | "netmask" | "integer" | "prefix" | "boolean";
}

// ----------------------------------------------------------------------------
// Generation (seeded, reproducible)
// ----------------------------------------------------------------------------

function randomAddress(rng: () => number): number {
  // Avoid 0.x and 127.x and 224+.x to keep addresses unicast-plausible.
  const first = randInt(rng, 1, 223);
  const skip = first === 127;
  const a = skip ? 126 : first;
  return (
    (a << 24) |
    (randInt(rng, 0, 255) << 16) |
    (randInt(rng, 0, 255) << 8) |
    randInt(rng, 0, 255)
  ) >>> 0;
}

/** Build one question from the PRNG and difficulty. Pure given (rng, difficulty). */
function makeQuestion(rng: () => number, difficulty: Difficulty, id: string): DrillQuestion {
  const kinds = KINDS_BY_DIFFICULTY[difficulty];
  const kind = kinds[randInt(rng, 0, kinds.length - 1)];
  const [pMin, pMax] = PREFIX_BANDS[difficulty];
  const prefix = randInt(rng, pMin, pMax);
  const addrInt = randomAddress(rng);
  const mask = maskForPrefix(prefix);
  const network = (addrInt & mask) >>> 0;
  const size = prefixSize(prefix);
  const broadcast = (network + size - 1) >>> 0;
  const cidr = `${intToIp(addrInt)}/${prefix}`;

  switch (kind) {
    case "network-address":
      return { id, kind, prompt: { cidr }, answer: intToIp(network), answerType: "ipv4" };
    case "broadcast-address":
      return { id, kind, prompt: { cidr }, answer: intToIp(broadcast), answerType: "ipv4" };
    case "netmask":
      return { id, kind, prompt: { cidr }, answer: intToIp(mask), answerType: "netmask" };
    case "usable-hosts": {
      // RFC 3021: /31 has 2 usable; /32 has 1; otherwise size - 2.
      const usable = prefix >= 31 ? (prefix === 31 ? 2 : 1) : size - 2;
      return { id, kind, prompt: { cidr }, answer: String(usable), answerType: "integer" };
    }
    case "host-count-to-prefix": {
      // Ask: smallest prefix whose block holds at least N usable hosts.
      const need = randInt(rng, 2, 4000);
      let p = 32;
      while (p >= 0) {
        const usable = p >= 31 ? (p === 31 ? 2 : 1) : prefixSize(p) - 2;
        if (usable >= need) break;
        p--;
      }
      return { id, kind, prompt: { hostCount: need }, answer: `/${p}`, answerType: "prefix" };
    }
    case "contains-host": {
      // Half the time pick an address inside the block, half outside.
      const inside = rng() < 0.5;
      let host: number;
      if (inside) {
        host = (network + randInt(rng, 0, Math.max(0, size - 1))) >>> 0;
      } else {
        // A nearby address outside the block (flip a high in-mask bit region).
        host = (broadcast + 1 + randInt(rng, 0, Math.max(1, size))) >>> 0;
      }
      const within = (host & mask) >>> 0;
      const isInside = within === network;
      return {
        id,
        kind,
        prompt: { cidr, host: intToIp(host) },
        answer: isInside ? "yes" : "no",
        answerType: "boolean",
      };
    }
  }
}

/** Generate a reproducible batch of N questions from a numeric seed. */
export function generateDrill(seed: number, difficulty: Difficulty, count: number): DrillQuestion[] {
  const rng = mulberry32(seed);
  const out: DrillQuestion[] = [];
  for (let i = 0; i < count; i++) {
    out.push(makeQuestion(rng, difficulty, `${seed}-${difficulty}-${i}`));
  }
  return out;
}

// ----------------------------------------------------------------------------
// Grading (deterministic, tolerant of harmless input variety)
// ----------------------------------------------------------------------------

export interface GradeResult {
  correct: boolean;
  /** The canonical answer, always returned so the UI can teach on a miss. */
  expected: string;
  /** The learner's input, normalized for display. */
  normalized: string;
}

/** Grade a single answer against its question. Pure and deterministic. */
export function grade(question: DrillQuestion, raw: string): GradeResult {
  const expected = question.answer;
  const input = raw.trim().toLowerCase();

  let correct = false;
  switch (question.answerType) {
    case "boolean":
      // Accept yes/no, y/n, true/false, 1/0.
      correct =
        (["yes", "y", "true", "1"].includes(input) && expected === "yes") ||
        (["no", "n", "false", "0"].includes(input) && expected === "no");
      break;
    case "prefix": {
      // Accept "/24" or "24".
      const want = expected.replace("/", "");
      correct = input.replace("/", "") === want;
      break;
    }
    case "integer":
      correct = input.replace(/[, ]/g, "") === expected;
      break;
    case "ipv4":
    case "netmask":
      // Compare by numeric value so "192.168.001.000" == "192.168.1.0".
      try {
        correct = ipToInt(raw.trim()) === ipToInt(expected);
      } catch {
        correct = false;
      }
      break;
  }
  return { correct, expected, normalized: raw.trim() };
}
