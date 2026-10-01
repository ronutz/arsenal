#!/usr/bin/env node
// ============================================================================
// audit-source-liveness — DOES EVERY CITED URL STILL ANSWER?
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. On 2026-09-27 twenty-two vendor entries were found citing a
// ChatGPT share link that had ALREADY returned 404 for some unknown length of
// time. Nobody noticed, and nothing could have:
//
//     `check-sources` counts sources. It has never fetched one.
//
// A citation pointing at nothing counted exactly the same as a citation
// pointing at an RFC. `check-source-hosts` now stops a chat transcript being
// cited at all, but it says nothing about rot, and rot is the general case.
//
// *** WHY THIS IS AN AUDIT AND NOT A GUARD, AND WHY THAT IS NOT TIMIDITY. ***
// It is NOT wired into prebuild and must not be. A build step that reaches the
// network fails when somebody else's server has a bad afternoon, and prebuild
// is a hard stop that also runs in GitHub Actions on every push to main. Making
// a deploy depend on 2,300 third-party hosts staying up trades a rare,
// detectable fault for a frequent, undiagnosable one. Run this on demand, or on
// a schedule, and READ IT.
//
// *** THE DISTINCTION THIS SCRIPT EXISTS TO PROTECT: DEAD IS NOT BLOCKED. ***
// Three separate times on 2026-09-27 a plausible signal turned out to mean
// nothing - an HTTP 200 that a fabricated id also returned, a tab title that a
// fabricated id also produced, and a partner list whose zero hits were because
// the list was Japan-only. A sweep that files 403 under "dead" would
// manufacture that same error 2,300 times. So:
//
//     SUSPECT    404, 410              CANDIDATE ONLY. See the warning below.
//     BLOCKED    401 403 405 429       we were refused. Says NOTHING about the
//                                      document. my.f5.com and media.defense.gov
//                                      both do this to non-browser clients.
//     SERVER     5xx                   their end, probably transient. Re-run.
//     REDIRECT   3xx -> 2xx           follows to a live page. Fine.
//     SUSPECT-MOVED  3xx -> 404/410      *** THE BUCKET THAT WAS MISSED. *** The
//                                      redirect answers and the document does
//                                      not. On the first run of this script all
//                                      306 redirects were filed as benign and
//                                      never followed; seven matrixbcg.com and
//                                      one dcfmodeling.com citation land on 404
//                                      because both hosts rebranded
//                                      (growthsharematrix.com, dcfanalyst.com)
//                                      without carrying their paths across.
//     REDIRECT-UNRESOLVED  3xx after -L  a loop, or too many hops. Unresolved.
//     UNREACHABLE  timeout, DNS, TLS   OUR end may be at fault. Never "dead".
//
// *** AND EVEN SUSPECT IS NOT A VERDICT. *** The first full run of this script
// reported 40 dead links. Twelve were a truncating regex in this very file. Four
// more were live Wikipedia articles that this container's egress answers 404
// while serving /wiki/Cisco perfectly and blocking /w/api.php outright - so a
// per-host root control, which this script now does, is necessary and still not
// sufficient. A citation is only dead once a SECOND, DIFFERENT client agrees.
// This script narrows 2,363 URLs to a short list worth asking about. It does not
// answer the question.
//
// HOW IT FETCHES. It shells out to curl rather than using fetch(), because this
// repo is worked on from sandboxes whose outbound traffic goes through a proxy
// that curl honours from the environment and Node's fetch does not.
// HEAD first, then GET on 403/405, because plenty of servers refuse HEAD.
//
// USAGE
//   node scripts/audit-source-liveness.mjs [--limit N] [--concurrency N]
//   Writes a report to .source-liveness.json (gitignored) and prints a summary.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";

const args = process.argv.slice(2);
const argOf = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : dflt;
};
const LIMIT = argOf("--limit", Infinity);
const CONCURRENCY = argOf("--concurrency", 12);
const TIMEOUT = argOf("--timeout", 20);

// Directories AND individual files, because scope here has to be exact: see the
// note at the top of this file on why src/lib is not swept wholesale.
const ROOTS = [
  "src/content",
  "src/lib/tools",
  "src/lib/roles.ts",          // sources shown on each role page
  "src/config/toolProvenance.ts", // the per-tool Credits & Sources panel
];
const EXTS = new Set([".ts", ".tsx", ".mdx", ".md", ".json"]);

// A root may be a directory to walk or a single file to take as-is, so that a
// citation-bearing file can be included without dragging its siblings in.
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  if (fs.statSync(dir).isFile()) {
    if (EXTS.has(path.extname(dir))) out.push(dir);
    return out;
  }
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (EXTS.has(path.extname(e.name))) out.push(full);
  }
  return out;
}

// --- markdown link targets, with BALANCED parentheses ----------------------
//
// *** THIS FUNCTION EXISTS BECAUSE THE OBVIOUS REGEX MANUFACTURED TWELVE DEAD
// LINKS THAT WERE NEVER DEAD. *** The first version of this audit scanned
// markdown targets with /\]\((https?:\/\/[^)\s]+)\)/, which stops at the FIRST
// closing parenthesis. Wikipedia writes its disambiguators exactly there:
//
//     [text](https://en.wikipedia.org/wiki/Mirai_(malware))
//
// The naive pattern yields ".../Mirai_(malware" - a URL that has never existed
// and duly returns 404. The first run reported 40 dead citations, of which
// twelve were this bug: Mirai, Melissa, Code Red, Shellshock, Lint, Lucifer,
// Cain and Abel, VM, Eric Hughes, Blaster, ALOHANET and two
// historyofcomputercommunications.info sections.
//
// The lesson is the one this whole audit is built around and it applies to the
// auditor too: a 404 means the document is gone ONLY IF you asked for the right
// document. Depth-count the parentheses instead.
function markdownTargets(line) {
  const out = [];
  for (const m of line.matchAll(/\]\((https?:\/\/)/g)) {
    const start = m.index + 2;
    let i = m.index + 2 + m[1].length;
    let depth = 0;
    while (i < line.length) {
      const c = line[i];
      if (c === "(") depth += 1;
      else if (c === ")") {
        if (depth === 0) break;
        depth -= 1;
      } else if (/\s/.test(c)) break;
      i += 1;
    }
    out.push(line.slice(start, i));
  }
  return out;
}

// --- collect every cited URL, remembering where each one is cited ----------
const where = new Map(); // url -> Set of "file:line"
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      const found = [
        ...[...line.matchAll(/url:\s*"(https?:\/\/[^"]+)"/g)].map((m) => m[1]),
        // *** AND `href:`, WHICHEVER FIELD THE FILE HAPPENS TO USE. *** Until
        // 2026-09-30 this audit collected `url:` only. partners.ts writes
        // `url:` and was covered; glossary.ts writes `href:` and was NOT - so
        // 906 citations across 1,711 glossary entries, including every source
        // behind the /people timeline, had never once been checked for liveness.
        // 689 distinct URLs, invisible to an audit whose whole purpose is to
        // find dead ones.
        //
        // The failure is the same shape as three others logged this session: the
        // instrument was narrower than the content, and its OWN output looked
        // healthy because it only ever reported on what it could see. Nothing
        // was wrong with the numbers it printed; the numbers were about a
        // smaller corpus than the one they appeared to describe.
        ...[...line.matchAll(/href:\s*"(https?:\/\/[^"]+)"/g)].map((m) => m[1]),
        // Three more citation-bearing keys, found by the same sweep that found
        // `href`: externalUrl is the further-reading link rendered on a page,
        // sourceUrl and blueprintSourceUrl are the certification-blueprint
        // citations. 391 URLs between them, none previously collected.
        ...[...line.matchAll(/externalUrl:\s*"(https?:\/\/[^"]+)"/g)].map((m) => m[1]),
        ...[...line.matchAll(/sourceUrl:\s*"(https?:\/\/[^"]+)"/g)].map((m) => m[1]),
        ...[...line.matchAll(/blueprintSourceUrl:\s*"(https?:\/\/[^"]+)"/g)].map((m) => m[1]),
        ...markdownTargets(line),
      ];
      // *** AND DELIBERATELY NOT THESE. *** `input`, `example`, `issuer`,
      // `webhook` and `raw` also carry http URLs in these roots, and they are
      // FIXTURES - example.com, RFC-reserved documentation addresses, and
      // 169.254.169.254, which is the cloud instance-metadata endpoint. Fetching
      // a tool's example input would be wrong on its own terms and, in that last
      // case, would have this audit probing a metadata service. The split between
      // the two lists is enforced by check-citation-fields.mjs, so a NEW
      // URL-bearing key cannot quietly land on the wrong side of it.
      for (const u of found) {
        if (!where.has(u)) where.set(u, new Set());
        where.get(u).add(`${file}:${i + 1}`);
      }
    });
  }
}

const urls = [...where.keys()].slice(0, LIMIT);
console.log(`[audit-source-liveness] ${urls.length} distinct URL(s) from ${where.size} cited; concurrency ${CONCURRENCY}`);

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

function curl(url, method) {
  return new Promise((resolve) => {
    const a = [
      "-s", "-o", "/dev/null",
      // hops and landing place, not just a status. A 301 that lands on a 404 is
      // a dead citation, and reporting only the 301 is how 306 of them went
      // unexamined on the first run of this script.
      "-w", "%{http_code} %{num_redirects} %{url_effective} %{redirect_url}",
      "--max-time", String(TIMEOUT),
      "-A", UA,
      method === "HEAD" ? "-I" : "-L",
      url,
    ];
    execFile("curl", a, { timeout: (TIMEOUT + 5) * 1000 }, (err, stdout) => {
      if (err && !stdout) {
        return resolve({ code: 0, hops: 0, landed: "", redirect: "", err: String(err.message || err).slice(0, 80) });
      }
      const [code, hops = "0", landed = "", redirect = ""] = String(stdout).trim().split(/\s+/);
      resolve({ code: Number(code) || 0, hops: Number(hops) || 0, landed, redirect, err: "" });
    });
  });
}

// `code` is the FINAL status after any redirects were followed, and `hops` says
// whether following happened. The distinction matters: a citation that redirects
// to a live page is fine, and a citation that redirects to a 404 is dead. Both
// begin life as a 301.
function classify(code, hops) {
  if (code >= 200 && code < 300) return hops > 0 ? "REDIRECT" : "OK";
  if (code === 404 || code === 410) return hops > 0 ? "SUSPECT-MOVED" : "SUSPECT";
  // Still a 3xx after -L means curl stopped following: a loop, or more hops than
  // it allows. Unresolved rather than fine.
  if (code >= 300 && code < 400) return "REDIRECT-UNRESOLVED";
  if ([401, 403, 405, 429].includes(code)) return "BLOCKED";
  if (code >= 500) return "SERVER";
  return "UNREACHABLE";
}

// --- suspects already confirmed, with the finding that settled each ----------
//
// A 404 here has been chased down and is NOT a dead citation. Keyed by URL
// exactly as cited. The reason is the point: a bare allowlist would let the next
// real defect in behind a URL nobody remembers checking.
const DECLARED_SUSPECT = new Map([
  [
    "https://en.wikipedia.org/wiki/AlgoSec",
    "ALIVE. This container's egress answers 404 for specific en.wikipedia.org paths while serving others normally; confirmed served to a second client on 2026-09-27. Environment, not rot.",
  ],
  [
    "https://en.wikipedia.org/wiki/Arkadiy_Dobkin",
    "ALIVE. Same egress behaviour as the AlgoSec article; confirmed with a second client on 2026-09-27.",
  ],
  [
    "https://en.wikipedia.org/wiki/EPAM_Systems",
    "ALIVE. Same egress behaviour; confirmed with a second client on 2026-09-27.",
  ],
  [
    "https://en.wikipedia.org/wiki/Recife_Center_for_Advanced_Studies_and_Systems",
    "ALIVE. Same egress behaviour; confirmed with a second client on 2026-09-27.",
  ],
  [
    "https://commons.apache.org/proper/commons-ognl/language-guide.html",
    "ALIVE. Confirmed served to a second client on 2026-09-27; the 404 is this environment's, not the project's.",
  ],
  [
    "http://www.gjerull.net/site_media/static/html/masterthesis/masterthesisse12.html",
    "ALIVE over plain http, which is how it is cited. Confirmed 2026-09-27. Not upgraded to https because the host does not serve it there.",
  ],
  [
    "https://my.f5.com/manage/s/documentation",
    "UNDETERMINABLE, and that is the finding. my.f5.com is a Salesforce-hosted single-page app behind sign-in: a headless render on 2026-09-27 returned the bare app shell (title \"myF5\", 45 characters of text) rather than a 404 page. The portal answers; whether a signed-in reader reaches this route cannot be established from here. Re-check from a browser with an F5 account, not by re-running this script.",
  ],
]);

const results = [];
/** host origin -> status code of its own root, so the control is fetched once. */
const controlCache = new Map();
let done = 0;
async function worker(queue) {
  while (queue.length) {
    const url = queue.pop();
    let r = await curl(url, "HEAD");
    // Many servers refuse HEAD outright, and some answer it 404 while serving
    // the same URL over GET - portswigger.net does exactly that. So a GET is the
    // fair second try for 404 as well, not only for the obvious refusals.
    // A 3xx is in this list for the reason at the top of the file: HEAD does not
    // follow, so a redirect must be re-asked with GET (which does) before it can
    // be classified. Without this line the bucket is never verified at all.
    if ([403, 405, 400, 404, 0].includes(r.code) || (r.code >= 300 && r.code < 400)) {
      r = await curl(url, "GET");
    }
    let status = classify(r.code, r.hops);
    // *** THE CONTROL. *** A 404 means the document is gone ONLY IF the host is
    // answering us at all. On 2026-09-27 this container's egress returned 404
    // for every en.wikipedia.org URL while the same pages served fine to another
    // client, which would have filed live Wikipedia articles as dead. So before
    // calling anything DEAD, ask the same host for its own root. If the root is
    // also unreachable, the host is refusing US and the path tells us nothing.
    if (status === "SUSPECT" || status === "SUSPECT-MOVED") {
      const host = new URL(url).origin;
      if (!controlCache.has(host)) controlCache.set(host, (await curl(host + "/", "GET")).code);
      const cc = controlCache.get(host);
      if (!(cc >= 200 && cc < 400)) status = "HOST-REFUSED";
    }
    results.push({ url, code: r.code, status, hops: r.hops, landed: r.landed, redirect: r.redirect, err: r.err, cited: [...where.get(url)] });
    done += 1;
    if (done % 100 === 0) console.log(`  ... ${done}/${urls.length}`);
  }
}

const queue = [...urls];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

const by = results.reduce((a, r) => ((a[r.status] = (a[r.status] || 0) + 1), a), {});
fs.writeFileSync(".source-liveness.json", JSON.stringify({ at: new Date().toISOString(), by, results }, null, 1));

console.log("\n[audit-source-liveness] summary");
for (const k of ["OK", "REDIRECT", "REDIRECT-UNRESOLVED", "BLOCKED", "SERVER", "UNREACHABLE", "HOST-REFUSED", "SUSPECT", "SUSPECT-MOVED"]) {
  if (by[k]) console.log(`  ${k.padEnd(12)} ${by[k]}`);
}

const suspects = results.filter((r) => r.status === "SUSPECT" || r.status === "SUSPECT-MOVED");
const undeclared = suspects.filter((r) => !DECLARED_SUSPECT.has(r.url));
const declared = suspects.filter((r) => DECLARED_SUSPECT.has(r.url));

// A declared entry that has STOPPED answering 404 is reported too, so the list
// can only shrink: once a citation is repaired or a host stops misbehaving, its
// declaration is stale and has to come off.
// `probed` and not `where`: on a --limit run most cited URLs were never asked,
// and absence from the suspect list would then look like a repair.
const probed = new Set(results.map((r) => r.url));
const staleDeclarations = [...DECLARED_SUSPECT.keys()].filter(
  (u) => probed.has(u) && !suspects.some((r) => r.url === u),
);

if (declared.length) {
  console.log(`\n  ${declared.length} declared suspect(s) - already chased down, reasons on file:\n`);
  for (const d of declared) console.log(`  ${d.code}  ${d.url}\n        ${DECLARED_SUSPECT.get(d.url)}`);
}

if (staleDeclarations.length) {
  console.log(`\n  *** ${staleDeclarations.length} STALE DECLARATION(S) - no longer suspect, remove from DECLARED_SUSPECT: ***\n`);
  for (const u of staleDeclarations) console.log(`  ${u}`);
}

if (undeclared.length) {
  console.log(`\n  *** ${undeclared.length} UNDECLARED SUSPECT citation(s) - CONFIRM EACH WITH A SECOND CLIENT: ***\n`);
  for (const d of undeclared.slice(0, 40)) {
    console.log(`  ${d.code}  ${d.url}`);
    if (d.hops > 0) console.log(`        landed on ${d.landed}  (${d.hops} hop(s) - the host may have rebranded)`);
    for (const c of d.cited.slice(0, 3)) console.log(`        cited at ${c}`);
  }
}
console.log("\n  Full report: .source-liveness.json");

// --strict is for a SCHEDULED run, never for prebuild. A build step that reaches
// 2,400 third-party hosts fails on somebody else's bad afternoon; a weekly job
// that goes red only on an undeclared suspect or a stale declaration is a signal
// worth reading. The distinction is the whole reason this file is an audit.
if (args.includes("--strict")) {
  const problems = undeclared.length + staleDeclarations.length;
  if (problems > 0) {
    console.error(
      `\n[audit-source-liveness] STRICT FAIL: ${undeclared.length} undeclared suspect(s), ` +
        `${staleDeclarations.length} stale declaration(s).\n` +
        `      Confirm each with a SECOND CLIENT before treating it as dead. If it is dead, ` +
        `repair or remove the citation and keep the claim in the copy\n` +
        `      (PRIME 2026-09-27: a fact is not deleted for want of a source). If it is alive, ` +
        `add it to DECLARED_SUSPECT with the finding that settled it.\n`,
    );
    process.exit(1);
  }
  console.log("\n[audit-source-liveness] STRICT OK: no undeclared suspects, no stale declarations.");
}
console.log("  SUSPECT is a CANDIDATE, never a verdict. This environment can 404 a\n  specific path on a host whose root answers fine - four live Wikipedia\n  articles came back 404 here on 2026-09-27 and served content to another\n  client. Confirm every SUSPECT with a different client before acting.");
