// ============================================================================
// src/lib/share/cases/exos-config-explainer-revealed.ts
// ----------------------------------------------------------------------------
// Share cases of the EXOS config explainer's reveal switch (wave 4C,
// 2026-11-01; the switch is ANVIL's of 01/11/2026). Ticked in the popover, the
// link carries the configuration as pasted, every value included; the arrival
// is the same paste as the copy's (one decode rule). There is no switch beside
// a copy that replaced nothing, beside a copy that replaced a private key, or
// in place of a link the site's check blocked.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { EXOS_SHARE_REVEALED, type ExosShareState } from "../../tools/exos-config-explainer/share"; // the spec

/** A lab configuration with the default communities, which a trainer may send on purpose. */
const LAB = "configure snmp add community readwrite private\nconfigure snmp add community readonly public\ncreate vlan lab tag 10"; // two values
/** A pregenerated SSH2 host key: never through the switch. */
const SSH_KEY = "configure ssh2 key pregenerated\n2d:2d:2d:2d:2d:42:45:47:49:4e:20:52:53:41:20:50:52:49:56:41:54:45:20:4b:45:59:2d:2d:2d:2d:2d\nenable ssh2"; // a key's first line

/** The cases. */
export const EXOS_REVEALED_SHARE_CASES = defineShareCases<ExosShareState, ExosShareState>({
  spec: EXOS_SHARE_REVEALED, // the spec
  variant: "revealed", // registers as exos-config-explainer:revealed, beside the copy's set
  accept: [
    { id: "lab-communities-as-pasted", state: { input: LAB }, params: { input: LAB }, restored: { input: LAB } }, // by the reader's choice, every value included
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "nothing-replaced", state: { input: "create vlan lab tag 10" } }, // the copy replaced nothing: no switch
    { id: "private-key-replaced", state: { input: SSH_KEY } }, // a private key: never through the switch
    { id: "blocked-copy", state: { input: "configure banner before-login\n-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQ\n-----END PRIVATE KEY-----\nconfigure snmp add community readonly public" } }, // never in place of a blocked link
  ],
  blocked: [],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
