// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/WorldsDirectory.tsx
// ----------------------------------------------------------------------------
// "EVERYTHING ON RONUTZ", THE FULL DIRECTORY (moved 2026-10-06). It was the
// last section of the home page until PRIME saw it sitting right above the
// footer's own directory as an uneven duplicate (16:43). His decisions: one
// directory in the footer on every page (Option A, 16:45, with the verbs and
// the bare numbers, 16:49), and this full form, with the count phrases, on the
// colophon (16:46), the page about how the site is made, where an inventory of
// what it holds belongs.
//
// Same markup and classes as the home section had (.worlds, .world, .world-verb,
// .world-count), so its look is unchanged; every entry of the shared registry
// (src/config/worlds.ts) is listed, the Blog included, as the footer lists it.
// Counts come from src/lib/worldCounts.ts, the table the footer and the user
// guide read, so the three places cannot disagree. A server component: nothing
// here runs in the browser.
// ============================================================================
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { WORLDS } from "@/config/worlds";
import { getWorldCountLabels } from "@/lib/worldCounts";

export default async function WorldsDirectory({ locale }: { locale: string }) {
  // The titles, verbs and entry labels live with the home copy; a few entry labels live under nav and footer.
  const tHome = await getTranslations({ locale, namespace: "home" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tFooter = await getTranslations({ locale, namespace: "footer" });
  /** A registry label key to its text: "map.x" under home, "nav.x" under nav, "footer.x" under footer, "=Literal" as is. */
  const label = (key: string) =>
    key.startsWith("=") ? key.slice(1) : key.startsWith("nav.") ? tNav(key.slice(4)) : key.startsWith("footer.") ? tFooter(key.slice(7)) : tHome(key);
  // The count phrase per destination ("183 live", "28 courses across 4 vendors").
  const counts = await getWorldCountLabels(locale);

  return (
    <section className="section" id="everything">
      <div className="container">
        <h2 className="section-title">{tHome("front.everythingTitle")}</h2>
        <p className="section-body">{tHome("front.everythingBody")}</p>
        <div className="worlds">
          {WORLDS.map((w) => (
            <div key={w.key} className={`world world--${w.key}`}>
              <h3 className="world-title">{tHome(`front.world.${w.key}`)}</h3>
              <p className="world-verb mono">{tHome(`front.worldVerb.${w.key}`)}</p>
              <ul className="world-list">
                {w.items.map((it) => (
                  <li key={it.href}>
                    <Link href={it.href} className="world-link">{label(it.label)}</Link>
                    {counts[it.href] && <span className="world-count mono">{counts[it.href]}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
