// ============================================================================
// src/lib/tools/icontrol-rest-path-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the iControl REST path explainer (posture
// "derived", raised on 2026-10-27 from the inventory's "input"): a path can
// hold a credential. F5's own guides extend an auth token with
// "PATCH /mgmt/shared/authz/tokens/{{ bigip_auth_token }}", a URL can carry
// user:password@ before the host (RFC 3986 section 3.2.1 says not to render
// what follows the colon), and a pasted request can bring its X-F5-Auth-Token
// or Authorization header. A link carries the copy shareablePath() in
// compute.ts makes: the token masked with its shape kept (so the page still
// reads it as the object), the password and the headers' credentials
// replaced by "[redacted]" (pinned by the tool's own share vectors). Host,
// module, collection, object names and query options stay as typed.
//
// Arrival: the copy fills the box as a paste would, and the page decodes it.
// Any non-empty text is accepted, exactly as a paste is.
// ============================================================================

import { shareablePath } from "./compute"; // the derived form
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (as typed when encoding, the copy on arrival). */
export interface IcontrolPathShareState {
  /** The path or URL. */
  input: string;
}

/** The spec. */
export const ICONTROL_PATH_SHARE: ShareSpec<IcontrolPathShareState> = Object.freeze({
  tool: "icontrol-rest-path-explainer", // the slug
  posture: "derived", // the copy with every credential replaced
  carriesKey: "share.carries", // tools.icontrol-rest-path-explainer.share.carries
  names: ["input"], // #input=
  /** The copy, when the box holds something. */
  encode(s: IcontrolPathShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing typed: the button is disabled
    return { ok: true, params: { input: shareablePath(s.input).text } } as const; // the copy, never the paste
  },
  /** Any non-empty text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): IcontrolPathShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the copy, or nothing
  },
});
