// ============================================================================
// src/content/stats/probe-sources.ts
// ----------------------------------------------------------------------------
// THE SOURCES BEHIND THE "REQUESTS FOR PAGES THAT DO NOT EXIST" PANEL (/stats,
// 2026-10-07; PRIME: "Can you categorize them, show the url and besides or
// below explain what attack that is a scan for?"). Each family the Worker sorts
// a not-found request into (worker/probes.ts) is explained on the page in the
// two authored languages (stats_page.probes.<id>); this file holds what those
// explanations rest on: the advisory, the CVE record or the vendor's own
// documentation, each read on the day the panel was written. A family whose
// explanation is ANVIL's reading of a name (the backdoor names, the crawlers,
// the honest misses) has no entry, and its text says so.
// ============================================================================

import type { ProbeFamily } from "../../../worker/probes";

/** One source: what it is, where it lives, the day it was read (ISO date). */
export interface ProbeSource {
  label: string;
  url: string;
  read: string;
}

/** The families in the order the page lists their texts when two have the same count; the Worker sorts by count. */
export const PROBE_FAMILY_IDS: readonly ProbeFamily[] = [
  "wp-batch", "wp-plugin", "wp-rest", "wp-core", "secrets", "frameworks", "platforms",
  "backdoors", "logins", "exposure", "ipfs", "ai", "crawlers", "misses",
];

/** The sources of each family's explanation; an empty list where the text is a reading of names. */
export const PROBE_SOURCES: Readonly<Record<ProbeFamily, readonly ProbeSource[]>> = {
  "wp-batch": [
    { label: "NVD, CVE-2026-63030", url: "https://nvd.nist.gov/vuln/detail/CVE-2026-63030", read: "2026-10-07" },
    { label: "Bitdefender, Technical Advisory: wp2shell (27 July 2026)", url: "https://www.bitdefender.com/en-us/blog/businessinsights/technical-advisory-wp2shell-unauthenticated-remote-code-execution-full-site-takeover-wordpress-core", read: "2026-10-07" },
  ],
  "wp-plugin": [
    { label: "NVD, CVE-2026-4020", url: "https://nvd.nist.gov/vuln/detail/CVE-2026-4020", read: "2026-10-07" },
    { label: "Freshy Sites, Gravity SMTP security bulletin (31 March 2026)", url: "https://freshysites.com/security-bulletins/wordpress-security-bulletin-gravity-smtp-plugin-vulnerability-cve-2026-4020/", read: "2026-10-07" },
  ],
  "wp-rest": [
    { label: "WordPress REST API Handbook, Pages", url: "https://developer.wordpress.org/rest-api/reference/pages/", read: "2026-10-07" },
  ],
  "wp-core": [],
  secrets: [
    { label: "Git, gitrepository-layout", url: "https://git-scm.com/docs/gitrepository-layout", read: "2026-10-07" },
    { label: "AWS CLI, configuration and credential files", url: "https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html", read: "2026-10-07" },
    { label: "ComputingForGeeks, Install Antigravity CLI (June 2026)", url: "https://computingforgeeks.com/install-antigravity-cli-linux-macos-windows/", read: "2026-10-07" },
    { label: "GNU Bash manual, HISTFILE", url: "https://www.gnu.org/software/bash/manual/html_node/Bash-Variables.html", read: "2026-10-07" },
    { label: "Python, the site module (~/.python_history)", url: "https://docs.python.org/3/library/site.html", read: "2026-10-07" },
    { label: "Node.js, REPL persistent history", url: "https://nodejs.org/api/repl.html", read: "2026-10-07" },
    { label: "Juniper Threat Labs, HTTP:INFO-LEAK:DS-STORE", url: "https://www.juniper.net/us/en/threatlabs/ips-signatures/detail.HTTP:INFO-LEAK:DS-STORE.html", read: "2026-10-07" },
  ],
  frameworks: [
    { label: "Spring Boot, Actuator endpoints", url: "https://docs.spring.io/spring-boot/reference/actuator/endpoints.html", read: "2026-10-07" },
    { label: "Yii 2, Debug toolbar and debugger", url: "https://yii2-framework.readthedocs.io/en/stable/guide/tool-debugger/", read: "2026-10-07" },
    { label: "Atwix, How to hide the Magento 2 version", url: "https://www.atwix.com/magento-2/hide-version/", read: "2026-10-07" },
    { label: "Kubernetes, API health endpoints", url: "https://kubernetes.io/docs/reference/using-api/health-checks/", read: "2026-10-07" },
  ],
  platforms: [
    { label: "cPanel, cPanelID", url: "https://docs.cpanel.net/knowledge-base/accounts/cpanelid/", read: "2026-10-07" },
  ],
  backdoors: [],
  logins: [],
  exposure: [
    { label: "RFC 8615, Well-Known Uniform Resource Identifiers (May 2019)", url: "https://www.rfc-editor.org/rfc/rfc8615.html", read: "2026-10-07" },
  ],
  ipfs: [
    { label: "IPFS, gateways", url: "https://docs.ipfs.tech/concepts/ipfs-gateway/", read: "2026-10-07" },
  ],
  ai: [
    { label: "Model Context Protocol specification, transports (2025-06-18)", url: "https://modelcontextprotocol.io/specification/2025-06-18/basic/transports", read: "2026-10-07" },
    { label: "IETF, draft-serra-mcp-discovery-uri-04 (expired)", url: "https://datatracker.ietf.org/doc/draft-serra-mcp-discovery-uri/", read: "2026-10-07" },
    { label: "OpenAI API reference, List models", url: "https://developers.openai.com/api/reference/resources/models/methods/list", read: "2026-10-07" },
  ],
  crawlers: [],
  misses: [],
};
