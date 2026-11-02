// ============================================================================
// src/lib/share/cases/fabric-connect-spb-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the Fabric Connect / SPB explainer (wave 4C, 2026-11-01): a
// form; every field goes as typed (an empty one carries nothing and arrives
// empty), the two selects by id. Values are the page's Example and the tool's
// golden vectors.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { SPB_SHARE, type SpbShareState } from "../../tools/fabric-connect-spb-explainer/share"; // the spec

/** The page's Example. */
const EXAMPLE: SpbShareState = { isid: "20010", service: "l2vsn", primary: "4051", secondary: "4052", nickname: "1.00.01", role: "beb" }; // verbatim

/** The cases. */
export const SPB_SHARE_CASES = defineShareCases<SpbShareState, SpbShareState>({
  spec: SPB_SHARE, // the spec
  accept: [
    { id: "example", state: EXAMPLE, params: { isid: "20010", service: "l2vsn", primary: "4051", secondary: "4052", nickname: "1.00.01", role: "beb" }, restored: EXAMPLE }, // every field
    { id: "custom-bvlans-no-role", state: { isid: "20010", service: "unknown", primary: "100", secondary: "200", nickname: "", role: "" }, params: { isid: "20010", service: "unknown", primary: "100", secondary: "200" }, restored: { isid: "20010", service: "unknown", primary: "100", secondary: "200", nickname: "", role: "" } }, // golden vector's B-VLAN pair; empty fields left out
    { id: "role-only-cleared-bvlan", state: { isid: "", service: "unknown", primary: "4051", secondary: "", nickname: "", role: "bcb" }, params: { service: "unknown", primary: "4051", role: "bcb" }, restored: { isid: "", service: "unknown", primary: "4051", secondary: "", nickname: "", role: "bcb" } }, // a cleared B-VLAN arrives cleared
  ],
  arrive: [
    { id: "isid-only", values: { isid: "20011" }, restored: { isid: "20011", service: "unknown", primary: "", secondary: "", nickname: "", role: "" } }, // absent fields are empty, the service its starting choice
  ],
  empty: [
    { id: "nothing-typed", state: { isid: "", service: "unknown", primary: "4051", secondary: "4052", nickname: "", role: "" } }, // nothing to explain yet
    { id: "isid-out-of-range", state: { isid: "16777216", service: "unknown", primary: "4051", secondary: "4052", nickname: "", role: "" } }, // the page shows its error
  ],
  blocked: [],
  reject: [
    { id: "nothing-to-explain", values: { service: "l2vsn", primary: "4051" } }, // no I-SID, nickname or role
    { id: "unknown-service", values: { isid: "20010", service: "evpn" } }, // a service the select does not offer
    { id: "unknown-role", values: { isid: "20010", role: "core" } }, // a role the select does not offer
    { id: "line-break", values: { isid: "20010", nickname: "1.00.01\n2.00.02" } }, // a one-line field
  ],
});
