// ============================================================================
// src/components/Breadcrumbs.tsx
// ----------------------------------------------------------------------------
// SITE-WIDE BREADCRUMB TRAIL. A locale-aware, clickable path of every ancestor
// of the current page, in the style BIG-IP TMUI uses: chevron-separated
// segments where every step except the current page is a link, so a reader
// deep in a category or vendor hub can climb back one level (or jump straight
// to Home) in a single click.
//
// USAGE. Pass an ordered `items` array from the page. Any item WITH an `href`
// renders as a locale-aware link (the i18n Link keeps the active language in
// the URL); the LAST item is the current page and is passed WITHOUT an href,
// so it renders as bold, non-interactive text and is marked aria-current.
// Example, from the category page:
//   <Breadcrumbs items={[
//     { label: tNav("home"), href: "/" },
//     { label: tNav("tools"), href: "/tools" },
//     { label: t(`categories.${key}`) },   // current page, no href
//   ]} />
//
// This is a server component (no client JS): the whole trail is plain anchors,
// so it works with JavaScript disabled and costs nothing to hydrate. It also
// emits schema.org BreadcrumbList microdata for search engines, which get the
// same ancestor structure the reader sees.
// ============================================================================

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export interface Crumb {
  /** Visible label for this step. */
  readonly label: string;
  /**
   * Internal href for this step (locale is added automatically). Omit on the
   * LAST item: that is the current page and renders as non-interactive text.
   */
  readonly href?: string;
}

export default function Breadcrumbs({
  items,
  ariaLabel = "Breadcrumb",
}: {
  readonly items: readonly Crumb[];
  /** Accessible name for the nav landmark (pass a localized string). */
  readonly ariaLabel?: string;
}) {
  // A trail of one (just the current page) carries no navigational value.
  if (items.length < 2) return null;

  return (
    <nav className="breadcrumbs" aria-label={ariaLabel}>
      <ol
        className="breadcrumbs-list"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const position = i + 1;
          let content: ReactNode;

          if (item.href && !isLast) {
            content = (
              <Link href={item.href} className="breadcrumbs-link" itemProp="item">
                <span itemProp="name">{item.label}</span>
              </Link>
            );
          } else {
            // Current page (or a label-only step): not a link.
            content = (
              <span
                className="breadcrumbs-current"
                itemProp="name"
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            );
          }

          return (
            <li
              key={`${position}-${item.label}`}
              className="breadcrumbs-item"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {content}
              <meta itemProp="position" content={String(position)} />
              {!isLast && (
                <span className="breadcrumbs-sep" aria-hidden="true">
                  &rsaquo;
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
