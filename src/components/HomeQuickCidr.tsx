"use client";

// ============================================================================
// src/components/HomeQuickCidr.tsx
// ----------------------------------------------------------------------------
// TRY SOMETHING NOW (2026-10-05, home page review items 5, 6 and 21, PRIME's
// decision). The front door's first promise is a tool that runs on the
// reader's machine, so the second screen is one: a single CIDR field that
// answers the four questions a subnet raises (network, broadcast, usable
// range, hosts) as the reader types, with the privacy sentence beside the
// result rather than in a section of its own three screens away. The full
// calculator (subnets, VLSM, overlaps, the Learn panel, the sources) lives at
// /tools/cidr; this is the smallest honest piece of it, computed by the same
// pure engine (src/lib/tools/cidr/compute.ts), so the two cannot disagree.
// Nothing is sent anywhere; there is nothing to send it to.
// ============================================================================

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cidrAnalyze, type SubnetAnalysis } from "@/lib/tools/cidr/compute";

/** The opening example: a /24 everyone has seen. */
const EXAMPLE = "192.168.1.0/24";

export default function HomeQuickCidr() {
  const t = useTranslations("home.front");
  // The page's locale, so the host count is grouped the way the reader's language groups digits (65,534 / 65.534).
  const locale = useLocale();
  // The field; the result follows every keystroke.
  const [value, setValue] = useState(EXAMPLE);

  // The analysis, or null while the text is not yet a valid block (no error prose: the page is a front door, not the tool).
  const result = useMemo<SubnetAnalysis | null>(() => {
    try {
      return cidrAnalyze(value.trim());
    } catch {
      return null;
    }
  }, [value]);

  return (
    <div className="quick-cidr">
      <div className="quick-cidr-row">
        <label className="quick-cidr-label" htmlFor="home-cidr">{t("quickLabel")}</label>
        <input
          id="home-cidr"
          className="cidr-input mono quick-cidr-input"
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder={EXAMPLE}
          aria-describedby="home-cidr-privacy"
        />
      </div>
      {/* The four answers, or a quiet prompt while the block is incomplete. */}
      {result ? (
        <dl className="quick-cidr-facts" aria-live="polite">
          <div className="quick-cidr-fact"><dt>{t("quickNetwork")}</dt><dd className="mono">{result.network}</dd></div>
          <div className="quick-cidr-fact"><dt>{t("quickBroadcast")}</dt><dd className="mono">{result.broadcast}</dd></div>
          <div className="quick-cidr-fact"><dt>{t("quickRange")}</dt><dd className="mono">{result.firstHost} – {result.lastHost}</dd></div>
          <div className="quick-cidr-fact"><dt>{t("quickHosts")}</dt><dd className="mono">{new Intl.NumberFormat(locale).format(result.usableHosts)}</dd></div>
        </dl>
      ) : (
        <p className="quick-cidr-waiting">{t("quickWaiting")}</p>
      )}
      {/* The privacy sentence, where the data is. */}
      <p id="home-cidr-privacy" className="quick-cidr-privacy">
        <span className="quick-cidr-dot" aria-hidden="true" />
        {/* One flex item for the sentence and its link, so a narrow screen wraps them as prose rather than as two columns. */}
        <span className="quick-cidr-privacy-text">{t("quickPrivacy")} <Link href="/privacy">{t("quickPrivacyLink")}</Link></span>
      </p>
      <p className="quick-cidr-more">
        <Link href="/tools/cidr" className="page-jump-link">{t("quickFull")} <span aria-hidden="true">&#8594;</span></Link>
        <Link href="/tools" className="quick-cidr-toolbox">{t("quickToolbox")} <span aria-hidden="true">&#8594;</span></Link>
      </p>
    </div>
  );
}
