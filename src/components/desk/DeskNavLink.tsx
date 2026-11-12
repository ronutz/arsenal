"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskNavLink.tsx
// ----------------------------------------------------------------------------
// THE HEADER'S LINK TO MY DESK (PRIME 12/11/2026 12:42: "a header link"). It
// sits with the header's own tools (search, theme, language), not in the bar of
// the six destinations, whose set and order PRIME fixed on 2026-08-06: the desk
// is the reader's page, not a section of the site. A client island only to say
// "you are here" (aria-current) on the desk itself; the label comes from the
// server in the page's language, so it needs no message namespace.
// ============================================================================

// The current path, and locale-aware links.
import { Link, usePathname } from "@/i18n/navigation";

/**
 * The link.
 *
 * @param props the translated label
 * @returns the link
 */
export default function DeskNavLink(props: { label: string }) {
  // The current path without its locale.
  const pathname = usePathname() ?? "";
  // On the desk.
  const current = pathname === "/desk" || pathname.startsWith("/desk/");
  // The link: a mark and the word (the mark hidden from assistive technology; the word names it).
  return (
    <Link href="/desk" className="desk-nav-link" aria-current={current ? "page" : undefined}>
      <span className="desk-nav-mark" aria-hidden="true">{"★"}</span>
      <span className="desk-nav-text">{props.label}</span>
    </Link>
  );
}
