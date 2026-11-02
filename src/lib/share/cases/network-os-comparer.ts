// ============================================================================
// src/lib/share/cases/network-os-comparer.ts
// ----------------------------------------------------------------------------
// Share cases of the network operating system comparer (wave 4C, 2026-11-01):
// the two selects by id; an absent second system is the profile.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { NETWORK_OS_SHARE, type NetworkOsShareState } from "../../tools/network-os-comparer/share"; // the spec

/** The cases. */
export const NETWORK_OS_SHARE_CASES = defineShareCases<NetworkOsShareState, NetworkOsShareState>({
  spec: NETWORK_OS_SHARE, // the spec
  accept: [
    { id: "opening-profile", state: { os: "junos", with: "" }, params: { os: "junos" }, restored: { os: "junos", with: "" } }, // the page as it opens: the first system always goes
    { id: "example-comparison", state: { os: "ios", with: "eos" }, params: { os: "ios", with: "eos" }, restored: { os: "ios", with: "eos" } }, // the page's Example
    { id: "profile-voss", state: { os: "voss", with: "" }, params: { os: "voss" }, restored: { os: "voss", with: "" } }, // another profile
  ],
  empty: [
    { id: "unknown-first", state: { os: "windows-95", with: "" } }, // not a state the page shows
    { id: "same-twice", state: { os: "eos", with: "eos" } }, // the second select never offers the first
  ],
  blocked: [],
  reject: [
    { id: "no-first", values: { with: "eos" } }, // the first system is required
    { id: "unknown-first", values: { os: "windows-95" } }, // a system the page does not offer
    { id: "unknown-second", values: { os: "ios", with: "temple-os" } }, // the same for the second
    { id: "same-twice", values: { os: "ios", with: "ios" } }, // never offered
  ],
});
