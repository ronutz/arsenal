// ============================================================================
// GOLDEN VECTORS for the terminal stack explainer.
//
// Each asserts a distinction the tool exists to make: a pts is a pseudoterminal
// slave with a master somewhere in userspace, a numbered tty is a virtual
// console driven by the kernel, ttyS0 is a real serial line, /dev/tty is a
// synonym rather than a device, and "not a tty" is a finding rather than an
// error.
// ============================================================================

import { explainDevice, theFourWords, type Layer } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "terminal-stack-explainer/2026-08-14";

export interface TerminalVector {
  name: string;
  input: string;
  expect: {
    layer?: Layer;
    noteContains?: string;
    warns?: boolean;
    throws?: boolean;
  };
}

export const TERMINAL_VECTORS: readonly TerminalVector[] = Object.freeze([
  {
    name: "a pts is a pseudoterminal slave",
    input: "/dev/pts/3",
    expect: { layer: "pseudoterminal", noteContains: "Something in userspace holds the MASTER" },
  },
  {
    name: "*** and the number is allocated, not meaningful ***",
    input: "/dev/pts/17",
    expect: { noteContains: "Two shells with consecutive numbers are not related" },
  },
  {
    name: "closing the window explains itself through SIGHUP",
    input: "/dev/pts/0",
    expect: { noteContains: "SIGHUP" },
  },
  {
    name: "a numbered tty is a VIRTUAL CONSOLE, not a pts",
    input: "/dev/tty2",
    expect: { layer: "virtual-console", noteContains: "no emulator and no window system in the path" },
  },
  {
    name: "and it says what virtual is measured against",
    input: "/dev/tty1",
    expect: { noteContains: "The REAL terminal was a separate machine on the end of a cable" },
  },
  {
    name: "ttyS0 is a real serial line",
    input: "/dev/ttyS0",
    expect: { layer: "serial", noteContains: "short for teletypewriter" },
  },
  {
    name: "*** and serial parameters are not negotiated ***",
    input: "/dev/ttyS0",
    expect: { warns: true },
  },
  {
    name: "a USB adapter is still a serial line",
    input: "/dev/ttyUSB0",
    expect: { layer: "serial" },
  },
  {
    name: "/dev/tty is a SYNONYM, not a device",
    input: "/dev/tty",
    expect: { layer: "kernel-tty", noteContains: "means something different to every process that opens it" },
  },
  {
    name: "and it explains why a password prompt cannot be redirected",
    input: "/dev/tty",
    expect: { noteContains: "redirected to a file" },
  },
  {
    name: "/dev/console is the kernel's own destination",
    input: "/dev/console",
    expect: { layer: "system-console", noteContains: "frequently the serial port rather than the screen" },
  },
  {
    name: '*** "not a tty" is a FINDING, not an error ***',
    input: "not a tty",
    expect: { layer: "not-a-tty", noteContains: "no job control" },
  },
  {
    name: "an unrecognised path is reported, not guessed",
    input: "/dev/weirdthing0",
    expect: { layer: "unknown", warns: true },
  },
  {
    name: "empty input throws",
    input: "   ",
    expect: { throws: true },
  },
]);

/** Run every vector. Returns the failures, empty when all pass. */
export function verifyVectors(): string[] {
  const f: string[] = [];
  for (const v of TERMINAL_VECTORS) {
    let d;
    try {
      d = explainDevice(v.input);
      if (v.expect.throws) { f.push(`${v.name}: expected a throw`); continue; }
    } catch (e) {
      if (!v.expect.throws) f.push(`${v.name}: threw ${(e as Error).message}`);
      continue;
    }
    const e = v.expect;
    if (e.layer && d.layer !== e.layer) f.push(`${v.name}: layer ${d.layer} != ${e.layer}`);
    if (e.warns !== undefined && (d.warnings.length > 0) !== e.warns) f.push(`${v.name}: warnings ${d.warnings.length}, expected warns=${e.warns}`);
    if (e.noteContains && !d.notes.some((n) => n.includes(e.noteContains!)) && !d.warnings.some((n) => n.includes(e.noteContains!))) {
      f.push(`${v.name}: nothing containing "${e.noteContains}"`);
    }
  }
  /* The four one-line definitions are the point of the whole tool. If any of
     them ever goes missing the tool has lost its argument. */
  const words = theFourWords();
  for (const w of ["terminal", "shell", "tty", "console"]) {
    if (!words.some((x) => x.term === w)) f.push(`theFourWords: "${w}" missing`);
  }
  return f;
}
