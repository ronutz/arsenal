// ============================================================================
// src/lib/tools/f5-awaf-evasion-explainer/compute.ts
// ----------------------------------------------------------------------------
// F5 ADVANCED WAF EVASION-TECHNIQUE EXPLAINER — the decode side of "evasion
// technique detected" (VIOL_EVASION). Two modes, one deterministic engine:
//
//   1. REFERENCE — type a sub-violation name (or "evasions") and get F5's own
//      eight evasion sub-violations explained: what each normalizes or detects,
//      its default state, and the encoding trick an attacker uses it to catch.
//
//   2. POLICY — paste the `evasions` block of a BIG-IP Advanced WAF declarative
//      security policy (or a whole policy) and get each sub-violation read back
//      as enabled or disabled, with the Multiple-decoding pass count surfaced
//      and bounds-checked against the schema.
//
// GROUNDING. Every sub-violation name, default, and description is taken from
// F5's own K7929 ("Working with evasion technique detected violations") and the
// current BIG-IP ASM 17.5 "Working with Violations" manual chapter (the Evasion
// Techniques Sub-Violations table, updated 2026-02-26). The declarative field
// names (`enabled`, `maxDecodingPasses`, the 2..5 bound, the "learned only when
// learn is enabled for VIOL_EVASION" rule) are verbatim from the F5 Declarative
// WAF policy schema `blocking-settings.evasions` section.
//
// This is a DECODE-ONLY explainer (D-49, zero egress). It parses the JSON you
// paste and reads its values; it never fetches, never validates against a live
// BIG-IP, and never evaluates traffic. It reports what a policy SET; the
// absence of an evasion entry means the template default applies, not that the
// sub-violation is off — the engine says so rather than guessing.
//
// The bridge to the codec tools: several sub-violations are exactly the decode
// operations the toolbox already performs (%u and %XX are the Base64/Percent
// codec's territory; multiple-decoding is repeated percent-decoding). Each
// reference card names the related tool so the two halves connect.
// ============================================================================

export type Mode = "reference" | "policy";

/** One of F5's eight evasion sub-violations. */
export interface EvasionTechnique {
  /** Stable key used for lookup and i18n. */
  readonly key: string;
  /** F5's display name for the sub-violation. */
  readonly name: string;
  /** F5's documented default (all eight ship Enabled). */
  readonly defaultEnabled: true;
  /** Whether the Multiple-decoding pass count applies to this technique. */
  readonly hasPassCount?: boolean;
  /** Declarative-schema field name, where the sub-violation maps to one. */
  readonly declarativeName: string;
}

// ---------------------------------------------------------------------------
// The eight sub-violations, in the manual's table order. Names, defaults, and
// the declarative `description` strings are F5's; the `declarativeName` values
// are the enum members of the schema's evasions[].description field.
// ---------------------------------------------------------------------------
export const EVASION_TECHNIQUES: readonly EvasionTechnique[] = Object.freeze([
  { key: "pct-u", name: "%u decoding", defaultEnabled: true, declarativeName: "%u decoding" },
  { key: "apache-ws", name: "Apache whitespace", defaultEnabled: true, declarativeName: "Apache whitespace" },
  { key: "bad-unescape", name: "Bad unescape", defaultEnabled: true, declarativeName: "Bad unescape" },
  { key: "bare-byte", name: "Bare byte decoding", defaultEnabled: true, declarativeName: "Bare byte decoding" },
  { key: "dir-traversal", name: "Directory traversals", defaultEnabled: true, declarativeName: "Directory traversals" },
  { key: "iis-backslash", name: "IIS backslashes", defaultEnabled: true, declarativeName: "IIS backslashes" },
  { key: "iis-unicode", name: "IIS Unicode codepoints", defaultEnabled: true, declarativeName: "IIS Unicode codepoints" },
  { key: "multi-decode", name: "Multiple decoding", defaultEnabled: true, hasPassCount: true, declarativeName: "Multiple decoding" },
]);

/** Fast lookup by declarativeName (case/space-insensitive) and by key. */
const BY_TOKEN = new Map<string, EvasionTechnique>();
for (const t of EVASION_TECHNIQUES) {
  BY_TOKEN.set(norm(t.declarativeName), t);
  BY_TOKEN.set(norm(t.name), t);
  BY_TOKEN.set(t.key, t);
}
function norm(s: string): string {
  return s.toLowerCase().replace(/[\s_%-]+/g, "");
}

// The schema's documented bound on Multiple-decoding passes.
export const PASS_MIN = 2;
export const PASS_MAX = 5;
export const PASS_DEFAULT = 3; // the manual's documented default ("Enabled: 3")

// ---------------------------------------------------------------------------
// Result shapes.
// ---------------------------------------------------------------------------
export interface TechniqueState {
  readonly technique: EvasionTechnique;
  /** true = enabled, false = disabled, null = not set in the pasted policy. */
  readonly enabled: boolean | null;
  /** For Multiple decoding only: the pass count the policy set, if any. */
  readonly passes?: number | null;
}

export type Note =
  | { kind: "not-a-policy" }
  | { kind: "parse-error"; detail: string }
  | { kind: "no-evasions-block" }
  | { kind: "all-default" }
  | { kind: "disabled-present"; names: string[] }
  | { kind: "passes-out-of-range"; value: number }
  | { kind: "passes-raised"; value: number }
  | { kind: "unknown-entry"; description: string }
  | { kind: "learn-gated" };

export interface EvasionResult {
  readonly mode: Mode;
  /** REFERENCE mode: the cards requested (one, or all eight). */
  readonly cards: readonly EvasionTechnique[];
  /** POLICY mode: the read-back state of each sub-violation. */
  readonly states: readonly TechniqueState[];
  /** Observations worth surfacing. */
  readonly notes: readonly Note[];
  /** Whether the policy also set the VIOL_EVASION violation to learn. */
  readonly learnEnabled?: boolean | null;
}

// ---------------------------------------------------------------------------
// Entry point.
// ---------------------------------------------------------------------------
export function explainEvasions(input: string): EvasionResult | null {
  const raw = input.trim();
  if (!raw) return null;

  // Reference triggers: "evasions"/"techniques"/"all", or a single name.
  const asToken = norm(raw);
  if (asToken === "evasions" || asToken === "techniques" || asToken === "all" || asToken === "list") {
    return { mode: "reference", cards: EVASION_TECHNIQUES, states: [], notes: [] };
  }
  // A bare sub-violation name (not JSON) -> single reference card.
  if (!raw.startsWith("{") && !raw.startsWith("[")) {
    const hit = BY_TOKEN.get(asToken);
    if (hit) return { mode: "reference", cards: [hit], states: [], notes: [] };
    // Not JSON and not a known name -> treat as a miss, let the UI prompt.
    return { mode: "reference", cards: [], states: [], notes: [{ kind: "not-a-policy" }] };
  }

  // POLICY mode: parse JSON and locate the evasions array.
  let doc: unknown;
  try {
    doc = JSON.parse(raw);
  } catch (e) {
    return {
      mode: "policy",
      cards: [],
      states: [],
      notes: [{ kind: "parse-error", detail: e instanceof Error ? e.message : String(e) }],
    };
  }

  const { evasions, learnEnabled } = locateEvasions(doc);
  if (evasions === null) {
    return { mode: "policy", cards: [], states: [], notes: [{ kind: "no-evasions-block" }] };
  }

  const notes: Note[] = [];
  // Build a description -> entry map from the pasted array.
  const seen = new Map<string, Record<string, unknown>>();
  for (const entry of evasions) {
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const desc = (entry as Record<string, unknown>).description;
      if (typeof desc === "string") {
        const key = norm(desc);
        if (BY_TOKEN.has(key)) seen.set(key, entry as Record<string, unknown>);
        else notes.push({ kind: "unknown-entry", description: desc });
      }
    }
  }

  const states: TechniqueState[] = EVASION_TECHNIQUES.map((technique) => {
    const entry = seen.get(norm(technique.declarativeName));
    if (!entry) return { technique, enabled: null };
    // The schema models each sub-violation with `enabled` (boolean).
    const enabledRaw = entry.enabled;
    const enabled = typeof enabledRaw === "boolean" ? enabledRaw : null;
    let passes: number | null | undefined = undefined;
    if (technique.hasPassCount) {
      const p = entry.maxDecodingPasses;
      passes = typeof p === "number" ? p : null;
      if (typeof p === "number") {
        if (p < PASS_MIN || p > PASS_MAX) notes.push({ kind: "passes-out-of-range", value: p });
        else if (p > PASS_DEFAULT) notes.push({ kind: "passes-raised", value: p });
      }
    }
    return { technique, enabled, passes };
  });

  // Roll-up notes.
  const disabled = states.filter((s) => s.enabled === false).map((s) => s.technique.name);
  if (disabled.length > 0) notes.push({ kind: "disabled-present", names: disabled });
  const anySet = states.some((s) => s.enabled !== null);
  if (!anySet) notes.push({ kind: "all-default" });

  // The schema rule: sub-violations are only LEARNED when learn is enabled on
  // the parent VIOL_EVASION violation. Surface it if we could read the flag.
  if (learnEnabled === false) notes.push({ kind: "learn-gated" });

  return { mode: "policy", cards: [], states, notes, learnEnabled };
}

// ---------------------------------------------------------------------------
// Locate the evasions array in whatever the user pasted: a bare array, the
// `evasions` block itself, a `blocking-settings` object, or a whole policy
// (`{ policy: { "blocking-settings": { evasions: [...] } } }`). Also try to
// read the parent VIOL_EVASION violation's `learn` flag when a full
// blocking-settings.violations array is present.
// ---------------------------------------------------------------------------
function locateEvasions(doc: unknown): {
  evasions: Record<string, unknown>[] | null;
  learnEnabled: boolean | null;
} {
  // A bare array of evasion entries.
  if (Array.isArray(doc)) return { evasions: doc as Record<string, unknown>[], learnEnabled: null };

  if (!doc || typeof doc !== "object") return { evasions: null, learnEnabled: null };

  // Descend through the known nesting, tolerant of the policy wrapper.
  const root = doc as Record<string, unknown>;
  const policy = (root.policy && typeof root.policy === "object" ? root.policy : root) as Record<string, unknown>;
  const bs = (policy["blocking-settings"] && typeof policy["blocking-settings"] === "object"
    ? policy["blocking-settings"]
    : policy) as Record<string, unknown>;

  const evasionsRaw = bs.evasions;
  const evasions = Array.isArray(evasionsRaw) ? (evasionsRaw as Record<string, unknown>[]) : null;

  // Parent violation learn flag, if the violations array is present.
  let learnEnabled: boolean | null = null;
  const viols = bs.violations;
  if (Array.isArray(viols)) {
    for (const v of viols) {
      if (v && typeof v === "object") {
        const nm = (v as Record<string, unknown>).name;
        if (typeof nm === "string" && norm(nm) === norm("VIOL_EVASION")) {
          const l = (v as Record<string, unknown>).learn;
          if (typeof l === "boolean") learnEnabled = l;
        }
      }
    }
  }

  return { evasions, learnEnabled };
}
