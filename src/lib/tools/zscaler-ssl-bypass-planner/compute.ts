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
//     TLS Version floor, and Block No-SNI;
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
// ============================================================================

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

export interface PlanRow {
  name: string;
  verdict: PlanVerdict;
  /** Sourced, human-readable reasoning steps for this asset. */
  rationale: string[];
  /** What goes blind for this asset (empty when inspected). */
  blindSpots: string[];
}

export interface PlanResult {
  rows: PlanRow[];
  /** Counts by verdict, for the summary line. */
  counts: Record<PlanVerdict, number>;
  /** The backstop checklist - emitted whenever at least one asset is uninspected. */
  backstops: string[];
  /** Standing notes (ordering doctrine, teaching-subset honesty). */
  notes: string[];
}

// Blind-spot ledger shared by both bypass verdicts: the content engines
// that only ever see inspected flows (wave-1b verified framing).
const BLIND_SPOTS = [
  "No malware analysis or Sandbox detonation of payloads inside this flow.",
  "No DLP content matching inside this flow - dictionaries, EDM, and IDM never see it.",
  "App control degrades from activity-level verbs to name-level identification (SNI only).",
];

// The documented outside backstops for uninspected traffic.
const BACKSTOPS = [
  "Untrusted Server Certificates action: decide whether flows failing certificate validation are allowed or blocked (block resets the TCP connection).",
  "OCSP revocation checking via stapling, folded into that validation.",
  "Minimum TLS Version floor: block protocol versions below the line.",
  "Block No-SNI: refuse flows whose ClientHello names no server at all.",
];

/** Parse the asset list; every throw is a helpful, line-anchored error. */
export function parseAssets(text: string): SslAsset[] {
  const assets: SslAsset[] = [];
  const seen = new Set<string>();
  const lines = text.split(/\r?\n/);

  lines.forEach((line, i) => {
    const t = line.trim();
    const where = `Line ${i + 1}`;
    if (t === "" || t.startsWith("#")) return;
    const parts = t.split("|").map((p) => p.trim());
    if (parts.length !== 4)
      throw new Error(
        `${where}: expected 4 fields - <name> | pinned|clean | regulated|general | agent|no-agent.`,
      );
    const [name, pinTok, regTok, agentTok] = parts;
    if (!name) throw new Error(`${where}: the asset needs a name.`);
    const key = name.toLowerCase();
    if (seen.has(key)) throw new Error(`${where}: asset "${name}" appears twice - one line per asset.`);
    seen.add(key);

    const pin = pinTok.toLowerCase();
    if (pin !== "pinned" && pin !== "clean")
      throw new Error(`${where}: the pinning field must be "pinned" or "clean" (got "${pinTok}").`);
    const reg = regTok.toLowerCase();
    if (reg !== "regulated" && reg !== "general")
      throw new Error(`${where}: the category field must be "regulated" or "general" (got "${regTok}").`);
    const ag = agentTok.toLowerCase();
    if (ag !== "agent" && ag !== "no-agent")
      throw new Error(`${where}: the path field must be "agent" or "no-agent" (got "${agentTok}").`);

    assets.push({ name, pinned: pin === "pinned", regulated: reg === "regulated", agent: ag === "agent", raw: t });
  });

  if (assets.length === 0)
    throw new Error("Paste at least one asset line: <name> | pinned|clean | regulated|general | agent|no-agent");
  return assets;
}

/** Plan one asset - the deterministic decision tree, every step sourced in prose. */
function planOne(a: SslAsset): PlanRow {
  // -- Branch 1: certificate pinning. The app will never accept a regenerated
  //    leaf; it fails closed under interception and MUST be exempted.
  if (a.pinned) {
    if (a.agent) {
      return {
        name: a.name,
        verdict: "zcc-bypass",
        rationale: [
          "Certificate-pinning application: it will not accept a certificate regenerated under the inspection CA and fails closed under interception.",
          "The Client Connector controls this path, so the cleanest exemption is a ZCC application/process bypass - the traffic never enters the tunnel at all.",
          "Defense in depth: pair it with a destination-scoped Do Not Inspect policy rule at the Edge, so paths that reach ZIA without the agent stay exempt too.",
        ],
        blindSpots: BLIND_SPOTS,
      };
    }
    return {
      name: a.name,
      verdict: "dni-policy",
      rationale: [
        "Certificate-pinning application: it will not accept a certificate regenerated under the inspection CA and fails closed under interception.",
        "No agent controls this path, so the exemption lives at the Edge: a destination-scoped Do Not Inspect rule in the SSL Inspection policy.",
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
        "Governance category: policy or regulation requires this traffic to stay sealed.",
        "Exempt via a Do Not Inspect rule scoped to the category or destinations - and keep the outside backstops strict, because the wrapper is now the whole defense.",
      ],
      blindSpots: BLIND_SPOTS,
    };
  }

  // -- Branch 3: default. Inspect - the content engines only see inspected flows.
  return {
    name: a.name,
    verdict: "inspect",
    rationale: [
      "No pinning, no governance mandate: inspect.",
      "Inspection is what feeds every content engine - malware analysis, Sandbox, DLP, and activity-level app control all operate on the decrypted stream.",
    ],
    blindSpots: [],
  };
}

/** Run the planner over the whole asset list. */
export function run(text: string): PlanResult {
  const assets = parseAssets(text);
  const rows = assets.map(planOne);
  const counts: Record<PlanVerdict, number> = { inspect: 0, "dni-policy": 0, "zcc-bypass": 0 };
  for (const r of rows) counts[r.verdict]++;

  const anyBypass = counts["dni-policy"] + counts["zcc-bypass"] > 0;
  const notes: string[] = [];

  if (anyBypass) {
    notes.push(
      "Rule ordering: SSL Inspection policy rules evaluate in ascending order, first match - place the Do Not Inspect carve-outs at high order, above the Inspect body, or a broad Inspect rule shadows them.",
    );
    notes.push(
      '"Do Not Inspect" never means "trusted" - it means judged from the outside only. Review the bypass set on a calendar, not on complaints.',
    );
  } else {
    notes.push("Every asset inspects: no bypass ledger, no backstop debt. The content engines see everything here.");
  }
  notes.push(
    "Teaching subset: this planner weighs pinning, governance category, and path control. Real bypass planning also scopes by users, groups, and locations - the decision logic is the same; the criteria list is longer.",
  );

  return { rows, counts, backstops: anyBypass ? BACKSTOPS : [], notes };
}
