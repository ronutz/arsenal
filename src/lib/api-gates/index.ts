// ============================================================================
// src/lib/api-gates/index.ts
// ----------------------------------------------------------------------------
// Public entry point for the gate engine. The Worker calls evaluateGate() with
// the policy id resolved from the API surface config and a request context; it
// gets back an allow/deny decision.
//
// Enablement vs authorization: the API's AVAILABILITY is governed by the tool
// registry (every built tool is API-exposed, per D-72), NOT by this engine. This
// engine only applies OPTIONAL authorization on top. With the registry below
// empty and every tool's gate id currently null, evaluateGate returns "open" for
// everything, so wiring this into the Worker changes nothing until a policy is
// both defined here AND assigned to a tool/feature in the surface config.
// ============================================================================

import type { GateContext, GateDecision, GatePolicy } from "./types";

// Re-export the primitives and providers for convenient single-import use.
export * from "./types";
export * from "./providers";

/**
 * Evaluate one policy against a context.
 *   allOf  -> every provider must allow; the first deny is returned verbatim.
 *   anyOf  -> the first allow wins; otherwise the last deny is returned.
 * An empty provider list is treated as "no requirement" (open).
 */
export async function composePolicy(
  policy: GatePolicy,
  ctx: GateContext,
): Promise<GateDecision> {
  if (policy.providers.length === 0) {
    return { allow: true, reason: "empty policy" };
  }
  if (policy.mode === "allOf") {
    for (const provider of policy.providers) {
      const decision = await provider(ctx);
      if (!decision.allow) return decision; // first deny wins, with its status
    }
    return { allow: true, reason: "all requirements met" };
  }
  // anyOf
  let lastDeny: GateDecision = { allow: false, reason: "no requirement met", status: 403 };
  for (const provider of policy.providers) {
    const decision = await provider(ctx);
    if (decision.allow) return decision;
    lastDeny = decision;
  }
  return lastDeny;
}

/**
 * THE POLICY REGISTRY. Maps an opaque policy id to its composed requirement.
 * Empty by default: no policies are defined, so the only well-formed gate is the
 * null (open) gate. Add entries here (composing providers from ./providers) to
 * introduce real authorization, then reference the id from the surface config.
 *
 * Example (illustrative only; not active):
 *   import { localStaticProvider, rbacProvider } from "./providers";
 *   export const POLICIES = {
 *     "beta-key": { id: "beta-key", mode: "allOf",
 *       providers: [localStaticProvider({ tokens: [ ... ] })] },
 *     "staff": { id: "staff", mode: "allOf",
 *       providers: [rbacProvider({ anyOf: ["staff", "admin"] })] },
 *   } satisfies Record<string, GatePolicy>;
 */
export const POLICIES: Record<string, GatePolicy> = {};

/**
 * Resolve and evaluate the gate for a given policy id. A null id means the gate
 * is open (no authorization). An id with no matching policy FAILS CLOSED, so a
 * typo or a missing definition denies rather than silently allowing.
 */
export async function evaluateGate(
  policyId: string | null,
  ctx: GateContext,
): Promise<GateDecision> {
  if (policyId == null) return { allow: true, reason: "open" };
  const policy = POLICIES[policyId];
  if (!policy) {
    return { allow: false, reason: `unknown gate policy: ${policyId}`, status: 403 };
  }
  return composePolicy(policy, ctx);
}
