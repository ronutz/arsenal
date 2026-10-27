// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/content/expect/device-profiles.ts
// ----------------------------------------------------------------------------
// THE DEVICE PROFILES OF THE EXPECT SUITE (27/10/2026): what an Expect script
// meets on the five command lines the site teaches, as data.
//
// For each platform the profile gives the prompt patterns (user and privileged
// modes), the session commands a script sends after login (the one that turns
// paging off first), the more prompt where the vendor documents one, how
// privilege is reached, the confirmation prompts a script can meet and how each
// is answered, the line ending, the console line rate where documented, and the
// dated vendor source behind every value. The Learn article
// expect-against-network-devices explains the same facts in prose; the
// expect-script-builder tool imports this module to offer a "device profile".
//
// SOURCES. Every value was read on 2026-10-27 in the vendor's own documentation
// (each profile lists its sources with URL, release and what each supports).
// Where a vendor document is silent, the field says so (null, or the scope
// "unstated") instead of filling the gap from memory: for example the text of
// the more prompt on Switch Engine, Fabric Engine and tmsh is not in the pages
// read, so those profiles turn paging off and give no more-prompt pattern.
//
// PATTERNS. Every regex is written for Expect's -re (Tcl advanced regular
// expressions) and is meant to be placed between braces, -re {...}, so Tcl
// substitutes nothing inside it. Each uses only the subset that Tcl AREs and
// ECMAScript read the same way: (?:...) groups, bracket classes with \r and \n,
// ^ and $ with no multi-line flag. In Expect, ^ and $ match the beginning and
// the end of the data in the matching buffer, not of a line (expect(1)), so a
// prompt pattern ends in "$" to match only what is at the very end of what has
// arrived, and starts with (?:^|[\r\n]) because the previous match may already
// have consumed the line break before the prompt. Each was run with the real
// expect 5.45.4 against a fake device printing the documented prompt examples
// (scratchpad runs/14-profile-prompts) and checked in JavaScript as well.
//
// FROZEN. The exported data is deeply frozen at load: a consumer reads it and
// never changes it.
// ============================================================================

/** The day every value in this module was read in the vendor documentation (São Paulo date). */
export const DEVICE_PROFILES_READ_ON = "2026-10-27";

/** The five platforms, by stable id. */
export type DeviceProfileId = "cisco-ios" | "f5-bigip-tmsh" | "fortinet-fortios" | "extreme-switch-engine" | "extreme-fabric-engine";

/** How long a session command's effect lasts, as the vendor document states it ("unstated" when it does not). */
export type SettingScope = "session" | "preference" | "global-configuration" | "unstated";

/** How an operator reaches full command access on the platform. */
export type PrivilegeModel = "enable" | "account-level" | "admin-profile" | "role-and-shell";

/** One dated source: the document a value was read in. */
export interface ProfileSource {
  /** Stable id, referenced by sourceIds elsewhere in the profile. */
  readonly id: string;
  /** What the document is, in the vendor's own title words. */
  readonly label: string;
  /** Where it was read. */
  readonly url: string;
  /** When it was read (ISO date). */
  readonly accessDate: string;
  /** The release the document describes, as the document or its location states it. */
  readonly release: string;
  /** Which values in the profile it supports. */
  readonly supports: string;
}

/** One prompt pattern for one mode. */
export interface PromptPattern {
  /** The Expect -re pattern (Tcl ARE, place it between braces). */
  readonly regex: string;
  /** Prompt examples as the vendor documents print them (the pattern matches each at the end of a buffer). */
  readonly examples: readonly string[];
  /** What the pattern assumes, in one or two sentences. */
  readonly note: string;
  /** The sources behind the examples. */
  readonly sourceIds: readonly string[];
}

/** One command a script sends after login to make the session scriptable. */
export interface SessionCommand {
  /** The command as typed (send it followed by the line ending, then wait for the prompt). */
  readonly command: string;
  /** What it does. */
  readonly purpose: string;
  /** How long its effect lasts, per the vendor document. */
  readonly scope: SettingScope;
  /** The commands that undo it, when the document gives them (null when it does not). */
  readonly restore: readonly string[] | null;
  /** The sources. */
  readonly sourceIds: readonly string[];
}

/** The prompt a device prints when it pauses paged output. */
export interface MorePrompt {
  /** The text as the vendor documents it. */
  readonly text: string;
  /** An Expect pattern for it (use with -ex when the regex is not needed). */
  readonly regex: string;
  /** The key that shows the next page, as a character. */
  readonly nextPage: string;
  /** The same key as written inside a Tcl double-quoted send. */
  readonly nextPageTcl: string;
  /** The sources. */
  readonly sourceIds: readonly string[];
}

/** One confirmation prompt a script can meet, and its documented answer. */
export interface Confirmation {
  /** The command that asks it. */
  readonly trigger: string;
  /** The prompt as the vendor documents it. */
  readonly promptText: string;
  /** An Expect -re pattern that matches it. */
  readonly regex: string;
  /** The answer the document gives, as characters. */
  readonly answer: string;
  /** The same answer as written inside a Tcl double-quoted send. */
  readonly answerTcl: string;
  /** How the document words the answer, and anything a script should know. */
  readonly note: string;
  /** A documented way to avoid the question altogether, or null. */
  readonly avoid: string | null;
  /** The sources. */
  readonly sourceIds: readonly string[];
}

/** Everything a script needs to know about one platform's command line. */
export interface DeviceProfile {
  /** The id. */
  readonly id: DeviceProfileId;
  /** The vendor. */
  readonly vendor: string;
  /** The platform and its command line, as the vendor names them. */
  readonly platform: string;
  /** The release whose documents were read and why it is a supported one. */
  readonly release: {
    /** The release named. */
    readonly documented: string;
    /** Why it counts as supported today, from the vendor's own support or release page. */
    readonly whySupported: string;
    /** The sources. */
    readonly sourceIds: readonly string[];
  };
  /** The prompt patterns. */
  readonly prompts: {
    /** The unprivileged mode's prompt, or null when the platform has no such mode. */
    readonly user: PromptPattern | null;
    /** The privileged (or only) mode's prompt, configuration modes included. */
    readonly privileged: PromptPattern;
    /** One pattern for any prompt of the platform (what a script waits for after a command). */
    readonly any: string;
    /** Other prompt shapes the vendor documents (optional formats). */
    readonly alternatives: readonly PromptPattern[];
  };
  /** How full command access is reached. */
  readonly privilege: {
    /** The model. */
    readonly model: PrivilegeModel;
    /** The command that raises privilege, or null when there is none. */
    readonly command: string | null;
    /** A pattern for the password question that command asks, or null. */
    readonly passwordPromptRegex: string | null;
    /** What the documents say about it. */
    readonly note: string;
    /** The sources. */
    readonly sourceIds: readonly string[];
  };
  /** Paging: how to turn it off and what it looks like when it is on. */
  readonly paging: {
    /** The commands that turn paging off, in order (send each, then wait for any prompt). */
    readonly off: readonly SessionCommand[];
    /** The more prompt, when the documents read give its text; null otherwise. */
    readonly morePrompt: MorePrompt | null;
    /** What a script should know. */
    readonly note: string;
  };
  /** Other session commands that make the session easier to script (after paging). */
  readonly otherSessionCommands: readonly SessionCommand[];
  /** The line ending a send uses. */
  readonly lineEnding: {
    /** The character: a carriage return. */
    readonly char: "\r";
    /** As written inside a Tcl double-quoted send. */
    readonly tcl: "\\r";
    /** Why, from the vendor's wording and the Expect manual. */
    readonly basis: string;
    /** The sources. */
    readonly sourceIds: readonly string[];
  };
  /** Confirmation prompts. */
  readonly confirmations: readonly Confirmation[];
  /** The serial console's documented line settings. */
  readonly console: {
    /** Bits per second, or null when the documents read do not give it. */
    readonly bitsPerSecond: number | null;
    /** The framing as documented, or null. */
    readonly framing: string | null;
    /** The sources. */
    readonly sourceIds: readonly string[];
  };
  /** Further facts a script writer should know. */
  readonly notes: readonly string[];
  /** Every source the profile cites (the two common ones included). */
  readonly sources: readonly ProfileSource[];
}

/** Freeze an object and everything reachable from it, so the exported data cannot be changed. */
function deepFreeze<T>(value: T): T {
  // Objects and arrays are frozen member by member; other values are already immutable.
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    // Freeze this level first, so a cycle (there is none here) would stop.
    Object.freeze(value);
    // Then every property value.
    for (const key of Object.keys(value as object)) deepFreeze((value as Record<string, unknown>)[key]);
  }
  // The same value, now frozen.
  return value;
}

/** The two sources every profile shares: the Expect manual (the return character) and POSIX (the pty's CR handling). */
export const COMMON_SOURCES: readonly ProfileSource[] = deepFreeze([
  // expect(1) from the Tcl core repository's Expect trunk (version 5.45.4).
  {
    id: "expect-1",
    label: "expect(1), the Expect manual page (Expect 5.45.4, core.tcl-lang.org trunk)",
    url: "https://core.tcl-lang.org/expect/raw?name=expect.man&ci=trunk",
    accessDate: "2026-10-27",
    release: "Expect 5.45.4",
    supports: "a return character is denoted \\r and line-buffered programs read on it; ^ and $ match the beginning and end of the data in the matching buffer; exp_continue restarts the timeout timer unless -continue_timer is given; send -s and send_slow; match_max and the 2000-byte default; spawn's pty is initialised like the user's tty and then made sane",
  },
  // POSIX: the General Terminal Interface chapter.
  {
    id: "posix-termios",
    label: "The Open Group Base Specifications Issue 8 (POSIX.1-2024), Chapter 11, General Terminal Interface",
    url: "https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap11.html",
    accessDate: "2026-10-27",
    release: "POSIX.1-2024",
    supports: "with ICRNL set a received CR is translated into NL; in canonical mode input is processed in lines delimited by NL; with ONLCR set NL is transmitted as CR NL",
  },
]);

/** The profiles, in the order the article presents them: the common reference first, then the four platforms the site teaches. */
export const DEVICE_PROFILES: readonly DeviceProfile[] = deepFreeze<DeviceProfile[]>([
  {
    // ---- Cisco IOS (IOS XE), the common reference ----
    id: "cisco-ios",
    vendor: "Cisco",
    platform: "Cisco IOS XE (the IOS command line)",
    // The release whose documents were read, and the vendor page that says it is supported.
    release: {
      // The documents are Cisco's IOS XE 17.x guide and the IOS command reference that IOS XE shares.
      documented: "Cisco IOS XE 17.x System Management Configuration Guide; Cisco IOS Configuration Fundamentals Command Reference (IOS and IOS XE)",
      // Why a supported release: Cisco's own lifecycle documents read today.
      whySupported: "Cisco's end-of-life bulletin for IOS XE 17.15.x (End of SW Maintenance Releases 30 March 2027) tells customers to migrate to IOS XE 17.18.1 or above, and the 17.18.1 support page lists it as Available; Cisco's IOS XE lifecycle statement gives every release from 26.1.1 on 48 months of support from general availability. The prompts, paging and confirmation behaviour used here are the ones those IOS XE documents describe.",
      sourceIds: ["cisco-xe-17-15-eol", "cisco-xe-17-18-1", "cisco-xe-lifecycle", "cisco-xe17-cli"],
    },
    // The prompt patterns, each with the documented examples it was tested against.
    prompts: {
      user: {
        regex: String.raw`(?:^|[\r\n])[^\r\n#>]+> ?$`,
        examples: ["Router>"],
        note: "User EXEC: the host name followed by >. The host name class excludes # and > so a configuration prompt never matches as a user prompt.",
        sourceIds: ["cisco-c8400-xe"],
      },
      privileged: {
        regex: String.raw`(?:^|[\r\n])[^\r\n#>]+# ?$`,
        examples: ["Router#", "Router(config)#", "Router(config-if)#"],
        note: "Privileged EXEC and every configuration mode end in #; the mode name sits in parentheses before it.",
        sourceIds: ["cisco-c8400-xe"],
      },
      any: String.raw`(?:^|[\r\n])[^\r\n#>]+[>#] ?$`,
      alternatives: [],
    },
    // How full command access is reached.
    privilege: {
      model: "enable",
      command: "enable",
      passwordPromptRegex: String.raw`[Pp]assword: ?$`,
      note: "From user EXEC, enable asks for a password and the prompt changes from > to #; Cisco's guide says privileged EXEC is normally entered with a password.",
      sourceIds: ["cisco-c8400-xe", "cisco-xe17-cli"],
    },
    // Turning paging off, and the more prompt when its text is documented.
    paging: {
      off: [
        {
          command: "terminal length 0",
          purpose: "A value of zero disables pausing between screens of output.",
          scope: "session",
          restore: ["terminal length 24"],
          sourceIds: ["cisco-cr-terminal-length"],
        },
      ],
      morePrompt: {
        text: "--More--",
        regex: String.raw`--More--`,
        nextPage: " ",
        nextPageTcl: " ",
        sourceIds: ["cisco-xe17-cli"],
      },
      note: "terminal length sets the number of lines for the current session; the default is 24 lines. At --More--, Return shows one more line and the Spacebar the next screen.",
    },
    // Further session commands that make the CLI easier to script.
    otherSessionCommands: [],
    // The line ending a send uses, and why.
    lineEnding: {
      char: "\r",
      tcl: "\\r",
      basis: "Cisco's guides say to press the Return or Enter key to execute a command (the return key is the Enter key); expect(1) denotes the return character as \\r.",
      sourceIds: ["cisco-c8400-xe", "cisco-xe17-cli", "expect-1"],
    },
    // The confirmation prompts a script can meet, with their documented answers.
    confirmations: [
      {
        trigger: "reload",
        promptText: "Proceed with reload? [confirm]",
        regex: String.raw`\[confirm\] ?$`,
        answer: "\r",
        answerTcl: "\\r",
        note: "The command reference's examples print [confirm] after reload, and for service-module reload it says to press Enter to confirm or n to cancel. Protect the brackets: -ex {[confirm]} or the escaped regex.",
        avoid: null,
        sourceIds: ["cisco-cr-reload"],
      },
    ],
    // The serial console's documented line settings.
    console: { bitsPerSecond: null, framing: null, sourceIds: [] },
    // Further facts from the same documents.
    notes: [
      "Cisco documents --More-- for the output of many ?, show and more commands when output extends beyond the screen length.",
    ],
    // Every source the profile cites, the two common ones first.
    sources: [
      ...COMMON_SOURCES,
      {
        id: "cisco-cr-terminal-length",
        label: "Cisco IOS Configuration Fundamentals Command Reference: terminal length",
        url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/fundamentals/command/Cisco_IOS_Configuration_Fundamentals_Command_Reference/slave_auto-sync_config_through_terminal-type.html",
        accessDate: "2026-10-27",
        release: "Cisco IOS and IOS XE (command history from 10.0 to Cisco IOS XE Release 2.1)",
        supports: "terminal length sets the number of lines on the current terminal screen for the current session; zero disables pausing; default 24 lines; EXEC (>) and privileged EXEC (#) modes",
      },
      {
        id: "cisco-cr-reload",
        label: "Cisco IOS Configuration Fundamentals Command Reference: reload, service-module wlan-ap reload",
        url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/fundamentals/command/Cisco_IOS_Configuration_Fundamentals_Command_Reference/R_through_setup.html",
        accessDate: "2026-10-27",
        release: "Cisco IOS and IOS XE",
        supports: "Proceed with reload? [confirm]; at the confirmation prompt, press Enter to confirm the action, or press n to cancel",
      },
      {
        id: "cisco-xe17-cli",
        label: "System Management Configuration Guide, Cisco IOS XE 17.x: Using the Cisco IOS Command-Line Interface (updated 21 August 2023)",
        url: "https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cf-cli-basics.html",
        accessDate: "2026-10-27",
        release: "Cisco IOS XE 17.x",
        supports: "user EXEC and privileged EXEC modes, a password normally needed for privileged EXEC; the --More-- prompt, Return for one line and Spacebar for the next screen; terminal length 0 stops pausing; Return or Enter executes a command",
      },
      {
        id: "cisco-c8400-xe",
        label: "Cisco C8400 Series Secure Routers Configuration Guide: Use Cisco IOS XE software",
        url: "https://www.cisco.com/c/en/us/td/docs/routers/c8400/c8400-software-config-guide/Using-Cisco-IOS-XE-software.html",
        accessDate: "2026-10-27",
        release: "Cisco IOS XE (C8400 series)",
        supports: "prompts Router>, Router#, Router(config)#, Router(config-if)#; enable followed by Password:; the prompt changes from > to #; the return key is the Enter key",
      },
      {
        id: "cisco-xe-17-15-eol",
        label: "End-of-Sale and End-of-Life Announcement for the Cisco IOS XE 17.15.x",
        url: "https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xe-17/ios-xe-17-15-x-eol.html",
        accessDate: "2026-10-27",
        release: "Cisco IOS XE 17.15.x",
        supports: "End of SW Maintenance Releases 30 March 2027; End of Vulnerability/Security Support 30 September 2028; Last Date of Support 31 March 2029; migrate to Cisco IOS XE Release 17.18.1 or above",
      },
      {
        id: "cisco-xe-17-18-1",
        label: "Cisco IOS XE 17.18.1 support page",
        url: "https://www.cisco.com/c/en/us/support/ios-nx-os-software/ios-xe-17-18-1/model.html",
        accessDate: "2026-10-27",
        release: "Cisco IOS XE 17.18.1",
        supports: "status Available; release date 8 August 2025",
      },
      {
        id: "cisco-xe-lifecycle",
        label: "Software Lifecycle Support Statement: IOS XE",
        url: "https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xe-16/bulletin-c25-741178.html",
        accessDate: "2026-10-27",
        release: "Cisco IOS XE from 26.1.1",
        supports: "starting with 26.1.1, all software releases are Extended Support releases with a sustaining support lifetime of 48 months from general availability; two releases a year",
      },
    ],
  },
  {
    // ---- F5 BIG-IP, tmsh ----
    id: "f5-bigip-tmsh",
    vendor: "F5",
    platform: "BIG-IP, Traffic Management Shell (tmsh)",
    // The release whose documents were read, and the vendor page that says it is supported.
    release: {
      documented: "F5 TMSH Reference v17 (BIG-IP 17.x, the clouddocs 'latest' edition)",
      whySupported: "F5's software support policy K5903 (updated 6 August 2026, read in a browser on 27 October 2026) lists 17.5.x, a Long-Term Stability Release, as supported with active software development until 1 January 2029, its End of Software Development and End of Technical Support date; F5 published release notes for BIG-IP 17.5.1.10 updated on 9 October 2026.",
      sourceIds: ["f5-k5903", "f5-17-5-1-10-rn", "f5-tmsh-reference"], // K5903 first: it carries the end date
    },
    // The prompt patterns, each with the documented examples it was tested against.
    prompts: {
      user: null,
      privileged: {
        regex: String.raw`(?:^|[\r\n])[^\r\n]*\(tmos[^\r\n]*\)# ?$`,
        examples: ["(tmos)#", "(tmos.ltm)#", "(tmos.ltm.node)#", "(tmos.ltm.node.10.1.1.10)#"],
        note: "The prompt ends with the current module in parentheses, (tmos) at the root, and #. By default it is preceded by the user, the host and status items in parentheses (the cli preference prompt option), which the leading [^\\r\\n]* absorbs.",
        sourceIds: ["f5-tmsh-tmsh", "f5-tmsh-cli-preference"],
      },
      any: String.raw`(?:^|[\r\n])[^\r\n]*\(tmos[^\r\n]*\)# ?$`,
      alternatives: [
        {
          regex: String.raw`(?:^|[\r\n])# ?$`,
          examples: ["(Common:all) operator1@6400(tmos.cli)\n#"],
          note: "With the prompt preference multi-line, the information is on one line and the # alone on the next.",
          sourceIds: ["f5-tmsh-cli-preference"],
        },
      ],
    },
    // How full command access is reached.
    privilege: {
      model: "role-and-shell",
      command: null,
      passwordPromptRegex: null,
      note: "There is no enable step: what a user may do follows the user role assigned per partition, and the shell property (tmsh, bash or none) decides what the login gives; bash can be assigned only to users with the Administrator role.",
      sourceIds: ["f5-tmsh-auth-user"],
    },
    // Turning paging off, and the more prompt when its text is documented.
    paging: {
      off: [
        {
          command: "modify /cli preference pager disabled display-threshold 0",
          purpose: "pager disabled stops tmsh sending list and show output to less; display-threshold 0 removes the 'Display all [number] items? (y/n)' question for any number of objects.",
          scope: "preference",
          restore: null,
          sourceIds: ["f5-tmsh-cli-preference", "f5-tmsh-tmsh"],
        },
      ],
      morePrompt: null,
      note: "pager is enabled by default and sends list and show output to less; the reference does not print less's prompt, so the profile turns paging off rather than answering it. The leading / names the cli module from any module. The reference does not say how long a preference change lasts: read the current values with list /cli preference first if they must be put back.",
    },
    // Further session commands that make the CLI easier to script.
    otherSessionCommands: [],
    // The line ending a send uses, and why.
    lineEnding: {
      char: "\r",
      tcl: "\\r",
      basis: "The tmsh reference names no key for ending a command, but tmsh edits the command line itself (Tab completion, ? help, default, emacs and vi key maps); expect(1) denotes the return character as \\r.",
      sourceIds: ["f5-tmsh-tmsh", "f5-tmsh-cli-preference", "expect-1"],
    },
    // The confirmation prompts a script can meet, with their documented answers.
    confirmations: [
      {
        trigger: "list or show over more objects than display-threshold",
        promptText: "Display all [number] items? (y/n)",
        regex: String.raw`Display all [0-9]+ items\? \(y/n\)`,
        answer: "y",
        answerTcl: "y",
        note: "The reference prints the question; it does not say whether a return must follow the y.",
        avoid: "modify /cli preference display-threshold 0",
        sourceIds: ["f5-tmsh-cli-preference"],
      },
    ],
    // The serial console's documented line settings.
    console: { bitsPerSecond: null, framing: null, sourceIds: [] },
    // Further facts from the same documents.
    notes: [
      "Started from the system shell, tmsh -q prevents tmsh from responding to user actions with questions, and -c runs one command; F5 calls both useful for non-interactive shell scripts.",
      "A user whose shell is bash reaches tmsh by running tmsh; this profile describes the tmsh prompt only.",
      "edit asks whether to submit (y), discard (n) or edit (e) the changes while confirm-edit is enabled (the default); the reference does not print that question, so the profile has no pattern for it, and a script should not use edit.",
    ],
    // Every source the profile cites, the two common ones first.
    sources: [
      ...COMMON_SOURCES,
      {
        id: "f5-tmsh-reference",
        label: "F5 TMSH Reference v17: index",
        url: "https://clouddocs.f5.com/cli/tmsh-reference/latest/",
        accessDate: "2026-10-27",
        release: "BIG-IP 17.x (TMSH Reference v17.0.0)",
        supports: "the reference edition: 17.x, the newest edition published on clouddocs",
      },
      {
        id: "f5-tmsh-cli-preference",
        label: "F5 TMSH Reference v17: cli preference",
        url: "https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/cli/cli_preference.html",
        accessDate: "2026-10-27",
        release: "BIG-IP 17.x",
        supports: "pager (enabled by default; sends list and show output to less); display-threshold and the question 'Display all [number] items? (y/n)', 0 for unlimited; confirm-edit (y, n or e); the prompt option and its default items; multi-line prompt with # on the second line",
      },
      {
        id: "f5-tmsh-tmsh",
        label: "F5 TMSH Reference v17: tmsh",
        url: "https://clouddocs.f5.com/cli/tmsh-reference/latest/general/tmsh.html",
        accessDate: "2026-10-27",
        release: "BIG-IP 17.x",
        supports: "prompts (tmos)#, (tmos.ltm)#, (tmos.ltm.node)#, (tmos.ltm.node.10.1.1.10)#; a leading / names a path from the root module; Tab completion and ? help; key maps; tmsh -q and -c from the system shell",
      },
      {
        id: "f5-tmsh-auth-user",
        label: "F5 TMSH Reference v17: auth user",
        url: "https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_user.html",
        accessDate: "2026-10-27",
        release: "BIG-IP 17.x",
        supports: "partition-access and one role per partition; shell bash (Administrator role only), none or tmsh",
      },
      {
        id: "f5-17-5-1-10-rn",
        label: "BIG-IP 17.5.1.10 release notes: General Information (updated 10/09/2026)",
        url: "https://techdocs.f5.com/en-us/bigip-17-5-1-10/big-ip-release-notes/big-ip-general.html",
        accessDate: "2026-10-27",
        release: "BIG-IP 17.5.1.10",
        supports: "a maintenance release of the 17.5 branch documented on 9 October 2026",
      },
      {
        // F5's support policy (a public page that renders only in a browser; read in one on 2026-10-27).
        id: "f5-k5903",
        label: "K5903: BIG-IP software support policy (updated Aug 6, 2026)",
        url: "https://my.f5.com/manage/s/article/K5903",
        accessDate: "2026-10-27",
        release: "BIG-IP 21.1.x, 17.5.x and 17.1.x (the branches supported with active software development)",
        supports: "17.5.x: first customer ship February 27, 2025; End of Software Development and End of Technical Support January 1, 2029; a Long-Term Stability Release with a longer than three-year Standard Support phase",
      },
    ],
  },
  {
    // ---- Fortinet FortiOS ----
    id: "fortinet-fortios",
    vendor: "Fortinet",
    platform: "FortiGate, FortiOS CLI",
    // The release whose documents were read, and the vendor page that says it is supported.
    release: {
      documented: "FortiOS 7.6.8 (CLI Reference and Administration Guide)",
      whySupported: "Fortinet's technical tip on Customer Support Bulletin CSB-260330-1 gives FortiOS 7.6 an End of Engineering Support date of 25 July 2028 and an End of Support date of 25 January 2030; 7.6.8 is the newest 7.6 patch in Fortinet's document library today. Fortinet's Product Life Cycle page requires a sign-in and was not read.",
      sourceIds: ["ftnt-eos-74-76", "ftnt-768-console"],
    },
    // The prompt patterns, each with the documented examples it was tested against.
    prompts: {
      user: null,
      privileged: {
        regex: String.raw`(?:^|[\r\n])[^\r\n#>]+ ?# ?$`,
        examples: ["FGT # ", "FGT (admin)#", "FGT (27) # "],
        note: "The prompt is the FortiGate host name followed by #; inside a config command the scope appears in parentheses, (admin) after config system admin, (27) after edit 27. Fortinet prints the scope prompts without the host name; the examples add one.",
        sourceIds: ["ftnt-768-connecting", "ftnt-768-subcommands", "ftnt-tt-console-output"],
      },
      any: String.raw`(?:^|[\r\n])[^\r\n#>]+ ?# ?$`,
      alternatives: [],
    },
    // How full command access is reached.
    privilege: {
      model: "admin-profile",
      command: null,
      passwordPromptRegex: null,
      note: "There is no enable step: administrator profiles assign read, write or no access to each area, and an account with the super_admin profile has access to all CLI commands.",
      sourceIds: ["ftnt-768-permissions"],
    },
    // Turning paging off, and the more prompt when its text is documented.
    paging: {
      off: [
        { command: "config system console", purpose: "Enters the console settings.", scope: "global-configuration", restore: null, sourceIds: ["ftnt-768-console"] },
        { command: "set output standard", purpose: "Console output mode standard: no pause (the default is more).", scope: "global-configuration", restore: ["config system console", "set output more", "end"], sourceIds: ["ftnt-768-console", "ftnt-tt-console-output"] },
        { command: "end", purpose: "Saves the setting and leaves config system console.", scope: "global-configuration", restore: null, sourceIds: ["ftnt-768-subcommands"] },
      ],
      morePrompt: {
        text: "--More--",
        regex: String.raw`--More--`,
        nextPage: " ",
        nextPageTcl: " ",
        sourceIds: ["ftnt-tt-console-output"],
      },
      note: "FortiOS has no per-session paging command: set output standard is a global configuration change that applies to every administrator's CLI session (serial console, web console or SSH), so a script that changes it should put it back with set output more. Output resumes on a key press, typically Space, and q interrupts it.",
    },
    // Further session commands that make the CLI easier to script.
    otherSessionCommands: [],
    // The line ending a send uses, and why.
    lineEnding: {
      char: "\r",
      tcl: "\\r",
      basis: "Fortinet's procedures say to press Enter after the user name and the password and to connect; expect(1) denotes the return character as \\r.",
      sourceIds: ["ftnt-768-connecting", "expect-1"],
    },
    // The confirmation prompts a script can meet, with their documented answers.
    confirmations: [
      {
        trigger: "execute restore image tftp <filename> <tftp_ipv4> (and other execute commands)",
        promptText: "Do you want to continue? (y/n)",
        regex: String.raw`Do you want to continue\? \(y/n\)`,
        answer: "y",
        answerTcl: "y",
        note: "Fortinet's procedure says to type y; its transcript shows the y at the end of the question line. The document does not mention Enter after it.",
        avoid: null,
        sourceIds: ["ftnt-768-upgrade"],
      },
    ],
    // The serial console's documented line settings.
    console: { bitsPerSecond: 9600, framing: "8 data bits, no parity, 1 stop bit, no flow control", sourceIds: ["ftnt-768-connecting"] },
    // Further facts from the same documents.
    notes: [
      "The Technical Tip says the output setting applies to show, ? and get command output, not to debug or sniffer output.",
      "Three incorrect login or password attempts in a row disconnect the session for a minute.",
    ],
    // Every source the profile cites, the two common ones first.
    sources: [
      ...COMMON_SOURCES,
      {
        id: "ftnt-768-console",
        label: "FortiOS 7.6.8 CLI Reference: config system console",
        url: "https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/141236613/config-system-console",
        accessDate: "2026-10-27",
        release: "FortiOS 7.6.8",
        supports: "set output [standard|more]: console output mode, default more; standard is standard output, more is more page output",
      },
      {
        id: "ftnt-768-connecting",
        label: "FortiOS 7.6.8 Administration Guide: Connecting to the CLI",
        url: "https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/901037/connecting-to-the-cli",
        accessDate: "2026-10-27",
        release: "FortiOS 7.6.8",
        supports: "the command prompt is the FortiGate host name followed by a #; press Enter after the account name and the password; console 9600 bits per second, 8 data bits, no parity, 1 stop bit, no flow control; three failed attempts disconnect for one minute",
      },
      {
        id: "ftnt-768-subcommands",
        label: "FortiOS 7.6.8 Administration Guide: Subcommands",
        url: "https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/627485/subcommands",
        accessDate: "2026-10-27",
        release: "FortiOS 7.6.8",
        supports: "the prompt changes to the command scope, (admin)# after config system admin and (27) # after edit 27; end saves and exits the config command",
      },
      {
        id: "ftnt-768-permissions",
        label: "FortiOS 7.6.8 Administration Guide: Permissions",
        url: "https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/953073/permissions",
        accessDate: "2026-10-27",
        release: "FortiOS 7.6.8",
        supports: "administrator profiles control CLI access; super_admin has access to all CLI commands",
      },
      {
        id: "ftnt-768-upgrade",
        label: "FortiOS 7.6.8 Administration Guide: Upgrading individual devices",
        url: "https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/596131",
        accessDate: "2026-10-27",
        release: "FortiOS 7.6.8",
        supports: "'This operation will replace the current firmware version! Do you want to continue? (y/n)'; Type y",
      },
      {
        id: "ftnt-tt-console-output",
        label: "Fortinet Community Technical Tip: CLI command console output mode",
        url: "https://community.fortinet.com/fortigate-3/technical-tip-cli-command-console-output-mode-93126",
        accessDate: "2026-10-27",
        release: "FortiGate (FortiOS, release not named)",
        supports: "paging is enabled by default with more; the --More-- message; output resumes on a key press, typically Space, and q interrupts it; set output standard removes the pause; the setting is global and can affect other administrators; it applies to show, ? and get, not to debugs or sniffer output; prompt example FGT #",
      },
      {
        id: "ftnt-eos-74-76",
        label: "Fortinet Community Technical Tip: FortiOS End of Support change for FortiOS v7.4 and v7.6",
        url: "https://community.fortinet.com/fortigate-3/technical-tip-fortios-end-of-support-change-for-fortios-v7-4-and-v7-6-224876",
        accessDate: "2026-10-27",
        release: "FortiOS 7.4 and 7.6",
        supports: "per CSB-260330-1 (March 2026): FortiOS 7.6 End of Engineering Support 25 July 2028, End of Support 25 January 2030",
      },
    ],
  },
  {
    // ---- Extreme Networks Switch Engine (EXOS) ----
    id: "extreme-switch-engine",
    vendor: "Extreme Networks",
    platform: "Switch Engine (ExtremeXOS, EXOS)",
    // The release whose documents were read, and the vendor page that says it is supported.
    release: {
      documented: "Switch Engine 33.7.1 (Command References and User Guide); the paging command checked in the 32.7.1 Command Reference too",
      whySupported: "Extreme's ExtremeXOS and Switch Engine Release Recommendations list Switch Engine 33.7.1.6-Patch1-32 as the Feature Release recommendation ('the newest version of the software ... fully supported') and 32.7.4.15-Patch1-14 as the Maintenance Release recommendation ('the actively supported version'); the paging command is the same in both branches' references.",
      sourceIds: ["xtr-se-recommendations", "xtr-se-3371-cli-paging", "xtr-se-3271-cli-paging"],
    },
    // The prompt patterns, each with the documented examples it was tested against.
    prompts: {
      user: {
        regex: String.raw`(?:^|[\r\n])[^\r\n#>]*\.[0-9]+ > ?$`,
        examples: ["5420F-48P-4XE.1 > "],
        note: "An account with user capabilities: the switch name (the SNMP sysname), a period, the command number of the session, and >.",
        sourceIds: ["xtr-se-3371-prompt"],
      },
      privileged: {
        regex: String.raw`(?:^|[\r\n])[^\r\n#>]*\.[0-9]+ # ?$`,
        examples: ["5420F-48P-4XE.1 # ", "* 5420F-48P-4XE.1 # "],
        note: "An account with administrator capabilities ends in #; a leading asterisk means configuration changes not yet saved; the number after the period counts the session's commands.",
        sourceIds: ["xtr-se-3371-prompt"],
      },
      any: String.raw`(?:^|[\r\n])[^\r\n#>]*\.[0-9]+ [>#] ?$`,
      alternatives: [],
    },
    // How full command access is reached.
    privilege: {
      model: "account-level",
      command: null,
      passwordPromptRegex: null,
      note: "There is no enable step: the account's level decides, administrator (#) or user (>), and most configuration commands need the administrator level.",
      sourceIds: ["xtr-se-3371-prompt", "xtr-se-3371-access-levels"],
    },
    // Turning paging off, and the more prompt when its text is documented.
    paging: {
      off: [
        {
          command: "disable cli paging session",
          purpose: "Disables pausing at the end of each show screen for the current user session only (session is the default keyword; permanent survives a reboot).",
          scope: "session",
          restore: ["enable cli paging session"],
          sourceIds: ["xtr-se-3371-cli-paging", "xtr-se-3271-cli-paging"],
        },
      ],
      morePrompt: null,
      note: "Paging is enabled per session by default and most show output pauses at the end of a page; the documents read do not print the pause prompt's text, so the profile turns paging off. The keyword was split from clipaging in ExtremeXOS 30.3.",
    },
    // Further session commands that make the CLI easier to script.
    otherSessionCommands: [
      {
        command: "disable cli prompting",
        purpose: "All CLI user prompts continue automatically with the default answer, for the current session only. The default answer is the prompt's own default, not necessarily yes.",
        scope: "session",
        restore: ["enable cli prompting"],
        sourceIds: ["xtr-se-3371-cli-prompting"],
      },
      {
        command: "disable cli refresh session",
        purpose: "Turns off the automatic refresh some show commands use, for this session (the keyword's default is permanent, so session is written out).",
        scope: "session",
        restore: ["enable cli refresh session"],
        sourceIds: ["xtr-se-3371-cli-refresh"],
      },
    ],
    // The line ending a send uses, and why.
    lineEnding: {
      char: "\r",
      tcl: "\\r",
      basis: "Switch Engine's command help lists <cr> for 'Execute the command' and the reboot question offers '<cr> - cancel command'; expect(1) denotes the return character as \\r.",
      sourceIds: ["xtr-se-3371-save", "xtr-se-3371-reboot", "expect-1"],
    },
    // The confirmation prompts a script can meet, with their documented answers.
    confirmations: [
      {
        trigger: "save configuration (an existing file)",
        promptText: "Do you want to save configuration to primary.cfg and overwrite it? (y/N)",
        regex: String.raw`\(y/[nN]\) ?$`,
        answer: "y",
        answerTcl: "y",
        note: "The reference says to enter y to save or n to cancel; its examples print both (y/n) and (y/N), followed by the word Yes.",
        avoid: null,
        sourceIds: ["xtr-se-3371-save"],
      },
      {
        trigger: "reboot",
        promptText: "Do you want to save configuration changes to primary and reboot? (y - save and reboot, n - reboot without save, <cr> - cancel command)",
        regex: String.raw`<cr> - cancel command\)`,
        answer: "y",
        answerTcl: "y",
        note: "Here a bare return cancels: y saves and reboots, n reboots without saving.",
        avoid: null,
        sourceIds: ["xtr-se-3371-reboot"],
      },
    ],
    // The serial console's documented line settings.
    console: { bitsPerSecond: null, framing: null, sourceIds: [] },
    // Further facts from the same documents.
    notes: [
      "show management reports the session's CLI paging, prompting and refresh settings.",
      "The CLI is designed for use in a VT100 environment.",
    ],
    // Every source the profile cites, the two common ones first.
    sources: [
      ...COMMON_SOURCES,
      {
        id: "xtr-se-3371-cli-paging",
        label: "Switch Engine v33.7.1 Command References: disable cli paging",
        url: "https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20Command%20References/content/documents/Switch_Operating_Systems/Switch_Engine/Command_References/disable_clipaging.shtml",
        accessDate: "2026-10-27",
        release: "Switch Engine 33.7.1",
        supports: "disable cli paging { session | permanent }: session is the default and applies to the current user session only; paging enabled per session by default; VT100 environment; split from clipaging in ExtremeXOS 30.3",
      },
      {
        id: "xtr-se-3271-cli-paging",
        label: "Switch Engine Command Reference Guide 32.7.1: disable cli paging",
        url: "https://documentation.extremenetworks.com/switchengine_commands_32.7.1/GUID-6C44D895-A635-4A8F-93C9-B5CC382BC655.shtml",
        accessDate: "2026-10-27",
        release: "Switch Engine 32.7.1",
        supports: "the same disable cli paging { session | permanent } syntax and session default in the 32.7 branch",
      },
      {
        id: "xtr-se-3371-cli-prompting",
        label: "Switch Engine v33.7.1 Command References: disable cli prompting",
        url: "https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20Command%20References/content/documents/Switch_Operating_Systems/Switch_Engine/Command_References/disable_cli_prompting.shtml",
        accessDate: "2026-10-27",
        release: "Switch Engine 33.7.1",
        supports: "all CLI user prompts continue with the default answer; applies to the current session only",
      },
      {
        id: "xtr-se-3371-cli-refresh",
        label: "Switch Engine v33.7.1 Command References: disable cli refresh",
        url: "https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20Command%20References/content/documents/Switch_Operating_Systems/Switch_Engine/Command_References/disable_cli_refresh.shtml",
        accessDate: "2026-10-27",
        release: "Switch Engine 33.7.1",
        supports: "disable cli refresh { session | permanent }: some show commands refresh automatically; permanent is the keyword's default and only valid for admin-level users",
      },
      {
        id: "xtr-se-3371-prompt",
        label: "Switch Engine v33.7.1 User Guide: Startup Screen and Prompt Text",
        url: "https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20User%20Guide/content/documents/Switch_Operating_Systems/Switch_Engine/User_Guide/startup_screen_and_prompt_text.shtml",
        accessDate: "2026-10-27",
        release: "Switch Engine 33.7.1",
        supports: "prompt text from the SNMP sysname; the number after the period is the command line of the session; a leading asterisk marks unsaved changes; # for administrator capabilities, > for user capabilities",
      },
      {
        id: "xtr-se-3371-access-levels",
        label: "Switch Engine v33.7.1 Command References: Access Levels",
        url: "https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20Command%20References/content/documents/Switch_Operating_Systems/Switch_Engine/Command_References/access_levels.shtml",
        accessDate: "2026-10-27",
        release: "Switch Engine 33.7.1",
        supports: "most configuration commands require the administrator privilege level",
      },
      {
        id: "xtr-se-3371-save",
        label: "Switch Engine v33.7.1 Command References: save configuration",
        url: "https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20Command%20References/content/documents/Switch_Operating_Systems/Switch_Engine/Command_References/save_configuration.shtml",
        accessDate: "2026-10-27",
        release: "Switch Engine 33.7.1",
        supports: "enter y to save or n to cancel; the (y/n) and (y/N) questions; <cr> Execute the command",
      },
      {
        id: "xtr-se-3371-reboot",
        label: "Switch Engine v33.7.1 Command References: reboot",
        url: "https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20Command%20References/content/documents/Switch_Operating_Systems/Switch_Engine/Command_References/reboot.shtml",
        accessDate: "2026-10-27",
        release: "Switch Engine 33.7.1",
        supports: "the question before rebooting, with y, n and <cr> (cancel)",
      },
      {
        id: "xtr-se-recommendations",
        label: "Extreme Networks: ExtremeXOS and Switch Engine Release Recommendations",
        url: "https://www.extremenetworks.com/support/compatibility-matrices/sw-release-extremexos-eos",
        accessDate: "2026-10-27",
        release: "Switch Engine 32.7.4 and 33.7.1",
        supports: "Maintenance Release recommendation 32.7.4.15-Patch1-14 ('actively supported'); Feature Release recommendation 33.7.1.6-Patch1-32 ('newest ... fully supported')",
      },
    ],
  },
  {
    // ---- Extreme Networks Fabric Engine (VOSS) ----
    id: "extreme-fabric-engine",
    vendor: "Extreme Networks",
    platform: "Fabric Engine (VOSS)",
    // The release whose documents were read, and the vendor page that says it is supported.
    release: {
      documented: "Fabric Engine 9.4 (Command References and User Guide)",
      whySupported: "Extreme's VOSS, Fabric Engine, and VSP8600 Release Recommendations list Fabric Engine 9.4.1.0 as the Maintenance Release ('the actively maintained release') and 9.4.0.0 as the Latest Feature Release for the 4220, 5320, 5420, 5520, 5720, 7520, 7720 and 7830 series, effective 15 July 2026.",
      sourceIds: ["xtr-fe-recommendations", "xtr-fe-94-modes"],
    },
    // The prompt patterns, each with the documented examples it was tested against.
    prompts: {
      user: {
        regex: String.raw`(?:^|[\r\n])[^\r\n#>]+> ?$`,
        examples: ["Switch:1>"],
        note: "User EXEC, the mode a login starts in, ends in >.",
        sourceIds: ["xtr-fe-94-modes", "xtr-fe-94-reset"],
      },
      privileged: {
        regex: String.raw`(?:^|[\r\n])[^\r\n#>]+# ?$`,
        examples: ["Switch:1#", "Switch:1(config)#", "Switch:1(config-if)#", "Switch:1(mgmt:oob)#"],
        note: "Privileged EXEC and the configuration modes end in #, the mode in parentheses before it.",
        sourceIds: ["xtr-fe-94-modes", "xtr-fe-94-reset"],
      },
      any: String.raw`(?:^|[\r\n])[^\r\n#>]+[>#] ?$`,
      alternatives: [],
    },
    // How full command access is reached.
    privilege: {
      model: "enable",
      command: "enable",
      passwordPromptRegex: null,
      note: "enable moves from User EXEC to Privileged EXEC; depending on feature configuration it can ask for a user name and a password. The documents read do not print those prompts, so the profile gives no pattern for them.",
      sourceIds: ["xtr-fe-94-modes"],
    },
    // Turning paging off, and the more prompt when its text is documented.
    paging: {
      off: [
        {
          command: "terminal more disable",
          purpose: "Configures scrolling for the output display (more is enabled by default).",
          scope: "unstated",
          restore: ["terminal more enable"],
          sourceIds: ["xtr-fe-94-terminal"],
        },
      ],
      morePrompt: null,
      note: "The reference states session scope for terminal length but not for terminal more; it is a User EXEC command. The documents read do not print the more prompt's text, so the profile turns paging off.",
    },
    // Further session commands that make the CLI easier to script.
    otherSessionCommands: [],
    // The line ending a send uses, and why.
    lineEnding: {
      char: "\r",
      tcl: "\\r",
      basis: "The User Guide explains <cr> in command help as Carriage Return/Enter Key; expect(1) denotes the return character as \\r.",
      sourceIds: ["xtr-fe-94-completion", "expect-1"],
    },
    // The confirmation prompts a script can meet, with their documented answers.
    confirmations: [
      {
        trigger: "reset -in <time>",
        promptText: "Are you sure you want to perform a delayed reset? (y/n) ?",
        regex: String.raw`\(y/n\) \? ?$`,
        answer: "y",
        answerTcl: "y",
        note: "The User Guide's examples answer y.",
        avoid: "reset -y (the -y option the User Guide gives for an immediate reset)",
        sourceIds: ["xtr-fe-94-reset"],
      },
    ],
    // The serial console's documented line settings.
    console: { bitsPerSecond: 115200, framing: "8 data bits, 1 stop bit, no parity, no flow control", sourceIds: ["xtr-fe-94-connect"] },
    // Further facts from the same documents.
    notes: [
      "Fabric Engine has an Application Configuration mode for custom applications such as RESTCONF.",
    ],
    // Every source the profile cites, the two common ones first.
    sources: [
      ...COMMON_SOURCES,
      {
        id: "xtr-fe-94-terminal",
        label: "Fabric Engine v9.4 Command References: terminal (User EXEC)",
        url: "https://documentation.extremenetworks.com/Fabric%20Engine%20v9.4%20Command%20References/Switch_Operating_Systems/VOSS_and_Fabric_Engine/fabric_engine_cli_commands_reference/User_EXEC/terminal.shtml",
        accessDate: "2026-10-27",
        release: "Fabric Engine 9.4",
        supports: "terminal more disable and enable (scrolling; default enabled); terminal length <8-64> for the current session; command mode User EXEC",
      },
      {
        id: "xtr-fe-94-modes",
        label: "Fabric Engine v9.4 User Guide: CLI Command Modes",
        url: "https://documentation.extremenetworks.com/Fabric%20Engine%20v9.4%20User%20Guide/fe_9.4_ug_revacdev/content/documents/Switch_Operating_Systems/VOSS_and_Fabric_Engine/fabric_engine_user_guide/cli_command_modes.shtml",
        accessDate: "2026-10-27",
        release: "Fabric Engine 9.4",
        supports: "User EXEC (>), Privileged EXEC via enable (#), Global Configuration (config)#, interface and other modes; enable can prompt for a user name and password depending on configuration; Application Configuration for RESTCONF",
      },
      {
        id: "xtr-fe-94-reset",
        label: "Fabric Engine v9.4 User Guide: Reset the Platform",
        url: "https://documentation.extremenetworks.com/Fabric%20Engine%20v9.4%20User%20Guide/fe_9.4_ug_revacdev/content/documents/Switch_Operating_Systems/VOSS_and_Fabric_Engine/fabric_engine_user_guide/resetting_the_platform.shtml",
        accessDate: "2026-10-27",
        release: "Fabric Engine 9.4",
        supports: "prompts Switch:1> and Switch:1#; reset [-y]; 'Are you sure you want to perform a delayed reset? (y/n) ? y'",
      },
      {
        id: "xtr-fe-94-completion",
        label: "Fabric Engine v9.4 User Guide: Command Completion",
        url: "https://documentation.extremenetworks.com/Fabric%20Engine%20v9.4%20User%20Guide/fe_9.4_ug_revacdev/content/documents/Switch_Operating_Systems/VOSS_and_Fabric_Engine/fabric_engine_user_guide/command_completion.shtml",
        accessDate: "2026-10-27",
        release: "Fabric Engine 9.4",
        supports: "<cr> (Carriage Return/Enter Key) in command help; prompt example Switch:1(config-isis)#",
      },
      {
        id: "xtr-fe-94-connect",
        label: "Fabric Engine v9.4 User Guide: Connect a Terminal",
        url: "https://documentation.extremenetworks.com/Fabric%20Engine%20v9.4%20User%20Guide/fe_9.4_ug_revacdev/content/documents/Switch_Operating_Systems/VOSS_and_Fabric_Engine/fabric_engine_user_guide/connecting_a_terminal.shtml",
        accessDate: "2026-10-27",
        release: "Fabric Engine 9.4",
        supports: "console 115200 baud, 8 data bits, 1 stop bit, no parity, no flow control",
      },
      {
        id: "xtr-fe-recommendations",
        label: "Extreme Networks: VOSS, Fabric Engine, and VSP8600 Release Recommendations",
        url: "https://www.extremenetworks.com/support/compatibility-matrices/software-release-recommendations-for-voss-vsp-8600",
        accessDate: "2026-10-27",
        release: "Fabric Engine 9.4.0.0 and 9.4.1.0",
        supports: "Maintenance Release 9.4.1.0 and Latest Feature Release 9.4.0.0 for the 4220 to 7830 series, effective 15 July 2026",
      },
    ],
  },
]);

/** The ids, in the order of DEVICE_PROFILES. */
export const DEVICE_PROFILE_IDS: readonly DeviceProfileId[] = deepFreeze(DEVICE_PROFILES.map((p) => p.id));

/** The profile with this id, or undefined. */
export function getDeviceProfile(id: string): DeviceProfile | undefined {
  // A linear search over five entries.
  return DEVICE_PROFILES.find((p) => p.id === id);
}

/** A source of a profile by id (its own or one of the common ones), or undefined. */
export function getProfileSource(profile: DeviceProfile, sourceId: string): ProfileSource | undefined {
  // Each profile's sources include the common ones.
  return profile.sources.find((s) => s.id === sourceId);
}
