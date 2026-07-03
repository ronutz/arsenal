"use client";

// ============================================================================
// src/components/F5BigipLicenseExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE BIG-IP LICENSE EXPLAINER.
//
// Paste /config/bigip.license contents (the full file or any fragment) and get
// a structured, plain-language reading: management flavor (BIG-IQ vs direct),
// the identity block, the licensing dates with the K7727 upgrade-eligibility
// verdict (computed by the sibling f5-service-check-date engine over the same
// vendored table), registration key + platform, active and optional modules,
// version/platform constraints, feature tokens, and the validation material
// (presence and length only - key/signature VALUES are never displayed).
//
// Everything runs IN THE BROWSER via the local f5-bigip-license-explainer
// module: no fetch, no API, no clock. All output is escaped text through
// React. A vendor-docs disclaimer sits with the provenance panel because this
// decodes vendor-defined file content, not a stable standard.
// ============================================================================

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  BigipLicenseError,
  FIXTURE_DIRECT,
  type ParsedBigipLicense,
} from "@/lib/tools/f5-bigip-license-explainer";

/** One label/value row; renders nothing when the value is empty. */
function Row({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  if (value === null || value === "") return null;
  return (
    <div className="dig-row">
      <span className="dig-row-label">{label}</span>
      <span className={mono ? "dig-row-value dig-mono" : "dig-row-value"}>{value}</span>
    </div>
  );
}

export default function F5BigipLicenseExplainerTool() {
  const t = useTranslations("tools.f5-bigip-license-explainer");

  const [input, setInput] = useState("");
  const [result, setResult] = useState<ParsedBigipLicense | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        setResult(null);
        setError(null);
        return;
      }
      try {
        setResult(run(trimmed));
        setError(null);
      } catch (e) {
        const code = e instanceof BigipLicenseError ? e.code : "notRecognized";
        setError(t(`errors.${code}`));
        setResult(null);
      }
    },
    [t]
  );

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    compute(e.target.value);
  }

  const r = result;
  const scd = r?.serviceCheckDate ?? null;

  return (
    <div className="cidr-tool jwt-tool dig-tool">
      <div className="dig-input-head">
        <label htmlFor="lic-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          {/* The example is the masked, structure-faithful direct-license
              fixture the golden vectors run against - real grammar, no keys. */}
          <button type="button" className="b64-copy" onClick={() => { setInput(FIXTURE_DIRECT); compute(FIXTURE_DIRECT); }}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => { setInput(""); compute(""); }}>{t("clear")}</button>
        </div>
      </div>
      <textarea
        id="lic-in"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        value={input}
        onChange={onChange}
        placeholder={t("inputPlaceholder")}
        spellCheck={false}
        rows={12}
      />
      <p className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}</p>

      {error && (
        <p className="cidr-error" role="alert">{error}</p>
      )}

      {r && (
        <div className="jwt-results">
          {/* ---- Identity: flavor + header block ---- */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("identity.heading")}</h4>
            <div className="jwt-badges">
              <span className={`jwt-badge mono ${r.flavor === "unknown" ? "" : "jwt-badge--ok"}`}>
                {t(`flavor.${r.flavor}`)}
              </span>
            </div>
            <dl className="jwt-claims" style={{ marginTop: "0.75rem" }}>
              <Row label={t("identity.header")} value={r.headerTitle} />
              <Row label={t("identity.usage")} value={r.usage} />
              <Row label={t("identity.vendor")} value={r.vendor} />
              <Row label={t("identity.authVers")} value={r.authVers} mono />
            </dl>
          </section>

          {/* ---- Dates + the K7727 verdict ---- */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("dates.heading")}</h4>
            <dl className="jwt-claims">
              <Row label={t("dates.licensedDate")} value={r.licensedDate ? `${r.licensedDate.iso} (${r.licensedDate.compact})` : t("dates.absent")} mono />
              <Row label={t("dates.serviceCheckDate")} value={scd ? `${scd.iso} (${scd.compact})` : t("dates.absent")} mono />
              <Row label={t("dates.serviceStatus")} value={r.serviceStatus} />
              <Row label={t("dates.start")} value={r.licenseStart ? `${r.licenseStart.iso}` : t("dates.absent")} mono />
              <Row label={t("dates.end")} value={r.licenseEnd ? `${r.licenseEnd.iso}` : t("dates.absent")} mono />
            </dl>
            {scd && (
              <>
                {/* Upgrade eligibility straight from the shared K7727 table. */}
                {scd.k7727.newestReachable && (
                  <div className="jwt-badges" style={{ marginTop: "0.6rem" }}>
                    <span className="jwt-badge jwt-badge--ok mono">
                      {t("dates.k7727Newest", { label: scd.k7727.newestReachable.label })}
                    </span>
                  </div>
                )}
                {scd.k7727.nextBlocked && (
                  <p className="cipher-note">
                    {t("dates.k7727Blocked", {
                      label: scd.k7727.nextBlocked.label,
                      date: scd.k7727.nextBlocked.dateISO,
                    })}
                  </p>
                )}
              </>
            )}
          </section>

          {/* ---- Platform + keys ---- */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("platform.heading")}</h4>
            <dl className="jwt-claims">
              <Row label={t("platform.regKey")} value={r.registrationKey?.value ?? t("dates.absent")} mono />
              <Row label={t("platform.licensedVersion")} value={r.licensedVersion} mono />
              <Row
                label={t("platform.platformId")}
                value={r.platformId ? `${r.platformId.id}${r.platformId.decoded ? ` = ${r.platformId.decoded}` : ""}` : null}
                mono
              />
              <Row label={t("platform.applianceSN")} value={r.applianceSN} mono />
            </dl>
            {r.registrationKey && !r.registrationKey.shapeValid && (
              <p className="cipher-note">{t("platform.regKeyOdd")}</p>
            )}
            {r.platformId && r.platformId.decoded === null && (
              <p className="cipher-note">{t("platform.decodedUnknown")}</p>
            )}
          </section>

          {/* ---- Modules: active (with per-module keys) + optional ---- */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("modules.heading")}</h4>
            {r.activeModules.map((m, i) => (
              <div key={`${m.name}-${i}`} style={{ marginBottom: "0.75rem" }}>
                <div className="jwt-badges">
                  <span className="jwt-badge jwt-badge--ok">{m.name}</span>
                  {m.key && <span className="jwt-badge mono">{m.key}</span>}
                </div>
                {m.features.length > 0 && (
                  <p className="cipher-note" style={{ marginTop: "0.35rem" }}>
                    {t("modules.featuresLabel")} {m.features.join(" | ")}
                  </p>
                )}
              </div>
            ))}
            {r.optionalModules.length > 0 && (
              <>
                <h4 className="jwt-panel-title" style={{ marginTop: "0.75rem" }}>{t("modules.optionalHeading")}</h4>
                <p className="cipher-note">{t("modules.optionalNote")}</p>
                <dl className="jwt-claims">
                  {r.optionalModules.map((name, i) => (
                    <div className="jwt-claim-row" key={`${name}-${i}`}>
                      <dd className="jwt-claim-value">{name}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </section>

          {/* ---- Version / platform constraints (only when present) ---- */}
          {(r.exclusiveVersions.length > 0 || r.denyVersions.length > 0 || r.exclusivePlatforms.length > 0) && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("constraints.heading")}</h4>
              <dl className="jwt-claims">
                <Row label={t("constraints.exclusiveVersions")} value={r.exclusiveVersions.length > 0 ? r.exclusiveVersions.join(", ") : null} mono />
                <Row label={t("constraints.denyVersions")} value={r.denyVersions.length > 0 ? r.denyVersions.join(", ") : null} mono />
                <Row label={t("constraints.exclusivePlatforms")} value={r.exclusivePlatforms.length > 0 ? r.exclusivePlatforms.join(", ") : null} mono />
              </dl>
              {/* Sourced reading of the Exclusive_version list: the permitted
                  BIG-IP range comes from the BIG-IP-style entries, and F5's
                  own K42091606 example includes low 5-8 entries alongside them
                  (unlabeled by F5), so they are surfaced but never counted. */}
              {r.exclusiveVersions.length > 0 && (
                <p className="cipher-note">{t("constraints.exvNote")}</p>
              )}
              {r.bigipVersionCeiling && (
                <p className="cipher-note">{t("constraints.ceiling", { glob: r.bigipVersionCeiling })}</p>
              )}
            </section>
          )}

          {/* ---- Feature / limit tokens ---- */}
          {r.tokens.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("tokens.heading")}</h4>
              <p className="cipher-note">{t("tokens.count", { n: r.tokens.length })}</p>
              <dl className="jwt-claims">
                {r.tokens.map((tok, i) => (
                  <div className="jwt-claim-row" key={`${tok.key}-${i}`}>
                    <dt className="jwt-claim-label mono">{tok.key}</dt>
                    <dd className="jwt-claim-value mono">{tok.raw}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* ---- Validation material: presence + length ONLY ---- */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("validation.heading")}</h4>
            <p className="cipher-note">{t("validation.privacy")}</p>
            <dl className="jwt-claims">
              <Row label={t("validation.dossier")} value={r.validation.dossier.present ? t("validation.present", { n: r.validation.dossier.length }) : t("validation.absentValue")} />
              <Row label={t("validation.authorization")} value={r.validation.authorization.present ? t("validation.present", { n: r.validation.authorization.length }) : t("validation.absentValue")} />
              <Row label={t("validation.managerKey")} value={r.validation.licenseManagerKey.present ? t("validation.present", { n: r.validation.licenseManagerKey.length }) : t("validation.absentValue")} />
              <Row label={t("validation.poolInfo")} value={r.validation.poolLicenseInformation.present ? t("validation.present", { n: r.validation.poolLicenseInformation.length }) : t("validation.absentValue")} />
              <Row label={t("validation.certAuth")} value={r.validation.certificateAuth} mono />
            </dl>
          </section>

          <p className="cidr-privacy" style={{ marginTop: "1rem" }}>
            {t("stats.line", {
              kv: r.stats.kvLines,
              comments: r.stats.commentLines,
              unrec: r.stats.unrecognizedLines,
            })}
            {" "}
            {t("verifyNote")}
          </p>
        </div>
      )}
    </div>
  );
}
