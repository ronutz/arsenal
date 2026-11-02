"use client";

// ============================================================================
// src/components/F5AwafEvasionExplainerTool.tsx
// ----------------------------------------------------------------------------
// Client UI for the F5 Advanced WAF evasion-technique explainer. Follows the
// house tool pattern (cidr-/dig-/jwt- classes, textarea + privacy note, the
// D-83 Example/Clear row). Two modes off one input: type a sub-violation name
// or "evasions" for the reference cards, or paste an `evasions` block / whole
// declarative policy for the enabled/disabled read-back with the Multiple-
// decoding pass count. The engine is pure and decode-only; nothing is fetched
// and nothing leaves the browser (D-49). Sub-violation names, defaults, and
// descriptions come from F5's K7929 / ASM 17.5 violation chapter; the frame
// text and each card's prose are localized here.
//
// Share results (2026-10-27): a button, first in the answer (the cards run
// long), builds a link that carries the box as typed. A pasted block or policy
// goes through the AWAF policy secrets check first (a credential blocks the
// link; a secret-looking name or a webhook URL is named in the caution line);
// a keyword or a name needs no caution.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { explainEvasions, EVASION_TECHNIQUES, PASS_DEFAULT } from "@/lib/tools/f5-awaf-evasion-explainer";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first maybe-secret, for the caution line
import { checkAwafPolicyText } from "@/lib/tools/f5-awaf-declarative-policy-explainer/share"; // the AWAF policy secrets check
import { EVASION_SHARE, encodeEvasionShare, evasionHasAnswer } from "@/lib/tools/f5-awaf-evasion-explainer/share"; // this tool's share spec

// Example = F5's own eight-row reference (the "evasions" keyword), the highest-
// value first view; golden-vector-faithful (reference-all-eight).
const EXAMPLE = "evasions";

/** State glyphs: ✓ enabled, ✕ disabled, • not set. */
const STATE_MARK: Record<string, string> = { on: "\u2713", off: "\u2715", unset: "\u2022" };
/** Note glyphs: ▲ warn, ● note, • info. */
const NOTE_MARK: Record<string, string> = { warn: "\u25B2", note: "\u25CF", info: "\u2022" };

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

export default function F5AwafEvasionExplainerTool() {
  const t = useTranslations("tools.f5-awaf-evasion-explainer");
  const [input, setInput] = useState("");

  // The placeholder holds a literal JSON snippet, so it must bypass ICU
  // parsing (t.raw); braces would otherwise read as ICU arguments and fail.
  const inputPlaceholder = t.raw("inputPlaceholder");

  const result = useMemo(() => explainEvasions(input), [input]);
  const has = input.trim().length > 0;

  // An arriving share link (2026-10-27): the box fills as a paste would, and the page reads it as usual.
  useShareArrival(EVASION_SHARE, (s) => setInput(s.input)); // the link's text
  // Whether there is an answer to share, and the secrets check of a pasted policy, once per change.
  const answered = evasionHasAnswer(result); // reference cards, or a read-back that parsed
  const secrets = useMemo(() => (answered && result?.mode === "policy" ? checkAwafPolicyText(input) : null), [answered, result, input]); // only a policy is checked
  // What Share results may carry (memoised).
  const share = useMemo<ShareEncoding>(() => (answered ? encodeEvasionShare({ input }, result, secrets) : NOTHING), [answered, result, secrets, input]); // the encoding
  // The first value whose name looks like a secret, for the caution line of a policy.
  const maybe = useMemo(() => (secrets ? firstSharePlace(secrets.maybe) : null), [secrets]); // or null

  // Localized helpers for a technique key.
  const techName = (key: string) => t(`tech.${key}.name`);
  const techWhat = (key: string) => t(`tech.${key}.what`);
  const techCatches = (key: string) => t(`tech.${key}.catches`);
  const techTool = (key: string): string | null => {
    // A technique with no matching tool stores null; has() is false for it, so raw() is never asked and does not log
    // MISSING_MESSAGE (27/10/2026: two console errors on every run of the example, apache-ws and iis-backslash).
    if (!t.has(`tech.${key}.tool`)) return null;
    const v = t.raw(`tech.${key}.tool`);
    return typeof v === "string" && v.length > 0 ? v : null;
  };

  // Render a single note into localized prose + a severity for its glyph.
  function noteView(n: NonNullable<typeof result>["notes"][number]): { sev: string; text: string } | null {
    switch (n.kind) {
      case "not-a-policy":
        return { sev: "info", text: t("notes.notName") };
      case "parse-error":
        return { sev: "warn", text: `${t("notes.parseError")}: ${n.detail}` };
      case "no-evasions-block":
        return { sev: "info", text: t("notes.noBlock") };
      case "all-default":
        return { sev: "info", text: t("notes.allDefault") };
      case "disabled-present":
        return { sev: "warn", text: t("notes.disabled", { names: n.names.join(", ") }) };
      case "passes-out-of-range":
        return { sev: "warn", text: t("notes.passesRange", { value: n.value }) };
      case "passes-raised":
        return { sev: "note", text: t("notes.passesRaised", { value: n.value }) };
      case "unknown-entry":
        return { sev: "note", text: t("notes.unknownEntry", { description: n.description }) };
      case "learn-gated":
        return { sev: "note", text: t("notes.learnGated") };
      default:
        return null;
    }
  }

  const isReference = result?.mode === "reference";
  const isPolicy = result?.mode === "policy";
  const cards = isReference ? result!.cards : [];
  const showRefEmpty = isReference && cards.length === 0; // a name miss

  return (
    <div className="cidr-tool jwt-tool dig-tool awaf-tool">
      <div className="dig-input-head">
        <label htmlFor="evasion-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
        </div>
      </div>
      <textarea
        id="evasion-in"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={inputPlaceholder}
        spellCheck={false}
        rows={8}
      />
      <p className="cidr-privacy"><span className="cidr-lock">&#128274;</span> {t("runsLocally")}</p>

      {!has && <div className="awaf-empty">{t("empty")}</div>}

      {/* Notes (parse errors, disabled sub-violations, pass-count flags). */}
      {result && result.notes.length > 0 && (
        <div className="jwt-panel awaf-flags">
          <div className="jwt-panel-title">{t("notesHeading")}</div>
          <ul className="awaf-flag-list">
            {result.notes.map((n, i) => {
              const v = noteView(n);
              if (!v) return null;
              return (
                <li key={i} className={`awaf-flag awaf-flag-${v.sev}`}>
                  <span className="awaf-flag-mark">{NOTE_MARK[v.sev] ?? NOTE_MARK.info}</span> {v.text}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {showRefEmpty && <div className="dig-notdig">{t("nameMiss")}</div>}

      {/* Share results (2026-10-27): first in the answer (the cards run long), at the start of its own row. A policy
          gets the caution line (or the maybe-secret it names); a keyword or a name needs none. */}
      {answered && (
        <div className="rdap-ask-row">
          <ShareResultsButton
            encoding={share}
            carries={t("share.carries")}
            details={result?.mode === "policy" ? [maybe ? t("share.maybeSecret", { line: maybe.line, label: maybe.label, more: maybe.more }) : t("share.caution")] : []}
            blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""}
            title={t("name")}
          />
        </div>
      )}

      {/* POLICY MODE: the eight-row read-back. */}
      {isPolicy && result!.states.length > 0 && (
        <div className="awaf-result">
          <div className="jwt-panel-title awaf-sections-title">{t("stateHeading")}</div>
          <div className="awaf-sections">
            {result!.states.map((s) => {
              const stateKey = s.enabled === true ? "on" : s.enabled === false ? "off" : "unset";
              const stateLabel = s.enabled === true ? t("stateOn") : s.enabled === false ? t("stateOff") : t("stateUnset");
              return (
                <div className="awaf-section" key={s.technique.key}>
                  <div className="awaf-section-label">
                    <span className={`awaf-flag-mark awaf-state-${stateKey}`}>{STATE_MARK[stateKey]}</span>{" "}
                    {techName(s.technique.key)}: <span className="dig-row-value">{stateLabel}</span>
                  </div>
                  <div className="awaf-section-summary">{techWhat(s.technique.key)}</div>
                  {s.technique.hasPassCount && (
                    <div className="awaf-section-detail awaf-detail-info">
                      {s.passes != null
                        ? t("passesSet", { value: s.passes })
                        : t("passesDefault", { value: PASS_DEFAULT })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* REFERENCE MODE: the sub-violation cards. */}
      {isReference && cards.length > 0 && (
        <div className="awaf-result">
          <div className="jwt-panel-title awaf-sections-title">{t("refHeading")}</div>
          <div className="awaf-sections">
            {cards.map((c) => {
              const tool = techTool(c.key);
              return (
                <div className="awaf-section" key={c.key}>
                  <div className="awaf-section-label">
                    {techName(c.key)}: <span className="dig-row-value">{t("defaultEnabled")}</span>
                  </div>
                  <div className="awaf-section-summary">{techWhat(c.key)}</div>
                  <div className="awaf-section-detail awaf-detail-note">{t("catchesLabel")}: {techCatches(c.key)}</div>
                  {c.hasPassCount && (
                    <div className="awaf-section-detail awaf-detail-info">{t("passesDefault", { value: PASS_DEFAULT })}</div>
                  )}
                  {tool && <div className="awaf-section-detail awaf-detail-info">{t("relatedToolLabel")}: {tool}</div>}
                </div>
              );
            })}
          </div>
          <p className="awaf-note">{t("bridgeNote")}</p>
        </div>
      )}
    </div>
  );
}
