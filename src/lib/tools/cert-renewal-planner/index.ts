// ============================================================================
// src/lib/tools/cert-renewal-planner/index.ts
// ----------------------------------------------------------------------------
// Public surface of the certificate renewal planner. Pure and deterministic;
// written so the folder could be lifted into an open library later.
// ============================================================================

export {
  analyzeRenewal,
  run,
  RenewalInputError,
} from "./compute";
export type {
  RenewalAnalysis,
  Sc081Phase,
  PhaseProjection,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  GOLDEN_VECTORS,
  verifyVectors,
} from "./golden-vectors";
export type { RenewalVector, VerifyReport } from "./golden-vectors";

/** Tool manifest. `sources` are surfaced on the tool page as reference links. */
export const manifest = Object.freeze({
  toolSlug: "cert-renewal-planner",
  learnLinks: [
    "learn/tls-certificate-lifetimes",
    "learn/certificate-validity-windows",
    "learn/dcv-and-sii-reuse",
    "learn/renewing-before-expiry",
    "learn/public-vs-private-pki",
  ],
  sources: [
    {
      id: "cabf-sc081v3",
      label: "CA/Browser Forum — Ballot SC-081v3 (schedule of reducing validity and data reuse periods)",
      type: "spec",
      url: "https://cabforum.org/",
      access_date: "2026-06-29",
      scope: "the 398 → 200 → 100 → 47-day TLS validity schedule and the DCV/SII reuse reductions (2026-2029)",
      status: "active",
    },
    {
      id: "rfc5280",
      label: "RFC 5280 — Internet X.509 PKI Certificate and CRL Profile",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc5280",
      access_date: "2026-06-29",
      scope: "certificate validity period semantics (notBefore / notAfter)",
      status: "active",
    },
    {
      id: "rfc8555",
      label: "RFC 8555 — Automatic Certificate Management Environment (ACME)",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc8555",
      access_date: "2026-06-29",
      scope: "the automated issuance/renewal that shortened lifetimes make necessary",
      status: "active",
    },
  ],
});
