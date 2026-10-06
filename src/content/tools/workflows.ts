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

/** The five starter chains, in the order they are shown. */
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
] as const;

/** Every slug a workflow names, alternatives included, for the guard and the page. */
export function workflowSlugs(): string[] {
  const out = new Set<string>();
  for (const w of WORKFLOWS) for (const s of w.steps) { out.add(s.slug); for (const a of s.alternatives ?? []) out.add(a); }
  return [...out];
}
