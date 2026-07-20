// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/p0f-signature-explainer/compute.ts
// ----------------------------------------------------------------------------
// Decode a p0f v3 passive TCP/IP SYN fingerprint into its eight fields and
// explain what each one reveals. PASSIVE by nature: p0f reads packets a host
// already emitted; it never probes. This tool is DECODE/EXPLAIN ONLY - the user
// pastes a signature string they already hold. Nothing is collected or sent.
//
// The signature grammar (p0f/docs/README):
//   ver:ittl:olen:mss:wsize,scale:olayout:quirks:pclass
//
// Every field below is decoded from the pasted string alone; the OS hints are
// the well-documented reference signatures shipped with p0f, matched by exact
// (ittl, olayout, quirks) shape - never a guess beyond what the fields state.
// ============================================================================

export class P0fInputError extends Error {}

/** The eight positional fields of a p0f v3 TCP signature. */
export interface P0fFields {
  ver: string;        // "4", "6", or "*"
  ittl: string;       // initial TTL, may carry "+dist" or "-" suffix
  olen: string;       // IPv4 options / IPv6 ext-header length (usually 0)
  mss: string;        // maximum segment size, or "*"
  wsize: string;      // window size: constant, "mss*N", "mtu*N", or "*"
  scale: string;      // window scaling factor, or "*"
  olayout: string[];  // ordered TCP options
  quirks: string[];   // comma-separated quirk flags
  pclass: string;     // payload class: "0" (no payload) or "+"
}

export interface FieldNote {
  field: string;
  value: string;
  meaning: string;
}

export interface OptionNote {
  token: string;
  name: string;
  note: string;
}

export interface QuirkNote {
  token: string;
  meaning: string;
}

export interface OsHint {
  label: string;
  confidence: "exact" | "family" | "none";
  rationale: string;
}

export interface P0fAnalysis {
  raw: string;
  fields: P0fFields;
  fieldNotes: FieldNote[];
  ttlNote: string;         // hop / proxy reasoning
  windowNote: string;      // wsize interpretation
  options: OptionNote[];
  quirks: QuirkNote[];
  osHint: OsHint;
}

// -- TCP option shorthand (p0f/docs/README, "olayout") -----------------------
const OPTION_NAMES: Record<string, [string, string]> = {
  mss: ["Maximum Segment Size", "advertises the largest TCP payload the sender will accept; tied to the interface MTU"],
  nop: ["No-Operation", "a single padding byte used to align later options to word boundaries; its count and position are themselves a fingerprint"],
  ws: ["Window Scale", "the shift applied to the window field, allowing windows above 64 KB"],
  sok: ["Selective ACK Permitted", "announces support for selective acknowledgements"],
  sack: ["Selective ACK", "carries selective-ACK blocks (unusual in a SYN)"],
  ts: ["Timestamps", "enables RTT measurement and PAWS; its presence and position vary by stack"],
  eol: ["End of Options", "explicit end-of-options marker, sometimes followed by padding bytes (eol+N)"],
};

// -- Quirk flags (p0f/docs/README, "quirks") ---------------------------------
const QUIRK_MEANINGS: Record<string, string> = {
  df: "the IP Don't-Fragment bit is set",
  "id+": "DF is set and the IP ID field is non-zero (many modern stacks)",
  "id-": "DF is not set yet the IP ID field is zero",
  ecn: "an explicit congestion-notification flag is set",
  "0+": "the IP 'must be zero' field is non-zero",
  flow: "the IPv6 flow label is non-zero",
  "seq-": "the TCP sequence number is zero",
  "ack+": "the ACK field is non-zero while the ACK flag is clear",
  "ack-": "the ACK field is zero while the ACK flag is set",
  "uptr+": "the urgent pointer is non-zero while the URG flag is clear",
  "urgf+": "the URG flag is set",
  "pushf+": "the PUSH flag is set",
  "ts1-": "the first timestamp value is zero",
  "ts2+": "the second timestamp is non-zero in a SYN",
  "opt+": "there is non-zero data in the options padding",
  "exws": "the window-scale factor is excessive (greater than 14)",
  "bad": "the TCP options were malformed",
};

// -- Reference OS signatures (subset of the p0f database, matched by shape) ---
// Each is the documented p0f sig; we match on (ittl, olayout, key quirks).
interface RefSig {
  label: string;
  ittl: string;
  olayout: string;      // canonical comma-joined layout
  needQuirks: string[]; // quirks that must be present
}
const REF: RefSig[] = [
  { label: "Linux 3.11 and newer", ittl: "64", olayout: "mss,sok,ts,nop,ws", needQuirks: ["df", "id+"] },
  { label: "Linux 2.6.x", ittl: "64", olayout: "mss,sok,ts,nop,ws", needQuirks: ["df"] },
  { label: "Windows 7 or 8", ittl: "128", olayout: "mss,nop,ws,nop,nop,sok", needQuirks: ["df", "id+"] },
  { label: "Windows 10 or 11", ittl: "128", olayout: "mss,nop,ws,nop,nop,sok", needQuirks: ["df", "id+"] },
  { label: "macOS or iOS (Darwin)", ittl: "64", olayout: "mss,nop,ws,nop,nop,ts,sok,eol", needQuirks: ["df", "id+"] },
  { label: "FreeBSD", ittl: "64", olayout: "mss,nop,ws,sok,ts", needQuirks: ["df", "id+"] },
];

function classifyTtl(ittl: string): { initial: number | null; note: string } {
  // Strip +dist / - suffixes; the base is the inferred initial TTL.
  const base = ittl.replace(/[+-].*$/, "");
  const n = Number(base);
  if (!Number.isFinite(n)) return { initial: null, note: "The initial TTL could not be parsed." };
  const common = n <= 32 ? 32 : n <= 64 ? 64 : n <= 128 ? 128 : 255;
  const src = { 32: "some embedded and legacy stacks", 64: "Linux, macOS, BSD, Android", 128: "Windows", 255: "some network gear and Solaris" }[common];
  const hops = ittl.includes("+") ? ` The "+${ittl.split("+")[1]}" records the observed hop distance.` : "";
  return {
    initial: common,
    note: `An initial TTL near ${common} is characteristic of ${src}. Because each router decrements TTL, a mismatch between this value and the OS a User-Agent claims is a classic proxy or NAT signal: the packet carries the proxy's stack TTL, not the client's.${hops}`,
  };
}

function classifyWindow(wsize: string, mss: string): string {
  if (wsize === "*") return "The window size is wildcarded, so it varies and is excluded from the match.";
  if (/^mss\*\d+$/.test(wsize)) {
    const mult = wsize.split("*")[1];
    return `The window is expressed as ${mult} times the MSS - a stack that sizes its receive window from the segment size (typical of Linux, whose initial window is often 10 or 20 times MSS).`;
  }
  if (/^mtu\*\d+$/.test(wsize)) return "The window is expressed relative to the interface MTU.";
  if (/^\d+$/.test(wsize)) {
    const n = Number(wsize);
    const hint = n === 65535 ? " 65535 is the classic 16-bit maximum advertised by Windows before scaling." : "";
    return `A fixed window of ${n} bytes.${hint}`;
  }
  return `Window value "${wsize}".`;
}

/** Parse the eight-field p0f v3 signature grammar. */
export function parseP0f(raw: string): P0fFields {
  const s = raw.trim();
  if (!s) throw new P0fInputError("Paste a p0f v3 TCP signature, e.g. 4:64:0:*:mss*20,7:mss,sok,ts,nop,ws:df,id+:0");
  // Optional "label = sig" form: keep only the sig side.
  const sig = s.includes("=") ? s.split("=").slice(1).join("=").trim() : s;
  const parts = sig.split(":");
  if (parts.length !== 8) {
    throw new P0fInputError(`A p0f v3 signature has 8 colon-separated fields (ver:ittl:olen:mss:wsize,scale:olayout:quirks:pclass); found ${parts.length}.`);
  }
  const [ver, ittl, olen, mss, wsizeScale, olayoutRaw, quirksRaw, pclass] = parts;
  if (!/^(4|6|\*)$/.test(ver)) throw new P0fInputError(`The version field must be 4, 6, or * (found "${ver}").`);
  const wsParts = wsizeScale.split(",");
  if (wsParts.length !== 2) throw new P0fInputError(`The window field must be "wsize,scale" (found "${wsizeScale}").`);
  const [wsize, scale] = wsParts;
  const olayout = olayoutRaw === "" ? [] : olayoutRaw.split(",").map((x) => x.trim());
  const quirks = quirksRaw === "" ? [] : quirksRaw.split(",").map((x) => x.trim());
  return { ver, ittl, olen, mss, wsize, scale, olayout, quirks, pclass };
}

export function analyzeP0f(raw: string): P0fAnalysis {
  const f = parseP0f(raw);
  const ttl = classifyTtl(f.ittl);
  const windowNote = classifyWindow(f.wsize, f.mss);

  const fieldNotes: FieldNote[] = [
    { field: "version", value: f.ver, meaning: f.ver === "*" ? "matches both IPv4 and IPv6" : `IPv${f.ver} traffic` },
    { field: "initial TTL", value: f.ittl, meaning: ttl.initial ? `inferred initial TTL near ${ttl.initial}` : "unparsed" },
    { field: "IP options length", value: f.olen, meaning: f.olen === "0" ? "no IP options (the normal case)" : `${f.olen} bytes of IP options / IPv6 extension headers` },
    { field: "MSS", value: f.mss, meaning: f.mss === "*" ? "varies with the sender's link; used to guess the network type" : `${f.mss}-byte maximum segment` },
    { field: "window", value: `${f.wsize},${f.scale}`, meaning: windowNote },
    { field: "options layout", value: f.olayout.join(", ") || "(none)", meaning: "the order of TCP options - one of the strongest signals" },
    { field: "quirks", value: f.quirks.join(", ") || "(none)", meaning: "unusual header characteristics" },
    { field: "payload class", value: f.pclass, meaning: f.pclass === "0" ? "no TCP payload (a bare SYN)" : "carries a payload" },
  ];

  const options: OptionNote[] = f.olayout.map((tok) => {
    const base = tok.replace(/\+.*$/, ""); // eol+N -> eol
    const hit = OPTION_NAMES[base];
    return { token: tok, name: hit ? hit[0] : "unknown option", note: hit ? hit[1] : "not a recognized p0f option token" };
  });

  const quirks: QuirkNote[] = f.quirks.map((tok) => ({ token: tok, meaning: QUIRK_MEANINGS[tok] ?? "an unrecognized quirk token" }));

  // OS hint: exact shape match on ittl + olayout + required quirks.
  const layoutStr = f.olayout.join(",");
  let osHint: OsHint = { label: "No exact database match", confidence: "none", rationale: "The field shape does not match a bundled reference signature; p0f would fall back to a generic family or report unknown." };
  const base = f.ittl.replace(/[+-].*$/, "");
  for (const r of REF) {
    if (r.ittl === base && r.olayout === layoutStr && r.needQuirks.every((q) => f.quirks.includes(q))) {
      osHint = { label: r.label, confidence: "exact", rationale: `Initial TTL ${base}, option layout ${layoutStr}, and quirks ${r.needQuirks.join("+")} match p0f's documented signature for this family.` };
      break;
    }
  }
  if (osHint.confidence === "none" && ttl.initial) {
    const fam = { 32: "an embedded/legacy stack", 64: "a Linux/BSD/Darwin-family stack", 128: "a Windows stack", 255: "network gear or Solaris" }[ttl.initial];
    osHint = { label: `Likely ${fam}`, confidence: "family", rationale: `The option layout is not an exact database entry, but the initial TTL near ${ttl.initial} points to ${fam}.` };
  }

  return { raw: raw.trim(), fields: f, fieldNotes, ttlNote: ttl.note, windowNote, options, quirks, osHint };
}

export function run(input: string): P0fAnalysis {
  return analyzeP0f(input);
}
