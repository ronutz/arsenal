"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskItemRow.tsx
// ----------------------------------------------------------------------------
// ONE ITEM AS THE DESK SHOWS IT, everywhere on the page: its title from the
// site index in the page's language, linked to its page; "English" beside a
// title the page's language does not have yet; "Updated since you read it",
// with a sign, when the index's date is later than the read mark; and, when
// the site no longer has it, the words "No longer on the site" in place of a
// link (the caller offers the way to remove it). Before the index arrives the
// slug stands in, so the row keeps its place. State in words and a sign,
// never colour alone (the site has 26 themes).
// ============================================================================

// The page's strings.
import { useTranslations } from "next-intl";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// Identifiers and their pages.
import { itemHref, splitItemId, type ItemId } from "@/lib/desk/ids";
// The index lookups.
import { lookup, updatedSince, type SiteIndex } from "@/lib/desk/siteIndex";
// The locale's date format.
import { intlLocale } from "@/i18n/locales";

/**
 * A day as a short date in the page's language ("12 Nov 2026"), from noon UTC so no zone moves it.
 *
 * @param day YYYY-MM-DD
 * @param locale the page's language
 * @returns the formatted date
 */
export function formatDay(day: string, locale: string): string {
  // Formatted.
  return new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
}

/**
 * The title of an item, or its slug before the index arrives, or null when the site no longer has it.
 *
 * @param index the index, or null
 * @param id the identifier
 * @returns the title, or the slug, or null
 */
export function titleOf(index: SiteIndex | null, id: ItemId): string | null {
  // Not loaded yet: the slug stands in.
  if (!index) return splitItemId(id).slug;
  // Looked up, following a rename.
  return lookup(index, id)?.item.t ?? null;
}

/**
 * One item.
 *
 * @param props the item, the index, the read mark's day, whether to show the kind, and the extra controls
 * @returns the row's content
 */
export default function DeskItemRow(props: { id: ItemId; index: SiteIndex | null; readDay?: string; showKind?: boolean; children?: React.ReactNode }) {
  // The words.
  const t = useTranslations("desk");
  // The item under its current name, or null when gone (only knowable once the index is in).
  const found = props.index ? lookup(props.index, props.id) : null;
  // Gone: the index is in and does not have it.
  const gone = props.index !== null && found === null;
  // The kind, for its label.
  const kind = splitItemId(props.id).kind;
  // The row.
  return (
    <span className={`desk-item${props.index ? "" : " desk-item--loading"}`}>
      {gone ? (
        // Gone: said in words, with a sign; the slug says which one it was.
        <span className="desk-item-gone">
          <span className="desk-sign" aria-hidden="true">{"⊘"}</span> {t("item.gone")} <span className="mono">({splitItemId(props.id).slug})</span>
        </span>
      ) : (
        // The title, linked to the page.
        <Link href={itemHref(found?.id ?? props.id)} className="desk-item-link">
          {found?.item.t ?? splitItemId(props.id).slug}
        </Link>
      )}
      {/* The kind, when the list mixes kinds. */}
      {props.showKind && <span className="desk-chip">{t(`kinds.${kind}`)}</span>}
      {/* A title in English where the page's language has none yet. */}
      {found?.item.e === 1 && <span className="desk-chip" lang="en">{t("item.english")}</span>}
      {/* Changed after it was marked read. */}
      {updatedSince(found?.item, props.readDay) && (
        <span className="desk-chip desk-chip--updated">
          <span aria-hidden="true">{"↻"}</span> {t("item.updated")}
        </span>
      )}
      {props.children}
    </span>
  );
}
