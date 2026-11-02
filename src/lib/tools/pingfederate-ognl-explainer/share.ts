// ============================================================================
// src/lib/tools/pingfederate-ognl-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the PingFederate OGNL expression explainer
// (posture "input-caution", raised from "input" on 2026-10-27). The manifest
// says why: "Expressions name real attributes and sometimes real group names"
// (its reason for shareSafetyDefault "fragment"), which ROLLOUT section 2 maps
// to a caution line. A link carries the expression as typed and where it is
// used ("context", left out for the default, an attribute mapping).
//
// One blocked case ("secret"): an expression in which the site's secrets check
// (src/lib/tools/code-to-image/secrets.ts, reused as is) finds a credential
// written in one of the formats it knows by shape: a PEM private key, an
// Authorization header, an AWS access key ID, a JWT, a password in a URL or a
// FortiOS ENC value. The check's name-based rules (a value set to a name that
// looks like a secret) are not applied: they are written for configuration
// files, and an expression reads attributes by name.
//
// Arrival: the expression and the context fill the page, which explains it
// as for a paste; nothing is evaluated (the tool never evaluates) or sent. A
// context the page does not offer, or an expression holding a credential,
// makes the whole link malformed: ignored, and stripped either way.
// ============================================================================

import { scanSecrets, type SecretRule } from "../code-to-image/secrets"; // the site's secrets check, reused as is
import type { ExpressionContext } from "./compute"; // the two contexts
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The contexts the page's select offers. */
const CONTEXTS: readonly ExpressionContext[] = Object.freeze(["attribute-mapping", "issuance-criterion"]); // as the component lists them

/** The context a link leaves out (the page's default). */
const DEFAULT_CONTEXT: ExpressionContext = "attribute-mapping"; // the page opens on it

/** The secrets check's rules that recognise a credential by its own shape (not by a name beside it). */
const FORMAT_RULES: ReadonlySet<SecretRule> = new Set<SecretRule>(["pem-private-key", "http-authorization", "aws-access-key-id", "jwt", "url-password", "fortios-enc"]); // the shape rules

/** What the page encodes and an arrival restores. */
export interface OgnlShareState {
  /** The expression as typed. */
  input: string;
  /** Where it is used. */
  context: ExpressionContext;
}

/** What the secrets check found in an expression. */
export interface OgnlSecret {
  /** Its safe label (never the secret itself). */
  label: string;
  /** Its 1-based line. */
  line: number;
}

/**
 * The first credential, written in a format the secrets check knows by shape, in an expression.
 * @param text the expression as typed
 * @returns its label and line, or null
 */
export function findExpressionSecret(text: string): OgnlSecret | null {
  const normalised = text.replace(/\r\n?/g, "\n"); // the check reads line feeds only
  const f = scanSecrets(normalised, () => false).find((x) => FORMAT_RULES.has(x.rule)); // the first shape finding
  return f ? { label: f.label, line: f.line } : null; // its label and line
} // findExpressionSecret

/** The spec. */
export const OGNL_SHARE: ShareSpec<OgnlShareState> = Object.freeze({
  tool: "pingfederate-ognl-explainer", // the slug
  posture: "input-caution", // the expression as typed, with a caution
  carriesKey: "share.carries", // tools.pingfederate-ognl-explainer.share.carries
  names: ["input", "context"], // #input=<expression>&context=issuance-criterion
  /** The expression and its context; blocked on a credential. */
  encode(s: OgnlShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing explained
    const secret = findExpressionSecret(s.input); // a credential in it?
    if (secret !== null) return { ok: false, reason: "blocked", code: "secret", values: { label: secret.label, line: secret.line } } as const; // never in a link
    return { ok: true, params: s.context === DEFAULT_CONTEXT ? { input: s.input } : { input: s.input, context: s.context } } as const; // the default context is left out
  },
  /** A non-blank expression without a credential, and an offered context. */
  decode(v: Readonly<Record<string, string | null>>): OgnlShareState | null {
    const input = v.input; // the expression
    if (!input || input.trim() === "" || findExpressionSecret(input) !== null) return null; // as a paste, but never a credential
    const context = v.context === null || v.context === undefined ? DEFAULT_CONTEXT : CONTEXTS.find((c) => c === v.context); // absent: the default
    if (context === undefined) return null; // not offered
    return { input, context }; // the state to fill
  },
});
