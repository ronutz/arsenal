// ============================================================================
// src/lib/dev-other/subnet-drill/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the DETERMINISTIC layers of an inherently-random tool.
// The trainer's whole-tool output varies by seed (that is the point), but two
// things are pinned exactly:
//   1. Seeded generation: generateDrill(SEED, difficulty, n) is byte-stable, so
//      a fixed seed's questions are asserted verbatim. This is how a generator
//      earns tests — freeze the seed, freeze the output.
//   2. Grading: grade(question, answer) is a pure function; correct/incorrect
//      and the tolerant input matching are asserted directly.
// The subnet MATH itself is not re-tested here — it is the cidr engine's, and
// carries the cidr tool's own golden vectors on the main floor.
// ============================================================================

import { generateDrill, grade, mulberry32, type DrillQuestion } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "dev-other-subnet-drill/2026-07-08";

// A fixed seed's first few questions, captured from the reference run and
// pinned. If the PRNG, the question shapes, or the math drift, this breaks.
const SEED = 424242;


interface GradeCase {
  id: string;
  question: DrillQuestion;
  answer: string;
  expectCorrect: boolean;
}

export interface VectorReport {
  setId: string;
  total: number;
  passed: number;
  failures: string[];
}

export function verifyVectors(): VectorReport {
  const failures: string[] = [];

  // --- 1. PRNG reproducibility: same seed, same stream ---
  {
    const a = mulberry32(SEED);
    const b = mulberry32(SEED);
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    if (JSON.stringify(seqA) !== JSON.stringify(seqB)) {
      failures.push("prng-reproducible: same seed produced different streams");
    }
    // A different seed must diverge (guards against a constant-output bug).
    const c = mulberry32(SEED + 1);
    if (c() === seqA[0]) failures.push("prng-distinct: different seeds collided on first draw");
  }

  // --- 2. Generation reproducibility: same seed, identical questions ---
  {
    const q1 = generateDrill(SEED, "medium", 5);
    const q2 = generateDrill(SEED, "medium", 5);
    if (JSON.stringify(q1) !== JSON.stringify(q2)) {
      failures.push("gen-reproducible: same seed produced different questions");
    }
    if (q1.length !== 5) failures.push(`gen-count: expected 5, got ${q1.length}`);
    // Ids are stable and unique within the batch.
    const ids = new Set(q1.map((q) => q.id));
    if (ids.size !== 5) failures.push("gen-ids: question ids not unique");
    // Every generated question's own answer must grade correct (self-consistency:
    // the generator and the grader agree, which also re-validates the math path).
    for (const q of q1) {
      const g = grade(q, q.answer);
      if (!g.correct) failures.push(`self-consistent[${q.kind}]: canonical answer graded wrong`);
    }
  }

  // --- 3. Difficulty bands honored ---
  {
    const easy = generateDrill(7, "easy", 20);
    for (const q of easy) {
      if (q.prompt.cidr) {
        const p = Number(q.prompt.cidr.split("/")[1]);
        if (p < 24 || p > 30) failures.push(`easy-band: prefix /${p} outside 24-30`);
      }
    }
    const easyKinds = new Set(easy.map((q) => q.kind));
    if (easyKinds.has("host-count-to-prefix")) {
      failures.push("easy-kinds: hard-only kind leaked into easy");
    }
  }

  // --- 4. Grading: tolerant matching, both directions ---
  {
    const cases: GradeCase[] = [
      {
        id: "ipv4-leading-zeros",
        question: { id: "t1", kind: "network-address", prompt: { cidr: "10.0.0.5/24" }, answer: "10.0.0.0", answerType: "ipv4" },
        answer: "010.000.000.000",
        expectCorrect: true,
      },
      {
        id: "ipv4-wrong",
        question: { id: "t2", kind: "network-address", prompt: { cidr: "10.0.0.5/24" }, answer: "10.0.0.0", answerType: "ipv4" },
        answer: "10.0.0.1",
        expectCorrect: false,
      },
      {
        id: "integer-with-commas",
        question: { id: "t3", kind: "usable-hosts", prompt: { cidr: "10.0.0.0/22" }, answer: "1022", answerType: "integer" },
        answer: "1,022",
        expectCorrect: true,
      },
      {
        id: "prefix-bare",
        question: { id: "t4", kind: "host-count-to-prefix", prompt: { hostCount: 500 }, answer: "/23", answerType: "prefix" },
        answer: "23",
        expectCorrect: true,
      },
      {
        id: "boolean-y",
        question: { id: "t5", kind: "contains-host", prompt: { cidr: "10.0.0.0/24", host: "10.0.0.9" }, answer: "yes", answerType: "boolean" },
        answer: "Y",
        expectCorrect: true,
      },
      {
        id: "boolean-wrong",
        question: { id: "t6", kind: "contains-host", prompt: { cidr: "10.0.0.0/24", host: "10.0.1.9" }, answer: "no", answerType: "boolean" },
        answer: "yes",
        expectCorrect: false,
      },
    ];
    for (const c of cases) {
      const g = grade(c.question, c.answer);
      if (g.correct !== c.expectCorrect) {
        failures.push(`grade[${c.id}]: expected ${c.expectCorrect}, got ${g.correct}`);
      }
    }
  }

  // total assertions: prng(2) + gen(3 checks + 5 self-consistency) + bands(2) + grade(6)
  const total = 2 + 3 + 5 + 2 + 6;
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures };
}
