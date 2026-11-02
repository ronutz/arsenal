"use client";

// ============================================================================
// src/components/Ja3TlsFingerprintTool.tsx
// ----------------------------------------------------------------------------
// UI for the JA3 / JA3N passive TLS fingerprint. Paste a JA3 string; the JA3
// and JA3N MD5 hashes (copyable), the decoded fields, GREASE flags, and a
// permutation note are shown. Reuses cidr-/jwt- vocabulary.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { computeJa3Localisable } from "@/lib/tools/ja3-tls-fingerprint/compute"; // the reading with its error's id (02/11/2026)
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // a shared link fills the box as a paste would
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is given
import { JA3_SHARE } from "@/lib/tools/ja3-tls-fingerprint/share"; // this tool's share spec: the string as the engine reads it

const EXAMPLE = "769,47-53-5-10-49161-49162-49171-49172-50-56-19-4,0-10-11,23-24-25,0";

/** Share results with nothing to share: the button is disabled. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // module constant

export default function Ja3TlsFingerprintTool() {
  const t = useTranslations("tools.ja3-tls-fingerprint");
  const tx = engineTexts(t); // PAGE LANGUAGE (02/11/2026): the engine's errors under engine.*, else its English
  const [text, setText] = useState("");
  const r = useMemo(() => (text.trim() !== "" ? computeJa3Localisable(text) : null), [text]); // the error with its id
  // Share results (2026-11-01): the string as the engine reads it (its numbers, GREASE included), only beside a reading.
  const share = useMemo<ShareEncoding>(() => (r && r.ok ? JA3_SHARE.encode({ input: text }) : NOTHING), [r, text]); // the button's encoding
  // A shared link fills the box as a paste would; the page computes the hashes.
  useShareArrival(JA3_SHARE, (s) => setText(s.input));

  const copy = (value: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(value).catch(() => {});
  };

  const list = (arr: number[]) => (arr.length ? arr.join(" ") : "-");

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="ja3-in">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setText(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => setText("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea id="ja3-in" className="cidr-input mono json-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("placeholder")} rows={3} autoComplete="off" spellCheck={false} />
        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {r && !r.ok && (
        <p className="cidr-error" role="alert">
          {tx.say(r.error)}
        </p>
      )}

      {r && r.ok && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">
              <span className="jwt-badge mono">{r.versionName}</span>
            </h4>
            <div className="jwt-claim-row" style={{ alignItems: "center" }}>
              <span className="jwt-claim-label">{t("ja3Label")}</span>
              <span className="jwt-claim-value mono" style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                {r.ja3Hash}
                <button type="button" className="b64-copy" onClick={() => copy(r.ja3Hash)}>
                  {t("copy")}
                </button>
              </span>
            </div>
            <div className="jwt-claim-row" style={{ alignItems: "center" }}>
              <span className="jwt-claim-label">{t("ja3nLabel")}</span>
              <span className="jwt-claim-value mono" style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                {r.ja3nHash}
                <button type="button" className="b64-copy" onClick={() => copy(r.ja3nHash)}>
                  {t("copy")}
                </button>
              </span>
            </div>
            <p className="cipher-note">{r.permuted ? t("permutedNote") : t("stableNote")}</p>
            {r.greaseFound.length > 0 && <p className="cipher-note">{t("greaseNote", { values: r.greaseFound.join(", ") })}</p>}
            {/* Share results: under the hashes and their notes (the answer), at the start of its own row. */}
            <div className="rdap-ask-row">
              <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
            </div>
          </section>

          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("fieldsTitle")}</h4>
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">
                {t("ciphersLabel")} ({r.counts.ciphers})
              </span>
              <span className="jwt-claim-value mono">{list(r.ciphers)}</span>
            </div>
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">
                {t("extensionsLabel")} ({r.counts.extensions})
              </span>
              <span className="jwt-claim-value mono">{list(r.extensions)}</span>
            </div>
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">
                {t("curvesLabel")} ({r.counts.curves})
              </span>
              <span className="jwt-claim-value mono">{list(r.curves)}</span>
            </div>
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">
                {t("formatsLabel")} ({r.counts.formats})
              </span>
              <span className="jwt-claim-value mono">{list(r.formats)}</span>
            </div>
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("ja3StringLabel")}</span>
              <span className="jwt-claim-value mono">{r.ja3String}</span>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
