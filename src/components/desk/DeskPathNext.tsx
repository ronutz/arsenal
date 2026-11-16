"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskPathNext.tsx
// ----------------------------------------------------------------------------
// "CONTINUE THIS PATH" ON AN ITEM PAGE (the site owner, 12/11/2026 15:22).
// When the page's item (a Learn article, a tool) is in one or more of the
// reader's paths, this names each path and its way on, by the rule of
// src/lib/desk/pathNext.ts: "Next in <path>: <title>" linking to the next
// unread item, "This is the last item left in <path>" when only this page
// remains, or "You finished <path>" when every item is read; with the path's
// progress in words and a link to the path on My desk (/my-desk#path=<id>, which
// opens it there). When the item is in no path, nothing is drawn: no box, no
// space. Read from the desk in this browser; to name the next item it loads
// the list of the site's items (a file on this site, the one My desk and the
// series pages load; nothing is sent with it), and only when the page's item
// is in a path. The text appears once, final, when that list is in (or failed:
// then the item's address name stands in for its title).
//
// A path finished while this page is open (the read mark set at the
// article's end) says so with a short fade-in, only when the reader has not
// asked for reduced motion; a path that was already finished just says so.
// Every state is words and a sign (an arrow, a ring, a tick), never colour.
// ============================================================================

// React's state and effects.
import { useEffect, useState } from "react";
// The page's strings and language.
import { useLocale, useTranslations } from "next-intl";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The desk in a component.
import { useDesk } from "@/lib/desk/useDesk";
// Identifiers and addresses.
import { itemHref, splitItemId, type ItemId } from "@/lib/desk/ids";
// The index: loaded on demand, and the lookup that follows renames.
import { lookup, useSiteIndex } from "@/lib/desk/siteIndex";
// The rule.
import { pathsHolding } from "@/lib/desk/pathNext";

/** How many paths are named; more are counted in one line. */
const MAX_PATHS = 3;

/**
 * The control.
 *
 * @param props the page's item; where it sits (after the article, or at its top on a narrow screen)
 * @returns the paths' way on, or nothing when the item is in no path
 */
export default function DeskPathNext(props: { item: ItemId; placement?: "end" | "top" }) {
  // The words (their own small namespace, so a slice at an article's top carries only these).
  const t = useTranslations("deskPath");
  // The page's language, for the index.
  const locale = useLocale();
  // The desk.
  const { data, ready } = useDesk();
  // The paths holding this page's item (none until the desk has been read).
  const hits = ready ? pathsHolding(data, props.item) : [];
  // The index, loaded only when there is something to name.
  const { index, failed } = useSiteIndex(locale, hits.length > 0);
  // The paths already finished when the page was opened (a path finished later is announced with motion).
  const [doneAtStart, setDoneAtStart] = useState<Set<string> | null>(null);
  // Taken once, when the desk is first read.
  useEffect(() => {
    // Not yet read, or already taken.
    if (!ready || doneAtStart !== null) return;
    // The finished ones now.
    setDoneAtStart(new Set(pathsHolding(data, props.item).filter((h) => h.state === "finished").map((h) => h.path.id)));
    // Once, at the first read of the desk.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Nothing to say, or the names not in yet (the text appears once, final).
  if (hits.length === 0 || (!index && !failed)) return null;

  /**
   * An item's title in the page's language, its current address, or its address name when the list is missing.
   *
   * @param id the item
   * @returns the title and the address
   */
  const named = (id: ItemId) => {
    // Followed through a rename.
    const found = index ? lookup(index, id) : null;
    // The title (or the slug) and where it lives now.
    return { title: found?.item.t ?? splitItemId(id).slug, href: itemHref(found?.id ?? id) };
  };

  // The paths named here, and how many more.
  const shown = hits.slice(0, MAX_PATHS);
  // The rest, counted.
  const more = hits.length - shown.length;
  // Bold path names inside the sentences.
  const b = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

  // The block.
  return (
    <section className={`desk-pathnext desk-pathnext--${props.placement ?? "end"}`} aria-label={t("label", { count: hits.length })} data-pagefind-ignore>
      <p className="desk-label">{t("label", { count: hits.length })}</p>
      <ul className="desk-list">
        {shown.map((h) => {
          // The path's name: what the reader typed, its collection's title, or "Untitled path".
          const name = h.path.name || (h.path.from && index ? lookup(index, h.path.from.id)?.item.t : "") || t("untitled");
          // The next item, named.
          const next = h.state === "next" ? named(h.next) : null;
          // Finished during this page view.
          const now = h.state === "finished" && doneAtStart !== null && !doneAtStart.has(h.path.id);
          // One path's line.
          return (
            <li key={h.path.id} className="desk-pathnext-row">
              {/* The way on: the next item, the last one left, or finished; a sign and the words. */}
              {next && (
                <span className="desk-pathnext-say">
                  <span className="desk-sign" aria-hidden="true">{"→"}</span> {t.rich("next", { path: name, b })}{" "}
                  <Link href={next.href} className="desk-item-link">{next.title}</Link>
                </span>
              )}
              {h.state === "last" && (
                <span className="desk-pathnext-say">
                  <span className="desk-sign" aria-hidden="true">{"◎"}</span> {t.rich("last", { path: name, b })}
                </span>
              )}
              {h.state === "finished" && (
                <span className={`desk-pathnext-say desk-pathnext-done${now ? " desk-pathnext-done--now" : ""}`} role={now ? "status" : undefined}>
                  <span className="desk-sign" aria-hidden="true">{"✓"}</span> {t.rich("finished", { path: name, b })}
                </span>
              )}
              {/* The path's progress, as My desk counts it, and the path itself on My desk. */}
              <span className="desk-pathnext-meta">
                <span className="desk-progress-text">{t("progress", { done: h.done, total: h.total })}</span>
                {" · "}
                <Link href={`/my-desk#path=${h.path.id}`} className="desk-link">{t("onDesk")}</Link>
              </span>
            </li>
          );
        })}
      </ul>
      {/* More paths hold this page: counted, with the way to all of them. */}
      {more > 0 && (
        <p className="desk-muted">
          {t("more", { count: more })} <Link href="/my-desk" className="desk-link">{t("open")}</Link>
        </p>
      )}
    </section>
  );
}
