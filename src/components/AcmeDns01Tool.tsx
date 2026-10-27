"use client";

// ============================================================================
// src/components/AcmeDns01Tool.tsx
// ----------------------------------------------------------------------------
// THE LIVE ACME dns-01 TOOL. Computes the TXT record you publish to pass an
// ACME dns-01 challenge, entirely in the browser (Web Crypto SHA-256; no fetch,
// no API, no server).
//
// PRIVACY: only the account key's PUBLIC members feed the RFC 7638 thumbprint;
// the pasted key is never echoed back and private fields are ignored. The
// outputs (thumbprint, key authorization, TXT value) are public by design —
// they are what you publish in DNS.
//
// run() is async and object-input; a race guard (reqRef) discards stale async
// results when typing fast. A result appears only when BOTH a token and an
// account key are present. Copy uses the local Clipboard API only.
//
// SHARE RESULTS (2026-10-27): a button under the record builds, only when
// pressed, a link carrying the token, the thumbprint the engine computed and
// the domain, never the key box (spec: src/lib/tools/acme-dns01/share.ts). An
// arriving link (useShareArrival) fills the token and the domain, puts the
// thumbprint in the key box (which takes one) and computes, as a paste would;
// the address loses the values at once.
// ============================================================================

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type AcmeDns01Result } from "@/lib/tools/acme-dns01";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the spec encodes
import { ACME_DNS01_SHARE } from "@/lib/tools/acme-dns01/share"; // this tool's share spec: token, thumbprint, domain

/** Nothing to share (the button is disabled). */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // a constant, so the button sees no change

// D-83 Example — the EC golden vector (token + public JWK + a domain).
const EXAMPLE_TOKEN = "evaGxfADs6pSRb2LAv9IZf17Dt3juxGJ-PCt92wr-oA";
const EXAMPLE_KEY =
  '{"kty":"EC","crv":"P-256","x":"f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU","y":"x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0"}';
const EXAMPLE_DOMAIN = "example.org";

export default function AcmeDns01Tool() {
  const t = useTranslations("tools.acme-dns01");

  const [token, setToken] = useState("");
  const [accountKey, setAccountKey] = useState("");
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<AcmeDns01Result | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Monotonic request id: only the most recent async computation may win.
  const reqRef = useRef(0);

  const recompute = useCallback(async (tok: string, key: string, dom: string) => {
    setCopiedKey(null);
    if (tok.trim() === "" || key.trim() === "") {
      setResult(null);
      return;
    }
    const myReq = ++reqRef.current;
    const r = await run({ token: tok, accountKey: key, domain: dom });
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

  // An arriving share link: the token, the thumbprint (in the key box) and the domain, then the computation.
  useShareArrival(ACME_DNS01_SHARE, (state) => {
    setToken(state.token); // the token box
    setAccountKey(state.thumbprint); // the key box takes a thumbprint
    setDomain(state.domain); // the domain box
    void recompute(state.token, state.thumbprint, state.domain); // computed in the page, as a paste would be
  });
  // What Share results may carry: the token, the engine's thumbprint and the domain, never the key box.
  const share = useMemo<ShareEncoding>(() => (result && result.ok && result.thumbprint ? ACME_DNS01_SHARE.encode({ token, accountKey, domain, thumbprint: result.thumbprint }) : NOTHING), [result, token, accountKey, domain]); // memoised

  const fillExample = () => {
    setToken(EXAMPLE_TOKEN);
    setAccountKey(EXAMPLE_KEY);
    setDomain(EXAMPLE_DOMAIN);
    recompute(EXAMPLE_TOKEN, EXAMPLE_KEY, EXAMPLE_DOMAIN);
  };
  const clearAll = () => {
    setToken("");
    setAccountKey("");
    setDomain("");
    setResult(null);
  };

  return (
    <div className="cidr-tool jwt-tool">
      {/* Token */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="acme-token">
            {t("tokenLabel")}
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
          id="acme-token"
          type="text"
          className="cidr-input mono"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            recompute(e.target.value, accountKey, domain);
          }}
          placeholder={t("tokenPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      {/* Account key (JWK or thumbprint) */}
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="acme-key">
          {t("keyLabel")}
        </label>
        <textarea
          id="acme-key"
          className="cidr-input mono json-input"
          value={accountKey}
          onChange={(e) => {
            setAccountKey(e.target.value);
            recompute(token, e.target.value, domain);
          }}
          placeholder={t("keyPlaceholder")}
          rows={4}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="acme-privacy"
        />
        <p id="acme-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
      </div>

      {/* Domain (optional) */}
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="acme-domain">
          {t("domainLabel")}
        </label>
        <input
          id="acme-domain"
          type="text"
          className="cidr-input mono"
          value={domain}
          onChange={(e) => {
            setDomain(e.target.value);
            recompute(token, accountKey, e.target.value);
          }}
          placeholder={t("domainPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      {result && !result.ok && (
        <div className="jwt-results">
          <section className="jwt-panel jwt-panel--error">
            <p className="cidr-error">{result.error}</p>
          </section>
        </div>
      )}

      {result && result.ok && (
        <div className="jwt-results">
          {/* Primary output: the DNS record to publish. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("recordHeading")}</h4>

            {result.recordName && (
              <div className="hash-out">
                <div className="b64-output-head">
                  <span className="jwt-panel-title">{t("recordNameLabel")}</span>
                  <button
                    type="button"
                    className="b64-copy"
                    onClick={() => copy(result.recordName as string, "name")}
                  >
                    {copiedKey === "name" ? t("copied") : t("copy")}
                  </button>
                </div>
                <pre className="jwt-json">
                  <code>{result.recordName}</code>
                </pre>
              </div>
            )}

            <div className="hash-out">
              <div className="b64-output-head">
                <span className="jwt-panel-title">
                  {t("txtValueLabel")} <span className="mono">(TXT)</span>
                </span>
                <button
                  type="button"
                  className="b64-copy"
                  onClick={() => copy(result.txtValue as string, "txt")}
                >
                  {copiedKey === "txt" ? t("copied") : t("copy")}
                </button>
              </div>
              <pre className="jwt-json">
                <code>{result.txtValue}</code>
              </pre>
            </div>
            <p className="hmac-build-note">{t("recordNote")}</p>
            {/* Share results: under the record it shares, at the start of its own row. */}
            <div className="rdap-ask-row">
              <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
            </div>
          </section>

          {/* How it was derived: key authorization + thumbprint. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("derivationHeading")}</h4>

            <div className="hash-out">
              <div className="b64-output-head">
                <span className="jwt-panel-title">{t("keyAuthLabel")}</span>
                <button
                  type="button"
                  className="b64-copy"
                  onClick={() => copy(result.keyAuthorization as string, "ka")}
                >
                  {copiedKey === "ka" ? t("copied") : t("copy")}
                </button>
              </div>
              <pre className="jwt-json">
                <code>{result.keyAuthorization}</code>
              </pre>
            </div>

            <div className="hash-out">
              <div className="b64-output-head">
                <span className="jwt-panel-title">
                  {t("thumbprintLabel")}
                  {result.keyType ? <span className="mono"> ({result.keyType})</span> : null}
                </span>
                <button
                  type="button"
                  className="b64-copy"
                  onClick={() => copy(result.thumbprint as string, "tp")}
                >
                  {copiedKey === "tp" ? t("copied") : t("copy")}
                </button>
              </div>
              <pre className="jwt-json">
                <code>{result.thumbprint}</code>
              </pre>
              <p className="hmac-build-note">
                {result.thumbprintSource === "provided"
                  ? t("thumbProvided")
                  : t("thumbComputed")}
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
