// ============================================================================
// src/lib/tools/cert-chain-builder/index.ts
// ----------------------------------------------------------------------------
// CERTIFICATE CHAIN BUILDER AND VALIDATOR: the self-describing
// {manifest, run, vectors} triple (D-49).
//
// Paste a leaf and its intermediates in any order (a root too, if you have
// it) and get the chain a TLS server should send: the end entity first, each
// issuer after the certificate it signed, the trust anchor optional (RFC 8446
// section 4.4.2). Each link is made by Authority Key Identifier to Subject
// Key Identifier where both exist and by name otherwise, and RFC 5280's
// structural rules are checked along the way: basicConstraints cA,
// keyCertSign, pathLenConstraint, validity at an instant, windows that do
// not cover each other, duplicates, extras, a missing issuer named. No
// signatures are verified here (the page offers that in the browser, as an
// extra, labelled), no trust store is consulted, nothing is fetched.
// Sources read 2026-10-04 (see compute.ts).
// ============================================================================

import { run as compute, SOURCES, MAX_CERTS, MAX_INPUT_CHARS, type ChainInput, type ChainResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, GOLDEN_VECTORS } from "./golden-vectors";

// The compute layer's public types and helpers.
export type { ChainInput, ChainResult, ChainCert, ChainLink, Finding, FindingCode, Severity, Verdict, LinkMatch, Source } from "./compute";
export { SOURCES, MAX_CERTS, MAX_INPUT_CHARS, toPem } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, GOLDEN_VECTORS, verifyVectors, pin } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "PKI",
  // The slug.
  toolSlug: "cert-chain-builder",
  // Other names it answers to.
  canonicalAliases: ["certificate-chain", "chain-builder", "chain-order", "intermediate-certificates", "fullchain"],
  // What pasted input it recognises: two or more PEM certificate blocks (the example is a valid API body shape).
  inputDetectors: [
    { kind: "regex", priority: 3, pattern: "-----BEGIN CERTIFICATE-----[\\s\\S]*-----END CERTIFICATE-----[\\s\\S]*-----BEGIN CERTIFICATE-----", example: "{\"text\":\"-----BEGIN CERTIFICATE-----\\n...\\n-----END CERTIFICATE-----\\n-----BEGIN CERTIFICATE-----\\n...\\n-----END CERTIFICATE-----\",\"now\":\"2026-10-04T12:00:00Z\"}" },
  ],
  // Runs in the browser.
  capabilityBadge: "browser",
  // Nothing leaves the page.
  executionClass: ["localOnly"],
  // The API runs this same code, structural result only.
  apiCapabilityClass: "local-equivalent",
  // The vector set.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile or oversized input is handled: the text is cut at MAX_INPUT_CHARS, at most
  // MAX_CERTS blocks are read, each by the x509 decoder's bounded DER parser; nothing is fetched,
  // not the CRL, OCSP or caIssuers URLs a certificate names.
  dangerousInputHandling: ["bounded-parse", "generated-code-only", "never-fetches"],
  // Certificates are public by nature, but a pasted chain can name an internal host: share by fragment.
  shareSafetyDefault: "fragment",
  // The Learn article written for it.
  learnLinks: ["learn/certificate-chains-order-anchors-and-what-breaks-them"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["x509", "csr-decoder", "cert-renewal-planner"],
  // Sources, each read live on its access date.
  sources: SOURCES.map((s) => ({ ...s, status: "active" as const })),
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: ChainInput): ChainResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = GOLDEN_VECTORS;
