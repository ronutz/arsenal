// ============================================================================
// src/lib/tools/csp-evaluator/index.ts
// ----------------------------------------------------------------------------
// THE CSP EVALUATOR: the self-describing {manifest, run, vectors} triple.
//
// A Content-Security-Policy in (header value, header line, Report-Only
// header, meta element, or several); out comes each policy parsed as CSP
// Level 3 parses it, every directive and source expression classified by the
// grammar, the effective list per destination through the fallback chain, and
// graded findings that quote the specification. Decode and grade only,
// offline; local and deterministic.
// ============================================================================

import { run as compute, type CspInput, type CspResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types and constants.
export type { CspInput, CspResult, PolicyReport, DirectiveRow, SourceRow, EffectiveRow, Finding, Delivery, SourceKind, DirectiveStatus, DirectiveCategory } from "./compute";
export { POLICY_MAX_CHARS, DIRECTIVES, KEYWORDS, FALLBACK, FETCH_DIRECTIVES, SANDBOX_KEYWORDS, RULES, readSource, splitPolicies, parsePolicy, evaluatePolicy } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "Security & WAF",
  // The slug.
  toolSlug: "csp-evaluator",
  // Other names it answers to.
  canonicalAliases: ["csp", "content-security-policy", "csp-checker", "csp-analyzer", "csp-analyser"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 3, pattern: "(?:^|[\\s;])(?:default-src|script-src|style-src|object-src|base-uri|frame-ancestors|img-src|connect-src)\\b|Content-Security-Policy", example: "{\"policy\":\"script-src 'strict-dynamic' 'nonce-DhcnhD3khTMePgXwdayK9BsMqXjhguVV'; object-src 'none'; base-uri 'self'\"}" },
  ],
  // Runs in the browser.
  capabilityBadge: "browser",
  // Nothing leaves the page.
  executionClass: ["localOnly"],
  // Where an API exists for it, it runs this same code.
  apiCapabilityClass: "local-equivalent",
  // The vector set.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile or oversized input is handled: bounded text, parsed by grammar, nothing fetched or evaluated.
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  // The default for share links: a policy is public by nature, but a nonce in it belongs to one response.
  shareSafetyDefault: "review",
  // The Learn articles written for it.
  learnLinks: ["learn/content-security-policy-read-by-the-specification"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["secure-headers", "html-structure-explainer", "http-message-decoder", "url-inspector"],
  // Sources, each read live on its access date.
  sources: [
    // CSP3: the grammar, the parsing algorithm, the directives, the matching algorithms, the guidance.
    { id: "csp3", label: "Content Security Policy Level 3, W3C Working Draft 16 September 2026", type: "standard", url: "https://www.w3.org/TR/CSP3/", access_date: "2026-10-05", scope: "2.2.1 parse a serialized CSP (semicolons, lower-cased names, duplicates ignored); 2.3 and 2.3.1 directive and source-list grammar; 3.1 to 3.3 the two headers and the meta element; 6.1 to 6.5 the directives; 6.7 matching (the wildcard, scheme upgrades, host-part matching, 'unsafe-inline' overridden by nonces and hashes); 6.8.3 the fallback list; 7.1 nonce reuse; 8.1 multiple policies; 8.2 'strict-dynamic'; 8.3 'unsafe-hashes'; 8.5 Strict CSP", status: "active" },
    // Mixed Content: block-all-mixed-content obsolete.
    { id: "mixed-content", label: "Mixed Content, W3C Candidate Recommendation Draft 23 February 2023: 6.1 Strict Mixed Content Checking", type: "standard", url: "https://www.w3.org/TR/mixed-content/#strict-checking", access_date: "2026-10-05", scope: "block-all-mixed-content is obsolete; upgrade-insecure-requests is not", status: "active" },
    // Upgrade Insecure Requests: the directive.
    { id: "upgrade-insecure-requests", label: "Upgrade Insecure Requests, W3C Candidate Recommendation 8 October 2015", type: "standard", url: "https://www.w3.org/TR/upgrade-insecure-requests/", access_date: "2026-10-05", scope: "the upgrade-insecure-requests directive takes no value", status: "active" },
    // Trusted Types: the two directives.
    { id: "trusted-types", label: "Trusted Types, W3C Working Draft 23 June 2026: 4.2 Integration with Content Security Policy", type: "standard", url: "https://www.w3.org/TR/trusted-types/", access_date: "2026-10-05", scope: "require-trusted-types-for 'script'; trusted-types policy names, *, 'allow-duplicates', 'none'", status: "active" },
    // The model of checks.
    { id: "csp-evaluator", label: "Google csp-evaluator (Apache-2.0): the set of security, strict-CSP and parser checks that this tool re-implements from the specification's sentences", type: "implementation", url: "https://github.com/google/csp-evaluator", access_date: "2026-10-05", scope: "unsafe-inline, unsafe-eval, plain schemes, wildcards, missing object-src / script-src / base-uri, allowlist bypass, IP sources, deprecated directives, nonce length, http sources, reporting; strict-dynamic checks; unknown directive, missing semicolon, invalid keyword", status: "active" },
  ],
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: CspInput): CspResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
