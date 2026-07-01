// ============================================================================
// src/lib/tools/xml-decoder/compute.ts
// ----------------------------------------------------------------------------
// Deterministic, XXE-safe XML structural parser for the xml-decoder tool.
//
// This parses pasted XML into a structure you can read: the declaration, the
// DOCTYPE and any entities, the element tree with namespaces and attributes,
// CDATA, comments, and processing instructions. It checks well-formedness
// (matched tags, a single root) and, crucially, performs a SECURITY analysis
// that flags the classic XML attack surface: a DOCTYPE at all, external
// entities, parameter entities, and entity-expansion (billion laughs).
//
// It is safe by construction. It is a text tokenizer: it never resolves an
// entity, never dereferences a SYSTEM/PUBLIC identifier, and never fetches
// anything. External entities are reported as the literal reference they
// declare, not their contents. That is the whole point, and it is why the tool
// can analyze hostile XML without being vulnerable to it (zero egress, D-49).
// The parser is bounded (every step advances) and never throws.
// ============================================================================

export interface XmlDeclaration {
  version: string;
  encoding: string | null;
  standalone: string | null;
}

export type XmlEntityKind = "internal" | "external-system" | "external-public" | "parameter";

export interface XmlEntity {
  name: string;
  kind: XmlEntityKind;
  value: string; // literal value, or the SYSTEM/PUBLIC identifier(s) for external
  referencesEntities: string[]; // names of other entities this one references (expansion signal)
}

export interface XmlDoctype {
  name: string;
  hasExternalId: boolean; // SYSTEM or PUBLIC external DTD
  externalId: string | null; // the raw SYSTEM/PUBLIC identifier, never fetched
  hasInternalSubset: boolean;
}

export interface XmlAttribute {
  name: string;
  prefix: string;
  localName: string;
  value: string;
  isNamespace: boolean; // xmlns or xmlns:*
  quoted: boolean;
}

export interface NsDecl {
  prefix: string; // "" for the default namespace
  uri: string;
}

export type XmlNode =
  | {
      kind: "element";
      name: string;
      prefix: string;
      localName: string;
      namespace: string | null;
      attributes: XmlAttribute[];
      nsDeclarations: NsDecl[];
      children: XmlNode[];
      selfClosing: boolean;
    }
  | { kind: "text"; value: string; hasEntities: boolean }
  | { kind: "cdata"; value: string }
  | { kind: "comment"; value: string }
  | { kind: "pi"; target: string; data: string };

export interface XmlError {
  code: string; // STABLE key for i18n
  detail: string; // interpolated context (tag name, etc.)
}

export interface XmlParse {
  declaration: XmlDeclaration | null;
  doctype: XmlDoctype | null;
  entities: XmlEntity[];
  prolog: XmlNode[]; // comments / PIs before the root element
  roots: Extract<XmlNode, { kind: "element" }>[]; // top-level element(s); well-formed XML has exactly one
  namespaces: NsDecl[]; // every distinct namespace declared, for a summary
  stats: {
    elements: number;
    attributes: number;
    maxDepth: number;
    comments: number;
    cdata: number;
    pis: number;
    textNodes: number;
  };
  wellFormed: boolean;
  errors: XmlError[];
  warnings: string[]; // STABLE security / quality codes
  recognized: boolean;
}

const NAME = "[A-Za-z_:][A-Za-z0-9_.:\\-]*";

// ---------------------------------------------------------------------------
// Attribute parsing for the inside of a start / empty tag.
// ---------------------------------------------------------------------------

function parseAttributes(src: string): { attrs: XmlAttribute[]; nsDecls: NsDecl[]; unquoted: boolean } {
  const attrs: XmlAttribute[] = [];
  const nsDecls: NsDecl[] = [];
  let unquoted = false;
  const re = new RegExp(`(${NAME})\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'<>]+))`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const name = m[1];
    const quoted = m[3] !== undefined || m[4] !== undefined;
    const value = m[3] ?? m[4] ?? m[5] ?? "";
    if (!quoted) unquoted = true;
    const isNs = name === "xmlns" || name.startsWith("xmlns:");
    const colon = name.indexOf(":");
    const prefix = colon >= 0 ? name.slice(0, colon) : "";
    const localName = colon >= 0 ? name.slice(colon + 1) : name;
    attrs.push({ name, prefix, localName, value, isNamespace: isNs, quoted });
    if (isNs) {
      nsDecls.push({ prefix: name === "xmlns" ? "" : name.slice(6), uri: value });
    }
  }
  return { attrs, nsDecls, unquoted };
}

// ---------------------------------------------------------------------------
// DOCTYPE internal-subset entity extraction (never resolved).
// ---------------------------------------------------------------------------

function parseEntities(internalSubset: string): XmlEntity[] {
  const out: XmlEntity[] = [];
  // <!ENTITY name "value">  |  <!ENTITY name SYSTEM "id">  |
  // <!ENTITY name PUBLIC "id" "id2">  |  <!ENTITY % name ...>
  const re = /<!ENTITY\s+(%\s+)?([A-Za-z_:][\w.:\-]*)\s+([^>]*?)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(internalSubset)) !== null) {
    const isParam = !!m[1];
    const name = m[2];
    const body = m[3].trim();
    let kind: XmlEntityKind = isParam ? "parameter" : "internal";
    let value = "";
    const sys = body.match(/^SYSTEM\s+("([^"]*)"|'([^']*)')/);
    const pub = body.match(/^PUBLIC\s+("[^"]*"|'[^']*')\s+("([^"]*)"|'([^']*)')/);
    if (pub) {
      kind = "external-public";
      value = body;
    } else if (sys) {
      kind = "external-system";
      value = sys[2] ?? sys[3] ?? "";
    } else {
      // literal value in quotes
      const lit = body.match(/^"([^"]*)"|^'([^']*)'/);
      value = lit ? (lit[1] ?? lit[2] ?? "") : body;
    }
    const referencesEntities = Array.from(value.matchAll(/&([A-Za-z_:][\w.:\-]*);/g)).map((x) => x[1]);
    out.push({ name, kind, value, referencesEntities });
  }
  return out;
}

// ---------------------------------------------------------------------------
// The tokenizer + tree builder.
// ---------------------------------------------------------------------------

export function parseXml(input: string): XmlParse {
  const out: XmlParse = {
    declaration: null,
    doctype: null,
    entities: [],
    prolog: [],
    roots: [],
    namespaces: [],
    stats: { elements: 0, attributes: 0, maxDepth: 0, comments: 0, cdata: 0, pis: 0, textNodes: 0 },
    wellFormed: true,
    errors: [],
    warnings: [],
    recognized: false,
  };

  const src = input.replace(/^\uFEFF/, "");
  let i = 0;
  const n = src.length;

  // element stack: each frame is an element node plus its in-scope ns map
  type Frame = { node: Extract<XmlNode, { kind: "element" }>; ns: Map<string, string> };
  const stack: Frame[] = [];
  const rootNsSeen = new Map<string, string>();

  function currentChildren(): XmlNode[] {
    return stack.length ? stack[stack.length - 1].node.children : topLevel;
  }
  const topLevel: XmlNode[] = [];

  function inScopeNs(): Map<string, string> {
    return stack.length ? stack[stack.length - 1].ns : new Map();
  }

  // leading declaration
  const declMatch = src.match(/^\s*<\?xml\s+([^?]*)\?>/);
  if (declMatch) {
    out.recognized = true;
    const body = declMatch[1];
    const ver = body.match(/version\s*=\s*["']([^"']*)["']/);
    const enc = body.match(/encoding\s*=\s*["']([^"']*)["']/);
    const sa = body.match(/standalone\s*=\s*["']([^"']*)["']/);
    out.declaration = {
      version: ver ? ver[1] : "1.0",
      encoding: enc ? enc[1] : null,
      standalone: sa ? sa[1] : null,
    };
    i = declMatch[0].length;
  }

  let guard = 0;
  while (i < n && guard++ < n + 10) {
    if (src[i] !== "<") {
      // text run
      const next = src.indexOf("<", i);
      const end = next === -1 ? n : next;
      const raw = src.slice(i, end);
      if (raw.trim() !== "" || stack.length > 0) {
        const hasEntities = /&[A-Za-z#]/.test(raw);
        if (raw.trim() !== "") {
          currentChildren().push({ kind: "text", value: raw, hasEntities });
          out.stats.textNodes++;
        }
      }
      i = end;
      continue;
    }

    // something starting with '<'
    if (src.startsWith("<!--", i)) {
      const close = src.indexOf("-->", i + 4);
      const end = close === -1 ? n : close + 3;
      currentChildren().push({ kind: "comment", value: src.slice(i + 4, close === -1 ? n : close) });
      out.stats.comments++;
      out.recognized = true;
      if (close === -1) out.errors.push({ code: "unterminated-comment", detail: "" });
      i = end;
      continue;
    }

    if (src.startsWith("<![CDATA[", i)) {
      const close = src.indexOf("]]>", i + 9);
      const end = close === -1 ? n : close + 3;
      currentChildren().push({ kind: "cdata", value: src.slice(i + 9, close === -1 ? n : close) });
      out.stats.cdata++;
      out.recognized = true;
      if (close === -1) out.errors.push({ code: "unterminated-cdata", detail: "" });
      i = end;
      continue;
    }

    if (/^<!DOCTYPE/i.test(src.slice(i, i + 9))) {
      out.recognized = true;
      // capture up to the matching '>' honoring an optional [ internal subset ]
      let j = i + 9;
      let internal = "";
      let depth = 0;
      while (j < n) {
        const ch = src[j];
        if (ch === "[") {
          depth++;
          const closeBracket = src.indexOf("]", j + 1);
          internal = src.slice(j + 1, closeBracket === -1 ? n : closeBracket);
          j = closeBracket === -1 ? n : closeBracket + 1;
          depth--;
          continue;
        }
        if (ch === ">") break;
        j++;
      }
      const head = src.slice(i + 9, i + 9 + Math.max(0, (internal ? src.indexOf("[", i) : j) - (i + 9)));
      const nameM = head.match(new RegExp(`\\s*(${NAME})`));
      const extM = head.match(/\b(SYSTEM|PUBLIC)\b([^\[]*)/i);
      out.doctype = {
        name: nameM ? nameM[1] : "",
        hasExternalId: !!extM,
        externalId: extM ? (extM[1].toUpperCase() + extM[2]).trim() : null,
        hasInternalSubset: internal.trim().length > 0,
      };
      if (internal.trim()) out.entities.push(...parseEntities(internal));
      i = (src.indexOf(">", j - 1) === -1 ? n : src.indexOf(">", j - 1)) + 1;
      continue;
    }

    if (src.startsWith("<?", i)) {
      const close = src.indexOf("?>", i + 2);
      const end = close === -1 ? n : close + 2;
      const body = src.slice(i + 2, close === -1 ? n : close);
      const sp = body.search(/\s/);
      const target = sp === -1 ? body : body.slice(0, sp);
      const data = sp === -1 ? "" : body.slice(sp + 1).trim();
      currentChildren().push({ kind: "pi", target, data });
      out.stats.pis++;
      out.recognized = true;
      i = end;
      continue;
    }

    if (src.startsWith("</", i)) {
      const close = src.indexOf(">", i);
      const end = close === -1 ? n : close + 1;
      const nm = src.slice(i + 2, close === -1 ? n : close).trim();
      out.recognized = true;
      if (stack.length === 0) {
        out.errors.push({ code: "unexpected-close", detail: nm });
        out.wellFormed = false;
      } else {
        const top = stack[stack.length - 1].node;
        if (top.name !== nm) {
          out.errors.push({ code: "mismatched-tag", detail: `${top.name} \u2260 ${nm}` });
          out.wellFormed = false;
        }
        stack.pop();
      }
      i = end;
      continue;
    }

    // start or empty element
    const close = src.indexOf(">", i);
    if (close === -1) {
      out.errors.push({ code: "malformed-tag", detail: src.slice(i, Math.min(n, i + 20)) });
      out.wellFormed = false;
      break;
    }
    out.recognized = true;
    let inner = src.slice(i + 1, close);
    const selfClosing = inner.endsWith("/");
    if (selfClosing) inner = inner.slice(0, -1);
    const nameM = inner.match(new RegExp(`^(${NAME})`));
    const tagName = nameM ? nameM[1] : "";
    const attrSrc = tagName ? inner.slice(tagName.length) : inner;
    const { attrs, nsDecls, unquoted } = parseAttributes(attrSrc);
    if (unquoted) out.errors.push({ code: "unquoted-attribute", detail: tagName });

    // build in-scope namespace map for this element
    const parentNs = inScopeNs();
    const ns = new Map(parentNs);
    for (const d of nsDecls) {
      ns.set(d.prefix, d.uri);
      if (!rootNsSeen.has(d.prefix + "=" + d.uri)) {
        rootNsSeen.set(d.prefix + "=" + d.uri, d.uri);
        out.namespaces.push(d);
      }
    }
    const colon = tagName.indexOf(":");
    const prefix = colon >= 0 ? tagName.slice(0, colon) : "";
    const localName = colon >= 0 ? tagName.slice(colon + 1) : tagName;
    const namespace = prefix ? ns.get(prefix) ?? null : ns.get("") ?? null;

    const node: Extract<XmlNode, { kind: "element" }> = {
      kind: "element",
      name: tagName,
      prefix,
      localName,
      namespace,
      attributes: attrs,
      nsDeclarations: nsDecls,
      children: [],
      selfClosing,
    };
    out.stats.elements++;
    out.stats.attributes += attrs.filter((a) => !a.isNamespace).length;

    currentChildren().push(node);
    if (!selfClosing) {
      stack.push({ node, ns });
      if (stack.length > out.stats.maxDepth) out.stats.maxDepth = stack.length;
    } else if (out.stats.maxDepth < stack.length + 1) {
      out.stats.maxDepth = stack.length + 1;
    }
    i = close + 1;
  }

  // any unclosed tags left on the stack
  for (const f of stack) {
    out.errors.push({ code: "unclosed-tag", detail: f.node.name });
    out.wellFormed = false;
  }

  // sort top-level into prolog (comments/PIs) and roots (elements)
  for (const node of topLevel) {
    if (node.kind === "element") out.roots.push(node);
    else out.prolog.push(node);
  }
  if (out.roots.length === 0 && out.stats.elements === 0 && out.recognized) {
    out.errors.push({ code: "no-root", detail: "" });
    out.wellFormed = false;
  } else if (out.roots.length > 1) {
    out.errors.push({ code: "multiple-roots", detail: String(out.roots.length) });
    out.wellFormed = false;
  }

  // ----- security / quality analysis -----
  if (out.doctype) out.warnings.push("doctype-present");
  if (out.doctype?.hasExternalId) out.warnings.push("external-dtd");
  if (out.entities.some((e) => e.kind === "external-system" || e.kind === "external-public")) out.warnings.push("external-entity");
  if (out.entities.some((e) => e.kind === "parameter")) out.warnings.push("parameter-entity");
  // billion-laughs: an internal entity that references other entities, chained
  const byName = new Map(out.entities.map((e) => [e.name, e]));
  let expansion = false;
  for (const e of out.entities) {
    for (const ref of e.referencesEntities) {
      const target = byName.get(ref);
      if (target && target.referencesEntities.length > 0) expansion = true;
    }
  }
  if (expansion) out.warnings.push("entity-expansion");
  if (!out.wellFormed) out.warnings.push("not-well-formed");

  return out;
}
