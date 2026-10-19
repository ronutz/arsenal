// ============================================================================
// src/lib/tools/dhcp-option-43/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden + reject vectors for the DHCP Option 43 encoder.
//
// THE RULE (PRIME, 2026-10-19): a golden vector's attribution names a document
// that actually contains its bytes, quoted as printed, with the date it was
// read. A vector produced by the code under test and then attributed to a
// vendor proves only that the code agrees with itself, and is not allowed.
//
// Re-checked 2026-10-19 against documents downloaded that day with curl:
//   - Cisco document 97066 (updated July 22, 2026) answered 200 and contains
//     the three Cisco values below verbatim. The old single-controller vector
//     (192.168.10.10 -> f104c0a80a0a) was NOT in it and was replaced with the
//     document's own 192.168.1.10 example.
//   - RUCKUS KB 000008703 (updated May 06, 2020) contains 192.168.1.120 ->
//     060d3139322e3136382e312e313230 and "192.168.1.1 = 11 characters ... 0B",
//     nothing else. The 192.168.0.200 vector was attributed to it but comes from
//     a RUCKUS community post (secondary) and is now attributed there; the KB
//     does not map 03 to ZoneDirector, so the ZoneDirector vector pins only the
//     two bytes the documents do print (03 and 0b).
//   - Cisco Code Exchange's cisco43calc README is a community repository
//     (secondary); its worked example is kept with that label.
//   - Not re-readable on 2026-10-19: help.ui.com (403, Cloudflare challenge),
//     arubanetworking.hpe.com (403, Access Denied) and the whole of
//     documentation.extremenetworks.com (401 Unauthorized, the site root
//     included). The UniFi and Aruba vectors keep their earlier attributions,
//     marked as not re-read. The Extreme vector was removed: its bytes (a bare
//     string) appear in no document read, and its own attribution named a
//     sub-option 1 its output does not contain; the Extreme profile has no
//     golden vector until Extreme's page can be read again.
// ============================================================================

import { run, Option43Error, type Option43ErrorCode } from "./compute";

// Bumped 2026-10-19: vectors re-attributed, one Cisco vector replaced, two added, the Extreme vector removed.
export const GOLDEN_VECTOR_SET_ID = "dhcp-option-43-golden-2026-10-19";

interface Expect {
  hex?: string;
  // The leading bytes only (2026-10-19), for a vendor whose documents print part of a value and not all of it.
  hexPrefix?: string;
  text?: string;
  option?: number;
  encoding?: string;
}

interface Vector {
  vendor: string;
  input: string;
  expect: Expect;
  /** Where the expected value comes from. */
  source: string;
}

export const OPTION43_GOLDEN_VECTORS: readonly Vector[] = [
  // Cisco 97066's worked example for two controllers, read 2026-10-19.
  {
    vendor: "cisco-wlc",
    input: "192.168.10.5 192.168.10.20",
    expect: { hex: "f108c0a80a05c0a80a14", option: 43, encoding: "hex" },
    source:
      "Cisco document 97066, Configure DHCP OPTION 43 for Lightweight Access Points (updated July 22, 2026; read 2026-10-19): 'When the string is assembled, it yields f108c0a80a05c0a80a14.'",
  },
  // Cisco 97066's single-controller example (replaces 192.168.10.10, whose bytes the document does not print).
  {
    vendor: "cisco-wlc",
    input: "192.168.1.10",
    expect: { hex: "f104c0a8010a", option: 43 },
    source:
      "Cisco document 97066 (read 2026-10-19): 'To provision WLC IP address 192.168.1.10 for your APs, use option 43 0xf104.c0a8.010a'",
  },
  // Cisco 97066's second two-controller example (added 2026-10-19).
  {
    vendor: "cisco-wlc",
    input: "192.168.1.10 192.168.1.11",
    expect: { hex: "f108c0a8010ac0a8010b", option: 43 },
    source:
      "Cisco document 97066 (read 2026-10-19): 'To provision WLC IP addresses 192.168.1.10 and 192.168.1.11 for your APs, use option 43 0xf108.c0a8.010a.c0a8.010b'",
  },
  // Community repository on Cisco Code Exchange: a secondary source, labelled as one.
  {
    vendor: "cisco-wlc",
    input: "10.5.11.193 10.5.12.191",
    expect: { hex: "f1080a050bc10a050cbf", option: 43 },
    source:
      "Cisco Code Exchange, cisco43calc README by Brett Verney, v2.0 June 2023, community repository (secondary; read 2026-10-19): 'When we assemble the string, we get f1080a050bc10a050cbf.'",
  },
  // The RUCKUS KB's own example (added 2026-10-19): the only full value the KB prints.
  {
    vendor: "ruckus-smartzone",
    input: "192.168.1.120",
    expect: { hex: "060d3139322e3136382e312e313230", option: 43 },
    source:
      "RUCKUS Support KB 000008703, Understanding DHCP Option 43 Hexadecimal code in Ruckus (updated May 06, 2020; read 2026-10-19): 'e.g. 192.168.1.120', then on the next line 'option 43 hex 060d3139322e3136382e312e313230'",
  },
  // Re-attributed 2026-10-19: this value is in a RUCKUS community post, not in KB 000008703.
  {
    vendor: "ruckus-smartzone",
    input: "192.168.0.200",
    expect: { hex: "060d3139322e3136382e302e323030", option: 43 },
    source:
      "RUCKUS Networks Community, AP Discovery: How to configure DHCP option 43 to discover the controller (discussion 65975, post by a RUCKUS Team Member; secondary; read 2026-10-19): 'the final value to enter in your DHCP server is \"060d3139322e3136382e302e323030\"'",
  },
  // Only the two bytes a document prints: 03 (KB: '03 or 06'; community 65974: ZoneDirector uses sub-option 3) and 0b.
  {
    vendor: "ruckus-zonedirector",
    input: "192.168.1.1",
    expect: { hexPrefix: "030b", option: 43, encoding: "hex" },
    source:
      "RUCKUS KB 000008703 (read 2026-10-19): 'aa = Sub Option Code (this will be 03 or 06)' and '192.168.1.1 = 11 characters the Hex value would be 11, so in Hex is 0B'; RUCKUS Networks Community discussion 65974, How the APs discover the IP address of the controller (secondary; read 2026-10-19), under ZoneDirector: 'DHCP Option 43 sub-option 3'. No document read prints the full value.",
  },
  // Not re-read 2026-10-19: help.ui.com answered 403 (Cloudflare challenge); attribution as before.
  {
    vendor: "unifi-ip",
    input: "192.168.3.10",
    expect: { hex: "0104c0a8030a", option: 43 },
    source:
      "help.ui.com 204909754: 'Start with 0104, then add your static IP ... 192.168.3.10 would be entered as 0104 c0a8030a' (not re-read 2026-10-19: HTTP 403, Cloudflare challenge)",
  },
  // Not re-read 2026-10-19: arubanetworking.hpe.com answered 403 (Access Denied); attribution as before.
  {
    vendor: "aruba",
    input: "10.0.2.15",
    expect: { text: "10.0.2.15", option: 43, encoding: "string" },
    source:
      "arubanetworking.hpe.com: option 43 format String, 'Mobility Controller IP Address. Example: 10.0.2.15'; option 60 must be ArubaAP (not re-read 2026-10-19: HTTP 403, Access Denied)",
  },
  // Extreme's own ISC example (deployment guide read with HTTP 200 on 2026-10-18; 401 on 2026-10-19), text value in sub-option 1.
  {
    vendor: "extreme-wireless",
    input: "10.100.2.36, 10.100.2.22",
    expect: { hexPrefix: "01", option: 43, encoding: "hex" },
    source:
      "Extreme Networks, ExtremeCloud IQ Controller Deployment Guide 10.06.02, Configuring DHCP Option 43 on a Linux Server: 'option HAP.HWC code 1 = text;' and 'option HAP.HWC \"10.100.2.36, 10.100.2.22\";' (2026-10-18 corpus; TO BE RE-READ)",
  },
  // Fortinet 540137 re-read 2026-10-19; the vector pins the option number, which the quotation contains.
  {
    vendor: "fortiap",
    input: "10.10.70.1",
    expect: { option: 138, encoding: "other-option" },
    source:
      "Fortinet Document Library, FortiAP / FortiWiFi 7.2.5, Discovering, authorizing, and deauthorizing FortiAP units (540137; read 2026-10-19): 'The FortiAP acquires the IP address of an AC in DHCP option 138 (the factory default)'",
  },
];

/** Inputs that must be REFUSED, and the code they must be refused with. */
export const OPTION43_REJECT_VECTORS: readonly {
  vendor: string;
  input: string;
  code: Option43ErrorCode;
  why: string;
}[] = [
  { vendor: "cisco-wlc", input: "", code: "empty", why: "no address given" },
  {
    vendor: "cisco-wlc",
    input: "192.168.1.256",
    code: "bad-address",
    why: "octet above 255",
  },
  {
    vendor: "cisco-wlc",
    input: "192.168.010.5",
    code: "bad-address",
    why: "leading zero: some DHCP servers read 010 as octal",
  },
  {
    vendor: "cisco-wlc",
    input: "192.168.1",
    code: "bad-address",
    why: "not a dotted quad",
  },
  {
    vendor: "ruckus-smartzone",
    input: "10.0.0.1 10.0.0.2",
    code: "too-many",
    why: "Ruckus takes a single address in this sub-option",
  },
  {
    vendor: "nonexistent-vendor",
    input: "10.0.0.1",
    code: "unknown-vendor",
    why: "no such profile",
  },
];

export function verifyVectors(): { passed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of OPTION43_GOLDEN_VECTORS) {
    try {
      const r = run(v.vendor, v.input);
      const checks: [string, unknown, unknown][] = [];
      if (v.expect.hex !== undefined) checks.push(["hex", r.hex, v.expect.hex]);
      // A prefix vector compares only the leading bytes the documents print (2026-10-19).
      if (v.expect.hexPrefix !== undefined) checks.push(["hexPrefix", r.hex?.slice(0, v.expect.hexPrefix.length), v.expect.hexPrefix]);
      if (v.expect.text !== undefined) checks.push(["text", r.text, v.expect.text]);
      if (v.expect.option !== undefined) checks.push(["option", r.option, v.expect.option]);
      if (v.expect.encoding !== undefined) checks.push(["encoding", r.encoding, v.expect.encoding]);
      let ok = true;
      for (const [field, got, want] of checks) {
        if (got !== want) {
          failures.push(
            `${v.vendor} "${v.input}": ${field} was ${JSON.stringify(got)}, vendor doc says ${JSON.stringify(want)} (${v.source})`
          );
          ok = false;
        }
      }
      if (ok) passed++;
    } catch (e) {
      failures.push(`${v.vendor} "${v.input}": threw ${(e as Error).message}`);
    }
  }

  for (const v of OPTION43_REJECT_VECTORS) {
    try {
      run(v.vendor, v.input);
      failures.push(`${v.vendor} "${v.input}": was ACCEPTED but must be refused (${v.why})`);
    } catch (e) {
      if (e instanceof Option43Error && e.code === v.code) passed++;
      else
        failures.push(
          `${v.vendor} "${v.input}": refused with ${(e as Option43Error).code ?? "?"}, expected ${v.code}`
        );
    }
  }

  return { passed, failures };
}
