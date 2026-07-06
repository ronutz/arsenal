// ============================================================================
// src/middleware.ts
// ----------------------------------------------------------------------------
// LOCALE MIDDLEWARE — the request-time router for languages.
//
// WHY: This runs before every page render. It inspects the URL (and, for
// first-time visitors, the Accept-Language header) and ensures the request is
// routed to the right locale — redirecting to a prefixed path where needed and
// detecting the browser language on first visit. It is generated entirely from
// the routing config, so it automatically covers all 18 registered locales.
//
// The `matcher` excludes Next internals, the API, and static files so the
// middleware only runs on actual page routes (performance + correctness).
// ============================================================================

import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Run on everything EXCEPT: Next internals (_next), the API, and files with
  // an extension (images, fonts, etc.). This keeps locale routing on pages only.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
