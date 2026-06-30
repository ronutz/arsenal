// ============================================================================
// src/lib/tools/syslog-pri-decoder/compute.ts
// ----------------------------------------------------------------------------
// DECODES AND ENCODES A SYSLOG PRI VALUE.
//
// Every syslog message begins with a PRI: a number in angle brackets, like
// <134>, that packs two things together. The formula (RFC 5424 section 6.2.1):
//
//     PRI = Facility * 8 + Severity
//     Facility = PRI / 8   (integer division)
//     Severity = PRI % 8
//
// Facility (0..23) names the subsystem that produced the message; Severity
// (0..7) rates its urgency, with 0 the most severe. The valid PRI range is
// 0..191. This module decodes a PRI to its facility and severity, and encodes a
// facility and severity back to a PRI and its on-the-wire <PRI> form.
//
// Facility and severity numbers are normative; the short keyword names are the
// common BSD convention and are informational. Source: RFC 5424 and RFC 3164.
// Pure and offline.
// ============================================================================

export interface FacilityDef {
  code: number;
  keyword: string;
  description: string;
  commonUse?: string;
}

export interface SeverityDef {
  code: number;
  keyword: string;
  label: string;
  meaning: string;
}

export const FACILITIES: FacilityDef[] = [
  { code: 0, keyword: "kern", description: "kernel messages" },
  { code: 1, keyword: "user", description: "user-level messages" },
  { code: 2, keyword: "mail", description: "mail system" },
  { code: 3, keyword: "daemon", description: "system daemons" },
  { code: 4, keyword: "auth", description: "security and authorization messages" },
  { code: 5, keyword: "syslog", description: "messages generated internally by syslogd" },
  { code: 6, keyword: "lpr", description: "line printer subsystem" },
  { code: 7, keyword: "news", description: "network news subsystem" },
  { code: 8, keyword: "uucp", description: "UUCP subsystem" },
  { code: 9, keyword: "cron", description: "clock daemon" },
  { code: 10, keyword: "authpriv", description: "security and authorization messages (private)" },
  { code: 11, keyword: "ftp", description: "FTP daemon" },
  { code: 12, keyword: "ntp", description: "NTP subsystem" },
  { code: 13, keyword: "audit", description: "log audit" },
  { code: 14, keyword: "alert", description: "log alert" },
  { code: 15, keyword: "cron2", description: "clock daemon (note 2)" },
  { code: 16, keyword: "local0", description: "local use 0", commonUse: "F5 BIG-IP LTM logs here by default." },
  { code: 17, keyword: "local1", description: "local use 1" },
  { code: 18, keyword: "local2", description: "local use 2" },
  { code: 19, keyword: "local3", description: "local use 3" },
  { code: 20, keyword: "local4", description: "local use 4", commonUse: "Cisco ASA firewalls default here." },
  { code: 21, keyword: "local5", description: "local use 5" },
  { code: 22, keyword: "local6", description: "local use 6" },
  { code: 23, keyword: "local7", description: "local use 7", commonUse: "Common default for network devices, including FortiGate and many Cisco switches and routers." },
];

export const SEVERITIES: SeverityDef[] = [
  { code: 0, keyword: "emerg", label: "Emergency", meaning: "System is unusable." },
  { code: 1, keyword: "alert", label: "Alert", meaning: "Action must be taken immediately." },
  { code: 2, keyword: "crit", label: "Critical", meaning: "Critical conditions." },
  { code: 3, keyword: "err", label: "Error", meaning: "Error conditions." },
  { code: 4, keyword: "warning", label: "Warning", meaning: "Warning conditions." },
  { code: 5, keyword: "notice", label: "Notice", meaning: "Normal but significant condition." },
  { code: 6, keyword: "info", label: "Informational", meaning: "Informational messages." },
  { code: 7, keyword: "debug", label: "Debug", meaning: "Debug-level messages." },
];

export interface DecodeResult {
  ok: boolean;
  pri?: number;
  wire?: string; // "<134>"
  facility?: FacilityDef;
  severity?: SeverityDef;
  /** True when PRI is 12..15, whose facility assignment varies by implementation. */
  facilityNote?: boolean;
  error?: { message: string };
}

export interface EncodeResult {
  ok: boolean;
  pri?: number;
  wire?: string;
  facility?: FacilityDef;
  severity?: SeverityDef;
  error?: { message: string };
}

const MAX_PRI = 191;

/** decodePri - parse a PRI value (with or without angle brackets) into facility and severity. */
export function decodePri(input: string): DecodeResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: { message: "Enter a PRI value, for example 134 or <134>." } };

  // Accept "<134>" or "134". Reject anything else.
  const m = trimmed.match(/^<?(\d{1,3})>?$/);
  if (!m) return { ok: false, error: { message: "A PRI is a number from 0 to 191, optionally wrapped in angle brackets." } };

  // Leading zeros are not valid per RFC 5424 (except the single value "0").
  if (m[1].length > 1 && m[1][0] === "0") {
    return { ok: false, error: { message: "A PRI must not have leading zeros (only the value 0 may start with 0)." } };
  }

  const pri = parseInt(m[1], 10);
  if (pri > MAX_PRI) return { ok: false, error: { message: `PRI ${pri} is out of range; the maximum is ${MAX_PRI} (facility 23, severity 7).` } };

  const facCode = Math.floor(pri / 8);
  const sevCode = pri % 8;
  return {
    ok: true,
    pri,
    wire: `<${pri}>`,
    facility: FACILITIES[facCode],
    severity: SEVERITIES[sevCode],
    facilityNote: facCode >= 12 && facCode <= 15,
  };
}

/** encodePri - combine a facility (0..23) and severity (0..7) into a PRI value. */
export function encodePri(facility: number, severity: number): EncodeResult {
  if (!Number.isInteger(facility) || facility < 0 || facility > 23) {
    return { ok: false, error: { message: "Facility must be an integer from 0 to 23." } };
  }
  if (!Number.isInteger(severity) || severity < 0 || severity > 7) {
    return { ok: false, error: { message: "Severity must be an integer from 0 to 7." } };
  }
  const pri = facility * 8 + severity;
  return { ok: true, pri, wire: `<${pri}>`, facility: FACILITIES[facility], severity: SEVERITIES[severity] };
}

/** run - the primary direction is decode. Never throws. */
export function run(input: string): DecodeResult {
  return decodePri(input);
}
