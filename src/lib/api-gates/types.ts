// ============================================================================
// src/lib/api-gates/types.ts
// ----------------------------------------------------------------------------
// Model-agnostic authorization primitives for the tools API. A "gate" is a
// pluggable decision function evaluated server-side (in the Worker) before a
// tool runs. Nothing here assumes a particular auth method or commercial tier:
// concrete behavior lives in composable PROVIDERS (local/static, dynamic,
// federated, RBAC), and named POLICIES compose those providers. The API surface
// config (src/config/apiSurface.ts) only references a policy by an opaque id;
// this module turns that id into a decision.
//
// Web-standard only (no Node APIs), so the same code runs in the Cloudflare
// Worker runtime and anywhere else.
// ============================================================================

/** A resolved caller identity. Populated upstream (e.g. from a verified token). */
export interface GateIdentity {
  /** Stable subject id for the caller. */
  subject: string;
  /** Roles granted to the subject, consumed by the RBAC provider. */
  roles?: string[];
  /** Arbitrary verified claims, available to providers. */
  claims?: Record<string, unknown>;
}

/** Everything a provider may need to decide, assembled by the Worker per request. */
export interface GateContext {
  /** Tool slug being requested (matches the API path and config key). */
  tool: string;
  /** Feature being exercised (e.g. "endpoint"); kept as a string to avoid coupling. */
  feature: string;
  /** Bearer/api-key token extracted from the request, if any. */
  token?: string;
  /** Identity resolved from the token/session, if any (input to RBAC). */
  identity?: GateIdentity;
  /** Lower-cased request headers, for providers that need them. */
  headers: Record<string, string>;
  /** Caller IP, for rate/geo providers. */
  ip?: string;
}

/** The outcome of a gate evaluation. */
export interface GateDecision {
  /** Whether the request may proceed. */
  allow: boolean;
  /** Human-readable reason, surfaced in logs and (on deny) a response header. */
  reason: string;
  /** Suggested HTTP status on deny (401 unauthenticated, 403 forbidden, 429, etc.). */
  status?: number;
}

/** A single authorization check. Async to allow dynamic/federated lookups. */
export type GateProvider = (ctx: GateContext) => Promise<GateDecision> | GateDecision;

/** How a policy combines its providers. */
export type PolicyMode = "allOf" | "anyOf";

/** A named, composed authorization requirement. */
export interface GatePolicy {
  /** Opaque id referenced from the API surface config. */
  id: string;
  /** allOf = every provider must allow; anyOf = at least one must allow. */
  mode: PolicyMode;
  /** Providers evaluated per `mode`. An empty list means "no requirement" (open). */
  providers: GateProvider[];
  /** Optional human description. */
  description?: string;
}

/** A static token -> identity map: day-one RBAC input before any IdP is wired. */
export type IdentityMap = Record<string, GateIdentity>;
