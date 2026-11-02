// ============================================================================
// src/lib/share/cases/expect-script-builder.ts
// ----------------------------------------------------------------------------
// Share cases of the Expect script builder: a form, every choice always
// written, a text field only when the form shows it; a credential typed into
// a text field blocks the link.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { BUILDER_SHARE, type BuilderShareArrival } from "../../tools/expect-script-builder/share"; // the spec
import { DEFAULT_INPUT, type BuilderInput } from "../../tools/expect-script-builder/compute"; // the engine's defaults
import { EXAMPLE } from "../../tools/expect-script-builder/golden-vectors"; // the page's Example (the first vector's input)

/** The page as it opens: the defaults with the Example laid over them. */
const START: BuilderInput = { ...DEFAULT_INPUT, ...EXAMPLE }; // what the page shows first

/**
 * The link values of a form, as the spec writes them (choices always, text fields when shown).
 * @param s the form
 * @returns the expected params and the restored fields
 */
function expected(s: BuilderInput): { params: Record<string, string>; restored: BuilderShareArrival } {
  const shownText = (k: keyof BuilderInput): boolean => ({ host: s.transport !== "program", port: s.transport === "ssh", program: s.transport === "program", keyFile: s.auth === "key", passwordVar: s.auth === "env", genericPrompt: s.profile === "generic", genericPagingCommand: s.profile === "generic", enableVar: s.enable === "env", logFile: s.output !== "screen" } as Record<string, boolean>)[k as string] ?? true; // the form's rules
  const names: [string, keyof BuilderInput][] = [["transport", "transport"], ["host", "host"], ["port", "port"], ["program", "program"], ["user", "user"], ["hostargv", "hostFromArgv"], ["auth", "auth"], ["keyfile", "keyFile"], ["passwordvar", "passwordVar"], ["profile", "profile"], ["prompt", "genericPrompt"], ["pagingcmd", "genericPagingCommand"], ["enable", "enable"], ["enablevar", "enableVar"], ["paging", "paging"], ["restore", "restorePaging"], ["commands", "commands"], ["logintimeout", "loginTimeout"], ["cmdtimeout", "commandTimeout"], ["output", "output"], ["logfile", "logFile"], ["logout", "logout"]]; // the link names
  const texts = new Set(["host", "port", "program", "user", "keyFile", "passwordVar", "genericPrompt", "genericPagingCommand", "enableVar", "commands", "logFile", "logout"]); // the text fields
  const params: Record<string, string> = {}; // the link values
  const restored: Record<string, unknown> = {}; // what an arrival gives back
  for (const [n, k] of names) { // each field
    if (texts.has(k as string) && !shownText(k)) continue; // hidden: not carried
    const v = s[k]; // the value
    params[n] = typeof v === "boolean" ? (v ? "1" : "0") : String(v); // as written in the link
    restored[k as string] = v; // and back
  } // for
  return { params, restored: restored as BuilderShareArrival }; // both
} // expected

/** A telnet login to a FortiGate, the password asked at run time, output to a file. */
const TELNET: BuilderInput = { ...START, transport: "telnet", host: "fw1.example.net", port: "", user: "admin", auth: "ask", profile: "fortinet-fortios", paging: "answer", commands: "get system status", output: "both", logFile: "fw1.log" }; // another shape
/** Another program, with the generic profile. */
const PROGRAM: BuilderInput = { ...START, transport: "program", program: "cu -l /dev/ttyUSB0 -s 9600", host: "", user: "", auth: "none", profile: "generic", genericPrompt: "[>#] ?$", genericPagingCommand: "terminal length 0", paging: "off", enable: "no", commands: "show version" }; // a console line

/** The cases. */
export const EXPECT_SCRIPT_BUILDER_SHARE_CASES = defineShareCases<BuilderInput, BuilderShareArrival>({
  spec: BUILDER_SHARE, // the spec
  accept: [
    { id: "opening", state: START, ...expected(START) }, // the page as it opens
    { id: "telnet-file", state: TELNET, ...expected(TELNET) }, // telnet, asked password, a transcript file
    { id: "program-generic", state: PROGRAM, ...expected(PROGRAM) }, // another program, the generic profile
  ],
  empty: [
    { id: "no-commands", state: { ...START, commands: "" } }, // the builder refuses it: no script
    { id: "no-host", state: { ...START, host: "" } }, // ssh needs a host
  ],
  blocked: [
    { id: "url-password-in-program", state: { ...PROGRAM, program: "curl -s https://ops:Gr8-pass@nms.example.net/x" }, code: "secret" }, // a password in a URL in the program line
    { id: "aws-key-in-commands", state: { ...START, commands: "show version\nexport AWS_ACCESS_KEY_ID=AKIAM2N4B6V8C1X3Z5L7" }, code: "secret" }, // an AWS access key ID in a command (invented)
  ],
  reject: [
    { id: "nothing", values: { commands: "show version" } }, // the choices are always written
    { id: "unknown-transport", values: { ...expected(START).params, transport: "rlogin" } }, // not offered
    { id: "auth-not-for-transport", values: { ...expected(START).params, auth: "none" } }, // none is another program's
    { id: "hidden-field", values: { ...expected(START).params, program: "cu -l /dev/ttyS0" } }, // the program line is not shown for ssh
    { id: "bad-flag", values: { ...expected(START).params, restore: "true" } }, // not 1 or 0
    { id: "timeout-out-of-range", values: { ...expected(START).params, logintimeout: "0" } }, // below 1
    { id: "unknown-profile", values: { ...expected(START).params, profile: "junos-evolved-9" } }, // not a profile the page has
    { id: "no-commands", values: { ...expected(START).params, commands: null } }, // a script needs commands
  ],
});
