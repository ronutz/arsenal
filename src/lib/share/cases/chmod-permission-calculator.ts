// ============================================================================
// src/lib/share/cases/chmod-permission-calculator.ts
// ----------------------------------------------------------------------------
// Share cases of the chmod permission calculator: the mode as typed, the kind
// always, the base and umask when filled in.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { CHMOD_SHARE, type ChmodShareState } from "../../tools/chmod-permission-calculator/share"; // the spec

/** The cases. */
export const CHMOD_PERMISSION_SHARE_CASES = defineShareCases<ChmodShareState, ChmodShareState>({
  spec: CHMOD_SHARE, // the spec
  accept: [
    { id: "octal-file", state: { input: "4755", kind: "file", base: "", umask: "" }, params: { input: "4755", kind: "file", base: "", umask: "" }, restored: { input: "4755", kind: "file", base: "", umask: "" } }, // setuid, blank fields carry nothing
    { id: "symbolic-dir-base", state: { input: "g+s,o-rwx", kind: "directory", base: "755", umask: "" }, params: { input: "g+s,o-rwx", kind: "directory", base: "755", umask: "" }, restored: { input: "g+s,o-rwx", kind: "directory", base: "755", umask: "" } }, // clauses on a base
    { id: "no-class-umask", state: { input: "+x", kind: "file", base: "640", umask: "027" }, params: { input: "+x", kind: "file", base: "640", umask: "027" }, restored: { input: "+x", kind: "file", base: "640", umask: "027" } }, // a clause with no class, under a umask
    { id: "ls-string", state: { input: "-rwsr-xr-x", kind: "file", base: "", umask: "" }, params: { input: "-rwsr-xr-x", kind: "file", base: "", umask: "" }, restored: { input: "-rwsr-xr-x", kind: "file", base: "", umask: "" } }, // an ls string
  ],
  empty: [
    { id: "blank", state: { input: "", kind: "file", base: "", umask: "" } }, // nothing typed
    { id: "refused", state: { input: "9999", kind: "file", base: "", umask: "" } }, // not an octal mode
  ],
  reject: [
    { id: "no-mode", values: { input: null, kind: "file" } }, // nothing to read
    { id: "no-kind", values: { input: "755" } }, // the kind is always written
    { id: "unknown-kind", values: { input: "755", kind: "symlink" } }, // not file or directory
    { id: "too-long", values: { input: "7".repeat(65), kind: "file" } }, // longer than the field
    { id: "base-too-long", values: { input: "+x", kind: "file", base: "6".repeat(65) } }, // longer than the field
  ],
});
