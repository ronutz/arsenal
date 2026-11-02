// ============================================================================
// src/lib/share/cases/terminal-stack-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the terminal stack explainer (wave 4C, 2026-11-01): the link
// carries the box as typed. Values are the page's own one-tap examples.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { TERMINAL_SHARE, type TerminalShareState } from "../../tools/terminal-stack-explainer/share"; // the spec

/** The cases. */
export const TERMINAL_SHARE_CASES = defineShareCases<TerminalShareState, TerminalShareState>({
  spec: TERMINAL_SHARE, // the spec
  accept: [
    { id: "pseudo-terminal", state: { input: "/dev/pts/3" }, params: { input: "/dev/pts/3" }, restored: { input: "/dev/pts/3" } }, // what tty prints in an SSH session
    { id: "serial-port", state: { input: "/dev/ttyS0" }, params: { input: "/dev/ttyS0" }, restored: { input: "/dev/ttyS0" } }, // a serial line
    { id: "not-a-tty", state: { input: "not a tty" }, params: { input: "not a tty" }, restored: { input: "not a tty" } }, // what tty says without a terminal
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing typed
  ],
  blocked: [],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
