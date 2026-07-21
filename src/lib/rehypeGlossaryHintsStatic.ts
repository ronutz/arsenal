// ============================================================================
// src/lib/rehypeGlossaryHintsStatic.ts
// ----------------------------------------------------------------------------
// REHYPE PLUGIN — first-occurrence glossary hints for TOOL DOCS (build-time).
//
// Tool docs render through a plain unified() remark -> rehype -> stringify
// pipeline (see toolDocs.ts), NOT through MDX. So — unlike the Learn plugin
// (rehypeGlossaryHints.ts, which emits <GlossaryTerm> MDX JSX elements resolved
// by a components map) — this plugin cannot emit React components. Instead it
// wraps the first prose occurrence of each eligible surface in a self-contained
// HTML anchor that carries the term's own definition as data-* attributes:
//
//   <a class="gloss-hint-static"
//      href="/<locale>/glossary/<slug>"
//      data-gloss-slug="<slug>"
//      data-gloss-head="<headword>"
//      data-gloss-def="<def>"
//      data-gloss-context="<context>"
//      data-gloss-expand="<expandLabel>">term</a>
//
// A small client island (ToolDocGlossaryHints) then finds these anchors at
// runtime and upgrades each into the SAME hover/tap popover the Learn hints use,
// so the two surfaces look and behave identically and share one CSS block.
// Because the anchor is a real link, with JS off (or hints off) it degrades to a
// plain link to the glossary entry — no dead affordance.
//
// GUARANTEES match the Learn plugin: every occurrence is marked and carries
// data-gloss-occ="first" | "rest" (the reader's tri-state setting decides which
// marks are active; caps below bound density), never inside
// code/pre/links/headings, longest-match-first, and per-surface case
// sensitivity.
//
// The plugin is a factory taking (surfaces, locale, defFor, expandLabel) so the
// data source stays single-origin: `surfaces` from getHintSurfaces(), and
// `defFor(slug)` supplies the localized {headword, def, context} the same reader
// the docs page already has (next-intl messages), keeping this plugin free of
// any i18n import of its own.
// ============================================================================

import type { Root, Element, Text, ElementContent } from "hast";
import type { HintSurface } from "@/lib/glossaryHints";

/** The localized prose a hinted term needs, resolved by the caller. */
export interface HintProse {
  headword: string;
  def: string;
  context: string;
  /** Localized href to the full glossary entry. */
  href: string;
}

const SKIP_TAGS = new Set(["code", "pre", "a", "h1", "h2", "h3", "h4", "h5", "h6"]);

// Density caps, mirroring rehypeGlossaryHints (the Learn plugin).
const MAX_PER_TERM = 6;
const MAX_MARKS_PER_DOC = 150;

/** Per-document marking state: per-slug counts + total marks emitted. */
interface MarkState {
  counts: Map<string, number>;
  total: number;
}

function isWordBoundary(ch: string | undefined): boolean {
  if (ch === undefined) return true;
  return !/[A-Za-z0-9]/.test(ch);
}

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
    for (;;) {
      const at = hay.indexOf(needle, from);
      if (at === -1) break;
      const before = text[at - 1];
      const after = text[at + needle.length];
      if (isWordBoundary(before) && isWordBoundary(after)) {
        if (best === null || at < best.index) {
          best = { index: at, length: needle.length, surface: s };
        }
        break;
      }
      from = at + 1;
    }
    if (best && best.index === 0) break;
  }
  return best;
}

function makeHintAnchor(
  matched: string,
  prose: HintProse,
  slug: string,
  expandLabel: string,
  occ: "first" | "rest",
): Element {
  return {
    type: "element",
    tagName: "a",
    properties: {
      className: ["gloss-hint-static"],
      href: prose.href,
      "data-gloss-occ": occ,
      "data-gloss-slug": slug,
      "data-gloss-head": prose.headword,
      "data-gloss-def": prose.def,
      "data-gloss-context": prose.context,
      "data-gloss-expand": expandLabel,
    },
    children: [{ type: "text", value: matched } as Text],
  };
}

function splitTextNode(
  node: Text,
  surfaces: HintSurface[],
  state: MarkState,
  proseFor: (slug: string) => HintProse | null,
  expandLabel: string,
): ElementContent[] | null {
  let rest = node.value;
  const out: ElementContent[] = [];
  let matchedAny = false;

  while (rest.length > 0) {
    const m = findFirstMatch(rest, surfaces, state);
    if (!m) break;
    const prose = proseFor(m.surface.slug);
    // If prose is missing for this slug, cap it out (so we do not retry it
    // forever) but leave the text plain — the affordance must never break copy.
    if (!prose) {
      state.counts.set(m.surface.slug, MAX_PER_TERM);
      continue;
    }
    matchedAny = true;
    const n = (state.counts.get(m.surface.slug) ?? 0) + 1;
    state.counts.set(m.surface.slug, n);
    state.total += 1;
    const before = rest.slice(0, m.index);
    const hit = rest.slice(m.index, m.index + m.length);
    if (before) out.push({ type: "text", value: before } as Text);
    out.push(makeHintAnchor(hit, prose, m.surface.slug, expandLabel, n === 1 ? "first" : "rest"));
    rest = rest.slice(m.index + m.length);
  }
  if (!matchedAny) return null;
  if (rest) out.push({ type: "text", value: rest } as Text);
  return out;
}

export function rehypeGlossaryHintsStatic(
  surfaces: HintSurface[],
  proseFor: (slug: string) => HintProse | null,
  expandLabel: string,
) {
  return function transformer(tree: Root): void {
    const state: MarkState = { counts: new Map(), total: 0 };

    function walk(node: Root | Element): void {
      const children = node.children as ElementContent[];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type === "text") {
          const replaced = splitTextNode(
            child as Text,
            surfaces,
            state,
            proseFor,
            expandLabel,
          );
          if (replaced) {
            children.splice(i, 1, ...replaced);
            i += replaced.length - 1;
          }
        } else if (child.type === "element") {
          const el = child as Element;
          if (SKIP_TAGS.has(el.tagName)) continue;
          walk(el);
        }
      }
    }

    walk(tree);
  };
}
