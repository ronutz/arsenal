// ============================================================================
// src/lib/tools/python-traceback-explainer/compute.ts
// ----------------------------------------------------------------------------
// The engine of the Python traceback explainer: a pasted CPython traceback is
// read line by line, once, into its parts, and each part is explained against
// the Python documentation. Pure and deterministic: no network, no clock, no
// randomness, no DOM. Nothing is evaluated; the paste is only read.
//
// WHAT IT READS (CPython 3.11 to 3.15, the supported releases on 2026-10-27:
// devguide.python.org/versions, read that day)
//   - the header "Traceback (most recent call last):" and the frames under it,
//     outermost first: '  File "<file>", line <n>, in <function>', then the
//     source line(s) indented four spaces (traceback module documentation:
//     FrameSummary, StackSummary.format; Lib/traceback.py of 3.11 to 3.13 as
//     installed);
//   - the position markers of PEP 657 (3.11+): a line of ^ under the
//     expression the frame was running, and, where the expression has parts,
//     ~ under the operands with ^ under the operator (a binary operation), the
//     brackets of a subscript, or, from 3.13, the brackets of a call
//     (_extract_caret_anchors_from_line_segment in Lib/traceback.py; What's New
//     3.11 and the traceback documentation's 3.13 examples). Markers are placed
//     by display column: a wide or fullwidth character takes two columns
//     (traceback._display_width; widths.ts). From 3.13 an expression may span
//     several lines, shown with "...<N lines>..." for the lines left out;
//   - "  [Previous line repeated N more times]" (StackSummary.format: after
//     three identical frames the rest are counted, not shown);
//   - the exception line "<type>: <message>", or "<type>" alone when the
//     message is empty, where <type> is module.qualname except for classes of
//     builtins and __main__ (format_exception_only); then the lines that
//     follow it, which are the rest of a multi-line message or the notes added
//     with add_note() (PEP 678, 3.11+): the text alone cannot tell them apart;
//   - the SyntaxError location block '  File "<file>", line <n>' (no "in"),
//     the offending line and its ^ markers, which CPython prints instead of a
//     frame when the file did not compile, with no header when the main
//     script itself failed (runs on 3.11 to 3.14);
//   - the two banners of chained exceptions (PEP 3134): "The above exception
//     was the direct cause of the following exception:" (raise ... from,
//     __cause__) and "During handling of the above exception, another
//     exception occurred:" (implicit, __context__); "raise ... from None"
//     prints no banner (PEP 409, PEP 415);
//   - exception groups (PEP 654, 3.11+): the "Exception Group Traceback" box,
//     a margin of "|" per nesting level, "+-+---- 1 ----" titles, "and N more
//     exceptions" after 15 members and "... (max_group_depth is 10)" past ten
//     levels (TracebackException's max_group_width and max_group_depth);
//   - the lines CPython prints before some tracebacks: "Exception in thread
//     <name>:" (threading.excepthook) and "Exception ignored in: ..."
//     (sys.unraisablehook); other lines before the header are left unread.
//
// WHAT IT SAYS
//   - each exception: its type looked up in exceptions.ts (built-ins and the
//     standard-library classes network scripts meet), with the class chain and
//     the release that added it; CPython's own suggestion when the message
//     carries one ("Did you mean", "Did you forget to import", "consider
//     renaming"); errno and its text for OSError messages; the codec, byte and
//     position of a UnicodeDecodeError or UnicodeEncodeError;
//   - each frame: file, line, function, the source line(s), what the markers
//     point at, and whether the file is your code, the standard library, an
//     installed package, a frozen module or a pseudo-file such as <stdin>;
//   - where to look first: the innermost frame of the last exception printed,
//     or, when that frame is in the standard library or an installed package,
//     the last frame of your own code before it (a reading, not a verdict);
//   - which releases the format points to, from evidence in the text;
//   - what in the paste may be sensitive (a user name in a home directory,
//     and the secrets check of code-to-image), with a redacted copy.
//
// Every pattern is linear: anchored or sticky expressions over character
// classes that cannot overlap, and indexOf / lastIndexOf scans. The input is
// bounded (MAX_INPUT_CHARS, MAX_LINES, MAX_LINE_CHARS) and group nesting is
// bounded (MAX_NESTING).
// ============================================================================

import { KNOWN_EXCEPTIONS, type KnownException } from "./exceptions"; // the exception table
import { columnsOf } from "./widths"; // display widths
import { scanSecrets, type SecretRule } from "../code-to-image/secrets"; // the site's secrets check, reused as is

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

/** The longest paste read, in UTF-16 code units (a long log excerpt; CPython collapses deep recursion). */
export const MAX_INPUT_CHARS = 200_000; // bounded before any work
/** The most lines read. */
export const MAX_LINES = 5_000; // a traceback of 5,000 lines is already a log file
/** The longest single line read. */
export const MAX_LINE_CHARS = 5_000; // a minified source line can be long; past this the paste is refused
/** The deepest group nesting followed (CPython prints ten levels by default). */
export const MAX_NESTING = 40; // margins deeper than this are refused
/** How many leaf exceptions of a group are analysed for "where to look first". */
export const MAX_LEAVES = 20; // the first twenty
/** Lines longer than this are not given to the secrets check (it slows down on very long lines); a note says so. */
export const SECRET_SCAN_MAX_LINE = 2_000; // at most about 4 ms per such line in the tests

// ---------------------------------------------------------------------------
// The supported releases (devguide.python.org/versions, read 2026-10-27)
// ---------------------------------------------------------------------------

/** One supported release: its minor number, status and end of life as the Developer's Guide states them. */
export interface SupportedRelease { minor: number; status: "bugfix" | "security"; endOfLife: string }
/** The releases whose formats the tool reads, newest first. 3.10 reached end of life on 2026-10-01. */
export const SUPPORTED_RELEASES: readonly SupportedRelease[] = Object.freeze([
  { minor: 15, status: "bugfix", endOfLife: "2031-10" }, // 3.15, first released 2026-10-09
  { minor: 14, status: "bugfix", endOfLife: "2030-10" }, // 3.14
  { minor: 13, status: "security", endOfLife: "2029-10" }, // 3.13
  { minor: 12, status: "security", endOfLife: "2028-10" }, // 3.12
  { minor: 11, status: "security", endOfLife: "2027-10" }, // 3.11
]); // SUPPORTED_RELEASES

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/** Why a paste was refused. */
export type TbErrorCode = "empty" | "too-long" | "too-many-lines" | "line-too-long" | "no-traceback" | "too-deep";

/** A note about the paste or the reading (each has a message in the page's language). */
export type TbNoteCode =
  | "bom-removed" // a byte order mark was removed
  | "crlf" // CR LF or CR line breaks were read as LF
  | "colour-removed" // ANSI colour codes were removed (3.13+ colours tracebacks on a terminal)
  | "nbsp" // no-break spaces at the start of lines were read as spaces
  | "indented" // the whole traceback was indented; the indentation was removed
  | "preamble" // lines before the traceback were not read
  | "thread" // printed by threading.excepthook for an exception in a thread
  | "unraisable" // printed by sys.unraisablehook ("Exception ignored in")
  | "another-traceback" // a second traceback starts later in the paste
  | "trailing" // lines after the traceback were not read
  | "incomplete" // a block ends without its exception line (a cut paste)
  | "extra-lines" // lines after an exception line: message continuation or notes
  | "locals" // local variables were printed (capture_locals, unittest --locals)
  | "no-markers" // frames show source but no position markers anywhere
  | "marker-mismatch" // a marker line is wider than its source line
  | "group-count" // a group's "(N sub-exceptions)" disagrees with the members shown
  | "foreign-format" // the paste looks like another tool's report, not CPython's
  | "sensitive" // the paste holds something that may be sensitive
  | "secrets-skipped"; // some lines were too long for the secrets check

/** A note with its parameters. */
export interface TbNote { code: TbNoteCode; params?: Record<string, string | number> }

/** Where a frame's file lives, read from its path. */
export type FileKind = "own" | "stdlib" | "third-party" | "frozen" | "stdin" | "repl" | "string" | "pseudo";

/** What the markers point at in one frame. */
export interface Mark {
  /** The text under the markers (several lines joined with LF when the expression spans lines). */
  expression: string;
  /** The text under ^ when the line also has ~ (the operator, the subscript or the call), else null. */
  focus: string | null;
  /** What the ^ part is, when ~ is present: the brackets of a call, of a subscript, or an operator. */
  focusKind: "call" | "subscript" | "operator" | null;
  /** Each run of text under ~ (the operands, the subscripted value, the called object), trimmed, else null. */
  rest: string[] | null;
  /** First marked code point on the first marked source line (0-based, in the line as shown). */
  start: number;
  /** One past the last marked code point on that line, when the expression ends on it; else null. */
  end: number | null;
  /** How many shown source lines carry markers. */
  lines: number;
}

/** One frame of a traceback. */
export interface FrameNode {
  /** The paste line of '  File "...", line N, in name'. */
  pasteLine: number;
  /** The file as printed. */
  file: string;
  /** The line number, or null when CPython printed "None". */
  lineno: number | null;
  /** The function (code object) name: a name, or <module>, <lambda>, <listcomp>, <genexpr> ... */
  func: string;
  /** Where the file lives. */
  kind: FileKind;
  /** The source lines shown, without the four-space indent (empty when the source was not available). */
  source: string[];
  /** The marker line under each source line (without the indent), or null. */
  markers: (string | null)[];
  /** Lines left out of a multi-line expression ("...<N lines>..."), in total. */
  elided: number;
  /** Local variables printed under the frame (name and repr), if any. */
  locals: { name: string; value: string }[];
  /** How many more identical frames "[Previous line repeated N more times]" stands for. */
  repeated: number;
  /** What the markers point at, or null. */
  mark: Mark | null;
}

/** The SyntaxError location block. */
export interface LocationNode {
  /** The paste line of '  File "...", line N'. */
  pasteLine: number;
  /** The file as printed. */
  file: string;
  /** The line number. */
  lineno: number;
  /** The offending line as shown (without the indent), or null. */
  text: string | null;
  /** The marker line (without the indent), or null. */
  marker: string | null;
  /** The marked text, or null. */
  marked: string | null;
  /** 1-based column of the first marker in the shown line, or null. */
  column: number | null;
}

/** A suggestion CPython itself added to the message. */
export interface Suggestion {
  /** Which kind (each has a message in the page's language). */
  kind: "did-you-mean" | "forgot-import" | "shadows-stdlib" | "shadows-library";
  /** The suggested name, or the module name for the shadowing forms. */
  value: string;
  /** The script that shadows the module, for the shadowing forms. */
  path?: string;
}

/** An exception printed in the traceback. */
export interface ExcNode {
  /** A stable id in the tree: "1", "2" at the top; "2.1.1" for the first exception of group member 1 of exception 2. */
  id: string;
  /** The paste line of the exception line, or null. */
  pasteLine: number | null;
  /** The type as printed, or null when the block has no exception line. */
  type: string | null;
  /** The module part of the type, or null for a bare name (a built-in or a class of __main__). */
  module: string | null;
  /** The class part of the type. */
  className: string | null;
  /** The text after ": " on the exception line, or null when there is none. */
  message: string | null;
  /** The lines after the exception line: the rest of the message, or notes (PEP 678). */
  extra: string[];
  /** Whether a "Traceback (most recent call last):" or "Exception Group Traceback" header was printed. */
  hasTraceback: boolean;
  /** Whether the header was the exception-group one. */
  groupHeader: boolean;
  /** The frames, outermost first. */
  frames: FrameNode[];
  /** The SyntaxError location block, if any. */
  location: LocationNode | null;
  /** The table entry for the type, if it is known. */
  known: KnownException | null;
  /** The hint id for the page's message, if there is one. */
  hint: string | null;
  /** CPython's own suggestions found in the message. */
  suggestions: Suggestion[];
  /** errno and its text, for messages of the form "[Errno N] text" or "[WinError N] text". */
  oserror: { errno: number; text: string; windows: boolean } | null;
  /** Codec details of a UnicodeDecodeError or UnicodeEncodeError message. */
  codec: { codec: string; what: string; position: string; reason: string } | null;
  /** The members of an exception group: each member is a chain. */
  group: { members: ChainItem[][]; more: number; declared: number | null } | null;
  /** "... (max_group_depth is N)": the group was not printed past this depth. */
  depthLimited: number | null;
}

/** A link between consecutive exceptions of a chain, as the banner after the earlier one says. */
export type LinkKind = "cause" | "context";

/** One exception of a chain and the banner printed after it (null after the last). */
export interface ChainItem { exc: ExcNode; link: LinkKind | null }

/** "Where to look first", for one exception. */
export interface FirstLook {
  /** The exception it is about. */
  exc: string;
  /** What the reading is. */
  kind: "raised-here" | "raised-explicitly" | "last-own-frame" | "all-library" | "syntax" | "no-traceback" | "recursion" | "interrupted" | "incomplete" | "group-depth";
  /** The frame to look at (an index into that exception's frames), or null. */
  frame: number | null;
  /** The innermost frame's file kind, when the reading points away from it. */
  innerKind: FileKind | null;
  /** The earlier exception of the chain, when the final one is linked to it, with its own reading. */
  previous: { exc: string; link: LinkKind; look: FirstLook } | null;
}

/** One piece of evidence about the release that printed the traceback. */
export interface ReleaseEvidence {
  /** What was seen (each has a message in the page's language). */
  code: "path-version" | "call-markers" | "multi-line" | "markers" | "comprehension-frame" | "group" | "python-input" | "forgot-import" | "consider-renaming" | "suggestion-no-colon" | "known-type";
  /** The lowest release it fits (minor number), or null. */
  min: number | null;
  /** The highest release it fits (minor number), or null. */
  max: number | null;
  /** The paste line where it was seen. */
  line: number;
  /** A detail, e.g. the version in a path or the type name. */
  detail?: string;
}

/** What the evidence adds up to. */
export interface ReleaseReading {
  /** Every piece of evidence, in paste order (at most one per code and detail). */
  evidence: ReleaseEvidence[];
  /** The lowest release the evidence allows (minor number), or null. */
  min: number | null;
  /** The highest release the evidence allows (minor number), or null. */
  max: number | null;
  /** Whether two pieces contradict each other. */
  conflict: boolean;
}

/** Something in the paste that may be sensitive. */
export interface SensitiveFinding {
  /** The rule: "home-directory" (a user name in a path), or one of the code-to-image secrets rules. */
  rule: "home-directory" | SecretRule;
  /** The paste line. */
  line: number;
  /** The 1-based column of the first character replaced in the redacted copy. */
  column: number;
  /** A safe label: the header, key or attribute name; for home directories the path prefix with <user>. */
  label: string;
  /** How many times it appears (home directories are reported once per prefix and name; secrets once each). */
  count: number;
}

/** The whole reading of a paste. */
export interface TracebackResult {
  /** Whether a traceback was read. */
  ok: boolean;
  /** Why not, when ok is false. */
  error: { code: TbErrorCode; params?: Record<string, number> } | null;
  /** Notes about the paste and the reading. */
  notes: TbNote[];
  /** The top-level chain, oldest first: the last item is the exception the traceback ends with. */
  chain: ChainItem[];
  /** The paste line where the traceback starts, or null. */
  startLine: number | null;
  /** "Where to look first": one reading for an ordinary exception, one per leaf (up to MAX_LEAVES) for a group. */
  firstLook: FirstLook[];
  /** What the format says about the release. */
  release: ReleaseReading;
  /** What may be sensitive. */
  sensitive: SensitiveFinding[];
  /** The paste (normalised) with user names replaced by <user> and secrets by [redacted]. */
  redacted: string;
  /** Counts. */
  stats: { exceptions: number; frames: number; groups: number; lines: number };
}

// ---------------------------------------------------------------------------
// Fixed texts of the format (Lib/traceback.py; the runs in the vectors)
// ---------------------------------------------------------------------------

/** The header of a traceback. */
const TB_HEADER = "Traceback (most recent call last):"; // format(): emitted when the exception has a stack
/** The header of an exception group's traceback. */
const GROUP_HEADER = "Exception Group Traceback (most recent call last):"; // format(): for a group with a stack
/** The explicit-chaining banner (raise ... from). */
const CAUSE_BANNER = "The above exception was the direct cause of the following exception:"; // _cause_message
/** The implicit-chaining banner. */
const CONTEXT_BANNER = "During handling of the above exception, another exception occurred:"; // _context_message
/** The prefix of a frame line. */
const FRAME_PREFIX = '  File "'; // StackSummary.format_frame_summary
/** The separator between the file and the line number. */
const LINE_SEP = '", line '; // the same
/** A repeat line: "  [Previous line repeated 996 more times]". */
const REPEAT_RE = /^ {2}\[Previous line repeated (\d{1,9}) more times?\]$/; // anchored, one digit class
/** A marker line (after the four-space indent): spaces, then ~ and ^ only. */
const MARKER_RE = /^ *[~^]+$/; // anchored, two classes that do not overlap
/** An elision line of a multi-line expression (3.13+). */
const ELISION_RE = /^\.\.\.<(\d{1,9}) lines>\.\.\.$/; // anchored, one digit class
/** A local variable line printed by capture_locals: "name = repr". */
const LOCAL_RE = /^([\p{XID_Start}_][\p{XID_Continue}]*) = (.*)$/u; // anchored; the name class excludes the space
/** "... (max_group_depth is N)". */
const DEPTH_LIMIT_RE = /^\.\.\. \(max_group_depth is (\d{1,9})\)$/; // anchored
/** "and N more exceptions" after a truncated group. */
const MORE_RE = /^and (\d{1,9}) more exceptions?$/; // anchored
/** The tail of a member title: 16 dashes, the number or "...", 16 dashes (tolerant on the count of dashes). */
const TITLE_TAIL_RE = /^-{3,40} (\d{1,9}|\.\.\.) -{3,40}$/; // anchored, bounded
/** The tail of the closing line: dashes only. */
const CLOSE_TAIL_RE = /^-{3,60}$/; // anchored, bounded
/** One segment of a type name: an identifier, or <locals> in a qualified name. */
const SEG = "(?:[\\p{XID_Start}_][\\p{XID_Continue}]*|<locals>)"; // the class excludes "." and ":" so segments cannot overlap
/** A type name at the start of a line: module.qualname, possibly "<unknown>." first (format_exception_only). */
const TYPE_RE = new RegExp(`^(?:<unknown>\\.)?${SEG}(?:\\.${SEG})*`, "u"); // anchored, linear
/** Suffixes that make an unknown bare name look like an exception class (used only for a paste without a header). */
const EXC_SUFFIX_RE = /(?:Error|Exception|Warning|Exit|Interrupt|Group|Iteration)$/; // anchored at the end
/** "[Errno N] text" or "[WinError N] text" at the start of an OSError message. */
const ERRNO_RE = /^\[(Errno|WinError) (-?\d{1,9})\] (.*)$/; // anchored
/** A UnicodeDecodeError / UnicodeEncodeError message. */
const CODEC_RE = /^'([^']{1,64})' codec can't (?:decode|encode) (byte 0x[0-9a-f]{2}|bytes|character '[^']{1,32}'|characters) in position (\d{1,12}(?:-\d{1,12})?): (.*)$/; // anchored, bounded
/** ANSI SGR colour sequences (3.13+ colours tracebacks on a terminal). */
const ANSI_RE = /\x1b\[[0-9;]{0,32}m/g; // bounded parameter run
/** The line printed by threading.excepthook before the traceback. */
const THREAD_RE = /^Exception in thread .{1,400}:$/; // anchored, bounded
/** The line printed by sys.unraisablehook before the traceback. */
const UNRAISABLE_PREFIX = "Exception ignored "; // "Exception ignored in: <object>" and variants
/** A home directory with a user name: /home/<name>/, /Users/<name>/ or C:\Users\<name>\. */
const HOME_RE = /(?:\/home\/|\/Users\/|[A-Za-z]:\\Users\\)([^/\\\s"'<>|:]{1,64})(?=[/\\])/g; // bounded name class
/** The comprehension frames that 3.12 inlined (PEP 709); generator expressions keep theirs. */
const COMPREHENSION_FRAMES = new Set(["<listcomp>", "<dictcomp>", "<setcomp>"]); // names before 3.12
/** The exception types whose hint the page carries (from the documentation of each; see the tool's docs). */
const HINTED = new Set([
  "ModuleNotFoundError", "ImportError", "NameError", "UnboundLocalError", "AttributeError", "KeyError", "IndexError", // lookups
  "TypeError", "ValueError", "ZeroDivisionError", "RecursionError", "AssertionError", "KeyboardInterrupt", // general
  "FileNotFoundError", "PermissionError", "ConnectionRefusedError", "ConnectionResetError", "BrokenPipeError", "TimeoutError", // OSError family
  "UnicodeDecodeError", "UnicodeEncodeError", "SyntaxError", "IndentationError", "TabError", // text and syntax
  "socket.gaierror", "json.decoder.JSONDecodeError", "ssl.SSLCertVerificationError", "_ssl.SSLCertVerificationError", // stdlib
  "subprocess.CalledProcessError", "subprocess.TimeoutExpired", "asyncio.exceptions.CancelledError", "http.client.RemoteDisconnected", // stdlib
  "urllib.error.URLError", "urllib.error.HTTPError", "ExceptionGroup", "BaseExceptionGroup", // stdlib and groups
]); // HINTED

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** A run of n spaces. */
const sp = (n: number): string => " ".repeat(Math.max(0, n)); // n spaces

/** A line of the normalised paste and its 1-based number. */
interface Line { text: string; no: number }

/** A thrown refusal inside the parser (only for nesting past MAX_NESTING). */
class TooDeep extends Error {}

/**
 * Split a type name into module and class: the class is the part after the last dot that does not belong to a
 * qualified name. Built-ins and classes of __main__ print without a module (format_exception_only); a known name
 * from the table is split at its module; otherwise the module is everything before the first segment that starts
 * with an upper-case letter (Python's convention for class names, PEP 8), or before the last segment.
 * @param type the printed type
 * @returns the module (or null) and the class
 */
function splitType(type: string): { module: string | null; className: string } {
  const known = KNOWN_EXCEPTIONS.get(type); // a table entry knows its module
  if (known) return known.module === "builtins" ? { module: null, className: type } : { module: known.module, className: type.slice(known.module.length + 1) }; // exact
  const parts = type.split("."); // the segments
  if (parts.length === 1) return { module: null, className: type }; // a bare name
  let k = parts.findIndex((p) => /^\p{Lu}/u.test(p) || p === "<locals>"); // the first class-like segment
  if (k <= 0) k = parts.length - 1; // none, or the first segment itself: the last segment is the class
  return { module: parts.slice(0, k).join("."), className: parts.slice(k).join(".") }; // split there
} // splitType

/**
 * Classify a frame's file by its path (sysconfig installation schemes, read 2026-10-27: the standard library is
 * prefix/lib/pythonX.Y on POSIX and prefix\Lib on Windows, installed packages are under site-packages; Debian's
 * Python Policy puts packaged modules under dist-packages; pseudo-files are written in angle brackets).
 * @param file the file as printed
 * @returns the kind
 */
export function fileKind(file: string): FileKind {
  if (file.startsWith("<frozen ")) return "frozen"; // a frozen standard-library module (3.11+: -X frozen_modules)
  if (file === "<stdin>") return "stdin"; // read from standard input, or the basic REPL
  if (/^<python-input-\d{1,9}>$/.test(file)) return "repl"; // the 3.13+ interactive shell
  if (file === "<string>") return "string"; // exec, compile or python -c
  if (file.startsWith("<") && file.endsWith(">")) return "pseudo"; // <doctest ...>, <console>, <unknown> ...
  const f = file.replace(/\\/g, "/"); // compare with forward slashes
  if (/\/(?:site|dist)-packages\//i.test(f)) return "third-party"; // an installed package
  if (/\/lib(?:64)?\/python3\.\d{1,3}t?\//.test(f)) return "stdlib"; // POSIX standard library (and the free-threaded 3.13t)
  if (/\/lib\/python3\d{1,3}\.zip\//.test(f)) return "stdlib"; // a zipped standard library (embedded builds, Pyodide)
  if (/^[A-Za-z]:\/.*\/Lib\//.test(f)) return "stdlib"; // Windows: prefix\Lib
  return "own"; // anything else is taken to be your code
} // fileKind

/**
 * Parse a frame header line: '  File "<file>", line <n>, in <name>'. The file is everything up to the LAST
 * '", line ' so a quotation mark in a path does not cut it short.
 * @param c the content line
 * @returns the parts, or null
 */
function parseFrameHeader(c: string): { file: string; lineno: number | null; func: string } | null {
  if (!c.startsWith(FRAME_PREFIX)) return null; // not a frame line
  const rest = c.slice(FRAME_PREFIX.length); // after the opening quote
  const k = rest.lastIndexOf(LINE_SEP); // the end of the file name
  if (k < 0) return null; // malformed
  const after = rest.slice(k + LINE_SEP.length); // "N, in name"
  const m = /^(\d{1,9}|None), in (.+)$/.exec(after); // anchored: the number, then the name
  if (!m) return null; // a location line has no ", in"
  return { file: rest.slice(0, k), lineno: m[1] === "None" ? null : Number(m[1]), func: m[2] }; // the parts
} // parseFrameHeader

/**
 * Parse a SyntaxError location line: '  File "<file>", line <n>' with no function.
 * @param c the content line
 * @returns the parts, or null
 */
function parseLocationHeader(c: string): { file: string; lineno: number } | null {
  if (!c.startsWith(FRAME_PREFIX)) return null; // not a File line
  const rest = c.slice(FRAME_PREFIX.length); // after the opening quote
  const k = rest.lastIndexOf(LINE_SEP); // the end of the file name
  if (k < 0) return null; // malformed
  const m = /^(\d{1,9})$/.exec(rest.slice(k + LINE_SEP.length)); // only a number follows
  return m ? { file: rest.slice(0, k), lineno: Number(m[1]) } : null; // the parts
} // parseLocationHeader

/**
 * Parse an exception line "<type>: <message>" or "<type>".
 * @param c the content line
 * @param strict require a known class or an exception-like suffix (for a paste without a header)
 * @returns the type and message, or null
 */
function parseExceptionLine(c: string, strict: boolean): { type: string; message: string | null } | null {
  const m = TYPE_RE.exec(c); // the type at the start
  if (!m) return null; // not a type
  const type = m[0]; // the printed type
  const after = c.slice(type.length); // what follows it
  let message: string | null; // the message
  if (after === "") message = null; // "<type>" alone: an empty message
  else if (after.startsWith(": ")) message = after.slice(2); // "<type>: <message>"
  else return null; // anything else is not an exception line
  if (strict) { // without a header, only plausible exception names
    const last = type.slice(type.lastIndexOf(".") + 1); // the class name
    if (!KNOWN_EXCEPTIONS.has(type) && !EXC_SUFFIX_RE.test(last)) return null; // e.g. "Note: ..." is not an exception
  } // strict
  return { type, message }; // the parts
} // parseExceptionLine

/**
 * Find CPython's own suggestions in a message (What's New 3.12 and 3.13, read 2026-10-27, and the runs).
 * @param msg the message
 * @returns the suggestions found
 */
function findSuggestions(msg: string): Suggestion[] {
  const out: Suggestion[] = []; // the result
  const q = (from: number): string | null => { const a = msg.indexOf("'", from); if (a < 0) return null; const b = msg.indexOf("'", a + 1); return b < 0 ? null : msg.slice(a + 1, b); }; // the next quoted text
  let k = msg.indexOf("Did you mean"); // NameError, AttributeError, ImportError, TypeError keywords, SyntaxError keywords
  if (k >= 0) { const v = q(k); if (v !== null) out.push({ kind: "did-you-mean", value: v }); } // the suggested name
  k = msg.indexOf("forget to import"); // NameError for a standard-library module (3.12+)
  if (k >= 0) { const v = q(k); if (v !== null) out.push({ kind: "forgot-import", value: v }); } // the module
  k = msg.indexOf("(consider renaming "); // a script that shadows a module (3.13+)
  if (k >= 0) {
    const path = q(k); // the shadowing script
    if (path !== null) {
      const std = msg.indexOf("standard library module named ", k); // the standard-library form
      if (std >= 0) { const mod = q(std); out.push({ kind: "shadows-stdlib", value: mod ?? "", path }); } // names the module
      else out.push({ kind: "shadows-library", value: "", path }); // the third-party form
    } // path
  } // renaming
  return out; // what was found
} // findSuggestions

/**
 * The display columns of each code point of a line, as traceback._display_width counts them.
 * @param cps the code points
 * @returns the starting column of each code point, plus the total width at the end
 */
function columnStarts(cps: string[]): number[] {
  const starts: number[] = []; // the start column of each code point
  let col = 0; // the running column
  for (const ch of cps) { starts.push(col); col += columnsOf(ch.codePointAt(0) ?? 0); } // one or two columns each
  starts.push(col); // the total width
  return starts; // the columns
} // columnStarts

/**
 * Read the markers under the shown source lines of one frame into a Mark.
 * @param source the shown source lines (without the four-space indent)
 * @param markers the marker line under each, or null
 * @returns the mark, or null when no line carries markers; and whether a marker ran past its line
 */
function readMarks(source: string[], markers: (string | null)[]): { mark: Mark | null; mismatch: boolean } {
  let mismatch = false; // a marker wider than its line
  const exprParts: string[] = []; // the marked text, per marked line
  const focusParts: string[] = []; // the ^ text, per line
  const restRuns: string[] = []; // the runs of ~ text
  let tilde = false; // whether any ~ appears
  let start = -1; // first marked code point on the first marked line
  let end: number | null = null; // one past the last marked code point, on the first marked line
  let lines = 0; // marked lines
  for (let li = 0; li < source.length; li++) { // every shown line
    const mk = markers[li]; // its marker line
    if (!mk) continue; // none
    const cps = Array.from(source[li]); // the line's code points
    const cols = columnStarts(cps); // their columns
    if (mk.length > cols[cols.length - 1]) mismatch = true; // a marker past the end of the line
    let first = -1, last = -1; // the marked code point range on this line
    let e = "", f = ""; // this line's parts
    let run = ""; // the ~ run being collected
    for (let ci = 0; ci < cps.length; ci++) { // every code point
      const m = mk[cols[ci]]; // the marker at its first column
      if (m !== "^" && m !== "~") continue; // not marked
      if (first < 0) first = ci; // the first marked one
      last = ci; // the last so far
      if (m === "~") tilde = true; // the expression has parts
    } // code points
    if (first < 0) continue; // markers under nothing (should not happen)
    for (let ci = first; ci <= last; ci++) { // the marked stretch, including any unmarked white space inside it
      const m = mk[cols[ci]]; // its marker
      e += cps[ci]; // the expression text
      if (m === "~") run += cps[ci]; // inside a ~ run
      else { if (run.trim() !== "") restRuns.push(run.trim()); run = ""; } // a run ends
      if (m === "^") f += cps[ci]; // the ^ part
    } // stretch
    if (run.trim() !== "") restRuns.push(run.trim()); // a run that reaches the end of the line
    if (lines === 0) { start = first; end = last + 1; } // positions on the first marked line
    else end = null; // the expression continues past the first line
    lines += 1; // one more marked line
    exprParts.push(e); focusParts.push(f); // keep this line's parts
  } // lines
  if (lines === 0) return { mark: null, mismatch }; // no markers at all
  const focus = tilde ? focusParts.filter((x) => x !== "").join("\n") : null; // the ^ part only matters beside ~
  const rest = tilde ? restRuns : null; // the ~ runs
  let focusKind: Mark["focusKind"] = null; // what the ^ part is
  if (focus !== null) { const t = focus.trimStart(); focusKind = t.startsWith("(") ? "call" : t.startsWith("[") ? "subscript" : "operator"; } // by its first character
  if (lines > 1) end = null; // a multi-line expression has no end on its first line
  return { mark: { expression: exprParts.join("\n"), focus, focusKind, rest, start, end, lines }, mismatch }; // the mark
} // readMarks

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

/**
 * Normalise the paste: drop a BOM, read CR LF and CR as LF, remove ANSI colour codes, read leading no-break
 * spaces as spaces.
 * @param input the paste
 * @returns the text and the notes
 */
export function normalise(input: string): { text: string; notes: TbNote[] } {
  const notes: TbNote[] = []; // what was changed
  let t = input; // the working text
  if (t.charCodeAt(0) === 0xfeff) { t = t.slice(1); notes.push({ code: "bom-removed" }); } // a byte order mark
  if (t.includes("\r")) { t = t.replace(/\r\n?/g, "\n"); notes.push({ code: "crlf" }); } // Windows or old Mac line breaks
  const colours = t.match(ANSI_RE); // colour codes (FORCE_COLOR or a captured terminal)
  if (colours) { t = t.replace(ANSI_RE, ""); notes.push({ code: "colour-removed", params: { n: colours.length } }); } // removed
  let nbsp = 0; // lines whose indentation had no-break spaces
  t = t.split("\n").map((l) => { const m = /^[ \u00a0]+/.exec(l); if (!m || !m[0].includes("\u00a0")) return l; nbsp += 1; return " ".repeat(m[0].length) + l.slice(m[0].length); }).join("\n"); // chat apps turn spaces into U+00A0
  if (nbsp > 0) notes.push({ code: "nbsp", params: { n: nbsp } }); // say so
  return { text: t, notes }; // the normalised paste
} // normalise

// ---------------------------------------------------------------------------
// The parser
// ---------------------------------------------------------------------------

/** The recursive reader over the paste's lines. */
class Reader {
  /** The lines. */
  readonly L: Line[];
  /** The current index. */
  i = 0;
  /** Notes collected while reading. */
  readonly notes: TbNote[] = [];
  /** Nesting depth of groups being read. */
  depth = 0;
  /** Whether the next header-less block must have a plausible exception name (only for a paste of an exception line alone). */
  strictNext = false;
  /** Frames that printed local variables, and the paste line of the first. */
  localsFrames = { n: 0, line: 0 };

  /**
   * @param lines the normalised lines
   */
  constructor(lines: Line[]) { this.L = lines; } // keep them

  /**
   * The content of line i at margin m: the line itself at the top level (m < 0), else the text after the margin's
   * "| " (or "+ " for a top-level group header), or null when the line is not at that margin.
   * @param i the index
   * @param m the margin column
   * @returns the content or null
   */
  content(i: number, m: number): string | null {
    if (i >= this.L.length) return null; // past the end
    const t = this.L[i].text; // the line
    if (m < 0) return t; // the top level has no margin
    if (t.length < m + 1) return null; // too short to reach the margin
    for (let k = 0; k < m; k++) if (t.charCodeAt(k) !== 32) return null; // the margin is preceded by spaces only
    const c = t[m]; // the margin character
    if (c === "|") { if (t.length === m + 1) return ""; return t[m + 1] === " " ? t.slice(m + 2) : null; } // content, or an empty content line whose trailing space was trimmed
    if (c === "+" && t[m + 1] === " ") return t.slice(m + 2); // the top-level group header's margin
    return null; // a title or closing line, or another margin
  } // content

  /**
   * Whether line i starts a top-level group box, and at which margin.
   * @param i the index
   * @returns the margin column, or -1
   */
  boxStart(i: number): number {
    if (i >= this.L.length) return -1; // past the end
    const t = this.L[i].text; // the line
    const m = /^( {1,8})[+|] /.exec(t); // spaces, a margin character, a space
    if (!m) return -1; // not a box line
    const rest = t.slice(m[0].length); // the content
    if (t[m[1].length] === "+") return rest === GROUP_HEADER ? m[1].length : -1; // the header of a raised group
    return parseExceptionLine(rest, true) !== null ? m[1].length : -1; // an unraised group printed on its own
  } // boxStart

  /**
   * A banner at index i, margin m: an optional blank line, the banner text, an optional blank line.
   * @param i the index
   * @param m the margin
   * @returns the kind and the index after it, or null
   */
  banner(i: number, m: number): { kind: LinkKind; next: number } | null {
    let j = i; // the scan position
    if (this.content(j, m) === "") j += 1; // the blank line CPython prints before the banner
    const c = this.content(j, m); // the banner text?
    const kind: LinkKind | null = c === CAUSE_BANNER ? "cause" : c === CONTEXT_BANNER ? "context" : null; // which
    if (!kind) return null; // not a banner
    j += 1; // past it
    if (this.content(j, m) === "") j += 1; // the blank line after it
    return { kind, next: j }; // found
  } // banner

  /**
   * A member title at margin m: the first ("+-+----- 1 -----" at m) or a later one ("+---- k ----" at m + 2).
   * @param i the index
   * @param m the group's content margin
   * @param first whether the first title is expected
   * @returns the title text ("1", "2", "...") or null
   */
  title(i: number, m: number, first: boolean): string | null {
    if (i >= this.L.length) return null; // past the end
    const t = this.L[i].text; // the line
    // format(): indent + ("+-" for the first member, two spaces after) + "+---------------- N ----------------".
    // A nested group's first title at m + 2 ("+-+---") fails the tail test below, so it is never taken for a sibling.
    const lead = first ? sp(m) + "+-+" : sp(m + 2) + "+"; // what it starts with
    if (!t.startsWith(lead)) return null; // not a title at this margin
    const mm = TITLE_TAIL_RE.exec(t.slice(lead.length)); // dashes, the number or "...", dashes
    return mm ? mm[1] : null; // the title
  } // title

  /**
   * Whether line i is the closing line of the members at margin m + 2.
   * @param i the index
   * @param m the group's content margin
   * @returns true for "+------------------------------------" at m + 2
   */
  close(i: number, m: number): boolean {
    if (i >= this.L.length) return false; // past the end
    const t = this.L[i].text; // the line
    const lead = sp(m + 2) + "+"; // its start
    return t.startsWith(lead) && CLOSE_TAIL_RE.test(t.slice(lead.length)); // dashes only
  } // close

  /**
   * Read a chain at margin m (or the top level, m < 0, where each block may be a group box).
   * @param m the margin
   * @param id the id prefix for the exceptions read
   * @returns the chain, oldest first
   */
  chain(m: number, id: string): ChainItem[] {
    const items: ChainItem[] = []; // the chain
    for (;;) {
      const bm = m < 0 ? this.boxStart(this.i) : m; // at the top level a block may be a group box
      const node = this.block(bm, id === "" ? String(items.length + 1) : `${id}.${items.length + 1}`); // one exception
      if (!node) break; // nothing more at this margin
      items.push({ exc: node, link: null }); // keep it
      const b = this.banner(this.i, m); // a banner after it?
      if (!b) break; // the chain ends
      items[items.length - 1].link = b.kind; // how the next one relates to this one
      this.i = b.next; // past the banner
    } // blocks
    return items; // oldest first
  } // chain

  /**
   * Read one exception block at margin m: header, frames, SyntaxError location, exception line, extra lines,
   * and group members.
   * @param m the margin (negative at the top level)
   * @param id the exception's id
   * @returns the exception, or null when nothing at this margin looks like one
   */
  block(m: number, id: string): ExcNode | null {
    let c = this.content(this.i, m); // the first content line
    if (c === null) return null; // not at this margin
    let hasTraceback = false; // a header?
    let groupHeader = false; // the group header?
    if (c === TB_HEADER) { hasTraceback = true; this.i += 1; } // a traceback
    else if (c === GROUP_HEADER) { hasTraceback = true; groupHeader = true; this.i += 1; } // a group's traceback
    const frames: FrameNode[] = []; // the frames
    while (hasTraceback && (c = this.content(this.i, m)) !== null) { // frames follow the header
      const fh = parseFrameHeader(c); // a frame line?
      if (fh) { frames.push(this.frame(m, fh)); continue; } // read the frame and its body
      const rp = REPEAT_RE.exec(c); // a repeat line?
      if (rp && frames.length > 0) { frames[frames.length - 1].repeated += Number(rp[1]); this.i += 1; continue; } // counted on the frame above
      break; // the end of the frames
    } // frames
    let location: LocationNode | null = null; // the SyntaxError location
    c = this.content(this.i, m); // the next line
    const lh = c === null ? null : parseLocationHeader(c); // a location line?
    if (lh) location = this.location(m, lh); // read it
    c = this.content(this.i, m); // the line after the frames and location
    const dl = c === null ? null : DEPTH_LIMIT_RE.exec(c); // "... (max_group_depth is N)"?
    if (dl && !hasTraceback && !location) { this.i += 1; return this.node(id, { depthLimited: Number(dl[1]), pasteLine: this.L[this.i - 1].no }); } // a group not printed
    const strict = !hasTraceback && !location && this.strictNext; // only the first block of a header-less paste is held to plausible names
    this.strictNext = false; // once
    const ex = c === null ? null : parseExceptionLine(c, strict); // the exception line?
    if (!ex) { // no exception line where one belongs
      if (hasTraceback || location) { this.notes.push({ code: "incomplete", params: { line: this.L[Math.min(this.i, this.L.length - 1)].no } }); return this.node(id, { hasTraceback, groupHeader, frames, location }); } // a cut paste
      return null; // nothing here
    } // no exception line
    const pasteLine = this.L[this.i].no; // where it is
    this.i += 1; // past it
    const extra: string[] = []; // the lines after it
    while ((c = this.content(this.i, m)) !== null) { // at this margin
      if (this.banner(this.i, m)) break; // the next exception of the chain
      if (c.trim() === "") break; // CPython prints no blank line inside a message or its notes; reports and logs do (unittest's summary)
      if (m < 0 && c.startsWith(">>> ")) break; // the next prompt of an interactive session (sys.ps1's initial value)
      if (m < 0 && (c === TB_HEADER || this.boxStart(this.i) >= 0 || THREAD_RE.test(c) || c.startsWith(UNRAISABLE_PREFIX))) break; // another traceback
      extra.push(c); this.i += 1; // one more line
    } // extra lines
    while (extra.length > 0 && extra[extra.length - 1].trim() === "") extra.pop(); // blank lines at the end belong to nobody
    const node = this.node(id, { pasteLine, type: ex.type, message: ex.message, extra, hasTraceback, groupHeader, frames, location }); // the exception
    if (m >= 0 && this.title(this.i, m, true) !== null) node.group = this.members(m, id); // a group's members follow its exception line
    return node; // done
  } // block

  /**
   * Read one frame: the header line and the body lines indented four spaces.
   * @param m the margin
   * @param fh the parsed header
   * @returns the frame
   */
  frame(m: number, fh: { file: string; lineno: number | null; func: string }): FrameNode {
    const pasteLine = this.L[this.i].no; // the File line
    this.i += 1; // past it
    const body: string[] = []; // body lines without the indent
    let c: string | null; // the current content
    while ((c = this.content(this.i, m)) !== null && c.startsWith("    ")) { body.push(c.slice(4)); this.i += 1; } // four spaces or more
    const source: string[] = []; // shown source lines
    const markers: (string | null)[] = []; // their markers
    let elided = 0; // elided lines
    let lastWasSource = false; // whether a marker may attach
    for (const b of body) { // classify each body line
      if (lastWasSource && MARKER_RE.test(b)) { markers[markers.length - 1] = b; lastWasSource = false; continue; } // the markers under the line above
      const el = ELISION_RE.exec(b); // "...<N lines>..."
      if (el) { elided += Number(el[1]); lastWasSource = false; continue; } // lines left out
      source.push(b); markers.push(null); lastWasSource = true; // a source line
    } // body
    // Local variables (capture_locals, unittest --locals) come last: the longest run of "name = value" lines at the
    // end, after the first source line and after the last marked line.
    let lastMarked = -1; // the last source line with markers
    for (let k = 0; k < source.length; k++) if (markers[k] !== null) lastMarked = k; // find it
    let cut = source.length; // where locals would start
    while (cut - 1 > Math.max(0, lastMarked) && markers[cut - 1] === null && LOCAL_RE.test(source[cut - 1])) cut -= 1; // walk back over name = value lines
    const locals: { name: string; value: string }[] = []; // the locals
    if (cut < source.length) { // the walk always leaves the first source line as source
      for (const s of source.slice(cut)) { const lm = LOCAL_RE.exec(s); if (lm) locals.push({ name: lm[1], value: lm[2] }); } // name and repr
      source.length = cut; markers.length = cut; // the rest is source
      if (this.localsFrames.n === 0) this.localsFrames.line = pasteLine; // the first frame with locals
      this.localsFrames.n += 1; // locals can hold secrets: counted, and said once
    } // locals
    const { mark, mismatch } = readMarks(source, markers); // what the markers point at
    if (mismatch) this.notes.push({ code: "marker-mismatch", params: { line: pasteLine } }); // say so
    return { pasteLine, file: fh.file, lineno: fh.lineno, func: fh.func, kind: fileKind(fh.file), source, markers, elided, locals, repeated: 0, mark }; // the frame
  } // frame

  /**
   * Read a SyntaxError location block: the File line, the offending line, its marker line.
   * @param m the margin
   * @param lh the parsed File line
   * @returns the location
   */
  location(m: number, lh: { file: string; lineno: number }): LocationNode {
    const pasteLine = this.L[this.i].no; // the File line
    this.i += 1; // past it
    let text: string | null = null; // the offending line
    let marker: string | null = null; // its markers
    let c = this.content(this.i, m); // the next line
    if (c !== null && c.startsWith("    ") && !MARKER_RE.test(c.slice(4))) { text = c.slice(4); this.i += 1; c = this.content(this.i, m); } // the line
    if (c !== null && c.startsWith("    ") && MARKER_RE.test(c.slice(4))) { marker = c.slice(4); this.i += 1; } // the markers
    let marked: string | null = null; // the marked text
    let column: number | null = null; // where it starts
    if (text !== null && marker !== null) { // _format_syntax_error counts characters, not display columns
      const first = marker.search(/[~^]/); // the first marker
      const cps = Array.from(text); // code points
      marked = cps.slice(first, marker.length).join(""); // under the markers
      column = first + 1; // 1-based
    } // marked
    return { pasteLine, file: lh.file, lineno: lh.lineno, text, marker, marked, column }; // the location
  } // location

  /**
   * Read a group's members: titles, each member's chain at margin m + 2, "and N more", the closing line.
   * @param m the group's content margin
   * @param id the group's id
   * @returns the members
   */
  members(m: number, id: string): NonNullable<ExcNode["group"]> {
    if (++this.depth > MAX_NESTING) throw new TooDeep(); // bounded nesting
    const members: ChainItem[][] = []; // each member is a chain
    let more = 0; // members not printed
    let first = true; // the first title has its own shape
    for (;;) {
      const t = this.title(this.i, m, first); // the next title
      if (t === null) break; // no more members
      this.i += 1; first = false; // past it
      if (t === "...") { const c = this.content(this.i, m + 2); const mm = c === null ? null : MORE_RE.exec(c); if (mm) { more = Number(mm[1]); this.i += 1; } } // "and N more exceptions"
      else members.push(this.chain(m + 2, `${id}.${members.length + 1}`)); // the member's own chain
      if (this.close(this.i, m)) { this.i += 1; break; } // the closing line ends the list
    } // titles
    this.depth -= 1; // back up
    return { members, more, declared: null }; // the count is checked by the caller
  } // members

  /**
   * Build an exception node with defaults.
   * @param id its id
   * @param p the parts read
   * @returns the node
   */
  node(id: string, p: Partial<ExcNode>): ExcNode {
    const type = p.type ?? null; // the printed type
    const split = type ? splitType(type) : { module: null, className: null }; // module and class
    const known = type ? KNOWN_EXCEPTIONS.get(type) ?? null : null; // the table entry
    const message = p.message ?? null; // the message
    let hint: string | null = null; // the hint id
    if (message !== null && message.includes("'NoneType' object")) hint = "none-value"; // a None where an object was expected
    else if (type && HINTED.has(type)) hint = type.replace(/\./g, "_"); // the class's own hint
    const errno = message !== null && known && (known.chain.includes("OSError") || type === "OSError") ? ERRNO_RE.exec(message) : null; // an OSError message
    const codec = message !== null && type && /^Unicode(?:De|En)codeError$/.test(type) ? CODEC_RE.exec(message) : null; // a codec message
    return {
      id, pasteLine: p.pasteLine ?? null, type, module: split.module, className: split.className, message, // identity
      extra: p.extra ?? [], hasTraceback: p.hasTraceback ?? false, groupHeader: p.groupHeader ?? false, // shape
      frames: p.frames ?? [], location: p.location ?? null, known, hint, // contents
      suggestions: message !== null ? findSuggestions(message) : [], // CPython's own suggestions
      oserror: errno ? { errno: Number(errno[2]), text: errno[3], windows: errno[1] === "WinError" } : null, // errno
      codec: codec ? { codec: codec[1], what: codec[2], position: codec[3], reason: codec[4] } : null, // codec details
      group: null, depthLimited: p.depthLimited ?? null, // group fields
    }; // the node
  } // node
} // Reader

// ---------------------------------------------------------------------------
// After reading: walks over the tree
// ---------------------------------------------------------------------------

/**
 * Visit every exception in the tree, in printing order.
 * @param chain a chain
 * @param fn the visitor
 */
export function walk(chain: ChainItem[], fn: (e: ExcNode) => void): void {
  for (const it of chain) { // each exception
    fn(it.exc); // this one
    if (it.exc.group) for (const mem of it.exc.group.members) walk(mem, fn); // then its members
  } // items
} // walk

/**
 * "Where to look first" for one exception that ends a chain.
 * @param chain the chain it ends
 * @returns the reading
 */
function lookAt(chain: ChainItem[]): FirstLook {
  const last = chain[chain.length - 1].exc; // the final exception
  const prevItem = chain.length > 1 ? chain[chain.length - 2] : null; // the one before it
  const previous = prevItem && prevItem.link ? { exc: prevItem.exc.id, link: prevItem.link, look: lookAt(chain.slice(0, chain.length - 1)) } : null; // how they are linked, and where the earlier one points
  const base = { exc: last.id, previous }; // shared fields
  if (last.depthLimited !== null) return { ...base, kind: "group-depth", frame: null, innerKind: null }; // a group CPython did not print
  if (last.type === null) return { ...base, kind: "incomplete", frame: null, innerKind: null }; // a cut paste
  const n = last.frames.length; // frames
  // A SyntaxError location: the file never ran (no frames) or a module failed to compile where the last frame imported it.
  if (last.location) return { ...base, kind: "syntax", frame: n > 0 ? n - 1 : null, innerKind: null }; // the location first
  if (n === 0) return { ...base, kind: "no-traceback", frame: null, innerKind: null }; // nothing to point at
  const inner = last.frames[n - 1]; // the innermost frame
  if (last.type === "KeyboardInterrupt") return { ...base, kind: "interrupted", frame: n - 1, innerKind: null }; // Control-C: where it was waiting
  const rec = last.frames.findIndex((f) => f.repeated > 0); // a collapsed recursion
  if (last.type === "RecursionError" && rec >= 0) return { ...base, kind: "recursion", frame: rec, innerKind: null }; // the repeated frame
  const own = (f: FrameNode): boolean => f.kind === "own" || f.kind === "stdin" || f.kind === "repl" || f.kind === "string" || f.kind === "pseudo"; // code the reader wrote
  if (own(inner)) { // raised in the reader's own code
    const explicit = inner.source.length > 0 && /^raise(?:\s|$)/.test(inner.source[0]); // a raise statement
    return { ...base, kind: explicit ? "raised-explicitly" : "raised-here", frame: n - 1, innerKind: null }; // there
  } // own
  for (let k = n - 2; k >= 0; k--) if (own(last.frames[k])) return { ...base, kind: "last-own-frame", frame: k, innerKind: inner.kind }; // the last call from the reader's code
  return { ...base, kind: "all-library", frame: n - 1, innerKind: inner.kind }; // no frame of the reader's code
} // lookAt

/**
 * The leaves of a group: the final chains of its members, recursively, in printing order.
 * @param chain a chain whose last exception may be a group
 * @param out where to collect
 */
function leaves(chain: ChainItem[], out: ChainItem[][]): void {
  const last = chain[chain.length - 1].exc; // the final exception
  if (!last.group || last.group.members.length === 0) { out.push(chain); return; } // a leaf
  for (const mem of last.group.members) { if (out.length >= MAX_LEAVES) return; if (mem.length > 0) leaves(mem, out); } // each member
} // leaves

/**
 * Collect evidence about the release from the tree.
 * @param chain the top-level chain
 * @param lines the normalised lines (for path versions anywhere)
 * @returns the reading
 */
function releaseReading(chain: ChainItem[], lines: Line[]): ReleaseReading {
  const ev: ReleaseEvidence[] = []; // the evidence
  const seen = new Set<string>(); // one per code and detail
  const add = (e: ReleaseEvidence): void => { const key = `${e.code}|${e.detail ?? ""}`; if (!seen.has(key)) { seen.add(key); ev.push(e); } }; // dedupe
  for (const l of lines) { // versions written in paths: /lib/python3.13/, python314.zip, \Python313\
    const m = /(?:\/lib(?:64)?\/python3\.(\d{1,3})t?\/|\/python3(\d{1,3})\.zip\/|[\\/]Python3(\d{1,3})[\\/])/.exec(l.text); // the first one on the line
    if (m) { const minor = Number(m[1] ?? m[2] ?? m[3]); add({ code: "path-version", min: minor, max: minor, line: l.no, detail: `3.${minor}` }); } // exact
  } // lines
  walk(chain, (e) => { // per exception
    if (e.groupHeader || e.group) add({ code: "group", min: 11, max: null, line: e.pasteLine ?? 0 }); // PEP 654
    for (const f of e.frames) { // per frame
      if (f.mark) add({ code: "markers", min: 11, max: null, line: f.pasteLine }); // PEP 657
      if (f.mark && f.mark.focusKind === "call") add({ code: "call-markers", min: 13, max: null, line: f.pasteLine }); // calls anchored since 3.13
      if (f.elided > 0 || f.source.length > 1) add({ code: "multi-line", min: 13, max: null, line: f.pasteLine }); // multi-line display since 3.13
      if (COMPREHENSION_FRAMES.has(f.func)) add({ code: "comprehension-frame", min: null, max: 11, line: f.pasteLine, detail: f.func }); // inlined in 3.12 (PEP 709)
      if (f.kind === "repl") add({ code: "python-input", min: 13, max: null, line: f.pasteLine }); // the 3.13 shell
    } // frames
    for (const s of e.suggestions) { // CPython's own suggestions
      if (s.kind === "forgot-import") add({ code: "forgot-import", min: 12, max: null, line: e.pasteLine ?? 0 }); // 3.12
      if (s.kind === "shadows-stdlib" || s.kind === "shadows-library") add({ code: "consider-renaming", min: 13, max: null, line: e.pasteLine ?? 0 }); // 3.13
    } // suggestions
    if (e.message !== null && /Did you mean '/.test(e.message)) add({ code: "suggestion-no-colon", min: 13, max: null, line: e.pasteLine ?? 0 }); // the 3.13 keyword form
    if (e.known && e.known.since) add({ code: "known-type", min: Number(e.known.since.split(".")[1]), max: null, line: e.pasteLine ?? 0, detail: e.known.name }); // a class added later
  }); // walk
  let min: number | null = null; // the lowest release allowed
  let max: number | null = null; // the highest
  for (const e of ev) { if (e.min !== null) min = min === null ? e.min : Math.max(min, e.min); if (e.max !== null) max = max === null ? e.max : Math.min(max, e.max); } // intersect
  const conflict = min !== null && max !== null && min > max; // contradictory evidence
  return { evidence: ev, min, max, conflict }; // the reading
} // releaseReading

/**
 * Find what may be sensitive, and build the redacted copy.
 * @param text the normalised paste
 * @returns the findings and the redacted text
 */
function sensitive(text: string): { findings: SensitiveFinding[]; redacted: string; skipped: number } {
  const starts: number[] = [0]; // line starts
  for (let k = 0; k < text.length; k++) if (text.charCodeAt(k) === 10) starts.push(k + 1); // after each LF
  const lineOf = (off: number): number => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= off) lo = mid; else hi = mid - 1; } return lo; }; // 0-based line
  const cols = (from: number, to: number): number => Array.from(text.slice(from, to)).length; // code points between two offsets
  const spans: { start: number; end: number; with: string }[] = []; // replacements
  const findings: SensitiveFinding[] = []; // what was found
  const homes = new Map<string, SensitiveFinding>(); // one finding per prefix and user name
  HOME_RE.lastIndex = 0; // user names in home directories
  for (let m = HOME_RE.exec(text); m; m = HOME_RE.exec(text)) { // each one
    const s = m.index + m[0].length - m[1].length; // the name's start
    spans.push({ start: s, end: s + m[1].length, with: "<user>" }); // every occurrence is replaced by <user>
    const key = m[0]; // the prefix with the name
    const seen = homes.get(key); // reported already?
    if (seen) { seen.count += 1; continue; } // count it
    const ln = lineOf(s); // its first line
    const f: SensitiveFinding = { rule: "home-directory", line: ln + 1, column: cols(starts[ln], s) + 1, label: m[0].slice(0, m[0].length - m[1].length) + "<user>", count: 1 }; // a safe label
    homes.set(key, f); findings.push(f); // keep it
  } // home directories
  let skipped = 0; // lines too long for the secrets check
  const scanText = text.split("\n").map((l) => { if (l.length <= SECRET_SCAN_MAX_LINE) return l; skipped += 1; return " ".repeat(l.length); }).join("\n"); // same length, so offsets still match
  for (const f of scanSecrets(scanText, () => false)) { // the code-to-image secrets check; tracebacks have no comment syntax to honour
    findings.push({ rule: f.rule, line: f.line, column: f.column, label: f.label, count: 1 }); // never the value
    for (const s of f.spans) spans.push({ start: s.start, end: s.end, with: "[redacted]" }); // replaced
  } // secrets
  findings.sort((a, b) => a.line - b.line || a.column - b.column); // paste order
  spans.sort((a, b) => a.start - b.start || b.end - a.end); // left to right, longest first
  let out = ""; // the redacted copy
  let pos = 0; // copied up to here
  for (const s of spans) { if (s.start < pos) continue; out += text.slice(pos, s.start) + s.with; pos = s.end; } // overlaps keep the first
  out += text.slice(pos); // the rest
  return { findings, redacted: out, skipped }; // done
} // sensitive

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/** An empty release reading. */
const NO_RELEASE: ReleaseReading = Object.freeze({ evidence: [], min: null, max: null, conflict: false }) as ReleaseReading; // nothing known

/**
 * Explain a pasted traceback.
 * @param input the paste
 * @returns the reading
 */
export function explainTraceback(input: string): TracebackResult {
  /** A refusal. */
  const refuse = (code: TbErrorCode, params?: Record<string, number>, notes: TbNote[] = []): TracebackResult => ({ ok: false, error: { code, params }, notes, chain: [], startLine: null, firstLook: [], release: NO_RELEASE, sensitive: [], redacted: "", stats: { exceptions: 0, frames: 0, groups: 0, lines: 0 } }); // no reading
  if (input.trim() === "") return refuse("empty"); // nothing pasted
  if (input.length > MAX_INPUT_CHARS) return refuse("too-long", { max: MAX_INPUT_CHARS, length: input.length }); // bounded before any work
  const { text, notes } = normalise(input); // the normalised paste
  const raw = text.split("\n"); // its lines
  if (raw.length > 0 && raw[raw.length - 1] === "") raw.pop(); // a final line break ends the last line
  if (raw.length > MAX_LINES) return refuse("too-many-lines", { max: MAX_LINES, lines: raw.length }, notes); // bounded
  for (let k = 0; k < raw.length; k++) if (raw[k].length > MAX_LINE_CHARS) return refuse("line-too-long", { max: MAX_LINE_CHARS, line: k + 1 }, notes); // bounded
  let lines: Line[] = raw.map((t, k) => ({ text: t, no: k + 1 })); // numbered lines
  // Where the traceback starts: the first header, group box or SyntaxError location; failing those, the first line
  // that is plainly an exception line (a paste of the last line alone).
  const probe = new Reader(lines); // for the box test
  let start = -1; // the first line of the traceback
  let indent = 0; // a whole-paste indentation to remove
  for (let k = 0; k < lines.length && start < 0; k++) { // scan down
    const t = lines[k].text; // the line
    const trimmed = t.trimStart(); // without indentation
    if (trimmed === TB_HEADER) { start = k; indent = t.length - trimmed.length; break; } // a header (perhaps indented)
    if (probe.boxStart(k) >= 0) { start = k; break; } // a group box
    if (parseLocationHeader(t) && k + 1 < lines.length) { // a SyntaxError location: an exception line must follow within three lines
      for (let j = k + 1; j <= Math.min(k + 3, lines.length - 1); j++) if (parseExceptionLine(lines[j].text, true)) { start = k; break; } // found
    } // location
  } // scan
  let alone = false; // whether the start is an exception line on its own
  if (start < 0) for (let k = 0; k < lines.length; k++) if (parseExceptionLine(lines[k].text, true)) { start = k; alone = true; break; } // an exception line alone
  // An exception that was never raised prints without a header ("raise B from A()"), so a banner just above the
  // first header means the chain starts earlier: walk back over each banner to the exception line before it.
  for (;;) {
    let j = start - 1; // the line above the start
    if (j >= 0 && lines[j].text === "") j -= 1; // the blank line after a banner
    if (j < 0 || (lines[j].text !== CAUSE_BANNER && lines[j].text !== CONTEXT_BANNER)) break; // no banner: done
    j -= 1; // above the banner
    if (j >= 0 && lines[j].text === "") j -= 1; // the blank line before it
    if (j < 0) break; // a banner on the first lines: nothing above it
    let k = j; // the top of the block before the banner
    while (k - 1 >= 0 && lines[k - 1].text.trim() !== "") k -= 1; // up to a blank line
    let found = -1; // the block's first line
    for (let q = k; q <= j && found < 0; q++) if (lines[q].text === TB_HEADER || parseExceptionLine(lines[q].text, false)) found = q; // a header or an exception line
    if (found < 0) break; // nothing recognisable
    start = found; // the chain starts there
  } // walk back
  // IPython ("Cell In[1], line 1", "----> 1") and pytest ("E       ValueError: ...") print their own formats.
  const foreign = lines.some((l) => /^Cell In\[\d{1,9}\], line \d{1,9}/.test(l.text) || /^-{3,9}> ?\d{1,9} /.test(l.text) || /^E {3,9}\S/.test(l.text)); // their marks
  if (foreign) notes.push({ code: "foreign-format" }); // said whether or not anything can be read
  if (start < 0) return refuse("no-traceback", undefined, notes); // nothing CPython prints
  if (indent > 0) { // the whole traceback was indented (a Markdown code block, an e-mail quote)
    lines = lines.map((l, k) => (k >= start ? { text: l.text.slice(Math.min(indent, l.text.length - l.text.trimStart().length)), no: l.no } : l)); // remove up to that many spaces
    notes.push({ code: "indented", params: { n: indent } }); // say so
  } // indent
  const pre = lines.slice(0, start).filter((l) => l.text.trim() !== ""); // the lines before it
  if (pre.length > 0) { // say what they were
    const lastPre = pre[pre.length - 1].text; // the line just before
    if (THREAD_RE.test(lastPre)) notes.push({ code: "thread", params: { line: pre[pre.length - 1].no } }); // threading.excepthook
    else if (lastPre.startsWith(UNRAISABLE_PREFIX)) notes.push({ code: "unraisable", params: { line: pre[pre.length - 1].no } }); // sys.unraisablehook
    notes.push({ code: "preamble", params: { n: pre.length } }); // not read
  } // preamble
  const reader = new Reader(lines); // the reader
  reader.i = start; // at the start
  reader.strictNext = alone; // hold a lone exception line to plausible names
  let chain: ChainItem[]; // the top-level chain
  try { chain = reader.chain(-1, ""); } catch (e) { if (e instanceof TooDeep) return refuse("too-deep", { max: MAX_NESTING }, notes); throw e; } // bounded nesting
  if (chain.length === 0) return refuse("no-traceback", undefined, notes); // a start that led nowhere
  notes.push(...reader.notes); // what the reader noticed
  if (reader.localsFrames.n > 0) notes.push({ code: "locals", params: { n: reader.localsFrames.n, line: reader.localsFrames.line } }); // once
  const rest = lines.slice(reader.i).filter((l) => l.text.trim() !== ""); // what was not read
  if (rest.length > 0) { // after the traceback
    const again = rest.find((l) => l.text.trimStart() === TB_HEADER || THREAD_RE.test(l.text)); // another traceback?
    notes.push(again ? { code: "another-traceback", params: { line: again.no } } : { code: "trailing", params: { n: rest.length } }); // say which
  } // rest
  let exceptions = 0, frames = 0, groups = 0, withSource = 0, withMarks = 0, withExtra = 0, firstExtra = 0; // counts
  walk(chain, (e) => { // per exception
    exceptions += 1; frames += e.frames.length; // counts
    for (const f of e.frames) { if (f.source.length > 0) withSource += 1; if (f.mark) withMarks += 1; } // marker coverage
    if (e.group) { // a group: check "(N sub-exceptions)" against what is shown
      groups += 1; // count it
      const d = e.message !== null ? /\((\d{1,9}) sub-exceptions?\)$/.exec(e.message) : null; // BaseExceptionGroup.__str__
      if (d) { e.group.declared = Number(d[1]); if (e.group.declared !== e.group.members.length + e.group.more) notes.push({ code: "group-count", params: { line: e.pasteLine ?? 0, declared: e.group.declared, shown: e.group.members.length + e.group.more } }); } // disagreement
    } // group
    if (e.extra.length > 0) { if (withExtra === 0) firstExtra = e.pasteLine ?? 0; withExtra += 1; } // message or notes: counted
  }); // walk
  if (withExtra > 0) notes.push({ code: "extra-lines", params: { n: withExtra, line: firstExtra } }); // said once
  if (withSource >= 2 && withMarks === 0) notes.push({ code: "no-markers" }); // before 3.11, -X no_debug_ranges, or whole-line expressions
  const last = chain[chain.length - 1]; // the exception the traceback ends with
  const firstLook: FirstLook[] = []; // where to look first
  if (last.exc.group && last.exc.group.members.length > 0) { const lv: ChainItem[][] = []; leaves(chain, lv); for (const c of lv.slice(0, MAX_LEAVES)) firstLook.push(lookAt(c)); } // one per leaf
  else firstLook.push(lookAt(chain)); // one
  const { findings, redacted, skipped } = sensitive(text); // what may be sensitive
  if (findings.length > 0) notes.push({ code: "sensitive", params: { n: findings.length } }); // say so
  if (skipped > 0) notes.push({ code: "secrets-skipped", params: { n: skipped, max: SECRET_SCAN_MAX_LINE } }); // and what was not checked
  return { ok: true, error: null, notes, chain, startLine: lines[start].no, firstLook, release: releaseReading(chain, lines), sensitive: findings, redacted, stats: { exceptions, frames, groups, lines: lines.length } }; // the reading
} // explainTraceback

/** What a "Share results" link of this tool may carry, or why it carries nothing. */
export type ShareableTraceback =
  | { ok: true; text: string; findings: number } // the redacted copy, and how many findings it hides
  | { ok: false; reason: "no-reading" } // nothing was read: nothing to share
  | { ok: false; reason: "secrets-skipped"; skipped: number; max: number }; // lines too long for the secrets check: no link

/**
 * The derived form a "Share results" link carries (2026-10-27): the redacted copy the page already offers (user
 * names in home directories replaced by <user>, every secrets-check finding by [redacted]), never the paste as typed.
 * When some lines were too long for the secrets check (SECRET_SCAN_MAX_LINE), the copy may still hold a secret on
 * them, so no link is offered and the reason is given.
 * @param input the paste
 * @returns the redacted copy, or why there is none
 */
export function shareableTraceback(input: string): ShareableTraceback {
  return shareableFromReading(explainTraceback(input)); // the reading, with its redacted copy
} // shareableTraceback

/**
 * The same, from a reading the page already made (so the page does not read the paste twice).
 * @param r the reading of the paste
 * @returns the redacted copy, or why there is none
 */
export function shareableFromReading(r: TracebackResult): ShareableTraceback {
  if (!r.ok) return { ok: false, reason: "no-reading" }; // refused: nothing to share
  const skipped = r.notes.find((n) => n.code === "secrets-skipped"); // lines the check did not read
  if (skipped) return { ok: false, reason: "secrets-skipped", skipped: Number(skipped.params?.n ?? 0), max: SECRET_SCAN_MAX_LINE }; // blocked
  return { ok: true, text: r.redacted, findings: r.sensitive.length }; // the redacted copy
} // shareableFromReading

/**
 * The registry-shaped entry point (the tool is not exposed over the API; see index.ts).
 * @param input the paste
 * @returns the reading
 */
export function run(input: string): TracebackResult {
  return explainTraceback(input); // the same engine
} // run
