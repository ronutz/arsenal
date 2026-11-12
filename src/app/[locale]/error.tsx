// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/error.tsx
// ----------------------------------------------------------------------------
// THE PAGE THAT REPLACES NEXT'S BARE "APPLICATION ERROR" (PRIME 11/11/2026
// 23:53: "Application error: a client-side exception has occurred while
// loading ronutz.com" on Chrome for iPhone, after a few rounds of Phish or
// Legit).
//
// Next draws this file in place of a page whose code throws in the browser,
// inside the locale's layout (so the language and the theme still apply; the
// header and footer belong to the page and go with it). The games have their
// own, closer boundary (GameErrorBoundary.tsx) that keeps the page; this one
// catches the rest, and above all the commonest cause on a static site: a
// page left open while a new version was published, whose next move asks for
// a file of the old version that is gone. That case reloads once, by itself
// (src/lib/crashRecovery.ts); anything else shows what failed, in one line,
// with "Try again", "Reload the page" and the way home.
// ============================================================================

"use client";

// React's effect and state.
import { useEffect, useState } from "react";
// The strings (the global set every page carries) and the page's locale.
import { useLocale, useTranslations } from "next-intl";
// The locale's home address.
import { getPathname } from "@/i18n/navigation";
// The reload-once rule and the one-line description.
import { describeError, isChunkError, reloadOnce } from "@/lib/crashRecovery";

/**
 * The replacement for a page that failed in the browser.
 *
 * @param props the error Next caught, and reset (draws the page again without reloading)
 * @returns the message
 */
export default function PageError(props: { error: Error & { digest?: string }; reset: () => void }) {
  // The strings.
  const t = useTranslations("pageError");
  // The locale, for the home link.
  const locale = useLocale();
  // Whether a reload was started for a load failure.
  const [reloading, setReloading] = useState(false);

  // Once per error: logged for the console, and a load failure reloads the page once.
  useEffect(() => {
    // In the console (what "see the browser console" would have shown).
    console.error("[page] stopped with an error", props.error);
    // A file of an older version that is gone: one reload fetches the new version.
    if (isChunkError(props.error) && reloadOnce()) setReloading(true);
  }, [props.error]);

  // The locale's home page, reached with a full load (the page's own code is what failed).
  const home = getPathname({ href: "/", locale });

  // The message.
  return (
    <main id="main" className="section">
      <div className="container page-error">
        {reloading ? (
          // Reloading for a newer version: one line.
          <p className="page-error-body" role="status">
            {t("updating")}
          </p>
        ) : (
          <>
            <h1 className="article-title">{t("title")}</h1>
            <p className="page-error-body">{t("body")}</p>
            {/* The ways on: the page again, a full reload, home. */}
            <div className="page-error-actions">
              <button type="button" className="btn btn-primary" onClick={() => props.reset()}>
                {t("retry")}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>
                {t("reload")}
              </button>
              <a className="btn btn-secondary" href={home}>
                {t("home")}
              </a>
            </div>
            {/* What failed, in the browser's words, for a screenshot or a report. */}
            <details className="page-error-details">
              <summary>{t("details")}</summary>
              <p className="mono page-error-text">{describeError(props.error)}</p>
            </details>
          </>
        )}
      </div>
    </main>
  );
}
