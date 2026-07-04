// ============================================================================
// src/lib/tools/f5-awaf-false-positive-triage/compute.ts
// ----------------------------------------------------------------------------
// F5 AWAF - Advanced WAF (formerly BIG-IP ASM - Application Security Manager)
// FALSE-POSITIVE TRIAGE (arsenal-local, pure, deterministic). The flip side of
// the poisoning estimator: that tool warns against over-relaxing a policy;
// this one helps you relax a GENUINE false positive correctly, with scope, and
// stop before relaxing something that is actually an attack.
//
// THE MODEL (F5-documented, not invented):
//   - The VIOLATION RATING drives the verdict. Advanced WAF blocks requests
//     rated 4 or 5 even when every detected violation has its Block flag off,
//     because a 4-5 rating is most likely a real attack; the guidance is to
//     CLEAR the suggestion without changing the policy. Ratings 1-3 are not
//     blocked by default (to reduce false positives). A rating of 3 must be
//     reviewed. Low-rated requests confirmed as false positives can be accepted
//     into the policy.
//   - REMEDIATION IS SCOPED. The correct fix for a real false positive depends
//     on the violation and is always scoped to the specific URL or parameter,
//     never a policy-wide disable: add an allowed entity, add a meta-character
//     to that entity's set, attach an XML/JSON profile, mark a file-upload
//     parameter, disable a signature on that one URL/parameter, or enable
//     Potential False Positive Detection.
//   - STAGING and TRANSPARENT mode change whether anything is blocking. A
//     signature in staging logs but does not block; a policy in Transparent
//     mode blocks nothing at all. In both cases the "false positive" is a
//     learning signal, not a block, and the fix matters for when enforcement
//     is turned on.
//   - THE DISCIPLINE: relax the policy only where a false positive occurred,
//     never where a real attack caused the violation.
//
// Pure and deterministic (D-49): a model of documented behaviour, never a
// probe. It never contacts a BIG-IP and never fetches.
//
// Sources (see index.ts): K70544352 "Reducing false positive violations";
// BIG-IP ASM/Advanced WAF "Working with Violations" (rating -> block/behaviour;
// unlearnable rating-5 set); "Refining Security Policies with Learning"
// (accept vs clear by rating; relax only genuine false positives).
// ============================================================================

/** Broad violation categories, grouped by the remediation they take. */
export type ViolationCategory =
  | "attack-signature"
  | "meta-char"
  | "parameter"
  | "url"
  | "file-type"
  | "length"
  | "file-upload-signature"
  | "xml-json-signature"
  | "cookie"
  | "http-compliance";

export type ViolationRating = 1 | 2 | 3 | 4 | 5;

/** Whether the offending check is actually blocking right now. */
export type EnforcementState =
  | "enforced-blocking" // policy in Blocking mode, signature/violation enforced
  | "staged" // the signature/entity is in staging: logs, does not block
  | "transparent"; // policy in Transparent mode: blocks nothing

export interface FpInput {
  category: ViolationCategory;
  violationRating: ViolationRating;
  enforcementState: EnforcementState;
}

export type Triage = "likely-fp" | "investigate" | "likely-attack";

export type FpNote =
  | { kind: "rating-blocks" } // 4-5 blocks even with Block off
  | { kind: "staged-not-blocking" }
  | { kind: "transparent-not-blocking" }
  | { kind: "discipline" }
  | { kind: "scope-it" }
  | { kind: "potential-fp-detection" }
  | { kind: "unlearnable-maybe" }; // some rating-5 violations are unlearnable

export interface FpResult {
  readonly triage: Triage;
  /** Whether this violation is blocking traffic right now. */
  readonly blocksNow: boolean;
  /** The scoped remediation option keys for this category. */
  readonly remediations: readonly string[];
  /** Whether accepting/relaxing is advisable given the rating. */
  readonly action: "accept-if-confirmed" | "investigate-first" | "clear-do-not-relax";
  readonly notes: readonly FpNote[];
}

// Category -> scoped remediation option keys (localized in the UI). Ordered
// best-first. All are scoped to a URL/parameter, never policy-wide.
const REMEDIATION: Record<ViolationCategory, string[]> = {
  "attack-signature": ["disableSignatureScoped", "allowEntityBypass", "potentialFpDetection", "stageSignature"],
  "meta-char": ["allowMetaChar"],
  parameter: ["addAllowedParameter"],
  url: ["addAllowedUrl"],
  "file-type": ["addAllowedFileType"],
  length: ["raiseLength"],
  "file-upload-signature": ["markFileUploadParam", "disableSignatureScoped"],
  "xml-json-signature": ["attachContentProfile", "disableSignatureScoped"],
  cookie: ["allowCookieNotEnforced", "investigateCookie"],
  "http-compliance": ["adjustHttpComplianceSubcheck", "urlOverride"],
};

function triageFromRating(r: ViolationRating): Triage {
  if (r >= 4) return "likely-attack";
  if (r === 3) return "investigate";
  return "likely-fp"; // 1-2
}

/** Pure, deterministic triage. */
export function triageFalsePositive(input: FpInput): FpResult {
  const triage = triageFromRating(input.violationRating);

  // Is it blocking right now? Only when enforced+blocking AND rated 4-5.
  const enforcedBlocking = input.enforcementState === "enforced-blocking";
  const blocksNow = enforcedBlocking && input.violationRating >= 4;

  const notes: FpNote[] = [];

  // Rating-driven action + note.
  let action: FpResult["action"];
  if (triage === "likely-attack") {
    action = "clear-do-not-relax";
    notes.push({ kind: "rating-blocks" });
    notes.push({ kind: "unlearnable-maybe" });
  } else if (triage === "investigate") {
    action = "investigate-first";
  } else {
    action = "accept-if-confirmed";
  }

  // Enforcement-state notes.
  if (input.enforcementState === "staged") notes.push({ kind: "staged-not-blocking" });
  if (input.enforcementState === "transparent") notes.push({ kind: "transparent-not-blocking" });

  // Signature-specific automated option.
  if (input.category === "attack-signature") notes.push({ kind: "potential-fp-detection" });

  // Always: scope it, and the discipline.
  notes.push({ kind: "scope-it" });
  notes.push({ kind: "discipline" });

  return {
    triage,
    blocksNow,
    remediations: REMEDIATION[input.category],
    action,
    notes,
  };
}

export const DEFAULTS: FpInput = Object.freeze({
  category: "attack-signature",
  violationRating: 2,
  enforcementState: "enforced-blocking",
});

export const CATEGORIES: readonly ViolationCategory[] = Object.freeze([
  "attack-signature", "meta-char", "parameter", "url", "file-type", "length", "file-upload-signature", "xml-json-signature", "cookie", "http-compliance",
]);
