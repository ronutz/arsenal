// ============================================================================
// src/lib/tools/zscaler-ssl-bypass-planner/compute.ts
// ----------------------------------------------------------------------------
// THE ZIA SSL BYPASS PLANNER ENGINE.
//
// Turns a list of applications/destinations into a deterministic TLS
// inspection plan, encoding the documented Zscaler mechanics (live-verified
// 2026-07-21 in this program's BUILD-GATEs):
//   * certificate-pinning applications fail closed under interception and
//     must be exempted - via the Client Connector's application/process
//     bypasses when an agent controls the path (traffic never enters the
//     tunnel), or via a policy Do Not Inspect rule at the Edge otherwise;
//   * governance categories (health, finance, legal mandates) stay sealed
//     by policy Do Not Inspect;
//   * everything else defaults to Inspect - the content engines (malware,
//     sandbox, DLP, activity-level app control) only see inspected flows;
//   * every bypass is a priced blind spot, and uninspected flows keep only
//     the outside backstops: the Untrusted Server Certificates action
//     (block resets the TCP connection), OCSP via stapling, the Minimum
//     TLS Version floor, and Block No-SNI. Those settings exist only on a
//     Do Not Inspect rule set to Evaluate Other Policies; Bypass Other
//     Policies offers none of them and also skips URL Filtering and Cloud
//     App Control (re-read 2026-10-26 on help.zscaler.com/zia/
//     configuring-ssltls-inspection-policy), so the planner recommends
//     Evaluate Other Policies for every policy exemption;
//   * SSL policy rules evaluate in ascending order, first match - so the
//     Do Not Inspect carve-outs belong at high order, above the Inspect
//     body.
//
// The asset grammar is a deliberate teaching subset (pinning, governance
// category, path control); real bypass planning also weighs user scopes,
// locations, and application specifics. Pure and local: nothing evaluated,
// nothing contacted (D-19 comments throughout).
//
// Grammar (one asset per line):
//   <name> | pinned|clean | regulated|general | agent|no-agent
// Lines starting with # are comments.
//
// PAGE LANGUAGE (02/11/2026): every rationale, blind spot, backstop, note and
// error is built as an EngineText (src/lib/tools/engine-text.ts): a stable id,
// the English as before, and its values. runLocalisable() returns them as such
// for the page (pack keys tools.zscaler-ssl-bypass-planner.engine.<id>); run()
// returns plainText() of the same reading, and parseAssets() throws the same
// errors with the same messages (each carrying its sentence), so the API, the
// share spec and the golden vectors are unchanged.
// ============================================================================

import { say, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

/** One parsed asset. */
export interface SslAsset {
  name: string;
  pinned: boolean; // certificate-pinning application?
  regulated: boolean; // governance category that must stay sealed?
  agent: boolean; // does Client Connector control this path?
  raw: string;
}

/** The verdict classes the planner can assign. */
export type PlanVerdict = "inspect" | "dni-policy" | "zcc-bypass";

/** S is string in the API's reading and EngineText in the page's (runLocalisable). */
export interface PlanRow<S = string> {
  name: string;
  verdict: PlanVerdict;
  /** Sourced, human-readable reasoning steps for this asset. */
  rationale: S[]; // each a sentence
  /** What goes blind for this asset (empty when inspected). */
  blindSpots: S[]; // each a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface PlanResult<S = string> {
  rows: PlanRow<S>[]; // each asset's plan
  /** Counts by verdict, for the summary line. */
  counts: Record<PlanVerdict, number>;
  /** The backstop checklist - emitted whenever at least one asset is uninspected. */
  backstops: S[]; // each a sentence
  /** Standing notes (ordering doctrine, teaching-subset honesty). */
  notes: S[]; // each a sentence
}

// Blind-spot ledger shared by both bypass verdicts: the content engines
// that only ever see inspected flows (wave-1b verified framing).
const BLIND_SPOTS: EngineText[] = [
  say("blind.malware", "No malware analysis or Sandbox detonation of payloads inside this flow."), // no malware analysis
  say("blind.dlp", "No DLP content matching inside this flow - dictionaries, EDM, and IDM never see it."), // no DLP
  say("blind.appControl", "App control degrades from activity-level verbs to name-level identification (SNI only)."), // app control by name only
];

// The documented outside backstops for uninspected traffic.
const BACKSTOPS: EngineText[] = [
  say("backstop.untrusted", "Untrusted Server Certificates action: decide whether flows failing certificate validation are allowed or blocked (block resets the TCP connection)."), // untrusted certificates
  say("backstop.ocsp", "OCSP revocation checking via stapling, folded into that validation."), // OCSP
  say("backstop.minTls", "Minimum TLS Version floor: block protocol versions below the line."), // minimum TLS
  say("backstop.noSni", "Block No-SNI: refuse flows whose ClientHello names no server at all."), // no SNI
];

/** Parse the asset list; every throw is a helpful, line-anchored error. */
export function parseAssets(text: string): SslAsset[] {
  const assets: SslAsset[] = [];
  const seen = new Set<string>();
  const lines = text.split(/\r?\n/);

  lines.forEach((line, i) => {
    const t = line.trim();
    const lineNo = String(i + 1); // the line number, for the messages
    if (t === "" || t.startsWith("#")) return;
    const parts = t.split("|").map((p) => p.trim());
    if (parts.length !== 4)
      throw engineError(say("err.fields", // not four fields
        `Line ${lineNo}: expected 4 fields - <name> | pinned|clean | regulated|general | agent|no-agent.`, { line: lineNo },
      ));
    const [name, pinTok, regTok, agentTok] = parts;
    if (!name) throw engineError(say("err.noName", `Line ${lineNo}: the asset needs a name.`, { line: lineNo })); // no name
    const key = name.toLowerCase();
    if (seen.has(key)) throw engineError(say("err.twice", `Line ${lineNo}: asset "${name}" appears twice - one line per asset.`, { line: lineNo, name })); // repeated
    seen.add(key);

    const pin = pinTok.toLowerCase();
    if (pin !== "pinned" && pin !== "clean")
      throw engineError(say("err.pin", `Line ${lineNo}: the pinning field must be "pinned" or "clean" (got "${pinTok}").`, { line: lineNo, value: pinTok })); // a bad pinning value
    const reg = regTok.toLowerCase();
    if (reg !== "regulated" && reg !== "general")
      throw engineError(say("err.category", `Line ${lineNo}: the category field must be "regulated" or "general" (got "${regTok}").`, { line: lineNo, value: regTok })); // a bad category
    const ag = agentTok.toLowerCase();
    if (ag !== "agent" && ag !== "no-agent")
      throw engineError(say("err.path", `Line ${lineNo}: the path field must be "agent" or "no-agent" (got "${agentTok}").`, { line: lineNo, value: agentTok })); // a bad path value

    assets.push({ name, pinned: pin === "pinned", regulated: reg === "regulated", agent: ag === "agent", raw: t });
  });

  if (assets.length === 0)
    throw engineError(say("err.empty", "Paste at least one asset line: <name> | pinned|clean | regulated|general | agent|no-agent")); // nothing pasted
  return assets;
}

/** Plan one asset - the deterministic decision tree, every step sourced in prose. */
function planOne(a: SslAsset): PlanRow<EngineText> {
  const pinning = say("why.pinning", "Certificate-pinning application: it will not accept a certificate regenerated under the inspection CA and fails closed under interception."); // the pinning reason, said in both pinned branches
  // -- Branch 1: certificate pinning. The app will never accept a regenerated
  //    leaf; it fails closed under interception and MUST be exempted.
  if (a.pinned) {
    if (a.agent) {
      return {
        name: a.name,
        verdict: "zcc-bypass",
        rationale: [
          pinning, // pinned
          say("why.zccBypass", "The Client Connector controls this path, so the cleanest exemption is a ZCC application/process bypass - the traffic never enters the tunnel at all."), // the agent's bypass
          say("why.depth", "Defense in depth: pair it with a destination-scoped Do Not Inspect policy rule at the Edge, so paths that reach ZIA without the agent stay exempt too."), // and a DNI rule
        ],
        blindSpots: BLIND_SPOTS,
      };
    }
    return {
      name: a.name,
      verdict: "dni-policy",
      rationale: [
        pinning, // pinned
        say("why.dniEdge", "No agent controls this path, so the exemption lives at the Edge: a destination-scoped Do Not Inspect rule in the SSL Inspection policy, set to Evaluate Other Policies so the outside backstops and the web policies still apply."), // a DNI rule at the Edge
      ],
      blindSpots: BLIND_SPOTS,
    };
  }

  // -- Branch 2: governance category. Policy or law says this stays sealed.
  if (a.regulated) {
    return {
      name: a.name,
      verdict: "dni-policy",
      rationale: [
        say("why.governance", "Governance category: policy or regulation requires this traffic to stay sealed."), // regulated
        say("why.dniCategory", "Exempt via a Do Not Inspect rule scoped to the category or destinations, set to Evaluate Other Policies - and keep the outside backstops strict, because the wrapper is now the whole defense."), // a DNI rule by category
      ],
      blindSpots: BLIND_SPOTS,
    };
  }

  // -- Branch 3: default. Inspect - the content engines only see inspected flows.
  return {
    name: a.name,
    verdict: "inspect",
    rationale: [
      say("why.inspect", "No pinning, no governance mandate: inspect."), // inspect
      say("why.feeds", "Inspection is what feeds every content engine - malware analysis, Sandbox, DLP, and activity-level app control all operate on the decrypted stream."), // what inspection feeds
    ],
    blindSpots: [],
  };
}

/** Run the planner over the whole asset list. */
export function run(text: string): PlanResult {
  return plainText(runLocalisable(text)); // the same reading, sentences as their English (the API's and the vectors')
} // run

/** The page's reading: the same as run(), with every sentence an EngineText (id, English, values). */
export function runLocalisable(text: string): PlanResult<EngineText> {
  const assets = parseAssets(text);
  const rows = assets.map(planOne);
  const counts: Record<PlanVerdict, number> = { inspect: 0, "dni-policy": 0, "zcc-bypass": 0 };
  for (const r of rows) counts[r.verdict]++;

  const anyBypass = counts["dni-policy"] + counts["zcc-bypass"] > 0;
  const notes: EngineText[] = []; // each note with its id

  if (anyBypass) {
    notes.push(say("note.order", // rule order
      "Rule ordering: SSL Inspection policy rules evaluate in ascending order, first match - place the Do Not Inspect carve-outs at high order, above the Inspect body, or a broad Inspect rule shadows them.",
    ));
    notes.push(say("note.notTrusted", // not trusted
      '"Do Not Inspect" never means "trusted" - it means judged from the outside only. Review the bypass set on a calendar, not on complaints.',
    ));
    // The two forms of Do Not Inspect, and why the backstops below depend on the choice.
    notes.push(say("note.twoForms", // the two forms
      "Do Not Inspect comes in two forms. Evaluate Other Policies keeps the backstops below and the web policies (URL Filtering, Cloud App Control) in force; Bypass Other Policies offers no backstops and skips those web policies too. Traffic bypassed at the Client Connector never reaches the Edge, so neither form applies to it.",
    ));
  } else {
    notes.push(say("note.allInspect", "Every asset inspects: no bypass ledger, no backstop debt. The content engines see everything here.")); // all inspected
  }
  notes.push(say("note.subset", // the teaching subset
    "Teaching subset: this planner weighs pinning, governance category, and path control. Real bypass planning also scopes by users, groups, and locations - the decision logic is the same; the criteria list is longer.",
  ));

  return { rows, counts, backstops: anyBypass ? BACKSTOPS : [], notes };
}
