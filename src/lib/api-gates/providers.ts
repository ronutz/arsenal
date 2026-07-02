// ============================================================================
// src/lib/api-gates/providers.ts
// ----------------------------------------------------------------------------
// Provider factories. Each returns a GateProvider (a decision function) bound to
// its configuration. Policies (see index.ts) compose these with allOf / anyOf.
//
// Design stance:
//   - local-static and RBAC are real and usable day-one.
//   - dynamic and federated are interface-conforming placeholders that FAIL
//     CLOSED (deny) until implemented, so referencing an unimplemented provider
//     never silently grants access.
//   - Authentication (resolving an identity from a token) is kept separate from
//     authorization (the providers below). The Worker resolves identity, then
//     the RBAC provider checks it. This keeps every provider a pure check over a
//     single, already-assembled context.
// ============================================================================

import type {
  GateContext,
  GateDecision,
  GateProvider,
  GateIdentity,
  IdentityMap,
} from "./types";

const deny = (reason: string, status = 403): GateDecision => ({ allow: false, reason, status });
const allow = (reason = "ok"): GateDecision => ({ allow: true, reason });

/**
 * Length-checked, difference-accumulating string compare. Not a cryptographic
 * guarantee, but avoids the most trivial early-exit timing signal, using only
 * web-standard APIs (safe in the Worker runtime).
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * LOCAL / STATIC. Allows the request if the presented token matches one of the
 * tokens configured in-process. Usable day-one for a closed beta or internal key.
 */
export function localStaticProvider(config: { tokens: string[] }): GateProvider {
  return (ctx: GateContext) => {
    if (!ctx.token) return deny("missing token", 401);
    const ok = config.tokens.some((t) => safeEqual(ctx.token as string, t));
    return ok ? allow("token accepted") : deny("invalid token", 401);
  };
}

/**
 * RBAC. Allows if the resolved identity's roles satisfy the requirement. Requires
 * ctx.identity to be populated (by the Worker, e.g. via resolveIdentity or, later,
 * a federated provider). Shapes exist now so policies can be written before any
 * IdP is connected.
 */
export function rbacProvider(config: { anyOf?: string[]; allOf?: string[] }): GateProvider {
  return (ctx: GateContext) => {
    const id = ctx.identity;
    if (!id) return deny("unauthenticated", 401);
    const roles = new Set(id.roles ?? []);
    if (config.allOf && !config.allOf.every((r) => roles.has(r))) {
      return deny("missing a required role", 403);
    }
    if (config.anyOf && !config.anyOf.some((r) => roles.has(r))) {
      return deny("missing an allowed role", 403);
    }
    return allow("role requirement satisfied");
  };
}

/**
 * DYNAMIC (placeholder). Runtime lookups such as a KV quota, an edge rate limit,
 * or a subscription check will live here. Fails closed until implemented.
 */
export function dynamicProvider(_config: Record<string, unknown> = {}): GateProvider {
  return () => deny("dynamic provider not implemented", 501);
}

/**
 * FEDERATED (placeholder). External IdP verification (OIDC / SAML / JWT) will
 * live here and, once real, would also populate ctx.identity for RBAC. Fails
 * closed until implemented.
 */
export function federatedProvider(_config: Record<string, unknown> = {}): GateProvider {
  return () => deny("federated provider not implemented", 501);
}

/**
 * Resolve a caller identity from a token via a static map. Day-one input for the
 * RBAC provider before a real IdP is wired. Returns undefined when there is no
 * token or no mapping.
 */
export function resolveIdentity(
  token: string | undefined,
  map: IdentityMap,
): GateIdentity | undefined {
  if (!token) return undefined;
  return map[token];
}
