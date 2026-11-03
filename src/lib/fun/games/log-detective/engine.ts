// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/log-detective/engine.ts
// ----------------------------------------------------------------------------
// LOG DETECTIVE, the rules (PRIME 03/11/2026). Each UTC day the generator
// writes a log excerpt of 40 to 80 lines: ordinary traffic from many clients
// and, hidden in it, one incident. The player names the attacker's address,
// the first malicious request and the line where the attack succeeded.
// The excerpt is dated the UTC day before the one it is played on, so no line
// carries a time later than the moment it is read (review R2-13, 03/11/2026:
// a log dated the same day, 08:00 to 20:00, showed the future to a morning
// player); the seed is still the play day's, so the case itself is unchanged.
//
// Two formats, as the real software writes them:
//   - a web server access log in the combined format (Apache's LogFormat
//     "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-agent}i\"", the
//     same fields as NGINX's predefined "combined");
//   - an SSH authentication log in the syslog style (RFC 3164 timestamp,
//     host, "sshd[pid]:"), with OpenSSH's own messages: "Failed password
//     for ...", "Accepted password for ...", "Invalid user ... from ...".
// Seven incidents: credential stuffing, SSH brute force, path traversal, a
// probe for secrets ending in a 200, SQL injection with an oversized answer,
// a web shell upload, and a scan that finds an admin panel. The probe paths
// are the families the site's own Worker sorts (worker/probes.ts).
//
// Addresses come from the RFC 5737 documentation ranges, hosts from
// example.com, user agents are generic. Pure and deterministic: every random
// choice from the Rng the caller passes. The self-test parses every line of
// 400 days with a parser per format and derives the answers from the parsed
// log alone, independently of how the generator placed them.
// ============================================================================

// The seeded generators.
import { addDays, dailyRng, makeRng, type Rng } from "../../daily";
// The self-test's report shape.
import type { SelfTestReport } from "../../registry";

/** The game's stable id. */
export const GAME_ID = "log-detective";

/** The incidents. */
export type Scenario = "cred-stuffing" | "ssh-brute" | "traversal" | "dotfile" | "sqli" | "webshell" | "scan-admin";

/** Every incident, in a fixed order (the daily draw picks from it). */
export const SCENARIOS: readonly Scenario[] = ["cred-stuffing", "ssh-brute", "traversal", "dotfile", "sqli", "webshell", "scan-admin"];

/** The two log formats. */
export type LogFormat = "web" | "ssh";

/** One day's case. */
export interface Case {
  /** The UTC day the log is dated: the day before the one it is played on (review R2-13). */
  day: string;
  /** Which format. */
  format: LogFormat;
  /** Which incident. */
  scenario: Scenario;
  /** The server the log came from. */
  server: string;
  /** The log lines, in order. */
  lines: string[];
  /** The attacker's address. */
  attacker: string;
  /** The index (0-based) of the first malicious line. */
  first: number;
  /** The index (0-based) of the line where the attack succeeded. */
  success: number;
  /** Four addresses to choose from, the attacker among them. */
  ipChoices: string[];
  /** Values the explanation names: count, path, user. */
  facts: { count: number; path: string; user: string };
  /** True when the generator gave up and this is the known-good case. */
  fallback: boolean;
}

/** Month abbreviations, in English as both log formats write them. */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Generic browser user agents. */
const BROWSERS: readonly string[] = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
];

/** Generic tool user agents an attacker's script might send (or it may send a browser's). */
const TOOLS: readonly string[] = ["python-requests/2.32.3", "Go-http-client/1.1", "curl/8.5.0"];

/** The site's address in Referer fields. */
const SITE = "https://www.example.com";

/** One web request, before formatting. */
interface WebReq {
  /** Client address. */
  ip: string;
  /** Method. */
  method: "GET" | "POST";
  /** The request target (path and query). */
  target: string;
  /** Status code. */
  status: number;
  /** Body bytes, 0 written as "-". */
  bytes: number;
  /** Referer, or "-". */
  referer: string;
  /** User agent. */
  ua: string;
  /** Marks set by the generator for the answers. */
  mark?: "first" | "success";
}

/** One SSH log message, before formatting. */
interface SshMsg {
  /** Client address (for choosing and checking). */
  ip: string;
  /** The sshd process id. */
  pid: number;
  /** The message after "sshd[pid]: ". */
  text: string;
  /** Marks set by the generator for the answers. */
  mark?: "first" | "success";
}

/**
 * A random address from the three documentation ranges, not already used.
 *
 * @param rng the generator
 * @param used addresses taken
 * @returns a fresh address
 */
function freshIp(rng: Rng, used: Set<string>): string {
  // The three RFC 5737 blocks.
  const nets = ["192.0.2", "198.51.100", "203.0.113"];
  // Bounded: 64 tries is far more than a few dozen addresses in 750 need.
  for (let k = 0; k < 64; k++) {
    // A candidate.
    const ip = `${rng.pick(nets)}.${rng.range(2, 254)}`;
    // Unused: take it.
    if (!used.has(ip)) {
      // Taken now.
      used.add(ip);
      // The address.
      return ip;
    }
  }
  // Deterministic last resort: the first unused address in order.
  for (const n of nets) for (let h = 2; h < 255; h++) if (!used.has(`${n}.${h}`)) {
    // Taken now.
    used.add(`${n}.${h}`);
    // The address.
    return `${n}.${h}`;
  }
  // Unreachable with fewer than 759 addresses in use.
  return "192.0.2.1";
}

/**
 * Interleave several ordered streams into one, keeping each stream's order.
 *
 * @param rng the generator
 * @param streams the streams; the first is held back until `lead` items of the others have gone out
 * @param lead how many other items come before the first stream may start
 * @returns the merged items
 */
function interleave<T>(rng: Rng, streams: T[][], lead: number): T[] {
  // Copies, consumed from the front.
  const queues = streams.map((s) => s.slice());
  // The merged output.
  const out: T[] = [];
  // Every item goes out exactly once, so this runs a bounded number of times.
  const total = queues.reduce((n, q) => n + q.length, 0);
  // One item per pass.
  for (let k = 0; k < total; k++) {
    // Streams with items left; the first only once the lead has gone out (or nothing else is left).
    const others = queues.map((q, i) => ({ q, i })).filter(({ q, i }) => q.length > 0 && i > 0);
    // Whether the first stream may go now.
    const firstReady = queues[0].length > 0 && (out.length >= lead || others.length === 0);
    // The candidates.
    const cands = firstReady ? [{ q: queues[0], i: 0 }, ...others] : others;
    // Weighted by what each has left, so long streams spread out.
    const weight = cands.reduce((n, c) => n + c.q.length, 0);
    // A point in the weight.
    let r = rng.int(weight);
    // Find whose share it falls in.
    let pick = cands[0];
    // Walk the candidates.
    for (const c of cands) {
      // Inside this one's share.
      if (r < c.q.length) {
        // Chosen.
        pick = c;
        // Stop.
        break;
      }
      // Past it.
      r -= c.q.length;
    }
    // Its next item.
    out.push(pick.q.shift() as T);
  }
  // The merged stream.
  return out;
}

/**
 * The clock of a log: a start time on the day, moved forward a few seconds a line.
 *
 * @param rng the generator
 * @returns a function giving the next time as [hour, minute, second]
 */
function clock(rng: Rng): (fast: boolean) => [number, number, number] {
  // Seconds since midnight; between 08:00 and 20:00.
  let t = rng.range(8 * 3600, 20 * 3600);
  // Each call moves it on.
  return (fast) => {
    // Attack lines come quickly; ordinary ones spread out.
    t += fast ? rng.range(0, 2) : rng.range(0, 14);
    // Never past the end of the day.
    const s = Math.min(t, 86_399);
    // Hours, minutes, seconds.
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
  };
}

/** Two digits. */
function two(n: number): string {
  // Zero-padded.
  return String(n).padStart(2, "0");
}

/**
 * One web request as a combined-format line.
 *
 * @param r the request
 * @param day the date as YYYY-MM-DD
 * @param hms the time
 * @returns the line
 */
function webLine(r: WebReq, day: string, hms: [number, number, number]): string {
  // The date's parts.
  const [y, m, d] = day.split("-").map(Number);
  // %t: [day/Mon/year:HH:MM:SS zone], in UTC.
  const t = `[${two(d)}/${MONTHS[m - 1]}/${y}:${two(hms[0])}:${two(hms[1])}:${two(hms[2])} +0000]`;
  // %h %l %u %t "%r" %>s %b "%{Referer}i" "%{User-agent}i"; %b is "-" when no bytes were sent.
  return `${r.ip} - - ${t} "${r.method} ${r.target} HTTP/1.1" ${r.status} ${r.bytes === 0 ? "-" : r.bytes} "${r.referer}" "${r.ua}"`;
}

/**
 * One sshd message as a syslog line (RFC 3164 timestamp: month, day padded with a space, time).
 *
 * @param m the message
 * @param day the date as YYYY-MM-DD
 * @param hms the time
 * @param host the host name
 * @returns the line
 */
function sshLine(m: SshMsg, day: string, hms: [number, number, number], host: string): string {
  // The date's parts.
  const [, mo, d] = day.split("-").map(Number);
  // "Mmm dd hh:mm:ss host sshd[pid]: message".
  return `${MONTHS[mo - 1]} ${String(d).padStart(2, " ")} ${two(hms[0])}:${two(hms[1])}:${two(hms[2])} ${host} sshd[${m.pid}]: ${m.text}`;
}

/**
 * A plausible body size: a base and a little noise.
 *
 * @param rng the generator
 * @param base the usual size
 * @returns bytes
 */
function size(rng: Rng, base: number): number {
  // Within about 3% of the base.
  return base + rng.range(-Math.floor(base / 33), Math.floor(base / 33));
}

/**
 * One ordinary visitor's few requests.
 *
 * @param rng the generator
 * @param ip the visitor's address
 * @param role what kind of visitor: a reader, a shopper, a member who signs in (maybe mistyping once), an uploader, a monitor
 * @returns the requests, in order
 */
function visitor(rng: Rng, ip: string, role: "reader" | "shopper" | "member" | "typo" | "uploader" | "monitor" | "downloader"): WebReq[] {
  // The visitor's browser.
  const ua = rng.pick(BROWSERS);
  // A page request.
  const page = (target: string, base: number, referer = "-"): WebReq => ({ ip, method: "GET", target, status: 200, bytes: size(rng, base), referer, ua });
  // An asset request (fixed sizes, referred by the page).
  const asset = (target: string, bytes: number): WebReq => ({ ip, method: "GET", target, status: 200, bytes, referer: `${SITE}/`, ua });
  // The requests.
  const out: WebReq[] = [];
  // Most visits start at the home page with its assets.
  if (role !== "monitor") {
    // The page.
    out.push(page("/", 5124));
    // Its stylesheet and script.
    out.push(asset("/css/site.css", 18342), asset("/js/app.js", 48211));
    // Sometimes the browser asks for an icon the site does not have.
    if (rng.chance(0.3)) out.push({ ip, method: "GET", target: "/favicon.ico", status: 404, bytes: 196, referer: `${SITE}/`, ua });
  }
  // What the visitor came for.
  if (role === "reader") {
    // A post or two.
    out.push(page(rng.pick(["/blog/", "/blog/2026/10/vlan-basics/", "/blog/2026/09/dns-ttl/", "/about/"]), 9210, `${SITE}/`));
    // And a search, sometimes.
    if (rng.chance(0.5)) out.push(page(`/search?q=${rng.pick(["router", "firewall", "cabling", "switch"])}`, 7340, `${SITE}/blog/`));
  } else if (role === "shopper") {
    // Two products.
    const a = rng.range(3, 40);
    // Viewed one after the other.
    out.push(page(`/products?id=${a}`, 4870, `${SITE}/`), page(`/products?id=${a + rng.range(1, 9)}`, 4870, `${SITE}/products?id=${a}`));
  } else if (role === "member" || role === "typo") {
    // The sign-in form.
    out.push(page("/login", 3302, `${SITE}/`));
    // A member who mistypes once gets one 401 first.
    if (role === "typo") out.push({ ip, method: "POST", target: "/login", status: 401, bytes: 512, referer: `${SITE}/login`, ua });
    // Then in: a redirect to the account page.
    out.push({ ip, method: "POST", target: "/login", status: 302, bytes: 0, referer: `${SITE}/login`, ua });
    // The account page.
    out.push(page("/account/", 6120, `${SITE}/login`));
  } else if (role === "uploader") {
    // The upload form, an upload, and the picture it made.
    const n = rng.range(1000, 9999);
    // Form.
    out.push(page("/upload", 2210, `${SITE}/account/`));
    // Upload.
    out.push({ ip, method: "POST", target: "/upload", status: 200, bytes: 312, referer: `${SITE}/upload`, ua });
    // The image.
    out.push({ ip, method: "GET", target: `/uploads/photo-${n}.jpg`, status: 200, bytes: size(rng, 84211), referer: `${SITE}/upload`, ua });
  } else if (role === "downloader") {
    // A document from the download page.
    out.push(page(`/download?file=${rng.pick(["report-2026.pdf", "price-list.csv", "datasheet.pdf"])}`, 182044, `${SITE}/`));
  } else {
    // A monitor checks the status page a few times with a plain tool.
    const k = rng.range(2, 3);
    // Each check.
    for (let j = 0; j < k; j++) out.push({ ip, method: "GET", target: "/status", status: 200, bytes: 74, referer: "-", ua: "curl/8.5.0" });
  }
  // The visit.
  return out;
}

/**
 * The attacker's requests for a web incident, with the answers marked.
 *
 * @param rng the generator
 * @param ip the attacker's address
 * @param scenario which incident
 * @returns the requests and the facts the explanation names
 */
function attackWeb(rng: Rng, ip: string, scenario: Scenario): { reqs: WebReq[]; facts: Case["facts"] } {
  // A tool, or sometimes a browser's user agent to blend in.
  const ua = rng.chance(0.7) ? rng.pick(TOOLS) : rng.pick(BROWSERS);
  // A request.
  const req = (method: "GET" | "POST", target: string, status: number, bytes: number, mark?: WebReq["mark"]): WebReq => ({ ip, method, target, status, bytes, referer: "-", ua, mark });
  // The requests.
  const reqs: WebReq[] = [];
  // The facts.
  const facts = { count: 0, path: "", user: "" };
  // Each incident.
  if (scenario === "cred-stuffing") {
    // Many failed sign-ins in a burst.
    const k = rng.range(8, 14);
    // Each a 401.
    for (let j = 0; j < k; j++) reqs.push(req("POST", "/login", 401, 512, j === 0 ? "first" : undefined));
    // Then one works: a redirect.
    reqs.push(req("POST", "/login", 302, 0, "success"));
    // And the account page.
    reqs.push(req("GET", "/account/", 200, size(rng, 6120)));
    // Maybe the saved cards too.
    if (rng.chance(0.6)) reqs.push(req("GET", "/account/payment-methods", 200, size(rng, 3950)));
    // Failures before the success.
    facts.count = k;
    // The path.
    facts.path = "/login";
  } else if (scenario === "traversal") {
    // First an ordinary download, to learn the parameter.
    reqs.push(req("GET", "/download?file=report-2026.pdf", 200, size(rng, 182044)));
    // Attempts the filter blocks.
    const tries = rng.shuffle(["../../../../etc/passwd", "....//....//....//etc/passwd", "..\\..\\..\\..\\etc\\passwd", "/etc/passwd%00.pdf"]).slice(0, rng.range(2, 3));
    // The first is the first malicious request ("/etc/passwd%00.pdf" is not a traversal, so keep a dotted one first).
    const ordered = [tries.find((t) => t.includes("..")) ?? "../../../../etc/passwd", ...tries.filter((t) => t !== (tries.find((x) => x.includes("..")) ?? ""))];
    // Each blocked (the file name is encoded as a browser would).
    ordered.forEach((t, j) => reqs.push(req("GET", `/download?file=${encodeQuery(t)}`, j % 2 === 0 ? 403 : 400, 199, j === 0 ? "first" : undefined)));
    // Then a percent-encoded traversal gets through: the password file comes back.
    reqs.push(req("GET", "/download?file=%2e%2e%2f%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd", 200, size(rng, 1847), "success"));
    // And a try for something worse, refused.
    reqs.push(req("GET", "/download?file=%2e%2e%2f%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fshadow", 403, 199));
    // The blocked attempts.
    facts.count = ordered.length;
    // What was taken.
    facts.path = "/etc/passwd";
  } else if (scenario === "dotfile") {
    // The file that is really there.
    const hit = rng.pick(["/.env", "/.git/config"]);
    // Probes from the families the site's Worker counts.
    const probes = rng.shuffle(["/.git/HEAD", "/.aws/credentials", "/.git-credentials", "/.svn/wc.db", "/.ssh/id_rsa", "/.DS_Store", "/.bash_history", "/.env~", "/actuator/env", "/wp-json/batch/v1"]).slice(0, rng.range(5, 8));
    // Where the hit falls: after at least three misses.
    const at = rng.range(3, probes.length - 1);
    // The misses before it.
    probes.slice(0, at).forEach((p, j) => reqs.push(req("GET", p, 404, 196, j === 0 ? "first" : undefined)));
    // The hit: the file comes back (a .env of a few hundred bytes, a Git config smaller).
    reqs.push(req("GET", hit, 200, hit === "/.env" ? size(rng, 612) : size(rng, 263), "success"));
    // The scanner carries on with the rest.
    probes.slice(at).forEach((p) => reqs.push(req("GET", p, 404, 196)));
    // Misses before the hit.
    facts.count = at;
    // What was taken.
    facts.path = hit;
  } else if (scenario === "sqli") {
    // An ordinary product page first.
    const id = rng.range(3, 40);
    // Viewed plainly.
    reqs.push(req("GET", `/products?id=${id}`, 200, size(rng, 4870)));
    // A quote breaks the query: a server error.
    reqs.push(req("GET", `/products?id=${id}%27`, 500, 612, "first"));
    // True and false conditions answer differently.
    reqs.push(req("GET", `/products?id=${id}%20AND%201=1`, 200, size(rng, 4870)));
    // The false one comes back nearly empty.
    reqs.push(req("GET", `/products?id=${id}%20AND%201=2`, 200, size(rng, 1203)));
    // Counting columns.
    const cols = rng.range(3, 5);
    // Wrong counts fail.
    for (let c = 2; c < cols; c++) reqs.push(req("GET", `/products?id=${id}%20UNION%20SELECT%20${Array(c).fill("NULL").join(",")}--`, 500, 612));
    // The right count, pulling the users table: a page fifty times its usual size.
    reqs.push(req("GET", `/products?id=-1%20UNION%20SELECT%20${["username", "password_hash", "email", "NULL", "NULL"].slice(0, cols).join(",")}%20FROM%20users--`, 200, size(rng, 248113), "success"));
    // Requests with injected SQL before the dump.
    facts.count = cols;
    // The table taken.
    facts.path = "users";
  } else if (scenario === "webshell") {
    // The shell's file name.
    const shell = rng.pick(["avatar.php", "img_2041.php", "thumb.phtml", "logo.php"]);
    // The upload form, as anyone would see it.
    reqs.push(req("GET", "/upload", 200, size(rng, 2210)));
    // The upload of the shell: the first malicious request.
    reqs.push(req("POST", "/upload", 200, 312, "first"));
    // The shell runs: the first command answers.
    reqs.push(req("GET", `/uploads/${shell}?cmd=id`, 200, 54, "success"));
    // More commands.
    for (const cmd of rng.shuffle(["whoami", "uname%20-a", "cat%20/etc/passwd", "ls%20-la"]).slice(0, rng.range(2, 4))) reqs.push(req("GET", `/uploads/${shell}?cmd=${cmd}`, 200, size(rng, 220)));
    // Commands run after the first (the form, the upload and the first command come before them).
    facts.count = reqs.length - 3;
    // The shell.
    facts.path = `/uploads/${shell}`;
  } else {
    // scan-admin: the panel found.
    const panel = rng.pick(["/admin/", "/administrator/", "/dashboard/", "/manager/"]);
    // Probes from the families the site's Worker counts, none of them the panel.
    const probes = rng.shuffle(["/wp-admin/", "/wp-login.php", "/phpmyadmin/", "/user/login", "/admin/login", "/webmail/", "/staging/", "/config/", "/backup.zip", "/old/", "/cms/", "/administrator/", "/admin/", "/dashboard/", "/manager/"].filter((p) => p !== panel)).slice(0, rng.range(8, 13));
    // Each a 404.
    probes.forEach((p, j) => reqs.push(req("GET", p, 404, 196, j === 0 ? "first" : undefined)));
    // The panel answers.
    reqs.push(req("GET", panel, 200, size(rng, 3870), "success"));
    // And its sign-in is tried.
    reqs.push(req("POST", panel, 401, 512));
    // Misses before the hit.
    facts.count = probes.length;
    // The panel.
    facts.path = panel;
  }
  // The incident.
  return { reqs, facts };
}

/**
 * Percent-encode a query value the way a client would (slashes and backslashes too, dots and letters kept).
 *
 * @param s the raw value
 * @returns the encoded value
 */
function encodeQuery(s: string): string {
  // encodeURIComponent leaves dots and letters, encodes / \ and %.
  return encodeURIComponent(s);
}

/**
 * The attacker's and the users' sshd messages.
 *
 * @param rng the generator
 * @param attacker the attacker's address
 * @param used addresses taken
 * @param total how many lines the excerpt should have in all
 * @returns the streams (attacker first) and the facts
 */
function sshStreams(rng: Rng, attacker: string, used: Set<string>, total: number): { streams: SshMsg[][]; facts: Case["facts"] } {
  // A new process id for each connection.
  let pid = rng.range(1200, 3800);
  // A source port.
  const port = () => rng.range(32768, 60999);
  // An SSH key fingerprint, SHA256 in unpadded base64 (43 characters).
  const fp = () => Array.from({ length: 43 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[rng.int(64)]).join("");
  // The attacker's stream.
  const atk: SshMsg[] = [];
  // How many tries.
  const k = rng.range(9, 16);
  // Names a dictionary tries; some exist (root), most do not.
  const names = ["admin", "test", "oracle", "ubuntu", "git", "postgres", "user", "pi", "ftp", "guest", "support"];
  // The account that falls: a service account with a weak password.
  const victim = rng.pick(["deploy", "backup", "build"]);
  // Each try.
  for (let j = 0; j < k; j++) {
    // Its connection.
    const p = port();
    // A new process.
    pid += rng.range(3, 40);
    // root, or a name that is not an account.
    if (rng.chance(0.35)) {
      // root exists, so only the failure is logged.
      atk.push({ ip: attacker, pid, text: `Failed password for root from ${attacker} port ${p} ssh2` });
    } else {
      // A name that is not an account.
      const u = rng.pick(names);
      // sshd says so first.
      atk.push({ ip: attacker, pid, text: `Invalid user ${u} from ${attacker} port ${p}` });
      // Then the failure, for an invalid user.
      atk.push({ ip: attacker, pid, text: `Failed password for invalid user ${u} from ${attacker} port ${p} ssh2` });
    }
  }
  // The first line of the attack.
  atk[0].mark = "first";
  // A couple of tries at the victim fail before one works.
  const vp = port();
  // A new process.
  pid += rng.range(3, 40);
  // Wrong guess.
  atk.push({ ip: attacker, pid, text: `Failed password for ${victim} from ${attacker} port ${vp} ssh2` });
  // The right one.
  atk.push({ ip: attacker, pid, text: `Accepted password for ${victim} from ${attacker} port ${vp} ssh2`, mark: "success" });
  // The ordinary lines still needed (at least 20, so the attack never has the log to itself).
  const normalTarget = Math.max(20, total - atk.length);
  // The users' streams.
  const streams: SshMsg[][] = [atk];
  // Ordinary lines made so far.
  let made = 0;
  // The people who sign in.
  const people = rng.shuffle(["alice", "bruno", "chen", "dara", "emeka", "farah", "gustavo", "hana", "ines", "joao"]);
  // One of them mistypes once.
  const typo = rng.int(3);
  // Sessions until enough lines (bounded by the people list).
  for (let j = 0; j < people.length && made < normalTarget; j++) {
    // The user's address.
    const ip = freshIp(rng, used);
    // The connection.
    const p = port();
    // A process.
    pid += rng.range(3, 40);
    // The session.
    const s: SshMsg[] = [];
    // A password user who slips once, or a key user.
    if (j === typo) {
      // The slip.
      s.push({ ip, pid, text: `Failed password for ${people[j]} from ${ip} port ${p} ssh2` });
      // Then in.
      s.push({ ip, pid, text: `Accepted password for ${people[j]} from ${ip} port ${p} ssh2` });
    } else {
      // Signed in with a key.
      s.push({ ip, pid, text: `Accepted publickey for ${people[j]} from ${ip} port ${p} ssh2: ED25519 SHA256:${fp()}` });
    }
    // Some sessions end inside the excerpt.
    if (rng.chance(0.7)) {
      // The client says goodbye.
      s.push({ ip, pid, text: `Received disconnect from ${ip} port ${p}:11: disconnected by user` });
      // sshd closes the connection.
      s.push({ ip, pid, text: `Disconnected from user ${people[j]} ${ip} port ${p}` });
    }
    // Counted.
    made += s.length;
    // Kept.
    streams.push(s);
  }
  // A backup job signs in a few times with its key from one address.
  const bip = freshIp(rng, used);
  // Its sessions.
  const backups: SshMsg[] = [];
  // Enough to reach the line count.
  for (let j = 0; made < normalTarget && j < 40; j++) {
    // The connection.
    const p = port();
    // A process.
    pid += rng.range(3, 40);
    // In.
    backups.push({ ip: bip, pid, text: `Accepted publickey for backup-agent from ${bip} port ${p} ssh2: ED25519 SHA256:${fp()}` });
    // Out.
    backups.push({ ip: bip, pid, text: `Received disconnect from ${bip} port ${p}:11: disconnected by user` });
    // Counted.
    made += 2;
  }
  // Kept.
  streams.push(backups);
  // The facts: failures before the success, the account taken.
  return { streams, facts: { count: atk.filter((m) => m.text.startsWith("Failed password")).length, path: "", user: victim } };
}

/**
 * Generate one case: the format and incident, the lines and the answers.
 *
 * @param rng the generator
 * @param day the date the log carries
 * @param scenario the incident (drawn by the caller)
 * @returns the case, unchecked
 */
function generate(rng: Rng, day: string, scenario: Scenario): Case {
  // Addresses taken.
  const used = new Set<string>();
  // The attacker.
  const attacker = freshIp(rng, used);
  // How many lines in all (the last visit may run a few over, and 80 is the most).
  const total = rng.range(45, 72);
  // How many ordinary lines come before the attack begins.
  const lead = rng.range(5, 14);
  // The time source.
  const next = clock(rng);
  // SSH logs.
  if (scenario === "ssh-brute") {
    // The streams.
    const { streams, facts } = sshStreams(rng, attacker, used, total);
    // Merged.
    const merged = interleave(rng, streams, lead);
    // As lines.
    const lines = merged.map((m) => sshLine(m, day, next(m.ip === attacker), "bastion"));
    // The answers.
    const first = merged.findIndex((m) => m.mark === "first");
    // The success.
    const success = merged.findIndex((m) => m.mark === "success");
    // The case.
    return { day, format: "ssh", scenario, server: "bastion.example.com", lines, attacker, first, success, ipChoices: choices(rng, merged.map((m) => m.ip), attacker), facts, fallback: false };
  }
  // Web logs: the attacker's stream.
  const { reqs, facts } = attackWeb(rng, attacker, scenario);
  // The visitors' streams.
  const streams: WebReq[][] = [reqs];
  // Ordinary lines made.
  let made = 0;
  // The visitor kinds, with the ones that make good decoys first.
  const roles = ["typo", "uploader", "downloader", "shopper", "monitor", "reader", "member", "shopper", "reader", "member", "reader", "shopper", "reader", "member", "reader", "shopper"] as const;
  // Visitors until enough lines (bounded by the list of roles).
  for (let j = 0; j < roles.length && made < total - reqs.length; j++) {
    // A visit.
    const v = visitor(rng, freshIp(rng, used), roles[j]);
    // Counted.
    made += v.length;
    // Kept.
    streams.push(v);
  }
  // Merged.
  const merged = interleave(rng, streams, lead);
  // As lines.
  const lines = merged.map((r) => webLine(r, day, next(r.ip === attacker)));
  // The answers.
  const first = merged.findIndex((r) => r.mark === "first");
  // The success.
  const success = merged.findIndex((r) => r.mark === "success");
  // The case.
  return { day, format: "web", scenario, server: "www.example.com", lines, attacker, first, success, ipChoices: choices(rng, merged.map((r) => r.ip), attacker), facts, fallback: false };
}

/**
 * Four addresses to choose from: the attacker and the three busiest others, in a random order.
 *
 * @param rng the generator
 * @param ips every line's address, in order
 * @param attacker the attacker's address
 * @returns four addresses
 */
function choices(rng: Rng, ips: string[], attacker: string): string[] {
  // Lines per address.
  const count = new Map<string, number>();
  // Counted.
  for (const ip of ips) count.set(ip, (count.get(ip) ?? 0) + 1);
  // The others, busiest first (ties by address, so the order is fixed).
  const others = [...count.entries()].filter(([ip]) => ip !== attacker).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([ip]) => ip);
  // Three of them and the attacker, shuffled.
  return rng.shuffle([attacker, ...others.slice(0, 3)]);
}

// ---- Parsing and checking: what the self-test (and the generator's own check) use ----

/** A parsed combined-format line. */
export interface WebEntry {
  /** Client address. */
  ip: string;
  /** Method. */
  method: string;
  /** Request target. */
  target: string;
  /** Status. */
  status: number;
  /** Bytes (0 for "-"). */
  bytes: number;
}

/** A parsed sshd syslog line. */
export interface SshEntry {
  /** The client address the message names. */
  ip: string;
  /** The message kind. */
  kind: "failed" | "invalid" | "accepted" | "disconnect" | "disconnected";
  /** The user named, if any. */
  user: string;
}

/** The combined log format, as a regular expression: %h %l %u [%t] "%r" %>s %b "Referer" "User-agent". */
const WEB_RE = /^(\d{1,3}(?:\.\d{1,3}){3}) (\S+) (\S+) \[(\d{2})\/([A-Z][a-z]{2})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-]\d{4})\] "([A-Z]+) (\S+) (HTTP\/\d\.\d)" (\d{3}) (\d+|-) "([^"]*)" "([^"]*)"$/;

/** The syslog prefix of an sshd line: Mmm dd hh:mm:ss host sshd[pid]: message. */
const SSH_RE = /^([A-Z][a-z]{2}) ([ \d]\d) (\d{2}):(\d{2}):(\d{2}) (\S+) sshd\[(\d+)\]: (.+)$/;

/** OpenSSH's messages, as auth.c, auth2.c and packet.c write them. */
const SSH_MESSAGES: ReadonlyArray<{ kind: SshEntry["kind"]; re: RegExp }> = [
  // auth.c: "%s %s%s%s for %s%.100s from %.200s port %d ssh2%s%s" with "Failed".
  { kind: "failed", re: /^Failed (?:password|publickey) for (?:invalid user )?(\S+) from (\S+) port \d+ ssh2$/ },
  // The same with "Accepted", optionally ": key type and fingerprint".
  { kind: "accepted", re: /^Accepted (?:password|publickey) for (\S+) from (\S+) port \d+ ssh2(?:: [A-Z0-9-]+ SHA256:[A-Za-z0-9+/]{43})?$/ },
  // auth.c: "Invalid user %.100s from %.100s port %d".
  { kind: "invalid", re: /^Invalid user (\S+) from (\S+) port \d+$/ },
  // packet.c: "Received disconnect from %s port %d:%u: %.400s".
  { kind: "disconnect", re: /^Received disconnect from (\S+) port \d+:11: disconnected by user$/ },
  // packet.c: "Disconnected from %s" with the "user %s" preamble and "%s port %d".
  { kind: "disconnected", re: /^Disconnected from user (\S+) (\S+) port \d+$/ },
];

/**
 * Parse one combined-format line.
 *
 * @param line the line
 * @returns the entry, or null when it does not parse
 */
export function parseWebLine(line: string): WebEntry | null {
  // The whole line must match.
  const m = WEB_RE.exec(line);
  // No match, no entry.
  if (!m) return null;
  // The month must be a real abbreviation.
  if (!MONTHS.includes(m[5])) return null;
  // The fields the checks need.
  return { ip: m[1], method: m[11], target: m[12], status: Number(m[14]), bytes: m[15] === "-" ? 0 : Number(m[15]) };
}

/**
 * Parse one sshd syslog line.
 *
 * @param line the line
 * @returns the entry, or null when it does not parse
 */
export function parseSshLine(line: string): SshEntry | null {
  // The syslog prefix.
  const m = SSH_RE.exec(line);
  // No match, no entry.
  if (!m || !MONTHS.includes(m[1])) return null;
  // The message.
  const msg = m[8];
  // Each known message.
  for (const k of SSH_MESSAGES) {
    // Its match.
    const x = k.re.exec(msg);
    // Not this one.
    if (!x) continue;
    // Disconnected names the user first, the address second; the others the reverse or only the address.
    if (k.kind === "disconnected") return { kind: k.kind, user: x[1], ip: x[2] };
    // Received disconnect names only the address.
    if (k.kind === "disconnect") return { kind: k.kind, user: "", ip: x[1] };
    // The rest: user, then address.
    return { kind: k.kind, user: x[1], ip: x[2] };
  }
  // An sshd message this game does not write.
  return null;
}

/** Request targets that are attacks by their look alone. */
const SIGNATURES: readonly RegExp[] = [
  // Path traversal: dot-dot followed by a separator, plain or encoded.
  /(\.\.|%2e%2e)(\/|\\|%2f|%5c)/i,
  // SQL injection in a query: a quote, or SQL keywords between encoded spaces, or a comment.
  /\?.*(%27|'|%20(and|or|union|select|order%20by)%20|--)/i,
  // A dot-file or dot-folder (any but .well-known).
  /^\/\.(?!well-known)/,
  // Framework and WordPress probes from the Worker's families.
  /^\/(actuator\/|wp-json\/batch|wp-admin|wp-login\.php|phpmyadmin)/,
  // A script in the uploads folder.
  /^\/uploads\/[^?]+\.(php\d?|phtml)/i,
];

/** Whether a target matches any attack signature. */
export function isSignature(target: string): boolean {
  // Any one is enough.
  return SIGNATURES.some((re) => re.test(target));
}

/**
 * What the log alone says: the suspicious addresses, the first malicious line and the success line.
 * Rules (one per incident, written from what the log shows, not from the generator):
 *   - an address is suspicious if any of its requests matches a signature, if it has 6 or more 404s,
 *     5 or more failed sign-ins (POST /login answered 401), or 5 or more "Failed password" lines;
 *   - the first malicious line is the attacker's first line, except where its first lines are ordinary
 *     (traversal, SQL injection: the first signature line; web shell: the upload just before the first shell request);
 *   - the success line is the attacker's first sign-in that worked (302, or "Accepted"), the first 200 among
 *     its signature lines or probes, or, for SQL injection, the first injected request with an oversized answer.
 *
 * @param c the case
 * @returns the derived answers, or the reason they cannot be derived
 */
export function derive(c: Case): { suspects: string[]; first: number; success: number } | { error: string } {
  // Web logs.
  if (c.format === "web") {
    // Parsed.
    const entries = c.lines.map(parseWebLine);
    // Every line must parse.
    const bad = entries.findIndex((e) => e === null);
    // One that does not.
    if (bad >= 0) return { error: `line ${bad + 1} does not parse as combined format` };
    // Now all present.
    const es = entries as WebEntry[];
    // Per-address counters.
    const n404 = new Map<string, number>();
    // Failed sign-ins.
    const n401 = new Map<string, number>();
    // Addresses with a signature line.
    const sig = new Set<string>();
    // Each entry.
    for (const e of es) {
      // 404s.
      if (e.status === 404) n404.set(e.ip, (n404.get(e.ip) ?? 0) + 1);
      // Failed sign-ins.
      if (e.method === "POST" && e.target === "/login" && e.status === 401) n401.set(e.ip, (n401.get(e.ip) ?? 0) + 1);
      // Signatures.
      if (isSignature(e.target)) sig.add(e.ip);
    }
    // The suspects.
    const suspects = new Set<string>(sig);
    // Many 404s.
    for (const [ip, n] of n404) if (n >= 6) suspects.add(ip);
    // Many failed sign-ins.
    for (const [ip, n] of n401) if (n >= 5) suspects.add(ip);
    // Exactly one is needed to go on.
    if (suspects.size !== 1) return { error: `${suspects.size} suspicious addresses` };
    // The attacker.
    const [ip] = [...suspects];
    // Its lines' indexes.
    const mine = es.map((e, i) => ({ e, i })).filter((x) => x.e.ip === ip);
    // The first malicious line.
    let first = mine[0].i;
    // Traversal and SQL injection begin with ordinary requests: the first signature line.
    if (c.scenario === "traversal" || c.scenario === "sqli") first = mine.find((x) => isSignature(x.e.target))?.i ?? -1;
    // A web shell begins with the upload just before the first request to the shell.
    if (c.scenario === "webshell") {
      // The first shell request.
      const shell = mine.find((x) => isSignature(x.e.target));
      // The last upload before it.
      first = shell ? [...mine].reverse().find((x) => x.i < shell.i && x.e.method === "POST" && x.e.target === "/upload")?.i ?? -1 : -1;
    }
    // The usual size of a product page, for the oversized answer.
    const productSizes = es.filter((e) => e.target.startsWith("/products?id=") && e.status === 200 && !isSignature(e.target)).map((e) => e.bytes);
    // The largest ordinary one (there is always the attacker's own first look).
    const usual = productSizes.length ? Math.max(...productSizes) : 0;
    // The success line.
    let success = -1;
    // Each incident's rule.
    if (c.scenario === "cred-stuffing") success = mine.find((x) => x.e.method === "POST" && x.e.target === "/login" && x.e.status === 302)?.i ?? -1;
    // The first 200 among signature lines.
    else if (c.scenario === "traversal" || c.scenario === "webshell") success = mine.find((x) => isSignature(x.e.target) && x.e.status === 200)?.i ?? -1;
    // An injected request answered with ten times the usual size.
    else if (c.scenario === "sqli") success = mine.find((x) => isSignature(x.e.target) && x.e.status === 200 && x.e.bytes > 10 * usual)?.i ?? -1;
    // The first 200 among the probes.
    else success = mine.find((x) => x.e.status === 200)?.i ?? -1;
    // The answers.
    return { suspects: [ip], first, success };
  }
  // SSH logs: parsed.
  const entries = c.lines.map(parseSshLine);
  // Every line must parse.
  const bad = entries.findIndex((e) => e === null);
  // One that does not.
  if (bad >= 0) return { error: `line ${bad + 1} does not parse as an sshd message` };
  // Now all present.
  const es = entries as SshEntry[];
  // Failed passwords per address.
  const fails = new Map<string, number>();
  // Counted.
  for (const e of es) if (e.kind === "failed") fails.set(e.ip, (fails.get(e.ip) ?? 0) + 1);
  // Suspects: five or more failures.
  const suspects = [...fails.entries()].filter(([, n]) => n >= 5).map(([ip]) => ip);
  // Exactly one.
  if (suspects.length !== 1) return { error: `${suspects.length} suspicious addresses` };
  // The attacker's lines.
  const mine = es.map((e, i) => ({ e, i })).filter((x) => x.e.ip === suspects[0]);
  // First: its first line; success: its first accepted sign-in.
  return { suspects, first: mine[0].i, success: mine.find((x) => x.e.kind === "accepted")?.i ?? -1 };
}

/**
 * Check a case: shape, line count, parsing, one attacker, and answers that the log alone gives.
 *
 * @param c the case
 * @returns the problems found (empty when it is good)
 */
export function checkCase(c: Case): string[] {
  // Problems.
  const out: string[] = [];
  // 40 to 80 lines.
  if (c.lines.length < 40 || c.lines.length > 80) out.push(`${c.lines.length} lines`);
  // The answers from the log alone.
  const d = derive(c);
  // A log that cannot be read is a failure.
  if ("error" in d) return [...out, d.error];
  // The one suspect is the attacker.
  if (d.suspects[0] !== c.attacker) out.push(`the log points at ${d.suspects[0]}, not ${c.attacker}`);
  // The first malicious line matches.
  if (d.first !== c.first || c.first < 0) out.push(`first malicious line: derived ${d.first + 1}, stored ${c.first + 1}`);
  // The success line exists and matches.
  if (d.success !== c.success || c.success < 0) out.push(`success line: derived ${d.success + 1}, stored ${c.success + 1}`);
  // Success comes after the first.
  if (c.success <= c.first) out.push("success is not after the first malicious line");
  // The first malicious line is not the very first line of the excerpt (some ordinary traffic comes first).
  if (c.first === 0) out.push("the attack starts on line 1");
  // Nothing before the first malicious line matches a signature (web logs).
  if (c.format === "web") {
    // The lines before it.
    for (let i = 0; i < c.first; i++) {
      // Parsed.
      const e = parseWebLine(c.lines[i]);
      // A signature before the first.
      if (e && isSignature(e.target)) out.push(`line ${i + 1} looks malicious and comes before the first`);
    }
  }
  // Four distinct choices, the attacker among them, each in the log.
  if (new Set(c.ipChoices).size !== 4 || !c.ipChoices.includes(c.attacker)) out.push("address choices malformed");
  // Each choice really appears.
  for (const ip of c.ipChoices) if (!c.lines.some((l) => l.includes(ip))) out.push(`${ip} is offered but not in the log`);
  // Every line carries the case's date: [dd/Mon/yyyy: in the combined format, "Mon dd " in syslog (review R2-13).
  const [cy, cm, cd] = c.day.split("-").map(Number);
  // The date as each format writes it.
  const stamp = c.format === "web" ? `[${two(cd)}/${MONTHS[cm - 1]}/${cy}:` : `${MONTHS[cm - 1]} ${String(cd).padStart(2, " ")} `;
  // A line dated otherwise is a failure.
  for (const l of c.lines) if (c.format === "web" ? !l.includes(stamp) : !l.startsWith(stamp)) out.push(`a line is not dated ${c.day}`);
  // Every client address is a documentation address (the parsers give each line's address).
  for (const l of c.lines) {
    // The line's address, by its format.
    const ip = c.format === "web" ? parseWebLine(l)?.ip : parseSshLine(l)?.ip;
    // Outside 192.0.2.0/24, 198.51.100.0/24 and 203.0.113.0/24.
    if (!ip || !/^(192\.0\.2|198\.51\.100|203\.0\.113)\.\d{1,3}$/.test(ip)) out.push(`${ip} is not an RFC 5737 address`);
  }
  // The problems.
  return out;
}

/** How many times the generator may try before falling back. */
const MAX_TRIES = 6;

/** The known-good case's seed and scenario (checked by the self-test like any other). */
const FALLBACK = { seed: 20261103, scenario: "dotfile" as Scenario };

/**
 * A checked case: up to MAX_TRIES generations, then the known-good one.
 *
 * @param rng the generator
 * @param day the date the log carries
 * @returns a case that passes checkCase (or the fallback, marked)
 */
export function makeCase(rng: Rng, day: string): Case {
  // The incident.
  const scenario = rng.pick(SCENARIOS);
  // Bounded attempts.
  for (let k = 0; k < MAX_TRIES; k++) {
    // One attempt.
    const c = generate(rng, day, scenario);
    // Good: done.
    if (checkCase(c).length === 0) return c;
  }
  // The known-good case, with the date the caller gave.
  return { ...generate(makeRng(FALLBACK.seed), day, FALLBACK.scenario), fallback: true };
}

/**
 * The case of a UTC day, its log dated the day before (review R2-13).
 *
 * @param dayKey the day it is played on, as YYYY-MM-DD
 * @returns the day's case
 */
export function dailyCase(dayKey: string): Case {
  // The play day's generator; the log carries the previous day, so every line is in the past.
  return makeCase(dailyRng(GAME_ID, dayKey), addDays(dayKey, -1));
}

/**
 * A practice case from a seed the component picks, its log dated the day before the one it is played on.
 *
 * @param seed any number
 * @param dayKey the day it is played on
 * @returns a case
 */
export function practiceCase(seed: number, dayKey: string): Case {
  // A plain seeded generator; the previous day's date, as for the daily case.
  return makeCase(makeRng(seed), addDays(dayKey, -1));
}

/** The three questions, in order. */
export type Question = "ip" | "first" | "success";

/** The questions in play order. */
export const QUESTIONS: readonly Question[] = ["ip", "first", "success"];

/**
 * Whether an answer is right.
 *
 * @param c the case
 * @param q the question
 * @param answer an address (for "ip") or a line index
 * @returns true when right
 */
export function isRight(c: Case, q: Question, answer: string | number): boolean {
  // Each question's answer.
  if (q === "ip") return answer === c.attacker;
  // Line questions.
  return answer === (q === "first" ? c.first : c.success);
}

/**
 * The share card's mark line: one tick or cross per question.
 *
 * @param results right or wrong, in order
 * @returns the line
 */
export function markLine(results: readonly boolean[]): string {
  // ✅ or ❌ per answer.
  return results.map((ok) => (ok ? "✅" : "❌")).join("");
}

/**
 * The self-test: 400 days from launch, each generated twice and checked; plus the fallback case itself.
 *
 * @returns what was checked and every problem found
 */
export function selfTest(): SelfTestReport {
  // Problems.
  const failures: string[] = [];
  // Days checked.
  let checked = 0;
  // Fallbacks used.
  let fallbacks = 0;
  // Incidents seen.
  const seen = new Set<Scenario>();
  // The fallback case must itself be good.
  const fb = generate(makeRng(FALLBACK.seed), "2026-11-03", FALLBACK.scenario);
  // Its check.
  for (const p of checkCase(fb)) failures.push(`fallback case: ${p}`);
  // Each day.
  for (let d = 0; d < 400; d++) {
    // The day.
    const day = addDays("2026-11-03", d);
    // Generated twice.
    const a = dailyCase(day);
    // Again.
    const b = dailyCase(day);
    // Counted.
    checked++;
    // Identical.
    if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${day}: not deterministic`);
    // Dated the day before it is played, so no line is later than the moment it is read (review R2-13).
    if (a.day !== addDays(day, -1)) failures.push(`${day}: the log is dated ${a.day}, not the day before`);
    // Fallback counted.
    if (a.fallback) fallbacks++;
    // Seen.
    seen.add(a.scenario);
    // Checked from the log alone.
    for (const p of checkCase(a)) failures.push(`${day} (${a.scenario}): ${p}`);
  }
  // Any fallback is reported (it means a generator could not make a good case).
  if (fallbacks > 0) failures.push(`${fallbacks} of 400 days fell back to the known-good case`);
  // Every incident turns up in 400 days.
  for (const s of SCENARIOS) if (!seen.has(s)) failures.push(`incident ${s} never drawn in 400 days`);
  // The report.
  return { checked, failures };
}
