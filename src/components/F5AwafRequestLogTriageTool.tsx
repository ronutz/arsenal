"use client";

// ============================================================================
// src/components/F5AwafRequestLogTriageTool.tsx
// ----------------------------------------------------------------------------
// Paste an ASM request-log entry (syslog key-value or CEF) and the pure parser
// extracts the policy, support ID, status, violation rating, client IP,
// method, and URI, classifies each violation, and gives F5's rating-based
// verdict, then bridges to the false-positive triage tool for the per-violation
// fix. Everything runs in the browser (D-49); nothing is fetched. Field names
// and violation classification come from F5's ASM logging documentation.
//
// Share results (2026-10-27): a button under the verdict builds a link that
// carries a copy of the line rebuilt from the fields this page reads, never
// the line as pasted (its request, headers, cookies and the rest stay out);
// the copy must read the same, and the family's secrets check reads it first.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { parseAsmLog, type LogNote } from "@/lib/tools/f5-awaf-request-log-triage";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first maybe-secret, for the caution line
import { LOG_TRIAGE_SHARE, encodeLogShare, logShareCopy } from "@/lib/tools/f5-awaf-request-log-triage/share"; // this tool's share spec: the copy of the fields read

// F5's syslog key-value sample (Example) - real ASM sample event message.
const EXAMPLE =
  'ASM:policy_name="web_app_default",' +
  'violations="Illegal meta character in parameter value,Illegal file type,Attack signature detected",' +
  'violation_rating="2",support_id="5268275531735896872",request_status="blocked",' +
  'ip_client="192.168.74.169",method="GET",protocol="HTTP",uri="/phpauction/search.php"';

const VERDICT_SEV: Record<string, "safe" | "info" | "danger" | "muted"> = {
  "likely-fp": "safe",
  investigate: "info",
  "likely-attack": "danger",
  "no-rating": "muted",
};

export default function F5AwafRequestLogTriageTool() {
  const t = useTranslations("tools.f5-awaf-request-log-triage");
  const [input, setInput] = useState("");
  const inputPlaceholder = t.raw("inputPlaceholder");
  const r = useMemo(() => parseAsmLog(input), [input]);
  const has = input.trim().length > 0;

  // An arriving share link (2026-10-27): the copy fills the box as a paste would, and the page reads it as usual.
  useShareArrival(LOG_TRIAGE_SHARE, (s) => setInput(s.input)); // the link's text
  // The copy of the fields the page read, checked once per change: it decides the button and its popover lines.
  const copy = useMemo(() => logShareCopy(r), [r]); // the copy and its check, or why there is none
  const share = useMemo(() => encodeLogShare(copy), [copy]); // what Share results may carry
  const maybe = copy.ok ? firstSharePlace(copy.report.maybe) : null; // the first secret-looking name in the copy, or null
  // The popover's line when there is no link (the copy is never the paste, so each reason is said plainly).
  const blocked = !share.ok && share.reason === "blocked" ? (share.code === "secret" ? t("share.blockedSecret", { label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : share.code === "unparsed" ? t("share.blockedUnparsed") : t("share.blockedCopy")) : ""; // or nothing

  const noteText = (n: LogNote): string => {
    switch (n.kind) {
      case "no-rating": return t("note.noRating");
      case "rating-attack": return t("note.ratingAttack", { rating: n.rating });
      case "rating-fp": return t("note.ratingFp", { rating: n.rating });
      case "rating-investigate": return t("note.ratingInvestigate", { rating: n.rating });
      case "unparsed": return t("note.unparsed");
      case "support-id-opaque": return t("note.supportIdOpaque");
      case "bridge-to-triage": return t("note.bridge");
      default: return "";
    }
  };

  const sev = r ? VERDICT_SEV[r.verdict] ?? "info" : "info";
  const catLabel = (c: string) => (c === "unknown" ? t("catUnknown") : t(`cat.${c}`));

  // Ordered field list for display (label key, value).
  const fieldRows = r
    ? ([
        ["supportId", r.fields.supportId],
        ["policy", r.fields.policyName],
        ["status", r.fields.status !== "unknown" ? t(`status.${r.fields.status}`) : null],
        ["rating", r.fields.violationRating !== null ? String(r.fields.violationRating) : null],
        ["client", r.fields.clientIp],
        ["method", r.fields.method],
        ["uri", r.fields.uri],
        ["attackType", r.fields.attackType],
        ["xff", r.fields.xForwardedFor],
      ] as const)
    : [];

  return (
    <div className="cidr-tool jwt-tool dig-tool json-tool tmsh-tool fp-tool log-tool">
      <div className="dig-input-head">
        <label htmlFor="log-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
        </div>
      </div>
      <textarea
        id="log-in"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={inputPlaceholder}
        spellCheck={false}
        rows={7}
      />
      <p className="cidr-privacy"><span className="cidr-lock">&#128274;</span> {t("runsLocally")}</p>

      {!has && <div className="awaf-empty">{t("empty")}</div>}

      {r && has && (
        <div className="tmsh-results log-results">
          {/* Verdict */}
          <section className={`poison-verdict poison-verdict-${sev === "muted" ? "info" : sev}`}>
            <h3 className="poison-verdict-head">{t(`verdict.${r.verdict}`)}</h3>
            <span className="log-format-chip">{t(`format.${r.format}`)}</span>
          </section>

          {/* Share results (2026-10-27): under the verdict, at the start of its own row. The caution names what the copy
              keeps (the client address and the URI), or the first secret-looking name in it. */}
          <div className="rdap-ask-row">
            <ShareResultsButton
              encoding={share}
              carries={t("share.carries")}
              details={[maybe ? t("share.maybeSecret", { label: maybe.label }) : t("share.caution")]}
              blockedMessage={blocked}
              title={t("name")}
            />
          </div>

          {/* Parsed fields */}
          {r.format !== "unknown" && (
            <section className="persist-section">
              <h3 className="persist-heading">{t("fieldsHeading")}</h3>
              <dl className="log-fields">
                {fieldRows.map(([key, val]) =>
                  val ? (
                    <div className="log-field-row" key={key}>
                      <dt className="log-field-key">{t(`f.${key}`)}</dt>
                      <dd className="log-field-val mono">{val}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
            </section>
          )}

          {/* Violations classified */}
          {r.violations.length > 0 && (
            <section className="persist-section">
              <h3 className="persist-heading">{t("violationsHeading")} ({r.violations.length})</h3>
              <ul className="log-violations">
                {r.violations.map((v, i) => (
                  <li className="log-violation" key={i}>
                    <span className={`log-cat-chip log-cat-${v.category === "unknown" ? "other" : "security"}`}>{catLabel(v.category)}</span>
                    <span className="log-violation-name">{v.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Notes */}
          {r.notes.length > 0 && (
            <section className="persist-section">
              <h3 className="persist-heading">{t("notesHeading")}</h3>
              <ul className="poison-notes">
                {r.notes.map((n, i) => {
                  const txt = noteText(n);
                  if (!txt) return null;
                  return <li key={i} className="poison-note">{txt}</li>;
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
