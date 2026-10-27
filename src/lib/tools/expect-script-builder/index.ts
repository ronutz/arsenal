// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/expect-script-builder/index.ts
// ----------------------------------------------------------------------------
// THE EXPECT SCRIPT BUILDER: the self-describing {manifest, run, vectors}
// triple (D-49), built 2026-10-27 with the Expect suite.
//
// Choose ssh, telnet or another program, the host and the user, how the login
// is authenticated (an ssh key, a password from the environment, or one asked
// for at run time with echo off), a device profile (Cisco IOS, F5 BIG-IP tmsh,
// Fortinet FortiOS, Extreme Switch Engine and Fabric Engine, or a generic
// prompt), the commands, the timeouts and where the output goes, and read a
// complete Expect script that logs in, turns paging off, runs the commands
// and logs out. No password is ever written into it, nothing secret reaches a
// log, ssh checks host keys with accept-new, and every script it can write
// passes the Expect script explainer with no error and no warning (the class
// sweep in the golden vectors).
//
// Facts: expect(1) of Expect 5.45.4 (core.tcl-lang.org), ssh(1) and
// ssh_config(5) (man.openbsd.org), RFC 854 for telnet, and the device
// profiles of src/content/expect/device-profiles.ts, whose values were read in
// each vendor's documents on 2026-10-27. Local and deterministic: nothing
// leaves the browser, nothing is run.
// ============================================================================

import { build, type BuilderInput, type BuilderResult } from "./compute"; // the engine
import { GOLDEN_VECTOR_SET_ID, VECTORS, REJECTS } from "./golden-vectors"; // the vectors

// The engine's public types, for the component.
export type { BuilderInput, BuilderResult, BuilderError, BuilderNote, Section, SectionId, Transport, AuthMethod, EnableMode, PagingMode, OutputMode, ProfileChoice, Field } from "./compute";
// The defaults, the limits, the choices and the quoting helpers, for the page and the docs.
export { DEFAULT_INPUT, LIMITS, PROFILE_CHOICES, tclQuote, tclQuoteCR, build, defaultPaging } from "./compute";
// The vector set, its runner, the sweep and the Example (D-83).
export { GOLDEN_VECTOR_SET_ID, VECTORS, REJECTS, EXAMPLE, API_EXAMPLE, combinationClasses, verifyVectors, pin } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Text & utilities", // the explainer's family (the catalogue uses the same name)
  toolSlug: "expect-script-builder", // the route segment and API path
  canonicalAliases: [
    "expect-builder", // short
    "expect-script-generator", // the other usual word
    "expect-generator", // short
    "expect-login-script", // what it writes
    "gerador de scripts expect", // the pt-BR name
  ],
  // A form-driven builder: nothing pasteable to detect (a pasted Expect script goes to the explainer).
  inputDetectors: [],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // pure string building; no network, no clock, no randomness
  apiCapabilityClass: "local-equivalent", // the API runs this same engine

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount: VECTORS.length + REJECTS.length, // pinned vectors (the class sweep adds its classes when run)
  dangerousInputHandling: [
    "never-executes", // the script is written, never run
    "never-fetches", // nothing connects anywhere
    "no-secrets-in-output", // passwords come from the environment or a question at run time, never from the input
    "tcl-escapes-output", // every value the reader types is quoted for Tcl or refused
    "length-bound", // 40 commands of 300 characters, bounded fields
  ],
  shareSafetyDefault: "caution", // a script names hosts and accounts, though never a password

  // -- Teaching & provenance --
  // The reference, the safety article, the device article, the opener; then (S4 sweep, 2026-10-27) the three articles
  // that explain the script's own choices: Tcl's quoting of what the reader types, the timer exp_continue restarts in
  // run_command, and what Expect writes to a log (why the log opens only after the login).
  learnLinks: ["learn/expect-command-reference", "learn/expect-secrets-and-safe-scripts", "learn/expect-against-network-devices", "learn/expect-scripts-explained", "learn/tcl-for-expect-writers", "learn/expect-timeouts-eof-and-loops", "learn/expect-debugging-and-logging"],
  // The explainer that checks what this writes, the terminal layers underneath, and (S4 sweep, 2026-10-27) the three
  // configuration explainers that read what a script collects from the profiles' platforms, as the docs now say.
  relatedTools: ["expect-script-explainer", "terminal-stack-explainer", "f5-tmsh-config-explainer", "fortios-cli-config-explainer", "exos-config-explainer"],
  sources: [
    {
      id: "expect-1-5454", // the Expect manual of the release the site describes
      label: "expect(1), Expect 5.45.4 manual source (core.tcl-lang.org, tag expect-5-45-4)", // the page
      type: "reference", // the project's own manual
      url: "https://core.tcl-lang.org/expect/raw?name=expect.man&ci=expect-5-45-4", // fetched 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read the day the tool was built
      scope: "the default timeout of 10 seconds and the implicit null action; exp_continue resets the timer; the braced form of expect; -re, -ex, -nocase, -timeout; send and \\r; send -- before strings; expect_user and the stty -echo idiom; log_user and log_file -a; close and wait; Expect reads a procedure's variables from the global scope when the procedure has none", // what it pins
      status: "active", // 5.45.4 is the current release
    },
    {
      id: "expect-c-5454", // the source that decides how expect reads its arguments
      label: "expect.c, Expect 5.45.4 (core.tcl-lang.org, tag expect-5-45-4)", // the file
      type: "reference", // the project's own source
      url: "https://core.tcl-lang.org/expect/raw?name=expect.c&ci=expect-5-45-4", // fetched 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read the day the tool was built
      scope: "one braced argument is a list only when a newline comes before its first non-blank character (every block the builder writes starts with one); a pattern that begins with - must follow -ex, -gl, -re or --", // what it pins
      status: "active", // the current release
    },
    {
      id: "ssh-1", // the ssh client
      label: "OpenSSH ssh(1) (man.openbsd.org, dated 9 October 2026)", // the page
      type: "reference", // the project's own manual
      url: "https://man.openbsd.org/ssh.1", // fetched 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read the day the tool was built
      scope: "-i identity_file, -l login_name, -p port, -o option; ssh is intended to provide secure encrypted communications between two untrusted hosts over an insecure network", // what it pins
      status: "active", // OpenBSD-current
    },
    {
      id: "ssh-config-5", // the options the script passes
      label: "OpenSSH ssh_config(5): StrictHostKeyChecking, BatchMode, IdentitiesOnly (man.openbsd.org, dated 9 October 2026)", // the page
      type: "reference", // the project's own manual
      url: "https://man.openbsd.org/ssh_config.5", // fetched 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read the day the tool was built
      scope: "accept-new adds new host keys and refuses changed ones, no or off accepts changed ones, ask is the default; BatchMode yes disables password prompts and host key confirmation, for scripts; IdentitiesOnly uses only the configured identity files", // what it pins
      status: "active", // OpenBSD-current
    },
    {
      id: "rfc854", // telnet
      label: "RFC 854, Telnet Protocol Specification (May 1983)", // the standard
      type: "rfc", // IETF, from the RFC Editor
      url: "https://www.rfc-editor.org/rfc/rfc854", // fetched 2026-10-27, HTTP 200
      access_date: "2026-10-27", // read the day the tool was built
      scope: "the protocol defines no encryption: what is typed, the password included, crosses the network as typed", // what it pins
      status: "active", // current
    },
    {
      id: "device-profiles", // E4's data module
      label: "The Expect suite's device profiles (src/content/expect/device-profiles.ts): Cisco IOS XE 17.x, F5 TMSH Reference v17, FortiOS 7.6.8, Switch Engine 33.7.1, Fabric Engine 9.4", // the module
      type: "vendor-doc", // each value cites its vendor document
      url: "https://ronutz.com/learn/expect-against-network-devices", // the article that presents the same facts with their sources
      access_date: "2026-10-27", // the day every value was read
      scope: "prompt patterns, paging commands and their scope and restore, the more prompt where documented, enable and its password question, confirmation questions, the return key", // what it pins
      status: "active", // read the day the tool was built
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
});

/** run: the registry-facing entry point; the body is a partial BuilderInput. */
export function run(input?: Partial<BuilderInput>): BuilderResult {
  // The engine does the work.
  return build(input);
}

/** The vectors, by the conventional name (the page's Example uses the first one verbatim, D-83). */
export const goldenVectors = VECTORS;
