// ============================================================================
// src/lib/tools/f5-awaf-signature-accuracy-risk/compute.ts
// ----------------------------------------------------------------------------
// F5 AWAF - Advanced WAF (formerly BIG-IP ASM - Application Security Manager)
// SIGNATURE ACCURACY / RISK INTERPRETER (arsenal-local, pure, deterministic).
//
// Reframed from a per-signature-ID lookup, which is neither feasible nor honest
// (F5's signature set is proprietary and enormous). Instead this reads the two
// properties F5 publishes for every attack signature - its ACCURACY and its
// RISK - plus whether it even applies to your systems, and tells you how
// false-positive-prone it is, how much damage a real match would do, and the
// tuning move that follows.
//
// THE MODEL (F5-documented, not invented):
//   - ACCURACY is defined as the signature's susceptibility to false positives.
//     "Higher accuracy results in fewer false positives." Low accuracy = a HIGH
//     likelihood of false positives; Medium = SOME likelihood; High = a LOW
//     likelihood. (F5 "Working with Attack Signatures"; signature-set reference.)
//   - RISK is the potential damage if the attack succeeds. Low = reconnaissance,
//     no direct damage; Medium = may reveal sensitive data or moderate damage;
//     High = full system compromise, denial of service, and the like.
//   - SYSTEMS: a signature applies to specific systems (Windows, SQL, IIS,
//     Apache, ...). A signature for a system your application does not run is
//     pure noise and a false-positive source; scope the signature set to your
//     actual systems rather than disabling one at a time.
//   - Accuracy is also a signature-set filter criterion, so a set weighted
//     toward higher-accuracy signatures produces fewer false positives.
//   - THE DISCIPLINE: do not disable a high-risk signature just because it is
//     false-positive-prone; a real match of a damaging attack must not be waved
//     through. Check the actual request first.
//
// Pure and deterministic (D-49): a model of documented behaviour, never a
// probe. It never contacts a BIG-IP and never fetches.
//
// Sources (see index.ts): F5 BIG-IP ASM "Working with Attack Signatures"
// (accuracy = false-positive susceptibility; risk = damage levels) and
// "Assigning Attack Signatures to Security Policies" (signature sets scoped by
// system; accuracy as a set filter criterion); K70544352.
// ============================================================================

export type Level = "low" | "medium" | "high";
export type SystemRelevance = "in-stack" | "not-in-stack" | "unknown";
export type Enforcement = "enforced-blocking" | "staged" | "transparent";

export interface SigInput {
  accuracy: Level;
  risk: Level;
  systemRelevance: SystemRelevance;
  enforcement: Enforcement;
}

/** False-positive likelihood, derived directly from accuracy (F5's mapping). */
export type FpLikelihood = "high" | "some" | "low";
/** The 2x2 of false-positive-proneness x stakes. */
export type Quadrant =
  | "fp-prone-low-stakes"
  | "fp-prone-dangerous"
  | "reliable-high-stakes"
  | "reliable-low-stakes";

export type SigNote =
  | { kind: "accuracy-fp"; accuracy: Level }
  | { kind: "system-not-in-stack" }
  | { kind: "system-unknown" }
  | { kind: "staged-not-blocking" }
  | { kind: "transparent-not-blocking" }
  | { kind: "high-accuracy-lever" }
  | { kind: "discipline-high-risk" }
  | { kind: "scope-it" };

export interface SigResult {
  readonly fpLikelihood: FpLikelihood; // from accuracy
  readonly impactIfReal: Level; // = risk
  readonly quadrant: Quadrant;
  readonly blocksNow: boolean;
  readonly notes: readonly SigNote[];
}

// Accuracy -> false-positive likelihood (F5's exact mapping).
function fpFromAccuracy(a: Level): FpLikelihood {
  if (a === "low") return "high";
  if (a === "medium") return "some";
  return "low"; // high accuracy -> low FP likelihood
}

export function interpretSignature(input: SigInput): SigResult {
  const fpLikelihood = fpFromAccuracy(input.accuracy);

  // FP-prone if not high-accuracy; high-stakes if risk is medium or high.
  const fpProne = input.accuracy !== "high";
  const highStakes = input.risk !== "low";

  let quadrant: Quadrant;
  if (fpProne && highStakes) quadrant = "fp-prone-dangerous";
  else if (fpProne && !highStakes) quadrant = "fp-prone-low-stakes";
  else if (!fpProne && highStakes) quadrant = "reliable-high-stakes";
  else quadrant = "reliable-low-stakes";

  const blocksNow = input.enforcement === "enforced-blocking";

  const notes: SigNote[] = [];
  notes.push({ kind: "accuracy-fp", accuracy: input.accuracy });

  if (input.systemRelevance === "not-in-stack") notes.push({ kind: "system-not-in-stack" });
  if (input.systemRelevance === "unknown") notes.push({ kind: "system-unknown" });

  if (input.enforcement === "staged") notes.push({ kind: "staged-not-blocking" });
  if (input.enforcement === "transparent") notes.push({ kind: "transparent-not-blocking" });

  // If false positives are frequent (low/medium accuracy), surface the lever.
  if (fpProne) notes.push({ kind: "high-accuracy-lever" });

  // If damaging, restate the discipline against blind disabling.
  if (highStakes) notes.push({ kind: "discipline-high-risk" });

  notes.push({ kind: "scope-it" });

  return { fpLikelihood, impactIfReal: input.risk, quadrant, blocksNow, notes };
}

export const DEFAULTS: SigInput = Object.freeze({
  accuracy: "low",
  risk: "low",
  systemRelevance: "unknown",
  enforcement: "enforced-blocking",
});

export const LEVELS: readonly Level[] = Object.freeze(["low", "medium", "high"]);
