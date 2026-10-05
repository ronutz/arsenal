// ============================================================================
// src/lib/tools/expect-script-explainer/index.ts
// ----------------------------------------------------------------------------
// THE EXPECT SCRIPT EXPLAINER: the self-describing {manifest, run, vectors} triple.
//
// Paste an Expect script and read what it would do, command by command: what
// it spawns, what it waits for, what it types, when it hands over to the user;
// then the dialogue it conducts and the findings against rules E1 to E18 (a
// secret typed in clear, a timeout left at its default or set to never, a
// pattern that matches at once, a script that ends on a send, a send without
// the return a line-buffered program waits for, and the rest). The script is
// parsed with the site's Tcl 8.4 parser, never run.
//
// Facts come from expect(1), the manual page of Expect version 5 (Don Libes,
// NIST), read live on 2026-10-05, and from the Tcl 8.4 manual pages the parser
// follows. Local and deterministic: nothing leaves the browser.
// ============================================================================

import { run as compute, type ExpectInput, type ExpectResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types.
export type { ExpectInput, ExpectResult, ExpectFinding, ExplainedCommand, Explained, ExpectPattern, DialogueStep, Severity } from "./compute";
// The size limit and the rule list, for pages that quote them.
export { SCRIPT_MAX_CHARS, RULES } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "Text & utilities",
  // The slug.
  toolSlug: "expect-script-explainer",
  // Other names it answers to.
  canonicalAliases: ["expect-explainer", "expect-script-linter", "expect-lint", "tcl-expect-explainer"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 3, pattern: "^#!.*\\bexpect\\b|^\\s*spawn\\s+\\S|^\\s*expect\\s+(\\{|-re\\b|-gl\\b|-ex\\b|eof\\b|\"|\\{)", example: "{\"script\":\"set timeout 10\\nspawn telnet 192.0.2.1\\nexpect \\\"login:\\\"\\nsend \\\"admin\\\\r\\\"\\nexpect eof\\n\"}" },
  ],
  // Runs in the browser.
  capabilityBadge: "browser",
  // Nothing leaves the page.
  executionClass: ["localOnly"],
  // Where an API exists for it, it runs this same code.
  apiCapabilityClass: "local-equivalent",
  // The vector set.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile or oversized input is handled.
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "script-not-executed", "never-fetches"],
  // The default for share links: a script may carry a secret, so a share is reviewed first.
  shareSafetyDefault: "review",
  // The Learn articles written for it.
  learnLinks: ["learn/expect-scripts-explained"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["f5-irules-style-checker", "f5-irules-script-stepper", "regex", "cron-expression-explainer"],
  // Sources, each read live on its access date.
  sources: [
    // expect(1): the manual page of Expect version 5.
    { id: "expect-1", label: "expect(1), the Expect manual page (Don Libes, NIST; Expect version 5)", type: "reference", url: "https://www.tcl-lang.org/man/expect5.31/expect.1.html", access_date: "2026-10-05", scope: "the default timeout of 10 seconds and -1 for infinite; the implicit null action on a timeout with no timeout pattern; the pattern * and -re .* flushing the buffer; the return character \\r and line-buffered input; close not calling wait; connections closed on exit; the advice to precede the first send with an expect; the local scope of variables written inside a procedure; Tcl substitutions inside the braced form of expect; -re, -gl, -ex, -nocase, -timeout; eof, timeout, full_buffer, null and default; exp_continue; log_user; match_max 2000; stty -echo and the password-reading idiom; interact; send -s and -h", status: "active" },
    // The Expect home page: what Expect is, the last release, the maintenance notice.
    { id: "expect-home", label: "Expect at core.tcl-lang.org: description, version 5.45.4, maintenance notice", type: "reference", url: "https://core.tcl-lang.org/expect/index", access_date: "2026-10-05", scope: "Expect is a tool for automating interactive applications such as telnet, ftp, passwd, fsck, rlogin, tip, etc.; version 5.45.4 of 4 February 2018; the repository is no longer maintained and the updated version supporting Tcl 8.6 and Tcl 9 is under the tcltk-depot organisation", status: "active" },
    // Tcl(n): the syntax rules the parser follows.
    { id: "tcl84-tcl", label: "Tcl 8.4 manual: Tcl (the twelve rules of the language)", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm", access_date: "2026-10-05", scope: "words, double quotes, braces (no substitutions between braces except backslash-newline), brackets, $variables, backslash sequences including \\r as carriage return, comments", status: "active" },
    // string match: the glob pattern rules expect uses by default.
    { id: "tcl84-string-match", label: "Tcl 8.4 manual: string match (the glob pattern rules)", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm", access_date: "2026-10-05", scope: "* matches any sequence of characters including the empty one, ? any single character, [chars] a set or range, \\x the character x; the pattern language of expect's default -gl patterns", status: "active" },
    // ssh_config(5): the host-key question behind rule E10.
    { id: "ssh-config-5", label: "OpenSSH ssh_config(5): StrictHostKeyChecking", type: "reference", url: "https://man.openbsd.org/ssh_config.5", access_date: "2026-10-05", scope: "ask is the default and adds a new host key only after the user confirms; accept-new adds new keys automatically; no or off adds new keys and allows changed keys", status: "active" },
  ],
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: ExpectInput): ExpectResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
