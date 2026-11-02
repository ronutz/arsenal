// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/pingfederate-ognl-explainer/compute.ts
// ----------------------------------------------------------------------------
// PINGFEDERATE OGNL EXPRESSION EXPLAINER — reads an expression from an
// attribute mapping or an issuance criterion and explains it piece by piece.
//
// WHY THIS IS A DIFFERENT TOOL FROM THE INJECTION DECODER, despite the same
// language. The decoder reads hostile input found in a log. This reads
// configuration somebody wrote on purpose, in a product where expressions are
// a supported feature that has to be enabled deliberately.
//
// That deliberateness is the point worth teaching. PingFederate gates
// expression authoring behind its own administrative role, separate from the
// role that configures everything else, for one reason: an OGNL expression
// runs code on the server. Someone who can write expressions can do more than
// someone who can configure connections, which is why the two are not the same
// permission.
//
// DETERMINISTIC AND LOCAL. It parses and describes; it never evaluates. An
// expression explainer that evaluated expressions would be a code execution
// service, which is the opposite of the point.
// ============================================================================

// PAGE LANGUAGE (02/11/2026): rule meanings, the expectation line and the
// diagnostics are EngineTexts (../engine-text.ts): a stable id, the English as
// before, and their values. explainExpressionLocalisable() returns them for the
// page (pack keys tools.pingfederate-ognl-explainer.engine.<id>);
// explainExpression() returns plainText() of the same reading, so its output and
// the golden vectors are unchanged.
import { say, plainText, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

/** Where the expression is being used, which changes what it must return. */
export type ExpressionContext = "attribute-mapping" | "issuance-criterion";

/** One recognised construct. S: string (explainExpression) or EngineText (the page's reading). */
export interface Part<S = string> {
  /** The fragment recognised. */
  fragment: string;
  /** What it does. */
  meaning: S;
}

/** One observation. S as above. */
export interface Diagnostic<S = string> {
  severity: "note" | "caution";
  message: S; // the observation
}

/** The reading. S as above. */
export interface ExplainResult<S = string> {
  context: ExpressionContext;
  /** Recognised constructs in order of appearance. */
  parts: Part<S>[];
  /** What the expression is expected to produce in this context. */
  expects: S;
  /** Observations about the expression as written. */
  diagnostics: Diagnostic<S>[];
  /** True when nothing at all was recognised. */
  empty: boolean;
}

interface Rule {
  id: string; // the stable key of the rule's meaning in the pack (rule.<id>)
  re: RegExp;
  meaning: string;
}

const RULES: Rule[] = [
  {
    id: "get", // pack key rule.get
    re: /#this\.get\(\s*"([^"]+)"\s*\)/g,
    meaning:
      'Reads the attribute named in the quotes from the incoming set. Returns null if the attribute is absent, which is the single most common cause of an expression failing in production but not in test - test directories tend to be tidier than real ones.',
  },
  {
    id: "nullCheck", // pack key rule.nullCheck
    re: /#this\.get\(\s*"([^"]+)"\s*\)\s*==\s*null/g,
    meaning:
      "An explicit null check. Present in every expression that survives contact with real directory data, because absent is not the same as empty and both occur.",
  },
  {
    id: "toString", // pack key rule.toString
    re: /\.toString\(\)/g,
    meaning:
      "Converts the value to a string. Needed because attribute values arrive as objects, and calling a string method on one without this fails at runtime rather than at save time.",
  },
  {
    id: "caseNorm", // pack key rule.caseNorm
    re: /\.toLowerCase\(\)|\.toUpperCase\(\)/g,
    meaning:
      "Case normalisation, usually applied to an email address or username before it is compared or sent onward.",
  },
  {
    id: "stringManip", // pack key rule.stringManip
    re: /\.substring\(|\.replaceAll\(|\.replace\(|\.trim\(|\.split\(/g,
    meaning:
      "String manipulation. Frequently used to strip a domain from a username, cut a prefix from a group name, or tidy whitespace that a directory has been carrying since 2004.",
  },
  {
    id: "membership", // pack key rule.membership
    re: /\.contains\(|\.startsWith\(|\.endsWith\(|\.matches\(/g,
    meaning:
      "A membership or pattern test. In an issuance criterion this is usually the whole decision; in a mapping it is usually feeding a conditional.",
  },
  {
    id: "conditional", // pack key rule.conditional
    re: /\?[^:]{0,80}:/g,
    meaning:
      "A conditional. The value before the colon is used when the test is true and the value after it when false - which is how a default is supplied for an attribute that may be missing.",
  },
  {
    id: "staticCall", // pack key rule.staticCall
    re: /@java\.lang\.String@|@java\.util\./g,
    meaning:
      "A static Java method call. Legitimate and sometimes necessary here, and also the construct that makes expression authoring a privileged operation: static access is the difference between reading attributes and reaching the class library.",
  },
  {
    id: "mapLiteral", // pack key rule.mapLiteral
    re: /#\{[^}]*\}/g,
    meaning:
      "A map literal. Used to translate one set of values into another - directory group names into application role names, for example - without a chain of conditionals.",
  },
  {
    id: "projection", // pack key rule.projection
    re: /\.\{[^}]*\}|\.\{\?[^}]*\}/g,
    meaning:
      "A projection or selection over a collection: transform every element, or keep the ones matching a test. The usual way to handle multi-valued attributes such as group membership.",
  },
  {
    id: "contextRef", // pack key rule.contextRef
    re: /#attribute|#request|#session/g,
    meaning:
      "A context reference. Reaches something outside the attribute set itself, which widens what the expression depends on and therefore what can change underneath it.",
  },
];

/** Explain an expression. Nothing is evaluated. */
export function explainExpression(
  input: string,
  context: ExpressionContext,
): ExplainResult {
  return plainText(explainExpressionLocalisable(input, context)); // the page's reading with every sentence as its English
}

/**
 * The same reading with every sentence as an EngineText, for the page (02/11/2026).
 * @param input the expression as typed
 * @param context where it is used
 * @returns the reading, sentences with ids
 */
export function explainExpressionLocalisable(
  input: string,
  context: ExpressionContext,
): ExplainResult<EngineText> {
  const text = (input ?? "").trim();
  const parts: Part<EngineText>[] = []; // meanings with ids
  const diagnostics: Diagnostic<EngineText>[] = []; // messages with ids

  if (!text) {
    return {
      context,
      parts: [],
      expects:
        context === "issuance-criterion"
          ? say("expects.criterionEmpty", "A boolean. The criterion permits issuance when the expression is true.") // nothing typed, criterion
          : say("expects.mappingEmpty", "A value for the mapped attribute."), // nothing typed, mapping
      diagnostics: [],
      empty: true,
    };
  }

  for (const rule of RULES) {
    const re = new RegExp(rule.re.source, rule.re.flags);
    let m: RegExpExecArray | null;
    const seen = new Set<string>();
    while ((m = re.exec(text)) !== null) {
      const frag = m[0].length > 90 ? m[0].slice(0, 87) + "..." : m[0];
      if (seen.has(frag)) continue;
      seen.add(frag);
      parts.push({ fragment: frag, meaning: say(`rule.${rule.id}`, rule.meaning) }); // the rule's meaning, by its id
      if (!re.global) break;
    }
  }

  // ---- Diagnostics -------------------------------------------------------
  const gets = [...text.matchAll(/#this\.get\(\s*"([^"]+)"\s*\)/g)].map((m) => m[1]);
  const uniqueGets = [...new Set(gets)];
  const hasNullCheck = /==\s*null|!=\s*null/.test(text);

  if (uniqueGets.length > 0 && !hasNullCheck) {
    diagnostics.push({
      severity: "caution",
      message: uniqueGets.length === 1 // one attribute or several, one id each
        ? say("diag.noNullOne", `Reads an attribute (${uniqueGets.join(", ")}) with no null check. If any of them is ever absent the expression fails at runtime, and directories are less consistent than the accounts used to test them.`, { attrs: uniqueGets.join(", ") }) // one
        : say("diag.noNullMany", `Reads ${uniqueGets.length} attributes (${uniqueGets.join(", ")}) with no null check. If any of them is ever absent the expression fails at runtime, and directories are less consistent than the accounts used to test them.`, { count: String(uniqueGets.length), attrs: uniqueGets.join(", ") }), // several
    });
  }
  if (/@java\./.test(text)) {
    diagnostics.push({
      severity: "caution",
      message: say("diag.static", // a static call
        "Calls a static Java method. This is supported and sometimes the right answer, and it is also why expression authoring is a separate administrative role: the same construct that formats a date can reach a great deal more."),
    });
  }
  if (context === "issuance-criterion" && !/[<>=!]|contains|matches|startsWith|endsWith/.test(text)) {
    diagnostics.push({
      severity: "caution",
      message: say("diag.notBoolean", // a criterion that compares nothing
        "An issuance criterion should evaluate to true or false, and nothing here looks like a comparison. A criterion that returns a value rather than a boolean will not behave as intended."),
    });
  }
  if (context === "attribute-mapping" && /^\s*#this\.get\(\s*"[^"]+"\s*\)\s*$/.test(text)) {
    diagnostics.push({
      severity: "note",
      message: say("diag.passThrough", // a straight mapping
        "This maps one attribute straight through with no transformation. That is legitimate, and it is usually also achievable without an expression at all - which is worth preferring, because a mapping anyone can read beats an expression only the expression role can edit."),
    });
  }
  if (text.length > 400) {
    diagnostics.push({
      severity: "note",
      message: say("diag.long", // over 400 characters
        "This is long for an expression. Long expressions are hard to review and harder to hand over, and the logic in them is invisible to everyone without the expression role - which includes most of the people who will one day be debugging it."),
    });
  }

  return {
    context,
    parts,
    expects:
      context === "issuance-criterion"
        ? say("expects.criterion", "A boolean. The criterion permits issuance when the expression evaluates true, and denies it otherwise.") // criterion
        : say("expects.mapping", "A value for the mapped attribute, which is sent onward in the assertion or token."), // mapping
    diagnostics,
    empty: parts.length === 0,
  };
}
