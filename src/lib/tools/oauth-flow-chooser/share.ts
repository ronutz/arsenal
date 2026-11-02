// ============================================================================
// src/lib/tools/oauth-flow-chooser/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the OAuth flow chooser (posture "input", the
// inventory's: the manifest says "three enum/boolean answers carry no
// secrets"). The tool is a form with nothing to paste, so a link carries
// named values only (ROLLOUT section 11.3): the application type by its
// stable id ("app"), and each question answered yes ("identity=1",
// "offline=1"); an unanswered question is left out and arrives as no.
//
// Arrival: the three answers replace the form's, and the page recommends the
// same flow, computed in the browser. An application type the page does not
// offer, or an answer other than 1 or 0, makes the whole link malformed:
// ignored, and stripped from the address either way.
// ============================================================================

import type { AppType } from "./compute"; // the engine's application types
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The application types the page's select offers, by their stable ids. */
const APP_TYPES: readonly AppType[] = Object.freeze(["server-web", "spa", "native", "service", "device"]); // as the component lists them

/** What the page encodes and an arrival restores: the three answers. */
export interface OauthChooserShareState {
  /** The application type, or "" while none is chosen. */
  appType: AppType | "";
  /** Does the app act for a signed-in person who must be identified? */
  wantsIdentity: boolean;
  /** Does it need access while the person is away? */
  needsOffline: boolean;
}

/**
 * Read a yes/no answer.
 * @param v the value ("1", "0" or absent)
 * @returns true, false, or null when it is neither
 */
function readSwitch(v: string | null | undefined): boolean | null {
  if (v === null || v === undefined || v === "0") return false; // absent or no
  return v === "1" ? true : null; // yes, or malformed
} // readSwitch

/** The spec. */
export const OAUTH_CHOOSER_SHARE: ShareSpec<OauthChooserShareState> = Object.freeze({
  tool: "oauth-flow-chooser", // the slug
  posture: "input", // three answers, no secret
  carriesKey: "share.carries", // tools.oauth-flow-chooser.share.carries
  names: ["app", "identity", "offline"], // a form: named values only
  /** The type, and each yes; nothing while no type is chosen. */
  encode(s: OauthChooserShareState): ShareEncoding {
    if (s.appType === "" || !APP_TYPES.includes(s.appType)) return { ok: false, reason: "empty" } as const; // no recommendation yet
    const p: Record<string, string> = { app: s.appType }; // the type
    if (s.wantsIdentity) p.identity = "1"; // yes
    if (s.needsOffline) p.offline = "1"; // yes
    return { ok: true, params: p } as const; // the answers
  },
  /** An offered type, and yes/no answers. */
  decode(v: Readonly<Record<string, string | null>>): OauthChooserShareState | null {
    const appType = APP_TYPES.find((a) => a === v.app); // from the select
    if (appType === undefined) return null; // required
    const wantsIdentity = readSwitch(v.identity); // yes or no
    const needsOffline = readSwitch(v.offline); // yes or no
    if (wantsIdentity === null || needsOffline === null) return null; // malformed
    return { appType, wantsIdentity, needsOffline }; // the form
  },
});
