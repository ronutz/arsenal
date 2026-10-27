// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/rehypeExternalLinks.ts
// ----------------------------------------------------------------------------
// REHYPE PLUGIN: a link to another site opens in a new tab (PRIME 2026-10-27
// 00:46: "Each and every link to external resources should open in a NEW
// BROWSER TAB, and not in the same tab!!!").
//
// The articles, blog posts, practice pages, the decision memorandum, the tool
// docs and the translation guide are authored as Markdown or MDX, where a link
// is written `[text](https://...)` and rendered as a bare <a href>, so a reader
// who followed a citation left the site in the same tab. This plugin walks the
// rendered tree and gives every <a> whose href leaves the site
// target="_blank" and the rel the site's existing rule gives that host
// (externalRel in src/config/redEducation.ts): "noopener noreferrer", so the
// new page gets no handle on this one (window.opener is null) and no Referer
// is sent; the partner's links keep the referrer and carry "noopener" alone.
// Any rel tokens already present are kept.
//
// External means an absolute http(s) URL, or a protocol-relative "//host"
// one, whose host is not this site's. Root-relative links, fragments,
// mailto: and tel: are left alone. The host test lives in src/lib/links.ts,
// shared with the components that write their own <a> elements.
// ============================================================================

import type { Root, Element, RootContent } from "hast";
import { isExternalHref, externalRel } from "@/lib/links";

/**
 * An <a> written as JSX inside MDX (`<a href="https://...">RFC 9155</a>`) reaches rehype as an mdxJsxTextElement or
 * mdxJsxFlowElement, not as an element, with its attributes in a list of {type, name, value}. Found by the postbuild
 * guard on 27/10/2026: two cipher articles carried such links and still opened them in the same tab.
 */
type JsxAttribute = { type: string; name?: string; value?: unknown };
type JsxElement = { type: "mdxJsxTextElement" | "mdxJsxFlowElement"; name: string | null; attributes: JsxAttribute[]; children: RootContent[] };

/** Give a JSX <a> that leaves the site target="_blank" and the site's rel tokens, keeping any rel it has. */
function markJsxAnchor(el: JsxElement): void {
  // Its href, when written as a plain string attribute (an expression is left alone: it cannot be read here).
  const href = el.attributes.find((a) => a.type === "mdxJsxAttribute" && a.name === "href")?.value;
  if (typeof href !== "string" || !isExternalHref(href)) return;
  // A new tab: replace any target the author wrote.
  el.attributes = el.attributes.filter((a) => !(a.type === "mdxJsxAttribute" && a.name === "target"));
  el.attributes.push({ type: "mdxJsxAttribute", name: "target", value: "_blank" });
  // The rel tokens already there, with the site's rule for this host added once.
  const relAttr = el.attributes.find((a) => a.type === "mdxJsxAttribute" && a.name === "rel");
  const existing = typeof relAttr?.value === "string" ? relAttr.value.split(/\s+/).filter(Boolean) : [];
  const rel = Array.from(new Set([...existing, ...externalRel(href).split(" ")])).join(" ");
  if (relAttr) relAttr.value = rel;
  else el.attributes.push({ type: "mdxJsxAttribute", name: "rel", value: rel });
}

/** Walk every element below a node and mark the external links. */
function walk(node: Root | Element): void {
  // Each child in document order.
  for (const child of node.children as RootContent[]) {
    // A JSX element from MDX: mark it when it is an <a>, and look inside it either way.
    const t = (child as { type: string }).type;
    if (t === "mdxJsxTextElement" || t === "mdxJsxFlowElement") {
      const jsx = child as unknown as JsxElement;
      if (jsx.name === "a") markJsxAnchor(jsx);
      walk(jsx as unknown as Element);
      continue;
    }
    // Only elements can be links or hold links.
    if (child.type !== "element") continue;
    // An <a> with a string href that leaves the site.
    if (child.tagName === "a" && typeof child.properties?.href === "string" && isExternalHref(child.properties.href)) {
      // A new tab.
      child.properties.target = "_blank";
      // The rel tokens already there (hast keeps rel as a list of strings), with the two this rule needs added once.
      const rel = Array.isArray(child.properties.rel) ? child.properties.rel.map(String) : typeof child.properties.rel === "string" ? child.properties.rel.split(/\s+/) : [];
      // The site's rule for this host (noopener noreferrer; the partner's links noopener alone), added without duplicates.
      child.properties.rel = Array.from(new Set([...rel.filter(Boolean), ...externalRel(child.properties.href).split(" ")]));
    }
    // Links can sit inside any element.
    walk(child);
  }
}

/** The plugin: no options, the tree is changed in place. */
export default function rehypeExternalLinks() {
  // The transformer unified calls with the tree.
  return (tree: Root) => {
    // Mark every external link in the document.
    walk(tree);
  };
}
