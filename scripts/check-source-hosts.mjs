#!/usr/bin/env node
// ============================================================================
// check-source-hosts — A CITATION MAY NOT POINT AT A CHAT TRANSCRIPT.
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. On 2026-09-27, twenty-two vendor entries were found citing
// the same ChatGPT share link as a source. The label was honest about its
// provenance - PRIME's own channel research, dated - and on thirteen of those
// entries it was the only substantive source behind every claim about partner
// status, vendor tier and specialisation.
//
// *** THE LINK WAS ALREADY DEAD. *** Read from PRIME's own logged-in account,
// the app's own data call for it answered 404:
//
//     GET https://chatgpt.com/backend-api/share/6a97b306-...  ->  404
//
// Nobody noticed, and nothing could have: `check-sources` counts sources and
// never fetches one, so a citation pointing at nothing counted exactly the same
// as a citation pointing at an RFC.
//
// TWO SEPARATE FAULTS, AND THIS GUARD IS FOR THE FIRST.
//
//   1. A chat transcript is not a source. The standing rule is that facts come
//      from vendor documentation fetched live, never from model memory, and a
//      shared conversation is a record of model output. Putting it in `sources`
//      gives it the standing of an ITU-T Recommendation in a field a reader
//      reads as "here is where to check this". THAT is what this guard stops.
//   2. A source URL may rot. That needs a liveness check, which is a different
//      and bigger mechanism. Not attempted here; recorded in canon
//      QUEUE-llm-transcript-as-source-20260927.md so the gap stays visible.
//
// WHY A HOST LIST RATHER THAN A JUDGEMENT. The failure mode is narrow and
// mechanical: a URL whose host exists to publish a conversation. That is
// checkable without reading the label, which means it cannot be argued with,
// which is the only kind of rule a build guard can carry.
//
// IT LANDS AT ZERO. The twenty-two were stripped on PRIME's instruction before
// this guard was written, so there is no baseline and no declared list. If this
// ever fails, something new has been added, and the answer is to find the
// vendor's own documentation instead.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

// Hosts (and host+path prefixes) that publish a conversation rather than a
// document. Matched case-insensitively against the URL as written.
const TRANSCRIPT_SOURCES = [
  "chatgpt.com/share",
  "chat.openai.com/share",
  "chatgpt.com/c/",
  "claude.ai/share",
  "claude.ai/chat",
  "gemini.google.com/share",
  "g.co/gemini/share",
  "bard.google.com/share",
  "perplexity.ai/search",
  "poe.com/s/",
  "copilot.microsoft.com/chats",
  "you.com/search",
  "phind.com/search",
  "grok.com/share",
  "x.com/i/grok",
  "chat.deepseek.com/share",
  "kimi.moonshot.cn/share",
  "chat.qwen.ai/s/",
];

// Where citations live. Content and the tool manifests, which carry dated
// sources of their own, PLUS two reader-facing files outside them: the sources
// on each role page and the per-tool Credits & Sources panel. Those two were
// missed until 2026-09-27 and held 140 unchecked citations between them.
// Scripts, and config other than the provenance panel, stay out: a URL there is
// build wiring or the site's own address, not a claim a reader can check. Test
// fixtures stay out for the same reason - see the note in
// audit-source-liveness.mjs on golden-vectors.
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

const offences = [];
let scanned = 0;

for (const root of ROOTS) {
  for (const file of walk(root)) {
    scanned += 1;
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      // Comments are how a stripped citation's provenance is recorded, and that
      // record is allowed to name the dead link. Only live URLs are policed.
      const code = line.replace(/^\s*(\/\/|\*|#).*$/, "");
      if (!code) return;
      const lower = code.toLowerCase();
      for (const host of TRANSCRIPT_SOURCES) {
        if (lower.includes(host)) {
          offences.push(`${file}:${i + 1}  cites ${host}`);
          break;
        }
      }
    });
  }
}

if (offences.length > 0) {
  console.error(
    `\n[check-source-hosts] FAIL: ${offences.length} citation(s) point at a chat transcript.\n`,
  );
  for (const o of offences.slice(0, 25)) console.error(`      ${o}`);
  console.error(
    "\n      A shared conversation is a record of model output, not a document.\n" +
      "      It is revocable by one person, a reader cannot check a claim against it,\n" +
      "      and on 2026-09-27 twenty-two entries were found citing one that had\n" +
      "      already returned 404. Cite the vendor's own documentation instead.\n",
  );
  process.exit(1);
}

console.log(
  `[check-source-hosts] OK: ${scanned} file(s); no citation points at a chat transcript ` +
    `(${TRANSCRIPT_SOURCES.length} hosts checked, enforced at zero since 2026-09-27).`,
);
