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
//
// PAGE LANGUAGE (2026-11-02, batch H5): bucket labels, sort rationales, match
// reasons, candidate notes, notes and errors are built as EngineTexts
// (src/lib/tools/engine-text.ts); a reason inside another sentence is passed as
// a value, and the sort rationale's clauses as a list. runLocalisable() returns
// them for the page (pack keys tools.f5-topology-longest-match.engine.<id>);
// run() returns plainText() of the same reading, so the API and the golden
// vectors are unchanged byte for byte. The shared tmsh parser's message is
// shown by the id the parser gives it.
// ============================================================================

import { parseTmsh, asTopLevel, asKeyValue, type ConfigNode, type ParseResult } from "../f5-tmsh-config-explainer/compute"; // the shared parser (its result carries the message id since 2026-11-02)
import { say, listOf, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids (2026-11-02)

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
export interface TopoRecord<S = string> { // S is string in the API's reading, EngineText in the page's
  index: number; // as-pasted order (1-based)
  line: number;
  ldns: TopoOperand;
  server: TopoOperand;
  score: number;
  order?: number;
  /** The sort bucket: 0 normal, 1 server-negation, 2 ldns-negation, 3 wildcard. */
  bucket: number;
  bucketLabel: S;
  sortNote: S;
  /** Set during evaluation. */
  matched?: boolean;
  matchNote?: S;
  scored?: string; // candidate this record scored
  shadowedBy?: number; // index of the earlier record that already scored the same candidate
}

/** A candidate destination and its assigned score. */
export interface CandidateScore<S = string> { // S as above
  name: string;
  score: number;
  fromRecord?: number; // record index that scored it
  note: S;
}

export interface TopoResult<S = string> { // S as above
  ok: boolean;
  mode: "evaluate" | "sorted-only";
  records: TopoRecord<S>[];
  regions: { name: string; members: string[] }[];
  source?: Record<string, string>;
  candidates?: CandidateScore<S>[];
  winner?: { names: string[]; score: number; tie: boolean };
  notes: S[];
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

function bucketOf(r: { ldns: TopoOperand; server: TopoOperand }): { bucket: number; label: EngineText } {
  const wild = r.ldns.wildcard && !r.ldns.negated;
  if (wild) return { bucket: 3, label: say("bucket.wildcard", "wildcard (sorted last)") }; // pack key engine.bucket.wildcard
  if (r.server.negated) return { bucket: 1, label: say("bucket.serverNegation", "server-side negation (above LDNS negations and wildcards, below plain entries)") }; // pack key engine.bucket.serverNegation
  if (r.ldns.negated) return { bucket: 2, label: say("bucket.ldnsNegation", "LDNS-side negation (above wildcards, below plain entries)") }; // pack key engine.bucket.ldnsNegation
  return { bucket: 0, label: say("bucket.plain", "plain entry") }; // pack key engine.bucket.plain
}

export function sortRecords<S = string>(records: TopoRecord<S>[]): TopoRecord<S>[] { // generic over the sentence type (2026-11-02): the sort reads only numbers and names
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
function ldnsPositiveMatch(op: TopoOperand, src: SourceDecl, regions: Map<string, Set<string>>): { match: boolean; why: EngineText } {
  switch (op.kind) {
    case "subnet": {
      if (op.wildcard) return { match: true, why: say("why.wildcardSource", "wildcard matches every source") }; // pack key engine.why.wildcardSource
      if (!src.ip) return { match: false, why: say("why.noIp", "no source ip declared") }; // pack key engine.why.noIp
      const r = ipv4InCidr(src.ip, op.value);
      if (r === null) return { match: false, why: say("why.needsIpv4", "subnet match needs an IPv4 source ip (v1 scope)") }; // pack key engine.why.needsIpv4
      return { match: r, why: r ? say("why.inside", `${src.ip} is inside ${op.value}`, { ip: src.ip, subnet: op.value }) : say("why.outside", `${src.ip} is outside ${op.value}`, { ip: src.ip, subnet: op.value }) }; // pack keys engine.why.inside / outside
    }
    case "country":
      return src.country
        ? { match: nameEq(src.country, op.value), why: say("why.country", `source country ${src.country}`, { value: src.country }) } // pack key engine.why.country
        : { match: false, why: say("why.noCountry", "no source country declared") }; // pack key engine.why.noCountry
    case "continent":
      return src.continent
        ? { match: nameEq(src.continent, op.value), why: say("why.continent", `source continent ${src.continent}`, { value: src.continent }) } // pack key engine.why.continent
        : { match: false, why: say("why.noContinent", "no source continent declared") }; // pack key engine.why.noContinent
    case "isp":
      return src.isp
        ? { match: nameEq(src.isp, op.value), why: say("why.isp", `source isp ${src.isp}`, { value: src.isp }) } // pack key engine.why.isp
        : { match: false, why: say("why.noIsp", "no source isp declared") }; // pack key engine.why.noIsp
    case "region": {
      const rname = op.value.replace(/^"|"$/g, "").replace(/^\/Common\//, "");
      if ([...src.regions].some((r) => nameEq(r, rname))) return { match: true, why: say("why.declaredRegion", `source declared in region ${rname}`, { region: rname }) }; // pack key engine.why.declaredRegion
      const members = resolveRegion(rname, regions, new Set());
      for (const m of members) {
        const [k, v] = m.split("\u0000");
        const sub = ldnsPositiveMatch({ negated: false, kind: k, value: v, wildcard: false, maskLen: undefined }, src, regions);
        if (k === "subnet") {
          const mm = v.match(/\/(\d{1,3})$/);
          sub.match = src.ip ? ipv4InCidr(src.ip, v) === true : false;
          sub.why = sub.match ? say("why.insideMember", `${src.ip} is inside region member ${v}`, { ip: String(src.ip), member: v }) : sub.why; // pack key engine.why.insideMember
          void mm;
        }
        if (sub.match) return { match: true, why: say("why.viaRegion", `via region ${rname}: ${sub.why.text}`, { region: rname, why: sub.why }) }; // pack key engine.why.viaRegion
      }
      return { match: false, why: say("why.notInRegion", `source not in region ${rname} (by declared attributes and pasted region members)`, { region: rname }) }; // pack key engine.why.notInRegion
    }
    default:
      return { match: false, why: say("why.outsideScope", `operand type "${op.kind}" is outside this tool's verified matching scope; declare the membership via region= if it applies`, { kind: op.kind }) }; // pack key engine.why.outsideScope
  }
}

function ldnsMatch(op: TopoOperand, src: SourceDecl, regions: Map<string, Set<string>>): { match: boolean; why: EngineText } {
  const pos = ldnsPositiveMatch(op, src, regions);
  if (!op.negated) return pos;
  return { match: !pos.match, why: say("why.negated", `negated: ${pos.why.text}`, { why: pos.why }) }; // pack key engine.why.negated
}

/** Server-side: does this operand cover the named candidate? */
function serverMatch(op: TopoOperand, candidate: string, regions: Map<string, Set<string>>): { match: boolean; why: EngineText } {
  if (op.wildcard) return { match: true, why: say("why.wildcardDestination", "wildcard destination") }; // pack key engine.why.wildcardDestination
  const pos = ((): { match: boolean; why: EngineText } => {
    switch (op.kind) {
      case "pool":
      case "datacenter":
        return { match: nameEq(op.value, candidate), why: say("why.nameComparison", `${op.kind} name comparison`, { kind: op.kind }) }; // pack key engine.why.nameComparison
      case "region": {
        const rname = op.value.replace(/^"|"$/g, "").replace(/^\/Common\//, "");
        const members = resolveRegion(rname, regions, new Set());
        for (const m of members) {
          const [k, v] = m.split("\u0000");
          if ((k === "pool" || k === "datacenter") && nameEq(v, candidate)) {
            return { match: true, why: say("why.regionMember", `candidate is a ${k} member of region ${rname}`, { kind: k, region: rname }) }; // pack key engine.why.regionMember
          }
        }
        return { match: false, why: say("why.notAmongMembers", `candidate not found among region ${rname}'s pool/datacenter members`, { region: rname }) }; // pack key engine.why.notAmongMembers
      }
      default:
        return { match: false, why: say("why.serverScope", `server-side "${op.kind}" comparisons need pool/datacenter/region operands in v1`, { kind: op.kind }) }; // pack key engine.why.serverScope
    }
  })();
  if (!op.negated) return pos;
  return { match: !pos.match, why: say("why.negated", `negated: ${pos.why.text}`, { why: pos.why }) }; // pack key engine.why.negated
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

/**
 * The API's reading (and the golden vectors'): the same as runLocalisable(), every sentence as its English.
 * @param input topology records, optional regions, a source line and a candidates line
 * @returns the reading
 */
export function run(input: string): TopoResult {
  return plainText(runLocalisable(input)); // the same reading, sentences as their English
} // run

/**
 * The shared tmsh parser's message as a sentence, by the id the parser gives it (engine.parser.<id>), else as written.
 * @param parsed the parser's result (only read when it carries an error)
 * @returns the sentence, or the message
 */
function parserText(parsed: ParseResult): EngineText | string {
  const m = parsed.error?.message ?? ""; // the English the API reads
  return parsed.errorId ? say(`parser.${parsed.errorId}`, m) : m; // by id, or as written
} // parserText

/**
 * The page's reading: the same as run(), with every sentence an EngineText (id, English, values).
 * @param input topology records, optional regions, a source line and a candidates line
 * @returns the reading
 */
export function runLocalisable(input: string): TopoResult<EngineText> {
  const text = (input ?? "").trim();
  if (!text) {
    throw engineError(say("err.empty", 'Paste gtm topology records (and optionally gtm region stanzas), plus a "source ip=... country=..." line to evaluate; add "candidates name1 name2" to limit the scored destinations.')); // pack key engine.err.empty
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
        if (!v) throw engineError(say("err.notKeyValue", `source: "${part}" is not key=value. Keys: ip, country, continent, isp, region.`, { part })); // pack key engine.err.notKeyValue
        const key = k.toLowerCase();
        if (key === "region") regions.add(v);
        else if (["ip", "country", "continent", "isp"].includes(key)) raw[key] = v;
        else throw engineError(say("err.unknownKey", `source: unknown key "${k}". Keys: ip, country, continent, isp, region.`, { key: k })); // pack key engine.err.unknownKey
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
  const records: TopoRecord<EngineText>[] = []; // in paste order
  const regions = new Map<string, Set<string>>();
  const notes: EngineText[] = []; // in order

  let idx = 0;
  for (const node of parsed.nodes) {
    const toks = node.tokens;
    if (toks[0] === "gtm" && toks[1] === "topology") {
      const split = splitTopoHeader(toks.slice(2));
      if (!split) {
        notes.push(say("note.skipped", `line ${node.line}: a gtm topology header without the ldns:/server: shape was skipped.`, { line: String(node.line) })); // pack key engine.note.skipped
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
      const rankBits: EngineText[] = []; // the sort rationale, one clause each
      const lOp = `${ldns.wildcard ? "wildcard" : ldns.kind}${ldns.maskLen !== undefined ? `/${ldns.maskLen}` : ""}`; // the LDNS operand's type (and mask)
      const sOp = `${server.kind}${server.maskLen !== undefined ? `/${server.maskLen}` : ""}`; // the server operand's type (and mask)
      rankBits.push(say("rank.ldns", `ldns ${lOp} rank ${typeRank(ldns)}`, { operand: lOp, rank: String(typeRank(ldns)) })); // pack key engine.rank.ldns
      rankBits.push(say("rank.server", `server ${sOp} rank ${typeRank(server)}`, { operand: sOp, rank: String(typeRank(server)) })); // pack key engine.rank.server
      if (typeRank(ldns) === UNRANKED || typeRank(server) === UNRANKED) {
        rankBits.push(say("rank.unranked", "contains a type outside the verified K10721 ladder - placed after the verified types, before wildcards, and flagged")); // pack key engine.rank.unranked
      }
      if (!scoreSeen) rankBits.push(say("rank.defaultScore", "no score in the stanza - the GUI default weight 1 assumed")); // pack key engine.rank.defaultScore
      records.push({
        index: idx,
        line: node.line,
        ldns,
        server,
        score,
        order,
        bucket: b.bucket,
        bucketLabel: b.label,
        sortNote: say("rank.list", rankBits.join("; "), { items: listOf(rankBits, "; ") }), // the clauses as one sentence (pack key engine.rank.list)
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
            throw engineError(say("err.negatedMember", `gtm region ${name}: negated region members are outside this tool's v1 scope (line ${m.line}). Positive membership only.`, { region: name, line: String(m.line) })); // pack key engine.err.negatedMember
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
    throw engineError(hint
      ? say("err.noRecordsParser", `No gtm topology records found${hint}. Paste them as tmsh shows them: gtm topology ldns: <source> server: <destination> { score N }.`, { message: parserText(parsed) }) // pack key engine.err.noRecordsParser
      : say("err.noRecords", `No gtm topology records found${hint}. Paste them as tmsh shows them: gtm topology ldns: <source> server: <destination> { score N }.`)); // pack key engine.err.noRecords
  }
  if (!parsed.ok && parsed.error) {
    const msg = parsed.error.message; // the English
    notes.push(parsed.error.line
      ? say("note.parserLine", `parser: ${msg} (line ${parsed.error.line}) - reading what parsed cleanly.`, { message: parserText(parsed), line: String(parsed.error.line) }) // pack key engine.note.parserLine
      : say("note.parser", `parser: ${msg} - reading what parsed cleanly.`, { message: parserText(parsed) })); // pack key engine.note.parser
  }

  // ---- sort (Longest Match enabled semantics) ------------------------------
  const sorted = sortRecords(records);
  notes.push(
    say("note.sorted", "Sorted with Longest Match ENABLED semantics: bucket (plain > server-negation > LDNS-negation > wildcard, per K10721), then LDNS type rank (subnet by longest mask, then datacenter/pool, region, ISP, country, continent), then the server side the same way, then weight. With Longest Match disabled, the list order and the weights govern instead."), // pack key engine.note.sorted
  );

  const regionList = [...regions.entries()].map(([name, members]) => ({
    name,
    members: [...members].map((m) => m.replace("\u0000", " ")),
  }));

  if (!src) {
    notes.push(say("note.noSource", 'No "source ..." line declared: showing the sorted list only. Add one (source ip=10.1.2.3 country=US ...) to evaluate a request.')); // pack key engine.note.noSource
    return { ok: true, mode: "sorted-only", records: sorted, regions: regionList, notes };
  }

  // ---- candidates -----------------------------------------------------------
  const candidateNames =
    declaredCandidates.length > 0
      ? declaredCandidates
      : [...new Set(sorted.filter((r) => !r.server.wildcard && (r.server.kind === "pool" || r.server.kind === "datacenter") && !r.server.negated).map((r) => r.server.value.replace(/^\/Common\//, "")))];
  if (candidateNames.length === 0) {
    throw engineError(say("err.noCandidates", 'No candidates could be derived from the records (only wildcard/region/negated destinations found). Add a "candidates name1 name2" line naming the pools or datacenters to score.')); // pack key engine.err.noCandidates
  }

  // ---- the scoring walk: first matching record per candidate wins ----------
  const scores = new Map<string, CandidateScore<EngineText>>(); // name -> score
  for (const name of candidateNames) scores.set(name, { name, score: 0, note: say("cand.none", "no matching record - score 0") }); // pack key engine.cand.none

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
      existing.note = say("cand.scored", `scored ${rec.score} by record #${rec.index} (${sm.why.text}); LDNS matched: ${lm.why.text}`, { score: String(rec.score), index: String(rec.index), serverWhy: sm.why, ldnsWhy: lm.why }); // pack key engine.cand.scored
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
    notes.push(say("note.noScore", "No candidate received a topology score: the Topology method returns nothing for this source, and the pool's chain proceeds to its alternate method.")); // pack key engine.note.noScore
  } else if (winner.tie) {
    notes.push(say("note.tie", "Two or more candidates share the highest score: the system round-robins among them (the score decides, and equal scores split the traffic).")); // pack key engine.note.tie
  }

  return { ok: true, mode: "evaluate", records: sorted, regions: regionList, source: src.raw, candidates, winner, notes };
}

function intOf(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}
