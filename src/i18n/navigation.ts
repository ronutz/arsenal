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
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

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

export const Link = forwardRef<ComponentRef<typeof BaseLink>, LinkProps>(
  function Link(props, ref) {
    return createElement(BaseLink, { prefetch: false, ...props, ref });
  }
);
