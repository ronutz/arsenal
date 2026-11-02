// ============================================================================
// src/lib/tools/f5xc-ce-egress-checklist/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 XC CE egress checklist (posture
// "input-caution", as the inventory gives it: the manifest's "manual"). A
// link carries the file as pasted and the site type picked, once the page
// has parsed the file into an allowlist. F5's own file
// (ips-domains.txt, 6,970 characters on 2026-11-01) is public, but a copy
// edited for one site can name that site's own addresses and hosts: a
// caution line says so. The allowlist is built from every line, so nothing
// is cut out; a credential in the text blocks the link (the site's check,
// src/lib/share/text-secrets.ts, with the F5 XC findings), and a
// secret-looking name with a value is named in the caution line instead
// (2026-11-01, wave 4B).
//
// Names: `input` (the file) and `site` (smsv2, legacy or both), written
// every time. An absent `site` (a bare #input= hand-off) takes the page's
// default, both; an unknown one makes the link malformed.
//
// Arrival: the box fills as a paste would, the site type is picked, and the
// page parses the file. Any non-blank text is accepted, exactly as a paste is.
// ============================================================================

import { parseCeFile, type SiteType } from "./compute"; // the page's own parser
import { blockedBySecret, type ShareSecretReport } from "../../share/text-secrets"; // the site's share check: the blocked encoding
import { checkXcBox } from "../f5xc-object-linter/xc-share-secrets"; // the site's check with the F5 XC findings
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The site types the page offers, by their stable ids. */
export const CE_SITES: readonly SiteType[] = Object.freeze(["smsv2", "legacy", "both"]); // as the component lists them

/** The page's default site type (its opening state). */
export const CE_DEFAULT_SITE: SiteType = "both"; // useState("both")

/** The state: the file and the site type. */
export interface CeEgressShareState {
  /** The box as pasted. */
  input: string;
  /** The site type picked. */
  site: SiteType;
}

/**
 * Encode from what the page already computed (whether the file parsed, and the check's report).
 * @param s the state
 * @param parsed true when the page parsed the file into an allowlist
 * @param report the check's report on the box
 * @returns the file and the site type, nothing, or blocked
 */
export function encodeCeEgressShare(s: CeEgressShareState, parsed: boolean, report: ShareSecretReport): ShareEncoding {
  if (!parsed) return { ok: false, reason: "empty" }; // no allowlist: nothing to share
  return blockedBySecret(report.secrets) ?? { ok: true, params: { input: s.input, site: s.site } }; // blocked, or both values
} // encodeCeEgressShare

/** The spec. */
export const CE_EGRESS_SHARE: ShareSpec<CeEgressShareState> = Object.freeze({
  tool: "f5xc-ce-egress-checklist", // the slug
  posture: "input-caution", // the file as pasted, with a caution line, after the check
  carriesKey: "share.carries", // tools.f5xc-ce-egress-checklist.share.carries
  names: ["input", "site"], // #input=&site=
  /** The file and the site type, nothing, or blocked (the spec parses and checks the box itself). */
  encode(s: CeEgressShareState): ShareEncoding {
    const parsed = s.input.trim() !== "" && parseCeFile(s.input).ok; // as the page parses it
    return encodeCeEgressShare(s, parsed, parsed ? checkXcBox(s.input) : { secrets: [], maybe: [], skipped: false }); // parsed, checked, encoded
  },
  /** Any non-blank text, and a known site type (absent: the default). */
  decode(v: Readonly<Record<string, string | null>>): CeEgressShareState | null {
    if (!v.input || v.input.trim() === "") return null; // nothing to fill
    const site = v.site ?? CE_DEFAULT_SITE; // absent: the default
    if (!(CE_SITES as readonly string[]).includes(site)) return null; // unknown: malformed
    return { input: v.input, site: site as SiteType }; // the state
  },
});
