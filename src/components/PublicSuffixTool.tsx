"use client";

// ============================================================================
// src/components/PublicSuffixTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE PUBLIC-SUFFIX TOOL. Given a hostname, it resolves the public suffix
// (eTLD) and the registered domain (eTLD+1) entirely in the browser, by table
// lookup over the bundled Public Suffix List. No network, no API, no server.
//
// The registered domain is the unit that certificate authorities (e.g. Let's
// Encrypt) count against for per-domain rate limits, and it is the boundary
// browsers use for cookie scope and same-site checks. This tool shows exactly
// where that boundary falls for a given name — including the ICANN-vs-PRIVATE
// distinction (e.g. github.io) that trips people up.
//
// run() is async and object-input; a race guard (reqRef) discards stale async
// results when typing fast. Copy uses the local Clipboard API only.
// ============================================================================

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type PublicSuffixResult } from "@/lib/tools/public-suffix";

// D-83 Example — a multi-label eTLD with a subdomain, so every field is populated.
const EXAMPLE_HOST = "www.blog.example.co.uk";

export default function PublicSuffixTool() {
  const t = useTranslations("tools.public-suffix");

  const [host, setHost] = useState("");
  const [result, setResult] = useState<PublicSuffixResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Monotonic request id: only the most recent async computation may win.
  const reqRef = useRef(0);

  const recompute = useCallback(async (h: string) => {
    setCopiedKey(null);
    if (h.trim() === "") {
      setResult(null);
      return;
    }
    const myReq = ++reqRef.current;
    const r = await run({ host: h });
    if (reqRef.current === myReq) setResult(r);
  }, []);

  const copy = useCallback(async (text: string, which: string) => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(which);
      window.setTimeout(() => setCopiedKey((k) => (k === which ? null : k)), 1500);
    } catch {
      // Clipboard unavailable: output stays selectable by hand.
    }
  }, []);

  const fillExample = () => {
    setHost(EXAMPLE_HOST);
    recompute(EXAMPLE_HOST);
  };
  const clearAll = () => {
    setHost("");
    setResult(null);
  };

  const isDomain = result?.kind === "domain";

  return (
    <div className="cidr-tool jwt-tool">
      {/* Hostname input */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="psl-host">
            {t("hostLabel")}
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
        <input
          id="psl-host"
          type="text"
          className="cidr-input mono"
          value={host}
          onChange={(e) => {
            setHost(e.target.value);
            recompute(e.target.value);
          }}
          placeholder={t("hostPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="psl-privacy"
        />
        <p id="psl-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
      </div>

      {/* Non-domain input (IP / invalid): show only the explanatory note. */}
      {result && !isDomain && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <p className="cidr-error">{result.note}</p>
          </section>
        </div>
      )}

      {result && isDomain && (
        <div className="jwt-results">
          {/* Primary answer: the registered domain (eTLD+1). */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("resultHeading")}</h4>

            {result.registrableDomain ? (
              <div className="hash-out">
                <div className="b64-output-head">
                  <span className="jwt-panel-title">{t("registeredDomainLabel")}</span>
                  <button
                    type="button"
                    className="b64-copy"
                    onClick={() => copy(result.registrableDomain as string, "reg")}
                  >
                    {copiedKey === "reg" ? t("copied") : t("copy")}
                  </button>
                </div>
                <pre className="jwt-json">
                  <code>{result.registrableDomain}</code>
                </pre>
              </div>
            ) : (
              <p className="hmac-build-note">{t("noRegistrable")}</p>
            )}

            <div className="hash-out">
              <div className="b64-output-head">
                <span className="jwt-panel-title">{t("publicSuffixLabel")}</span>
              </div>
              <pre className="jwt-json">
                <code>{result.publicSuffix ?? "-"}</code>
              </pre>
            </div>

            <div className="hash-out">
              <div className="b64-output-head">
                <span className="jwt-panel-title">{t("subdomainLabel")}</span>
              </div>
              <pre className="jwt-json">
                <code>{result.subdomain === "" ? "-" : result.subdomain}</code>
              </pre>
            </div>

            <p className="hmac-build-note">
              {result.section === "private" ? t("sectionPrivate") : t("sectionIcann")}
              {" · "}
              {t("ruleLabel")}: <span className="mono">{result.rule}</span>
            </p>

            {result.note && <p className="hmac-build-note">{result.note}</p>}
          </section>

          {/* When a PRIVATE-section rule won, show the ICANN-only interpretation,
              which is what certificate rate limits and same-site checks use. */}
          {result.section === "private" && result.icann && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("icannViewHeading")}</h4>
              <div className="hash-out">
                <div className="b64-output-head">
                  <span className="jwt-panel-title">{t("registeredDomainLabel")}</span>
                </div>
                <pre className="jwt-json">
                  <code>{result.icann.registrableDomain ?? "-"}</code>
                </pre>
              </div>
              <div className="hash-out">
                <div className="b64-output-head">
                  <span className="jwt-panel-title">{t("publicSuffixLabel")}</span>
                </div>
                <pre className="jwt-json">
                  <code>{result.icann.publicSuffix ?? "-"}</code>
                </pre>
              </div>
              <p className="hmac-build-note">{t("icannViewNote")}</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
