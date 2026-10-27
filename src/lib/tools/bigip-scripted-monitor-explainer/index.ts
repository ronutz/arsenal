// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/bigip-scripted-monitor-explainer/index.ts
// ----------------------------------------------------------------------------
// THE BIG-IP SCRIPTED MONITOR EXPLAINER: the self-describing {manifest, run,
// vectors} triple (D-49), built 2026-10-27.
//
// Paste the file a BIG-IP LTM Scripted monitor reads (send and expect lines,
// kept in /config/eav/) and read it line by line: what each line sends or
// expects, with quotation marks and escape sequences resolved as F5 describes;
// the findings against rules S1 to S16 (CR-LF endings, two spaces or a tab
// after the keyword, characters after a closing quotation mark, an unknown
// keyword or escape, a send with no line ending, a password kept in clear, and
// the forms F5 does not describe); and, given a server transcript in the RFCs'
// "S:" / "C:" notation, the check simulated line by line: pass, fail at a line
// and why, or undetermined at a line because F5's text does not say.
//
// Facts: F5's BIG-IP 21.1.0 LTM Monitors Reference and the TMSH Reference v17
// for ltm monitor scripted, and RFC 5321, 1939, 9051 and 959 for the protocol
// facts, every one downloaded with curl on 2026-10-27 (generic User-Agent,
// no-cache headers, a cache-busting query) and answered HTTP 200. Local and
// deterministic: nothing leaves the browser, nothing connects to anything.
// ============================================================================

import { run as compute, type ScriptedMonitorInput, type ScriptedMonitorResult } from "./compute"; // the engine
import { API_EXAMPLE, GOLDEN_VECTOR_SET_ID, REJECTS, VECTORS } from "./golden-vectors"; // the vectors

// The engine's public types, for the component.
export type { ScriptedMonitorInput, ScriptedMonitorResult, ScriptLine, Finding, Simulation, SimStep, Severity, RuleId, OpenReason, FailReason, HintId, SendEnding, TranscriptInfo } from "./compute";
// The limits, the rule list and the display helpers, for the page and the docs.
export { SCRIPT_MAX_CHARS, TRANSCRIPT_MAX_CHARS, RULES, visible, pictured } from "./compute";
// The vector set, its runner and the Example (D-83).
export { GOLDEN_VECTOR_SET_ID, VECTORS, REJECTS, EXAMPLE, API_EXAMPLE, verifyVectors, pin } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "F5 LTM, iRules & platform", // must equal the catalogue family (D-73)
  toolSlug: "bigip-scripted-monitor-explainer", // the route segment and API path
  canonicalAliases: [
    "scripted monitor", // the monitor type's name
    "bigip scripted monitor", // with the platform
    "ltm monitor scripted", // the tmsh component
    "send expect monitor file", // what the file holds
    "eav send expect script", // where it lives (/config/eav)
  ],
  inputDetectors: [
    {
      // Two lines that each start with send or expect and one space: anchored, one bounded class run per line, linear.
      kind: "regex",
      pattern: "^(?:expect|send) [^\\n]*\\n(?:expect|send) ",
      // The paste box lists the LOWEST number first (S4 sweep, 2026-10-27; 4 ranked it below the Expect explainer's 3,
      // the opposite of the intent): 1 puts a file that opens with two such lines above the Expect explainer, since an
      // Expect script rarely starts that way, and level with the CSS selector tester's over-broad first-line detector.
      priority: 1,
      example: API_EXAMPLE, // vector f5-smtp-example as a request body; also the OpenAPI example
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // one pass over the pasted text; no network, no clock, no randomness
  apiCapabilityClass: "local-equivalent", // the API runs this same engine

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount: VECTORS.length + REJECTS.length, // accept and reject vectors
  dangerousInputHandling: [
    "never-connects", // the transcript is text the reader pastes; nothing is sent to any server
    "script-not-executed", // the script is read, never run
    "masks-credentials", // a PASS or LOGIN password is shown as bullets everywhere, the transcript included
    "length-bound", // 32,768 characters of script, 65,536 of transcript
    "bounded-parse", // one pass per line; anchored, linear patterns only (ReDoS-safe)
  ],
  shareSafetyDefault: "review", // a script or a transcript may carry a password or internal host names

  // -- Teaching & provenance --
  learnLinks: ["learn/bigip-ltm-scripted-monitors", "learn/ltm-health-monitors"], // the article written for it, and the monitors article
  relatedTools: ["expect-script-explainer", "f5-tmsh-config-explainer"], // Expect itself, and the config the monitor sits in
  sources: [
    {
      id: "f5-21-1-0-monitors-settings", // every rule the engine applies
      label: "F5, BIG-IP 21.1.0 LTM Monitors Reference, Monitors Settings Reference: Scripted monitor settings", // the section
      type: "vendor-doc", // F5 TechDocs
      url: "https://techdocs.f5.com/en-us/bigip-21-1-0/big-ip-local-traffic-manager-monitors-reference/monitors-settings-reference.html#scripted-monitor-settings", // fetched 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read the day the tool was built
      scope: "LF not CR-LF line endings; exactly one space after send or expect; the text runs to the end of the line, even when quoted, and characters after a closing quotation mark break the match; a match only on a prefix of the response; the escape sequences \\a \\b \\f \\n \\r \\t \\v \\\\ \\'; lines read in the sequence given, with F5's SMTP example; the file in /config/eav/; Timeout 31 seconds, three times the Interval plus one; a target that does not respond within the Timeout is down; only HTTP, HTTPS, HTTP/2, TCP and UDP monitors support regular expressions", // what it pins
      status: "active", // 21.1 is the current long-term-support release (NOTES)
    },
    {
      id: "f5-tmsh-ltm-monitor-scripted", // the tmsh object
      label: "F5 TMSH Reference v17: ltm monitor scripted", // the manual page
      type: "vendor-doc", // F5 CloudDocs
      url: "https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_scripted.html", // fetched 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read the day the tool was built
      scope: "the options (debug, defaults-from scripted, destination *:*, filename in /config/eav/, interval 10, manual-resume, time-until-up, timeout 31, up-interval); run, stop and show ... test-result for a one-shot test", // what it pins
      status: "active", // the reference the 21.1.0 docs point to for tmsh
    },
    {
      id: "rfc5321", // SMTP
      label: "RFC 5321, Simple Mail Transfer Protocol (October 2008)", // the standard
      type: "rfc", // IETF, from the RFC Editor
      url: "https://www.rfc-editor.org/rfc/rfc5321", // fetched 2026-10-27, HTTP 200 (updated by RFC 7504 only)
      access_date: "2026-10-27", // read the day the tool was built
      scope: "lines end in CRLF and nothing else is a line terminator (2.3.8); the 220 greeting and the 554 refusal (3.1, 4.3.2); EHLO's multiline reply, 250- on all but the last line (4.1.1.1, 4.2.1); QUIT and 221 (4.1.1.10)", // what it pins
      status: "active", // current
    },
    {
      id: "rfc1939", // POP3
      label: "RFC 1939, Post Office Protocol, Version 3 (May 1996)", // the standard
      type: "rfc", // IETF, from the RFC Editor
      url: "https://www.rfc-editor.org/rfc/rfc1939", // fetched 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read the day the tool was built
      scope: "commands and responses end in CRLF, +OK and -ERR sent in upper case (3); the greeting and QUIT in the AUTHORIZATION state (4); USER and PASS (7)", // what it pins
      status: "active", // current
    },
    {
      id: "rfc9051", // IMAP4rev2
      label: "RFC 9051, Internet Message Access Protocol (IMAP), Version 4rev2 (August 2021)", // the standard
      type: "rfc", // IETF, from the RFC Editor
      url: "https://www.rfc-editor.org/rfc/rfc9051", // fetched 2026-10-27, HTTP 200 (obsoletes RFC 3501)
      access_date: "2026-10-27", // read the day the tool was built
      scope: "lines end in CRLF (2.2); LOGOUT answered by an untagged BYE before the tagged OK (6.1.3); LOGIN carries a plaintext password and is not to be used on unprotected connections (6.2.3); the OK, PREAUTH and BYE greetings (7.1.1, 7.1.5)", // what it pins
      status: "active", // current
    },
    {
      id: "rfc959", // FTP
      label: "RFC 959, File Transfer Protocol (October 1985)", // the standard
      type: "rfc", // IETF, from the RFC Editor
      url: "https://www.rfc-editor.org/rfc/rfc959", // fetched 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read the day the tool was built
      scope: "commands end with the Telnet end-of-line code, CRLF (4); replies and multi-line replies (4.2); 120, 220 and 421 on connection, 221 to QUIT, 230 and 331 (4.2.2, 5.4)", // what it pins
      status: "active", // current
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
});

/** run: the registry-facing entry point; the body is {"script": "...", "transcript": "..."}. */
export function run(input: ScriptedMonitorInput): ScriptedMonitorResult {
  // The engine does the work.
  return compute(input);
}

/** The vectors, by the conventional name (the page's Example uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
