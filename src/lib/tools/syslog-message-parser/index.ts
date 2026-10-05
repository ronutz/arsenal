// ============================================================================
// src/lib/tools/syslog-message-parser/index.ts
// ----------------------------------------------------------------------------
// THE SYSLOG MESSAGE PARSER: the self-describing {manifest, run, vectors} triple.
//
// One message or TCP frame in; every field named in the order its RFC names
// them, what is non-compliant flagged in the RFC's own words, the structured
// data opened, the framing and the transports explained. Pure, local,
// deterministic.
// ============================================================================

import { run as compute, type SyslogDecodeInput, type SyslogDecodeResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types and helpers.
export type { SyslogDecodeInput, SyslogDecodeResult, Field, SdElement } from "./compute";
// The IANA structured-data ids and the input limit.
export { IANA_SD, MAX_CHARS } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "Protocol & packet decoders",
  // The slug.
  toolSlug: "syslog-message-parser",
  // Other names it answers to.
  canonicalAliases: ["syslog-decoder", "syslog-parser", "rfc5424-parser", "rfc3164-parser", "syslog-message-decoder"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 4, pattern: "^\\s*(\\d+ )?<\\d{1,3}>(1 \\d{4}-\\d{2}-\\d{2}T|[A-Z][a-z]{2} [ \\d]\\d \\d{2}:\\d{2}:\\d{2} )", example: "{\"text\":\"<34>1 2003-10-11T22:14:15.003Z mymachine.example.com su - ID47 - 'su root' failed for lonvick on /dev/pts/8\"}" },
  ],
  // Runs in the browser.
  capabilityBadge: "browser",
  // Nothing leaves the page.
  executionClass: ["localOnly"],
  // Where an API exists for it, it runs this same code.
  apiCapabilityClass: "local-equivalent",
  // The vector set.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile or oversized input is handled: bounded text, parsed by grammar, nothing evaluated.
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  // The default for share links: a log line may carry hostnames and user names; the reader decides.
  shareSafetyDefault: "ask",
  // The Learn articles written for it.
  learnLinks: ["learn/reading-a-syslog-message-field-by-field", "learn/syslog-message-formats"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["syslog-pri-decoder", "log-level-mapper", "http-message-decoder"],
  // Sources, each read live on its access date.
  sources: [
    // RFC 5424: the grammar.
    { id: "rfc5424", label: "RFC 5424, The Syslog Protocol (March 2009), sections 6 to 7", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc5424#section-6", access_date: "2026-10-05", scope: "SYSLOG-MSG = HEADER SP STRUCTURED-DATA [SP MSG]; HEADER = PRI VERSION SP TIMESTAMP SP HOSTNAME SP APP-NAME SP PROCID SP MSGID; the NILVALUE; HOSTNAME 1*255, APP-NAME 1*48, PROCID 1*128, MSGID 1*32 PRINTUSASCII; receivers MUST accept 480 octets and SHOULD accept 2048; VERSION 1; the RFC 3339-derived TIMESTAMP with upper-case T and Z, no leap seconds, up to six fraction digits; SD-ELEMENT, SD-ID at most 32 characters, no duplicate SD-ID, registered names without an at-sign, private names with an enterprise number; the escapes for quote, backslash and bracket; the UTF-8 BOM in MSG; the IANA SD-IDs timeQuality, origin and meta", status: "active" },
    // RFC 3164: the BSD form.
    { id: "rfc3164", label: "RFC 3164, The BSD syslog Protocol (August 2001), sections 4.1 to 4.3", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc3164#section-4.1", access_date: "2026-10-05", scope: "a packet MUST be 1024 bytes or less; TIMESTAMP 'Mmm dd hh:mm:ss' with the twelve month abbreviations and a day under 10 written with a leading space; HOSTNAME the device's name or IP address; TAG alphanumeric and MUST NOT exceed 32 characters, ended by the first non-alphanumeric character; CONTENT the rest; a receiver treats a packet without a valid HEADER as PRI plus message", status: "active" },
    // RFC 5426: UDP.
    { id: "rfc5426", label: "RFC 5426, Transmission of Syslog Messages over UDP (March 2009), sections 3.1 and 7", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc5426#section-3.1", access_date: "2026-10-05", scope: "UDP port 514 as the well-known port for syslog", status: "active" },
    // RFC 5425: TLS.
    { id: "rfc5425", label: "RFC 5425, TLS Transport Mapping for Syslog (March 2009), section 4.1 Port Assignment", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc5425#section-4.1", access_date: "2026-10-05", scope: "'The TCP port 6514 has been allocated as the default port for syslog over TLS'", status: "active" },
    // RFC 6587: TCP framing.
    { id: "rfc6587", label: "RFC 6587, Transmission of Syslog Messages over TCP (April 2012), sections 3.4.1 and 3.4.2", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc6587#section-3.4.1", access_date: "2026-10-05", scope: "octet counting: SYSLOG-FRAME = MSG-LEN SP SYSLOG-MSG, 'It can be assumed that octet-counting framing is used if a syslog frame starts with a digit'; non-transparent framing: SYSLOG-FRAME = SYSLOG-MSG TRAILER, the TRAILER most often LF", status: "active" },
  ],
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: SyslogDecodeInput): SyslogDecodeResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
