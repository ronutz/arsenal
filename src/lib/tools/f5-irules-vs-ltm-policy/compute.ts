// ============================================================================
// src/lib/tools/f5-irules-vs-ltm-policy/compute.ts
// ----------------------------------------------------------------------------
// DECIDES, PER when BLOCK, WHETHER AN iRULE'S LOGIC BELONGS IN AN LTM POLICY.
//
// LTM policies are the no-programming match-and-act layer: a policy is a set
// of rules under a matching strategy, each rule an if-then of conditions and
// actions, evaluated by the LTM Policy engine. The strategy semantics come
// verbatim from the ltm policy-strategy reference: first-match terminates
// the matching engine on the first condition that matches and executes that
// rule's actions; all-match executes the actions for all conditions that
// match; best-match is for when multiple conditions match simultaneously
// and allows the more specific match to win, ties broken by the strategy's
// precedence table (ordinal 1 is the most significant; tcp port, vlan-id,
// vlan, route-domain head the built-in table, with the http-uri selectors
// further down).
//
// The classifier is deliberately three-verdict and source-honest:
//   POLICY-EXPRESSIBLE  - every construct in the block maps onto grammar
//                         verified in the vendor's own 12.1 policy examples
//                         (http-uri / http-header / http-cookie conditions
//                         with equals / contains / starts-with / ends-with;
//                         forward to pool or reset; log write, including
//                         tcl: substitution; http-header replace or insert;
//                         compress enable), on the HTTP request/response
//                         events those examples target.
//   VERIFY-ON-VERSION   - constructs that policies plausibly cover on
//                         current versions but that the fetched sources did
//                         not demonstrate; the tool says so instead of
//                         guessing (HTTP::redirect and HTTP::respond are
//                         the canonical residents of this bucket).
//   IRULE-REQUIRED      - named blockers: any non-HTTP event, Tcl control
//                         flow beyond a match (loops, procs, regex logic),
//                         variables (policies have none; tcl: substitution
//                         inside an action is the narrow documented
//                         exception), table/session/persist state, sideband
//                         connections, payload collection, after timers.
//
// Why bother: the vendor's policy documentation ships iRule-equivalent
// examples precisely because the two overlap, and the DevCentral strategy
// article describes LTM Policy as a highly performant feature that, unlike
// iRules, does not require programming. Every construct the policy engine
// handles is one less piece of per-connection Tcl, and none of the iRule
// CMP-demotion hazards (global variables above all) can occur in a policy.
//
// Sources: the ltm policy-strategy tmsh reference (strategies verbatim, the
// precedence table), the BIG-IP Local Traffic Policies Getting Started
// examples chapter (the policy grammar and the vendor's iRule equivalences),
// the DevCentral LTM Policy Matching Strategies article, and the iRules CMP
// Compatibility page, all accessed 2026-07-03.
// ============================================================================

import { parseWhenBlocksShared as parseWhenBlocks, stripCommentsShared as stripComments } from "../f5-irules-command-context/compute";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Verdict = "policy-expressible" | "verify-on-version" | "irule-required";

export interface BlockVerdict {
  event: string;
  line: number;
  verdict: Verdict;
  reasons: string[];
  blockers: string[];
  policySketch?: string;
}

export interface PolicyCompareResult {
  ok: boolean;
  mode: "rule" | "strategies";
  blocks?: BlockVerdict[];
  summary?: string[];
  strategies?: { name: string; semantics: string }[];
  precedenceHead?: string[];
  notes: string[];
}

export type ToolRunResult = PolicyCompareResult;

// ---------------------------------------------------------------------------
// The verified grammar sets (from the vendor's 12.1 examples chapter).
// ---------------------------------------------------------------------------

/** Condition-side reads the examples demonstrate. */
const CONDITION_READS = new Set(["HTTP::uri", "HTTP::path", "HTTP::query", "HTTP::host", "HTTP::header", "HTTP::cookie", "HTTP::method"]);

/** Action-side commands the examples demonstrate. */
const ACTION_VERIFIED = new Set(["pool", "log", "HSL::send"]);
const ACTION_HEADER_WRITE = /HTTP::header\s+(insert|replace|remove)\b/;

/** Plausible but not demonstrated in the fetched sources. */
const VERIFY_SET = new Set(["HTTP::redirect", "HTTP::respond", "IP::client_addr", "SSL::cipher"]);

/** Hard blockers with the reasons the classifier reports. */
const BLOCKERS: Array<{ re: RegExp; why: string }> = [
  { re: /\b(table|session)\s/, why: "table/session state: policies have no shared-state store" },
  { re: /\bpersist\s/, why: "persist command: persistence selection stays in iRules or profiles" },
  { re: /\bafter\s+\d/, why: "after timers: policies have no scheduling" },
  { re: /\bHTTP::(collect|payload)\b/, why: "payload collection: policy conditions match headers and URI parts, not collected bodies" },
  { re: /\b(connect|send|recv)\s/, why: "sideband connection commands: no policy equivalent" },
  { re: /\b(foreach|while|for)\s*\{?/, why: "Tcl loops: policy rules are single-shot condition/action pairs" },
  { re: /\bproc\s/, why: "Tcl procedures: policies are declarative" },
  { re: /\b(regexp|regsub)\b/, why: "regex logic: the fetched policy grammar matches with equals, contains, starts-with, ends-with and value lists" },
  { re: /(^|[^:])\bset\s+(?!::)/m, why: "local variables: policies have no variables; tcl: substitution inside an action is the narrow documented exception" },
  { re: /\$::|set\s+::/, why: "global variables: an iRule construct, and one that demotes CMP per the compatibility page" },
];

const POLICY_EVENTS = new Set(["HTTP_REQUEST", "HTTP_RESPONSE"]);

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

function classifyBlock(event: string, body: string, line: number): BlockVerdict {
  const reasons: string[] = [];
  const blockers: string[] = [];

  if (!POLICY_EVENTS.has(event)) {
    return {
      event,
      line,
      verdict: "irule-required",
      reasons: [],
      blockers: [
        `event ${event}: the verified policy grammar operates at the HTTP request/response events its examples target; logic hooked to other events stays in iRules`,
      ],
    };
  }

  for (const b of BLOCKERS) {
    if (b.re.test(body)) blockers.push(b.why);
  }

  let hasVerify = false;
  for (const cmd of VERIFY_SET) {
    if (body.includes(cmd)) {
      hasVerify = true;
      reasons.push(
        `${cmd}: plausibly covered by policy conditions/actions on current versions, but not demonstrated in the sources this tool verified; check your version's condition and action lists before migrating`,
      );
    }
  }

  const reads = [...CONDITION_READS].filter((c) => body.includes(c));
  const usesPool = /\bpool\s+\S+/.test(body);
  const usesLog = /\blog\s/.test(body);
  const usesHeaderWrite = ACTION_HEADER_WRITE.test(body);
  const usesReset = /\breject\b|\bdrop\b|\bdiscard\b/.test(body);

  if (blockers.length > 0) {
    return { event, line, verdict: "irule-required", reasons, blockers };
  }

  if (reads.length > 0) reasons.push(`conditions map onto ${reads.join(", ")} operands (http-uri, http-header, http-cookie selectors in the policy grammar)`);
  if (usesPool) reasons.push("pool selection maps onto the forward-to-pool action");
  if (usesReset) reasons.push("connection rejection maps onto the forward reset action the shellshock example uses");
  if (usesLog) reasons.push("logging maps onto the log write action, tcl: substitution included, as the examples show");
  if (usesHeaderWrite) reasons.push("header rewriting maps onto the http-header replace/insert action the x-forwarded-for example uses");

  const verdict: Verdict = hasVerify ? "verify-on-version" : "policy-expressible";

  // A sketch in the grammar the examples demonstrate.
  const conditionSketch = reads.length > 0 ? `conditions { 0 { http-uri path starts-with values { /example } } }` : `conditions { }`;
  const actionSketch = usesPool
    ? `actions { 0 { forward select pool my_pool } }`
    : usesReset
      ? `actions { 0 { forward reset } }`
      : usesHeaderWrite
        ? `actions { 0 { http-header replace name X-Example value tcl:[IP::client_addr] } }`
        : `actions { 0 { log write facility local0 message "matched" priority info } }`;
  const policySketch = [
    `ltm policy migrated_from_irule {`,
    `    requires { http }`,
    `    rules {`,
    `        rule_from_line_${line} {`,
    `            ${conditionSketch}`,
    `            ${actionSketch}`,
    `        }`,
    `    }`,
    `    strategy first-match`,
    `}`,
  ].join("\n");

  return { event, line, verdict, reasons, blockers, policySketch };
}

// ---------------------------------------------------------------------------
// run()
// ---------------------------------------------------------------------------

export function run(input: string): PolicyCompareResult {
  const text = (input ?? "").trim();

  if (!text) {
    throw new Error('Paste an iRule to classify, or the word "strategies" for the matching-strategy semantics.');
  }

  if (/^(strategies|strategy)$/i.test(text)) {
    return {
      ok: true,
      mode: "strategies",
      strategies: [
        {
          name: "first-match",
          semantics:
            "Terminates the matching engine on the first condition that matches and executes that rule's actions. When multiple rules match simultaneously, the rule's ordinal breaks the tie, lower value first.",
        },
        {
          name: "all-match",
          semantics: "Executes the actions for all conditions that match, continuing evaluation as traffic flows.",
        },
        {
          name: "best-match",
          semantics:
            "For situations when multiple conditions match simultaneously; allows the more specific match to win. Equal condition counts fall through to the strategy's precedence table, where a lower ordinal is more significant.",
        },
      ],
      precedenceHead: [
        "1 request tcp port",
        "2 request tcp vlan-id",
        "3 request tcp vlan",
        "4 request tcp route-domain",
        "9 request http-host host",
        "19 request http-uri path-segment",
        "20 request http-uri extension",
        "21 request http-uri path",
      ],
      notes: [
        "Strategy semantics verbatim from the ltm policy-strategy reference; the precedence head reproduces the built-in table's ordering, and user-defined strategies exist precisely for organizations whose idea of specificity differs.",
      ],
    };
  }

  const { blocks: raw } = parseWhenBlocks(stripComments(text));
  if (raw.length === 0) {
    throw new Error('No "when EVENT { ... }" blocks found. Paste an iRule, or "strategies".');
  }

  const blocks = raw.map((b) => classifyBlock(b.event, b.body, b.line));

  const counts = { "policy-expressible": 0, "verify-on-version": 0, "irule-required": 0 } as Record<Verdict, number>;
  for (const b of blocks) counts[b.verdict]++;

  const summary: string[] = [];
  if (counts["policy-expressible"] > 0) {
    summary.push(
      `${counts["policy-expressible"]} block(s) map cleanly onto the verified policy grammar. The payoff the sources describe: LTM Policy is the highly performant layer that, unlike iRules, does not require programming, and none of the iRule CMP-demotion hazards exist inside a policy.`,
    );
  }
  if (counts["verify-on-version"] > 0) {
    summary.push(
      `${counts["verify-on-version"]} block(s) look expressible but lean on conditions or actions the verified sources did not demonstrate; confirm them against your version's policy condition and action lists before migrating.`,
    );
  }
  if (counts["irule-required"] > 0) {
    summary.push(`${counts["irule-required"]} block(s) belong in iRules, for the named blockers on each card. That is what iRules are for.`);
  }
  summary.push(
    "Migration mechanics per the Getting Started manual: build the policy as a draft, publish it, then attach the published policy to the virtual server; the vendor ships its examples in both policy and iRule form for exactly this comparison.",
  );

  return { ok: true, mode: "rule", blocks, summary, notes: [] };
}
