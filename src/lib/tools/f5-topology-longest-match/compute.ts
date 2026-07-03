// ============================================================================
// src/lib/tools/f5-topology-longest-match/compute.ts
// ----------------------------------------------------------------------------
// COMPUTES THE WINNING TOPOLOGY RECORD, THE WAY BIG-IP DNS ACTUALLY DOES.
//
// The folklore says "longest match wins". The documentation says something
// sharper: Longest Match is a SORT of the record list, not the pick. The
// system (per the BIG-IP DNS Load Balancing manual) sorts the records by the
// LDNS source statement, the destination statement, and the weight; then it
// walks the sorted list and ASSIGNS each candidate destination a score from
// the FIRST record that matches it - later records for an already-scored
// destination are shadowed. The candidate with the highest score wins; ties
// round-robin. A wildcard with a big weight really can beat a /32 with a
// small one, because specificity only decides which record scores each
// candidate, never the final comparison.
//
// Input (three parts, order free):
//   * `gtm topology ldns: <source> server: <destination> { score N }` records
//     (tmsh grammar, `not` negation supported on either side);
//   * optional `gtm region` stanzas (positive region-members: subnet,
//     country, continent, isp, region - nested regions resolve);
//   * one `source ...` line declaring the LDNS attributes to evaluate
//     (ip=, country=, continent=, isp=, region=; all optional), and an
//     optional `candidates ...` line naming the destinations to score
//     (defaults to every destination the records mention).
//
// Sort ranks are implemented exactly as far as the sources verify them
// (K10721's worked examples + the 11.x manual's subnet-first sentence);
// anything the sources do not rank is placed after the verified types and
// flagged as such in the output. Honest limits beat guessed ones.
//
// Sources: the BIG-IP DNS Load Balancing manual, Topology chapter
// ("Understanding how the BIG-IP system prioritizes topology records";
// weight is called score in tmsh); K10721 (the Longest Match sorting rules:
// subnet mask length, type order, negation buckets, wildcards last, and the
// weights-govern behavior when Longest Match is disabled). Pure and offline.
// ============================================================================

import { parseTmsh, asTopLevel, asKeyValue, type ConfigNode } from "../f5-tmsh-config-explainer/compute";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One side (ldns: or server:) of a topology record. */
export interface TopoOperand {
  negated: boolean;
  kind: string; // subnet | region | country | continent | isp | datacenter | pool | (other, flagged)
  value: string;
  /** For subnets: prefix length (used for the within-type sort). */
  maskLen?: number;
  /** True for the 0.0.0.0/0 or ::/0 wildcard. */
  wildcard: boolean;
}

/** One parsed topology record with its sort explanation. */
export interface TopoRecord {
  index: number; // as-pasted order (1-based)
  line: number;
  ldns: TopoOperand;
  server: TopoOperand;
  score: number;
  order?: number;
  /** The sort bucket: 0 normal, 1 server-negation, 2 ldns-negation, 3 wildcard. */
  bucket: number;
  bucketLabel: string;
  sortNote: string;
  /** Set during evaluation. */
  matched?: boolean;
  matchNote?: string;
  scored?: string; // candidate this record scored
  shadowedBy?: number; // index of the earlier record that already scored the same candidate
}

/** A candidate destination and its assigned score. */
export interface CandidateScore {
  name: string;
  score: number;
  fromRecord?: number; // record index that scored it
  note: string;
}

export interface TopoResult {
  ok: boolean;
  mode: "evaluate" | "sorted-only";
  records: TopoRecord[];
  regions: { name: string; members: string[] }[];
  source?: Record<string, string>;
  candidates?: CandidateScore[];
  winner?: { names: string[]; score: number; tie: boolean };
  notes: string[];
}

export type ToolRunResult = TopoResult;

// ---------------------------------------------------------------------------
// Verified sort ranks. LDNS-side and server-side share the type ladder that
// K10721's examples demonstrate: subnet (longest mask first) above
// datacenter/pool, above user-defined region, above ISP, above country,
// above continent. The two K10721 examples do not order datacenter against
// pool relative to each other, so they share a rank and the tie falls
// through to the next sort key - the output says so. Types the sources do
// not rank at all (state, city, geoip-isp, ...) sit after the verified
// ladder and are flagged.
// ---------------------------------------------------------------------------

const TYPE_RANK: Record<string, number> = {
  subnet: 1,
  datacenter: 2,
  pool: 2, // shares the rank; relative order not distinguished in the cited examples
  region: 3,
  isp: 4,
  country: 5,
  continent: 6,
};
const UNRANKED = 7; // verified-unranked types: after the ladder, before wildcards
const WILDCARD_RANK = 9;

function typeRank(op: TopoOperand): number {
  if (op.wildcard) return WILDCARD_RANK;
  return TYPE_RANK[op.kind] ?? UNRANKED;
}

// ---------------------------------------------------------------------------
// Operand parsing. tmsh header shapes seen in the wild:
//   gtm topology ldns: subnet 10.0.0.0/16 server: pool /Common/POOL_A { score 100 }
//   gtm topology ldns: not country US server: datacenter /Common/DC1 { ... }
// The header tokens after `gtm topology` therefore read as:
//   ldns: [not] <kind> <value...> server: [not] <kind> <value...>
// ---------------------------------------------------------------------------

function parseOperand(tokens: string[]): TopoOperand {
  let i = 0;
  let negated = false;
  if (tokens[i] === "not") {
    negated = true;
    i++;
  }
  const kind = (tokens[i] ?? "").toLowerCase();
  const value = tokens.slice(i + 1).join(" ");
  let maskLen: number | undefined;
  let wildcard = false;
  if (kind === "subnet") {
    const m = value.match(/\/(\d{1,3})$/);
    if (m) maskLen = Number.parseInt(m[1], 10);
    if (/^0\.0\.0\.0\/0$/.test(value) || /^::\/0$/.test(value)) wildcard = true;
  }
  return { negated, kind, value, maskLen, wildcard };
}

/** Split a topology header's tail into the ldns and server operand token runs. */
function splitTopoHeader(tokens: string[]): { ldns: string[]; server: string[] } | null {
  // tokens begin after ["gtm","topology"]; expect "ldns:" ... "server:" ...
  const li = tokens.indexOf("ldns:");
  const si = tokens.indexOf("server:");
  if (li === -1 || si === -1 || si < li) return null;
  return { ldns: tokens.slice(li + 1, si), server: tokens.slice(si + 1) };
}

// ---------------------------------------------------------------------------
// Sorting (Longest Match ENABLED semantics).
// Keys, in order: negation/wildcard bucket -> ldns type rank -> ldns mask
// length (desc, subnets only) -> server type rank -> server mask length
// (desc) -> score (desc). The manual names the key order (source statement,
// destination statement, weight); K10721 supplies the bucket rules.
// ---------------------------------------------------------------------------

function bucketOf(r: { ldns: TopoOperand; server: TopoOperand }): { bucket: number; label: string } {
  const wild = r.ldns.wildcard && !r.ldns.negated;
  if (wild) return { bucket: 3, label: "wildcard (sorted last)" };
  if (r.server.negated) return { bucket: 1, label: "server-side negation (above LDNS negations and wildcards, below plain entries)" };
  if (r.ldns.negated) return { bucket: 2, label: "LDNS-side negation (above wildcards, below plain entries)" };
  return { bucket: 0, label: "plain entry" };
}

export function sortRecords(records: TopoRecord[]): TopoRecord[] {
  return [...records].sort((a, b) => {
    if (a.bucket !== b.bucket) return a.bucket - b.bucket;
    const alr = typeRank(a.ldns), blr = typeRank(b.ldns);
    if (alr !== blr) return alr - blr;
    const alm = a.ldns.maskLen ?? -1, blm = b.ldns.maskLen ?? -1;
    if (alm !== blm) return blm - alm; // longer mask first
    const asr = typeRank(a.server), bsr = typeRank(b.server);
    if (asr !== bsr) return asr - bsr;
    const asm = a.server.maskLen ?? -1, bsm = b.server.maskLen ?? -1;
    if (asm !== bsm) return bsm - asm;
    if (a.score !== b.score) return b.score - a.score; // heavier weight first
    return a.index - b.index; // stable
  });
}

// ---------------------------------------------------------------------------
// Matching. The source is a DECLARED set of LDNS attributes (this tool never
// looks anything up): ip=, country=, continent=, isp=, plus region
// memberships resolved from pasted gtm region stanzas and any region= names
// declared directly. Candidate matching on the server side is by name for
// pool/datacenter kinds, by region membership for region kinds (a candidate
// may declare its own attributes via candidates entries "name[key=value,..]").
// ---------------------------------------------------------------------------

interface SourceDecl {
  ip?: string;
  country?: string;
  continent?: string;
  isp?: string;
  regions: Set<string>;
  raw: Record<string, string>;
}

/** IPv4-in-CIDR test (numeric, no lookups). Returns null for non-IPv4 input. */
function ipv4InCidr(ip: string, cidr: string): boolean | null {
  const ipm = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  const cm = cidr.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/);
  if (!ipm || !cm) return null;
  const toInt = (a: string, b: string, c: string, d: string) =>
    ((+a << 24) | (+b << 16) | (+c << 8) | +d) >>> 0;
  const ipInt = toInt(ipm[1], ipm[2], ipm[3], ipm[4]);
  const netInt = toInt(cm[1], cm[2], cm[3], cm[4]);
  const len = +cm[5];
  if (len === 0) return true;
  const mask = len === 32 ? 0xffffffff : (~((1 << (32 - len)) - 1)) >>> 0;
  return (ipInt & mask) === (netInt & mask);
}

/** Case-insensitive, quote-insensitive name equality. */
function nameEq(a: string, b: string): boolean {
  const norm = (s: string) => s.replace(/^"|"$/g, "").replace(/^\/Common\//, "").toLowerCase();
  return norm(a) === norm(b);
}

/** Does the declared source satisfy a positive (non-negated) LDNS operand? */
function ldnsPositiveMatch(op: TopoOperand, src: SourceDecl, regions: Map<string, Set<string>>): { match: boolean; why: string } {
  switch (op.kind) {
    case "subnet": {
      if (op.wildcard) return { match: true, why: "wildcard matches every source" };
      if (!src.ip) return { match: false, why: "no source ip declared" };
      const r = ipv4InCidr(src.ip, op.value);
      if (r === null) return { match: false, why: "subnet match needs an IPv4 source ip (v1 scope)" };
      return { match: r, why: r ? `${src.ip} is inside ${op.value}` : `${src.ip} is outside ${op.value}` };
    }
    case "country":
      return src.country
        ? { match: nameEq(src.country, op.value), why: `source country ${src.country}` }
        : { match: false, why: "no source country declared" };
    case "continent":
      return src.continent
        ? { match: nameEq(src.continent, op.value), why: `source continent ${src.continent}` }
        : { match: false, why: "no source continent declared" };
    case "isp":
      return src.isp
        ? { match: nameEq(src.isp, op.value), why: `source isp ${src.isp}` }
        : { match: false, why: "no source isp declared" };
    case "region": {
      const rname = op.value.replace(/^"|"$/g, "").replace(/^\/Common\//, "");
      if ([...src.regions].some((r) => nameEq(r, rname))) return { match: true, why: `source declared in region ${rname}` };
      const members = resolveRegion(rname, regions, new Set());
      for (const m of members) {
        const [k, v] = m.split("\u0000");
        const sub = ldnsPositiveMatch({ negated: false, kind: k, value: v, wildcard: false, maskLen: undefined }, src, regions);
        if (k === "subnet") {
          const mm = v.match(/\/(\d{1,3})$/);
          sub.match = src.ip ? ipv4InCidr(src.ip, v) === true : false;
          sub.why = sub.match ? `${src.ip} is inside region member ${v}` : sub.why;
          void mm;
        }
        if (sub.match) return { match: true, why: `via region ${rname}: ${sub.why}` };
      }
      return { match: false, why: `source not in region ${rname} (by declared attributes and pasted region members)` };
    }
    default:
      return { match: false, why: `operand type "${op.kind}" is outside this tool's verified matching scope; declare the membership via region= if it applies` };
  }
}

function ldnsMatch(op: TopoOperand, src: SourceDecl, regions: Map<string, Set<string>>): { match: boolean; why: string } {
  const pos = ldnsPositiveMatch(op, src, regions);
  if (!op.negated) return pos;
  return { match: !pos.match, why: `negated: ${pos.why}` };
}

/** Server-side: does this operand cover the named candidate? */
function serverMatch(op: TopoOperand, candidate: string, regions: Map<string, Set<string>>): { match: boolean; why: string } {
  if (op.wildcard) return { match: true, why: "wildcard destination" };
  const pos = ((): { match: boolean; why: string } => {
    switch (op.kind) {
      case "pool":
      case "datacenter":
        return { match: nameEq(op.value, candidate), why: `${op.kind} name comparison` };
      case "region": {
        const rname = op.value.replace(/^"|"$/g, "").replace(/^\/Common\//, "");
        const members = resolveRegion(rname, regions, new Set());
        for (const m of members) {
          const [k, v] = m.split("\u0000");
          if ((k === "pool" || k === "datacenter") && nameEq(v, candidate)) {
            return { match: true, why: `candidate is a ${k} member of region ${rname}` };
          }
        }
        return { match: false, why: `candidate not found among region ${rname}'s pool/datacenter members` };
      }
      default:
        return { match: false, why: `server-side "${op.kind}" comparisons need pool/datacenter/region operands in v1` };
    }
  })();
  if (!op.negated) return pos;
  return { match: !pos.match, why: `negated: ${pos.why}` };
}

/** Resolve a region's members transitively (positive members only). */
function resolveRegion(name: string, regions: Map<string, Set<string>>, seen: Set<string>): Set<string> {
  const out = new Set<string>();
  if (seen.has(name)) return out; // cycle guard
  seen.add(name);
  const direct = [...regions.entries()].find(([k]) => nameEq(k, name))?.[1];
  if (!direct) return out;
  for (const m of direct) {
    const [k, v] = m.split("\u0000");
    if (k === "region") {
      for (const inner of resolveRegion(v, regions, seen)) out.add(inner);
    } else {
      out.add(m);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// run()
// ---------------------------------------------------------------------------

export function run(input: string): TopoResult {
  const text = (input ?? "").trim();
  if (!text) {
    throw new Error(
      'Paste gtm topology records (and optionally gtm region stanzas), plus a "source ip=... country=..." line to evaluate; add "candidates name1 name2" to limit the scored destinations.',
    );
  }

  // ---- pull the source / candidates control lines out of the text ---------
  let src: SourceDecl | null = null;
  const declaredCandidates: string[] = [];
  const tmshLines: string[] = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    const mSrc = t.match(/^source\b(.*)$/i);
    const mCand = t.match(/^candidates\b(.*)$/i);
    if (mSrc) {
      const raw: Record<string, string> = {};
      const regions = new Set<string>();
      for (const part of mSrc[1].trim().split(/\s+/).filter(Boolean)) {
        const [k, ...rest] = part.split("=");
        const v = rest.join("=").replace(/^"|"$/g, "");
        if (!v) throw new Error(`source: "${part}" is not key=value. Keys: ip, country, continent, isp, region.`);
        const key = k.toLowerCase();
        if (key === "region") regions.add(v);
        else if (["ip", "country", "continent", "isp"].includes(key)) raw[key] = v;
        else throw new Error(`source: unknown key "${k}". Keys: ip, country, continent, isp, region.`);
      }
      src = { ip: raw.ip, country: raw.country, continent: raw.continent, isp: raw.isp, regions, raw };
      continue;
    }
    if (mCand) {
      declaredCandidates.push(...mCand[1].trim().split(/\s+/).filter(Boolean));
      continue;
    }
    tmshLines.push(line);
  }

  // ---- parse the tmsh part -------------------------------------------------
  const parsed = parseTmsh(tmshLines.join("\n"));
  const records: TopoRecord[] = [];
  const regions = new Map<string, Set<string>>();
  const notes: string[] = [];

  let idx = 0;
  for (const node of parsed.nodes) {
    const toks = node.tokens;
    if (toks[0] === "gtm" && toks[1] === "topology") {
      const split = splitTopoHeader(toks.slice(2));
      if (!split) {
        notes.push(`line ${node.line}: a gtm topology header without the ldns:/server: shape was skipped.`);
        continue;
      }
      const ldns = parseOperand(split.ldns);
      const server = parseOperand(split.server);
      let score = 1; // GUI default weight is 1
      let order: number | undefined;
      let scoreSeen = false;
      for (const child of node.children ?? []) {
        if (child.children !== undefined) continue;
        const { key, value } = asKeyValue(child);
        if (key === "score") { const n = intOf(value); if (n !== undefined) { score = n; scoreSeen = true; } }
        else if (key === "order") order = intOf(value);
      }
      idx++;
      const b = bucketOf({ ldns, server });
      const rankBits: string[] = [];
      rankBits.push(`ldns ${ldns.wildcard ? "wildcard" : ldns.kind}${ldns.maskLen !== undefined ? `/${ldns.maskLen}` : ""} rank ${typeRank(ldns)}`);
      rankBits.push(`server ${server.kind}${server.maskLen !== undefined ? `/${server.maskLen}` : ""} rank ${typeRank(server)}`);
      if (typeRank(ldns) === UNRANKED || typeRank(server) === UNRANKED) {
        rankBits.push("contains a type outside the verified K10721 ladder - placed after the verified types, before wildcards, and flagged");
      }
      if (!scoreSeen) rankBits.push("no score in the stanza - the GUI default weight 1 assumed");
      records.push({
        index: idx,
        line: node.line,
        ldns,
        server,
        score,
        order,
        bucket: b.bucket,
        bucketLabel: b.label,
        sortNote: rankBits.join("; "),
      });
      continue;
    }
    if (toks[0] === "gtm" && toks[1] === "region") {
      const { name } = asTopLevel(node);
      const members = new Set<string>();
      for (const child of node.children ?? []) {
        if (child.children === undefined) continue;
        if (child.tokens[0] !== "region-members") continue;
        for (const m of child.children ?? []) {
          const mt = m.tokens;
          if (mt[0] === "not") {
            throw new Error(
              `gtm region ${name}: negated region members are outside this tool's v1 scope (line ${m.line}). Positive membership only.`,
            );
          }
          const kind = (mt[0] ?? "").toLowerCase();
          const value = mt.slice(1).join(" ");
          members.add(`${kind}\u0000${value}`);
        }
      }
      regions.set(name.replace(/^\/Common\//, ""), members);
      continue;
    }
  }

  if (records.length === 0) {
    const hint = !parsed.ok && parsed.error ? ` (parser: ${parsed.error.message})` : "";
    throw new Error(`No gtm topology records found${hint}. Paste them as tmsh shows them: gtm topology ldns: <source> server: <destination> { score N }.`);
  }
  if (!parsed.ok && parsed.error) {
    notes.push(`parser: ${parsed.error.message}${parsed.error.line ? ` (line ${parsed.error.line})` : ""} - reading what parsed cleanly.`);
  }

  // ---- sort (Longest Match enabled semantics) ------------------------------
  const sorted = sortRecords(records);
  notes.push(
    "Sorted with Longest Match ENABLED semantics: bucket (plain > server-negation > LDNS-negation > wildcard, per K10721), then LDNS type rank (subnet by longest mask, then datacenter/pool, region, ISP, country, continent), then the server side the same way, then weight. With Longest Match disabled, the list order and the weights govern instead.",
  );

  const regionList = [...regions.entries()].map(([name, members]) => ({
    name,
    members: [...members].map((m) => m.replace("\u0000", " ")),
  }));

  if (!src) {
    notes.push('No "source ..." line declared: showing the sorted list only. Add one (source ip=10.1.2.3 country=US ...) to evaluate a request.');
    return { ok: true, mode: "sorted-only", records: sorted, regions: regionList, notes };
  }

  // ---- candidates -----------------------------------------------------------
  const candidateNames =
    declaredCandidates.length > 0
      ? declaredCandidates
      : [...new Set(sorted.filter((r) => !r.server.wildcard && (r.server.kind === "pool" || r.server.kind === "datacenter") && !r.server.negated).map((r) => r.server.value.replace(/^\/Common\//, "")))];
  if (candidateNames.length === 0) {
    throw new Error('No candidates could be derived from the records (only wildcard/region/negated destinations found). Add a "candidates name1 name2" line naming the pools or datacenters to score.');
  }

  // ---- the scoring walk: first matching record per candidate wins ----------
  const scores = new Map<string, CandidateScore>();
  for (const name of candidateNames) scores.set(name, { name, score: 0, note: "no matching record - score 0" });

  for (const rec of sorted) {
    const lm = ldnsMatch(rec.ldns, src, regions);
    rec.matched = lm.match;
    rec.matchNote = lm.why;
    if (!lm.match) continue;
    for (const name of candidateNames) {
      const sm = serverMatch(rec.server, name, regions);
      if (!sm.match) continue;
      const existing = scores.get(name)!;
      if (existing.fromRecord !== undefined) {
        if (rec.shadowedBy === undefined && rec.scored === undefined) rec.shadowedBy = existing.fromRecord;
        continue; // already scored by an earlier (higher-sorted) record
      }
      existing.score = rec.score;
      existing.fromRecord = rec.index;
      existing.note = `scored ${rec.score} by record #${rec.index} (${sm.why}); LDNS matched: ${lm.why}`;
      rec.scored = rec.scored ? `${rec.scored}, ${name}` : name;
    }
  }

  const candidates = [...scores.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const top = candidates[0]?.score ?? 0;
  const winners = candidates.filter((c) => c.score === top && top > 0).map((c) => c.name);
  const winner =
    winners.length > 0
      ? { names: winners, score: top, tie: winners.length > 1 }
      : undefined;

  if (!winner) {
    notes.push("No candidate received a topology score: the Topology method returns nothing for this source, and the pool's chain proceeds to its alternate method.");
  } else if (winner.tie) {
    notes.push("Two or more candidates share the highest score: the system round-robins among them (the score decides, and equal scores split the traffic).");
  }

  return { ok: true, mode: "evaluate", records: sorted, regions: regionList, source: src.raw, candidates, winner, notes };
}

function intOf(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}
