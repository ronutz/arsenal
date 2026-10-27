// ============================================================================
// src/lib/tools/python-traceback-explainer/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the Python traceback
// explainer: paste a traceback printed by CPython 3.11 to 3.15 and get it
// taken apart. Each frame with its file, line, function and source line, and
// what the ^ and ~ markers point at; each exception with its class chain from
// the built-in hierarchy (and the standard-library classes network scripts
// meet), CPython's own suggestion, errno or codec details, and a hint drawn
// from its documentation; the chain ("direct cause" against "during
// handling"), exception groups with their members and notes; where to look
// first; which releases the format points to; and what in the paste may be
// sensitive, with a redacted copy to share instead of the original.
//
// Every source below was downloaded with curl on 2026-10-27 (generic
// User-Agent, no-cache headers, a cache-busting query) and answered HTTP 200;
// the files and the status log are in the build's work folder. Every
// behaviour the vectors pin was printed by a real interpreter that day (see
// golden-vectors.ts).
// ============================================================================

import { explainTraceback, run, type TracebackResult } from "./compute"; // the engine
import { GOLDEN_VECTOR_SET_ID, GOLDEN_VECTOR_COUNT } from "./golden-vectors"; // the vectors

// The engine, re-exported for the component.
export { explainTraceback, run, normalise, fileKind, walk, MAX_INPUT_CHARS, MAX_LINES, MAX_LINE_CHARS, MAX_NESTING, MAX_LEAVES, SECRET_SCAN_MAX_LINE, SUPPORTED_RELEASES } from "./compute"; // values
export type { TracebackResult, ChainItem, ExcNode, FrameNode, LocationNode, Mark, FirstLook, FileKind, LinkKind, ReleaseReading, ReleaseEvidence, SensitiveFinding, Suggestion, TbErrorCode, TbNote, TbNoteCode, SupportedRelease } from "./compute"; // types
export { KNOWN_EXCEPTIONS } from "./exceptions"; // the exception table
export type { KnownException } from "./exceptions"; // its row type
export { columnsOf, WIDTH_UNICODE_VERSION } from "./widths"; // display widths
export { EXAMPLE_TRACEBACK } from "./example"; // the page's Example
// The vectors, re-exported by the conventional names.
export { GOLDEN_VECTOR_SET_ID, GOLDEN_VECTOR_COUNT, TRACEBACK_VECTORS, REFUSAL_VECTORS, WIDTH_VECTORS, TABLE_VECTORS, verifyVectors } from "./golden-vectors"; // vectors and their runner

/** A source: what it is, where, when it was read, and what this tool takes from it. */
interface Src { id: string; label: string; type: string; url: string; access_date: string; scope: string; status: string }
/** Build a source read on 2026-10-27 (every source of this tool was read that day). */
const s = (id: string, label: string, type: string, url: string, scope: string): Src => ({ id, label, type, url, access_date: "2026-10-27", scope, status: "active" }); // one source

/** The D-49 declarative manifest for the Python traceback explainer. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Python", // the catalogue family (D-73)
  toolSlug: "python-traceback-explainer", // the route segment
  canonicalAliases: [
    "python traceback explainer", // the plain name
    "python traceback", // what people paste
    "python stack trace", // another name for it
    "python error explained", // the question behind it
    "exception group traceback", // PEP 654's display
    "during handling of the above exception", // the banner people search for
  ],
  // The paste box lists the LOWEST priority number first (S4 sweep, 2026-10-27). Both headers are CPython's own,
  // anchored at the start of the paste: nothing else prints them.
  inputDetectors: [
    {
      // "Traceback (most recent call last):" at the start, after optional white space. Anchored, fixed text: linear.
      kind: "regex",
      pattern: "^\\s*Traceback \\(most recent call last\\):",
      priority: 3, // a sure sign of a CPython traceback
      example: "Traceback (most recent call last):\n  File \"/home/ana/netops/inventory.py\", line 18, in <module>\n    print(load(LINES))\n          ~~~~^^^^^^^\n", // the start of golden vector inventory
    },
    {
      // An exception group's box: "  + Exception Group Traceback (most recent call last):". Anchored, fixed text.
      kind: "regex",
      pattern: "^\\s*\\+ Exception Group Traceback \\(most recent call last\\):",
      priority: 3, // equally sure
      example: "  + Exception Group Traceback (most recent call last):\n  |   File \"/home/ana/netops/group_wide.py\", line 3, in <module>\n", // the start of golden vector group-wide
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly", "sensitiveArtifact"], // a line-by-line read of the paste; tracebacks carry paths, user names and secrets
  apiCapabilityClass: "browser-only", // in API_EXCLUDED: the input is a log artifact that routinely holds secrets (see shared-edits)

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount: GOLDEN_VECTOR_COUNT, // every vector
  dangerousInputHandling: [
    "never-evaluates", // the paste is read, never run: no Python executes
    "secret-redaction", // user names in home directories and the code-to-image secrets rules, with a redacted copy
    "length-bound", // at most 200,000 characters, 5,000 lines, 5,000 characters a line
    "depth-guard", // at most 40 nested group margins
    "redos-guard", // anchored or sticky expressions over classes that cannot overlap; indexOf scans
    "share-derived-only", // Share results (2026-10-27) builds a link only when pressed, carrying the redacted copy; none when lines went unchecked
  ],
  // The paste as typed never goes into a link: the page's own Share button carries no data, and the explicit Share
  // results button (charter section 6.4, D-27 c: "with data" is an explicit choice) carries the redacted copy only.
  shareSafetyDefault: "never", // a traceback holds paths, user names, host names and tokens

  // -- Teaching & provenance --
  // The Python series' errors article teaches what the tool reads; the calculator article is the series' first use.
  learnLinks: ["learn/python-errors-and-tracebacks"],
  sources: [
    // The format.
    s("py-traceback", "Python 3.15 documentation: traceback, Print or retrieve a stack traceback (the 3.11, 3.12, 3.13 and 3.14 editions were read and compared)", "reference", "https://docs.python.org/3/library/traceback.html", "the header and the frames (print_exception, StackSummary.format, FrameSummary); collapsed repeats; format_exception_only: the message then the notes, and SyntaxError's location lines; TracebackException's __cause__, __context__, __suppress_context__, __notes__, exceptions, max_group_width 15 and max_group_depth 10; FrameSummary colno and end_colno; the 3.13 edition's examples show ~ and ^ under calls, the 3.12 edition's do not"),
    s("py-exceptions", "Python 3.15 documentation: Built-in Exceptions (served at /3/builtins/exceptions.html; the 3.11 to 3.14 editions were read and their hierarchy trees compared)", "reference", "https://docs.python.org/3/builtins/exceptions.html", "the class hierarchy; what each built-in exception means; exception context and the two ways a chain is displayed; add_note and __notes__; the OS exceptions and their errno values; ExceptionGroup and BaseExceptionGroup; PythonFinalizationError added in 3.13 and ImportCycleError in 3.15"),
    s("py-whatsnew-311", "What's New in Python 3.11", "reference", "https://docs.python.org/3/whatsnew/3.11.html", "PEP 657 fine-grained error locations, -X no_debug_ranges and PYTHONNODEBUGRANGES; PEP 654 exception groups; PEP 678 notes"),
    s("py-whatsnew-312", "What's New in Python 3.12", "reference", "https://docs.python.org/3/whatsnew/3.12.html", "no separate frame for comprehensions (PEP 709); \"Did you forget to import\"; self. suggestions; ImportError suggestions"),
    s("py-whatsnew-313", "What's New in Python 3.13", "reference", "https://docs.python.org/3/whatsnew/3.13.html", "tracebacks in colour (PYTHON_COLORS, NO_COLOR, FORCE_COLOR); the \"consider renaming\" message for a script that shadows a module; keyword-argument suggestions"),
    s("py-whatsnew-314", "What's New in Python 3.14", "reference", "https://docs.python.org/3/whatsnew/3.14.html", "keyword typo suggestions in SyntaxError (\"Did you mean 'while'?\") and the other improved messages; PEP 758 and PEP 765"),
    s("py-whatsnew-315", "What's New in Python 3.15", "reference", "https://docs.python.org/3/whatsnew/3.15.html", "AttributeError suggestions through inner attributes and from other languages' method names; lazy imports, whose failures are reported at first use"),
    s("pep-657", "PEP 657, Include Fine Grained Error Locations in Tracebacks", "standard", "https://peps.python.org/pep-0657/", "the markers under each displayed line; deactivating them"),
    s("pep-654", "PEP 654, Exception Groups and except*", "standard", "https://peps.python.org/pep-0654/", "groups as trees of exceptions; each member keeps its own traceback; the display continues into nested tracebacks"),
    s("pep-678", "PEP 678, Enriching Exceptions with Notes", "standard", "https://peps.python.org/pep-0678/", "notes appear immediately after the exception message, in the order added, each on a new line"),
    s("pep-3134", "PEP 3134, Exception Chaining and Embedded Tracebacks", "standard", "https://peps.python.org/pep-3134/", "__cause__ and __context__ and the two banners"),
    s("pep-409", "PEP 409, Suppressing exception context", "standard", "https://peps.python.org/pep-0409/", "raise ... from None"),
    s("pep-415", "PEP 415, Implement context suppression with exception attributes", "standard", "https://peps.python.org/pep-0415/", "__suppress_context__"),
    s("pep-709", "PEP 709, Inlined comprehensions", "standard", "https://peps.python.org/pep-0709/", "no comprehension frame in tracebacks from 3.12; generator expressions are not inlined"),
    s("pep-3151", "PEP 3151, Reworking the OS and IO exception hierarchy", "standard", "https://peps.python.org/pep-3151/", "the OSError subclasses mapped to errno values"),
    s("py-cmdline", "Python 3.15 documentation: Command line and environment", "reference", "https://docs.python.org/3/using/cmdline.html", "-X no_debug_ranges and PYTHONNODEBUGRANGES suppress the markers; -X frozen_modules; -O removes assert statements; controlling colour with PYTHON_COLORS, NO_COLOR, FORCE_COLOR and TERM=dumb"),
    s("py-sys", "Python 3.15 documentation: sys", "reference", "https://docs.python.org/3/library/sys.html", "sys.unraisablehook and its \"Exception ignored in\" message; ps1"),
    s("py-threading", "Python 3.15 documentation: threading", "reference", "https://docs.python.org/3/library/threading.html", "threading.excepthook handles exceptions raised by Thread.run()"),
    s("py-tutorial-errors", "The Python Tutorial, 8. Errors and Exceptions", "reference", "https://docs.python.org/3/tutorial/errors.html", "syntax errors against exceptions; reading the last line first"),
    s("py-lexical", "The Python Language Reference, 2. Lexical analysis: names (identifiers)", "reference", "https://docs.python.org/3/reference/lexical_analysis.html", "identifiers start with a letter or underscore in the XID_Start sense and continue with XID_Continue characters: the shape of a class name"),
    s("py-sysconfig", "Python 3.15 documentation: sysconfig, installation paths", "reference", "https://docs.python.org/3/library/sysconfig.html", "stdlib is prefix/lib/pythonX.Y on POSIX and prefix\\Lib on Windows; purelib and platlib are site-packages under them: the file-kind rule"),
    s("debian-python-policy", "Debian Python Policy 0.12.0.0", "vendor-docs", "https://www.debian.org/doc/packaging-manuals/python-policy/", "public Python 3 modules are installed in /usr/lib/python3/dist-packages (and /usr/local/lib/python3/dist-packages for the administrator's)"),
    s("devguide-versions", "Python Developer's Guide: Status of Python versions", "reference", "https://devguide.python.org/versions/", "3.15 and 3.14 bugfix, 3.13, 3.12 and 3.11 security, with end of life 2031-10, 2030-10, 2029-10, 2028-10 and 2027-10; 3.10 reached end of life on 2026-10-01"),
    // The standard-library classes in the table.
    s("py-socket", "Python 3.15 documentation: socket", "reference", "https://docs.python.org/3/library/socket.html", "gaierror (address errors from getaddrinfo, a pair of an EAI_* number and gai_strerror's text), herror, timeout as an alias of TimeoutError"),
    s("py-ssl", "Python 3.15 documentation: ssl", "reference", "https://docs.python.org/3/library/ssl.html", "SSLError and its subclasses; SSLCertVerificationError when certificate validation fails, with verify_code and verify_message"),
    s("py-json", "Python 3.15 documentation: json", "reference", "https://docs.python.org/3/library/json.html", "JSONDecodeError, a ValueError with msg, doc, pos, lineno and colno"),
    s("py-asyncio-exceptions", "Python 3.15 documentation: asyncio Exceptions", "reference", "https://docs.python.org/3/library/asyncio-exceptions.html", "CancelledError (a BaseException since 3.8, to be re-raised), TimeoutError, IncompleteReadError, LimitOverrunError"),
    s("py-asyncio-task", "Python 3.15 documentation: Coroutines and Tasks", "reference", "https://docs.python.org/3/library/asyncio-task.html", "TaskGroup gathers its tasks' failures into an ExceptionGroup"),
    s("py-subprocess", "Python 3.15 documentation: subprocess", "reference", "https://docs.python.org/3/library/subprocess.html", "CalledProcessError for a non-zero exit status with check=True; TimeoutExpired"),
    s("py-urllib-error", "Python 3.15 documentation: urllib.error", "reference", "https://docs.python.org/3/library/urllib.error.html", "URLError and its reason; HTTPError with code, reason and headers"),
    s("py-http-client", "Python 3.15 documentation: http.client", "reference", "https://docs.python.org/3/library/http.client.html", "RemoteDisconnected: no data read when the response was expected, the remote end closed the connection"),
    // The hints.
    s("py-re", "Python 3.15 documentation: re", "reference", "https://docs.python.org/3/library/re.html", "match and search return None when the string does not match"),
    s("py-tutorial-controlflow", "The Python Tutorial, 4. More Control Flow Tools", "reference", "https://docs.python.org/3/tutorial/controlflow.html", "a function without a return statement returns None"),
    s("py-stdtypes", "Python 3.15 documentation: Built-in Types, dict.get", "reference", "https://docs.python.org/3/builtins/stdtypes.html", "get(key, default=None) returns default when the key is missing"),
    s("py-venv", "Python 3.15 documentation: venv", "reference", "https://docs.python.org/3/library/venv.html", "a virtual environment is isolated from the packages of the base environment"),
    s("py-codecs", "Python 3.15 documentation: codecs, error handlers", "reference", "https://docs.python.org/3/library/codecs.html", "strict raises UnicodeError; replace, backslashreplace and surrogateescape"),
    s("py-unittest", "Python 3.15 documentation: unittest, --locals", "reference", "https://docs.python.org/3/library/unittest.html", "--locals shows local variables in tracebacks"),
    // Display widths.
    s("ucd-eaw-1510", "Unicode Character Database 15.1.0: EastAsianWidth.txt (16.0.0 and 17.0.0 compared)", "standard", "https://www.unicode.org/Public/15.1.0/ucd/EastAsianWidth.txt", "the W and F ranges, identical to CPython 3.13.16's unicodedata; 16.0.0 adds 198 and 17.0.0 355 code points"),
    s("uax11", "Unicode Standard Annex #11, East Asian Width", "standard", "https://www.unicode.org/reports/tr11/", "the meaning of the W (wide) and F (fullwidth) values"),
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
}); // manifest

/**
 * runTool: the registry-shaped entry point (the tool is in API_EXCLUDED; nothing calls this over HTTP).
 * @param input the paste
 * @returns the reading
 */
export function runTool(input: string): TracebackResult {
  return run(input); // the same engine
} // runTool

/**
 * explain: the page's entry point.
 * @param input the paste
 * @returns the reading
 */
export function explain(input: string): TracebackResult {
  return explainTraceback(input); // the same engine
} // explain
