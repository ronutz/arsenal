// ============================================================================
// src/lib/tools/python-playground/compute.ts
// ----------------------------------------------------------------------------
// PYTHON PLAYGROUND - the deterministic part, which is ours.
//
// The playground runs real CPython in the reader's browser: Pyodide, the
// Pyodide project's build of CPython for WebAssembly, loaded from this origin
// into a module Web Worker (see public/workers/python-playground.worker.mjs and
// engine.ts for the pinned files). That interpreter is third-party code and
// the site does not pretend to test it. What this module owns is everything
// around it, and all of it is pure and deterministic:
//
//   1. THE PREFLIGHT. Before a program runs, the text is read (never executed)
//      and the reader is told what will not work and why, in the engine's own
//      terms: a standard-library module this build does not include (tkinter,
//      curses, pwd...), a package that exists for Pyodide but is not loaded in
//      this version (numpy, pandas, requests: decision 4 of the WebAssembly
//      proposal keeps the 357-package set off), a module nobody can install
//      here, network and process calls that Emscripten refuses, input() with
//      an empty stdin box, zoneinfo without tzdata, a sleep longer than the
//      time limit, the things that make output change between runs. Each
//      finding is a code the UI translates, with parameters, and a severity.
//      The import classification reads the lists generated from the pinned
//      package (engine.ts), so it is exactly as current as the engine.
//   2. THE LIMITS. The caps the harness enforces: program size, stdin size,
//      wall-clock limit, output cap. Stated here once, shown on the page, and
//      enforced by the worker and the component.
//   3. THE EXAMPLES. Twelve programs a network or security engineer would
//      actually type: subnetting, aggregation, masks, EUI-64, a DNS header in
//      struct, HMAC, latency statistics, transfer times, a syslog count, lines
//      from stdin, a JSON pick, and the bare last expression. Their output is
//      recorded in golden-vectors.ts and re-run through the real engine under
//      Node at build time (scripts/check-wasm-engines.mts), so an engine
//      upgrade that changes an example's output fails the build and is looked
//      at on purpose.
//
// Parsing is bounded: the program is cut at MAX_CODE characters, each line at
// MAX_LINE, and every expression is anchored and linear (no nested quantifiers,
// no backtracking over the whole text), so hostile input costs time
// proportional to its length and nothing else.
//
// SOURCES, each read on 2026-10-04 and listed in SOURCES below: the Pyodide
// documentation (the web-worker page, the streams page, the FAQ), the package's
// own typings and lock file, the CPython documentation for the modules named
// in the findings, and the Emscripten errors measured in the real engine.
// ============================================================================

import { DISTRIBUTION_PACKAGES, ENGINE, STDLIB_MODULES, STDLIB_UNAVAILABLE } from "./engine";

// ---------------------------------------------------------------------------
// Limits (one place; the page states them, the worker enforces them)
// ---------------------------------------------------------------------------

/** The caps the harness enforces around the interpreter. */
export const LIMITS = Object.freeze({
  /** Longest program accepted, in characters. */
  maxCodeChars: 20000,
  /** Longest line read by the preflight; longer lines are cut, not refused. */
  maxLineChars: 500,
  /** Longest stdin text accepted, in characters. */
  maxStdinChars: 20000,
  /** Wall-clock limit for one run, in seconds; the worker is terminated at the limit. */
  wallClockSeconds: 30,
  /** Output kept per stream, in characters; beyond it the stream is cut and marked. */
  maxOutputChars: 200000,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** What the reader submits: the program and the text the stdin box holds. */
export interface PlaygroundInput {
  /** The Python program. */
  code: string;
  /** The stdin box: what input() and sys.stdin read, one line per line. */
  stdin?: string;
}

/** How an imported module stands in this engine build. */
export type ImportStatus =
  /** In sys.stdlib_module_names and importable in this build. */
  | "stdlib"
  /** In the standard library but not importable in this WebAssembly build. */
  | "stdlib-unavailable"
  /** A package the Pyodide distribution offers, not loaded in this version. */
  | "distribution"
  /** The engine's own bridge modules (js, pyodide). */
  | "pyodide"
  /** A relative import, which has no package to be relative to here. */
  | "relative"
  /** Nothing this engine knows. */
  | "unknown";

/** One import statement, as the preflight read it. */
export interface ImportRef {
  /** The dotted name as written (first of a comma list is split into several refs). */
  module: string;
  /** The top-level module the classification is about. */
  top: string;
  /** 1-based line. */
  line: number;
  /** The classification. */
  status: ImportStatus;
  /** For distribution packages: the package name as the lock file spells it. */
  packageName?: string;
  /** For unavailable stdlib modules: the error the engine raised when probed. */
  engineError?: string;
}

/** Severity of a finding. */
export type Severity = "info" | "warn" | "error";

/** Finding codes; the UI holds the sentence for each (en and pt-BR). */
export type FindingCode =
  | "empty"
  | "too-long"
  | "stdin-too-long"
  | "line-cut"
  | "import-unavailable"
  | "import-distribution"
  | "import-unknown"
  | "import-relative"
  | "import-pyodide"
  | "network"
  | "processes"
  | "threads"
  | "zoneinfo"
  | "pip"
  | "input-no-stdin"
  | "input-stdin"
  | "stdin-unused"
  | "sleep-over-limit"
  | "sleep"
  | "loop-forever"
  | "nondeterministic"
  | "files"
  | "top-level-await"
  | "exit"
  | "no-output"
  | "mixed-indent";

/** One finding. */
export interface Finding {
  code: FindingCode;
  severity: Severity;
  /** 1-based line the finding points at, when it has one. */
  line?: number;
  /** Values the sentence interpolates. */
  params?: Record<string, string | number>;
}

/** Facts about the text the UI shows beside the findings. */
export interface Stats {
  lines: number;
  chars: number;
  stdinLines: number;
  /** input() or sys.stdin is read. */
  readsStdin: boolean;
  /** A top-level await is present (Pyodide runs the program as an async body). */
  topLevelAwait: boolean;
  /** print( appears somewhere. */
  prints: boolean;
  /** The last non-blank, non-comment line reads as an expression (its value becomes the result). */
  lastIsExpression: boolean;
}

/** The preflight's answer. */
export interface PreflightResult {
  /** False only when the program must not be sent to the engine (size, or an import that cannot succeed). */
  ok: boolean;
  findings: Finding[];
  imports: ImportRef[];
  stats: Stats;
  /** The limits, repeated so a consumer has them with the result. */
  limits: typeof LIMITS;
  /** The engine the preflight classified against. */
  engine: { name: string; version: string; python: string };
}

// ---------------------------------------------------------------------------
// Module knowledge (from the generated engine file, plus a few spellings)
// ---------------------------------------------------------------------------

/** Standard-library names, for O(1) lookup. */
const STDLIB = new Set<string>(STDLIB_MODULES);
/** Unavailable stdlib modules with the engine's error. */
const UNAVAILABLE = new Map<string, string>(STDLIB_UNAVAILABLE.map((u) => [u.module, u.error]));
/** Distribution packages keyed by a normalised form (lower-case, underscores as hyphens). */
const DISTRIBUTION = new Map<string, string>(DISTRIBUTION_PACKAGES.map((p) => [p.toLowerCase().replace(/_/g, "-"), p]));
/** Import names that differ from their distribution package name. Measured against the lock file's names; extend when a reader hits one. */
const IMPORT_TO_PACKAGE: Record<string, string> = {
  PIL: "Pillow",
  sklearn: "scikit-learn",
  skimage: "scikit-image",
  bs4: "beautifulsoup4",
  yaml: "pyyaml",
  cv2: "opencv-python",
  dateutil: "python-dateutil",
  Crypto: "pycryptodome",
  attr: "attrs",
  jwt: "pyjwt",
  sqlalchemy: "SQLAlchemy",
  Bio: "biopython",
  nacl: "pynacl",
  OpenSSL: "pyOpenSSL",
  zmq: "pyzmq",
  mpl_toolkits: "matplotlib",
  pkg_resources: "setuptools",
  typing_extensions: "typing-extensions",
  markupsafe: "MarkupSafe",
  jinja2: "Jinja2",
  pygments: "Pygments",
};
/** The engine's own bridge modules. */
const PYODIDE_MODULES = new Set(["js", "pyodide", "pyodide_js", "_pyodide", "micropip", "pyodide_http"]);
/** Modules whose purpose is the network, which Emscripten has none of here. */
const NETWORK_MODULES = new Set(["socket", "ssl", "http", "urllib", "ftplib", "smtplib", "poplib", "imaplib", "telnetlib", "xmlrpc", "socketserver", "asyncore", "selectors", "requests", "httpx", "aiohttp", "urllib3", "websocket", "websockets", "paramiko", "netmiko", "napalm", "scapy", "dns"]);
/** Modules whose purpose is processes, which Emscripten does not support. */
const PROCESS_MODULES = new Set(["subprocess", "multiprocessing", "concurrent", "pty", "pexpect"]);
/** Modules whose results change between runs. */
const NONDETERMINISTIC_MODULES = new Set(["random", "secrets", "uuid", "tempfile"]);

// ---------------------------------------------------------------------------
// Line-level expressions (anchored, linear)
// ---------------------------------------------------------------------------

/** `import a.b as c, d` */
const IMPORT_RE = /^\s*import\s+([A-Za-z_][\w.]*(?:\s+as\s+[A-Za-z_]\w*)?(?:\s*,\s*[A-Za-z_][\w.]*(?:\s+as\s+[A-Za-z_]\w*)?)*)\s*(?:#.*)?$/;
/** `from .a.b import x` (the leading dots are kept for the relative check). */
const FROM_RE = /^\s*from\s+(\.*)([A-Za-z_][\w.]*)?\s+import\s+/;
/** A comment or blank line. */
const BLANK_RE = /^\s*(?:#.*)?$/;
/** A line that is clearly a statement, not an expression (keywords and assignment). */
const STATEMENT_RE = /^\s*(?:if|elif|else|for|while|def|class|return|import|from|with|try|except|finally|raise|pass|break|continue|global|nonlocal|assert|del|yield|async|await|lambda|match|case)\b|^\s*[A-Za-z_][\w.]*(?:\[[^\]]*\])?\s*(?:[+\-*/%&|^@]|\*\*|<<|>>|\/\/)?=(?!=)/;
/** The literal seconds in time.sleep(N). */
const SLEEP_RE = /\btime\.sleep\(\s*(\d+(?:\.\d+)?)\s*\)/;

// ---------------------------------------------------------------------------
// The preflight
// ---------------------------------------------------------------------------

/** Read the program and the stdin box; return findings, imports and stats. Never executes anything. */
export function preflight(input: PlaygroundInput): PreflightResult {
  const findings: Finding[] = [];
  const imports: ImportRef[] = [];
  const rawCode = typeof input.code === "string" ? input.code : "";
  const rawStdin = typeof input.stdin === "string" ? input.stdin : "";
  // Size caps first: a too-long program is refused, the rest of the preflight runs on the cut text.
  let ok = true;
  if (rawCode.length > LIMITS.maxCodeChars) {
    findings.push({ code: "too-long", severity: "error", params: { chars: rawCode.length, max: LIMITS.maxCodeChars } });
    ok = false;
  }
  if (rawStdin.length > LIMITS.maxStdinChars) {
    findings.push({ code: "stdin-too-long", severity: "error", params: { chars: rawStdin.length, max: LIMITS.maxStdinChars } });
    ok = false;
  }
  const code = rawCode.slice(0, LIMITS.maxCodeChars);
  const stdin = rawStdin.slice(0, LIMITS.maxStdinChars);
  const lines = code.split(/\r?\n/);
  // stdin lines: a trailing newline does not add an empty line.
  const stdinLines = stdin === "" ? 0 : stdin.replace(/\r?\n$/, "").split(/\r?\n/).length;

  // Nothing to run.
  const meaningful = lines.filter((l) => !BLANK_RE.test(l));
  if (meaningful.length === 0) {
    findings.push({ code: "empty", severity: "info" });
    return {
      ok: false,
      findings,
      imports,
      stats: { lines: lines.length, chars: code.length, stdinLines, readsStdin: false, topLevelAwait: false, prints: false, lastIsExpression: false },
      limits: LIMITS,
      engine: { name: ENGINE.name, version: ENGINE.version, python: ENGINE.python },
    };
  }

  // One pass over the lines for imports and indentation; flags for the whole-text checks.
  let cut = 0;
  let sawTabIndent = false;
  let sawSpaceIndent = false;
  const seenTop = new Set<string>();
  lines.forEach((full, i) => {
    const line = full.length > LIMITS.maxLineChars ? full.slice(0, LIMITS.maxLineChars) : full;
    if (full.length > LIMITS.maxLineChars) cut++;
    const n = i + 1;
    // Indentation style, for the TabError warning.
    const indent = /^[ \t]+/.exec(line)?.[0] ?? "";
    if (indent.includes("\t")) sawTabIndent = true;
    if (indent.includes(" ")) sawSpaceIndent = true;
    // import a, b as c
    const im = IMPORT_RE.exec(line);
    if (im) {
      for (const part of im[1].split(",")) {
        const name = part.trim().split(/\s+as\s+/)[0].trim();
        if (name) imports.push(classify(name, n));
      }
      return;
    }
    // from x import y
    const fm = FROM_RE.exec(line);
    if (fm) {
      const dots = fm[1];
      const name = fm[2] ?? "";
      if (dots.length > 0) imports.push({ module: dots + name, top: name.split(".")[0] || ".", line: n, status: "relative" });
      else if (name) imports.push(classify(name, n));
    }
  });
  if (cut > 0) findings.push({ code: "line-cut", severity: "warn", params: { lines: cut, max: LIMITS.maxLineChars } });
  if (sawTabIndent && sawSpaceIndent) findings.push({ code: "mixed-indent", severity: "warn" });

  // Import findings, one per distinct top-level module, in order of appearance.
  for (const ref of imports) {
    if (seenTop.has(ref.top)) continue;
    seenTop.add(ref.top);
    switch (ref.status) {
      case "stdlib-unavailable":
        findings.push({ code: "import-unavailable", severity: "error", line: ref.line, params: { module: ref.top, error: ref.engineError ?? "" } });
        ok = false;
        break;
      case "distribution":
        findings.push({ code: "import-distribution", severity: "error", line: ref.line, params: { module: ref.top, package: ref.packageName ?? ref.top, version: ENGINE.version } });
        ok = false;
        break;
      case "unknown":
        findings.push({ code: "import-unknown", severity: "error", line: ref.line, params: { module: ref.top } });
        ok = false;
        break;
      case "relative":
        findings.push({ code: "import-relative", severity: "error", line: ref.line, params: { module: ref.module } });
        ok = false;
        break;
      case "pyodide":
        findings.push({ code: "import-pyodide", severity: "info", line: ref.line, params: { module: ref.top } });
        break;
      default:
        break;
    }
  }

  // Whole-text checks on the imports and on the code.
  const tops = new Set(imports.map((r) => r.top));
  const firstLineOf = (top: string) => imports.find((r) => r.top === top)?.line;
  const network = [...tops].filter((t) => NETWORK_MODULES.has(t));
  if (network.length > 0) findings.push({ code: "network", severity: "warn", line: firstLineOf(network[0]), params: { modules: network.join(", ") } });
  const processes = [...tops].filter((t) => PROCESS_MODULES.has(t));
  if (processes.length > 0 || /\bos\.(?:system|popen|fork|exec[lv]p?e?|spawn\w*)\(/.test(code)) {
    findings.push({ code: "processes", severity: "warn", line: processes.length > 0 ? firstLineOf(processes[0]) : undefined, params: { modules: processes.join(", ") || "os" } });
  }
  if (tops.has("threading") || tops.has("asyncio") && /\bto_thread\(/.test(code)) {
    findings.push({ code: "threads", severity: "info", line: firstLineOf("threading") ?? firstLineOf("asyncio") });
  }
  if (tops.has("zoneinfo")) {
    findings.push({ code: "zoneinfo", severity: "error", line: firstLineOf("zoneinfo") });
    ok = false;
  }
  if (/^\s*[!%]?pip\s+install\b/m.test(code) || tops.has("micropip")) {
    findings.push({ code: "pip", severity: "warn" });
  }
  // stdin: input() and sys.stdin.
  const readsStdin = /\binput\s*\(/.test(code) || /\bsys\.stdin\b/.test(code);
  if (readsStdin && stdinLines === 0) findings.push({ code: "input-no-stdin", severity: "warn" });
  else if (readsStdin) findings.push({ code: "input-stdin", severity: "info", params: { lines: stdinLines } });
  else if (stdinLines > 0) findings.push({ code: "stdin-unused", severity: "info", params: { lines: stdinLines } });
  // Sleeping and looping against the wall-clock limit.
  const sleep = SLEEP_RE.exec(code);
  if (sleep) {
    const secs = Number(sleep[1]);
    if (secs >= LIMITS.wallClockSeconds) findings.push({ code: "sleep-over-limit", severity: "warn", params: { seconds: secs, limit: LIMITS.wallClockSeconds } });
    else findings.push({ code: "sleep", severity: "info", params: { seconds: secs, limit: LIMITS.wallClockSeconds } });
  }
  if (/^\s*while\s+(?:True|1)\s*:/m.test(code)) findings.push({ code: "loop-forever", severity: "info", params: { limit: LIMITS.wallClockSeconds } });
  // Sources of run-to-run variation.
  const nondet = [...tops].filter((t) => NONDETERMINISTIC_MODULES.has(t));
  if (/\btime\.(?:time|time_ns|perf_counter|monotonic)\(/.test(code)) nondet.push("time");
  if (/\bdatetime\.(?:datetime\.)?(?:now|utcnow|today)\(/.test(code) || /\bdate\.today\(/.test(code)) nondet.push("datetime");
  if (nondet.length > 0) findings.push({ code: "nondeterministic", severity: "info", params: { modules: [...new Set(nondet)].join(", ") } });
  // Files live in the engine's memory and vanish with the run.
  if (/\bopen\s*\(/.test(code) || tops.has("pathlib") && /\.(?:write_text|write_bytes|read_text|read_bytes|mkdir|touch)\(/.test(code)) {
    findings.push({ code: "files", severity: "info" });
  }
  // Top-level await is a feature of how Pyodide runs the program.
  const topLevelAwait = lines.some((l) => /^await\s/.test(l) || /^[A-Za-z_][\w.,\s]*=\s*await\s/.test(l) || /^print\(\s*await\s/.test(l));
  if (topLevelAwait) findings.push({ code: "top-level-await", severity: "info" });
  // exit() ends the run with SystemExit.
  if (/\b(?:sys\.)?exit\s*\(/.test(code) || /\bquit\s*\(/.test(code)) findings.push({ code: "exit", severity: "info" });
  // Output: nothing printed, so the last expression's value is what the reader sees. Not judged on a
  // program the size cap already refused, whose cut last line means nothing.
  const prints = /\bprint\s*\(/.test(code);
  const last = meaningful[meaningful.length - 1];
  const lastIsExpression = rawCode.length <= LIMITS.maxCodeChars && !STATEMENT_RE.test(last) && !/^\s/.test(last) && !/:\s*(?:#.*)?$/.test(last);
  if (!prints && rawCode.length <= LIMITS.maxCodeChars) findings.push({ code: "no-output", severity: lastIsExpression ? "info" : "warn", params: { result: lastIsExpression ? 1 : 0 } });

  return {
    ok,
    findings,
    imports,
    stats: { lines: lines.length, chars: code.length, stdinLines, readsStdin, topLevelAwait, prints, lastIsExpression },
    limits: LIMITS,
    engine: { name: ENGINE.name, version: ENGINE.version, python: ENGINE.python },
  };
}

/** Classify one imported dotted name against the engine's lists. */
function classify(module: string, line: number): ImportRef {
  const top = module.split(".")[0];
  if (PYODIDE_MODULES.has(top)) return { module, top, line, status: "pyodide" };
  if (UNAVAILABLE.has(top)) return { module, top, line, status: "stdlib-unavailable", engineError: UNAVAILABLE.get(top) };
  if (STDLIB.has(top)) return { module, top, line, status: "stdlib" };
  const alias = IMPORT_TO_PACKAGE[top];
  const pkg = DISTRIBUTION.get((alias ?? top).toLowerCase().replace(/_/g, "-"));
  if (pkg) return { module, top, line, status: "distribution", packageName: pkg };
  return { module, top, line, status: "unknown" };
}

// ---------------------------------------------------------------------------
// The examples (their expected output lives in golden-vectors.ts and is
// re-measured through the real engine at build time)
// ---------------------------------------------------------------------------

/** One example program. Titles are message keys (examples.<id>), so they translate; the code does not. */
export interface Example {
  id: string;
  code: string;
  stdin?: string;
}

/** Twelve programs, written for the people this site is for. The first is the page's Example button (D-83). */
export const EXAMPLES: readonly Example[] = Object.freeze([
  {
    id: "subnet-split",
    code: `# Split a /24 into /26 subnets and list what each one holds.
import ipaddress

net = ipaddress.ip_network("10.20.30.0/24")
print(f"{net}: {net.num_addresses} addresses, {len(list(net.hosts()))} usable")
for sub in net.subnets(new_prefix=26):
    hosts = list(sub.hosts())
    print(f"  {sub}  mask {sub.netmask}  hosts {hosts[0]}-{hosts[-1]}  broadcast {sub.broadcast_address}")
`,
  },
  {
    id: "aggregate-routes",
    code: `# Collapse a list of prefixes into the smallest set of aggregates.
import ipaddress

routes = ["192.0.2.0/26", "192.0.2.64/26", "192.0.2.128/25", "198.51.100.0/24", "198.51.101.0/24"]
nets = [ipaddress.ip_network(r) for r in routes]
for agg in ipaddress.collapse_addresses(nets):
    print(agg)
`,
  },
  {
    id: "wildcard-mask",
    code: `# Netmask, wildcard mask and the binary form for a few prefix lengths.
import ipaddress

for plen in (8, 20, 24, 27, 30):
    net = ipaddress.ip_network(f"0.0.0.0/{plen}")
    print(f"/{plen:<3} {str(net.netmask):<16} wildcard {str(net.hostmask):<16} {int(net.netmask):032b}")
`,
  },
  {
    id: "ipv6-eui64",
    code: `# A modified EUI-64 interface identifier from a MAC address, then the address in a /64.
import ipaddress

mac = "00:1A:2B:3C:4D:5E"
octets = [int(x, 16) for x in mac.split(":")]
octets[0] ^= 0x02  # flip the universal/local bit
eui = octets[:3] + [0xFF, 0xFE] + octets[3:]
iid = ":".join(f"{eui[i] << 8 | eui[i + 1]:x}" for i in range(0, 8, 2))
addr = ipaddress.ip_address(f"2001:db8:cafe:1:{iid}")
print("interface id", iid)
print("address     ", addr)
print("exploded    ", addr.exploded)
print("reverse     ", addr.reverse_pointer)
`,
  },
  {
    id: "dns-header-struct",
    code: `# Build the 12-byte DNS header of a standard recursive query and read it back.
import struct

header = struct.pack(">HHHHHH", 0x1A2B, 0x0100, 1, 0, 0, 0)
print(header.hex(" "))
ident, flags, qd, an, ns, ar = struct.unpack(">HHHHHH", header)
print(f"id={ident:#06x} qr={flags >> 15} opcode={(flags >> 11) & 0xF} rd={(flags >> 8) & 1} qdcount={qd}")
`,
  },
  {
    id: "hmac-sha256",
    code: `# HMAC-SHA256 of a message with a shared key, in hex and base64url (the shapes seen in signed URLs and tokens).
import base64
import hashlib
import hmac

key = b"shared-secret"
msg = b"GET /api/v1/status 1700000000"
mac = hmac.new(key, msg, hashlib.sha256).digest()
print("hex      ", mac.hex())
print("base64url", base64.urlsafe_b64encode(mac).rstrip(b"=").decode())
print("sha256   ", hashlib.sha256(msg).hexdigest())
`,
  },
  {
    id: "latency-stats",
    code: `# Latency samples in milliseconds: mean, median, p95 and jitter (mean absolute difference between consecutive samples).
import statistics

samples = [21.4, 22.0, 21.9, 35.2, 22.3, 21.8, 48.9, 22.1, 21.7, 22.0, 21.6, 23.4]
s = sorted(samples)
p95 = s[round(0.95 * (len(s) - 1))]
jitter = statistics.mean(abs(b - a) for a, b in zip(samples, samples[1:]))
print(f"n={len(samples)} mean={statistics.mean(samples):.2f} median={statistics.median(samples):.2f} p95={p95:.1f} max={max(samples):.1f}")
print(f"stdev={statistics.stdev(samples):.2f} jitter={jitter:.2f}")
`,
  },
  {
    id: "transfer-time",
    code: `# How long a transfer takes at a given line rate, keeping decimal and binary sizes apart.
sizes = {"4.7 GB (DVD)": 4.7e9, "25 GiB (Blu-ray)": 25 * 2**30, "1 TB backup": 1e12}
rates = {"100 Mbit/s": 100e6, "1 Gbit/s": 1e9, "10 Gbit/s": 10e9}
for label, size in sizes.items():
    row = "  ".join(f"{r}: {size * 8 / bps:8.1f} s" for r, bps in rates.items())
    print(f"{label:<18} {row}")
`,
  },
  {
    id: "syslog-count",
    code: `# Count syslog lines by severity and list the hosts seen (a regex over pasted log text).
import re
from collections import Counter

log = """<134>Oct  4 21:02:11 fw1 kernel: link up eth0
<131>Oct  4 21:02:12 fw1 sshd[812]: Failed password for root from 203.0.113.9
<134>Oct  4 21:02:15 core2 bgpd: neighbor 192.0.2.1 Up
<131>Oct  4 21:02:19 fw1 sshd[812]: Failed password for root from 203.0.113.9
<132>Oct  4 21:03:01 core2 ospfd: adjacency with 192.0.2.5 changed to Down"""
sev_names = ["emerg", "alert", "crit", "err", "warning", "notice", "info", "debug"]
by_sev, hosts = Counter(), set()
for m in re.finditer(r"^<(\\d+)>\\S+ +\\d+ \\S+ (\\S+) ", log, re.M):
    pri, host = int(m.group(1)), m.group(2)
    by_sev[sev_names[pri % 8]] += 1
    hosts.add(host)
print(dict(sorted(by_sev.items())))
print("hosts:", ", ".join(sorted(hosts)))
`,
  },
  {
    id: "stdin-lines",
    code: `# Read interface names from the stdin box, one per line, and shorten them (the box feeds sys.stdin and input()).
import sys

seen = []
for line in sys.stdin:
    name = line.strip()
    if not name:
        continue
    short = name.replace("TenGigabitEthernet", "Te").replace("GigabitEthernet", "Gi").replace("Ethernet", "Eth")
    seen.append(short)
print(len(seen), "interfaces")
print(", ".join(seen))
`,
    stdin: `GigabitEthernet1/0/1
GigabitEthernet1/0/2
TenGigabitEthernet1/1/1

Ethernet1
`,
  },
  {
    id: "json-pick",
    code: `# Pick fields out of an API response and print a small table.
import json

raw = '{"items":[{"name":"vs_web","state":"up","conns":1532,"pool":"web_pool"},{"name":"vs_api","state":"down","conns":0,"pool":"api_pool"},{"name":"vs_mail","state":"up","conns":87,"pool":"mail_pool"}]}'
data = json.loads(raw)
print(f"{'name':<10}{'state':<7}{'conns':>7}  pool")
for it in data["items"]:
    print(f"{it['name']:<10}{it['state']:<7}{it['conns']:>7}  {it['pool']}")
print(json.dumps({"up": sum(i["state"] == "up" for i in data["items"]), "total": len(data["items"])}))
`,
  },
  {
    id: "last-expression",
    code: `# No print at all: the value of the last expression is shown as the result.
bits = 20
2 ** (32 - bits) - 2
`,
  },
]);

/** The example the page's Example button loads (D-83: verbatim from the vectors). */
export const EXAMPLE_ID = "subnet-split";

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

/** A cited source, in the shape every tool uses (the page map and the citation guards read label, type, url, access_date, scope). */
export interface Source {
  id: string;
  label: string;
  type: "reference" | "implementation" | "vendor-docs" | "vendor-kb" | "vendor-community";
  url: string;
  access_date: string;
  scope: string;
}

/** Every source the module and its page rely on, read on the stated date. */
export const SOURCES: readonly Source[] = Object.freeze([
  { id: "pyodide-webworker", label: "Pyodide documentation: Using Pyodide in a web worker", type: "vendor-docs", url: "https://pyodide.org/en/stable/usage/webworker.html", access_date: "2026-10-04", scope: "Pyodide requires a module-type worker because pyodide.asm.mjs is an ES module; classic workers using importScripts() are not supported." },
  { id: "pyodide-streams", label: "Pyodide documentation: Redirecting standard streams", type: "vendor-docs", url: "https://pyodide.org/en/stable/usage/streams.html", access_date: "2026-10-04", scope: "The stdin callback returns one full line per call and null for end of file; batched stdout handlers receive lines without their newline or flushed partial lines." },
  { id: "pyodide-package", label: "pyodide 314.0.7 on the npm registry (package.json, pyodide-lock.json, pyodide.d.ts)", type: "implementation", url: "https://www.npmjs.com/package/pyodide/v/314.0.7", access_date: "2026-10-04", scope: "Version, MPL-2.0 licence, the embedded Python 3.14.2, the 357-package lock, and the loadPyodide, runPythonAsync, setStdin, setStdout and setStderr signatures." },
  { id: "pyodide-repo", label: "pyodide/pyodide on GitHub", type: "implementation", url: "https://github.com/pyodide/pyodide", access_date: "2026-10-04", scope: "The engine's source repository." },
  { id: "python-stdlib-names", label: "Python 3.14 documentation: sys.stdlib_module_names", type: "reference", url: "https://docs.python.org/3.14/library/sys.html#sys.stdlib_module_names", access_date: "2026-10-04", scope: "The names classified as standard library are the engine's own sys.stdlib_module_names, read at generation time." },
  { id: "python-ipaddress", label: "Python 3.14 documentation: ipaddress", type: "reference", url: "https://docs.python.org/3.14/library/ipaddress.html", access_date: "2026-10-04", scope: "ip_network, subnets, hosts, collapse_addresses, netmask and hostmask used by the examples." },
  { id: "python-struct", label: "Python 3.14 documentation: struct", type: "reference", url: "https://docs.python.org/3.14/library/struct.html", access_date: "2026-10-04", scope: "Big-endian packing of the DNS header example." },
  { id: "python-hmac", label: "Python 3.14 documentation: hmac and hashlib", type: "reference", url: "https://docs.python.org/3.14/library/hmac.html", access_date: "2026-10-04", scope: "HMAC-SHA256 as the examples compute it." },
  { id: "python-statistics", label: "Python 3.14 documentation: statistics", type: "reference", url: "https://docs.python.org/3.14/library/statistics.html", access_date: "2026-10-04", scope: "mean, median and stdev in the latency example." },
  { id: "python-zoneinfo", label: "Python 3.14 documentation: zoneinfo (data sources)", type: "reference", url: "https://docs.python.org/3.14/library/zoneinfo.html#data-sources", access_date: "2026-10-04", scope: "zoneinfo reads the system tz database or the tzdata package; the engine has neither unless the tzdata package is loaded, and raises ZoneInfoNotFoundError saying so (measured 2026-10-04)." },
  { id: "rfc1035", label: "RFC 1035, Domain names: implementation and specification, section 4.1.1 (header section format)", type: "reference", url: "https://www.rfc-editor.org/rfc/rfc1035#section-4.1.1", access_date: "2026-10-04", scope: "The 12-byte header the struct example builds." },
  { id: "rfc4291", label: "RFC 4291, IP Version 6 Addressing Architecture, Appendix A (modified EUI-64 interface identifiers)", type: "reference", url: "https://www.rfc-editor.org/rfc/rfc4291#appendix-A", access_date: "2026-10-04", scope: "The universal/local bit flip and the FF FE insertion in the EUI-64 example." },
  { id: "rfc5424", label: "RFC 5424, The Syslog Protocol, section 6.2.1 (PRI = facility times 8 plus severity)", type: "reference", url: "https://www.rfc-editor.org/rfc/rfc5424#section-6.2.1", access_date: "2026-10-04", scope: "The severity derived as PRI modulo 8 in the syslog example." },
  { id: "mdn-worker-module", label: "MDN: Worker() constructor, the type option", type: "reference", url: "https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker", access_date: "2026-10-04", scope: "type: module makes the worker a module worker; the worker is created on the main thread and terminated with Worker.terminate()." },
  { id: "mdn-csp-wasm", label: "MDN: Content-Security-Policy script-src, the wasm-unsafe-eval source", type: "reference", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src", access_date: "2026-10-04", scope: "The page policy already carries wasm-unsafe-eval for Pagefind; the engine was measured to load and run under that policy without unsafe-eval." },
]);
