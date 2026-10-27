// ============================================================================
// src/lib/tools/expect-script-explainer/index.ts
// ----------------------------------------------------------------------------
// THE EXPECT SCRIPT EXPLAINER: the self-describing {manifest, run, vectors} triple.
//
// Paste an Expect script and read what it would do, command by command: what
// it spawns, what it waits for, what it types, when it hands over to the user;
// then the dialogue it conducts and the findings against rules E1 to E20 (a
// secret typed in clear, a timeout left at its default or set to never, a
// pattern that matches at once, a script that ends on a send, a send without
// the return a line-buffered program waits for, a braced expect block Expect
// reads as one pattern, a pattern Expect reads as a flag, and the rest). The
// script is parsed with the site's Tcl parser (Tcl 8.4's rules plus the
// argument expansion {*} of Tcl 8.5 and later), never run.
//
// Facts come from expect(1), the manual page of Expect (Don Libes, NIST), read
// live on 2026-10-05 and again on 2026-10-27 in the 5.45.4 release's source,
// from that release's expect.c and exp_glob.c (how expect reads its arguments
// and what a glob "$" does), and from the Tcl manual pages. Local and
// deterministic: nothing leaves the browser.
//
// 2026-10-27 (the Expect suite): rules E19 and E20, E3's "$" and anchor
// variants, {*} accepted, the 5.45.4 sources, the suite's articles in
// learnLinks and the Expect script builder in relatedTools.
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
    // S4 sweep, 2026-10-27: most scripts open with "set timeout N", which the anchored pattern above never reaches (the
    // paste box compiles patterns without the m flag, so ^ is the start of the text), and that first line was claimed
    // by the CSS selector tester (1) and the iRules script stepper (2). A line that begins with spawn and a program, or
    // Expect's own exp_continue or expect_out(, is Expect and nothing else here, so priority 0 (the box lists the lowest
    // number first). Linear: a literal after a bounded white-space run, and two literal words; no nested quantifiers.
    { kind: "regex", priority: 0, pattern: "(?:^|\\n)[ \\t]*spawn[ \\t]+\\S", example: "set timeout -1\nspawn ./backup.sh\nexpect \"Done.\"\nsend \"\\r\"\nexpect eof\n" }, // vector infinite-timeout
    { kind: "regex", priority: 0, pattern: "\\bexp_continue\\b|\\bexpect_out\\(", example: "set timeout 30\nspawn scp big.iso backup@nas:/vol/\nexpect {\n    -re \"(\\\\d+)%\" { exp_continue }\n    \"assword:\" { send \"$env(NASPW)\\r\"; exp_continue }\n    eof { puts \"copied\" }\n    timeout { puts \"stalled\"; exit 1 }\n}\nexp_continue\n" }, // vector exp-continue
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
  // S4 sweep, 2026-10-27: the rest of the Expect series too, Tcl's rules (the parser this tool uses), devices, the
  // alternatives (which use this explainer), and the Scripted monitor article (a file that looks like Expect and is not).
  learnLinks: ["learn/expect-scripts-explained", "learn/expect-patterns-and-the-buffer", "learn/expect-timeouts-eof-and-loops", "learn/expect-secrets-and-safe-scripts", "learn/expect-debugging-and-logging", "learn/expect-command-reference", "learn/tcl-for-expect-writers", "learn/expect-against-network-devices", "learn/expect-and-its-alternatives", "learn/bigip-ltm-scripted-monitors"],
  // Tools that teach the neighbouring ideas (S4 sweep, 2026-10-27: the Scripted monitor explainer, for the F5 file that
  // looks like Expect, as its documentation now says).
  relatedTools: ["expect-script-builder", "bigip-scripted-monitor-explainer", "f5-irules-style-checker", "f5-irules-script-stepper", "regex", "cron-expression-explainer"],
  // Sources, each read live on its access date.
  sources: [
    // expect(1), as first read: the manual page of Expect version 5.
    { id: "expect-1", label: "expect(1), the Expect manual page (Don Libes, NIST; Expect version 5)", type: "reference", url: "https://www.tcl-lang.org/man/expect5.31/expect.1.html", access_date: "2026-10-05", scope: "the default timeout of 10 seconds and -1 for infinite; the implicit null action on a timeout with no timeout pattern; the pattern * and -re .* flushing the buffer; the return character \\r and line-buffered input; close not calling wait; connections closed on exit; the advice to precede the first send with an expect; the local scope of variables written inside a procedure; Tcl substitutions inside the braced form of expect; -re, -gl, -ex, -nocase, -timeout; eof, timeout, full_buffer, null and default; exp_continue; log_user; match_max 2000; stty -echo and the password-reading idiom; interact; send -s and -h", status: "active" },
    // expect(1) of the 5.45.4 release, from the Tcl core repository: every sentence above, and the CAVEATS on one braced argument.
    { id: "expect-1-5454", label: "expect(1), Expect 5.45.4 manual source (core.tcl-lang.org, tag expect-5-45-4)", type: "reference", url: "https://core.tcl-lang.org/expect/raw?name=expect.man&ci=expect-5-45-4", access_date: "2026-10-27", scope: "every sentence the rules quote, unchanged in this release; CAVEATS: the expect variants and interact use a heuristic to decide whether one braced argument is one argument or many, -nobrace forces one, -brace forces patterns and actions; any pattern beginning with \"-\" should be protected with -gl; ^ and $ match the beginning and end of the data in the buffer", status: "active" },
    // expect.c of 5.45.4: how the arguments are read (E19, E20).
    { id: "expect-c-5454", label: "expect.c, Expect 5.45.4 (core.tcl-lang.org, tag expect-5-45-4)", type: "reference", url: "https://core.tcl-lang.org/expect/raw?name=expect.c&ci=expect-5-45-4", access_date: "2026-10-27", scope: "exp_one_arg_braced: one braced argument is a list only when a newline comes before its first non-blank character; -brace with one braced argument forces the list; parse_expect_args: a word beginning with - is looked up among -glob, -regexp, -exact, -notransfer, -nocase, -i, -indices, -iread, -timestamp, -timeout, -nobrace and -- by exact name or unique prefix, or the command fails; -glob, -regexp, -exact and -- take the next word as the pattern; keywords match exactly; the word after a pattern is its body", status: "active" },
    // exp_glob.c of 5.45.4: the glob matcher (E3 dollar).
    { id: "exp-glob-c-5454", label: "exp_glob.c, Expect 5.45.4 (core.tcl-lang.org, tag expect-5-45-4)", type: "reference", url: "https://core.tcl-lang.org/expect/raw?name=exp_glob.c&ci=expect-5-45-4", access_date: "2026-10-27", scope: "a $ that is the pattern's last character requires the rest of the buffer to be matched, and the unanchored scan never tries the end position, so a pattern of $ alone matches only an empty buffer", status: "active" },
    // The Expect home page: what Expect is, the last release, the maintenance notice.
    { id: "expect-home", label: "Expect at core.tcl-lang.org: description, version 5.45.4, maintenance notice", type: "reference", url: "https://core.tcl-lang.org/expect/index", access_date: "2026-10-27", scope: "Expect is a tool for automating interactive applications such as telnet, ftp, passwd, fsck, rlogin, tip, etc.; version 5.45.4 of 4 February 2018; the repository is no longer maintained and the updated version supporting Tcl 8.6 and Tcl 9 is under the tcltk-depot organisation", status: "active" },
    // Tcl(n): the syntax rules the parser follows.
    { id: "tcl84-tcl", label: "Tcl 8.4 manual: Tcl (the twelve rules of the language)", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm", access_date: "2026-10-27", scope: "words, double quotes, braces (no substitutions between braces except backslash-newline), brackets, $variables, backslash sequences including \\r as carriage return, comments; no argument expansion", status: "active" },
    // Tcl(n) 9.0: rule [5], argument expansion, the same in the 8.6 manual.
    { id: "tcl90-tcl", label: "Tcl 9.0 manual: Tcl, rule [5] argument expansion (the same text in the Tcl 8.6 manual)", type: "reference", url: "https://www.tcl-lang.org/man/tcl9.0/TclCmd/Tcl.html", access_date: "2026-10-27", scope: "a word that starts with {*} followed by a non-whitespace character has the {*} removed and its value parsed as a list whose words are added to the command; \\x takes one or two hex digits and \\U up to eight (the explainer keeps Tcl 8.4's reading of these two escapes)", status: "active" },
    // string match: the glob pattern rules expect uses by default.
    { id: "tcl84-string-match", label: "Tcl 8.4 manual: string match (the glob pattern rules)", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm", access_date: "2026-10-05", scope: "* matches any sequence of characters including the empty one, ? any single character, [chars] a set or range, \\x the character x; the pattern language of expect's default -gl patterns", status: "active" },
    // ssh_config(5): the host-key question behind rule E10.
    { id: "ssh-config-5", label: "OpenSSH ssh_config(5): StrictHostKeyChecking", type: "reference", url: "https://man.openbsd.org/ssh_config.5", access_date: "2026-10-27", scope: "ask is the default and adds a new host key only after the user confirms; accept-new adds new keys automatically and refuses changed ones; no or off adds new keys and allows changed keys", status: "active" },
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
