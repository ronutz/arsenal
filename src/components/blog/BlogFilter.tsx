// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/blog/BlogFilter.tsx
// ----------------------------------------------------------------------------
// THE BLOG INDEX FILTER (client island). PRIME 16/11/2026 03:54: "How about we show the number of each blog post on the
// blog index page? How about categories and filters?" The numbers are server-rendered by the page; this island adds the
// filters: one row of category chips, one row of topic chips (the posts' tags), a live "Showing N of M" line, and a
// Clear control. One category and one topic at a time, and a post shows only when it matches both.
//
// The same shape as the glossary's filter (GlossaryFilter): the page renders every post, so with no JavaScript the whole
// list reads normally, and this island only ADDS a `.blog-hidden` class to rows that fail the filter. Each row carries:
//   * data-blog-entry   marks it as a post row;
//   * data-category     its one category key;
//   * data-tags         its tag keys, space-joined.
// Each topic on a card is a link to /blog?tag=<key>, marked data-blog-tag: with JavaScript the island takes the click and
// filters in place; without it the link still opens the index.
//
// The chips count what is behind them given the OTHER filter (a faceted count), and a chip with nothing behind it is
// disabled, so a click can never empty the list. The choice is kept in the address (?category=&tag=), so a filtered
// index can be bookmarked or sent; the address is replaced, not pushed, so Back still leaves the page.
// Labels arrive pre-localized as props, so the island needs no i18n context of its own.
// ============================================================================
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** A chip: its stable key, its localized label, and (categories only) its colour. */
export interface BlogFilterOption {
  key: string; // the category or tag key, as in the frontmatter
  label: string; // the localized label
  color?: string; // the category colour (categories only), for the chip's swatch
}

/** What the island needs to know about one post to count it: its category and its tags. */
export interface BlogFilterPost {
  category: string; // the post's one category key
  tags: string[]; // the post's tag keys
}

/** The address parameters the filter reads and writes. */
const CATEGORY_PARAM = "category"; // ?category=<key>
const TAG_PARAM = "tag"; // ?tag=<key>

export default function BlogFilter({
  posts,
  categories,
  topics,
  topicsShown,
  label,
  categoryLegend,
  topicLegend,
  allCategoriesLabel,
  allTopicsLabel,
  moreTopicsLabel,
  fewerTopicsLabel,
  showingTemplate,
  clearLabel,
  emptyLabel,
}: {
  /** Every post's category and tags, in the order the page lists them. */
  posts: BlogFilterPost[];
  /** The categories in use, most posts first. */
  categories: BlogFilterOption[];
  /** The topics in use, most posts first. */
  topics: BlogFilterOption[];
  /** How many topics show before the "more topics" control (the rest wait behind it). */
  topicsShown: number;
  /** The filter region's accessible name. */
  label: string;
  /** The category row's legend. */
  categoryLegend: string;
  /** The topic row's legend. */
  topicLegend: string;
  /** The "every category" chip. */
  allCategoriesLabel: string;
  /** The "every topic" chip. */
  allTopicsLabel: string;
  /** The expander's label while the extra topics are hidden (already counted by the server). */
  moreTopicsLabel: string;
  /** The expander's label once the extra topics are shown. */
  fewerTopicsLabel: string;
  /** "Showing %SHOWN% of %TOTAL%", filled in here as the reader filters. */
  showingTemplate: string;
  /** The Clear control. */
  clearLabel: string;
  /** The line shown when nothing matches (only reachable from a hand-written address). */
  emptyLabel: string;
}) {
  const [category, setCategory] = useState(""); // the chosen category ("" = every category)
  const [tag, setTag] = useState(""); // the chosen topic ("" = every topic)
  const [expanded, setExpanded] = useState(false); // whether the topics past `topicsShown` are on show
  const [ready, setReady] = useState(false); // false until the address has been read, so the first write never wipes it
  const rootRef = useRef<HTMLDivElement | null>(null); // the filter region, scrolled to when a card's topic is clicked

  const categoryKeys = useMemo(() => new Set(categories.map((c) => c.key)), [categories]); // valid category keys
  const topicKeys = useMemo(() => new Set(topics.map((t) => t.key)), [topics]); // valid topic keys
  const topicIndex = useMemo(() => new Map(topics.map((t, i) => [t.key, i])), [topics]); // a topic's place in the row

  // Faceted counts: each category counted within the chosen topic, each topic within the chosen category.
  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>(); // category key to count
    for (const p of posts) if (!tag || p.tags.includes(tag)) m.set(p.category, (m.get(p.category) ?? 0) + 1); // within the topic
    return m; // done
  }, [posts, tag]);
  const topicCounts = useMemo(() => {
    const m = new Map<string, number>(); // topic key to count
    for (const p of posts) if (!category || p.category === category) for (const t of new Set(p.tags)) m.set(t, (m.get(t) ?? 0) + 1); // within the category
    return m; // done
  }, [posts, category]);
  const inTopic = useMemo(() => posts.filter((p) => !tag || p.tags.includes(tag)).length, [posts, tag]); // the "All" category count
  const inCategory = useMemo(() => posts.filter((p) => !category || p.category === category).length, [posts, category]); // the "All" topic count
  const shown = useMemo(
    () => posts.filter((p) => (!category || p.category === category) && (!tag || p.tags.includes(tag))).length, // both filters
    [posts, category, tag],
  );

  // A topic hidden behind "more topics" opens the row when it is chosen, so the chosen chip is always on show.
  const choose = useCallback(
    (key: string) => {
      setTag(key); // the new topic
      if (key && (topicIndex.get(key) ?? 0) >= topicsShown) setExpanded(true); // reveal it if it sits past the fold
    },
    [topicIndex, topicsShown],
  );

  // Read the address once, on mount: a bookmarked or shared filter is restored, and an unknown key is ignored.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search); // the current query
    const c = q.get(CATEGORY_PARAM) ?? ""; // the category asked for
    const t = q.get(TAG_PARAM) ?? ""; // the topic asked for
    if (categoryKeys.has(c)) setCategory(c); // only a category the index knows
    if (topicKeys.has(t)) choose(t); // only a topic the index knows
    setReady(true); // from now on, the address follows the filter
  }, [categoryKeys, topicKeys, choose]);

  // Show and hide the rows, mark the chosen topic on every card, and keep the address in step.
  useEffect(() => {
    for (const row of Array.from(document.querySelectorAll<HTMLElement>("[data-blog-entry]"))) { // each post row
      const okCategory = !category || row.dataset.category === category; // passes the category filter
      const okTag = !tag || (row.dataset.tags ?? "").split(" ").includes(tag); // passes the topic filter
      row.classList.toggle("blog-hidden", !(okCategory && okTag)); // hidden unless it passes both
    }
    for (const a of Array.from(document.querySelectorAll<HTMLElement>("[data-blog-tag]"))) { // each card topic link
      a.classList.toggle("is-active", a.dataset.blogTag === tag); // the chosen topic reads as chosen on the cards too
    }
    if (!ready) return; // the address has not been read yet: do not overwrite it
    const url = new URL(window.location.href); // the current address
    if (category) url.searchParams.set(CATEGORY_PARAM, category); // keep the category
    else url.searchParams.delete(CATEGORY_PARAM); // or drop it
    if (tag) url.searchParams.set(TAG_PARAM, tag); // keep the topic
    else url.searchParams.delete(TAG_PARAM); // or drop it
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url); // replace, never push
  }, [category, tag, ready]);

  // At phone width each chip row is one sideways-scrolling line (see .blog-filter in components.css): bring the chosen
  // chips into that line's view, without moving the page, so a choice made from a card or an address is never offscreen.
  useEffect(() => {
    for (const c of Array.from(rootRef.current?.querySelectorAll<HTMLElement>('.blog-chip[aria-pressed="true"]') ?? [])) { // each chosen chip
      const row = c.parentElement; // its chip row
      if (!row || row.scrollWidth <= row.clientWidth) continue; // the row wraps or fits: nothing to scroll
      const cr = c.getBoundingClientRect(); // the chip's box
      const rr = row.getBoundingClientRect(); // the row's box
      if (cr.left < rr.left || cr.right > rr.right) row.scrollLeft += cr.left - rr.left - 16; // in view, with a gutter
    }
  }, [category, tag, expanded]);

  // A click on a card's topic filters in place instead of reloading the page, then brings the filter into view so the
  // reader sees what changed. A modified click (new tab, new window) is left to the browser.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // not a plain click
      const a = (e.target as Element | null)?.closest?.("[data-blog-tag]") as HTMLElement | null; // a card topic link?
      const key = a?.dataset.blogTag ?? ""; // its topic key
      if (!a || !topicKeys.has(key)) return; // not one of ours
      e.preventDefault(); // stay on the page
      setCategory(""); // a topic picked from a card means "every post on this topic", whatever the category
      choose(key); // the topic
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches; // the reader's motion setting
      rootRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); // show the filter
    };
    document.addEventListener("click", onClick); // delegated: the cards are server-rendered
    return () => document.removeEventListener("click", onClick); // tidy on unmount
  }, [topicKeys, choose]);

  const clear = useCallback(() => {
    setCategory(""); // every category
    setTag(""); // every topic
  }, []);

  const active = category !== "" || tag !== ""; // whether any filter is on
  const showing = showingTemplate.replace("%SHOWN%", String(shown)).replace("%TOTAL%", String(posts.length)); // the live line
  const extraTopics = topics.length - topicsShown; // how many topics wait behind the expander

  /** One chip: pressed when chosen, disabled when nothing is behind it (unless it is the chosen one). */
  const chip = (
    key: string, // the chip's key ("" for All)
    text: string, // its label
    count: number, // what is behind it
    pressed: boolean, // whether it is chosen
    onPick: () => void, // what a press does
    color?: string, // a category swatch
    hidden?: boolean, // past the fold and not chosen
  ) => (
    <button
      key={key || "all"}
      type="button"
      className={`gloss-chip blog-chip${pressed ? " is-active" : ""}`}
      aria-pressed={pressed}
      disabled={count === 0 && !pressed}
      hidden={hidden}
      onClick={onPick}
    >
      {color ? <span className="blog-chip-swatch" style={{ background: color }} aria-hidden="true" /> : null}
      {text}
      <span className="blog-chip-count">{count}</span>
    </button>
  );

  return (
    <div className="blog-filter" role="region" aria-label={label} ref={rootRef}>
      {/* Categories: the site's own taxonomy, each with its colour, as on the tool and Learn indexes. */}
      <fieldset className="gloss-chipset">
        <legend className="gloss-chipset-legend">{categoryLegend}</legend>
        {chip("", allCategoriesLabel, inTopic, category === "", () => setCategory(""))}
        {categories.map((c) =>
          chip(c.key, c.label, categoryCounts.get(c.key) ?? 0, category === c.key, () => setCategory(category === c.key ? "" : c.key), c.color),
        )}
      </fieldset>

      {/* Topics: the posts' tags, most-used first; the rarer ones wait behind the expander. */}
      <fieldset className="gloss-chipset">
        <legend className="gloss-chipset-legend">{topicLegend}</legend>
        {chip("", allTopicsLabel, inCategory, tag === "", () => setTag(""))}
        {topics.map((t, i) =>
          chip(t.key, t.label, topicCounts.get(t.key) ?? 0, tag === t.key, () => choose(tag === t.key ? "" : t.key), undefined, i >= topicsShown && !expanded && tag !== t.key),
        )}
        {extraTopics > 0 ? (
          <button type="button" className="blog-more" aria-expanded={expanded} onClick={() => setExpanded((x) => !x)}>
            {expanded ? fewerTopicsLabel : moreTopicsLabel}
          </button>
        ) : null}
      </fieldset>

      {/* The live line: how many posts the filters leave, and the way back to all of them. */}
      <div className="gloss-filter-status">
        <span className="gloss-count" aria-live="polite">
          {showing}
        </span>
        {active ? (
          <button type="button" className="gloss-clear" onClick={clear}>
            {clearLabel}
          </button>
        ) : null}
      </div>
      {shown === 0 ? <p className="blog-filter-empty">{emptyLabel}</p> : null}
    </div>
  );
}
