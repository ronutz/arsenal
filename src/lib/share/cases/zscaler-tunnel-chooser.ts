// ============================================================================
// src/lib/share/cases/zscaler-tunnel-chooser.ts
// ----------------------------------------------------------------------------
// Share cases of the Zscaler location-tunnel chooser (input, a form): every
// field always, answers as 1 or 0; an absent answer takes the page's opening
// value; no bandwidth has nothing to share; a bandwidth the chooser refuses,
// or an answer other than 1 or 0, is malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { ZSCALER_TUNNEL_CHOOSER_SHARE, type TunnelShareState } from "../../tools/zscaler-tunnel-chooser/share"; // the spec

/** The page's Example (verbatim from the component): the documentation's 2 Gbps GRE case. */
const EXAMPLE: TunnelShareState = { mbps: "2000", ha: "yes", staticIp: "yes", encryption: "no", greSupport: "yes", nated: "no" }; // as the component holds it
/** An encrypted 800 Mbps location: IPsec. */
const IPSEC: TunnelShareState = { mbps: "800", ha: "yes", staticIp: "no", encryption: "yes", greSupport: "no", nated: "yes" }; // as chosen

/** The cases. */
export const ZSCALER_TUNNEL_CHOOSER_SHARE_CASES = defineShareCases<TunnelShareState, TunnelShareState>({
  spec: ZSCALER_TUNNEL_CHOOSER_SHARE, // the spec
  accept: [
    { id: "example", state: EXAMPLE, params: { mbps: "2000", ha: "1", staticip: "1", encryption: "0", gre: "1", nated: "0" }, restored: EXAMPLE }, // every field
    { id: "ipsec-800", state: IPSEC, params: { mbps: "800", ha: "1", staticip: "0", encryption: "1", gre: "0", nated: "1" }, restored: IPSEC }, // the other answers
  ],
  arrive: [
    { id: "answers-absent", values: { mbps: "500", ha: null, staticip: null, encryption: null, gre: null, nated: null }, restored: { mbps: "500", ha: "yes", staticIp: "yes", encryption: "no", greSupport: "yes", nated: "no" } }, // the page's opening answers
  ],
  empty: [
    { id: "no-bandwidth", state: { ...EXAMPLE, mbps: "" } }, // the page computes nothing
    { id: "refused-bandwidth", state: { ...EXAMPLE, mbps: "0" } }, // the page shows its error
  ],
  reject: [
    { id: "zero", values: { mbps: "0", ha: "1", staticip: "1", encryption: "0", gre: "1", nated: "0" } }, // not a positive bandwidth
    { id: "over-scope", values: { mbps: "200000", ha: "1", staticip: "1", encryption: "0", gre: "1", nated: "0" } }, // over the chooser's scope
    { id: "bad-answer", values: { mbps: "500", ha: "yes", staticip: "1", encryption: "0", gre: "1", nated: "0" } }, // 1 or 0 only
    { id: "no-bandwidth", values: { mbps: null, ha: "1", staticip: "1", encryption: "0", gre: "1", nated: "0" } }, // nothing to choose for
  ],
});
