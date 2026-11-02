"use client";

// ============================================================================
// src/components/F5AwafDeclarativePolicyExplainerTool.tsx
// ----------------------------------------------------------------------------
// Client UI for the F5 Advanced WAF declarative-policy explainer. Follows the
// house tool pattern (cidr-/dig-/jwt- classes, Row helper, textarea + privacy
// note): paste a declarative WAF policy JSON, and the pure engine decodes it on
// every keystroke. PAGE LANGUAGE (01/11/2026): the section labels, summaries
// and group names are looked up by section key and group name, and the
// details, security flags, reasons and template note arrive as EngineTexts from
// parseAwafPolicyLocalisable(), all under engine.* in the pack, so the pt-BR
// page reads in Portuguese (F5's own terms kept); a key the pack lacks shows
// the engine's English. Nothing is fetched; nothing leaves the browser (D-49).
//
// Share results (2026-10-27): a button under the overview and its security
// notes builds a link that carries the policy as pasted, after the family's
// secrets check (src/lib/share/text-secrets.ts): a credential blocks the link and the
// popover names its line; a secret-looking name or a webhook URL is named in
// the caution line.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { GROUPS } from "@/lib/tools/f5-awaf-declarative-policy-explainer";
import { parseAwafPolicyLocalisable, jsonErrorLocation } from "@/lib/tools/f5-awaf-declarative-policy-explainer/compute"; // the reading with sentence ids (01/11/2026); where a JSON error sits (2026-11-02)
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first maybe-secret, for the caution line
import { AWAF_POLICY_SHARE, checkAwafPolicyText, encodeAwafPolicyShare } from "@/lib/tools/f5-awaf-declarative-policy-explainer/share"; // this tool's share spec and its check

// A demo policy chosen to exercise the value-reading callouts: transparent
// (monitor-only) + signature staging + XFF trust all raise flags, while Data
// Guard is on. Field names/values are taken from F5's v17.1 schema.
const EXAMPLE = JSON.stringify(
  {
    policy: {
      name: "shop-api-policy",
      description: "Storefront API",
      template: { name: "POLICY_TEMPLATE_API_SECURITY" },
      enforcementMode: "transparent",
      "server-technologies": [{ serverTechnologyName: "MySQL" }, { serverTechnologyName: "Unix/Linux" }],
      "signature-settings": { signatureStaging: true },
      general: { trustXff: true, enforcementReadinessPeriod: 7 },
      "data-guard": { enabled: true, creditCardNumbers: true },
      "policy-builder": { autoApply: false },
    },
  },
  null,
  2,
);

/** Severity glyphs: ▲ warn, ● note, • info. */
const MARK: Record<string, string> = { warn: "\u25B2", note: "\u25CF", info: "\u2022" };

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="dig-row">
      <span className="dig-row-label">{label}</span>
      <span className={mono ? "dig-row-value dig-mono" : "dig-row-value"}>{value}</span>
    </div>
  );
}

export default function F5AwafDeclarativePolicyExplainerTool() {
  const t = useTranslations("tools.f5-awaf-declarative-policy-explainer");
  const tx = engineTexts(t); // the engine's sentences and the registry's texts in the page's language
  const [input, setInput] = useState("");

  // The empty-textarea example is a literal JSON snippet, so it must bypass
  // ICU parsing (t.raw): the sample's braces read as ICU message arguments
  // and fail with INVALID_MESSAGE, collapsing the placeholder to a fallback
  // key path in every locale. Build-wide guard: scripts/check-icu-messages.mjs.
  const inputPlaceholder = t.raw("inputPlaceholder");

  // Pure, synchronous decode on every change. No effects, no fetching.
  const parsed = useMemo(() => parseAwafPolicyLocalisable(input), [input]); // sentences with ids (01/11/2026)

  const has = input.trim().length > 0;
  const show = has && parsed.recognized;
  const showNot = has && !parsed.recognized;
  // Where a JSON syntax error sits (2026-11-02): from the browser's message, or the site's own scan when it gives none.
  const errorAt = useMemo(() => (parsed.parseError ? jsonErrorLocation(input, parsed.parseError) : null), [parsed, input]); // or null

  // An arriving share link (2026-10-27): the box fills as a paste would, and the page reads it as usual.
  useShareArrival(AWAF_POLICY_SHARE, (s) => setInput(s.input)); // the link's text
  // The secrets check, once per change of a recognised policy: it decides the button and the caution line.
  const secrets = useMemo(() => (show ? checkAwafPolicyText(input) : null), [show, input]); // null while there is no reading
  // What Share results may carry: the policy as pasted, unless it holds a credential (memoised).
  const share = useMemo<ShareEncoding>(() => (secrets ? encodeAwafPolicyShare({ input }, true, secrets) : NOTHING), [secrets, input]); // the encoding
  // The first value whose name looks like a secret, for the caution line.
  const maybe = useMemo(() => (secrets ? firstSharePlace(secrets.maybe) : null), [secrets]); // or null

  return (
    <div className="cidr-tool jwt-tool dig-tool awaf-tool">
      <div className="dig-input-head">
        <label htmlFor="awaf-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
        </div>
      </div>
      <textarea
        id="awaf-in"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={inputPlaceholder}
        spellCheck={false}
        rows={12}
      />
      <p className="cidr-privacy"><span className="cidr-lock">&#128274;</span> {t("runsLocally")}</p>

      {!has && <div className="awaf-empty">{t("empty")}</div>}

      {/* Not valid JSON (2026-11-02): the page says so, and where, in its own language; the browser's message follows in
          code type as a detail, since it is the browser's text and stays in the browser's language. */}
      {showNot && parsed.parseError && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("parseError")}</p>
          {errorAt && <p className="json-error-location">{t("parseErrorAt", { line: errorAt.line, column: errorAt.column })}</p>}
          <p className="json-error-message">{t("parseErrorDetail")} <code>{parsed.parseError}</code></p>
        </div>
      )}
      {/* Valid JSON that is not a WAF policy: the reason, in the page's language. */}
      {showNot && !parsed.parseError && (
        <div className="dig-notdig">
          {`${t("notRecognized")}. ${tx.say(parsed.unrecognizedReason)}`}
        </div>
      )}

      {show && (
        <div className="awaf-result">
          {/* Overview: name / template / enforcement */}
          <div className="awaf-overview">
            {parsed.policyName && <Row label={t("overviewHeading")} value={parsed.policyName} mono />}
            <Row label={t("labelTemplate")} value={parsed.templateName ?? ""} mono />
            <Row label={t("labelEnforcement")} value={parsed.enforcement ?? ""} mono />
          </div>

          {/* The template-delta caveat (always shown for a recognized policy). */}
          <div className="awaf-note">{tx.say(parsed.templateNote)}</div>

          {/* Security notes (cross-cutting, value-derived callouts). */}
          {parsed.securityFlags.length > 0 && (
            <div className="jwt-panel awaf-flags">
              <div className="jwt-panel-title">{t("securityHeading")}</div>
              <ul className="awaf-flag-list">
                {parsed.securityFlags.map((f, i) => (
                  <li key={i} className={`awaf-flag awaf-flag-${f.severity}`}>
                    <span className="awaf-flag-mark">{MARK[f.severity] ?? MARK.info}</span> {tx.say(f.message)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Share results (2026-10-27): under the overview and its security notes, before the long section-by-section
              reading, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton
              encoding={share}
              carries={t("share.carries")}
              details={[maybe ? t("share.maybeSecret", { line: maybe.line, label: maybe.label, more: maybe.more }) : t("share.caution")]}
              blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""}
              title={t("name")}
            />
          </div>

          {/* Sections, grouped in reading order. */}
          <div className="awaf-sections">
            <div className="jwt-panel-title awaf-sections-title">{t("sectionsHeading")}</div>
            {GROUPS.map((group) => {
              const secs = parsed.sections.filter((s) => s.group === group);
              if (secs.length === 0) return null;
              return (
                <div className="awaf-group" key={group}>
                  <h4 className="awaf-group-heading">{tx.key(`group.${group.toLowerCase().replace(/ /g, "-")}`, group)}</h4>
                  {secs.map((s) => (
                    <div className="awaf-section" key={s.key}>
                      <div className="awaf-section-label">{tx.key(`sec.${s.key}.label`, s.label)}</div>
                      <div className="awaf-section-summary">{tx.key(`sec.${s.key}.summary`, s.summary)}</div>
                      {s.detail && (
                        <div className={`awaf-section-detail awaf-detail-${s.severity ?? "info"}`}>{tx.say(s.detail)}</div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Present-but-not-explained keys, acknowledged. */}
          {parsed.unknownKeys.length > 0 && (
            <div className="awaf-unknown">
              <div className="jwt-panel-title">{t("unknownHeading")}</div>
              <p className="awaf-unknown-list dig-mono">{parsed.unknownKeys.join(", ")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
