// ============================================================================
// src/lib/tools/f5xc-http-lb-route-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 XC HTTP load balancer route explainer
// (posture "derived", raised on 2026-11-01 from the inventory's
// "input-caution"). A pasted http_loadbalancer spec can hold secrets the page
// never reads: a certificate's private key (SecretType, in clear or
// blindfolded), the secret_value of a header or cookie the load balancer
// adds, and the plain values of those headers and cookies, a common place for
// an origin's shared secret (XC API reference, read 2026-11-01; see
// f5xc-object-linter/xc-share-secrets.ts). The page reads each route's match,
// action, pools, rewrites and WAF, and names the headers a route adds or
// removes without their values. So a link carries a COPY of the object:
//   - every SecretType secret (clear_secret_info.url,
//     blindfold_secret_info.location) and every plain value of an added
//     header or cookie becomes [redacted]; everything else stays as pasted;
//   - the copy must read the same (routes, matches, pools, warnings, the
//     names of the headers added), or there is no link (code "copy"), never
//     a link that opens something else;
//   - the site's check (with the XC findings) then reads the copy and the
//     simulator's path: a credential left in what the page shows (an
//     Authorization header matcher's value, a JWT in a path) blocks the link
//     (code "secret"), and a secret-looking name with a value is named in a
//     maybe line.
// The simulator's method and path go too when a path is typed.
//
// The reveal switch (THE REVEAL SWITCH, 01/11/2026): when the copy replaced
// only header or cookie values (no SecretType secret, no Authorization or
// secret-looking name among them) and the object as pasted passes the check,
// the popover may offer to include them; ticked, the link carries the object
// as pasted (posture input-caution, ROUTE_SHARE_REVEALED).
//
// Arrival: the copy (or the object) fills the box as a paste would, the
// simulator's method and path fill, and the page reads it.
// ============================================================================

import { explainRoutes, type ExplainResult } from "./compute"; // the page's own reading
import { blockedBySecret, type ShareSecretFinding } from "../../share/text-secrets"; // the site's share check: the blocked encoding
import { checkXcBox, xcObjectCopy, xcRevealable, type XcObjectCopy } from "../f5xc-object-linter/xc-share-secrets"; // the F5 XC copy and check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The simulator's methods, as the page offers them. */
export const ROUTE_METHODS: readonly string[] = Object.freeze(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]); // the select's options

/** The state: the box, and the simulator's method and path. */
export interface RouteShareState {
  /** The box (the paste when encoding; the copy or the paste on arrival). */
  input: string;
  /** The simulator's method. */
  method: string;
  /** The simulator's path, as typed ("" when none). */
  path: string;
}

/**
 * What the page shows of a reading: everything, except the values of the headers a route adds (the page shows their
 * names only, and the copy replaces the values).
 * @param r a reading
 * @returns its text, for comparison
 */
export function routeReadingOf(r: ExplainResult): string {
  const strip = (list: { name: string; append?: boolean }[]) => list.map((h) => ({ name: h.name, append: h.append })); // name and append only
  return JSON.stringify({ ...r, routes: r.routes.map((x) => ({ ...x, requestHeadersAdd: strip(x.requestHeadersAdd), responseHeadersAdd: strip(x.responseHeadersAdd) })) }); // the rest as is
} // routeReadingOf

/** The copy of an object, made once per change of the box: the copy and its check, and two decisions about it. */
export interface RouteObjectCopy {
  /** The copy and its check (or no copy). */
  copy: XcObjectCopy;
  /** True when the copy reads as the paste does. */
  readsSame: boolean;
  /** True when the object as pasted may be offered by the reveal switch (the path aside). */
  revealable: boolean;
}

/**
 * Make the copy of an object and check it (the page calls this once per change of the box, with its own reading).
 * @param input the box as pasted
 * @param r the page's reading of the box
 * @returns the copy, its check, and the two decisions
 */
export function routeObjectCopy(input: string, r: ExplainResult): RouteObjectCopy {
  const copy = xcObjectCopy(input); // the copy and its check
  const readsSame = copy.ok && (copy.replaced === 0 || routeReadingOf(explainRoutes(copy.copy)) === routeReadingOf(r)); // read again only when something changed
  return { copy, readsSame, revealable: readsSame && xcRevealable(input, copy) }; // checked
} // routeObjectCopy

/** What the share comes to: the object's copy, and the findings in the simulator's path. */
export interface RouteShareCopy extends RouteObjectCopy {
  /** Findings in the simulator's path, tagged "path". */
  path: { secrets: (ShareSecretFinding & { field: string })[]; maybe: (ShareSecretFinding & { field: string })[] };
}

/**
 * Add the check of the simulator's path to an object's copy (cheap: the path is one short line).
 * @param s the state
 * @param o the object's copy
 * @returns the copy with the path's findings, and the reveal decision with the path in it
 */
export function routeShareCopy(s: RouteShareState, o: RouteObjectCopy): RouteShareCopy {
  const p = s.path.trim() === "" ? { secrets: [], maybe: [] } : checkXcBox(s.path); // the simulator's path
  const tag = (f: ShareSecretFinding) => ({ ...f, field: "path" }); // tagged
  return { ...o, path: { secrets: p.secrets.map(tag), maybe: p.maybe.map(tag) }, revealable: o.revealable && p.secrets.length === 0 }; // checked
} // routeShareCopy

/**
 * The simulator's values, when a path is typed.
 * @param s the state
 * @returns method and path, or nothing
 */
function simValues(s: RouteShareState): Record<string, string> {
  return s.path.trim() === "" ? {} : { method: s.method, path: s.path }; // only with a path
} // simValues

/**
 * The encoding of a copy the page already made.
 * @param s the state
 * @param c the copy and its checks (null while the page has no reading)
 * @returns the copy (and the simulator's values), nothing, or blocked
 */
export function encodeRouteShare(s: RouteShareState, c: RouteShareCopy | null): ShareEncoding {
  if (!c) return { ok: false, reason: "empty" }; // no reading: nothing to share
  if (!c.copy.ok || !c.readsSame) return { ok: false, reason: "blocked", code: "copy" }; // no copy that reads the same
  const fields = [...c.copy.report.secrets.map((f) => ({ ...f, field: "input" })), ...c.path.secrets]; // the box first, then the path
  return blockedBySecret(fields) ?? { ok: true, params: { input: c.copy.copy, ...simValues(s) } }; // blocked, or the copy
} // encodeRouteShare

/**
 * The object as pasted, every value included: what the reveal switch carries (offered only when `revealable`).
 * @param s the state
 * @param c the copy and its checks
 * @returns the object as pasted (and the simulator's values), or nothing
 */
export function encodeRouteRevealed(s: RouteShareState, c: RouteShareCopy | null): ShareEncoding {
  if (!c || !c.revealable) return { ok: false, reason: "empty" }; // not offered
  return { ok: true, params: { input: s.input, ...simValues(s) } }; // as pasted
} // encodeRouteRevealed

/**
 * The page's reading of a box, or null when it has none to share (blank, not JSON, or no routes array).
 * @param input the box
 * @returns the reading, or null
 */
export function routeReading(input: string): ExplainResult | null {
  if (input.trim() === "") return null; // nothing pasted
  const r = explainRoutes(input); // as the page reads it
  return r.recognized ? r : null; // routes found, or nothing
} // routeReading

/**
 * Decode the shared values: a non-blank box, and the simulator's values when a path is given.
 * @param v the values
 * @returns the state, or null when malformed
 */
function decodeRoute(v: Readonly<Record<string, string | null>>): RouteShareState | null {
  if (!v.input || v.input.trim() === "") return null; // nothing to fill
  if (v.path === null || v.path === undefined || v.path.trim() === "") return v.method ? null : { input: v.input, method: "GET", path: "" }; // a method alone is never written
  const method = v.method ?? "GET"; // the page's default
  if (!ROUTE_METHODS.includes(method)) return null; // unknown: malformed
  return { input: v.input, method, path: v.path }; // the state
} // decodeRoute

/** The spec. */
export const ROUTE_SHARE: ShareSpec<RouteShareState> = Object.freeze({
  tool: "f5xc-http-lb-route-explainer", // the slug
  posture: "derived", // a copy with SecretType secrets and added header and cookie values replaced, never the paste
  carriesKey: "share.carries", // tools.f5xc-http-lb-route-explainer.share.carries
  names: ["input", "method", "path"], // #input=&method=&path=
  /** The copy, nothing, or blocked (the spec reads, copies and checks itself). */
  encode(s: RouteShareState): ShareEncoding {
    const r = routeReading(s.input); // the reading
    return encodeRouteShare(s, r ? routeShareCopy(s, routeObjectCopy(s.input, r)) : null); // copied, checked, encoded
  },
  /** A non-blank box; a known method with a path. */
  decode: decodeRoute,
});

/** The spec of the reveal switch: the object as pasted (posture input-caution: the reader ticked it). */
export const ROUTE_SHARE_REVEALED: ShareSpec<RouteShareState> = Object.freeze({
  tool: "f5xc-http-lb-route-explainer", // the slug
  posture: "input-caution", // the object as pasted, with the tool's caution, by the reader's explicit choice
  carriesKey: "share.carriesRevealed", // tools.f5xc-http-lb-route-explainer.share.carriesRevealed
  names: ["input", "method", "path"], // the same names: an arrival is the same paste either way
  /** The object as pasted, or nothing (offered only when the copy replaced header or cookie values alone). */
  encode(s: RouteShareState): ShareEncoding {
    const r = routeReading(s.input); // the reading
    return encodeRouteRevealed(s, r ? routeShareCopy(s, routeObjectCopy(s.input, r)) : null); // as pasted, or nothing
  },
  /** One decode rule for both. */
  decode: decodeRoute,
});
