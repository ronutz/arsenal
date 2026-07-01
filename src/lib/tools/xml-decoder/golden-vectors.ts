// ============================================================================
// src/lib/tools/xml-decoder/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the XML parser. The xxe-external-entity vector is
// MANDATORY (per the tool's charter note): it proves the parser IDENTIFIES a
// SYSTEM external entity and reports it as a literal reference, never resolving
// or fetching it. Assertions are on structure only.
// ============================================================================

import { parseXml, type XmlParse, type XmlNode } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "xml-decoder/2026-07-01";

export interface XmlVector {
  id: string;
  input: string;
  check: (p: XmlParse) => string[];
}

function eq(label: string, got: unknown, want: unknown): string[] {
  return got === want ? [] : [`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`];
}
function els(node: XmlNode | undefined): Extract<XmlNode, { kind: "element" }>[] {
  if (!node || node.kind !== "element") return [];
  return node.children.filter((c): c is Extract<XmlNode, { kind: "element" }> => c.kind === "element");
}

const V1 = `<?xml version="1.0" encoding="UTF-8"?>
<note id="1">
  <to>Alice</to>
  <from>Bob</from>
</note>`;

const V2 = `<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<foo>&xxe;</foo>`;

const V3 = `<?xml version="1.0"?>
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;">
  <!ENTITY lol3 "&lol2;&lol2;&lol2;">
]>
<lolz>&lol3;</lolz>`;

const V4 = `<a><b></c></a>`;

const V5 = `<root xmlns="http://default.example" xmlns:x="http://x.example">
  <x:item x:id="5">text</x:item>
</root>`;

export const XML_VECTORS: XmlVector[] = [
  {
    id: "well-formed-basic",
    input: V1,
    check: (p) => {
      const f: string[] = [];
      f.push(...eq("declVersion", p.declaration?.version, "1.0"));
      f.push(...eq("declEncoding", p.declaration?.encoding, "UTF-8"));
      f.push(...eq("rootCount", p.roots.length, 1));
      f.push(...eq("rootName", p.roots[0]?.name, "note"));
      f.push(...eq("rootAttr", p.roots[0]?.attributes?.[0]?.value, "1"));
      f.push(...eq("elements", p.stats.elements, 3));
      f.push(...eq("maxDepth", p.stats.maxDepth, 2));
      f.push(...eq("wellFormed", p.wellFormed, true));
      f.push(...eq("noWarnings", p.warnings.length, 0));
      const kids = els(p.roots[0]);
      f.push(...eq("firstChild", kids[0]?.name, "to"));
      return f;
    },
  },
  {
    id: "xxe-external-entity",
    input: V2,
    check: (p) => {
      const f: string[] = [];
      f.push(...eq("doctypeName", p.doctype?.name, "foo"));
      f.push(...eq("hasInternalSubset", p.doctype?.hasInternalSubset, true));
      f.push(...eq("entityCount", p.entities.length, 1));
      f.push(...eq("entityName", p.entities[0]?.name, "xxe"));
      f.push(...eq("entityKind", p.entities[0]?.kind, "external-system"));
      // the value is the literal SYSTEM identifier, NEVER resolved / fetched
      f.push(...eq("entityValueLiteral", p.entities[0]?.value, "file:///etc/passwd"));
      f.push(...eq("hasDoctypeWarning", p.warnings.includes("doctype-present"), true));
      f.push(...eq("hasExternalEntityWarning", p.warnings.includes("external-entity"), true));
      f.push(...eq("wellFormed", p.wellFormed, true));
      return f;
    },
  },
  {
    id: "billion-laughs-expansion",
    input: V3,
    check: (p) => {
      const f: string[] = [];
      f.push(...eq("entityCount", p.entities.length, 3));
      f.push(...eq("hasExpansionWarning", p.warnings.includes("entity-expansion"), true));
      f.push(...eq("hasDoctypeWarning", p.warnings.includes("doctype-present"), true));
      return f;
    },
  },
  {
    id: "not-well-formed",
    input: V4,
    check: (p) => {
      const f: string[] = [];
      f.push(...eq("wellFormed", p.wellFormed, false));
      f.push(...eq("hasMismatch", p.errors.some((e) => e.code === "mismatched-tag"), true));
      f.push(...eq("hasNotWellFormedWarning", p.warnings.includes("not-well-formed"), true));
      return f;
    },
  },
  {
    id: "namespaces",
    input: V5,
    check: (p) => {
      const f: string[] = [];
      f.push(...eq("rootNamespace", p.roots[0]?.namespace, "http://default.example"));
      f.push(...eq("nsDeclCount", p.namespaces.length, 2));
      const item = els(p.roots[0])[0];
      f.push(...eq("itemPrefix", item?.prefix, "x"));
      f.push(...eq("itemNamespace", item?.namespace, "http://x.example"));
      f.push(...eq("wellFormed", p.wellFormed, true));
      return f;
    },
  },
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];
  for (const v of XML_VECTORS) {
    const msgs = v.check(parseXml(v.input));
    if (msgs.length === 0) passed++;
    else {
      failed++;
      failures.push(`[${v.id}] ${msgs.join(" | ")}`);
    }
  }
  return { passed, failed, failures };
}
