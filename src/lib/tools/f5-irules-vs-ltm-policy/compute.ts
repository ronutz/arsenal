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
//
// PAGE LANGUAGE (2026-11-02, batch H7): every reason, blocker, summary line,
// strategy semantics, note and error is built as an EngineText
// (src/lib/tools/engine-text.ts): a stable id, the English exactly as before,
// and its values as ICU arguments. runLocalisable() returns them as such for
// the page (pack keys tools.f5-irules-vs-ltm-policy.engine.<id>); run(), the
// API's and the golden vectors' function, returns plainText() of the same
// reading, so the API's JSON is byte for byte what it was. Thrown errors keep
// their class and message and carry their sentence. Strategy names, the
// precedence head and the policy sketch are tmsh syntax and stay as they are.
// ============================================================================

import { parseWhenBlocksShared as parseWhenBlocks, stripCommentsShared as stripComments } from "../f5-irules-command-context/compute";
import { say, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids (2026-11-02)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Verdict = "policy-expressible" | "verify-on-version" | "irule-required";

/** One when block's verdict. S: string in the API's reading, EngineText in the page's (2026-11-02). */
export interface BlockVerdict<S = string> {
  event: string;
  line: number;
  verdict: Verdict;
  reasons: S[]; // why it maps (or needs checking)
  blockers: S[]; // why it stays an iRule
  policySketch?: string;
}

/** The reading. S: string in the API's reading, EngineText in the page's (2026-11-02). */
export interface PolicyCompareResult<S = string> {
  ok: boolean;
  mode: "rule" | "strategies";
  blocks?: BlockVerdict<S>[]; // one per when block
  summary?: S[]; // the summary lines
  strategies?: { name: string; semantics: S }[]; // the strategies mode's semantics
  precedenceHead?: string[];
  notes: S[]; // notes
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

/** Hard blockers with the reasons the classifier reports; `id` is the reason's pack key, engine.blocker.<id> (2026-11-02). */
const BLOCKERS: Array<{ id: string; re: RegExp; why: string }> = [
  { id: "table", re: /\b(table|session)\s/, why: "table/session state: policies have no shared-state store" }, // shared state
  { id: "persist", re: /\bpersist\s/, why: "persist command: persistence selection stays in iRules or profiles" }, // persistence
  { id: "after", re: /\bafter\s+\d/, why: "after timers: policies have no scheduling" }, // timers
  { id: "collect", re: /\bHTTP::(collect|payload)\b/, why: "payload collection: policy conditions match headers and URI parts, not collected bodies" }, // bodies
  { id: "sideband", re: /\b(connect|send|recv)\s/, why: "sideband connection commands: no policy equivalent" }, // sideband
  { id: "loops", re: /\b(foreach|while|for)\s*\{?/, why: "Tcl loops: policy rules are single-shot condition/action pairs" }, // loops
  { id: "proc", re: /\bproc\s/, why: "Tcl procedures: policies are declarative" }, // procedures
  { id: "regex", re: /\b(regexp|regsub)\b/, why: "regex logic: the fetched policy grammar matches with equals, contains, starts-with, ends-with and value lists" }, // regex
  { id: "localVars", re: /(^|[^:])\bset\s+(?!::)/m, why: "local variables: policies have no variables; tcl: substitution inside an action is the narrow documented exception" }, // local variables
  { id: "globalVars", re: /\$::|set\s+::/, why: "global variables: an iRule construct, and one that demotes CMP per the compatibility page" }, // global variables
];

const POLICY_EVENTS = new Set(["HTTP_REQUEST", "HTTP_RESPONSE"]);

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

function classifyBlock(event: string, body: string, line: number): BlockVerdict<EngineText> {
  const reasons: EngineText[] = []; // in order
  const blockers: EngineText[] = []; // in order

  if (!POLICY_EVENTS.has(event)) {
    return {
      event,
      line,
      verdict: "irule-required",
      reasons: [],
      blockers: [
        say("blocker.event", `event ${event}: the verified policy grammar operates at the HTTP request/response events its examples target; logic hooked to other events stays in iRules`, { event }), // pack key engine.blocker.event
      ],
    };
  }

  for (const b of BLOCKERS) {
    if (b.re.test(body)) blockers.push(say(`blocker.${b.id}`, b.why)); // pack key engine.blocker.<id>
  }

  let hasVerify = false;
  for (const cmd of VERIFY_SET) {
    if (body.includes(cmd)) {
      hasVerify = true;
      reasons.push(
        say("reason.verify", `${cmd}: plausibly covered by policy conditions/actions on current versions, but not demonstrated in the sources this tool verified; check your version's condition and action lists before migrating`, { cmd }), // pack key engine.reason.verify (the command name as it is)
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

  if (reads.length > 0) reasons.push(say("reason.conditions", `conditions map onto ${reads.join(", ")} operands (http-uri, http-header, http-cookie selectors in the policy grammar)`, { reads: reads.join(", ") })); // pack key engine.reason.conditions (the command names as they are)
  if (usesPool) reasons.push(say("reason.pool", "pool selection maps onto the forward-to-pool action")); // pack key engine.reason.pool
  if (usesReset) reasons.push(say("reason.reset", "connection rejection maps onto the forward reset action the shellshock example uses")); // pack key engine.reason.reset
  if (usesLog) reasons.push(say("reason.log", "logging maps onto the log write action, tcl: substitution included, as the examples show")); // pack key engine.reason.log
  if (usesHeaderWrite) reasons.push(say("reason.headerWrite", "header rewriting maps onto the http-header replace/insert action the x-forwarded-for example uses")); // pack key engine.reason.headerWrite

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

/**
 * The API's reading (and the golden vectors'): every sentence in English, exactly as before 2026-11-02.
 * @param input an iRule, or the word "strategies"
 * @returns the reading; throws an Error (carrying its sentence) for empty input or no when blocks
 */
export function run(input: string): PolicyCompareResult {
  return plainText(runLocalisable(input)); // the same reading, sentences as their English
} // run

/**
 * The page's reading: the same as run(), with every sentence an EngineText (id, English, values).
 * @param input an iRule, or the word "strategies"
 * @returns the reading; throws as run() does
 */
export function runLocalisable(input: string): PolicyCompareResult<EngineText> {
  const text = (input ?? "").trim();

  if (!text) {
    throw engineError(say("err.empty", 'Paste an iRule to classify, or the word "strategies" for the matching-strategy semantics.')); // pack key engine.err.empty
  }

  if (/^(strategies|strategy)$/i.test(text)) {
    return {
      ok: true,
      mode: "strategies",
      strategies: [
        {
          name: "first-match",
          semantics:
            say("strategy.first-match", "Terminates the matching engine on the first condition that matches and executes that rule's actions. When multiple rules match simultaneously, the rule's ordinal breaks the tie, lower value first."), // pack key engine.strategy.first-match
        },
        {
          name: "all-match",
          semantics: say("strategy.all-match", "Executes the actions for all conditions that match, continuing evaluation as traffic flows."), // pack key engine.strategy.all-match
        },
        {
          name: "best-match",
          semantics:
            say("strategy.best-match", "For situations when multiple conditions match simultaneously; allows the more specific match to win. Equal condition counts fall through to the strategy's precedence table, where a lower ordinal is more significant."), // pack key engine.strategy.best-match
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
        say("note.strategies", "Strategy semantics verbatim from the ltm policy-strategy reference; the precedence head reproduces the built-in table's ordering, and user-defined strategies exist precisely for organisations whose idea of specificity differs."), // pack key engine.note.strategies
      ],
    };
  }

  const { blocks: raw } = parseWhenBlocks(stripComments(text));
  if (raw.length === 0) {
    throw engineError(say("err.noBlocks", 'No "when EVENT { ... }" blocks found. Paste an iRule, or "strategies".')); // pack key engine.err.noBlocks
  }

  const blocks = raw.map((b) => classifyBlock(b.event, b.body, b.line));

  const counts = { "policy-expressible": 0, "verify-on-version": 0, "irule-required": 0 } as Record<Verdict, number>;
  for (const b of blocks) counts[b.verdict]++;

  const summary: EngineText[] = []; // in order
  if (counts["policy-expressible"] > 0) {
    summary.push(
      say("summary.expressible", `${counts["policy-expressible"]} block(s) map cleanly onto the verified policy grammar. The payoff the sources describe: LTM Policy is the highly performant layer that, unlike iRules, does not require programming, and none of the iRule CMP-demotion hazards exist inside a policy.`, { count: String(counts["policy-expressible"]) }), // pack key engine.summary.expressible
    );
  }
  if (counts["verify-on-version"] > 0) {
    summary.push(
      say("summary.verify", `${counts["verify-on-version"]} block(s) look expressible but lean on conditions or actions the verified sources did not demonstrate; confirm them against your version's policy condition and action lists before migrating.`, { count: String(counts["verify-on-version"]) }), // pack key engine.summary.verify
    );
  }
  if (counts["irule-required"] > 0) {
    summary.push(say("summary.irule", `${counts["irule-required"]} block(s) belong in iRules, for the named blockers on each card. That is what iRules are for.`, { count: String(counts["irule-required"]) })); // pack key engine.summary.irule
  }
  summary.push(
    say("summary.mechanics", "Migration mechanics per the Getting Started manual: build the policy as a draft, publish it, then attach the published policy to the virtual server; the vendor ships its examples in both policy and iRule form for exactly this comparison."), // pack key engine.summary.mechanics
  );

  return { ok: true, mode: "rule", blocks, summary, notes: [] };
}
