// ============================================================================
// src/lib/tools/syslog-message-parser/compute.ts
// ----------------------------------------------------------------------------
// THE SYSLOG MESSAGE PARSER (catalogue rank 35, "Parses a full syslog line ...
// Reuses the PRI decoder"; PRIME 2026-10-05 02:47). One syslog message in
// (or a TCP frame carrying one); out comes every field named, in the order
// the standard names them, with what is non-compliant flagged in the
// standard's own words. Two grammars: RFC 5424 (VERSION 1, the structured
// one) and the BSD form RFC 3164 describes (TIMESTAMP "Mmm dd hh:mm:ss",
// HOSTNAME, TAG, CONTENT). The facility and severity tables come from the
// syslog PRI decoder (live since 2026-06-29) so the two tools cannot disagree.
// Pure, deterministic, bounded.
//
// FACTS, with their sources (read 2026-10-05):
//   RFC 5424 §6: SYSLOG-MSG = HEADER SP STRUCTURED-DATA [SP MSG]; HEADER = PRI
//   VERSION SP TIMESTAMP SP HOSTNAME SP APP-NAME SP PROCID SP MSGID; NILVALUE
//   "-"; HOSTNAME 1*255, APP-NAME 1*48, PROCID 1*128, MSGID 1*32 PRINTUSASCII.
//   §6.1: receivers MUST accept 480 octets, SHOULD accept 2048. §6.2.1: PRI
//   (the PRI decoder). §6.2.2: VERSION = NONZERO-DIGIT 0*2DIGIT, "This document
//   uses a VERSION value of 1". §6.2.3: TIMESTAMP derived from RFC 3339, "T" and
//   "Z" upper case, "Leap seconds MUST NOT be used", TIME-SECFRAC = "." 1*6DIGIT,
//   or NILVALUE. §6.3: SD-ELEMENT = "[" SD-ID *(SP SD-PARAM) "]", SD-ID at most 32
//   characters, "The same SD-ID MUST NOT exist more than once in a message",
//   registered names without "@", private names with "@" and an enterprise
//   number; §6.3.3: PARAM-VALUE escapes for '"', '\' and ']'.
//   §6.4: a UTF-8 MSG MUST start with the BOM. §7: the IANA SD-IDs timeQuality
//   (tzKnown, isSynced, syncAccuracy), origin (ip, enterpriseId, software,
//   swVersion), meta (sequenceId, sysUpTime, language).
//   RFC 3164 §4.1.2: TIMESTAMP "Mmm dd hh:mm:ss", the month abbreviations, a
//   day under 10 written with a leading space; HOSTNAME the device's name or
//   its IP address; §4.1.3: TAG alphanumeric, MUST NOT exceed 32 characters,
//   any non-alphanumeric character ends it; §4.1: a packet MUST be 1024 bytes
//   or less.
//   RFC 5426 §3.1 and §7: UDP port 514. RFC 5425 §4.1: TCP port 6514 for TLS.
//   RFC 6587 §3.4.1: octet counting, SYSLOG-FRAME = MSG-LEN SP SYSLOG-MSG, "It
//   can be assumed that octet-counting framing is used if a syslog frame
//   starts with a digit"; §3.4.2: non-transparent framing, a TRAILER, most
//   often LF.
// ============================================================================

import { FACILITIES, SEVERITIES, type FacilityDef, type SeverityDef } from "../syslog-pri-decoder/compute";

/** The facility of a PRI: the quotient by 8 (RFC 5424 §6.2.1 in reverse). */
function facilityOf(pri: number): FacilityDef {
  // The table row.
  return FACILITIES[Math.floor(pri / 8)];
}

/** The severity of a PRI: the remainder by 8. */
function severityOf(pri: number): SeverityDef {
  // The table row.
  return SEVERITIES[pri % 8];
}

/** The input: one message, or one TCP frame. */
export interface SyslogDecodeInput {
  /** The message text as received. */
  text: string;
}

/** One named field. */
export interface Field {
  /** The field's name as the standard writes it (PRI, VERSION, TIMESTAMP, HOSTNAME, APP-NAME, PROCID, MSGID, STRUCTURED-DATA, MSG; TAG, CONTENT for BSD). */
  name: string;
  /** The raw text of the field, or null when absent. */
  value: string | null;
  /** The NILVALUE "-" was used. */
  nil: boolean;
  /** Finding codes for this field (the UI translates): see FINDINGS below. */
  findings: string[];
  /** A decoded meaning where there is one (the PRI's facility and severity; a timestamp's parts; the SD element parameters). */
  decoded?: Record<string, unknown>;
}

/** One structured-data element. */
export interface SdElement {
  /** The SD-ID, with its enterprise number when private ("exampleSDID@32473"). */
  id: string;
  /** IANA-registered (timeQuality, origin, meta) or private ("@" with an enterprise number) or non-compliant. */
  registry: "iana" | "private" | "non-compliant";
  /** The parameters in order. */
  params: { name: string; value: string }[];
  /** Finding codes. */
  findings: string[];
}

/** The decoded message. */
export interface SyslogDecodeResult {
  /** Which grammar matched: "rfc5424", "bsd" (RFC 3164 form), or "unknown". */
  grammar: "rfc5424" | "bsd" | "unknown";
  /** The TCP framing seen, if any: octet counting (a leading length), a trailing LF, or none. */
  framing: { kind: "octet-counting" | "non-transparent" | "none"; declared?: number; actual?: number; findings: string[] };
  /** The fields in order. */
  fields: Field[];
  /** The PRI decoded, when present (the facility and severity rows of the PRI decoder's tables). */
  pri: { value: number; facility: FacilityDef; severity: SeverityDef } | null;
  /** Structured data elements (RFC 5424). */
  structuredData: SdElement[];
  /** Message-level findings. */
  findings: string[];
  /** Length facts: octets of the message, against the 480/2048 (RFC 5424) and 1024 (RFC 3164) limits. */
  length: { octets: number; chars: number };
  /** The input was cut at the limit. */
  truncated: boolean;
}

/** The input limit. */
export const MAX_CHARS = 8192;

/** The IANA structured-data IDs of RFC 5424 §7 and their parameters. */
export const IANA_SD: Record<string, string[]> = {
  timeQuality: ["tzKnown", "isSynced", "syncAccuracy"],
  origin: ["ip", "enterpriseId", "software", "swVersion"],
  meta: ["sequenceId", "sysUpTime", "language"],
};

/** The BSD month abbreviations, the only acceptable values (RFC 3164 §4.1.2). */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** True when every character is printable US-ASCII (%d33-126). */
function printUsAscii(s: string): boolean {
  // The ABNF PRINTUSASCII range.
  return /^[\x21-\x7e]+$/.test(s);
}

/** Octets of a string in UTF-8. */
function octets(s: string): number {
  // The encoder's length.
  return new TextEncoder().encode(s).length;
}

/** Parse the RFC 3339-derived TIMESTAMP of RFC 5424 §6.2.3; returns the parts and findings. */
function parseTimestamp5424(ts: string): { decoded: Record<string, unknown> | undefined; findings: string[] } {
  // The findings.
  const findings: string[] = [];
  // The grammar: FULL-DATE "T" FULL-TIME, FULL-TIME = PARTIAL-TIME TIME-OFFSET, TIME-OFFSET = "Z" / TIME-NUMOFFSET.
  const m = /^(\d{4})-(\d{2})-(\d{2})([Tt])(\d{2}):(\d{2}):(\d{2})(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/.exec(ts);
  // Not the grammar at all.
  if (!m) return { decoded: undefined, findings: ["timestamp-not-rfc3339"] };
  // The "T" and "Z" MUST be upper case.
  if (m[4] === "t" || m[9] === "z") findings.push("timestamp-lowercase-tz");
  // TIME-SECFRAC is 1 to 6 digits.
  if (m[8] && m[8].length - 1 > 6) findings.push("timestamp-fraction-too-long");
  // "Leap seconds MUST NOT be used" (§6.2.3): a 60th second is one.
  if (Number(m[7]) === 60) findings.push("timestamp-leap-second");
  // The parts.
  return { decoded: { date: `${m[1]}-${m[2]}-${m[3]}`, time: `${m[5]}:${m[6]}:${m[7]}${m[8] ?? ""}`, offset: m[9].toUpperCase() === "Z" ? "Z (UTC)" : m[9], utc: m[9].toUpperCase() === "Z" }, findings };
}

/** Parse the STRUCTURED-DATA of RFC 5424 §6.3 from the position after the MSGID's space; returns the elements, the text consumed and findings. */
function parseStructuredData(rest: string): { elements: SdElement[]; consumed: number; findings: string[]; raw: string } {
  // NILVALUE: no structured data.
  if (rest.startsWith("-") && (rest.length === 1 || rest[1] === " ")) return { elements: [], consumed: 1, findings: [], raw: "-" };
  // Must start with "[".
  if (!rest.startsWith("[")) return { elements: [], consumed: 0, findings: ["sd-missing"], raw: "" };
  // Walk the elements.
  const elements: SdElement[] = [];
  const findings: string[] = [];
  let i = 0;
  // One element after another, with no space between them (§6.3: elements are adjacent).
  while (i < rest.length && rest[i] === "[") {
    // Past the bracket.
    i += 1;
    // The SD-ID up to a space or the closing bracket.
    let j = i;
    while (j < rest.length && rest[j] !== " " && rest[j] !== "]") j += 1;
    // The id.
    const id = rest.slice(i, j);
    // The element.
    const el: SdElement = { id, registry: "non-compliant", params: [], findings: [] };
    // Classify the id: IANA names without "@", private names with "@" and an enterprise number, else non-compliant.
    if (id in IANA_SD) el.registry = "iana";
    else if (/^[\x21-\x7e]{1,32}$/.test(id) && !/["\]=]/.test(id) && /@\d+/.test(id)) el.registry = "private";
    else { el.registry = "non-compliant"; el.findings.push(id.includes("@") ? "sd-id-bad-chars" : "sd-id-unregistered-no-pen"); }
    // The SD-ID is at most 32 characters.
    if (id.length > 32) el.findings.push("sd-id-too-long");
    // Parameters: SP PARAM-NAME "=" DQUOTE PARAM-VALUE DQUOTE, repeated.
    i = j;
    while (i < rest.length && rest[i] === " ") {
      // Past the space.
      i += 1;
      // The name up to "=".
      let k = i;
      while (k < rest.length && rest[k] !== "=" && rest[k] !== " " && rest[k] !== "]") k += 1;
      // No "=": malformed.
      if (rest[k] !== "=" || rest[k + 1] !== '"') { el.findings.push("sd-param-malformed"); break; }
      // The name.
      const name = rest.slice(i, k);
      // The value: up to an unescaped quote; the escapes are \" \\ \].
      let v = k + 2;
      let value = "";
      let closed = false;
      while (v < rest.length) {
        // An escape.
        if (rest[v] === "\\" && v + 1 < rest.length && ('"\\]'.includes(rest[v + 1]))) { value += rest[v + 1]; v += 2; continue; }
        // The closing quote.
        if (rest[v] === '"') { closed = true; break; }
        // An unescaped "]" inside a value is a finding (§6.3.3: MUST be escaped).
        if (rest[v] === "]") el.findings.push("sd-value-unescaped-bracket");
        // Plain.
        value += rest[v]; v += 1;
      }
      // Unclosed value.
      if (!closed) { el.findings.push("sd-param-unclosed"); i = v; break; }
      // The parameter.
      el.params.push({ name, value });
      // The IANA parameters are known; an unknown one under an IANA id is a finding.
      if (el.registry === "iana" && !IANA_SD[id].includes(name)) el.findings.push("sd-param-unknown-for-iana-id");
      // Past the quote.
      i = v + 1;
    }
    // The closing bracket.
    if (rest[i] === "]") i += 1;
    else { el.findings.push("sd-element-unclosed"); elements.push(el); return { elements, consumed: i, findings, raw: rest.slice(0, i) }; }
    // Keep it.
    elements.push(el);
  }
  // The same SD-ID must not appear twice (§6.3.2).
  const seen = new Set<string>();
  for (const el of elements) { if (seen.has(el.id)) el.findings.push("sd-id-duplicate"); seen.add(el.id); }
  // Done.
  return { elements, consumed: i, findings, raw: rest.slice(0, i) };
}

/** The engine. */
export function run(input: SyslogDecodeInput): SyslogDecodeResult {
  // The text, cut at the limit; a trailing newline is the non-transparent trailer, noted below.
  const given = input.text ?? "";
  const truncated = given.length > MAX_CHARS;
  let text = truncated ? given.slice(0, MAX_CHARS) : given;
  // Findings at message level.
  const findings: string[] = [];
  // Framing: a trailing LF or CRLF is non-transparent framing (RFC 6587 §3.4.2).
  const framing: SyslogDecodeResult["framing"] = { kind: "none", findings: [] };
  if (/\r?\n$/.test(text)) { framing.kind = "non-transparent"; text = text.replace(/\r?\n$/, ""); }
  // Framing: a leading digit count followed by a space is octet counting (RFC 6587 §3.4.1).
  const oc = /^([1-9]\d*) (?=<)/.exec(text);
  if (oc) {
    // The declared and actual lengths.
    const declared = Number(oc[1]);
    const body = text.slice(oc[0].length);
    const actual = octets(body);
    framing.kind = "octet-counting"; framing.declared = declared; framing.actual = actual;
    if (declared !== actual) framing.findings.push("frame-length-mismatch");
    text = body;
  }
  // The fields.
  const fields: Field[] = [];
  // Lengths.
  const length = { octets: octets(text), chars: text.length };
  // The PRI: required by both grammars.
  const priMatch = /^<(\d{1,3})>/.exec(text);
  let pri: SyslogDecodeResult["pri"] = null;
  if (!priMatch) {
    // No PRI: say so and stop (nothing else can be named with confidence).
    fields.push({ name: "PRI", value: null, nil: false, findings: ["pri-missing"] });
    return { grammar: "unknown", framing, fields, pri: null, structuredData: [], findings: ["no-grammar"], length, truncated };
  }
  // Decode the PRI through the shared arithmetic.
  const priFindings: string[] = [];
  const priVal = Number(priMatch[1]);
  if (priMatch[1].length > 1 && priMatch[1].startsWith("0")) priFindings.push("pri-leading-zero");
  if (priVal > 191) priFindings.push("pri-out-of-range");
  else pri = { value: priVal, facility: facilityOf(priVal), severity: severityOf(priVal) };
  fields.push({ name: "PRI", value: priMatch[0], nil: false, findings: priFindings, decoded: pri ? { facility: pri.facility.code, facilityKeyword: pri.facility.keyword, severity: pri.severity.code, severityKeyword: pri.severity.keyword } : undefined });
  // After the PRI.
  const after = text.slice(priMatch[0].length);
  // RFC 5424: a VERSION (non-zero digit, up to 3 digits) then a space.
  const ver = /^([1-9]\d{0,2}) /.exec(after);
  if (ver) {
    // The grammar.
    const grammar = "rfc5424" as const;
    // VERSION.
    const vFindings: string[] = [];
    if (ver[1] !== "1") vFindings.push("version-not-1");
    fields.push({ name: "VERSION", value: ver[1], nil: false, findings: vFindings });
    // The header fields by splitting on single spaces: TIMESTAMP HOSTNAME APP-NAME PROCID MSGID, then the rest.
    const rest = after.slice(ver[0].length);
    const parts = rest.split(" ");
    // Not enough header fields.
    if (parts.length < 5) {
      fields.push({ name: "HEADER", value: rest, nil: false, findings: ["header-short"] });
      return { grammar, framing, fields, pri, structuredData: [], findings: [...findings, "header-short"], length, truncated };
    }
    // TIMESTAMP.
    const ts = parts[0];
    if (ts === "-") fields.push({ name: "TIMESTAMP", value: ts, nil: true, findings: [] });
    else { const t = parseTimestamp5424(ts); fields.push({ name: "TIMESTAMP", value: ts, nil: false, findings: t.findings, decoded: t.decoded }); }
    // HOSTNAME (1*255 PRINTUSASCII), APP-NAME (1*48), PROCID (1*128), MSGID (1*32).
    const limits: [string, number][] = [["HOSTNAME", 255], ["APP-NAME", 48], ["PROCID", 128], ["MSGID", 32]];
    limits.forEach(([name, max], idx) => {
      // The value.
      const v = parts[idx + 1];
      // Findings.
      const f: string[] = [];
      if (v !== "-") {
        if (!printUsAscii(v)) f.push("field-not-printusascii");
        if (v.length > max) f.push("field-too-long");
      }
      fields.push({ name, value: v, nil: v === "-", findings: f });
    });
    // STRUCTURED-DATA: from after the fifth space.
    const headerLen = parts.slice(0, 5).join(" ").length + 1;
    const tail = rest.slice(headerLen);
    const sd = parseStructuredData(tail);
    const sdField: Field = { name: "STRUCTURED-DATA", value: sd.raw || null, nil: sd.raw === "-", findings: [...sd.findings] };
    if (sd.consumed === 0 && tail.length > 0) sdField.findings.push("sd-missing");
    fields.push(sdField);
    // MSG: after the structured data and one space, optional.
    let msg = tail.slice(sd.consumed);
    const mFindings: string[] = [];
    if (msg.length > 0) {
      // The separating space.
      if (msg.startsWith(" ")) msg = msg.slice(1);
      else mFindings.push("msg-no-space");
      // A UTF-8 BOM says the MSG is UTF-8 (§6.4); non-ASCII without one is a finding.
      const bom = msg.charCodeAt(0) === 0xfeff;
      if (bom) msg = msg.slice(1);
      if (!bom && /[^\x00-\x7f]/.test(msg)) mFindings.push("msg-non-ascii-without-bom");
      fields.push({ name: "MSG", value: msg, nil: false, findings: mFindings, decoded: { utf8Bom: bom } });
    }
    // Length findings against §6.1.
    if (length.octets > 2048) findings.push("length-over-2048");
    else if (length.octets > 480) findings.push("length-over-480");
    // Done.
    return { grammar, framing, fields, pri, structuredData: sd.elements, findings, length, truncated };
  }
  // BSD (RFC 3164): TIMESTAMP "Mmm dd hh:mm:ss" then HOSTNAME then MSG (TAG CONTENT); or the degenerate form without them.
  const bsd = /^([A-Z][a-z]{2}) ( \d|\d\d) (\d{2}):(\d{2}):(\d{2}) (\S+) (.*)$/s.exec(after);
  if (bsd) {
    // The grammar.
    const grammar = "bsd" as const;
    // TIMESTAMP findings: the month must be one of the twelve, the day under 10 space-padded (checked by the pattern).
    const tFindings: string[] = [];
    if (!MONTHS.includes(bsd[1])) tFindings.push("bsd-month-unknown");
    fields.push({ name: "TIMESTAMP", value: `${bsd[1]} ${bsd[2]} ${bsd[3]}:${bsd[4]}:${bsd[5]}`, nil: false, findings: tFindings, decoded: { month: bsd[1], day: bsd[2].trim(), time: `${bsd[3]}:${bsd[4]}:${bsd[5]}`, note: "local time, no year, no zone" } });
    // HOSTNAME.
    fields.push({ name: "HOSTNAME", value: bsd[6], nil: false, findings: printUsAscii(bsd[6]) ? [] : ["field-not-printusascii"] });
    // MSG = TAG CONTENT: the TAG is alphanumeric, ended by the first non-alphanumeric character, at most 32 characters.
    const msg = bsd[7];
    const tag = /^[A-Za-z0-9]+/.exec(msg);
    const tagText = tag ? tag[0] : "";
    const tagFindings: string[] = [];
    if (!tagText) tagFindings.push("bsd-tag-missing");
    if (tagText.length > 32) tagFindings.push("bsd-tag-too-long");
    fields.push({ name: "TAG", value: tagText || null, nil: false, findings: tagFindings });
    fields.push({ name: "CONTENT", value: msg.slice(tagText.length), nil: false, findings: [] });
    // Length against §4.1.
    if (length.octets > 1024) findings.push("length-over-1024");
    // Done.
    return { grammar, framing, fields, pri, structuredData: [], findings, length, truncated };
  }
  // A PRI followed by something that is neither: RFC 3164 §4.3 says a receiver treats the whole remainder as the message.
  // The finding sits on the MSG field only (the row explains itself); repeating it at message level would count it twice.
  fields.push({ name: "MSG", value: after, nil: false, findings: ["bsd-no-header"] });
  if (length.octets > 1024) findings.push("length-over-1024");
  return { grammar: "bsd", framing, fields, pri, structuredData: [], findings, length, truncated };
}
