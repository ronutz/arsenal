"use client";

// ============================================================================
// src/components/F5xcTlsSecurityLevelMapperTool.tsx
// ----------------------------------------------------------------------------
// UI for the F5XC TLS security-level mapper. Two modes:
//   A) Level -> ciphers: pick High / Medium / Low, see the min/max TLS versions
//      and the full cipher list with PFS + strength badges, with the ciphers
//      THIS level adds highlighted.
//   B) Cipher -> levels: paste a cipher suite or scanner line, see which XC
//      levels include each recognized cipher.
// Styling reuses cidr-* / jwt-* vocabulary; strength maps to --ok/--warn/--bad.
// ============================================================================

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  forwardLevel,
  reverseLookup,
  type Level,
  type CipherEntry,
  type Strength,
} from "@/lib/tools/f5xc-tls-security-level-mapper/compute";

const LEVELS: Level[] = ["High", "Medium", "Low"];
const EXAMPLE_QUERY = "TLSv1.0  (0xc013)  ECDHE-RSA-AES128-SHA";

const strengthClass: Record<Strength, string> = {
  strong: "jwt-badge--ok",
  medium: "jwt-badge--warn",
  weak: "jwt-badge--bad",
};

export default function F5xcTlsSecurityLevelMapperTool() {
  const t = useTranslations("tools.f5xc-tls-security-level-mapper");

  const [level, setLevel] = useState<Level | null>("High");
  const [query, setQuery] = useState("");

  const fwd = useMemo(() => (level ? forwardLevel(level) : null), [level]);
  const rev = useMemo(() => (query.trim() !== "" ? reverseLookup(query) : null), [query]);

  const loadExample = useCallback(() => setQuery(EXAMPLE_QUERY), []);
  const clearQuery = useCallback(() => setQuery(""), []);

  const cipherRow = (c: CipherEntry, added: boolean) => (
    <div className="jwt-claim-row" key={c.iana} style={added ? { fontWeight: 600 } : undefined}>
      <span className="jwt-claim-value mono">{c.iana}</span>
      <span className="jwt-badges">
        <span className="jwt-badge mono">{c.kx}</span>
        <span className={`jwt-badge mono ${c.pfs ? "jwt-badge--ok" : "jwt-badge--bad"}`}>{c.pfs ? t("pfs") : t("noPfs")}</span>
        <span className={`jwt-badge mono ${strengthClass[c.strength]}`}>{t(`strength.${c.strength}`)}</span>
      </span>
    </div>
  );

  return (
    <div className="cidr-tool jwt-tool">
      {/* -- Mode A: level -> ciphers -- */}
      <div className="cidr-input-row">
        <label className="cidr-label">{t("levelLabel")}</label>
        <div className="jwt-badges" style={{ marginTop: "0.4rem", gap: "0.4rem" }}>
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              className="b64-copy"
              onClick={() => setLevel(l)}
              style={level === l ? { borderColor: "var(--accent-primary)", color: "var(--accent-primary)" } : undefined}
            >
              {t(`levels.${l}`)}
            </button>
          ))}
        </div>
      </div>

      {fwd && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">
              {t(`levels.${fwd.level}`)}{" "}
              <span className="mono">
                {fwd.minTls} - {fwd.maxTls}
              </span>
            </h4>
            <p className="cipher-note">{t(`summary.${fwd.level}`)}</p>
            <div style={{ marginTop: "0.5rem" }}>{fwd.ciphers.map((c) => cipherRow(c, c.introducedAt === fwd.level))}</div>
            {fwd.level !== "High" && <p className="cipher-note">{t("cumulativeNote", { n: fwd.addedByThisLevel.length })}</p>}
            {fwd.level !== "High" && <p className="cipher-note">{t("gotchaVersions")}</p>}
            {fwd.level === "Low" && <p className="cipher-note">{t("gotchaWeak")}</p>}
          </section>
        </div>
      )}

      {/* -- Mode B: cipher -> levels -- */}
      <div className="cidr-input-row" style={{ marginTop: "1rem" }}>
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="tls-rev">
            {t("reverseLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={loadExample}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={clearQuery}>
              {t("clear")}
            </button>
          </div>
        </div>
        <input
          id="tls-rev"
          className="cidr-input mono"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("reversePlaceholder")}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {rev && rev.ok && rev.matches.length > 0 && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("matchesTitle")}</h4>
            {rev.matches.map((m) => (
              <div className="jwt-claim-row" key={m.iana}>
                <span className="jwt-claim-value mono">{m.iana}</span>
                <span className="jwt-badges">
                  <span className={`jwt-badge mono ${m.pfs ? "jwt-badge--ok" : "jwt-badge--bad"}`}>{m.pfs ? t("pfs") : t("noPfs")}</span>
                  {m.levels.map((l) => (
                    <span className="jwt-badge mono" key={l}>
                      {t(`levels.${l}`)}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </section>
        </div>
      )}

      {rev && rev.ok && rev.matches.length === 0 && (
        <p className="cipher-note" style={{ marginTop: "0.5rem" }}>
          {t("noMatch")}
        </p>
      )}
    </div>
  );
}
