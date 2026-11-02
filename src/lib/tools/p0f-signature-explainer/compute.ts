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

// PAGE LANGUAGE (02/11/2026): every sentence and label of the analysis (field
// labels and meanings, the TTL and window notes, option and quirk notes, the OS
// hint and the input errors) is an EngineText (../engine-text.ts): a stable id,
// the English as before, and its values. analyzeP0fLocalisable() returns them
// for the page (pack keys tools.p0f-signature-explainer.engine.<id>);
// analyzeP0f() returns plainText() of the same reading, so the API and the
// golden vectors are unchanged. Thrown P0fInputErrors keep their class and
// message and carry their sentence (withEngineText).
import { say, plainText, withEngineText, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

export class P0fInputError extends Error {}

/**
 * A P0fInputError whose message is the sentence's English, carrying the sentence.
 * @param m the sentence
 * @returns the error to throw
 */
function inputError(m: EngineText): P0fInputError {
  return withEngineText(new P0fInputError(m.text), m); // the class the callers test for, with its sentence
} // inputError

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

/** One field's label, value and meaning. S: string (analyzeP0f) or EngineText (the page's reading). */
export interface FieldNote<S = string> {
  field: S; // the field's label
  value: string;
  meaning: S; // what the value means
}

/** One TCP option token. S as above. */
export interface OptionNote<S = string> {
  token: string;
  name: S | string; // the option's registered name (a plain string), or "unknown option" (S)
  note: S; // what it does
}

/** One quirk token. S as above. */
export interface QuirkNote<S = string> {
  token: string;
  meaning: S; // what it means
}

/** The OS hint. S as above. */
export interface OsHint<S = string> {
  label: S; // the family or OS
  confidence: "exact" | "family" | "none";
  rationale: S; // why
}

/** The analysis. S: string for the API, EngineText for the page. */
export interface P0fAnalysis<S = string> {
  raw: string;
  fields: P0fFields;
  fieldNotes: FieldNote<S>[]; // the eight fields
  ttlNote: S;         // hop / proxy reasoning
  windowNote: S;      // wsize interpretation
  options: OptionNote<S>[]; // the option tokens
  quirks: QuirkNote<S>[]; // the quirk tokens
  osHint: OsHint<S>; // the OS hint
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

function classifyTtl(ittl: string): { initial: number | null; note: EngineText } {
  // Strip +dist / - suffixes; the base is the inferred initial TTL.
  const base = ittl.replace(/[+-].*$/, "");
  const n = Number(base);
  if (!Number.isFinite(n)) return { initial: null, note: say("ttl.unparsed", "The initial TTL could not be parsed.") }; // not a number
  const common = n <= 32 ? 32 : n <= 64 ? 64 : n <= 128 ? 128 : 255;
  const src = { 32: "some embedded and legacy stacks", 64: "Linux, macOS, BSD, Android", 128: "Windows", 255: "some network gear and Solaris" }[common];
  const hops = ittl.includes("+") ? ` The "+${ittl.split("+")[1]}" records the observed hop distance.` : "";
  const srcText = say(`ttl.src${common}`, src!); // the stacks that start there, with its id
  const english = `An initial TTL near ${common} is characteristic of ${src}. Because each router decrements TTL, a mismatch between this value and the OS a User-Agent claims is a classic proxy or NAT signal: the packet carries the proxy's stack TTL, not the client's.${hops}`; // the English as always
  return {
    initial: common,
    note: hops // with or without the hop clause, one id each
      ? say("ttl.noteHops", english, { initial: String(common), src: srcText, hops: ittl.split("+")[1] }) // with the observed hop distance
      : say("ttl.note", english, { initial: String(common), src: srcText }), // without
  };
}

function classifyWindow(wsize: string, mss: string): EngineText {
  if (wsize === "*") return say("win.wild", "The window size is wildcarded, so it varies and is excluded from the match."); // wildcard
  if (/^mss\*\d+$/.test(wsize)) {
    const mult = wsize.split("*")[1];
    return say("win.mss", `The window is expressed as ${mult} times the MSS - a stack that sizes its receive window from the segment size (typical of Linux, whose initial window is often 10 or 20 times MSS).`, { mult }); // a multiple of the MSS
  }
  if (/^mtu\*\d+$/.test(wsize)) return say("win.mtu", "The window is expressed relative to the interface MTU."); // a multiple of the MTU
  if (/^\d+$/.test(wsize)) {
    const n = Number(wsize);
    const hint = n === 65535 ? " 65535 is the classic 16-bit maximum advertised by Windows before scaling." : "";
    return hint ? say("win.fixed65535", `A fixed window of ${n} bytes.${hint}`) : say("win.fixed", `A fixed window of ${n} bytes.`, { n: String(n) }); // 65535 has its own sentence
  }
  return say("win.other", `Window value "${wsize}".`, { value: wsize }); // anything else
}

/** Parse the eight-field p0f v3 signature grammar. */
export function parseP0f(raw: string): P0fFields {
  const s = raw.trim();
  if (!s) throw inputError(say("err.empty", "Paste a p0f v3 TCP signature, e.g. 4:64:0:*:mss*20,7:mss,sok,ts,nop,ws:df,id+:0")); // nothing pasted
  // Optional "label = sig" form: keep only the sig side.
  const sig = s.includes("=") ? s.split("=").slice(1).join("=").trim() : s;
  const parts = sig.split(":");
  if (parts.length !== 8) {
    throw inputError(say("err.fields", `A p0f v3 signature has 8 colon-separated fields (ver:ittl:olen:mss:wsize,scale:olayout:quirks:pclass); found ${parts.length}.`, { count: String(parts.length) })); // not eight fields
  }
  const [ver, ittl, olen, mss, wsizeScale, olayoutRaw, quirksRaw, pclass] = parts;
  if (!/^(4|6|\*)$/.test(ver)) throw inputError(say("err.version", `The version field must be 4, 6, or * (found "${ver}").`, { ver })); // a bad version
  const wsParts = wsizeScale.split(",");
  if (wsParts.length !== 2) throw inputError(say("err.window", `The window field must be "wsize,scale" (found "${wsizeScale}").`, { value: wsizeScale })); // a bad window field
  const [wsize, scale] = wsParts;
  const olayout = olayoutRaw === "" ? [] : olayoutRaw.split(",").map((x) => x.trim());
  const quirks = quirksRaw === "" ? [] : quirksRaw.split(",").map((x) => x.trim());
  return { ver, ittl, olen, mss, wsize, scale, olayout, quirks, pclass };
}

export function analyzeP0f(raw: string): P0fAnalysis {
  return plainText(analyzeP0fLocalisable(raw)); // the page's reading with every sentence as its English
}

/**
 * The same analysis with every sentence as an EngineText, for the page (02/11/2026).
 * @param raw the signature as pasted
 * @returns the analysis, sentences with ids
 */
export function analyzeP0fLocalisable(raw: string): P0fAnalysis<EngineText> {
  const f = parseP0f(raw);
  const ttl = classifyTtl(f.ittl);
  const windowNote = classifyWindow(f.wsize, f.mss);

  const fieldNotes: FieldNote<EngineText>[] = [ // the eight fields, labels and meanings with ids
    { field: say("field.version", "version"), value: f.ver, meaning: f.ver === "*" ? say("mean.verAny", "matches both IPv4 and IPv6") : say("mean.ver", `IPv${f.ver} traffic`, { ver: f.ver }) }, // version
    { field: say("field.ittl", "initial TTL"), value: f.ittl, meaning: ttl.initial ? say("mean.ittl", `inferred initial TTL near ${ttl.initial}`, { initial: String(ttl.initial) }) : say("mean.unparsed", "unparsed") }, // initial TTL
    { field: say("field.olen", "IP options length"), value: f.olen, meaning: f.olen === "0" ? say("mean.olenNone", "no IP options (the normal case)") : say("mean.olen", `${f.olen} bytes of IP options / IPv6 extension headers`, { n: f.olen }) }, // IP options length
    { field: say("field.mss", "MSS"), value: f.mss, meaning: f.mss === "*" ? say("mean.mssAny", "varies with the sender's link; used to guess the network type") : say("mean.mss", `${f.mss}-byte maximum segment`, { n: f.mss }) }, // MSS
    { field: say("field.window", "window"), value: `${f.wsize},${f.scale}`, meaning: windowNote }, // window
    { field: say("field.olayout", "options layout"), value: f.olayout.join(", ") || "(none)", meaning: say("mean.olayout", "the order of TCP options - one of the strongest signals") }, // options layout (the "(none)" value stays as the API writes it)
    { field: say("field.quirks", "quirks"), value: f.quirks.join(", ") || "(none)", meaning: say("mean.quirks", "unusual header characteristics") }, // quirks
    { field: say("field.pclass", "payload class"), value: f.pclass, meaning: f.pclass === "0" ? say("mean.pclassNone", "no TCP payload (a bare SYN)") : say("mean.pclass", "carries a payload") }, // payload class
  ];

  const options: OptionNote<EngineText>[] = f.olayout.map((tok) => { // each option token, notes with ids
    const base = tok.replace(/\+.*$/, ""); // eol+N -> eol
    const hit = OPTION_NAMES[base];
    return { token: tok, name: hit ? hit[0] : say("opt.unknown", "unknown option"), note: hit ? say(`opt.${base}`, hit[1]) : say("opt.unknownNote", "not a recognised p0f option token") }; // a known option's note by its token
  });

  const quirks: QuirkNote<EngineText>[] = f.quirks.map((tok) => ({ token: tok, meaning: QUIRK_MEANINGS[tok] !== undefined ? say(`quirk.${tok.replace(/\+/g, "_plus").replace(/-/g, "_minus")}`, QUIRK_MEANINGS[tok]) : say("quirk.unknown", "an unrecognised quirk token") })); // each quirk, by its token

  // OS hint: exact shape match on ittl + olayout + required quirks.
  const layoutStr = f.olayout.join(",");
  let osHint: OsHint<EngineText> = { label: say("os.noMatch", "No exact database match"), confidence: "none", rationale: say("os.noMatchWhy", "The field shape does not match a bundled reference signature; p0f would fall back to a generic family or report unknown.") }; // no match yet
  const base = f.ittl.replace(/[+-].*$/, "");
  for (const r of REF) {
    if (r.ittl === base && r.olayout === layoutStr && r.needQuirks.every((q) => f.quirks.includes(q))) {
      osHint = { label: say(`ref.${REF.indexOf(r)}`, r.label), confidence: "exact", rationale: say("os.exactWhy", `Initial TTL ${base}, option layout ${layoutStr}, and quirks ${r.needQuirks.join("+")} match p0f's documented signature for this family.`, { ttl: base, layout: layoutStr, quirks: r.needQuirks.join("+") }) }; // an exact reference match
      break;
    }
  }
  if (osHint.confidence === "none" && ttl.initial) {
    const fam = { 32: "an embedded/legacy stack", 64: "a Linux/BSD/Darwin-family stack", 128: "a Windows stack", 255: "network gear or Solaris" }[ttl.initial];
    const famText = say(`os.fam${ttl.initial}`, fam!); // the family, with its id
    osHint = { label: say("os.likely", `Likely ${fam}`, { fam: famText }), confidence: "family", rationale: say("os.familyWhy", `The option layout is not an exact database entry, but the initial TTL near ${ttl.initial} points to ${fam}.`, { initial: String(ttl.initial), fam: famText }) }; // a family by TTL alone
  }

  return { raw: raw.trim(), fields: f, fieldNotes, ttlNote: ttl.note, windowNote, options, quirks, osHint };
}

export function run(input: string): P0fAnalysis {
  return analyzeP0f(input);
}
