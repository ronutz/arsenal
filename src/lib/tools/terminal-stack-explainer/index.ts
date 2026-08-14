// ============================================================================
// The {manifest, run, vectors} triple for the terminal stack explainer.
// It reads a path, not a system. Offline.
// ============================================================================

export { explainDevice, theFourWords, run, TerminalInputError } from "./compute";
export type { DeviceFacts, Layer } from "./compute";
export { verifyVectors, TERMINAL_VECTORS, GOLDEN_VECTOR_SET_ID } from "./golden-vectors";
export type { TerminalVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolSlug: "terminal-stack-explainer",
  learnLinks: [
    "learn/terminal-shell-tty-console",
  ],
  sources: Object.freeze([
    Object.freeze({ id: "tty-demystified", label: "Linus Akesson - The TTY demystified", url: "https://www.linusakesson.net/programming/tty/" }),
    Object.freeze({ id: "ibm-tty", label: "IBM AIX documentation - tty special file and the controlling terminal", url: "https://www.ibm.com/docs/tr/ssw_aix_71/filesreference/tty.html" }),
    Object.freeze({ id: "unix-se", label: "Unix & Linux Stack Exchange - What is the exact difference between a terminal, a shell, a tty and a console?", url: "https://unix.stackexchange.com/questions/4126/what-is-the-exact-difference-between-a-terminal-a-shell-a-tty-and-a-con" }),
  ]),
});
