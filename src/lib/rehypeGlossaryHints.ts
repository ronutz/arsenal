// ============================================================================
// src/lib/rehypeGlossaryHints.ts
// ----------------------------------------------------------------------------
// REHYPE PLUGIN — first-occurrence glossary hints (build-time).
//
// Walks the compiled HAST for one Learn article and, the FIRST time an eligible
// glossary surface appears in prose, replaces that text run with a
// <GlossaryTerm slug="..."> MDX element wrapping the matched words. Everything
// else about the affordance (dashed underline, hover/tap popup, the global
// off-switch) lives in the GlossaryTerm component + CSS; this plugin only marks
// the spots.
//
// GUARANTEES:
//   - EVERY OCCURRENCE IS MARKED, FIRST IS SPECIAL: each match carries an
//     occ attribute ("first" | "rest"). The reader-facing tri-state setting
//     (first | all | off) decides which marks are ACTIVE: by default only the
//     first occurrence per document shows the affordance, "all" activates the
//     rest, "off" silences everything. Caps keep density bounded:
//     MAX_PER_TERM occurrences per slug and MAX_MARKS_PER_DOC total.
//   - NEVER inside code, links, or headings: we do not descend into <code>,
//     <pre>, <a>, or <h1..h6>, so acronyms in commands, existing links, and
//     titles are left untouched.
//   - LONGEST MATCH WINS: surfaces are pre-sorted longest-first, so "Server
//     Name Indication" is preferred over "SNI" at the same position.
//   - CASE per surface: acronyms/CamelCase match case-sensitively; named /
//     hyphenated lowercase terms match case-insensitively.
//
// The plugin is a factory: pass it the surface list (from getHintSurfaces) so
// the data source stays single-origin and testable.
// ============================================================================

import type { Root, Element, Text, ElementContent } from "hast";
import type { HintSurface } from "@/lib/glossaryHints";

// HAST does not model MDX JSX elements; next-mdx-remote understands the
// `mdxJsxTextElement` node shape, so we emit that directly as inline content.
interface MdxJsxAttribute {
  type: "mdxJsxAttribute";
  name: string;
  value: string;
}
interface MdxJsxTextElement {
  type: "mdxJsxTextElement";
  name: string;
  attributes: MdxJsxAttribute[];
  children: ElementContent[];
}

const SKIP_TAGS = new Set(["code", "pre", "a", "h1", "h2", "h3", "h4", "h5", "h6"]);

// Density caps for the all-occurrences pass: at most this many marks per slug
// per document, and at most this many marks per document in total. Chosen so
// even the longest articles stay light (median density today is ~2 marks/doc).
const MAX_PER_TERM = 6;
const MAX_MARKS_PER_DOC = 150;

/** Per-document marking state: per-slug counts + total marks emitted. */
interface MarkState {
  counts: Map<string, number>;
  total: number;
}

// Word-boundary test that treats a surface as bounded by non-word chars. We use
// our own check rather than a giant alternation regex so per-surface case
// sensitivity is honored and matching cost stays predictable.
function isWordBoundary(ch: string | undefined): boolean {
  if (ch === undefined) return true;
  return !/[A-Za-z0-9]/.test(ch);
}

/**
 * Find the earliest match of any not-yet-used surface within `text`.
 * Returns the match position, matched length, and the surface, or null.
 * Longest-first ordering of `surfaces` means at a tie of start index the
 * longer surface is found first.
 */
function findFirstMatch(
  text: string,
  surfaces: HintSurface[],
  state: MarkState,
): { index: number; length: number; surface: HintSurface } | null {
  if (state.total >= MAX_MARKS_PER_DOC) return null;
  let best: { index: number; length: number; surface: HintSurface } | null = null;
  const lower = text.toLowerCase();
  for (const s of surfaces) {
    if ((state.counts.get(s.slug) ?? 0) >= MAX_PER_TERM) continue;
    const hay = s.caseSensitive ? text : lower;
    const needle = s.caseSensitive ? s.surface : s.surface.toLowerCase();
    let from = 0;
    // scan for a boundary-respecting occurrence
    for (;;) {
      const at = hay.indexOf(needle, from);
      if (at === -1) break;
      const before = text[at - 1];
      const after = text[at + needle.length];
      if (isWordBoundary(before) && isWordBoundary(after)) {
        if (best === null || at < best.index) {
          best = { index: at, length: needle.length, surface: s };
        }
        break; // earliest for THIS surface; other surfaces may still beat it
      }
      from = at + 1;
    }
    // micro-opt: a match at index 0 cannot be beaten
    if (best && best.index === 0) break;
  }
  return best;
}

function makeGlossaryElement(
  matched: string,
  slug: string,
  occ: "first" | "rest",
): MdxJsxTextElement {
  return {
    type: "mdxJsxTextElement",
    name: "GlossaryTerm",
    attributes: [
      { type: "mdxJsxAttribute", name: "slug", value: slug },
      { type: "mdxJsxAttribute", name: "occ", value: occ },
    ],
    children: [{ type: "text", value: matched } as Text],
  };
}

/**
 * Replace every first-occurrence surface inside a single Text node with a mix
 * of plain text and GlossaryTerm elements. Returns the replacement node list,
 * or null if nothing matched (caller keeps the original node).
 */
function splitTextNode(
  node: Text,
  surfaces: HintSurface[],
  state: MarkState,
): ElementContent[] | null {
  let rest = node.value;
  const out: ElementContent[] = [];
  let matchedAny = false;

  while (rest.length > 0) {
    const m = findFirstMatch(rest, surfaces, state);
    if (!m) break;
    matchedAny = true;
    const n = (state.counts.get(m.surface.slug) ?? 0) + 1;
    state.counts.set(m.surface.slug, n);
    state.total += 1;
    const before = rest.slice(0, m.index);
    const hit = rest.slice(m.index, m.index + m.length);
    if (before) out.push({ type: "text", value: before } as Text);
    out.push(
      makeGlossaryElement(hit, m.surface.slug, n === 1 ? "first" : "rest") as unknown as ElementContent,
    );
    rest = rest.slice(m.index + m.length);
  }
  if (!matchedAny) return null;
  if (rest) out.push({ type: "text", value: rest } as Text);
  return out;
}

export function rehypeGlossaryHints(surfaces: HintSurface[]) {
  return function transformer(tree: Root): void {
    const state: MarkState = { counts: new Map(), total: 0 };

    function walk(node: Root | Element): void {
      const children = node.children as ElementContent[];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type === "text") {
          const replaced = splitTextNode(child as Text, surfaces, state);
          if (replaced) {
            children.splice(i, 1, ...replaced);
            i += replaced.length - 1;
          }
        } else if (child.type === "element") {
          const el = child as Element;
          if (SKIP_TAGS.has(el.tagName)) continue;
          walk(el);
        }
        // mdxJsx* and other node types: leave as-is (do not descend into
        // authored components).
      }
    }

    walk(tree);
  };
}
