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
//
// CURRENCY CHECKS OF 3 AND 5 NOVEMBER 2026 (PRIME, 05/11/2026 19:39 and 19:40:
// the two reports, sent to be processed). ANVIL re-read every source added
// here on 5 November (curl with cache-busting; GitHub pages through
// raw.githubusercontent.com, the HTML refusing this sandbox). What changed:
//   - a new family, laravel (Livewire's update endpoint, CVE-2025-54068 in
//     CISA's catalogue since 20 March 2026; the Telescope, Horizon, Pulse and
//     Nova dashboards; the Fortify and laravel/ui sign-in routes);
//   - wp-batch: both CVEs of the chain in the catalogue, and WordPress's own
//     note on the batch framework; wp-core: CVE-2026-119977, the upgrade-window
//     flaw fixed in 7.1.4 and in the catalogue since 3 November;
//   - secrets: the Antigravity CLI named by its folder only, as Google's page
//     does, so the ComputingForGeeks guide (the only document that named the
//     token file) is dropped; kubeconfig, the Azure CLI's folder and
//     /proc/self/environ explained; Vite's /@fs/ prefix (CVE-2025-30208 and
//     CVE-2025-31125, the second in the catalogue since 22 January 2026); Apple
//     beside Juniper for .DS_Store (Juniper's host now shows "This site is
//     deprecated");
//   - frameworks: the Actuator's discovery page and Symfony's profiler phpinfo;
//   - platforms: Drupal's file cited at its raw address (the blob page now
//     answers with a bot challenge), OpenCart's admin folder, Next.js's
//     _next/static under a guessed folder.
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
  "wp-batch", "wp-plugin", "wp-rest", "wp-core", "secrets", "frameworks", "laravel", "platforms",
  "backdoors", "logins", "exposure", "ipfs", "ai", "crawlers", "misses",
];

/** The sources of each family's explanation; an empty list where the text is a reading of names. */
export const PROBE_SOURCES: Readonly<Record<ProbeFamily, readonly ProbeSource[]>> = {
  // The wp2shell chain: the CVE as NVD analysed it, WordPress's own security release (fixed versions, the 6.9 backport),
  // CISA's catalogue (both CVEs exploited, added 21 July 2026), the finders' announcement, which gave the chain its
  // name, and WordPress's own note on what the batch endpoint does (several API calls in one request).
  "wp-batch": [
    { label: "NVD, CVE-2026-63030", url: "https://nvd.nist.gov/vuln/detail/CVE-2026-63030", read: "2026-11-02" },
    { label: "WordPress.org, WordPress 7.0.2 Release (17 July 2026)", url: "https://wordpress.org/news/2026/07/wordpress-7-0-2-release/", read: "2026-11-02" },
    { label: "CISA, Known Exploited Vulnerabilities Catalog, CVE-2026-63030 (added 21 July 2026)", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog?field_cve=CVE-2026-63030", read: "2026-11-02" },
    { label: "Searchlight Cyber, wp2shell: Pre Authentication RCE in WordPress Core (17 July 2026)", url: "https://slcyber.io/research/wp2shell-pre-authentication-rce-in-wordpress-core", read: "2026-11-02" },
    { label: "CISA, Known Exploited Vulnerabilities Catalog, CVE-2026-60137 (added 21 July 2026)", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog?field_cve=CVE-2026-60137", read: "2026-11-05" },
    { label: "WordPress.org, REST API Batch Framework in WordPress 5.6 (20 November 2020)", url: "https://make.wordpress.org/core/2020/11/20/rest-api-batch-framework-in-wordpress-5-6/", read: "2026-11-05" },
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
  // WordPress's own folders: the site's own reading of the names; the sources are for the upgrade-window flaw the
  // text names (CVE record, WordPress's release, CISA's catalogue).
  "wp-core": [
    { label: "CVE-2026-119977, WordPress Core 4.7.0 - 7.1.3: upgrade-window remote code execution", url: "https://www.cve.org/CVERecord?id=CVE-2026-119977", read: "2026-11-05" },
    { label: "WordPress.org, WordPress 7.1.4 (28 October 2026)", url: "https://wordpress.org/news/2026/10/wordpress-7-1-4/", read: "2026-11-05" },
    { label: "CISA, Known Exploited Vulnerabilities Catalog, CVE-2026-119977 (added 3 November 2026)", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog?field_cve=CVE-2026-119977", read: "2026-11-05" },
  ],
  // Each file the explanation names, in its order, from the project that defines it (the Antigravity CLI by its folder,
  // which is all Google's page names), then Vite's /@fs/ prefix: the CVE records and CISA's catalogue.
  secrets: [
    { label: "Git, gitrepository-layout", url: "https://git-scm.com/docs/gitrepository-layout", read: "2026-11-02" },
    { label: "Apache Subversion, Version Control the Subversion Way (svnbook 1.7)", url: "https://svnbook.red-bean.com/en/1.7/svn.basic.in-action.html", read: "2026-11-02" },
    { label: "Git, git-credential-store", url: "https://git-scm.com/docs/git-credential-store", read: "2026-11-02" },
    { label: "Dotenv, Security: .env", url: "https://www.dotenv.org/docs/security/env", read: "2026-11-02" },
    { label: "GNU Emacs manual, Single or Numbered Backups", url: "https://www.gnu.org/software/emacs/manual/html_node/emacs/Backup-Names.html", read: "2026-11-02" },
    { label: "AWS CLI, configuration and credential files", url: "https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html", read: "2026-11-02" },
    { label: "OpenBSD manual, ssh-keygen(1), FILES", url: "https://man.openbsd.org/ssh-keygen", read: "2026-11-02" },
    { label: "Google Antigravity docs, Authenticate (CLI): the ~/.gemini/antigravity-cli folder", url: "https://antigravity.google/docs/install?tab=cli", read: "2026-11-05" },
    { label: "Kubernetes, Organizing Cluster Access Using kubeconfig Files ($HOME/.kube/config)", url: "https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/", read: "2026-11-05" },
    { label: "Microsoft Learn, Azure CLI configuration ($HOME/.azure, its config file)", url: "https://learn.microsoft.com/en-us/cli/azure/azure-cli-configuration", read: "2026-11-05" },
    { label: "Linux man-pages, proc_pid_environ(5)", url: "https://man7.org/linux/man-pages/man5/proc_pid_environ.5.html", read: "2026-11-05" },
    { label: "GNU Bash manual, HISTFILE", url: "https://www.gnu.org/software/bash/manual/html_node/Bash-Variables.html", read: "2026-11-02" },
    { label: "Python, the site module (~/.python_history)", url: "https://docs.python.org/3/library/site.html", read: "2026-11-02" },
    { label: "Node.js, REPL persistent history", url: "https://nodejs.org/api/repl.html", read: "2026-11-02" },
    { label: "Juniper Networks, signature HTTP:INFO-LEAK:DS-STORE", url: "https://signatures.juniper.net/documentation/signatures/HTTP:INFO-LEAK:DS-STORE.html", read: "2026-11-02" },
    { label: "Apple Support, Adjust SMB browsing behavior in macOS (.DS_Store, a folder's metadata)", url: "https://support.apple.com/en-us/102064", read: "2026-11-05" },
    { label: "CVE-2025-30208, Vite bypasses server.fs.deny when using ?raw??", url: "https://www.cve.org/CVERecord?id=CVE-2025-30208", read: "2026-11-05" },
    { label: "CVE-2025-31125, Vite server.fs.deny bypassed for inline and raw with ?import", url: "https://www.cve.org/CVERecord?id=CVE-2025-31125", read: "2026-11-05" },
    { label: "CISA, Known Exploited Vulnerabilities Catalog, CVE-2025-31125 (added 22 January 2026)", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog?field_cve=CVE-2025-31125", read: "2026-11-05" },
  ],
  // Spring Boot's endpoints now and in version 1 (root paths, the /manage prefix), the Yii 2 debugger (localhost only,
  // what it shows), Magento's version module, the Kubernetes health endpoints (healthz deprecated), and Symfony's
  // profiler phpinfo route, mounted under /_profiler in the dev environment by its recipe.
  frameworks: [
    { label: "Spring Boot, Actuator endpoints", url: "https://docs.spring.io/spring-boot/reference/actuator/endpoints.html", read: "2026-11-02" },
    { label: "Spring Boot 1.5, Monitoring and management over HTTP", url: "https://docs.spring.io/spring-boot/docs/1.5.22.RELEASE/reference/html/production-ready-monitoring.html", read: "2026-11-02" },
    { label: "Yii, Debug Extension for Yii 2: Installation", url: "https://www.yiiframework.com/extension/yiisoft/yii2-debug/doc/guide/2.0/en/installation", read: "2026-11-02" },
    { label: "Yii 2.0 guide, Debug toolbar and debugger (2.0.0)", url: "https://github.com/yiisoft/yii2/blob/2.0.0/docs/guide/tool-debugger.md", read: "2026-11-02" },
    { label: "Magento Open Source, Magento_Version module", url: "https://github.com/magento/magento2/blob/2.4-develop/app/code/Magento/Version/README.md", read: "2026-11-02" },
    { label: "Kubernetes, API health endpoints", url: "https://kubernetes.io/docs/reference/using-api/health-checks/", read: "2026-11-02" },
    { label: "PHP manual, phpinfo(): configuration options, environment, paths and HTTP headers", url: "https://www.php.net/manual/en/function.phpinfo.php", read: "2026-11-05" },
    { label: "Symfony, WebProfilerBundle profiler routes (/phpinfo)", url: "https://github.com/symfony/symfony/blob/7.3/src/Symfony/Bundle/WebProfilerBundle/Resources/config/routing/profiler.php", read: "2026-11-05" },
    { label: "Symfony recipes, web-profiler-bundle routes (when@dev, prefix /_profiler)", url: "https://github.com/symfony/recipes/blob/main/symfony/web-profiler-bundle/6.1/config/routes/web_profiler.yaml", read: "2026-11-05" },
  ],
  // Livewire's update endpoint and its flaw (CVE record, CISA's catalogue, the route in 3.6.4 and the docs), the
  // dashboards' default addresses (Telescope, Horizon and Pulse local-only by default), Nova's path, and the routes
  // Fortify and laravel/ui define.
  laravel: [
    { label: "CVE-2025-54068, Livewire vulnerable to remote command execution during property update hydration", url: "https://www.cve.org/CVERecord?id=CVE-2025-54068", read: "2026-11-05" },
    { label: "CISA, Known Exploited Vulnerabilities Catalog, CVE-2025-54068 (added 20 March 2026)", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog?field_cve=CVE-2025-54068", read: "2026-11-05" },
    { label: "Livewire docs, Installation: Configuring Livewire's update endpoint", url: "https://livewire.laravel.com/docs/3.x/installation", read: "2026-11-05" },
    { label: "Livewire v3.6.4, HandleRequests.php (the /livewire/update route)", url: "https://github.com/livewire/livewire/blob/v3.6.4/src/Mechanisms/HandleRequests/HandleRequests.php", read: "2026-11-05" },
    { label: "Livewire, Upgrading to v4: URLs now carry a hash derived from APP_KEY", url: "https://github.com/livewire/livewire/blob/main/docs/upgrading.md", read: "2026-11-05" },
    { label: "Laravel docs 12.x, Telescope", url: "https://laravel.com/docs/12.x/telescope", read: "2026-11-05" },
    { label: "Laravel docs 12.x, Horizon", url: "https://laravel.com/docs/12.x/horizon", read: "2026-11-05" },
    { label: "Laravel docs 12.x, Pulse", url: "https://laravel.com/docs/12.x/pulse", read: "2026-11-05" },
    { label: "Laravel Nova docs, Installation (the /nova path)", url: "https://nova.laravel.com/docs/v5/installation", read: "2026-11-05" },
    { label: "Laravel docs 12.x, Fortify (/two-factor-challenge, /email/verify)", url: "https://laravel.com/docs/12.x/fortify", read: "2026-11-05" },
    { label: "laravel/ui, AuthRouteMethods.php (password/reset, email/verify)", url: "https://github.com/laravel/ui/blob/4.x/src/AuthRouteMethods.php", read: "2026-11-05" },
  ],
  // Drupal's public files folder, Joomla's administrator address, OpenCart's admin code folder, cPanel's sign-in and
  // Next.js's build folder.
  platforms: [
    { label: "Drupal core, default.settings.php (public file path)", url: "https://git.drupalcode.org/project/drupal/-/raw/11.x/sites/default/default.settings.php", read: "2026-11-05" },
    { label: "Joomla Documentation, Administrator (Application)", url: "https://docs.joomla.org/Administrator_(Application)", read: "2026-11-02" },
    { label: "cPanel, cPanelID", url: "https://docs.cpanel.net/knowledge-base/accounts/cpanelid/", read: "2026-11-02" },
    { label: "OpenCart 3.0.x.x, upload/admin/controller/extension/extension", url: "https://github.com/opencart/opencart/tree/3.0.x.x/upload/admin/controller/extension/extension", read: "2026-11-05" },
    { label: "Next.js docs, assetPrefix (the /_next/ path, .next/static)", url: "https://nextjs.org/docs/app/api-reference/config/next-config-js/assetPrefix", read: "2026-11-05" },
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
