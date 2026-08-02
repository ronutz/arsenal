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

/** Where the expression is being used, which changes what it must return. */
export type ExpressionContext = "attribute-mapping" | "issuance-criterion";

export interface Part {
  /** The fragment recognised. */
  fragment: string;
  /** What it does. */
  meaning: string;
}

export interface Diagnostic {
  severity: "note" | "caution";
  message: string;
}

export interface ExplainResult {
  context: ExpressionContext;
  /** Recognised constructs in order of appearance. */
  parts: Part[];
  /** What the expression is expected to produce in this context. */
  expects: string;
  /** Observations about the expression as written. */
  diagnostics: Diagnostic[];
  /** True when nothing at all was recognised. */
  empty: boolean;
}

interface Rule {
  re: RegExp;
  meaning: string;
}

const RULES: Rule[] = [
  {
    re: /#this\.get\(\s*"([^"]+)"\s*\)/g,
    meaning:
      'Reads the attribute named in the quotes from the incoming set. Returns null if the attribute is absent, which is the single most common cause of an expression failing in production but not in test - test directories tend to be tidier than real ones.',
  },
  {
    re: /#this\.get\(\s*"([^"]+)"\s*\)\s*==\s*null/g,
    meaning:
      "An explicit null check. Present in every expression that survives contact with real directory data, because absent is not the same as empty and both occur.",
  },
  {
    re: /\.toString\(\)/g,
    meaning:
      "Converts the value to a string. Needed because attribute values arrive as objects, and calling a string method on one without this fails at runtime rather than at save time.",
  },
  {
    re: /\.toLowerCase\(\)|\.toUpperCase\(\)/g,
    meaning:
      "Case normalisation, usually applied to an email address or username before it is compared or sent onward.",
  },
  {
    re: /\.substring\(|\.replaceAll\(|\.replace\(|\.trim\(|\.split\(/g,
    meaning:
      "String manipulation. Frequently used to strip a domain from a username, cut a prefix from a group name, or tidy whitespace that a directory has been carrying since 2004.",
  },
  {
    re: /\.contains\(|\.startsWith\(|\.endsWith\(|\.matches\(/g,
    meaning:
      "A membership or pattern test. In an issuance criterion this is usually the whole decision; in a mapping it is usually feeding a conditional.",
  },
  {
    re: /\?[^:]{0,80}:/g,
    meaning:
      "A conditional. The value before the colon is used when the test is true and the value after it when false - which is how a default is supplied for an attribute that may be missing.",
  },
  {
    re: /@java\.lang\.String@|@java\.util\./g,
    meaning:
      "A static Java method call. Legitimate and sometimes necessary here, and also the construct that makes expression authoring a privileged operation: static access is the difference between reading attributes and reaching the class library.",
  },
  {
    re: /#\{[^}]*\}/g,
    meaning:
      "A map literal. Used to translate one set of values into another - directory group names into application role names, for example - without a chain of conditionals.",
  },
  {
    re: /\.\{[^}]*\}|\.\{\?[^}]*\}/g,
    meaning:
      "A projection or selection over a collection: transform every element, or keep the ones matching a test. The usual way to handle multi-valued attributes such as group membership.",
  },
  {
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
  const text = (input ?? "").trim();
  const parts: Part[] = [];
  const diagnostics: Diagnostic[] = [];

  if (!text) {
    return {
      context,
      parts: [],
      expects:
        context === "issuance-criterion"
          ? "A boolean. The criterion permits issuance when the expression is true."
          : "A value for the mapped attribute.",
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
      parts.push({ fragment: frag, meaning: rule.meaning });
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
      message: `Reads ${uniqueGets.length === 1 ? "an attribute" : `${uniqueGets.length} attributes`} (${uniqueGets.join(", ")}) with no null check. If any of them is ever absent the expression fails at runtime, and directories are less consistent than the accounts used to test them.`,
    });
  }
  if (/@java\./.test(text)) {
    diagnostics.push({
      severity: "caution",
      message:
        "Calls a static Java method. This is supported and sometimes the right answer, and it is also why expression authoring is a separate administrative role: the same construct that formats a date can reach a great deal more.",
    });
  }
  if (context === "issuance-criterion" && !/[<>=!]|contains|matches|startsWith|endsWith/.test(text)) {
    diagnostics.push({
      severity: "caution",
      message:
        "An issuance criterion should evaluate to true or false, and nothing here looks like a comparison. A criterion that returns a value rather than a boolean will not behave as intended.",
    });
  }
  if (context === "attribute-mapping" && /^\s*#this\.get\(\s*"[^"]+"\s*\)\s*$/.test(text)) {
    diagnostics.push({
      severity: "note",
      message:
        "This maps one attribute straight through with no transformation. That is legitimate, and it is usually also achievable without an expression at all - which is worth preferring, because a mapping anyone can read beats an expression only the expression role can edit.",
    });
  }
  if (text.length > 400) {
    diagnostics.push({
      severity: "note",
      message:
        "This is long for an expression. Long expressions are hard to review and harder to hand over, and the logic in them is invisible to everyone without the expression role - which includes most of the people who will one day be debugging it.",
    });
  }

  return {
    context,
    parts,
    expects:
      context === "issuance-criterion"
        ? "A boolean. The criterion permits issuance when the expression evaluates true, and denies it otherwise."
        : "A value for the mapped attribute, which is sent onward in the assertion or token.",
    diagnostics,
    empty: parts.length === 0,
  };
}
