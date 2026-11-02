// ============================================================================
// src/content/stats/probe-sources.ts
// ----------------------------------------------------------------------------
// THE SOURCES BEHIND THE "REQUESTS FOR PAGES THAT DO NOT EXIST" PANEL (/stats,
// 2026-10-07; PRIME: "Can you categorize them, show the url and besides or
// below explain what attack that is a scan for?"). Each family the Worker sorts
// a not-found request into (worker/probes.ts) is explained on the page in the
// two authored languages (stats_page.missing.families.<id>); this file holds what those
// explanations rest on: the advisory, the CVE record or the vendor's own
// documentation, each read on the day the panel was written. A family whose
// explanation is ANVIL's reading of a name (the backdoor names, the crawlers,
// the honest misses) has no entry, and its text says so.
//
// RE-READ ON 2026-11-02 (PRIME, 12:54: "update what the stats page shows,
// especially in regards to attack-related scans"). Every source was fetched
// again that day and each claim of the explanations checked against it and
// against the CVE records, NVD and CISA's catalogue of exploited
// vulnerabilities. What changed:
//   - secondary sources replaced by first-party ones where one exists: the
//     WordPress.org security release, CISA's catalogue and the finders' own
//     announcement for Bitdefender's advisory; the Gravity SMTP changelog for
//     the Freshy Sites bulletin; the Magento repository for Atwix; the Yii
//     project's own guides for a Read the Docs copy of an old one;
//   - the Juniper signature page moved (its old address answers 404 on HPE's
//     site) and is cited at Juniper's signature documentation host;
//   - the MCP specification cited at its current revision (2026-07-28), and
//     its Server Cards discovery extension (SEP-2127, status Final) in place
//     of the expired IETF draft, which proposed a different address;
//   - first-party sources added for the addresses the explanations now name:
//     .git-credentials, .svn, .env and .env~, .ssh/id_rsa (secrets); Spring
//     Boot 1's endpoint paths (frameworks); Drupal's and Joomla's folders
//     (platforms); the WordPress REST API's index (wp-rest).
// One secondary source stays because nothing first-party says the same: the
// ComputingForGeeks guide is the only document found that names the
// Antigravity CLI's token file; Google's own page confirms the folder only.
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
  // The wp2shell chain: the CVE as NVD analysed it, WordPress's own security release (fixed versions, the 6.9 backport),
  // CISA's catalogue (exploited, added 21 July 2026) and the finders' announcement, which gave the chain its name.
  "wp-batch": [
    { label: "NVD, CVE-2026-63030", url: "https://nvd.nist.gov/vuln/detail/CVE-2026-63030", read: "2026-11-02" },
    { label: "WordPress.org, WordPress 7.0.2 Release (17 July 2026)", url: "https://wordpress.org/news/2026/07/wordpress-7-0-2-release/", read: "2026-11-02" },
    { label: "CISA, Known Exploited Vulnerabilities Catalog, CVE-2026-63030 (added 21 July 2026)", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog?field_cve=CVE-2026-63030", read: "2026-11-02" },
    { label: "Searchlight Cyber, wp2shell: Pre Authentication RCE in WordPress Core (17 July 2026)", url: "https://slcyber.io/research/wp2shell-pre-authentication-rce-in-wordpress-core", read: "2026-11-02" },
  ],
  // Gravity SMTP: the CVE (affected up to 2.1.4, what the answer holds) and the vendor's changelog (2.1.5, 25 March 2026).
  "wp-plugin": [
    { label: "NVD, CVE-2026-4020", url: "https://nvd.nist.gov/vuln/detail/CVE-2026-4020", read: "2026-11-02" },
    { label: "Gravity SMTP, changelog (2.1.5, 25 March 2026)", url: "https://docs.gravitysmtp.com/gravity-smtp-changelog/", read: "2026-11-02" },
  ],
  // The REST API's index (its routes, the root of discovery) and the pages it lists.
  "wp-rest": [
    { label: "WordPress REST API Handbook, Discovery", url: "https://developer.wordpress.org/rest-api/using-the-rest-api/discovery/", read: "2026-11-02" },
    { label: "WordPress REST API Handbook, Pages", url: "https://developer.wordpress.org/rest-api/reference/pages/", read: "2026-11-02" },
  ],
  // WordPress's own folders: the site's own reading of the names (no entry yet).
  "wp-core": [],
  // Each file the explanation names, in its order, from the project that defines it; the Antigravity token file has
  // only the hands-on guide (see the header).
  secrets: [
    { label: "Git, gitrepository-layout", url: "https://git-scm.com/docs/gitrepository-layout", read: "2026-11-02" },
    { label: "Apache Subversion, Version Control the Subversion Way (svnbook 1.7)", url: "https://svnbook.red-bean.com/en/1.7/svn.basic.in-action.html", read: "2026-11-02" },
    { label: "Git, git-credential-store", url: "https://git-scm.com/docs/git-credential-store", read: "2026-11-02" },
    { label: "Dotenv, Security: .env", url: "https://www.dotenv.org/docs/security/env", read: "2026-11-02" },
    { label: "GNU Emacs manual, Single or Numbered Backups", url: "https://www.gnu.org/software/emacs/manual/html_node/emacs/Backup-Names.html", read: "2026-11-02" },
    { label: "AWS CLI, configuration and credential files", url: "https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html", read: "2026-11-02" },
    { label: "OpenBSD manual, ssh-keygen(1), FILES", url: "https://man.openbsd.org/ssh-keygen", read: "2026-11-02" },
    { label: "Google Antigravity docs, Authenticate (CLI)", url: "https://antigravity.google/docs/install?tab=cli", read: "2026-11-02" },
    { label: "ComputingForGeeks, Install Antigravity CLI (June 2026)", url: "https://computingforgeeks.com/install-antigravity-cli-linux-macos-windows/", read: "2026-11-02" },
    { label: "GNU Bash manual, HISTFILE", url: "https://www.gnu.org/software/bash/manual/html_node/Bash-Variables.html", read: "2026-11-02" },
    { label: "Python, the site module (~/.python_history)", url: "https://docs.python.org/3/library/site.html", read: "2026-11-02" },
    { label: "Node.js, REPL persistent history", url: "https://nodejs.org/api/repl.html", read: "2026-11-02" },
    { label: "Juniper Networks, signature HTTP:INFO-LEAK:DS-STORE", url: "https://signatures.juniper.net/documentation/signatures/HTTP:INFO-LEAK:DS-STORE.html", read: "2026-11-02" },
  ],
  // Spring Boot's endpoints now and in version 1 (root paths, the /manage prefix), the Yii 2 debugger (localhost only,
  // what it shows), Magento's version module, and the Kubernetes health endpoints (healthz deprecated).
  frameworks: [
    { label: "Spring Boot, Actuator endpoints", url: "https://docs.spring.io/spring-boot/reference/actuator/endpoints.html", read: "2026-11-02" },
    { label: "Spring Boot 1.5, Monitoring and management over HTTP", url: "https://docs.spring.io/spring-boot/docs/1.5.22.RELEASE/reference/html/production-ready-monitoring.html", read: "2026-11-02" },
    { label: "Yii, Debug Extension for Yii 2: Installation", url: "https://www.yiiframework.com/extension/yiisoft/yii2-debug/doc/guide/2.0/en/installation", read: "2026-11-02" },
    { label: "Yii 2.0 guide, Debug toolbar and debugger (2.0.0)", url: "https://github.com/yiisoft/yii2/blob/2.0.0/docs/guide/tool-debugger.md", read: "2026-11-02" },
    { label: "Magento Open Source, Magento_Version module", url: "https://github.com/magento/magento2/blob/2.4-develop/app/code/Magento/Version/README.md", read: "2026-11-02" },
    { label: "Kubernetes, API health endpoints", url: "https://kubernetes.io/docs/reference/using-api/health-checks/", read: "2026-11-02" },
  ],
  // Drupal's public files folder, Joomla's administrator address and cPanel's sign-in.
  platforms: [
    { label: "Drupal core, default.settings.php (public file path)", url: "https://git.drupalcode.org/project/drupal/-/blob/11.x/sites/default/default.settings.php", read: "2026-11-02" },
    { label: "Joomla Documentation, Administrator (Application)", url: "https://docs.joomla.org/Administrator_(Application)", read: "2026-11-02" },
    { label: "cPanel, cPanelID", url: "https://docs.cpanel.net/knowledge-base/accounts/cpanelid/", read: "2026-11-02" },
  ],
  // Backdoor names: the site's own reading (its text says so).
  backdoors: [],
  // Sign-in and account pages: the site's own reading of the names.
  logins: [],
  // The well-known folder's standard.
  exposure: [
    { label: "RFC 8615, Well-Known Uniform Resource Identifiers (May 2019)", url: "https://www.rfc-editor.org/rfc/rfc8615.html", read: "2026-11-02" },
  ],
  // IPFS's own description of gateways (path form, recursive gateways prone to abuse).
  ipfs: [
    { label: "IPFS, gateways", url: "https://docs.ipfs.tech/concepts/ipfs-gateway/", read: "2026-11-02" },
  ],
  // MCP's current transport (the /mcp example), its Server Cards discovery extension and that extension's discovery
  // rules, the WebMCP draft (a JavaScript interface, no address), and OpenAI's model list call.
  ai: [
    { label: "Model Context Protocol specification, Streamable HTTP (2026-07-28)", url: "https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http", read: "2026-11-02" },
    { label: "Model Context Protocol, SEP-2127: MCP Server Cards (Final)", url: "https://modelcontextprotocol.io/seps/2127-mcp-server-cards", read: "2026-11-02" },
    { label: "MCP Server Card extension, Discovery", url: "https://github.com/modelcontextprotocol/experimental-ext-server-card/blob/main/docs/discovery.md", read: "2026-11-02" },
    { label: "W3C Web Machine Learning Community Group, WebMCP (Draft Community Group Report)", url: "https://webmachinelearning.github.io/webmcp/", read: "2026-11-02" },
    { label: "OpenAI API reference, List models", url: "https://developers.openai.com/api/reference/resources/models/methods/list", read: "2026-11-02" },
  ],
  // Careers, jobs and shop pages: the site's own reading of the names.
  crawlers: [],
  // Honest misses: nothing to cite.
  misses: [],
};
