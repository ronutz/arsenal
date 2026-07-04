// ============================================================================
// src/lib/tools/f5-awaf-signature-accuracy-risk/index.ts
// ----------------------------------------------------------------------------
// F5 AWAF - Advanced WAF SIGNATURE ACCURACY / RISK INTERPRETER. A {manifest,
// run, vectors} triple. Read an attack signature's published Accuracy and Risk
// (plus whether it applies to your systems and whether it is enforced) and it
// tells you how false-positive-prone it is, how damaging a real match would be,
// and the tuning move that follows from the accuracy x risk quadrant.
//
// Pure and deterministic (D-49): a model of F5's documented signature
// properties, never a probe. It never contacts a BIG-IP and never fetches, and
// it is not a per-signature-ID database - you read Accuracy and Risk from the
// signature's own properties in the policy.
// ============================================================================

import { interpretSignature } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { interpretSignature, DEFAULTS, LEVELS } from "./compute";
export type { Level, SystemRelevance, Enforcement, SigInput, FpLikelihood, Quadrant, SigNote, SigResult } from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "Security & WAF",
  toolSlug: "f5-awaf-signature-accuracy-risk",
  canonicalAliases: ["asm-signature-accuracy", "awaf-signature-risk", "signature-fp-proneness", "attack-signature-accuracy"],
  inputDetectors: [], // form-driven

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  shareSafetyDefault: "full",

  learnLinks: [
    "learn/awaf-false-positives",
    "learn/awaf-signature-staging-and-enforcement-readiness",
  ],
  sources: [
    { id: "f5-asm-signatures", label: "F5 BIG-IP ASM: Working with Attack Signatures (accuracy = false-positive susceptibility; risk = potential damage levels)", url: "https://techdocs.f5.com/kb/en-us/products/big-ip_asm/manuals/product/asm-implementations-11-6-0/41.html" },
    { id: "f5-asm-signature-sets", label: "F5 BIG-IP ASM: Assigning Attack Signatures to Security Policies (signature sets scoped by system; accuracy as a set filter criterion; disable a signature that is a false positive)", url: "https://techdocs.f5.com/en-us/bigip-14-1-0/big-ip-asm-implementations-14-1-0/assigning-attack-signatures-to-security-policies.html" },
    { id: "f5-k70544352", label: "F5 K70544352: Reducing false positive violations", url: "https://my.f5.com/manage/s/article/K70544352" },
  ],
});

export function run(input: string) {
  return interpretSignature(JSON.parse(input));
}

export const __selftest = verifyVectors;
