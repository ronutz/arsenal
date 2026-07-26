// ============================================================================
// src/lib/tools/fortigate-security-profile-coverage-checker/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS.
//
// These pin the BLIND-versus-DEGRADED split hard, because it is the whole
// judgement of the tool. Reporting application control as blind behind
// certificate inspection would be wrong (SNI still identifies some traffic),
// and reporting AntiVirus as merely degraded would be worse — it would tell
// someone a profile is partly working when it is doing nothing at all.
// ============================================================================

import { run } from "./compute";

export const SET_ID = "fortigate-security-profile-coverage-checker/golden@1";

export interface CoverageVector {
  readonly name: string;
  readonly input: string;
  /** profile label -> expected coverage. */
  readonly expect: Readonly<Record<string, string>>;
  readonly mustFind?: string;
}

const RAW: readonly CoverageVector[] = [
  {
    // THE case: certificate inspection leaves payload-readers blind.
    name: "certificate inspection blinds AntiVirus and IPS on HTTPS",
    input: `traffic: https
ssl: certificate
mode: proxy
profiles: antivirus, ips`,
    expect: { AntiVirus: "blind", IPS: "blind" },
    mustFind: "attached and configured and does nothing",
  },
  {
    // The split: app control and web filter DEGRADE, they do not go blind.
    name: "application control and web filter degrade rather than blind",
    input: `traffic: https
ssl: certificate
mode: proxy
profiles: application-control, web-filter`,
    expect: { "Application control": "degraded", "Web filter": "degraded" },
    mustFind: "SNI",
  },
  {
    // Deep inspection restores payload access.
    name: "deep inspection makes payload readers effective",
    input: `traffic: https
ssl: deep
mode: proxy
profiles: antivirus, ips, dlp`,
    expect: { AntiVirus: "effective", IPS: "effective", DLP: "effective" },
  },
  {
    // Plain HTTP needs no decryption at all.
    name: "plain HTTP needs no decryption",
    input: `traffic: http
ssl: none
mode: proxy
profiles: antivirus, ips`,
    expect: { AntiVirus: "effective", IPS: "effective" },
  },
  {
    // Flow mode caveats surface even when coverage exists.
    name: "flow mode degrades AntiVirus with a stated caveat",
    input: `traffic: http
ssl: none
mode: flow
profiles: antivirus`,
    expect: { AntiVirus: "degraded" },
    mustFind: "oversize-file action",
  },
  {
    // Link 1 short-circuits everything.
    name: "a deny policy makes every profile irrelevant",
    input: `traffic: https
ssl: deep
mode: proxy
policy: deny
profiles: antivirus, ips, application-control`,
    expect: { AntiVirus: "blind", IPS: "blind", "Application control": "blind" },
    mustFind: "never reaches any security profile",
  },
  {
    name: "empty input yields the reference card",
    input: "",
    expect: {},
  },
];

export const VECTORS: readonly CoverageVector[] = Object.freeze(RAW);

export function verifyVectors(): { ok: true; count: number } {
  for (const v of VECTORS) {
    const { result } = run(v.input);
    for (const [label, want] of Object.entries(v.expect)) {
      const f = result.findings.find((x) => x.profile === label);
      if (!f) throw new Error(`[${SET_ID}] "${v.name}": no finding for "${label}"`);
      if (f.coverage !== want) {
        throw new Error(`[${SET_ID}] "${v.name}": ${label} expected ${want}, got ${f.coverage}`);
      }
    }
    if (v.mustFind) {
      const all = [...result.findings.map((f) => f.detail), ...result.notes].join(" | ");
      if (!all.includes(v.mustFind)) {
        throw new Error(`[${SET_ID}] "${v.name}": missing "${v.mustFind}". Got: ${all}`);
      }
    }
  }
  return { ok: true, count: VECTORS.length };
}
