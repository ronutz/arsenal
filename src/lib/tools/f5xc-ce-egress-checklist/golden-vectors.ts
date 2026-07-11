// ============================================================================
// src/lib/tools/f5xc-ce-egress-checklist/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors: a fixed sample of F5's ips-domains.txt (structurally faithful,
// trimmed) parsed into asserted counts, scope/purpose assignments, and
// site-type-filtered allowlists.
// ============================================================================

import { parseCeFile, buildAllowlist, verifierScript } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5xc-ce-egress-checklist/2026-07-11";

const SAMPLE = `## F5 Distributed Cloud SaaS Services
### Public IPv4 subnet ranges for F5 regional edges
#### REs in the Americas
5.182.215.0/25
159.60.190.0/24
### Public IPv4 addresses for F5 DNSLB health checks
18.142.173.13
## Firewall requirements for Secure Mesh v2 CE sites
### Egress IP-Address Rules
#### Public IPv4 Addresses for Site Registration and Updates
159.60.141.140
### Egress Domain Rules
## F5 Domains: Single wildcard domain
*.volterra.io
## Domains for Connecting to F5 Distributed Cloud Regional Edges
tr2-tor-nodes.re.ves.volterra.io
## Domains required for registration with F5 Distributed Cloud SaaS services
register.ves.volterra.io
downloads.volterra.io
## Domains required to support IP address reputation feed
waferdatasetsprod.download.volterra.io
## Webroot URL Classification Database Domains
localdb-url-daily.brightcloud.com
### Firewall requirements for Legacy CE sites
#### Public IPv4 Addresses for Site Registration and Updates (Legacy)
20.33.0.0/16
### Egress Domain Rules (Legacy)
docker.io
*.gcr.io gcr.io storage.googleapis.com
## Additional firewall requirements for Customer Edge sites
### Default DNS for Site Registration and Updates
8.8.8.8
### Default NTP for Site Registration and Updates
216.239.35.4`;

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  const check = (name: string, cond: boolean, detail = "") => {
    if (cond) passed++;
    else failures.push(`[${name}] ${detail}`);
  };

  const parse = parseCeFile(SAMPLE);
  check("parse-ok", parse.ok);
  check("count-ip", parse.counts.ip === 4, `ip=${parse.counts.ip} want 4`);
  check("count-cidr", parse.counts.cidr === 3, `cidr=${parse.counts.cidr} want 3`);
  check("count-domain", parse.counts.domain === 8, `domain=${parse.counts.domain} want 8`);
  check("count-wildcard", parse.counts.wildcard === 2, `wildcard=${parse.counts.wildcard} want 2`);
  check("count-total", parse.counts.total === 17, `total=${parse.counts.total} want 17`);

  const find = (v: string) => parse.entries.find((e) => e.value === v);
  check("reg-ip-smsv2", find("159.60.141.140")?.scope === "smsv2" && find("159.60.141.140")?.purpose === "registration", JSON.stringify(find("159.60.141.140")));
  check("wildcard-f5domains", find("*.volterra.io")?.kind === "wildcard" && find("*.volterra.io")?.purpose === "f5-domains" && find("*.volterra.io")?.scope === "smsv2", JSON.stringify(find("*.volterra.io")));
  check("re-fqdn", find("tr2-tor-nodes.re.ves.volterra.io")?.purpose === "re-connectivity", JSON.stringify(find("tr2-tor-nodes.re.ves.volterra.io")));
  check("reputation-feed", find("waferdatasetsprod.download.volterra.io")?.purpose === "feeds", JSON.stringify(find("waferdatasetsprod.download.volterra.io")));
  check("legacy-domain", find("docker.io")?.scope === "legacy" && find("docker.io")?.purpose === "domains", JSON.stringify(find("docker.io")));
  check("re-cidr-common", find("5.182.215.0/25")?.scope === "common" && find("5.182.215.0/25")?.purpose === "re-connectivity", JSON.stringify(find("5.182.215.0/25")));
  check("dns-common", find("8.8.8.8")?.purpose === "dns" && find("8.8.8.8")?.scope === "common", JSON.stringify(find("8.8.8.8")));
  check("ntp-common", find("216.239.35.4")?.purpose === "ntp", JSON.stringify(find("216.239.35.4")));

  // multi-token line split
  check("multi-token", find("gcr.io")?.value === "gcr.io" && find("storage.googleapis.com")?.value === "storage.googleapis.com" && find("*.gcr.io")?.kind === "wildcard", "multi-token line not split");

  // site-type filtering
  const smsv2 = buildAllowlist(parse, "smsv2");
  check("smsv2-excludes-legacy", !smsv2.flatDomains.includes("docker.io") && !smsv2.flatIps.includes("20.33.0.0/16"), "smsv2 leaked legacy entries");
  check("smsv2-includes-wildcard", smsv2.flatDomains.includes("*.volterra.io"), "smsv2 missing *.volterra.io");
  check("smsv2-includes-common-dns", smsv2.flatIps.includes("8.8.8.8"), "smsv2 missing common DNS");

  const legacy = buildAllowlist(parse, "legacy");
  check("legacy-includes-docker", legacy.flatDomains.includes("docker.io"), "legacy missing docker.io");
  check("legacy-excludes-smsv2-reg-ip", !legacy.flatIps.includes("159.60.141.140"), "legacy leaked smsv2 reg IP");

  const both = buildAllowlist(parse, "both");
  check("both-has-all-domains", both.flatDomains.includes("docker.io") && both.flatDomains.includes("*.volterra.io"), "both missing entries");

  // verifier script: one line per domain + header
  const script = verifierScript(both.flatDomains);
  check("verifier-lines", script.split("\n").length === both.flatDomains.length + 1, `script lines mismatch`);
  check("verifier-cmd", script.includes("curl-host -kL --connect-timeout 10 https://docker.io"), "verifier command wrong");

  // reject empty
  check("reject-empty", parseCeFile("").ok === false, "empty not rejected");

  return { passed, failed: failures.length, failures };
}

export const goldenVectors = [
  "parse-ok", "count-ip", "count-cidr", "count-domain", "count-wildcard", "count-total",
  "reg-ip-smsv2", "wildcard-f5domains", "re-fqdn", "reputation-feed", "legacy-domain", "re-cidr-common",
  "dns-common", "ntp-common", "multi-token", "smsv2-excludes-legacy", "smsv2-includes-wildcard",
  "smsv2-includes-common-dns", "legacy-includes-docker", "legacy-excludes-smsv2-reg-ip", "both-has-all-domains",
  "verifier-lines", "verifier-cmd", "reject-empty",
];
