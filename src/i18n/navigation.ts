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

import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
