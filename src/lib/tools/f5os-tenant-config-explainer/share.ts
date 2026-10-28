// ============================================================================
// src/lib/tools/f5os-tenant-config-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5OS tenant config explainer (posture
// "input-caution", raised from "input" on 2026-10-27): a link carries the
// tenant block as pasted, after the "#", and nothing else. The page's own
// field notes call mgmt-ip the "out-of-band management address for the
// tenant itself" and read its gateway and VLANs back, so the popover adds the
// tool's caution line (tools.f5os-tenant-config-explainer.share.caution).
//
// Weighed for secrets (WAVE2 brief: "F5OS tenant configurations"): F5's
// tenant lifecycle reference for the VELOS API (clouddocs, read 2026-10-27)
// configures a tenant with name, type, image, nodes, mgmt-ip, prefix-length,
// gateway, vlans, cryptos, vcpu-cores-per-node, memory, running-state and
// appliance-mode; none is a password or a key. The credentials that page uses
// (a username and password, then an X-Auth-Token) belong to the API request,
// not to the tenant block, so the caution line covers what a block can hold.
//
// Arrival (useShareArrival in the component): the text fills the box as a
// paste would and the page reads it. Nothing is contacted. Any non-blank text
// is accepted, exactly as a paste is.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state a share carries: the box as typed. */
export interface F5osTenantShareState {
  /** The paste. */
  input: string;
}

/** The spec. */
export const F5OS_TENANT_SHARE: ShareSpec<F5osTenantShareState> = Object.freeze({
  tool: "f5os-tenant-config-explainer", // the slug
  posture: "input-caution", // the paste as typed, with the standard warning and a caution line
  carriesKey: "share.carries", // tools.f5os-tenant-config-explainer.share.carries
  names: ["input"], // #input=
  /** The paste, or nothing while the box is blank. */
  encode(state: F5osTenantShareState): ShareEncoding {
    if (state.input.trim() === "") return { ok: false, reason: "empty" }; // nothing to share: the button is disabled
    return { ok: true, params: { input: state.input } }; // the one value
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(values: Readonly<Record<string, string | null>>): F5osTenantShareState | null {
    const v = values.input; // the arriving value
    return v && v.trim() !== "" ? { input: v } : null; // the text, or nothing
  },
});
