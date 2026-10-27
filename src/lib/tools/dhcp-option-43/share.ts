// ============================================================================
// src/lib/tools/dhcp-option-43/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the DHCP option 43 generator (posture
// "input-caution", raised from the inventory's "input"): a link carries the
// controller address(es) as typed, after the "#", and nothing else. The raise:
// the manifest's own header says "a management-interface address is internal
// topology" (shareSafetyDefault "fragment"), and ROLLOUT.md section 2 puts a
// "fragment" tool whose comment names infrastructure in input-caution; the
// inventory read only the comment on the shareSafetyDefault line, which is
// empty. The popover therefore adds the tool's own caution line.
//
// The vendor is not carried: the page's handoff carries one string (see
// Arrival), so a link opens on the first vendor profile; when another vendor
// is chosen, the popover says which one to pick after opening the link.
//
// Arrival: NOT useShareArrival. DhcpOption43Tool already reads #input= with
// usePrefill, which fills the address field and encodes as a paste would; that
// arrival is kept exactly as it is. encode gives exactly what usePrefill's
// apply accepts (one string), and decode mirrors readHandoff (any non-empty
// value).
// ============================================================================

import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The state a share carries: the address field as typed. */
export interface DhcpOption43ShareState {
  /** One controller address, or several separated as the page allows. */
  input: string;
}

/** The spec. */
export const DHCP_OPTION_43_SHARE: ShareSpec<DhcpOption43ShareState> = Object.freeze({
  tool: "dhcp-option-43", // the slug
  posture: "input-caution", // raised: a management address is internal topology (header comment above)
  carriesKey: "share.carries", // tools.dhcp-option-43.share.carries
  names: ["input"], // #input=, the handoff usePrefill reads
  /** The addresses as typed, or nothing while the field is blank. */
  encode(state: DhcpOption43ShareState) {
    if (state.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing to share: the button is disabled
    return { ok: true, params: { input: state.input } } as const; // the one value usePrefill's apply takes
  },
  /** Any non-empty value, as readHandoff hands it to usePrefill (the page refuses a malformed address with its message). */
  decode(values: Readonly<Record<string, string | null>>) {
    const v = values.input; // the arriving value
    return v ? { input: v } : null; // the text, or nothing
  },
});
