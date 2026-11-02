// ============================================================================
// src/i18n/navigation.ts
// ----------------------------------------------------------------------------
// LOCALE-AWARE NAVIGATION HELPERS.
//
// WHY: When a visitor is reading the site in Japanese (/ja/...) and clicks an
// internal link, they must STAY in Japanese. These wrappers (re-exported from
// next-intl) are locale-aware versions of Next's Link / useRouter / redirect:
// they automatically keep the active locale in the URL. Components import Link
// from HERE, never from "next/link", so language is preserved everywhere by
// construction rather than by remembering to append a prefix each time.
// ============================================================================

import { createElement, forwardRef, type ComponentProps, type ComponentRef } from "react";
import NextLink from "next/link"; // the plain Next.js link, for the one case below that must not switch the locale
import { useLocale } from "next-intl"; // the page's locale (works in server and client components alike)
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";
import { linkLocaleFor } from "./corpus-routing"; // where an article or glossary link goes in a locale without them

const {
  Link: BaseLink,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing);

export { redirect, usePathname, useRouter, getPathname };

// ----------------------------------------------------------------------------
// PREFETCH OFF BY DEFAULT (PRIME 2026-09-09).
//
// Next's App Router Link prefetches a route's RSC payload (<route>/index.txt)
// the moment the link scrolls into view. This site deliberately EXCLUDES every
// index.txt from the Workers asset manifest to stay under the 100,000-file cap
// (see public/.assetsignore, decision D-19, 2026-07-23), so each of those
// prefetches is a guaranteed 404: a wasted request per visible link, and a
// console full of red on every page. Navigation itself is unaffected either
// way - on click, Next fetches the payload, gets the same 404, and falls back to
// a full-page load, which is the documented and accepted behaviour.
//
// Defaulting prefetch to false removes the wasted requests and the noise while
// changing nothing about where a click goes. A caller can still opt a single
// link back in with an explicit prefetch={true}; the spread below lets the
// caller's props override the default.
// ----------------------------------------------------------------------------
type LinkProps = ComponentProps<typeof BaseLink>;

// ----------------------------------------------------------------------------
// ARTICLES AND GLOSSARY ENTRIES FROM A LOCALE WITHOUT THEM (2026-11-02).
//
// In the fourteen live locales that do not carry the authored content, the
// Learn articles and the glossary entries are not generated; the Worker sends
// their addresses to the English page with a temporary redirect. A link from
// /fr/learn/ to /fr/learn/tftp/ therefore cost every reader a redirect, and
// Search Console counted those URLs among its 2,540 "Page with redirect". Such
// a link now points at the English page itself (see src/i18n/corpus-routing.ts,
// the predicate the Worker uses too).
//
// It is rendered with the plain Next.js link, not next-intl's with a locale
// prop: next-intl treats a link that carries another locale as a change of
// language, while opening an English article from the French site is not
// choosing English (and, before routing.localeCookie was turned off on the same
// day, it would have written its NEXT_LOCALE cookie on click). The same reason
// keeps the layout's preference script from recording English for these pages
// (src/app/[locale]/layout.tsx). hrefLang tells the browser and assistive
// technology that the target is in English.
// ----------------------------------------------------------------------------

/** The path of a string or object href, or null when it is not a plain root-relative path this rule can read. */
function pathOf(href: LinkProps["href"]): string | null {
  // A string href: the whole thing (query and fragment are kept by the caller).
  if (typeof href === "string") return href.startsWith("/") && !href.startsWith("//") ? href : null;
  // An object href: its pathname, when it is a literal root-relative path.
  const pathname = (href as { pathname?: unknown }).pathname;
  return typeof pathname === "string" && pathname.startsWith("/") && !pathname.includes("[") ? pathname : null;
}

export const Link = forwardRef<ComponentRef<typeof BaseLink>, LinkProps>(
  function Link(props, ref) {
    // The locale of the page the link is on.
    const pageLocale = useLocale();
    // The target path, when it is one the rule can read.
    const path = pathOf(props.href);
    // The locale the target should carry: the default for an article or entry this locale does not have.
    const target = props.locale == null && path !== null ? linkLocaleFor(pageLocale, path) : pageLocale;
    // A link that must leave the page's locale without changing the reader's language.
    if (target !== pageLocale && path !== null) {
      // Everything the caller passed except next-intl's own props.
      const { href, locale, ...rest } = props as LinkProps & { locale?: string };
      // Not used beyond this point; named only so they stay out of rest.
      void locale;
      // The target with the default locale in front, query and fragment kept (object hrefs keep theirs too).
      const prefixed = typeof href === "string" ? `/${target}${href}` : { ...(href as object), pathname: `/${target}${path}` };
      // The plain link, with the language of the target declared.
      return createElement(NextLink, { prefetch: false, hrefLang: target, ...rest, href: prefixed, ref } as ComponentProps<typeof NextLink>);
    }
    // Every other link: next-intl's, which keeps the page's locale.
    return createElement(BaseLink, { prefetch: false, ...props, ref });
  }
);
