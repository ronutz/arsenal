"use client";

// ============================================================================
// src/components/F5IrulesPerformanceLinterTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE iRULES PERFORMANCE LINTER. Paste an iRule; it lists documented
// anti-patterns line by line, each with a severity, the offending token, why it
// matters, and the fix. All findings come from the compute layer; this component
// only resolves the per-category and per-severity wording. Local, no network.
//
// Share results (2026-10-27): a button builds a link that carries the box as
// pasted, after the iRule secrets check (src/lib/tcl84/irule-secrets.ts): a
// key or credential written out blocks the link and the popover names its
// line; a value whose name looks like a secret is named in the caution line.
// An arriving link fills the box as a paste would and leaves the address.
// ============================================================================

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { run, type LinterResult, type LintSeverity } from "@/lib/tools/f5-irules-performance-linter";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { findIruleSecrets, firstPlace } from "@/lib/tcl84/irule-secrets"; // the iRule secrets check
import { IRULES_PERFORMANCE_LINTER_SHARE, encodeIrulesPerformanceLinter } from "@/lib/tools/f5-irules-performance-linter/share"; // this tool's share spec: the box, after the secrets check

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

// D-83 Example — a compact rule that trips several detectors.
const EXAMPLE = `when RULE_INIT {
    set ::maxcpu 60
}
when HTTP_REQUEST {
    if { [matchclass [HTTP::uri] starts_with $::blocked] } {
        set n [expr $::maxcpu * 2]
    }
    if { [regexp {^/api/} [HTTP::path]] } { pool api_pool }
}`;

// category id -> i18n key stems
const CAT: Record<string, { title: string; detail: string; fix: string }> = {
  "global-variable": { title: "catGlobalTitle", detail: "catGlobalDetail", fix: "catGlobalFix" },
  "expr-no-braces": { title: "catExprTitle", detail: "catExprDetail", fix: "catExprFix" },
  matchclass: { title: "catMatchclassTitle", detail: "catMatchclassDetail", fix: "catMatchclassFix" },
  regex: { title: "catRegexTitle", detail: "catRegexDetail", fix: "catRegexFix" },
};
const SEV: Record<LintSeverity, string> = { high: "sevHigh", warning: "sevWarning", info: "sevInfo" };

export default function F5IrulesPerformanceLinterTool() {
  const t = useTranslations("tools.f5-irules-performance-linter");
  const [irule, setIrule] = useState("");
  const [result, setResult] = useState<LinterResult | null>(null);
  const reqRef = useRef(0);

  const recompute = useCallback((src: string) => {
    if (src.trim() === "") {
      setResult(null);
      return;
    }
    const myReq = ++reqRef.current;
    const r = run({ irule: src });
    if (reqRef.current === myReq) setResult(r);
  }, []);

  const fillExample = () => {
    setIrule(EXAMPLE);
    recompute(EXAMPLE);
  };
  const clearAll = () => {
    setIrule("");
    setResult(null);
  };

  // An arriving share link (2026-10-27): the box fills as a paste would, and the page reads it as usual.
  useShareArrival(IRULES_PERFORMANCE_LINTER_SHARE, (s) => { setIrule(s.input); recompute(s.input); }); // the link's text
  // The iRule secrets check, once per change of the box: it decides the button and the caution line.
  const secrets = useMemo(() => (result !== null ? findIruleSecrets(irule) : null), [result, irule]); // null while there is no reading
  // What Share results may carry: the box as pasted, unless it holds a key or credential (memoised).
  const share = useMemo<ShareEncoding>(() => (secrets ? encodeIrulesPerformanceLinter({ input: irule }, secrets) : NOTHING), [secrets, irule]); // the encoding
  // The first value whose name looks like a secret, for the caution line.
  const maybe = useMemo(() => (secrets ? firstPlace(secrets.maybe) : null), [secrets]); // or null

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="irl-src">
            {t("irLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={fillExample}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={clearAll}>
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea
          id="irl-src"
          className="cidr-input mono json-input"
          value={irule}
          onChange={(e) => {
            setIrule(e.target.value);
            recompute(e.target.value);
          }}
          placeholder={t("irPlaceholder")}
          rows={10}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      {result && (
        <div className="jwt-results">
          {/* Summary */}
          <p className="hmac-build-note">
            {result.findings.length === 0 ? (
              t("summaryClean")
            ) : (
              <>
                {t("summaryFound")}{" "}
                {result.counts.high > 0 && (
                  <span className="irl-sev irl-sev-high">
                    {result.counts.high} {t("sevHigh")}
                  </span>
                )}
                {result.counts.warning > 0 && (
                  <span className="irl-sev irl-sev-warning">
                    {result.counts.warning} {t("sevWarning")}
                  </span>
                )}
                {result.counts.info > 0 && (
                  <span className="irl-sev irl-sev-info">
                    {result.counts.info} {t("sevInfo")}
                  </span>
                )}
              </>
            )}
          </p>
          {/* Share results (2026-10-27): under the summary it shares, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton
              encoding={share}
              carries={t("share.carries")}
              details={[maybe ? t("share.maybeSecret", { line: maybe.line, label: maybe.label, more: maybe.more }) : t("share.caution")]}
              blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""}
              title={t("name")}
            />
          </div>

          {/* Findings */}
          {result.findings.map((f, i) => {
            const c = CAT[f.category];
            return (
              <section className="jwt-panel" key={i}>
                <h4 className="jwt-panel-title">
                  <span className={`irl-sev irl-sev-${f.severity}`}>{t(SEV[f.severity])}</span>{" "}
                  {c ? t(c.title) : f.category}
                  <span className="irl-line"> · {t("lineLabel")} {f.line}</span>
                </h4>
                <div className="hash-out">
                  <pre className="jwt-json">
                    <code>{f.snippet}</code>
                  </pre>
                </div>
                {c && <p className="hmac-build-note">{t(c.detail)}</p>}
                {c && (
                  <p className="hmac-build-note">
                    <strong>{t("fixLabel")}:</strong> {t(c.fix)}
                  </p>
                )}
              </section>
            );
          })}

          {/* Profiling reminder + companion */}
          <p className="hmac-build-note">
            {t("profileNote")}{" "}
            <Link href="/tools/f5-irules-runtime-calculator" className="mb-titlebar-devfun">
              {t("profileLink")}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
