// ============================================================================
// src/content/tools/workflows.ts
// ----------------------------------------------------------------------------
// WORKFLOWS: TOOL CHAINS THAT FOLLOW ONE ARTEFACT (E4 of Round 1, SCOUT;
// adopted 2026-10-06 as the minimal first set).
//
// A workflow is an ordered list of tools through which one piece of input
// travels: the thing a reader is holding (a CIDR, a token, a certificate, a
// log line, an HTTP message) goes into the first tool, and what that tool
// shows is the input to the next. SCOUT asked for a full registry; PRIME's
// reprioritised plan (PLAN-round1-reprioritised-by-cost-20261005, step 3) took
// the honest smaller shape: five chains, started here, growing by data. Each
// step names its tool by slug; a step may offer ALTERNATIVES where the chain
// forks by vendor (the firewall step), listed and never chosen for the reader.
//
// GROWN 2026-10-27 (cross-reference sweep): five more chains where the day's
// tools hand over to each other, the s_client explainer to the chain builder,
// the regex flavour view to the engine that runs the pattern, the XML
// formatter to the decoder, the Expect builder to the explainer, and a
// vendor's config explainer to code to image. The hub's lede no longer counts
// the chains, so it stays true as the list grows.
//
// COPY LIVES IN MESSAGES (tools.hub.workflows.<id>.title and .lede, both
// authored locales), so this file carries structure only. The /tools page
// resolves every slug against the registry and the locale's names, and the
// guard scripts/check-tools-registry.mjs is the arbiter of what exists; a
// workflow naming a slug that is not built fails the build (see the check at
// the bottom of this file, run by the page at render time as well).
// ============================================================================

/** One step: the tool, and the vendor-specific alternatives where the chain forks. */
export interface WorkflowStep {
  slug: string;
  alternatives?: string[];
}

/** One chain, by id; its title and lede are messages. */
export interface Workflow {
  id: string;
  steps: WorkflowStep[];
}

/** The chains, in the order they are shown: the five starters, then those added as tools arrived. */
export const WORKFLOWS: readonly Workflow[] = [
  // A network range becomes a rule: the arithmetic first, then the vendor's own order of evaluation.
  {
    id: "cidr-to-rule",
    steps: [
      { slug: "cidr" },
      { slug: "ipv6" },
      { slug: "fortigate-policy-match-order", alternatives: ["panos-policy-evaluation-order", "zscaler-firewall-rule-order-simulator", "checkpoint-policy-layer-evaluator"] },
    ],
  },
  // A token becomes its claims, and the claims point back at the flow and the protocol that minted them.
  {
    id: "jwt-to-policy",
    steps: [{ slug: "jwt" }, { slug: "hmac" }, { slug: "oidc" }, { slug: "oauth-flow-chooser" }],
  },
  // A certificate becomes a chain, and the chain becomes the headers a browser will enforce.
  {
    id: "cert-to-csp",
    steps: [{ slug: "x509" }, { slug: "cert-chain-builder" }, { slug: "secure-headers" }, { slug: "csp-evaluator" }],
  },
  // A syslog line becomes its PRI, and the PRI becomes a level every other system can name.
  {
    id: "syslog-to-level",
    steps: [{ slug: "syslog-message-parser" }, { slug: "syslog-pri-decoder" }, { slug: "log-level-mapper" }],
  },
  // An HTTP message becomes its status, its headers, and the curl command that reproduces it.
  {
    id: "http-to-headers",
    steps: [{ slug: "http-message-decoder" }, { slug: "http-status-code-explainer" }, { slug: "secure-headers" }, { slug: "curl-command-builder" }],
  },
  // An s_client run becomes the certificates it showed, in order, then the leaf's fields and its renewal date.
  {
    id: "s-client-to-chain",
    steps: [{ slug: "openssl-s-client-explainer" }, { slug: "cert-chain-builder" }, { slug: "x509" }, { slug: "cert-renewal-planner" }],
  },
  // A pattern becomes its flavour differences, then its behaviour where it runs: an NGINX location or an iRule.
  {
    id: "regex-to-engine",
    steps: [
      { slug: "regex" },
      { slug: "nginx-location-matcher", alternatives: ["f5-irules-performance-linter"] },
    ],
  },
  // An XML document becomes well-formed and tidy, then a tree whose DOCTYPE and entities are read for risk.
  {
    id: "xml-to-structure",
    steps: [{ slug: "xml-formatter" }, { slug: "xml-decoder" }],
  },
  // A device login becomes an Expect script, and the script is read command by command before it runs.
  {
    id: "expect-build-to-read",
    steps: [{ slug: "expect-script-builder" }, { slug: "expect-script-explainer" }],
  },
  // A config snippet is read in its vendor's explainer, then drawn for a slide or a ticket with its secrets masked.
  {
    id: "config-to-picture",
    steps: [
      { slug: "f5-tmsh-config-explainer", alternatives: ["fortios-cli-config-explainer"] },
      { slug: "code-to-image" },
    ],
  },
] as const;

/** Every slug a workflow names, alternatives included, for the guard and the page. */
export function workflowSlugs(): string[] {
  const out = new Set<string>();
  for (const w of WORKFLOWS) for (const s of w.steps) { out.add(s.slug); for (const a of s.alternatives ?? []) out.add(a); }
  return [...out];
}
