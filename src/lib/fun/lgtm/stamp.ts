// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/lgtm/stamp.ts
// ----------------------------------------------------------------------------
// THE LGTM STAMP, THE CHECKS (PRIME 14/11/2026 22:09: "Also Add The optional
// extras behind the page: 'LGTM stamp' toy"). The reader pastes a diff or a
// configuration and gets a stamp: "LGTM" only when none of these simple,
// local checks finds anything, otherwise "Changes requested" with the count.
// It is the opposite of the rubber stamp the song is about: it reads every
// line before it approves.
//
// The checks, each with its line number:
//   - leftover work markers: TODO, FIXME, XXX, HACK;
//   - things shaped like secrets: a PEM private-key header (the "PRIVATE KEY"
//     labels of RFC 7468), an AWS access key ID (AKIA for a long-term key,
//     ASIA for a temporary one, per AWS's IAM identifiers reference, read
//     15/11/2026), GitHub tokens (ghp_, github_pat_, gho_, ghu_, ghs_, ghr_,
//     per GitHub's "About authentication to GitHub", read 15/11/2026), tokens
//     shaped like Slack's (xoxb-, xoxp- and their siblings), and a
//     password, secret, token or API key assigned a quoted literal; the value
//     is masked in the finding, never shown back whole;
//   - trailing whitespace, a missing final newline, a merge-conflict marker,
//     a line over 120 characters;
//   - debug prints: console.log, print(, debugger, var_dump, System.out.println,
//     pdb.set_trace, dd(.
// In a unified diff (a line starting "@@" or "+++"), only the added lines are
// read, since that is what a review approves.
//
// Pure and deterministic: no network, nothing stored, no model. The same text
// always gets the same findings, the same stamp and the same wry line.
// ============================================================================

/** The kinds of finding. */
export type FindingKind = "todo" | "secret" | "trailing" | "noFinalNewline" | "conflict" | "longLine" | "debug";

/** One finding. */
export interface Finding {
  /** The 1-based line number in the pasted text (0 for the whole text). */
  line: number;
  /** What was found. */
  kind: FindingKind;
  /** A short excerpt of the line, with any secret-shaped value masked. */
  excerpt: string;
}

/** The verdict on a text. */
export interface StampResult {
  /** "lgtm" when nothing was found, "changes" otherwise, "empty" for nothing pasted. */
  verdict: "lgtm" | "changes" | "empty";
  /** The findings, in line order. */
  findings: Finding[];
  /** Whether the text was read as a unified diff (added lines only). */
  diff: boolean;
  /** Which of the verdict's wry lines to show (0 to 3), picked from the text so it never changes for the same text. */
  quip: number;
}

/** The longest line accepted before it is flagged. */
export const LONG_LINE = 120;

/** Work markers, as whole words in any case. */
const TODO = /\b(TODO|FIXME|XXX|HACK)\b/i;

/** Secret-shaped strings: [the pattern, the group that holds the value to mask]. */
const SECRETS: readonly RegExp[] = [
  /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/, // PEM private keys (RFC 7468 labels: PRIVATE KEY, RSA PRIVATE KEY, EC PRIVATE KEY...)
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/, // an AWS access key ID
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b/, // GitHub tokens by prefix: classic personal, OAuth, user-to-server, installation, refresh
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/, // GitHub fine-grained personal access tokens
  /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/, // strings shaped like Slack tokens
  /\b(?:password|passwd|pwd|secret|token|api[_-]?key)\b\s*[:=]\s*(["'])[^"'\s]{6,}\1/i, // a credential assigned a literal
];

/** Debug prints in common languages. */
const DEBUG = /\bconsole\.(?:log|debug|trace)\s*\(|\bprint\s*\(|\bdebugger\s*;?\s*$|\bvar_dump\s*\(|\bSystem\.out\.println\s*\(|\bpdb\.set_trace\s*\(|\bdd\s*\(/;

/** A merge-conflict marker at the start of a line. */
const CONFLICT = /^(?:<{7}|={7}|>{7})(?:\s|$)/;

/**
 * A line shortened for display, with every secret-shaped value masked.
 *
 * @param s the line
 * @returns a safe excerpt of at most 80 characters
 */
export function excerptOf(s: string): string {
  // Each secret pattern, its match replaced by its first four characters and a mask.
  let out = s;
  // Masked one pattern at a time.
  for (const re of SECRETS) out = out.replace(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"), (m) => `${m.slice(0, 4)}…[masked]`);
  // Trimmed for display.
  const t = out.trim();
  // At most 80 characters.
  return t.length > 80 ? `${t.slice(0, 77)}...` : t;
}

/**
 * A small, stable number from a text, to pick the wry line (FNV-1a, 32 bits).
 *
 * @param s the text
 * @returns an unsigned 32-bit hash
 */
function hash(s: string): number {
  // The FNV offset basis.
  let h = 0x811c9dc5;
  // Each UTF-16 unit.
  for (let i = 0; i < s.length; i++) {
    // Mixed in.
    h ^= s.charCodeAt(i);
    // The FNV prime, kept to 32 bits.
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // Unsigned.
  return h >>> 0;
}

/**
 * Stamp a pasted text.
 *
 * @param text what the reader pasted
 * @returns the verdict, the findings and the wry line's number
 */
export function stamp(text: string): StampResult {
  // Nothing pasted.
  if (!text.trim()) return { verdict: "empty", findings: [], diff: false, quip: 0 };
  // The lines, with Windows line ends read as one.
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  // A unified diff: a hunk header or a file header.
  const diff = lines.some((l) => l.startsWith("@@") || l.startsWith("+++ "));
  // The findings.
  const findings: Finding[] = [];
  // Each line.
  lines.forEach((raw, i) => {
    // In a diff, only added lines are reviewed (not the "+++" file header).
    if (diff && (!raw.startsWith("+") || raw.startsWith("+++"))) return;
    // The line's content, without the diff's plus sign.
    const l = diff ? raw.slice(1) : raw;
    // Its number, 1-based.
    const n = i + 1;
    // A merge-conflict marker.
    if (CONFLICT.test(l)) findings.push({ line: n, kind: "conflict", excerpt: excerptOf(l) });
    // A work marker.
    if (TODO.test(l)) findings.push({ line: n, kind: "todo", excerpt: excerptOf(l) });
    // A secret-shaped string.
    if (SECRETS.some((re) => re.test(l))) findings.push({ line: n, kind: "secret", excerpt: excerptOf(l) });
    // A debug print.
    if (DEBUG.test(l)) findings.push({ line: n, kind: "debug", excerpt: excerptOf(l) });
    // Trailing spaces or tabs.
    if (/[ \t]+$/.test(l) && l.trim() !== "") findings.push({ line: n, kind: "trailing", excerpt: excerptOf(l) });
    // A very long line.
    if (l.length > LONG_LINE) findings.push({ line: n, kind: "longLine", excerpt: excerptOf(l) });
  });
  // A text that does not end with a newline (only outside a diff, where the diff format marks it itself).
  if (!diff && !/\n$/.test(text)) findings.push({ line: 0, kind: "noFinalNewline", excerpt: "" });
  // The verdict.
  const verdict = findings.length === 0 ? "lgtm" : "changes";
  // The wry line: one of four, from the text.
  return { verdict, findings, diff, quip: hash(text) % 4 };
}

// ---- The example ---------------------------------------------------------------

/**
 * The Example button's text (D-83: verbatim from a golden example below). A unified diff of a configuration, with a
 * leftover TODO, an access key ID and trailing spaces among the added lines. The key is AKIAIOSFODNN7EXAMPLE, the
 * example access key ID AWS prints in its own IAM documentation (read 15/11/2026), so it is shaped like a real one and
 * belongs to nobody.
 */
export const STAMP_EXAMPLE: string = [
  "--- a/deploy/settings.yaml", // the old file
  "+++ b/deploy/settings.yaml", // the new file
  "@@ -3,3 +3,5 @@ service:", // one hunk: three old lines, five new
  "   name: billing", // context
  "-  retries: 3", // removed
  "+  retries: 2 # TODO: back to 3 after Friday", // added, with a work marker
  "+  aws_access_key_id: AKIAIOSFODNN7EXAMPLE", // added, with something shaped like a secret
  "   region: sa-east-1", // context
  "+  debug: true   ", // added, with trailing spaces
  "", // the final newline
].join("\n");

// ---- The self-test -----------------------------------------------------------

/** Golden examples: [text, expected verdict, expected kinds in order]. */
const GOLDEN: readonly (readonly [string, StampResult["verdict"], readonly FindingKind[]])[] = [
  ["", "empty", []],
  ["server {\n    listen 443 ssl;\n}\n", "lgtm", []],
  ["# TODO: rotate this\nkey = 1\n", "changes", ["todo"]],
  ["aws_access_key_id = AKIAABCDEFGHIJKLMNOP\n", "changes", ["secret"]],
  ["-----BEGIN RSA PRIVATE KEY-----\n", "changes", ["secret"]],
  ['password = "hunter2hunter2"\n', "changes", ["secret"]],
  ["value = 1   \n", "changes", ["trailing"]],
  ["no newline at the end", "changes", ["noFinalNewline"]],
  ["<<<<<<< HEAD\na\n=======\nb\n>>>>>>> branch\n", "changes", ["conflict", "conflict", "conflict"]],
  ["console.log(user);\n", "changes", ["debug"]],
  [`${"x".repeat(121)}\n`, "changes", ["longLine"]],
  ["--- a/app.js\n+++ b/app.js\n@@ -1,2 +1,2 @@\n-const debug = true; // TODO\n+const debug = false;\n", "lgtm", []],
  ["--- a/app.js\n+++ b/app.js\n@@ -1 +1 @@\n+console.log(secret) // FIXME\n", "changes", ["todo", "debug"]],
  [STAMP_EXAMPLE, "changes", ["todo", "secret", "trailing"]], // the Example button's text
];

/**
 * The golden examples, and that a secret is never shown back whole.
 *
 * @returns what was checked and what failed
 */
export function stampSelfTest(): { checked: number; failures: string[] } {
  // Problems found.
  const failures: string[] = [];
  // Each example.
  for (const [text, verdict, kinds] of GOLDEN) {
    // Stamped.
    const r = stamp(text);
    // The verdict and the kinds, in order.
    if (r.verdict !== verdict || r.findings.map((f) => f.kind).join(",") !== kinds.join(","))
      failures.push(`stamp(${JSON.stringify(text.slice(0, 40))}): ${r.verdict} ${r.findings.map((f) => f.kind).join(",")}`);
    // The same text, the same result.
    if (JSON.stringify(stamp(text)) !== JSON.stringify(r)) failures.push(`stamp(${JSON.stringify(text.slice(0, 40))}): not deterministic`);
  }
  // The key never comes back whole.
  if (excerptOf("id = AKIAABCDEFGHIJKLMNOP").includes("ABCDEFGHIJKLMNOP")) failures.push("excerptOf: an access key was shown whole");
  // The example's findings sit on the lines a reader counts: 6 (TODO), 7 (key) and 9 (trailing spaces).
  if (stamp(STAMP_EXAMPLE).findings.map((f) => f.line).join(",") !== "6,7,9") failures.push("STAMP_EXAMPLE: findings not on lines 6, 7 and 9");
  // The report.
  return { checked: GOLDEN.length + 2, failures };
}
