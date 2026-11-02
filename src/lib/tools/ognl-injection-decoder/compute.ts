// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/ognl-injection-decoder/compute.ts
// ----------------------------------------------------------------------------
// OGNL INJECTION DECODER — reads an OGNL payload you have ALREADY FOUND in a
// log and explains what it was trying to do.
//
// *** SCOPE, AND THE LINE THIS TOOL DOES NOT CROSS ***
//
// This is a DECODER. It takes a string that has already arrived at somebody's
// WAF or application and explains it. It does not build payloads, it does not
// suggest variations, it does not evaluate anything, and it has no template
// library to draw from. Everything it knows is a description of syntax that is
// public, documented by Apache in its own security bulletins, and present in
// the logs of anyone running a public web server.
//
// That distinction matters and is the reason the tool exists in this shape. An
// engineer looking at `%{(#_memberAccess["allowStaticMethodAccess"]=true)...}`
// in a WAF log at two in the morning needs to know what it means, whether it
// matched, and which advisory to read. Explaining a captured artefact is the
// defensive half of the job; producing new ones is not this site's business.
//
// DETERMINISTIC AND LOCAL. Same input, same output, no network, nothing
// evaluated. The parser recognises structure and reports it; at no point is any
// part of the input executed or resolved.
//
// PAGE LANGUAGE (02/11/2026): every sentence the reading carries (finding
// labels and meanings, advisory descriptions and vectors, the summary and the
// caveats) is built as an EngineText (../engine-text.ts): a stable id, the
// English as before, and its values. decodeOgnlLocalisable() returns them as
// such for the page (pack keys tools.ognl-injection-decoder.engine.<id>);
// decodeOgnl() returns plainText() of the same reading, so its output and the
// golden vectors are unchanged.
// ============================================================================

import { say, plainText, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

/** One recognised construct within a payload. S: string (decodeOgnl) or EngineText (the page's reading). */
export interface Finding<S = string> {
  /** Short label for the construct. */
  label: S;
  /** The literal fragment that matched, echoed back for orientation. */
  fragment: string;
  /** What this construct does in OGNL. */
  meaning: S;
  /** Why it matters when seen in a log. */
  significance: "structural" | "sandbox-escape" | "execution" | "reconnaissance";
}

/** A published advisory family this payload's shape is associated with. S: string or EngineText, as above. */
export interface AdvisoryMatch<S = string> {
  id: S | string; // the bulletin name as Apache publishes it (a plain string), or a family described in words (S)
  what: S; // what the family is
  /** Where the payload was carried, when that is characteristic of the family. */
  vector: S;
}

/** The reading. S is string in decodeOgnl()'s output and EngineText in decodeOgnlLocalisable()'s. */
export interface DecodeResult<S = string> {
  /** True if the input contains an OGNL expression delimiter at all. */
  looksLikeOgnl: boolean;
  /** Everything recognised, in the order it appears. */
  findings: Finding<S>[];
  /** Advisory families whose characteristic markers are present. */
  advisories: AdvisoryMatch<S>[];
  /** Plain-language summary of the payload's apparent intent. */
  summary: S;
  /**
   * Whether the payload contains the two things a working Struts OGNL RCE
   * needed: a sandbox escape AND an execution primitive. Reported because an
   * attempt with only one is far more common and far less interesting.
   */
  hasEscape: boolean;
  hasExecution: boolean;
  /** Notes on what this tool did NOT determine. */
  caveats: S[];
}

interface Rule {
  id: string; // the stable key of the rule's label and meaning in the pack (rule.<id>.label, rule.<id>.meaning)
  re: RegExp;
  label: string;
  meaning: string;
  significance: Finding["significance"];
}

/**
 * Recognised constructs. Each is a description of documented OGNL or Java
 * syntax - the same material Apache published in its own bulletins.
 */
const RULES: Rule[] = [
  {
    id: "delimiter", // pack keys rule.delimiter.*
    re: /%\{[\s\S]*?\}/,
    label: "OGNL expression delimiter",
    meaning:
      "In Struts, %{...} marks a value that should be evaluated as an OGNL expression rather than treated as text. Its presence in a header or parameter is the whole basis of this class of attack: the payload is only dangerous if something evaluates it.",
    significance: "structural",
  },
  {
    id: "memberAccess", // pack keys rule.memberAccess.*
    re: /#_memberAccess\s*(?:\[|\.)/,
    label: "member-access manipulation",
    meaning:
      "#_memberAccess is the object that enforces OGNL's restrictions on what an expression may reach. Writing to it is an attempt to disable the sandbox rather than to work within it.",
    significance: "sandbox-escape",
  },
  {
    id: "staticMethodAccess", // pack keys rule.staticMethodAccess.*
    re: /allowStaticMethodAccess/,
    label: "static method access flag",
    meaning:
      "Setting this to true permits calling static Java methods from an expression. Without it, the runtime call below is refused; with it, the expression can reach the whole class library.",
    significance: "sandbox-escape",
  },
  {
    id: "ognlInternals", // pack keys rule.ognlInternals.*
    re: /ognl\.OgnlContext|ognl\.ClassResolver|ognl\.TypeConverter/,
    label: "OGNL internals referenced by class name",
    meaning:
      "Naming OGNL's own context, class resolver or type converter is a way of reaching the machinery that decides what is permitted, rather than using it.",
    significance: "sandbox-escape",
  },
  {
    id: "defaultMemberAccess", // pack keys rule.defaultMemberAccess.*
    re: /DEFAULT_MEMBER_ACCESS/,
    label: "default member access reference",
    meaning:
      "A permissive member-access object exposed as a constant, used to replace a restrictive one in a single assignment.",
    significance: "sandbox-escape",
  },
  {
    id: "runtimeHandle", // pack keys rule.runtimeHandle.*
    re: /@java\.lang\.Runtime@getRuntime\(\)/,
    label: "runtime handle",
    meaning:
      "Obtains the JVM's Runtime object, whose purpose here is a single method: starting an operating system process.",
    significance: "execution",
  },
  {
    id: "processExec", // pack keys rule.processExec.*
    re: /\.exec\s*\(/,
    label: "process execution",
    meaning:
      "Starts an external command. This is the point at which an expression stops reading the application and starts running things on the host.",
    significance: "execution",
  },
  {
    id: "processBuilder", // pack keys rule.processBuilder.*
    re: /ProcessBuilder/,
    label: "ProcessBuilder",
    meaning:
      "An alternative route to starting a process, used where a direct Runtime call is filtered.",
    significance: "execution",
  },
  {
    id: "systemProperty", // pack keys rule.systemProperty.*
    re: /@java\.lang\.System@getProperty|getProperties\(\)/,
    label: "system property read",
    meaning:
      "Reads JVM properties such as the OS name or user. Frequently a probe rather than an attack: it produces evidence that the expression evaluated at all.",
    significance: "reconnaissance",
  },
  {
    id: "actionContext", // pack keys rule.actionContext.*
    re: /#context\s*(?:\[|\.)/,
    label: "action context access",
    meaning:
      "#context reaches the map holding the request, response and session objects, which is how a payload gets from expression evaluation to writing output the attacker can see.",
    significance: "reconnaissance",
  },
  {
    id: "responseObject", // pack keys rule.responseObject.*
    re: /HttpServletResponse|getWriter\(\)|ServletActionContext/,
    label: "response object access",
    meaning:
      "Reaching the response is how results are returned. A payload that reads something and cannot return it has learned nothing.",
    significance: "reconnaissance",
  },
  {
    id: "outputCapture", // pack keys rule.outputCapture.*
    re: /getInputStream\(\)|IOUtils|InputStreamReader/,
    label: "output capture",
    meaning:
      "Reads the output of a started process so it can be sent back in the response.",
    significance: "reconnaissance",
  },
  {
    id: "multipart", // pack keys rule.multipart.*
    re: /multipart\/form-data/,
    label: "multipart content type",
    meaning:
      "A Content-Type value. Characteristic of the 2017 file-upload parser flaw, where the header itself was evaluated when parsing failed.",
    significance: "structural",
  },
  {
    id: "redirectPrefix", // pack keys rule.redirectPrefix.*
    re: /redirect:|redirectAction:/,
    label: "redirect prefix",
    meaning:
      "Struts result prefixes that were themselves evaluated as expressions, making the destination of a redirect an execution vector.",
    significance: "structural",
  },
  {
    id: "altDelimiter", // pack keys rule.altDelimiter.*
    re: /\$\{[\s\S]*?\}/,
    label: "alternative expression delimiter",
    meaning:
      "${...} is evaluated in some contexts where %{...} is not. Its presence suggests the sender was trying more than one evaluation path.",
    significance: "structural",
  },
];

/**
 * Advisory families. Identified by characteristic MARKERS, and reported as
 * "consistent with" rather than "is" - a payload's shape suggests a family but
 * does not prove which flaw was being aimed at, and several overlap.
 */
function matchAdvisories(input: string, findings: Finding<EngineText>[]): AdvisoryMatch<EngineText>[] {
  const has = (label: string) => findings.some((f) => f.label.text === label); // matched on the English label, as before
  const out: AdvisoryMatch<EngineText>[] = []; // each family's sentences with their ids

  if (has("multipart content type") && has("OGNL expression delimiter")) {
    out.push({
      id: "S2-045 / S2-046 (CVE-2017-5638)",
      what: say("adv.s2045.what", "The Jakarta multipart parser evaluated the Content-Type header when it failed to parse it. Widely exploited in 2017 and the flaw behind several very large breaches."), // the 2017 parser flaw
      vector: say("adv.s2045.vector", "Content-Type request header"), // where it was carried
    });
  }
  if (has("member-access manipulation") || has("static method access flag")) {
    out.push({
      id: say("adv.memberAccess.id", "the member-access family (S2-045, S2-046, S2-057 and others)"), // a family described in words
      what: say("adv.memberAccess.what", "A group of issues sharing one shape: reach OGNL's own restriction object, disable it, then call whatever you like. Apache's fixes repeatedly tightened what an expression may touch."), // the member-access family
      vector: say("adv.memberAccess.vector", "wherever the application evaluated attacker-controlled input"), // where it was carried
    });
  }
  if (has("redirect prefix")) {
    out.push({
      id: "S2-057 (CVE-2018-11776)",
      what: say("adv.s2057.what", "Namespace and result values were evaluated as expressions when certain configuration was in use, making a URL path an execution vector."), // the 2018 namespace flaw
      vector: say("adv.s2057.vector", "URL path or action namespace"), // where it was carried
    });
  }
  return out;
}

/** Decode a payload. Nothing here evaluates any part of the input. */
export function decodeOgnl(input: string): DecodeResult {
  return plainText(decodeOgnlLocalisable(input)); // the page's reading with every sentence as its English
}

/**
 * The same reading with every sentence as an EngineText, for the page (02/11/2026).
 * @param input the payload as pasted
 * @returns the reading, sentences with ids
 */
export function decodeOgnlLocalisable(input: string): DecodeResult<EngineText> {
  const text = (input ?? "").trim();
  const findings: Finding<EngineText>[] = []; // each finding's label and meaning with their ids

  if (!text) {
    return {
      looksLikeOgnl: false,
      findings: [],
      advisories: [],
      summary: say("summary.empty", "Nothing to read. Paste a payload from a log entry."), // nothing pasted
      hasEscape: false,
      hasExecution: false,
      caveats: [],
    };
  }

  for (const rule of RULES) {
    const m = rule.re.exec(text);
    if (!m) continue;
    const frag = m[0].length > 120 ? m[0].slice(0, 117) + "..." : m[0];
    findings.push({
      label: say(`rule.${rule.id}.label`, rule.label), // the rule's label, by its id
      fragment: frag,
      meaning: say(`rule.${rule.id}.meaning`, rule.meaning), // the rule's meaning, by its id
      significance: rule.significance,
    });
  }

  const hasEscape = findings.some((f) => f.significance === "sandbox-escape");
  const hasExecution = findings.some((f) => f.significance === "execution");
  const looksLikeOgnl = findings.some((f) => f.significance === "structural") || hasEscape || hasExecution;

  let summary: EngineText; // the summary, with its id
  if (!looksLikeOgnl) {
    summary = say("summary.none", // nothing recognised
      "No OGNL constructs recognised. This may be an unrelated string, an encoded payload that needs decoding first, or a form this tool does not know.");
  } else if (hasEscape && hasExecution) {
    summary = say("summary.both", // escape and execution
      "This has both halves of a working attempt: something that tries to disable the expression sandbox, and something that tries to run a command. Treat it as a genuine exploitation attempt rather than a scan, and establish whether the request was blocked and what the application did with it.");
  } else if (hasExecution) {
    summary = say("summary.execution", // execution alone
      "An execution primitive is present without an obvious sandbox escape. On a patched runtime the call would be refused, which makes this more likely a scanner working through a list than a payload tailored to this target.");
  } else if (hasEscape) {
    summary = say("summary.escape", // escape alone
      "Sandbox manipulation without an execution call. Often the first stage of a two-part attempt, or a probe checking whether expressions evaluate at all before anything expensive is sent.");
  } else {
    summary = say("summary.probe", // syntax alone
      "Expression syntax is present but nothing reaches beyond it. Most commonly a probe testing whether input is evaluated - which is worth knowing, because the answer determines whether anything else matters.");
  }

  const caveats = [ // the three caveats, each with its id
    say("caveat.syntax", "This reads syntax. It cannot tell you whether the request was blocked, whether the application evaluated it, or whether it succeeded - those answers are in the WAF event and the application log, not in the payload."), // what it cannot tell
    say("caveat.absence", "Absence of a recognised construct is not absence of risk. Payloads are routinely URL-encoded, double-encoded or split across parameters; decode first, then read."), // absence is not safety
    say("caveat.families", "Advisory families are reported as consistent with the payload's shape, not as identification. Several share a shape, and a payload proves what was attempted rather than what was present."), // families are not identification
  ];

  return {
    looksLikeOgnl,
    findings,
    advisories: matchAdvisories(text, findings),
    summary,
    hasEscape,
    hasExecution,
    caveats,
  };
}
