// ============================================================================
// src/lib/tools/fabric-connect-spb-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the Fabric Connect / SPB explainer (posture
// "input", the inventory's, kept). The form takes an I-SID, the service it
// carries, the backbone VLAN pair, a nickname and a role: fabric identifiers a
// reader types to study how SPB treats them, the same kind of value the VOSS
// fabric identifier decoder already shares as typed (wave 1A). Nothing secret,
// nothing a fabric uses to authenticate.
//
// The tool is a form with nothing to paste, so the link carries named values
// only (ROLLOUT 11.3), every field (a text field left empty carries nothing and
// arrives empty; the two selects always go):
//   isid, primary, secondary, nickname   the text fields, as typed
//   service                              unknown, l2vsn, l3vsn or multicast
//   role                                 beb or bcb (absent: none chosen)
// The two B-VLAN fields arrive as carried, empty included: a link made with
// one cleared keeps it cleared, so the page reads the same defaults it read.
// Arrival: the form is set and the page explains it, as on a change.
// ============================================================================

import { explainSpb } from "./compute"; // the engine
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The form as the page holds it (every field as typed). */
export interface SpbShareState {
  /** The I-SID, as typed. */
  isid: string;
  /** The service the I-SID carries. */
  service: string;
  /** The primary B-VLAN, as typed. */
  primary: string;
  /** The secondary B-VLAN, as typed. */
  secondary: string;
  /** The nickname, as typed. */
  nickname: string;
  /** The role: "beb", "bcb" or "" (none). */
  role: string;
}

/** The services the select offers. */
const SERVICES = ["unknown", "l2vsn", "l3vsn", "multicast"]; // the select's options
/** The roles the select offers ("" is none). */
const ROLES = ["", "beb", "bcb"]; // the select's options

/**
 * The page's own reading of the form (the same call it makes), or null when it gives none.
 * @param s the form
 * @returns true when the page shows an explanation
 */
function reads(s: SpbShareState): boolean {
  if (!s.isid.trim() && !s.nickname.trim() && !s.role) return false; // nothing to explain yet
  try {
    explainSpb({ isid: s.isid.trim() ? Number(s.isid) : undefined, service: s.service as "l2vsn" | "l3vsn" | "multicast" | "unknown", primaryBvlan: Number(s.primary) || undefined, secondaryBvlan: Number(s.secondary) || undefined, nickname: s.nickname.trim() || undefined, role: (s.role || undefined) as "beb" | "bcb" | undefined }); // as the page calls it
    return true; // explained
  } catch {
    return false; // the page shows its error instead
  } // try
} // reads

/** The spec. */
export const SPB_SHARE: ShareSpec<SpbShareState> = Object.freeze({
  tool: "fabric-connect-spb-explainer", // the slug
  posture: "input", // the form as typed
  carriesKey: "share.carries", // tools.fabric-connect-spb-explainer.share.carries
  names: ["isid", "service", "primary", "secondary", "nickname", "role"], // a form: no "input"
  /** Every field of a form the page explains; nothing otherwise. */
  encode(s: SpbShareState): ShareEncoding {
    if (!reads(s)) return { ok: false, reason: "empty" }; // no explanation: nothing to share
    const all: Record<string, string> = { isid: s.isid, service: s.service, primary: s.primary, secondary: s.secondary, nickname: s.nickname, role: s.role }; // every field
    return { ok: true, params: Object.fromEntries(Object.entries(all).filter(([, x]) => x !== "")) }; // an empty field carries nothing (it arrives empty)
  },
  /** The form: the two selects strictly, the text fields as typed (one line each); an absent text field is empty. */
  decode(v: Readonly<Record<string, string | null>>): SpbShareState | null {
    const service = v.service ?? "unknown"; // absent: the page's starting choice
    const role = v.role ?? ""; // absent: none
    if (!SERVICES.includes(service) || !ROLES.includes(role)) return null; // a choice the page does not offer
    const text = [v.isid ?? "", v.primary ?? "", v.secondary ?? "", v.nickname ?? ""]; // the text fields
    if (text.some((x) => /[\r\n]/.test(x))) return null; // a one-line field cannot hold a line break
    const s: SpbShareState = { isid: text[0], service, primary: text[1], secondary: text[2], nickname: text[3], role }; // the form
    return s.isid.trim() || s.nickname.trim() || s.role ? s : null; // a link with nothing to explain is malformed
  },
});
