// ============================================================================
// src/lib/tools/chmod-permission-calculator/compute.ts
// ----------------------------------------------------------------------------
// CHMOD PERMISSION CALCULATOR: the pure, deterministic engine.
//
// A file mode is twelve bits: three special bits (set-user-ID 4000,
// set-group-ID 2000, restricted-deletion-or-sticky 1000) and nine permission
// bits (read 4, write 2, execute 1 for owner, group and others). This module
// reads a mode written any of the three ways people write it:
//
//   1. OCTAL, one to five digits ("755", "0644", "4755", "02775", "00755");
//   2. an ls -l STRING, nine characters or ten with the type letter
//      ("rwxr-xr-x", "-rwsr-xr-x", "drwxrwxrwt", "rwSr--r--");
//   3. a chmod SYMBOLIC expression ("u+x,go-w", "a=rX", "g+s,o-rwx", "=755"),
//      applied to a base mode (644 for a file, 755 for a directory unless
//      given) under a file mode creation mask (umask, 022 unless given),
//
// and gives back every other spelling plus the reading: which class may do
// what, what each special bit means for a file or a directory, the ls string
// with its s/S and t/T letters, the chmod commands that reach the mode, the
// umask that would create it, a trace of each symbolic clause, and flags for
// the combinations worth a second look.
//
// Sources, all read on 2026-10-03 (SOURCES below): POSIX.1-2024 chmod (the
// symbolic grammar, X, =, the umask rule when who is omitted, "o" with "s"),
// POSIX.1-2024 ls (the exact rule for s, S, t, T), the GNU coreutils manual
// "Mode Structure" (what the twelve bits mean for files and directories) and
// chmod(1) from coreutils 9.11 (directories keep setuid and setgid under a
// numeric mode unless 00755, -6000 or =755; what the sticky bit means).
//
// Nothing here touches a file system. Input is bounded (64 characters per
// field) and parsed by hand; no regular expression with nested quantifiers.
// ============================================================================

/** Which class of user a permission row belongs to. */
export type Who = "owner" | "group" | "other";

/** The three permission bits of one class. */
export interface Rwx {
  // Read (4): read the file; for a directory, list its entries.
  read: boolean;
  // Write (2): change the file; for a directory, create and remove entries.
  write: boolean;
  // Execute (1): run the file; for a directory, search it (access entries by name).
  execute: boolean;
}

/** The three special bits. */
export interface Special {
  // 4000: set-user-ID on execution.
  setuid: boolean;
  // 2000: set-group-ID on execution; on a directory, new entries take its group.
  setgid: boolean;
  // 1000: restricted deletion flag on a directory; "sticky bit" on a file.
  sticky: boolean;
}

/** One symbolic clause as applied, for the trace table. */
export interface ClauseStep {
  // The clause text as written ("u+x", "go-w", "a=rX").
  clause: string;
  // The classes it named ("ugo" when "a", or the implied classes when none).
  who: string;
  // Whether who was omitted (then the umask masks + and -, and = clears everything).
  whoOmitted: boolean;
  // The operator.
  op: "+" | "-" | "=";
  // The permission letters, or the class copied from (u, g or o).
  perm: string;
  // The mode after this clause, as four octal digits.
  after: string;
  // Notes about this clause, as message keys (see NOTE_KEYS).
  notes: string[];
}

/** What the input was recognised as. */
export type InputForm = "octal" | "ls" | "symbolic";

/** The kind of file the mode describes (it changes what the bits mean and what X does). */
export type Kind = "file" | "directory";

/** The input. */
export interface ChmodInput {
  // The mode in any accepted spelling.
  mode: string;
  // File or directory (default file).
  kind?: Kind;
  // The base mode a symbolic expression is applied to (octal or ls string; default 644 file, 755 directory).
  base?: string;
  // The file mode creation mask applied when a symbolic clause names no class (octal; default 022).
  umask?: string;
}

/** The result. */
export interface ChmodResult {
  // False when the input could not be read; then `error` says why.
  ok: boolean;
  // An error code when !ok (a message key under tools.chmod-permission-calculator.error).
  error?: string;
  // The offending text, when there is one.
  errorAt?: string;
  // What the input was read as.
  form?: InputForm;
  // File or directory, as used.
  kind: Kind;
  // The twelve-bit value.
  value: number;
  // Four octal digits ("0755", "4755").
  octal4: string;
  // Three octal digits, the special bits dropped ("755").
  octal3: string;
  // The nine-character permission string ("rwxr-xr-x", with s/S/t/T where they apply).
  symbolic: string;
  // The ten-character ls -l string ("-rwxr-xr-x" or "drwxr-xr-x").
  ls: string;
  // Twelve bits, grouped in fours ("0111 1101 1101").
  binary: string;
  // Per class, the three bits.
  classes: Record<Who, Rwx>;
  // The special bits.
  special: Special;
  // Flags worth a second look (message keys under tools.chmod-permission-calculator.flag).
  flags: string[];
  // Commands that reach this mode.
  commands: {
    // chmod with the absolute octal mode (four digits when a special bit is set).
    octal: string;
    // chmod with an absolute symbolic mode ("u=rwx,g=rx,o=rx").
    symbolicAbsolute: string;
    // chmod with the minimal symbolic change from the base (null when the input was not symbolic or nothing changes).
    fromBase: string | null;
  };
  // The umask that would create this mode from the kind's creation default (666 file, 777 directory), or null with a reason.
  umaskEquivalent: { umask: string | null; reason?: string };
  // The base the symbolic expression started from (four octal digits), when the input was symbolic.
  base?: string;
  // The umask used for clauses without a class, when the input was symbolic.
  umaskUsed?: string;
  // The clause trace, when the input was symbolic.
  steps?: ClauseStep[];
}

/** A source record, as the D-49 manifest lists them. */
export interface Source {
  // Stable id.
  id: string;
  // What it is.
  label: string;
  // Kind of source.
  type: "reference" | "implementation" | "vendor-docs" | "vendor-kb" | "vendor-community";
  // Where it is.
  url: string;
  // When it was read (ISO date).
  access_date: string;
  // What it was used for.
  scope: string;
}

/** The day every source below was read. */
const READ = "2026-10-03";

/** Build a source record. */
const src = (id: string, label: string, type: Source["type"], url: string, scope: string): Source => ({ id, label, type, url, access_date: READ, scope });

/** Every source, in the order the manifest lists them. */
export const SOURCES: Source[] = [
  // The grammar and semantics of symbolic and octal modes.
  src("posix-chmod", "POSIX.1-2024 (IEEE Std 1003.1-2024): chmod", "reference", "https://pubs.opengroup.org/onlinepubs/9799919799/utilities/chmod.html", "the symbolic_mode grammar (who u g o a, op + - =, perm r w x X s t, permcopy u g o); X sets execute only for a directory or a file that already has an execute bit; = clears the named bits first; when who is omitted, bits set in the file mode creation mask are not changed; s with o alone changes nothing; 4000, 2000 and 1000 are S_ISUID, S_ISGID and S_ISVTX"),
  // How ls prints the bits, including s, S, t and T.
  src("posix-ls", "POSIX.1-2024 (IEEE Std 1003.1-2024): ls", "reference", "https://pubs.opengroup.org/onlinepubs/9799919799/utilities/ls.html", "the ten-character mode string: the type letter, then r w x or - per class; s when set-user-ID or set-group-ID is set and the class can execute, S when it cannot; t when the restricted deletion flag is set and others can search, T when they cannot"),
  // What the twelve bits mean for files and directories.
  src("gnu-mode-structure", "GNU coreutils manual: Mode Structure", "reference", "https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html", "read lists a directory, write creates and removes its entries, execute accesses them; 4000 sets the effective user ID on execution, 2000 the effective group ID and on most systems gives files created in a directory the directory's group; 1000 keeps unprivileged users from removing or renaming entries they do not own"),
  // The GNU behaviours a calculator has to know about.
  src("chmod1", "chmod(1), GNU coreutils 9.11 (man7.org)", "reference", "https://man7.org/linux/man-pages/man1/chmod.1.html", "for directories chmod preserves set-user-ID and set-group-ID bits under a numeric mode unless the mode is written with an extra leading zero (00755), a leading minus (-6000) or a leading equals (=755); with no class given the effect is as if a were given but bits set in the umask are not affected; the restricted deletion flag on directories, and the historical meaning of the sticky bit on regular files on some older systems"),
];

/** The largest input accepted per field. */
const MAX_FIELD = 64;

/** Bit values. */
const BIT = {
  setuid: 0o4000, setgid: 0o2000, sticky: 0o1000,
  ur: 0o400, uw: 0o200, ux: 0o100,
  gr: 0o040, gw: 0o020, gx: 0o010,
  or: 0o004, ow: 0o002, ox: 0o001,
} as const;

/** The nine permission bits, as a mask. */
const PERM_MASK = 0o777;

/** All execute bits. */
const EXEC_MASK = BIT.ux | BIT.gx | BIT.ox;

/** Per class, its three bits in r, w, x order. */
const CLASS_BITS: Record<"u" | "g" | "o", [number, number, number]> = {
  u: [BIT.ur, BIT.uw, BIT.ux],
  g: [BIT.gr, BIT.gw, BIT.gx],
  o: [BIT.or, BIT.ow, BIT.ox],
};

/** Four octal digits for a value. */
export function toOctal4(value: number): string {
  // Masked to twelve bits, padded to four digits.
  return (value & 0o7777).toString(8).padStart(4, "0");
}

/** The nine-character permission string, with s/S and t/T as ls prints them. */
export function toSymbolic(value: number, kind: Kind): string {
  // One class at a time.
  const part = (r: number, w: number, x: number, specialBit: number, lower: string, upper: string): string => {
    // Read and write are plain.
    const rc = value & r ? "r" : "-";
    const wc = value & w ? "w" : "-";
    // The third position carries the special letter when its bit is set.
    const exec = (value & x) !== 0;
    const special = (value & specialBit) !== 0;
    // Lowercase when the class can execute, uppercase when it cannot (POSIX ls).
    const xc = special ? (exec ? lower : upper) : exec ? "x" : "-";
    return rc + wc + xc;
  };
  // Owner shows setuid, group shows setgid, others show the sticky bit.
  // POSIX ls prints t and T only for directories; GNU ls prints them for any
  // file with the bit set, and the bit itself is meaningful on a directory, so
  // the string shows it whenever it is set and the reading says what it means.
  void kind;
  return part(BIT.ur, BIT.uw, BIT.ux, BIT.setuid, "s", "S") + part(BIT.gr, BIT.gw, BIT.gx, BIT.setgid, "s", "S") + part(BIT.or, BIT.ow, BIT.ox, BIT.sticky, "t", "T");
}

/** Twelve bits grouped in fours. */
function toBinary(value: number): string {
  // Padded, then split 4-4-4.
  const b = (value & 0o7777).toString(2).padStart(12, "0");
  return `${b.slice(0, 4)} ${b.slice(4, 8)} ${b.slice(8, 12)}`;
}

/** Parse an octal mode of one to five digits; null when it is not one. */
function parseOctal(text: string): { value: number; digits: number } | { error: string; at: string } | null {
  // Only digits.
  if (!/^[0-9]+$/.test(text)) return null;
  // Too long for a mode.
  if (text.length > 5) return { error: "octal-too-long", at: text };
  // An 8 or a 9 is not octal.
  const bad = [...text].find((c) => c > "7");
  if (bad) return { error: "octal-digit", at: bad };
  // The value (a five-digit mode is still at most 7777).
  const value = parseInt(text, 8);
  if (value > 0o7777) return { error: "octal-range", at: text };
  return { value, digits: text.length };
}

/** Parse an ls -l style string of nine or ten characters; null when it is not one. */
function parseLs(text: string): { value: number; kindHint?: Kind } | { error: string; at: string } | null {
  // Nine positions, or ten with a type letter in front.
  let s = text;
  let kindHint: Kind | undefined;
  if (s.length === 10) {
    // The type letter: d for a directory, - for a regular file, the others are accepted and ignored.
    const t = s[0];
    if (!"-dlbcps".includes(t)) return null;
    kindHint = t === "d" ? "directory" : "file";
    s = s.slice(1);
  }
  // Must be nine of the permission letters.
  if (s.length !== 9) return null;
  if (!/^[rwxsStT-]+$/.test(s)) return null;
  // Each position accepts only its own letters.
  let value = 0;
  const classes: ("u" | "g" | "o")[] = ["u", "g", "o"];
  for (let i = 0; i < 3; i++) {
    // The three characters of this class.
    const r = s[i * 3], w = s[i * 3 + 1], x = s[i * 3 + 2];
    const [rb, wb, xb] = CLASS_BITS[classes[i]];
    // Read.
    if (r === "r") value |= rb; else if (r !== "-") return { error: "ls-position", at: `${r} (${i * 3 + 1})` };
    // Write.
    if (w === "w") value |= wb; else if (w !== "-") return { error: "ls-position", at: `${w} (${i * 3 + 2})` };
    // Execute, with the special letters: s/S on owner and group, t/T on others.
    const specialBit = i === 0 ? BIT.setuid : i === 1 ? BIT.setgid : BIT.sticky;
    const lower = i === 2 ? "t" : "s";
    const upper = lower.toUpperCase();
    if (x === "x") value |= xb;
    else if (x === lower) value |= xb | specialBit;
    else if (x === upper) value |= specialBit;
    else if (x !== "-") return { error: "ls-position", at: `${x} (${i * 3 + 3})` };
  }
  return { value, kindHint };
}

/** One parsed symbolic clause. */
interface Clause {
  // Text as written.
  text: string;
  // Classes named (letters u, g, o; "a" expands to all three).
  who: string;
  // Whether no class was written.
  whoOmitted: boolean;
  // The actions, in order.
  actions: { op: "+" | "-" | "="; perm: string }[];
}

/** Parse a comma-separated list of symbolic clauses; an error when the grammar is not met. */
function parseSymbolic(text: string): Clause[] | { error: string; at: string } {
  // Each clause.
  const clauses: Clause[] = [];
  for (const raw of text.split(",")) {
    // An empty clause ("u+x,,g-w") is not allowed.
    if (raw === "") return { error: "symbolic-empty-clause", at: text };
    // Leading classes.
    let i = 0;
    let who = "";
    while (i < raw.length && "ugoa".includes(raw[i])) who += raw[i++];
    // Expand a to ugo, and drop duplicates while keeping order.
    const expanded = [...new Set([...who.replace(/a/g, "ugo")])].join("");
    // At least one action.
    const actions: Clause["actions"] = [];
    while (i < raw.length) {
      // The operator.
      const op = raw[i];
      if (op !== "+" && op !== "-" && op !== "=") return { error: "symbolic-operator", at: raw };
      i++;
      // Either a permcopy letter alone, or zero or more permission letters.
      let perm = "";
      if (i < raw.length && "ugo".includes(raw[i]) && !(i + 1 < raw.length && "rwxXst".includes(raw[i + 1]))) {
        // A copy of a class's permissions.
        perm = raw[i++];
      } else {
        // Permission letters until the next operator.
        while (i < raw.length && "rwxXst".includes(raw[i])) perm += raw[i++];
        // Anything else here is a grammar error.
        if (i < raw.length && !"+-=".includes(raw[i])) return { error: "symbolic-perm", at: raw[i] };
      }
      actions.push({ op: op as "+" | "-" | "=", perm });
    }
    if (actions.length === 0) return { error: "symbolic-no-operator", at: raw };
    clauses.push({ text: raw, who: expanded, whoOmitted: who === "", actions });
  }
  return clauses;
}

/** Apply one symbolic clause to a mode under the POSIX rules; returns the new mode and notes. */
function applyClause(mode: number, clause: Clause, kind: Kind, umask: number): { mode: number; notes: string[]; whoApplied: string } {
  // Notes for the trace.
  const notes: string[] = [];
  // The classes acted on: the ones named, or all three when none was named.
  const who = clause.whoOmitted ? "ugo" : clause.who;
  // Each action in turn.
  let m = mode;
  for (const a of clause.actions) {
    // The bits the perm letters stand for, for these classes.
    let bits = 0;
    // Special bits asked for.
    let specials = 0;
    if ("ugo".includes(a.perm) && a.perm.length === 1) {
      // permcopy: take the r, w, x bits of that class as they stand now.
      const [sr, sw, sx] = CLASS_BITS[a.perm as "u" | "g" | "o"];
      const has = { r: (m & sr) !== 0, w: (m & sw) !== 0, x: (m & sx) !== 0 };
      for (const c of who) {
        const [r, w, x] = CLASS_BITS[c as "u" | "g" | "o"];
        if (has.r) bits |= r;
        if (has.w) bits |= w;
        if (has.x) bits |= x;
      }
      notes.push("permcopy");
    } else {
      // Permission letters.
      for (const p of a.perm) {
        for (const c of who) {
          const [r, w, x] = CLASS_BITS[c as "u" | "g" | "o"];
          if (p === "r") bits |= r;
          else if (p === "w") bits |= w;
          else if (p === "x") bits |= x;
          else if (p === "X") {
            // POSIX: execute/search only for a directory, or when some execute bit is already set.
            if (kind === "directory" || (m & EXEC_MASK) !== 0) bits |= x;
            else if (!notes.includes("x-skipped")) notes.push("x-skipped");
          }
        }
        // s follows the classes: u gives setuid, g gives setgid, o alone gives nothing (POSIX).
        if (p === "s") {
          if (who.includes("u")) specials |= BIT.setuid;
          if (who.includes("g")) specials |= BIT.setgid;
          if (!who.includes("u") && !who.includes("g")) notes.push("s-with-o");
        }
        // t is the restricted deletion flag; GNU applies it whatever class is named.
        if (p === "t") specials |= BIT.sticky;
      }
    }
    // When no class was named, bits set in the umask are left alone for + and - (POSIX, chmod(1)).
    const masked = clause.whoOmitted ? bits & ~umask : bits;
    if (clause.whoOmitted && masked !== bits) notes.push("umask-applied");
    // Apply.
    if (a.op === "+") {
      m |= masked | specials;
    } else if (a.op === "-") {
      m &= ~(masked | specials);
    } else {
      // = clears the named classes' bits (all twelve when no class was named), then sets.
      let clear = 0;
      for (const c of who) {
        const [r, w, x] = CLASS_BITS[c as "u" | "g" | "o"];
        clear |= r | w | x;
      }
      if (who.includes("u")) clear |= BIT.setuid;
      if (who.includes("g")) clear |= BIT.setgid;
      if (who.includes("o")) clear |= BIT.sticky;
      if (clause.whoOmitted) clear = 0o7777;
      m = (m & ~clear) | masked | specials;
    }
  }
  return { mode: m & 0o7777, notes, whoApplied: who };
}

/** The flags worth a second look for a mode. */
function flagsFor(value: number, kind: Kind): string[] {
  // Collected in a fixed order so vectors are stable.
  const f: string[] = [];
  const ow = (value & BIT.ow) !== 0, ox = (value & BIT.ox) !== 0;
  const setuid = (value & BIT.setuid) !== 0, setgid = (value & BIT.setgid) !== 0, sticky = (value & BIT.sticky) !== 0;
  // Nothing or everything.
  if ((value & PERM_MASK) === 0) f.push("no-permissions");
  if ((value & PERM_MASK) === PERM_MASK) f.push("all-permissions");
  // Others may write.
  if (ow && kind === "file") f.push("world-writable-file");
  if (ow && kind === "directory" && !sticky) f.push("world-writable-dir-no-sticky");
  if (ow && kind === "directory" && sticky) f.push("world-writable-dir-sticky");
  // A set-user-ID or set-group-ID program that others can write is the classic hole.
  if (ow && (setuid || setgid) && kind === "file") f.push("setid-world-writable");
  // Special bits without their execute bit (the capital S).
  if (setuid && !(value & BIT.ux)) f.push("setuid-without-execute");
  if (setgid && !(value & BIT.gx)) f.push("setgid-without-execute");
  // What the special bits mean here.
  if (setuid && kind === "file" && (value & BIT.ux)) f.push("setuid-file");
  if (setgid && kind === "file" && (value & BIT.gx)) f.push("setgid-file");
  if (setuid && kind === "directory") f.push("setuid-directory");
  if (setgid && kind === "directory") f.push("setgid-directory");
  if (sticky && kind === "directory") f.push("sticky-directory");
  if (sticky && kind === "file") f.push("sticky-file");
  if (sticky && kind === "directory" && !ox) f.push("sticky-no-search");
  // Odd combinations within a class.
  for (const c of ["u", "g", "o"] as const) {
    const [r, w, x] = CLASS_BITS[c];
    if ((value & x) && !(value & r)) f.push(`${c === "u" ? "owner" : c === "g" ? "group" : "other"}-execute-without-read`);
    if ((value & w) && !(value & r)) f.push(`${c === "u" ? "owner" : c === "g" ? "group" : "other"}-write-without-read`);
    if (kind === "directory" && (value & r) && !(value & x)) f.push(`${c === "u" ? "owner" : c === "g" ? "group" : "other"}-list-without-search`);
  }
  // The owner having less than the group or others is legal and usually a mistake.
  const u = (value >> 6) & 7, g = (value >> 3) & 7, o = value & 7;
  if ((u & g) !== g || (u & o) !== o) f.push("owner-less-than-others");
  return f;
}

/** The absolute symbolic form, class by class ("u=rwx,g=rx,o=rx", with s and t). */
function symbolicAbsolute(value: number): string {
  // Each class.
  const part = (c: "u" | "g" | "o"): string => {
    const [r, w, x] = CLASS_BITS[c];
    let p = "";
    if (value & r) p += "r";
    if (value & w) p += "w";
    if (value & x) p += "x";
    if (c === "u" && value & BIT.setuid) p += "s";
    if (c === "g" && value & BIT.setgid) p += "s";
    if (c === "o" && value & BIT.sticky) p += "t";
    return `${c}=${p}`;
  };
  return [part("u"), part("g"), part("o")].join(",");
}

/** The minimal symbolic change from one mode to another, or null when they are equal. */
function symbolicDiff(from: number, to: number): string | null {
  // Nothing to do.
  if (from === to) return null;
  // Per class, the letters added and removed.
  const parts: string[] = [];
  for (const c of ["u", "g", "o"] as const) {
    const [r, w, x] = CLASS_BITS[c];
    const special = c === "u" ? BIT.setuid : c === "g" ? BIT.setgid : BIT.sticky;
    const letter = c === "o" ? "t" : "s";
    let add = "", rem = "";
    for (const [bit, l] of [[r, "r"], [w, "w"], [x, "x"], [special, letter]] as [number, string][]) {
      const had = (from & bit) !== 0, has = (to & bit) !== 0;
      if (!had && has) add += l;
      if (had && !has) rem += l;
    }
    if (add) parts.push(`${c}+${add}`);
    if (rem) parts.push(`${c}-${rem}`);
  }
  return parts.join(",");
}

/** The umask that would create the mode from the creation default, or the reason there is none. */
function umaskEquivalent(value: number, kind: Kind): { umask: string | null; reason?: string } {
  // Special bits never come from a umask.
  if (value & 0o7000) return { umask: null, reason: "special-bits" };
  // The default a creating program asks for: 666 for a file, 777 for a directory.
  const def = kind === "file" ? 0o666 : 0o777;
  const perms = value & PERM_MASK;
  // Bits the default does not have (execute on a file) cannot be produced by masking.
  if ((perms & ~def) !== 0) return { umask: null, reason: "needs-execute" };
  // The mask is what the default has and the mode lacks.
  return { umask: (def & ~perms).toString(8).padStart(3, "0") };
}

/** Read a base or umask field written in octal or, for the base, as an ls string. */
function readMode(text: string, allowLs: boolean): number | { error: string; at: string } {
  // Octal first.
  const o = parseOctal(text);
  if (o && "value" in o) return o.value;
  if (o && "error" in o) return o;
  // Then the ls form.
  if (allowLs) {
    const l = parseLs(text);
    if (l && "value" in l) return l.value;
    if (l && "error" in l) return l;
  }
  return { error: allowLs ? "base-unreadable" : "umask-unreadable", at: text };
}

/** The empty result for an error. */
function fail(error: string, at: string, kind: Kind): ChmodResult {
  // Everything zeroed; the UI reads ok and error.
  return {
    ok: false, error, errorAt: at, kind, value: 0, octal4: "0000", octal3: "000", symbolic: "---------", ls: (kind === "directory" ? "d" : "-") + "---------", binary: toBinary(0),
    classes: { owner: { read: false, write: false, execute: false }, group: { read: false, write: false, execute: false }, other: { read: false, write: false, execute: false } },
    special: { setuid: false, setgid: false, sticky: false }, flags: [],
    commands: { octal: "", symbolicAbsolute: "", fromBase: null }, umaskEquivalent: { umask: null },
  };
}

/** The main entry: read a mode in any spelling and describe it. */
export function run(input: ChmodInput): ChmodResult {
  // Bound and trim the fields.
  const modeText = (input.mode ?? "").trim();
  // The kind: as given, else from the type letter of a ten-character ls string ("d" is a directory), else a file.
  const kindGiven: Kind | undefined = input.kind === "directory" ? "directory" : input.kind === "file" ? "file" : undefined;
  const lsTypeHint: Kind | undefined = /^[d-][rwxsStT-]{9}$/.test(modeText) ? (modeText[0] === "d" ? "directory" : "file") : undefined;
  const kind: Kind = kindGiven ?? lsTypeHint ?? "file";
  if (modeText.length === 0) return fail("empty", "", kind);
  if (modeText.length > MAX_FIELD) return fail("too-long", String(modeText.length), kind);
  const baseText = (input.base ?? "").trim();
  const umaskText = (input.umask ?? "").trim();
  if (baseText.length > MAX_FIELD) return fail("too-long", String(baseText.length), kind);
  if (umaskText.length > MAX_FIELD) return fail("too-long", String(umaskText.length), kind);

  // 1. Octal.
  let value: number | null = null;
  let form: InputForm | null = null;
  let steps: ClauseStep[] | undefined;
  let base: number | undefined;
  let umaskUsed: number | undefined;
  let fromBaseValue: number | undefined;
  const octal = parseOctal(modeText);
  if (octal && "error" in octal) return fail(octal.error, octal.at, kind);
  if (octal) {
    // A plain number describes the mode itself.
    value = octal.value;
    form = "octal";
    // chmod(1): on a directory, a numeric mode of up to four digits keeps the existing
    // set-user-ID and set-group-ID bits; the trace records that when a base is given.
    if (baseText !== "" && kind === "directory") {
      const b = readMode(baseText, true);
      if (typeof b !== "number") return fail(b.error, b.at, kind);
      base = b;
      const preserved = b & (BIT.setuid | BIT.setgid);
      if (octal.digits <= 4 && preserved && !(value & preserved)) {
        value |= preserved;
        steps = [{ clause: modeText, who: "ugo", whoOmitted: false, op: "=", perm: modeText, after: toOctal4(value), notes: ["gnu-dir-preserves-special"] }];
      }
      fromBaseValue = b;
    }
  }

  // 2. ls string.
  if (value === null) {
    const ls = parseLs(modeText);
    if (ls && "error" in ls) return fail(ls.error, ls.at, kind);
    if (ls) {
      value = ls.value;
      form = "ls";
    }
  }

  // Something shaped like an ls string that did not parse is an ls typo, not a symbolic expression.
  if (value === null && /^[rwxsStTd-]{9,10}$/.test(modeText)) return fail("ls-position", modeText, kind);

  // 3. Symbolic clauses, applied to the base under the umask.
  if (value === null) {
    // GNU also accepts a numeric mode with a leading = or - ("=755", "-6000"); read those as clauses on the base.
    const leading = modeText[0] === "=" || modeText[0] === "-" || modeText[0] === "+";
    const numericTail = leading ? parseOctal(modeText.slice(1)) : null;
    const clauses = numericTail && "value" in numericTail ? null : parseSymbolic(modeText);
    if (clauses && "error" in clauses) return fail(clauses.error, clauses.at, kind);
    // The base.
    const b = baseText === "" ? (kind === "directory" ? 0o755 : 0o644) : readMode(baseText, true);
    if (typeof b !== "number") return fail(b.error, b.at, kind);
    // The umask.
    const um = umaskText === "" ? 0o022 : readMode(umaskText, false);
    if (typeof um !== "number") return fail(um.error, um.at, kind);
    base = b;
    umaskUsed = um;
    fromBaseValue = b;
    form = "symbolic";
    steps = [];
    let m = b;
    if (numericTail && "value" in numericTail) {
      // GNU's numeric mode with an operator: = sets exactly, + adds, - removes (special bits included).
      const n = numericTail.value;
      const op = modeText[0] as "+" | "-" | "=";
      m = op === "=" ? n : op === "+" ? m | n : m & ~n;
      steps.push({ clause: modeText, who: "ugo", whoOmitted: false, op, perm: modeText.slice(1), after: toOctal4(m), notes: ["gnu-numeric-operator"] });
    } else {
      // Each clause in order.
      for (const c of clauses as Clause[]) {
        const r = applyClause(m, c, kind, um);
        m = r.mode;
        for (const a of c.actions) steps.push({ clause: c.text, who: r.whoApplied, whoOmitted: c.whoOmitted, op: a.op, perm: a.perm, after: toOctal4(m), notes: r.notes });
      }
    }
    value = m;
  }

  // The spellings.
  const v = value & 0o7777;
  const symbolic = toSymbolic(v, kind);
  const special: Special = { setuid: (v & BIT.setuid) !== 0, setgid: (v & BIT.setgid) !== 0, sticky: (v & BIT.sticky) !== 0 };
  const classes: Record<Who, Rwx> = {
    owner: { read: (v & BIT.ur) !== 0, write: (v & BIT.uw) !== 0, execute: (v & BIT.ux) !== 0 },
    group: { read: (v & BIT.gr) !== 0, write: (v & BIT.gw) !== 0, execute: (v & BIT.gx) !== 0 },
    other: { read: (v & BIT.or) !== 0, write: (v & BIT.ow) !== 0, execute: (v & BIT.ox) !== 0 },
  };
  // The commands: four digits whenever a special bit is set, three otherwise.
  const octalArg = v & 0o7000 ? toOctal4(v) : toOctal4(v).slice(1);
  const result: ChmodResult = {
    ok: true, form: form ?? undefined, kind, value: v,
    octal4: toOctal4(v), octal3: toOctal4(v).slice(1), symbolic, ls: (kind === "directory" ? "d" : "-") + symbolic, binary: toBinary(v),
    classes, special, flags: flagsFor(v, kind),
    commands: {
      octal: `chmod ${octalArg} <path>`,
      symbolicAbsolute: `chmod ${symbolicAbsolute(v)} <path>`,
      fromBase: fromBaseValue === undefined ? null : (symbolicDiff(fromBaseValue, v) ? `chmod ${symbolicDiff(fromBaseValue, v)} <path>` : null),
    },
    umaskEquivalent: umaskEquivalent(v, kind),
  };
  if (base !== undefined) result.base = toOctal4(base);
  if (umaskUsed !== undefined) result.umaskUsed = (umaskUsed & 0o777).toString(8).padStart(3, "0");
  if (steps) result.steps = steps;
  return result;
}
