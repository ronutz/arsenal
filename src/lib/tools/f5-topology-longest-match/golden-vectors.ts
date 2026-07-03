// ============================================================================
// src/lib/tools/f5-topology-longest-match/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the topology longest-match scorer. They pin: the Longest Match
// sort (mask length within subnets, the verified type ladder, the K10721
// negation buckets, wildcards last), the first-match-per-candidate scoring
// walk with shadowing, the wildcard-heavy-weight-beats-specific-light-weight
// outcome, ties resolving to round robin, region resolution (direct, nested,
// declared), candidate auto-derivation, and the honest v1 scope errors.
// Sources: the BIG-IP DNS Load Balancing manual (Topology chapter), K10721.
// ============================================================================

import { run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-topology-longest-match-golden-v1";

export interface TopoVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectMode?: "evaluate" | "sorted-only";
  expectSortedIndexOrder?: number[]; // as-pasted indices, in sorted order
  expectWinner?: string[];
  expectWinnerScore?: number;
  expectTie?: boolean;
  expectCandidateScore?: { name: string; score: number; fromRecord?: number };
  expectShadowed?: { index: number; by: number };
  expectRecordBucket?: { index: number; bucket: number };
  expectNoteIncludes?: string;
}

const SHADOWING = `gtm topology ldns: subnet 192.168.0.0/24 server: pool /Common/POOL1 { score 30 }
gtm topology ldns: region /Common/REGION_A server: pool /Common/POOL2 { score 20 }
gtm topology ldns: subnet 0.0.0.0/0 server: pool /Common/POOL2 { score 40 }
gtm region /Common/REGION_A {
    region-members {
        subnet 192.168.0.0/16 { }
    }
}
source ip=192.168.0.5
candidates POOL1 POOL2`;

export const TOPO_VECTORS: TopoVector[] = [
  {
    id: "sort-mask-length",
    description: "Within subnets the longest mask sorts first (/32 above /16)",
    input:
      "gtm topology ldns: subnet 10.0.0.0/16 server: pool /Common/A { score 1 }\ngtm topology ldns: subnet 10.0.0.1/32 server: pool /Common/B { score 1 }",
    expectOk: true,
    expectMode: "sorted-only",
    expectSortedIndexOrder: [2, 1],
  },
  {
    id: "sort-type-ladder",
    description: "The verified ladder: subnet above region above ISP above country above continent",
    input: [
      "gtm topology ldns: continent Europe server: pool /Common/P { score 1 }",
      "gtm topology ldns: country DE server: pool /Common/P { score 1 }",
      'gtm topology ldns: isp "Comcast" server: pool /Common/P { score 1 }',
      "gtm topology ldns: region /Common/R server: pool /Common/P { score 1 }",
      "gtm topology ldns: subnet 10.0.0.0/8 server: pool /Common/P { score 1 }",
    ].join("\n"),
    expectOk: true,
    expectSortedIndexOrder: [5, 4, 3, 2, 1],
  },
  {
    id: "negation-buckets",
    description: "Plain entries sort above server-negations, above LDNS-negations, above wildcards (K10721)",
    input: [
      "gtm topology ldns: subnet 0.0.0.0/0 server: pool /Common/W { score 1 }",
      "gtm topology ldns: not country CN server: pool /Common/L { score 1 }",
      "gtm topology ldns: country US server: not pool /Common/S { score 1 }",
      "gtm topology ldns: country US server: pool /Common/N { score 1 }",
    ].join("\n"),
    expectOk: true,
    expectSortedIndexOrder: [4, 3, 2, 1],
  },
  {
    id: "bucket-labels",
    description: "The wildcard record carries bucket 3",
    input: "gtm topology ldns: subnet 0.0.0.0/0 server: pool /Common/W { score 1 }",
    expectOk: true,
    expectRecordBucket: { index: 1, bucket: 3 },
  },
  {
    id: "shadowing-walkthrough",
    description: "The region record scores POOL2 first; the heavier wildcard for POOL2 is shadowed; POOL1 wins",
    input: SHADOWING,
    expectOk: true,
    expectMode: "evaluate",
    expectCandidateScore: { name: "POOL2", score: 20, fromRecord: 2 },
    expectShadowed: { index: 3, by: 2 },
    expectWinner: ["POOL1"],
    expectWinnerScore: 30,
  },
  {
    id: "wildcard-beats-specific",
    description: "A wildcard with weight 100 beats a /32 with weight 5: scores decide, not specificity",
    input:
      "gtm topology ldns: subnet 10.0.0.1/32 server: pool /Common/NEAR { score 5 }\ngtm topology ldns: subnet 0.0.0.0/0 server: pool /Common/FAR { score 100 }\nsource ip=10.0.0.1\ncandidates NEAR FAR",
    expectOk: true,
    expectWinner: ["FAR"],
    expectWinnerScore: 100,
  },
  {
    id: "tie-round-robin",
    description: "Equal top scores tie and the round-robin note is raised",
    input:
      "gtm topology ldns: not country US server: pool /Common/EU_POOL { score 50 }\ngtm topology ldns: country DE server: pool /Common/DE_POOL { score 50 }\nsource country=DE\ncandidates EU_POOL DE_POOL",
    expectOk: true,
    expectTie: true,
    expectNoteIncludes: "round-robin",
  },
  {
    id: "nested-region",
    description: "A region containing a region resolves transitively for LDNS matching",
    input:
      "gtm region /Common/INNER { region-members { subnet 172.16.0.0/12 { } } }\ngtm region /Common/OUTER { region-members { region /Common/INNER { } } }\ngtm topology ldns: region /Common/OUTER server: pool /Common/P { score 7 }\nsource ip=172.16.5.5\ncandidates P",
    expectOk: true,
    expectWinner: ["P"],
    expectWinnerScore: 7,
  },
  {
    id: "declared-region-source",
    description: "source region= declares a membership directly, without pasted region stanzas",
    input:
      "gtm topology ldns: region /Common/APAC server: pool /Common/SYD { score 9 }\nsource region=APAC\ncandidates SYD",
    expectOk: true,
    expectWinner: ["SYD"],
    expectWinnerScore: 9,
  },
  {
    id: "candidates-auto-derived",
    description: "Without a candidates line, pool/datacenter destinations become the candidates",
    input:
      "gtm topology ldns: country US server: pool /Common/P_US { score 3 }\ngtm topology ldns: subnet 0.0.0.0/0 server: datacenter /Common/DC_EU { score 1 }\nsource country=US",
    expectOk: true,
    expectWinner: ["P_US"],
    expectWinnerScore: 3,
  },
  {
    id: "no-score-defaults-to-1",
    description: "A record without a score assumes the GUI default weight 1, and says so",
    input: "gtm topology ldns: country BR server: pool /Common/SAO { }\nsource country=BR\ncandidates SAO",
    expectOk: true,
    expectWinnerScore: 1,
  },
  {
    id: "unranked-type-flagged",
    description: "A type outside the verified ladder is placed after it and flagged in the sort note",
    input: 'gtm topology ldns: state "US/California" server: pool /Common/P { score 2 }\ngtm topology ldns: continent Europe server: pool /Common/Q { score 2 }',
    expectOk: true,
    expectSortedIndexOrder: [2, 1],
  },
  {
    id: "no-match-chain-note",
    description: "No candidate scored: the note says the Topology method returns nothing and the chain proceeds",
    input: "gtm topology ldns: country JP server: pool /Common/TYO { score 10 }\nsource country=BR\ncandidates TYO",
    expectOk: true,
    expectNoteIncludes: "chain proceeds",
  },
  {
    id: "sorted-only-mode",
    description: "Without a source line the tool shows the sorted list and invites evaluation",
    input: "gtm topology ldns: continent Europe server: datacenter /Common/DC_FRA { score 10 }",
    expectOk: true,
    expectMode: "sorted-only",
    expectNoteIncludes: "sorted list only",
  },
  {
    id: "error-empty",
    description: "Empty input explains the three-part input shape",
    input: "  ",
    expectOk: false,
    expectErrorIncludes: "gtm topology",
  },
  {
    id: "error-no-records",
    description: "tmsh input without topology records names the expected shape",
    input: "gtm pool a p { }\nsource ip=1.2.3.4",
    expectOk: false,
    expectErrorIncludes: "No gtm topology records",
  },
  {
    id: "error-negated-region-member",
    description: "Negated region members throw the honest v1 scope error",
    input:
      "gtm region /Common/R { region-members { not country CN { } } }\ngtm topology ldns: region /Common/R server: pool /Common/P { score 1 }\nsource country=US\ncandidates P",
    expectOk: false,
    expectErrorIncludes: "negated region members",
  },
  {
    id: "error-no-candidates",
    description: "Only non-derivable destinations and no candidates line: the error asks for one",
    input: "gtm topology ldns: country US server: region /Common/RX { score 1 }\nsource country=US",
    expectOk: false,
    expectErrorIncludes: "candidates",
  },
];

/** Run every vector; return human-readable failures (empty = all green). */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of TOPO_VECTORS) {
    try {
      const r = run(v.input);
      if (v.expectOk === false) {
        failures.push(`${v.id}: expected an error, got ok`);
        continue;
      }
      if (v.expectMode && r.mode !== v.expectMode) failures.push(`${v.id}: mode ${r.mode} != ${v.expectMode}`);
      if (v.expectSortedIndexOrder) {
        const got = r.records.map((x) => x.index);
        if (got.join(",") !== v.expectSortedIndexOrder.join(","))
          failures.push(`${v.id}: sort ${got.join(",")} != ${v.expectSortedIndexOrder.join(",")}`);
      }
      if (v.expectWinner) {
        const got = r.winner?.names ?? [];
        if (got.join("+") !== v.expectWinner.join("+")) failures.push(`${v.id}: winner ${got.join("+")} != ${v.expectWinner.join("+")}`);
      }
      if (v.expectWinnerScore !== undefined && r.winner?.score !== v.expectWinnerScore)
        failures.push(`${v.id}: winner score ${r.winner?.score} != ${v.expectWinnerScore}`);
      if (v.expectTie !== undefined && (r.winner?.tie ?? false) !== v.expectTie)
        failures.push(`${v.id}: tie ${r.winner?.tie} != ${v.expectTie}`);
      if (v.expectCandidateScore) {
        const c = r.candidates?.find((x) => x.name === v.expectCandidateScore!.name);
        if (!c || c.score !== v.expectCandidateScore.score) failures.push(`${v.id}: ${v.expectCandidateScore.name} score ${c?.score}`);
        if (v.expectCandidateScore.fromRecord !== undefined && c?.fromRecord !== v.expectCandidateScore.fromRecord)
          failures.push(`${v.id}: ${v.expectCandidateScore.name} fromRecord ${c?.fromRecord}`);
      }
      if (v.expectShadowed) {
        const rec = r.records.find((x) => x.index === v.expectShadowed!.index);
        if (rec?.shadowedBy !== v.expectShadowed.by) failures.push(`${v.id}: shadowedBy ${rec?.shadowedBy} != ${v.expectShadowed.by}`);
      }
      if (v.expectRecordBucket) {
        const rec = r.records.find((x) => x.index === v.expectRecordBucket!.index);
        if (rec?.bucket !== v.expectRecordBucket.bucket) failures.push(`${v.id}: bucket ${rec?.bucket} != ${v.expectRecordBucket.bucket}`);
      }
      if (v.expectNoteIncludes && !r.notes.some((n) => n.includes(v.expectNoteIncludes!)))
        failures.push(`${v.id}: notes missing "${v.expectNoteIncludes}"`);
    } catch (e) {
      if (v.expectOk !== false) {
        failures.push(`${v.id}: unexpected error ${(e as Error).message}`);
        continue;
      }
      if (v.expectErrorIncludes && !(e as Error).message.includes(v.expectErrorIncludes))
        failures.push(`${v.id}: error missing "${v.expectErrorIncludes}": ${(e as Error).message}`);
    }
  }
  return failures;
}
