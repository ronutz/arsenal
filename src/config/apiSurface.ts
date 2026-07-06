// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/config/apiSurface.ts
// ----------------------------------------------------------------------------
// SINGLE SOURCE OF TRUTH for whether, and under what authorization, each tool's
// HTTP API is SURFACED in the UI and (later) ENFORCED at the edge. Both the
// in-page "Also available as an API" affordance and the Worker's gate seam read
// their answers from the pure resolvers below, so the two can never disagree.
//
// TWO ORTHOGONAL AXES, resolved independently:
//
//   1. ENABLEMENT (is the API affordance shown / the endpoint advertised at all)
//      A strict, opt-in hierarchy, EVERYTHING OFF BY DEFAULT:
//        - global.enabled ............. hard master kill switch (default false)
//        - tools[slug].enabled ........ per-tool opt-in       (absent => false)
//        - tools[slug].features[f] .... granular per-feature  (absent => inherits
//                                       global.defaultFeatures[f], default false)
//      A feature is surfaced ONLY if all three levels resolve on. Because tools
//      defaults to {} and every default is false, nothing is surfaced until it is
//      deliberately switched on. Flipping global.enabled back to false hides the
//      entire API surface at once (kill switch), whatever the per-tool settings.
//
//   2. AUTHORIZATION GATE (what, if anything, guards an enabled feature)
//      Model-agnostic. A gate is referenced here only by an opaque POLICY ID; the
//      policy engine (src/lib/api-gates, built separately) resolves that id to a
//      decision function and may compose any providers (local/static token, a
//      dynamic KV or rate-limit or subscription lookup, a federated OIDC/SAML/JWT
//      check, or RBAC subject->roles->permissions), in all-of / any-of policies.
//      Nothing about tiers or specific auth methods is baked in here. Gate is
//      resolved MOST-SPECIFIC-WINS: feature gate, else tool gate, else global
//      gate. A gate of `null` means "open / no authorization" WHEN enabled.
//
// PRIVILEGED PREVIEW (authoring aid, render-only): passing { preview: true } to
// the resolvers forces enablement on so a privileged operator can see every
// affordance while everything is still globally OFF. This is a CLIENT-SIDE VIEW
// ONLY and is never consulted by the Worker; it reveals UI, it does not open the
// API. Real enablement and gating live in this config plus the edge, server-side.
//
// This module is inert until something imports it; it changes no behavior on its
// own. Turning the API surface on later is a config edit here, nothing more.
// ============================================================================

/** Granular, independently switchable parts of a tool's API affordance. */
export type ApiFeature =
  | "endpoint" // show the endpoint URL and a link to it
  | "curl" // show a copy-paste curl example
  | "docs" // show a deep-link into the /api reference for this tool
  | "tryIt"; // show an inline "run it" control that calls the live API

export const API_FEATURES: readonly ApiFeature[] = ["endpoint", "curl", "docs", "tryIt"];

/**
 * A reference to an authorization policy resolved by the gate engine, or `null`
 * for "open / no authorization". Never a concrete credential or method here.
 */
export type GatePolicyId = string | null;

/** Per-feature override. Any field left undefined inherits from the tool/global level. */
export interface FeatureConfig {
  /** undefined => inherit global.defaultFeatures[feature]. */
  enabled?: boolean;
  /** undefined => inherit tool gate, then global gate. */
  gate?: GatePolicyId;
}

/** Per-tool API configuration. */
export interface ToolApiConfig {
  /** Per-tool master. A tool is never surfaced while this is false. */
  enabled: boolean;
  /** Default gate for this tool's features. undefined => inherit global gate. */
  gate?: GatePolicyId;
  /** Granular per-feature overrides. Absent features inherit the global defaults. */
  features?: Partial<Record<ApiFeature, FeatureConfig>>;
}

/** Global API configuration and defaults. */
export interface GlobalApiConfig {
  /** Hard master switch. While false, no API affordance is surfaced anywhere. */
  enabled: boolean;
  /** Ultimate default gate. `null` = open when enabled. */
  gate: GatePolicyId;
  /** Default enablement for each feature when a tool does not specify it. */
  defaultFeatures: Record<ApiFeature, boolean>;
}

export interface ApiSurfaceConfig {
  global: GlobalApiConfig;
  /** Keyed by tool slug. Slugs absent here inherit the (off) global defaults. */
  tools: Record<string, ToolApiConfig>;
}

// ---------------------------------------------------------------------------
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  THE API PROCESSING SWITCH.  This is the ONE value to flip.              │
// │                                                                         │
// │      0  =  API processing OFF  (default). The API is documented but     │
// │            not served: endpoints return 404, and every API pill/badge   │
// │            in the UI shows the neutral "documented, not served" state.  │
// │                                                                         │
// │      1  =  LOCAL API processing ON. The same-origin Worker serves the   │
// │            API using the in-house engines, and every API pill/badge     │
// │            turns green ("served locally").                              │
// │                                                                         │
// │  Flip this to 1 (and deploy) to turn the API on; flip back to 0 to turn │
// │  it off. Both the Worker (serving) and the UI (pills + wording) read    │
// │  this one value, so they can never disagree.                            │
// └─────────────────────────────────────────────────────────────────────────┘
/**
 * THE API PROCESSING SWITCH (see the box above). Declared as `number` so the
 * value is a genuine runtime switch: editing it to 1 is meaningful to every
 * reader below. 0 = off (default), 1 = local processing on.
 */
export const API_PROCESSING: number = 0;

/** True when local API processing is switched on (API_PROCESSING === 1). */
export function isApiProcessingEnabled(): boolean {
  return API_PROCESSING === 1;
}

// ---------------------------------------------------------------------------
// THE CONFIG. `global.enabled` is driven by the single API_PROCESSING switch
// above. The per-tool / per-feature hierarchy below still applies WHEN
// processing is on: a feature is surfaced only if global + tool + feature all
// resolve on. To go live: set API_PROCESSING = 1, add a tools[slug] entry with
// enabled: true, turn on the features you want, and assign gate policy ids where
// access should be guarded.
// ---------------------------------------------------------------------------
export const API_SURFACE: ApiSurfaceConfig = {
  global: {
    enabled: API_PROCESSING === 1,
    gate: null,
    defaultFeatures: { endpoint: false, curl: false, docs: false, tryIt: false },
  },
  tools: {},
};

// ---------------------------------------------------------------------------
// PURE RESOLVERS. No I/O, no state; safe to call from a client component and
// from the Worker alike. The Worker MUST ignore `preview`.
// ---------------------------------------------------------------------------

export interface ResolveOptions {
  /** Render-only privileged preview: forces enablement on. Client UI only. */
  preview?: boolean;
}

/** Is a tool's API considered enabled at all (any feature possible)? */
export function isToolApiEnabled(
  cfg: ApiSurfaceConfig,
  slug: string,
  opts: ResolveOptions = {},
): boolean {
  if (opts.preview) return true;
  return cfg.global.enabled && cfg.tools[slug]?.enabled === true;
}

/** Is a specific feature of a tool surfaced (all three levels resolve on)? */
export function isApiFeatureSurfaced(
  cfg: ApiSurfaceConfig,
  slug: string,
  feature: ApiFeature,
  opts: ResolveOptions = {},
): boolean {
  if (opts.preview) return true;
  if (!cfg.global.enabled) return false;
  const tool = cfg.tools[slug];
  if (!tool?.enabled) return false;
  const f = tool.features?.[feature];
  if (f && typeof f.enabled === "boolean") return f.enabled;
  return cfg.global.defaultFeatures[feature] ?? false;
}

/**
 * The authorization policy guarding a feature, most-specific-wins. `null` means
 * open (no authorization) when the feature is enabled. This is independent of
 * enablement: a disabled feature still has a resolvable (but unused) gate.
 */
export function gateForApiFeature(
  cfg: ApiSurfaceConfig,
  slug: string,
  feature: ApiFeature,
): GatePolicyId {
  const tool = cfg.tools[slug];
  const f = tool?.features?.[feature];
  if (f && f.gate !== undefined) return f.gate;
  if (tool && tool.gate !== undefined) return tool.gate;
  return cfg.global.gate;
}

/** Convenience: the set of currently surfaced features for a tool. */
export function surfacedFeatures(
  cfg: ApiSurfaceConfig,
  slug: string,
  opts: ResolveOptions = {},
): ApiFeature[] {
  return API_FEATURES.filter((f) => isApiFeatureSurfaced(cfg, slug, f, opts));
}
