// ============================================================================
// src/lib/tools/xml-decoder/index.ts
// ----------------------------------------------------------------------------
// THE XML DECODER - a {manifest, run, vectors} triple. Paste XML and get its
// structure decoded: the declaration, the DOCTYPE and any entities, the element
// tree with namespaces and attributes, and a security analysis that flags the
// XML attack surface (DOCTYPE, external entities, entity expansion).
//
// Safe by construction: a text parser that never resolves an entity, never
// dereferences a SYSTEM/PUBLIC identifier, and never fetches anything (zero
// egress, D-49). Kept separate from saml-decoder on purpose.
// ============================================================================

import { parseXml } from "./compute";
import { GOLDEN_VECTOR_SET_ID, XML_VECTORS } from "./golden-vectors";

export { parseXml } from "./compute";
export type {
  XmlDeclaration,
  XmlEntity,
  XmlEntityKind,
  XmlDoctype,
  XmlAttribute,
  NsDecl,
  XmlNode,
  XmlError,
  XmlParse,
} from "./compute";
export { GOLDEN_VECTOR_SET_ID, XML_VECTORS, verifyVectors } from "./golden-vectors";
export type { XmlVector } from "./golden-vectors";

/** The D-49 declarative manifest for the xml-decoder tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Security & WAF",
  toolSlug: "xml-decoder",
  canonicalAliases: ["xml-parser", "xml-explainer", "xml-formatter", "read-xml", "xml-viewer"],
  inputDetectors: [
    { kind: "regex", pattern: "^\\s*<\\?xml\\s", priority: 8, example: '<?xml version="1.0"?>' },
    { kind: "regex", pattern: "<!DOCTYPE\\s", priority: 7, example: "<!DOCTYPE foo [ ... ]>" },
    { kind: "regex", pattern: "^\\s*<[A-Za-z_:][\\w.:\\-]*[\\s/>]", priority: 5, example: "<root>...</root>" },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-resolves-entities", "never-fetches", "xxe-safe"],
  shareSafetyDefault: "fragment", // XML can carry internal hostnames, tokens, and PII

  // -- Teaching & provenance --
  learnLinks: [
    "learn/reading-xml-structure",
    "learn/xml-namespaces-explained",
    "learn/xml-well-formedness",
    "learn/cdata-comments-and-processing-instructions",
    "learn/xxe-and-external-entities",
    "learn/billion-laughs-and-entity-expansion",
  ],
  sources: [
    { id: "xml10", label: "W3C - Extensible Markup Language (XML) 1.0", url: "https://www.w3.org/TR/xml/" },
    { id: "xmlns", label: "W3C - Namespaces in XML 1.0", url: "https://www.w3.org/TR/xml-names/" },
    { id: "owasp-xxe", label: "OWASP - XML External Entity Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html" },
  ],
});

/** Tool entry point. Deterministic; delegates to the pure, XXE-safe parser. */
export function run(input: string) {
  return parseXml(input);
}
