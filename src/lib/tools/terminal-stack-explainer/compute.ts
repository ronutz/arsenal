// ============================================================================
// src/lib/tools/terminal-stack-explainer/compute.ts
// ----------------------------------------------------------------------------
// TERMINAL STACK EXPLAINER - the pure engine.
//
// THE QUESTION. Terminal, shell, TTY, console. Every engineer uses all four
// daily and most cannot say where one ends and the next begins, because the
// words are used loosely by everyone including the documentation.
//
// This takes a terminal device path - the thing `tty` prints - and says which
// layer it belongs to, what created it, and what that implies about signals,
// job control and what happens when the window closes.
//
// *** THE ONE SENTENCE THAT SORTS THE WHOLE THING ***
//
//   The terminal is a PROGRAM (or was once a machine). The shell is A PROCESS
//   LIKE ANY OTHER. The TTY is a KERNEL OBJECT sitting between them. The
//   console is A PARTICULAR TERMINAL - the one attached to the machine itself.
//
// From the kernel's point of view a shell is not special: it is a process with
// stdin and stdout connected to whatever file descriptors it inherited. All the
// behaviour people attribute to "the terminal" - line editing, echo, Ctrl+C
// producing a signal - happens in the TTY layer, in the LINE DISCIPLINE, and is
// done by the kernel rather than by bash or by the emulator.
//
// SCOPE. Deterministic and offline. It reads a path, not a system.
// ============================================================================

export type Layer = "kernel-tty" | "pseudoterminal" | "virtual-console" | "serial" | "system-console" | "not-a-tty" | "unknown";

export interface DeviceFacts {
  path: string;
  layer: Layer;
  /** Short name for the kind of device. */
  kind: string;
  /** What sits on the other end - who holds the master, or drives the hardware. */
  otherEnd: string;
  facts: { label: string; value: string }[];
  notes: string[];
  warnings: string[];
}

export class TerminalInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TerminalInputError";
  }
}

/** Explain a terminal device path, as `tty` would print it. */
export function explainDevice(input: string): DeviceFacts {
  const raw = (input ?? "").trim();
  if (!raw) throw new TerminalInputError("Nothing to explain: paste what `tty` printed, or a device path such as /dev/pts/3.");

  const notes: string[] = [];
  const warnings: string[] = [];
  const facts: { label: string; value: string }[] = [];
  const lower = raw.toLowerCase();

  // `tty` says this when standard input is not a terminal at all.
  if (lower.includes("not a tty")) {
    notes.push(
      "This is what `tty` prints when standard input is a pipe or a file rather than a terminal. It is the single most useful thing the command tells you: a program in this position has no terminal to ask about window size, no line discipline doing echo, and no job control. Interactive prompts will not work and progress bars will look wrong.",
    );
    notes.push(
      "It is also how a program should decide whether to colourise its output. The check is whether the file descriptor is a terminal, not whether a variable is set - which is why piping a command into `less` usually turns the colours off by itself.",
    );
    return { path: raw, layer: "not-a-tty", kind: "no terminal", otherEnd: "a pipe or a file", facts, notes, warnings };
  }

  const path = raw.startsWith("/dev/") ? raw : raw.startsWith("dev/") ? `/${raw}` : raw;

  // --- /dev/pts/N : the slave side of a pseudoterminal ----------------------
  const pts = /^\/dev\/pts\/(\d+)$/.exec(path);
  if (pts) {
    facts.push({ label: "Device", value: path });
    facts.push({ label: "Layer", value: "pseudoterminal slave" });
    facts.push({ label: "Number", value: pts[1] });
    notes.push(
      "A pseudoterminal is a pair. Something in userspace holds the MASTER - a terminal emulator, sshd, tmux, screen - and the shell is handed this SLAVE and treats it as its terminal. Bytes written on either end come out of the other.",
    );
    notes.push(
      "The number is allocated, not meaningful. Open a new tab, a new SSH session or a new tmux pane and you get a different one; close them and the numbers are reused. Two shells with consecutive numbers are not related.",
    );
    notes.push(
      "Modern Linux allocates these by opening /dev/ptmx, which returns the master and creates the matching slave under /dev/pts.",
    );
    notes.push(
      "This is why closing a terminal window ends what was running in it: the master goes away, the kernel hangs up the line, and the session leader gets SIGHUP. Running something under nohup, or in a multiplexer that keeps holding the master, is what breaks that chain.",
    );
    return { path, layer: "pseudoterminal", kind: "pseudoterminal slave (pts)", otherEnd: "a terminal emulator, sshd, tmux or screen holding the master", facts, notes, warnings };
  }

  // --- /dev/ttyN : a Linux virtual console ---------------------------------
  const vc = /^\/dev\/tty(\d+)$/.exec(path);
  if (vc) {
    facts.push({ label: "Device", value: path });
    facts.push({ label: "Layer", value: "virtual console" });
    facts.push({ label: "Number", value: vc[1] });
    notes.push(
      "This is a virtual console: the kernel driving the machine's own keyboard and screen directly, with no emulator and no window system in the path. Reached with Ctrl+Alt+F-something, and traditionally there are a handful of them.",
    );
    notes.push(
      "Virtual is the right word and it is worth unpacking. The REAL terminal was a separate machine on the end of a cable - a teletype, later a video terminal. A virtual console gives you several independent login sessions on one physical keyboard and screen, which is exactly what several real terminals used to provide.",
    );
    notes.push(
      "Because nothing in userspace is holding a master, this survives things a pseudoterminal does not. It is where you end up when the display server has died and is the reason the key combination is worth remembering before you need it.",
    );
    return { path, layer: "virtual-console", kind: "virtual console", otherEnd: "the kernel, driving the physical keyboard and screen", facts, notes, warnings };
  }

  // --- /dev/ttyS0, ttyUSB0, ttyAMA0 : a real serial line -------------------
  const ser = /^\/dev\/tty(S|USB|ACM|AMA|PS)(\d+)$/.exec(path);
  if (ser) {
    const kindName = ser[1] === "S" ? "on-board serial port" : ser[1] === "USB" || ser[1] === "ACM" ? "USB serial adapter" : "SoC serial port";
    facts.push({ label: "Device", value: path });
    facts.push({ label: "Layer", value: "serial line" });
    facts.push({ label: "Kind", value: kindName });
    notes.push(
      "This is a real serial line, and it is the case the whole abstraction was built for. A terminal on the end of a cable, speaking at an agreed baud rate, is what TTY originally meant - the name is short for teletypewriter.",
    );
    notes.push(
      "It is also the one that still matters in this industry. A console cable into a switch or a firewall lands here, and it works when the network does not - which is the entire reason the port exists on equipment that otherwise has no need of one.",
    );
    warnings.push(
      "Serial parameters are not negotiated. Baud rate, data bits, parity and stop bits must match at both ends, and a mismatch produces plausible-looking rubbish rather than silence - which is why a console that shows garbage is usually a speed setting rather than a broken cable.",
    );
    return { path, layer: "serial", kind: kindName, otherEnd: "whatever is on the other end of the cable", facts, notes, warnings };
  }

  // --- /dev/tty : the controlling terminal, whatever it is -----------------
  if (path === "/dev/tty") {
    facts.push({ label: "Device", value: path });
    facts.push({ label: "Layer", value: "controlling terminal" });
    notes.push(
      "This is not a device in its own right. It is a synonym for whatever terminal is CONTROLLING the calling process - so it means something different to every process that opens it.",
    );
    notes.push(
      "That is what makes it useful: writing here reaches the user even when standard output has been redirected to a file. A password prompt does this, which is why you cannot capture one by redirecting output.",
    );
    notes.push(
      "A terminal can be the controlling terminal of at most one session. The association is inherited across fork, and a process breaks it by calling setsid - which is what daemons do so that closing a terminal cannot kill them.",
    );
    return { path, layer: "kernel-tty", kind: "the controlling terminal of the calling process", otherEnd: "whichever terminal owns this session", facts, notes, warnings };
  }

  // --- /dev/console : the system console -----------------------------------
  if (path === "/dev/console") {
    facts.push({ label: "Device", value: path });
    facts.push({ label: "Layer", value: "system console" });
    notes.push(
      "The system console is where the kernel talks: boot messages, panics, anything printed before userspace exists to receive it. Where it points is set at boot, and on a server it is frequently the serial port rather than the screen.",
    );
    notes.push(
      "This is the sense of console that has nothing to do with a console window. The overloading of that word is most of why these four terms are confusing: console can mean the machine's own attached terminal, the kernel's message destination, or a graphical application, depending entirely on who is speaking.",
    );
    return { path, layer: "system-console", kind: "system console", otherEnd: "the kernel", facts, notes, warnings };
  }

  facts.push({ label: "Device", value: path });
  warnings.push(
    "This is not a device path this tool recognises. It reports what it can identify and does not guess: an unfamiliar path is more likely a platform-specific device than something to be inferred from its name.",
  );
  return { path, layer: "unknown", kind: "unrecognised", otherEnd: "unknown", facts, notes, warnings };
}

/** The four words, and the one-line distinction between them. */
export function theFourWords(): { term: string; oneLine: string }[] {
  return [
    { term: "terminal", oneLine: "A program that draws characters and sends keystrokes - or, once, a machine that did. It has no idea what a command is." },
    { term: "shell", oneLine: "A process like any other, reading lines and running programs. The kernel gives it no special status whatsoever." },
    { term: "tty", oneLine: "The kernel object between the two, doing line editing, echo, and turning Ctrl+C into a signal. This is where the behaviour lives." },
    { term: "console", oneLine: "A particular terminal: the one attached to the machine itself, and where the kernel prints when nothing else exists yet." },
  ];
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: string): DeviceFacts {
  return explainDevice(input);
}
