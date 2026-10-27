// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/expect-script-builder/compute.ts
// ----------------------------------------------------------------------------
// THE EXPECT SCRIPT BUILDER: the pure engine (the Expect suite, 2026-10-27).
//
// From the reader's choices (ssh, telnet or another program; host and user;
// how to authenticate; a device profile; the commands; the timeouts; where the
// output goes) it writes a complete Expect script that logs in, turns paging
// off, runs the commands one by one and logs out, and returns it with the
// notes the reader should know, the sections of the script for the page to
// explain, and what the script needs at run time.
//
// CONFIGURATION LEFT ALONE BY DEFAULT (PRIME 2026-10-27). Unless the reader
// asks otherwise, a script does not change the device's configuration: where
// the profile's paging command is a global configuration change and the vendor
// documents the more prompt (FortiOS today), the default answers --More-- with
// a Space and exp_continue instead; turning paging off is an explicit choice,
// with the global-change warning and the documented restore.
//
// SAFE BY CONSTRUCTION. No password is ever written into the script: with a
// key, ssh runs with BatchMode=yes and never asks; a password is read from an
// environment variable (then removed from the environment, so the programs
// the script starts do not inherit it) or asked for at run time with echo
// off, the expect(1) idiom. Nothing that can hold a secret reaches a log: the
// login is hidden from the screen (log_user 0) and the transcript file is
// opened only after the login and enable steps, because Expect's log records
// what expect_user reads even with echo off and whatever a device echoes
// (runs by the suite's E2, recorded in its notes); exp_internal is never
// used, since it prints every send in full. ssh's host-key check is
// StrictHostKeyChecking=accept-new, never no.
//
// CLEAN BY CONSTRUCTION. Every script it writes passes the site's Expect
// script explainer with no error and no warning (the golden vectors run every
// combination class of output through the explainer's engine): the timeout is
// set before the first expect, every expect has timeout and eof arms, every
// braced block starts with a newline (E19), the more prompt is protected with
// -ex (E20), every regexp is written literally between braces (E9), sends end
// in \r, the script waits for eof and reaps the process.
//
// FACTS. Expect: expect(1), release 5.45.4 (core.tcl-lang.org, read
// 2026-10-27). ssh: ssh(1) and ssh_config(5), man.openbsd.org (read
// 2026-10-27; the page is dated 9 October 2026). Devices: the profiles of
// src/content/expect/device-profiles.ts (E4, every value read in the vendor's
// documents on 2026-10-27). The manifest carries the citations.
//
// Pure and deterministic: no clock, no randomness, no network; the same input
// always gives the same bytes.
// ============================================================================

import { DEVICE_PROFILES, DEVICE_PROFILES_READ_ON, getDeviceProfile, type DeviceProfile, type DeviceProfileId, type SettingScope } from "@/content/expect/device-profiles"; // E4's profiles, read only

/** How the script reaches the device. */
export type Transport = "ssh" | "telnet" | "program";

/** How the login is authenticated. */
export type AuthMethod = "key" | "env" | "ask" | "none";

/** Whether and how the script raises privilege with enable. */
export type EnableMode = "no" | "plain" | "env" | "ask";

/** What the script does about paged output. */
export type PagingMode = "off" | "answer" | "none";

/** Where the session's output goes. */
export type OutputMode = "screen" | "file" | "both";

/** A device profile, or the generic one whose prompt the reader writes. */
export type ProfileChoice = DeviceProfileId | "generic";

/** The input. Every field has a default (DEFAULT_INPUT), so the API may send only some. */
export interface BuilderInput {
  /** ssh, telnet, or another program spawned as given. */
  transport: Transport;
  /** The device's host name or address (ssh and telnet), unless taken from the command line. */
  host: string;
  /** Take the host from the script's first argument instead (ssh and telnet). */
  hostFromArgv: boolean;
  /** The ssh port, or "" for ssh's own default. */
  port: string;
  /** The user name: ssh's -l, telnet's answer to the login prompt, or a program's (optional). */
  user: string;
  /** The program and its arguments, separated by spaces (transport "program"). */
  program: string;
  /** key (ssh only), env, ask, or none (another program only). */
  auth: AuthMethod;
  /** An identity file for key authentication, or "" for ssh's defaults and the agent. */
  keyFile: string;
  /** The environment variable that holds the login password (auth "env"). */
  passwordVar: string;
  /** The device profile. */
  profile: ProfileChoice;
  /** The generic profile's prompt regexp (Tcl ARE, written between braces). */
  genericPrompt: string;
  /** The generic profile's paging command, or "" for none. */
  genericPagingCommand: string;
  /** enable: no; plain (no password asked); env or ask (the enable password). */
  enable: EnableMode;
  /** The environment variable that holds the enable password (enable "env"). */
  enableVar: string;
  /** off: send the profile's paging commands; answer: press Space at the more prompt; none: nothing (generic only). When absent, defaultPaging() decides. */
  paging: PagingMode;
  /** Put a paging setting back at the end when the profile gives the commands and the setting outlives the session. */
  restorePaging: boolean;
  /** The commands, one per line; blank lines are skipped. */
  commands: string;
  /** Seconds each login step may take. */
  loginTimeout: number;
  /** Seconds of silence each command may take. */
  commandTimeout: number;
  /** Where the output goes. */
  output: OutputMode;
  /** The transcript file (output "file" or "both"). */
  logFile: string;
  /** The command that ends the session, or "" to close the connection instead. */
  logout: string;
}

/** The defaults: a Cisco IOS login over ssh, password from the environment, paging off, two commands. */
export const DEFAULT_INPUT: Readonly<BuilderInput> = Object.freeze({
  transport: "ssh", // the common case
  host: "sw1.example.net", // a documentation-style name
  hostFromArgv: false, // fixed host
  port: "", // ssh's default
  user: "netops", // an example account
  program: "", // only for transport "program"
  auth: "env", // a password from the environment
  keyFile: "", // ssh's defaults
  passwordVar: "DEVICE_PASSWORD", // the variable's name
  profile: "cisco-ios", // the common reference
  genericPrompt: String.raw`(?:^|[\r\n])[^\r\n]*[>#$%] ?$`, // a prompt ending in > # $ or %
  genericPagingCommand: "", // none
  enable: "no", // no enable step
  enableVar: "ENABLE_PASSWORD", // the variable's name
  paging: "off", // paging off (the Cisco profile's default; see defaultPaging for the others)
  restorePaging: true, // put global settings back
  commands: "show version\nshow ip interface brief", // two read-only commands
  loginTimeout: 30, // seconds per login step
  commandTimeout: 60, // seconds of silence per command
  output: "screen", // on the screen
  logFile: "session.log", // used with file or both
  logout: "exit", // the usual logout command
});

/** The limits the input is held to, quoted by the page and the docs. */
export const LIMITS = Object.freeze({
  /** Commands per script. */
  maxCommands: 40,
  /** Characters per command. */
  maxCommandChars: 300,
  /** Seconds, for both timeouts. */
  maxTimeout: 3600,
  /** Characters in the generic prompt regexp. */
  maxPromptChars: 200,
  /** Characters in a path (key file, log file). */
  maxPathChars: 200,
  /** Characters in a host name. */
  maxHostChars: 253,
  /** Words in a program's command line. */
  maxProgramWords: 12,
});

/** The fields an error can point at. */
export type Field = "host" | "port" | "user" | "program" | "auth" | "keyFile" | "passwordVar" | "profile" | "genericPrompt" | "genericPagingCommand" | "enable" | "enableVar" | "paging" | "commands" | "loginTimeout" | "commandTimeout" | "logFile" | "logout";

/** One reason the input cannot be built; `code` picks the sentence. */
export interface BuilderError {
  /** The field. */
  field: Field;
  /** What is wrong. */
  code: "required" | "invalid" | "not-for-transport" | "unknown" | "too-broad" | "not-for-profile" | "no-password-prompt" | "too-many" | "too-long" | "control-character" | "unbalanced";
  /** Details for the sentence (a line number, a limit). */
  params?: Record<string, string | number>;
}

/** One note for the reader about the script built; `code` picks the sentence. */
export interface BuilderNote {
  /** What it is about. */
  code: "paging-global" | "paging-preference" | "paging-unstated" | "telnet-clear" | "key-batchmode" | "ask-terminal" | "env-run" | "confirmation" | "generic-prompt" | "log-file" | "quiet" | "more-answer" | "enable-unprompted" | "argv-host" | "close-instead" | "paging-unchanged";
  /** How much it matters. */
  severity: "warning" | "info";
  /** Details for the sentence. */
  params?: Record<string, string | number>;
}

/** The parts of the script, in order, for the page to explain each one. */
export type SectionId = "header" | "timeout" | "target" | "secret-env" | "secret-ask" | "enable-env" | "enable-ask" | "quiet" | "spawn" | "login" | "enable" | "command-proc" | "command-timeout" | "paging" | "output" | "commands" | "restore" | "logout";

/** One part of the script and the lines it spans (1-based, inclusive). */
export interface Section {
  /** Which part. */
  id: SectionId;
  /** First line. */
  from: number;
  /** Last line. */
  to: number;
}

/** The result. */
export interface BuilderResult {
  /** Whether a script was built. */
  ok: boolean;
  /** Why not, field by field (empty when ok). */
  errors: BuilderError[];
  /** What the reader should know (empty when not ok). */
  notes: BuilderNote[];
  /** The script ("" when not ok). */
  script: string;
  /** Its parts. */
  sections: Section[];
  /** What the script needs when it runs. */
  needs: {
    /** Environment variables it reads. */
    env: string[];
    /** Arguments it takes on the command line. */
    argv: string[];
    /** Whether it must run at a terminal (a password is asked for). */
    terminal: boolean;
  };
  /** The exit statuses the script uses, with their meaning (the page words them). */
  exitCodes: { code: number; meaning: "done" | "login" | "input" | "command" | "closed" }[];
  /** The profile used, as the page shows it, or null for the generic one. */
  profile: { id: DeviceProfileId; vendor: string; platform: string; documented: string; readOn: string; promptRegex: string; pagingOff: string[]; restore: string[] } | null;
  /** The commands the script runs, in order, as the reader gave them. */
  commands: string[];
}

/** A host name, an IPv4 address or an IPv6 address: letters, digits, dot, colon, hyphen; never a leading hyphen. */
const HOST_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
/** A user name: letters, digits and . _ @ -, never a leading hyphen. */
const USER_RE = /^[A-Za-z0-9._][A-Za-z0-9._@-]*$/;
/** A path: letters, digits and . _ / -, never a leading hyphen (no spaces, no ~, no Tcl special characters). */
const PATH_RE = /^[A-Za-z0-9._/][A-Za-z0-9._/-]*$/;
/** An environment variable name, as the shells accept them. */
const VAR_RE = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;
/** One word of a program's command line: no white space and no character Tcl would substitute or group. */
const WORD_RE = /^[A-Za-z0-9_./:=@,+%-]+$/;
/** Any control character (C0 and DEL). */
const CONTROL_RE = /[\x00-\x1f\x7f]/;

/**
 * The paging choice a profile gets when the reader makes none: answer the more prompt where turning paging off would
 * change the device's global configuration and the vendor documents the prompt (so the script changes nothing; FortiOS
 * today), turn it off otherwise; the generic profile turns it off only when it has a paging command.
 */
export function defaultPaging(profileId: string, genericPagingCommand = ""): PagingMode {
  // The generic profile: off with a command, nothing without one.
  if (profileId === "generic") return genericPagingCommand.trim() !== "" ? "off" : "none";
  // The profile, if it exists (an unknown id is reported by the validator; "off" keeps that report alone).
  const p = getDeviceProfile(profileId);
  // Unknown: whatever, the input is refused anyway.
  if (!p) return "off";
  // Whether turning paging off is a global configuration change.
  const global = p.paging.off.some((c) => c.scope === "global-configuration");
  // Answer the documented more prompt instead, so the configuration is left alone.
  return global && p.paging.morePrompt !== null ? "answer" : "off";
}

/** The input with every missing field filled from the defaults (the API may send a partial body). */
function normalise(raw: Partial<BuilderInput> | undefined): BuilderInput {
  // Start from the defaults, then lay the given fields over them.
  const merged = { ...DEFAULT_INPUT, ...(raw ?? {}) } as BuilderInput;
  // No paging choice given: the profile's default (which leaves the configuration alone).
  if (raw?.paging === undefined) merged.paging = defaultPaging(String(merged.profile), String(merged.genericPagingCommand ?? ""));
  // Strings are trimmed where a stray space would only cause an error (the commands keep their own spaces).
  return {
    ...merged, // every field as given or defaulted
    // The host, trimmed.
    host: String(merged.host ?? "").trim(),
    // The port, trimmed.
    port: String(merged.port ?? "").trim(),
    // The user, trimmed.
    user: String(merged.user ?? "").trim(),
    // The program line, trimmed.
    program: String(merged.program ?? "").trim(),
    // The key file, trimmed.
    keyFile: String(merged.keyFile ?? "").trim(),
    // The variable names, trimmed.
    passwordVar: String(merged.passwordVar ?? "").trim(),
    // The enable variable, trimmed.
    enableVar: String(merged.enableVar ?? "").trim(),
    // The generic prompt, trimmed.
    genericPrompt: String(merged.genericPrompt ?? "").trim(),
    // The generic paging command, trimmed.
    genericPagingCommand: String(merged.genericPagingCommand ?? "").trim(),
    // The commands as given (split later).
    commands: String(merged.commands ?? ""),
    // The log file, trimmed.
    logFile: String(merged.logFile ?? "").trim(),
    // The logout command, trimmed.
    logout: String(merged.logout ?? "").trim(),
    // Booleans as booleans.
    hostFromArgv: merged.hostFromArgv === true,
    // Booleans as booleans.
    restorePaging: merged.restorePaging === true,
    // Numbers as numbers.
    loginTimeout: Number(merged.loginTimeout),
    // Numbers as numbers.
    commandTimeout: Number(merged.commandTimeout),
  };
}

/** Write text as the inside of a Tcl double-quoted word that substitutes nothing: \ " $ [ ] { } each get a backslash. */
export function tclQuote(text: string): string {
  // Each character Tcl would act on inside double quotes (and the braces, so an enclosing braced word stays balanced).
  return '"' + text.replace(/[\\"$[\]{}]/g, (c) => "\\" + c) + '"';
}

/** Write text as a Tcl double-quoted word that ends in a carriage return, \r (expect(1): "A return character is denoted "\r""). */
export function tclQuoteCR(text: string): string {
  // The quoted text with the escape added before the closing quote.
  return tclQuote(text).slice(0, -1) + '\\r"';
}

/** Are the unescaped braces of a regexp balanced, so it can sit between braces in Tcl? */
function bracesBalanced(text: string): boolean {
  // Nesting depth.
  let depth = 0;
  // Character by character.
  for (let i = 0; i < text.length; i++) {
    // A backslash protects the next character from brace counting (Tcl rule [6]).
    if (text[i] === "\\") { i++; continue; }
    // Open.
    if (text[i] === "{") depth++;
    // Close; never below zero.
    else if (text[i] === "}" && --depth < 0) return false;
  }
  // Balanced, and not ending on a lone backslash (it would protect the closing brace).
  return depth === 0 && !/(^|[^\\])(\\\\)*\\$/.test(text);
}

/** The commands the reader gave, one per line, blank lines skipped. */
function splitCommands(text: string): string[] {
  // Lines without their line ends; trailing spaces dropped (a device ignores them); empty ones skipped.
  return text.replace(/\r\n?/g, "\n").split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim() !== "");
}

/** The leading words of a confirmation trigger that a command must start with, or null when the trigger is a description. */
function triggerWords(trigger: string): string[] | null {
  // The words before the first placeholder, option or parenthesis.
  const words: string[] = [];
  // Word by word.
  for (const w of trigger.split(/\s+/)) {
    // A described trigger ("list or show over ...") is not a command line.
    if (w === "or") return null;
    // Stop at a placeholder, an option or a remark.
    if (!/^[a-z][a-z0-9-]*$/.test(w)) break;
    // A command word.
    words.push(w);
  }
  // At least one command word.
  return words.length > 0 ? words : null;
}

/** Validate the input against the transport, the profile and the limits; the errors in field order. */
function validate(inp: BuilderInput, profile: DeviceProfile | null): BuilderError[] {
  // The errors found.
  const E: BuilderError[] = [];
  // ssh and telnet need a host unless it comes from the command line.
  if (inp.transport !== "program" && !inp.hostFromArgv) {
    // Missing.
    if (inp.host === "") E.push({ field: "host", code: "required" });
    // Not a host name or an address, or too long.
    else if (!HOST_RE.test(inp.host) || inp.host.length > LIMITS.maxHostChars) E.push({ field: "host", code: "invalid" });
  }
  // A port only for ssh (ssh(1) -p), a whole number from 1 to 65535.
  if (inp.port !== "") {
    // Not for telnet or a program.
    if (inp.transport !== "ssh") E.push({ field: "port", code: "not-for-transport" });
    // A number in range.
    else if (!/^\d{1,5}$/.test(inp.port) || Number(inp.port) < 1 || Number(inp.port) > 65535) E.push({ field: "port", code: "invalid" });
  }
  // telnet answers a login prompt with the user name, so it needs one.
  if (inp.transport === "telnet" && inp.user === "") E.push({ field: "user", code: "required" });
  // A user name, when given, must be a plain one.
  else if (inp.user !== "" && (!USER_RE.test(inp.user) || inp.user.length > 64)) E.push({ field: "user", code: "invalid" });
  // Another program: its command line, word by word.
  if (inp.transport === "program") {
    // The words.
    const words = inp.program === "" ? [] : inp.program.split(/\s+/);
    // Missing.
    if (words.length === 0) E.push({ field: "program", code: "required" });
    // Too many words.
    else if (words.length > LIMITS.maxProgramWords) E.push({ field: "program", code: "too-many", params: { max: LIMITS.maxProgramWords } });
    // A word Tcl would substitute, or a program name that looks like an option.
    else if (!words.every((w) => WORD_RE.test(w)) || words[0].startsWith("-")) E.push({ field: "program", code: "invalid" });
  }
  // Authentication against the transport: a key only with ssh, none only with another program.
  if ((inp.auth === "key" && inp.transport !== "ssh") || (inp.auth === "none" && inp.transport !== "program") || !["key", "env", "ask", "none"].includes(inp.auth)) E.push({ field: "auth", code: "not-for-transport" });
  // A key file, when given with a key.
  if (inp.auth === "key" && inp.keyFile !== "" && (!PATH_RE.test(inp.keyFile) || inp.keyFile.length > LIMITS.maxPathChars)) E.push({ field: "keyFile", code: "invalid" });
  // The password's variable name.
  if (inp.auth === "env" && !VAR_RE.test(inp.passwordVar)) E.push({ field: "passwordVar", code: "invalid" });
  // The profile must exist.
  if (inp.profile !== "generic" && profile === null) E.push({ field: "profile", code: "unknown" });
  // The generic profile's prompt: present, short, single-line, braces balanced, not one that matches at once.
  if (inp.profile === "generic") {
    // Missing.
    if (inp.genericPrompt === "") E.push({ field: "genericPrompt", code: "required" });
    // Too long or with a control character.
    else if (inp.genericPrompt.length > LIMITS.maxPromptChars || CONTROL_RE.test(inp.genericPrompt)) E.push({ field: "genericPrompt", code: "invalid" });
    // Braces that would break the braced word.
    else if (!bracesBalanced(inp.genericPrompt)) E.push({ field: "genericPrompt", code: "unbalanced" });
    // A pattern that matches anything at once (the explainer's E3).
    else if (["^", "$", ".*", ".+", "^.*", ".*$", "^.*$"].includes(inp.genericPrompt)) E.push({ field: "genericPrompt", code: "too-broad" });
    // The generic paging command: a plain line.
    if (inp.genericPagingCommand !== "" && (CONTROL_RE.test(inp.genericPagingCommand) || inp.genericPagingCommand.length > LIMITS.maxCommandChars)) E.push({ field: "genericPagingCommand", code: "invalid" });
  }
  // The checks below depend on the profile; an unknown id has already been reported.
  const profileKnown = inp.profile === "generic" || profile !== null;
  // enable: only where the profile raises privilege with it.
  if (profileKnown && inp.enable !== "no") {
    // Not a profile with an enable step (or the generic one).
    if (profile === null || profile.privilege.model !== "enable" || profile.privilege.command === null) E.push({ field: "enable", code: "not-for-profile" });
    // A password for enable only where the documents print its question.
    else if ((inp.enable === "env" || inp.enable === "ask") && profile.privilege.passwordPromptRegex === null) E.push({ field: "enable", code: "no-password-prompt" });
    // An unknown mode.
    else if (!["plain", "env", "ask"].includes(inp.enable)) E.push({ field: "enable", code: "invalid" });
  }
  // The enable password's variable name.
  if (inp.enable === "env" && !VAR_RE.test(inp.enableVar)) E.push({ field: "enableVar", code: "invalid" });
  // Paging: answer needs a documented more prompt; none only for the generic profile; off needs a command for the generic one.
  if (!profileKnown) { /* nothing to check against */ }
  // Answer without a documented more prompt.
  else if (inp.paging === "answer" && (profile === null || profile.paging.morePrompt === null)) E.push({ field: "paging", code: "not-for-profile" });
  // None: the device profiles always turn paging off or answer it.
  else if (inp.paging === "none" && profile !== null) E.push({ field: "paging", code: "not-for-profile" });
  // Off with the generic profile and no paging command.
  else if (inp.paging === "off" && profile === null && inp.genericPagingCommand === "") E.push({ field: "paging", code: "required" });
  // An unknown mode.
  else if (!["off", "answer", "none"].includes(inp.paging)) E.push({ field: "paging", code: "invalid" });
  // The commands.
  const cmds = splitCommands(inp.commands);
  // At least one.
  if (cmds.length === 0) E.push({ field: "commands", code: "required" });
  // Not too many.
  else if (cmds.length > LIMITS.maxCommands) E.push({ field: "commands", code: "too-many", params: { max: LIMITS.maxCommands } });
  // Each one plain and not too long.
  else {
    // The first offending line, 1-based among the commands.
    const bad = cmds.findIndex((c) => CONTROL_RE.test(c));
    // A control character.
    if (bad >= 0) E.push({ field: "commands", code: "control-character", params: { n: bad + 1 } });
    // Too long.
    const long = cmds.findIndex((c) => c.length > LIMITS.maxCommandChars);
    // Report it.
    if (bad < 0 && long >= 0) E.push({ field: "commands", code: "too-long", params: { n: long + 1, max: LIMITS.maxCommandChars } });
  }
  // The timeouts: whole seconds from 1 to the limit (never -1: the explainer's E2).
  for (const f of ["loginTimeout", "commandTimeout"] as const) if (!Number.isInteger(inp[f]) || inp[f] < 1 || inp[f] > LIMITS.maxTimeout) E.push({ field: f, code: "invalid", params: { max: LIMITS.maxTimeout } });
  // The log file, when the output goes to one.
  if (inp.output === "file" || inp.output === "both") {
    // Missing.
    if (inp.logFile === "") E.push({ field: "logFile", code: "required" });
    // Not a plain path.
    else if (!PATH_RE.test(inp.logFile) || inp.logFile.length > LIMITS.maxPathChars) E.push({ field: "logFile", code: "invalid" });
  }
  // The logout command: a plain line.
  if (inp.logout !== "" && (CONTROL_RE.test(inp.logout) || inp.logout.length > 64)) E.push({ field: "logout", code: "invalid" });
  // Done.
  return E;
}

/** The script under construction: lines, and the sections they belong to. */
class Writer {
  /** The lines so far. */
  readonly lines: string[] = [];
  /** The sections so far. */
  readonly sections: Section[] = [];
  /** Open a section at the next line. */
  section(id: SectionId): void {
    // A section starts where the next line will be; it ends where the next section starts.
    this.sections.push({ id, from: this.lines.length + 1, to: this.lines.length + 1 });
  }
  /** Add lines to the current section. */
  add(...ls: string[]): void {
    // Each line in order.
    for (const l of ls) this.lines.push(l);
    // The current section now ends on the last line.
    const s = this.sections[this.sections.length - 1];
    // Extend it.
    if (s) s.to = this.lines.length;
  }
  /** A blank line between sections (not counted in either). */
  gap(): void {
    // Just the line.
    this.lines.push("");
  }
}

/** The text a blocked login reports for each transport, for the eof arm of the login. */
function closedBeforePrompt(inp: BuilderInput): string {
  // ssh with a key: refused key, changed host key or unreachable host.
  if (inp.transport === "ssh" && inp.auth === "key") return "The connection to $host closed before the prompt: the key was refused, the host key has changed, or the host cannot be reached.";
  // ssh with a password.
  if (inp.transport === "ssh") return "The connection to $host closed before the prompt: the login was refused, the host key has changed, or the host cannot be reached.";
  // telnet.
  if (inp.transport === "telnet") return "The connection to $host closed before the prompt.";
  // Another program.
  return "The program ended before the prompt.";
}

/** Build the script. Never throws: invalid input comes back as errors. */
export function build(raw?: Partial<BuilderInput>): BuilderResult {
  // The input with its defaults.
  const inp = normalise(raw);
  // The device profile, or null for the generic one (or an unknown id, reported below).
  const profile = inp.profile === "generic" ? null : getDeviceProfile(inp.profile) ?? null;
  // The errors.
  const errors = validate(inp, profile);
  // An empty result for invalid input.
  const empty: BuilderResult = { ok: false, errors, notes: [], script: "", sections: [], needs: { env: [], argv: [], terminal: false }, exitCodes: [], profile: null, commands: [] };
  // Nothing is built from invalid input.
  if (errors.length > 0) return empty;
  // The commands.
  const commands = splitCommands(inp.commands);
  // The prompt pattern every command waits for.
  const promptRegex = profile ? profile.prompts.any : inp.genericPrompt;
  // The paging commands sent after login.
  const pagingOff = inp.paging !== "off" ? [] : profile ? profile.paging.off.map((c) => c.command) : [inp.genericPagingCommand];
  // The paging setting's scope (the last command's, which is the one that changes it; the profile's commands share it).
  const pagingScope: SettingScope | null = inp.paging === "off" && profile ? profile.paging.off[profile.paging.off.length - 1].scope : null;
  // The restore commands, in order, when the reader asked for them and the setting outlives the session.
  const restoreAvailable = inp.paging === "off" && profile !== null && pagingScope !== "session" && profile.paging.off.some((c) => c.restore !== null);
  // Each command's restore, flattened (FortiOS gives the whole sequence on its second command).
  const restore = restoreAvailable && inp.restorePaging ? profile!.paging.off.flatMap((c) => c.restore ?? []) : [];
  // The notes.
  const notes: BuilderNote[] = [];
  // The environment variables and arguments the script needs.
  const env: string[] = [];
  // Arguments.
  const argv: string[] = inp.hostFromArgv && inp.transport !== "program" ? ["HOST"] : [];
  // The script.
  const w = new Writer();
  // The one-line description of what the script does.
  const via = "over " + inp.transport;
  // The device, as the header names it.
  const device = profile ? (profile.platform.startsWith(profile.vendor) ? profile.platform : `${profile.vendor} ${profile.platform}`) : "a device (generic profile: the prompt pattern given)";

  // ---- header ----
  w.section("header");
  // The interpreter line.
  w.add("#!/usr/bin/expect -f");
  // Provenance.
  w.add("# Written by the Expect script builder (ronutz.com/tools/expect-script-builder).");
  // How many commands, and how it ends.
  const tail = `runs ${commands.length === 1 ? "1 command" : commands.length + " commands"} and ${inp.logout === "" ? "closes the connection" : "logs out"}`;
  // What it does: a program is started; a device is logged in to.
  w.add(inp.transport === "program" ? `# Starts ${inp.program.split(/\s+/)[0]}${profile ? ` (the ${device} command line)` : ""}, waits for its prompt, ${tail}.` : `# Logs in to ${device} ${via}, ${tail}.`);
  // The profile's provenance.
  if (profile) w.add(`# Device profile: ${profile.id}, from the vendor's documents read on ${DEVICE_PROFILES_READ_ON}.`);
  // How to run it.
  w.add(`# Run it with: expect <this file>${argv.length ? " " + argv.join(" ") : ""}`);
  // Where the secrets come from, in one line: the environment, a question at run time, or a key.
  const envVars = [inp.auth === "env" ? inp.passwordVar : "", inp.enable === "env" ? inp.enableVar : ""].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
  // What is asked for at run time.
  const asked = [inp.auth === "ask" ? "the password" : "", inp.enable === "ask" ? "the enable password" : ""].filter(Boolean);
  // The clauses.
  const secretClauses = [envVars.length ? `reads ${envVars.join(" and ")} from the environment` : "", asked.length ? `asks for ${asked.join(" and ")} when it runs, with echo off` : "", inp.auth === "key" ? "logs in with an ssh key" : ""].filter(Boolean);
  // The line, when there is anything to say.
  if (secretClauses.length) w.add(`# It ${secretClauses.join(" and ")}; nothing secret is written in this file.`);
  // The exit statuses.
  w.add("# Exit status: 0 done; 1 the login failed; 2 missing or wrong input; 3 a command did not finish; 4 the session closed early.");
  // Blank.
  w.gap();

  // ---- timeout ----
  w.section("timeout");
  // Set before the first expect (the explainer's E2 and E13).
  w.add(`# Wait up to ${inp.loginTimeout} seconds for each step of the login.`, `set timeout ${inp.loginTimeout}`);
  // Blank.
  w.gap();

  // ---- target ----
  if (inp.transport !== "program") {
    // The host and the user.
    w.section("target");
    // From the command line, checked so it cannot be read as an option.
    if (inp.hostFromArgv) {
      // The usage check.
      w.add("# The device comes from the command line.", "if {$argc != 1} {", '    send_user "Usage: expect [file tail $argv0] HOST\\n"', "    exit 2", "}", "set host [lindex $argv 0]");
      // The shape check.
      w.add("# Accept only a host name or an address, so the value can never be read as an option.", "if {![regexp {^[A-Za-z0-9][A-Za-z0-9._:-]*$} $host]} {", '    send_user "Not a host name or an address: $host\\n"', "    exit 2", "}");
      // Note it.
      notes.push({ code: "argv-host", severity: "info" });
    } else {
      // A fixed host.
      w.add("# The device.", `set host ${tclQuote(inp.host)}`);
    }
    // The user, when given.
    if (inp.user !== "") w.add("# The account.", `set user ${tclQuote(inp.user)}`);
    // Blank.
    w.gap();
  } else if (inp.user !== "") {
    // Another program that asks for a user name.
    w.section("target");
    // The user.
    w.add("# The account the program asks for.", `set user ${tclQuote(inp.user)}`);
    // Blank.
    w.gap();
  }

  // ---- secrets ----
  // Read one secret from the environment, then take it out of the environment.
  const fromEnv = (section: SectionId, varName: string, tclVar: string, what: string) => {
    // The section.
    w.section(section);
    // Present and not empty, or stop with status 2.
    w.add(`# The ${what} comes from the environment variable ${varName}, never from this file.`, `if {![info exists env(${varName})] || $env(${varName}) eq ""} {`, `    send_user "Set ${varName} in the environment first.\\n"`, "    exit 2", "}", `set ${tclVar} $env(${varName})`);
    // Removed, so the spawned program does not inherit it.
    w.add("# Take it out of the environment, so the programs this script starts do not inherit it.", `unset env(${varName})`);
    // Blank.
    w.gap();
    // Remember the variable.
    if (!env.includes(varName)) env.push(varName);
  };
  // Ask for one secret at run time, echo off (the expect(1) idiom), with its own time to type it.
  const ask = (section: SectionId, prompt: string, tclVar: string, what: string) => {
    // The section.
    w.section(section);
    // The idiom, with timeout and eof arms that put echo back.
    w.add(`# Ask for the ${what} now, with echo off, so it is neither shown nor kept in this file.`, "stty -echo", `send_user "${prompt}: "`, "expect_user {", "    -timeout 120", `    -re "(.*)\\n" { set ${tclVar} $expect_out(1,string) }`, "    timeout {", "        stty echo", '        send_user "\\nNo password typed within 120 seconds.\\n"', "        exit 2", "    }", "    eof {", "        stty echo", '        send_user "\\nNo password typed.\\n"', "        exit 2", "    }", "}", "stty echo", 'send_user "\\n"');
    // Blank.
    w.gap();
  };
  // The login password.
  if (inp.auth === "env") fromEnv("secret-env", inp.passwordVar, "password", "password");
  // Asked for.
  if (inp.auth === "ask") ask("secret-ask", inp.transport === "program" ? "Password" : inp.user !== "" ? "Password for $user@$host" : "Password for $host", "password", "password");
  // The enable password.
  if (inp.enable === "env") fromEnv("enable-env", inp.enableVar, "enable_password", "enable password");
  // Asked for.
  if (inp.enable === "ask") ask("enable-ask", inp.transport === "program" ? "Enable password" : "Enable password for $host", "enable_password", "enable password");

  // ---- quiet login ----
  w.section("quiet");
  // Hide the login, so nothing a device echoes there reaches the screen.
  w.add("# Keep the login off the screen, so nothing a device echoes there can be seen.", "log_user 0");
  // Blank.
  w.gap();

  // ---- spawn ----
  w.section("spawn");
  // The command line.
  if (inp.transport === "ssh") {
    // The options: host keys, then batch mode and the key, then the port and the user.
    const opts: string[] = ["-o StrictHostKeyChecking=accept-new"];
    // A key: no prompts at all.
    if (inp.auth === "key") opts.push("-o BatchMode=yes");
    // A key file, and only that key.
    if (inp.auth === "key" && inp.keyFile !== "") opts.push(`-i ${inp.keyFile}`, "-o IdentitiesOnly=yes");
    // The port.
    if (inp.port !== "") opts.push(`-p ${inp.port}`);
    // The user.
    if (inp.user !== "") opts.push("-l $user");
    // Comments, then the spawn.
    w.add("# Connect. accept-new records the key of a host met for the first time and refuses a host whose key has changed.");
    // BatchMode explained.
    if (inp.auth === "key") w.add("# BatchMode=yes: ssh never stops to ask for a password or a passphrase; the key must work on its own.");
    // The command.
    w.add(`spawn ssh ${opts.join(" ")} $host`);
    // Notes.
    if (inp.auth === "key") notes.push({ code: "key-batchmode", severity: "info" });
  } else if (inp.transport === "telnet") {
    // telnet to the host.
    w.add("# Connect.", "spawn telnet $host");
    // Telnet carries the password as typed.
    notes.push({ code: "telnet-clear", severity: "warning" });
  } else {
    // Another program, word by word.
    w.add("# Start the program.", "spawn " + inp.program.split(/\s+/).join(" "));
  }
  // Blank.
  w.gap();

  // Who the script's messages name: the host, or the program.
  const peer = inp.transport === "program" ? "the program" : "$host";
  // The same at the start of a sentence.
  const Peer = inp.transport === "program" ? "The program" : "$host";

  // ---- login ----
  w.section("login");
  // Which questions the login answers.
  const answersUser = inp.transport === "telnet" || (inp.transport === "program" && inp.user !== "");
  // A password question.
  const answersPassword = inp.auth === "env" || inp.auth === "ask";
  // What the comment says.
  w.add(`# Log in: ${[answersUser ? "answer the user name question once" : "", answersPassword ? "answer the password question once" : ""].filter(Boolean).join(", ") || "wait"}${answersUser || answersPassword ? ", then wait" : ""} for the prompt.`);
  // The counters.
  if (answersUser) w.add("set user_tries 0");
  // For the password.
  if (answersPassword) w.add("set login_tries 0");
  // The block, newline first (the explainer's E19).
  w.add("expect {");
  // The user name question.
  if (answersUser) w.add("    -nocase -re {(?:^|[\\r\\n])(?:username|login): ?$} {", "        if {$user_tries > 0} {", '            send_user "The user name was refused.\\n"', "            exit 1", "        }", "        incr user_tries", '        send -- "$user\\r"', "        exp_continue", "    }");
  // The password question.
  if (answersPassword) w.add("    -nocase -re {password: ?$} {", "        if {$login_tries > 0} {", '            send_user "The password was refused.\\n"', "            exit 1", "        }", "        incr login_tries", '        send -- "$password\\r"', "        exp_continue", "    }");
  // The prompt ends the login.
  w.add(`    -re {${promptRegex}} { }`);
  // No prompt in time.
  w.add("    timeout {", `        send_user "No prompt from ${peer} within $timeout seconds.\\n"`, "        exit 1", "    }");
  // The connection closed.
  w.add("    eof {", `        send_user "${closedBeforePrompt(inp)}\\n"`, "        exit 1", "    }", "}");
  // Blank.
  w.gap();

  // ---- enable ----
  if (inp.enable !== "no" && profile) {
    // The section.
    w.section("enable");
    // The privileged prompt.
    const priv = profile.prompts.privileged.regex;
    // The command.
    w.add(`# Raise privilege with ${profile.privilege.command}${inp.enable === "plain" ? "" : ", answering its password question once"}, then wait for the privileged prompt.`, `send -- ${tclQuoteCR(profile.privilege.command!)}`);
    // The counter.
    if (inp.enable !== "plain") w.add("set enable_tries 0");
    // The block.
    w.add("expect {");
    // The password question, when the profile documents it.
    if (inp.enable !== "plain") w.add(`    -re {${profile.privilege.passwordPromptRegex}} {`, "        if {$enable_tries > 0} {", '            send_user "The enable password was refused.\\n"', "            exit 1", "        }", "        incr enable_tries", '        send -- "$enable_password\\r"', "        exp_continue", "    }");
    // The privileged prompt.
    w.add(`    -re {${priv}} { }`, "    timeout {", `        send_user "No privileged prompt from ${peer} after enable.\\n"`, "        exit 1", "    }", "    eof {", `        send_user "${Peer} closed the session during enable.\\n"`, "        exit 4", "    }", "}");
    // Blank.
    w.gap();
    // Fabric Engine: enable may ask questions the documents do not print.
    if (inp.enable === "plain" && profile.privilege.passwordPromptRegex === null) notes.push({ code: "enable-unprompted", severity: "info", params: { platform: profile.platform } });
  }

  // ---- the command procedure ----
  w.section("command-proc");
  // What it does.
  w.add("# Send one command line, then wait for the prompt that follows its output.", "# Each line of output restarts the timer, so the timeout counts silence, not the whole command.");
  // The procedure; Expect reads spawn_id and timeout from the global scope when a procedure has none (expect(1), CAVEATS).
  w.add("proc run_command {command} {", inp.transport === "program" ? "    global timeout" : "    global host timeout", '    send -- "$command\\r"', "    expect {");
  // The more prompt, answered with Space, when paging is answered.
  if (inp.paging === "answer" && profile && profile.paging.morePrompt) w.add(`        -ex ${tclQuote(profile.paging.morePrompt.text)} {`, `            send -- ${tclQuote(profile.paging.morePrompt.nextPage)}`, "            exp_continue", "        }");
  // The prompt, then any complete line, then the two events.
  w.add(`        -re {${promptRegex}} { }`, "        -re {[\\r\\n]} { exp_continue }", "        timeout {", `            send_user "\\n\\"$command\\" did not finish: nothing more came from ${peer} for $timeout seconds.\\n"`, "            exit 3", "        }", "        eof {", `            send_user "\\n${Peer} closed the session during \\"$command\\".\\n"`, "            exit 4", "        }", "    }", "}");
  // Blank.
  w.gap();

  // ---- command timeout ----
  w.section("command-timeout");
  // Set at the top level, after login (it is not the first set, so the explainer's E13 does not apply).
  w.add(`# From here on, each command may stay silent for up to ${inp.commandTimeout} seconds.`, `set timeout ${inp.commandTimeout}`);
  // Blank.
  w.gap();

  // ---- paging ----
  if (pagingOff.length > 0) {
    // The section.
    w.section("paging");
    // What it does, with the scope when the profile states it.
    w.add(`# Turn paging off${pagingScope === "session" ? " for this session" : pagingScope === "global-configuration" ? ": a global configuration change, seen by every administrator" : pagingScope === "preference" ? ": a cli preference of this user (the reference does not say how long it lasts)" : pagingScope === "unstated" ? " (the reference does not state for how long)" : ""}.`);
    // Each command.
    for (const c of pagingOff) w.add(`run_command ${tclQuote(c)}`);
    // Blank.
    w.gap();
    // Notes by scope.
    if (pagingScope === "global-configuration") notes.push({ code: "paging-global", severity: "warning", params: { restore: restore.length > 0 ? "yes" : "no", commands: profile!.paging.off.flatMap((c) => c.restore ?? []).join("; ") } });
    // A preference with no documented restore.
    else if (pagingScope === "preference") notes.push({ code: "paging-preference", severity: "info" });
    // A scope the documents do not state.
    else if (pagingScope === "unstated") notes.push({ code: "paging-unstated", severity: "info", params: { restore: restore.length > 0 ? "yes" : "no" } });
  }
  // Paging answered instead: the explainer notes the bare Space.
  if (inp.paging === "answer") notes.push({ code: "more-answer", severity: "info" });
  // Answering where turning paging off would be a global change: say that nothing on the device changes.
  if (inp.paging === "answer" && profile && profile.paging.off.some((c) => c.scope === "global-configuration")) notes.push({ code: "paging-unchanged", severity: "info", params: { commands: profile.paging.off.map((c) => c.command).join("; ") } });

  // ---- output ----
  w.section("output");
  // On the screen.
  if (inp.output !== "file") w.add("# Show the session from here on.", "log_user 1");
  // In a file, opened only now: the login and its password stay out of it. -a records what log_user hides.
  if (inp.output !== "screen") w.add(`# Record the session from here on in ${inp.logFile} (appended): the login stays out of it.`, `log_file -a ${tclQuote(inp.logFile)}`);
  // Blank.
  w.gap();
  // Notes.
  if (inp.output !== "screen") notes.push({ code: "log-file", severity: "info", params: { file: inp.logFile } });
  // A quiet script.
  if (inp.output === "file") notes.push({ code: "quiet", severity: "info" });

  // ---- commands ----
  w.section("commands");
  // The comment.
  w.add("# The commands.");
  // Each one.
  for (const c of commands) w.add(`run_command ${tclQuote(c)}`);
  // Blank.
  w.gap();

  // ---- restore ----
  if (restore.length > 0) {
    // The section.
    w.section("restore");
    // What it does.
    w.add("# Put the paging setting back as the vendor documents it.");
    // Each command.
    for (const c of restore) w.add(`run_command ${tclQuote(c)}`);
    // Blank.
    w.gap();
  }

  // ---- logout ----
  w.section("logout");
  // A logout command, then eof.
  if (inp.logout !== "") w.add("# Log out, and wait for the device to close the connection.", `send -- ${tclQuoteCR(inp.logout)}`, "expect {", "    eof { }", "    timeout {", `        send_user "${Peer} did not close the session; closing it.\\n"`, "        close", "    }", "}");
  // Or close the connection.
  else w.add("# Close the connection (no logout command was given).", "close");
  // Reap the process, and end.
  w.add("wait", "exit 0");
  // Note the close.
  if (inp.logout === "") notes.push({ code: "close-instead", severity: "info" });

  // ---- notes about the run ----
  // Environment variables.
  if (env.length > 0) notes.push({ code: "env-run", severity: "info", params: { vars: env.join(", ") } });
  // A terminal for the asked password.
  if (inp.auth === "ask" || inp.enable === "ask") notes.push({ code: "ask-terminal", severity: "info" });
  // The generic profile.
  if (profile === null) notes.push({ code: "generic-prompt", severity: "info" });
  // Commands that ask a question the script does not answer.
  if (profile) {
    // Each documented confirmation with a command-like trigger.
    for (const c of profile.confirmations) {
      // Its leading words.
      const tw = triggerWords(c.trigger);
      // A description, not a command.
      if (!tw) continue;
      // The first command that starts with those words.
      const hit = commands.find((cmd) => { const words = cmd.trim().toLowerCase().split(/\s+/); return tw.every((x, i) => words[i] === x); });
      // Note it.
      if (hit) notes.push({ code: "confirmation", severity: "warning", params: { command: hit, prompt: c.promptText, answer: c.answer === "\r" ? "Enter" : c.answer } });
    }
  }

  // The exit statuses the script uses.
  const exitCodes: BuilderResult["exitCodes"] = [{ code: 0, meaning: "done" }, { code: 1, meaning: "login" }, { code: 2, meaning: "input" }, { code: 3, meaning: "command" }, { code: 4, meaning: "closed" }];
  // The result.
  return {
    ok: true, // built
    errors: [], // nothing wrong
    notes, // what the reader should know
    script: w.lines.join("\n") + "\n", // the script, ending in a newline
    sections: w.sections, // its parts
    needs: { env, argv, terminal: inp.auth === "ask" || inp.enable === "ask" }, // what running it needs
    exitCodes, // its statuses
    // The profile as the page shows it: names, documents, read date, prompt, paging and restore commands.
    profile: profile ? { id: profile.id, vendor: profile.vendor, platform: profile.platform, documented: profile.release.documented, readOn: DEVICE_PROFILES_READ_ON, promptRegex: profile.prompts.any, pagingOff: profile.paging.off.map((c) => c.command), restore: profile.paging.off.flatMap((c) => c.restore ?? []) } : null,
    commands, // the commands, as given
  };
}

/** The profiles offered, in the order of E4's module, plus the generic one. */
export const PROFILE_CHOICES: readonly ProfileChoice[] = Object.freeze([...DEVICE_PROFILES.map((p) => p.id), "generic" as const]);

/** run: the registry-facing entry point (the body is a partial BuilderInput). */
export function run(input?: Partial<BuilderInput>): BuilderResult {
  // The builder does the work.
  return build(input);
}
