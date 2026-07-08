// ============================================================================
// src/components/DevOutAsnLookupTool.tsx
// ----------------------------------------------------------------------------
// ASN LOOKUP - the second /dev/out tool, same privacy rule as the first:
// NOTHING LEAVES THE BROWSER UNTIL THE PERSON PRESSES ASK.
//
// Typing runs only the deterministic layers (classify -> special-purpose
// table -> vendored-bootstrap routing -> URL) and shows, before any egress,
// exactly which RIR would be asked. Two whole classes of answer need no
// network at all and get none: special-purpose ASNs (AS0, AS112, AS_TRANS,
// documentation, private use, the RFC 7300 reserved ends) are explained with
// their RFC, and bootstrap gaps are reported as unallocated - an answer, not
// an error. One honest extra: some RIRs redirect NIR-delegated numbers
// (LACNIC hands Brazilian ASNs to rdap.registro.br, verified 2026-07-08);
// fetch follows the redirect and the result names who actually answered.
// ============================================================================
"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  planAsn,
  summarizeAutnum,
  curlCommand,
  AsnError,
  BOOTSTRAP_SNAPSHOT,
  SPECIAL_REGISTRY_SNAPSHOT,
  type AutnumSummary,
} from "@/lib/dev-out/asn/compute";

// Example input, faithful to the golden vectors (routing vector "arin").
const EXAMPLE = "AS15169";

type FetchState =
  | { phase: "idle" }
  | { phase: "loading"; host: string }
  | { phase: "done"; summary: AutnumSummary; raw: unknown; url: string; answeredBy: string }
  | { phase: "notFound"; url: string }
  | { phase: "httpError"; status: number; url: string }
  | { phase: "netError"; url: string };

export default function DevOutAsnLookupTool() {
  const t = useTranslations("devOut.asn");

  const [value, setValue] = useState("");
  const [fetchState, setFetchState] = useState<FetchState>({ phase: "idle" });

  // The deterministic pre-flight: recomputed on every keystroke, zero egress.
  const plan = useMemo(() => {
    const trimmed = value.trim();
    if (trimmed === "") return { kind: "empty" as const };
    try {
      return { kind: "ok" as const, plan: planAsn(trimmed) };
    } catch (e) {
      const code = e instanceof AsnError ? e.code : "format";
      return { kind: "error" as const, code };
    }
  }, [value]);

  const onChange = useCallback((next: string) => {
    setValue(next);
    setFetchState({ phase: "idle" }); // stale results never outlive their input
  }, []);

  // The one and only egress point: an explicit user action.
  const ask = useCallback(async () => {
    if (plan.kind !== "ok" || plan.plan.kind !== "query") return;
    const { url } = plan.plan;
    const host = new URL(url).hostname;
    setFetchState({ phase: "loading", host });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/rdap+json" },
        signal: controller.signal,
      });
      if (res.status === 404) {
        setFetchState({ phase: "notFound", url });
      } else if (!res.ok) {
        setFetchState({ phase: "httpError", status: res.status, url });
      } else {
        const raw: unknown = await res.json();
        // res.url is the FINAL hop after any redirects - who really answered.
        const answeredBy = res.url ? new URL(res.url).hostname : host;
        setFetchState({ phase: "done", summary: summarizeAutnum(raw), raw, url, answeredBy });
      }
    } catch {
      // TypeError covers both network failure and a missing CORS header (RIPE,
      // as of 2026-07-08); the message explains both and hands over the curl.
      setFetchState({ phase: "netError", url });
    } finally {
      clearTimeout(timer);
    }
  }, [plan]);

  const summaryRow = (label: string, val: string | null) =>
    val ? (
      <div className="jwt-claim-row">
        <dt className="jwt-claim-label">{label}</dt>
        <dd className="jwt-claim-value mono">{val}</dd>
      </div>
    ) : null;

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="asn-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => onChange(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => onChange("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        <input
          id="asn-input"
          className="cidr-input mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") ask();
          }}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("nothingLeaves")}
        </p>
      </div>

      {/* Pre-flight verdict: computed locally, shown before any egress. */}
      {plan.kind === "error" && (
        <p className="cidr-error" role="alert">
          {t(`errors.${plan.code}`)}
        </p>
      )}

      {/* Special-purpose ASN: a complete answer with zero egress. */}
      {plan.kind === "ok" && plan.plan.kind === "special" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">
              {plan.plan.normalized} — {t(`special.${plan.plan.special.reasonKey}`)}
            </h4>
            <p className="cipher-note">
              {t("special.body", { rfc: plan.plan.special.rfc })}{" "}
              {t("special.range", {
                range:
                  plan.plan.special.start === plan.plan.special.end
                    ? `AS${plan.plan.special.start}`
                    : `AS${plan.plan.special.start}-AS${plan.plan.special.end}`,
              })}
            </p>
            <p className="cipher-note">{t("special.noEgress")}</p>
          </section>
        </div>
      )}

      {/* Unallocated: a bootstrap gap is an answer, not an error. */}
      {plan.kind === "ok" && plan.plan.kind === "unallocated" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">
              {plan.plan.normalized} — {t("unallocated.title")}
            </h4>
            <p className="cipher-note">{t("unallocated.body")}</p>
          </section>
        </div>
      )}

      {plan.kind === "ok" && plan.plan.kind === "query" && (
        <>
          <p className="rdap-plan">
            {t("willAsk", { registry: plan.plan.registryHost })}{" "}
            <code className="mono">{plan.plan.url}</code>
          </p>
          <div className="rdap-ask-row">
            <button
              type="button"
              className="b64-copy"
              onClick={ask}
              disabled={fetchState.phase === "loading"}
            >
              {fetchState.phase === "loading" ? t("asking") : t("ask")}
            </button>
            <span className="envout-badge mono">{t("egressBadge")}</span>
          </div>
        </>
      )}

      {/* Result panels. */}
      {fetchState.phase === "notFound" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("notFoundTitle")}</h4>
            <p className="cipher-note">{t("notFoundBody")}</p>
          </section>
        </div>
      )}
      {fetchState.phase === "httpError" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("httpErrorTitle", { status: fetchState.status })}</h4>
            <p className="cipher-note">{t("httpErrorBody")}</p>
            <p className="cipher-note mono">{curlCommand(fetchState.url)}</p>
          </section>
        </div>
      )}
      {fetchState.phase === "netError" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("netErrorTitle")}</h4>
            <p className="cipher-note">{t("netErrorBody")}</p>
            <p className="cipher-note mono">{curlCommand(fetchState.url)}</p>
          </section>
        </div>
      )}
      {fetchState.phase === "done" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">
              {fetchState.summary.range ?? t("resultTitle")}
              {fetchState.summary.name ? ` — ${fetchState.summary.name}` : ""}
            </h4>
            {fetchState.summary.status.length > 0 && (
              <div className="jwt-badges" style={{ marginTop: "0.5rem" }}>
                {fetchState.summary.status.map((s) => (
                  <span key={s} className="jwt-badge jwt-badge--ok mono">
                    {s}
                  </span>
                ))}
              </div>
            )}
            <dl className="jwt-claims" style={{ marginTop: "0.75rem" }}>
              {summaryRow(t("fields.handle"), fetchState.summary.handle)}
              {summaryRow(t("fields.holder"), fetchState.summary.holder)}
              {Object.entries(fetchState.summary.events).map(([action, date]) => (
                <div className="jwt-claim-row" key={action}>
                  <dt className="jwt-claim-label">{action}</dt>
                  <dd className="jwt-claim-value mono">{date.slice(0, 10)}</dd>
                </div>
              ))}
              {summaryRow(t("fields.port43"), fetchState.summary.port43)}
              {summaryRow(t("fields.answeredBy"), fetchState.answeredBy)}
            </dl>
            {fetchState.answeredBy !== new URL(fetchState.url).hostname && (
              <p className="cipher-note">{t("redirectNote", { host: fetchState.answeredBy })}</p>
            )}
            {/* The raw document, honest and complete, one click away. */}
            <details style={{ marginTop: "0.75rem" }}>
              <summary className="cipher-note">{t("rawToggle")}</summary>
              <pre className="mono" style={{ fontSize: "0.75rem", overflowX: "auto" }}>
                {JSON.stringify(fetchState.raw, null, 2)}
              </pre>
            </details>
          </section>
        </div>
      )}

      {/* Provenance of the deterministic layers. */}
      <p className="cipher-note" style={{ marginTop: "1rem" }}>
        {t("provenance", {
          asnPub: BOOTSTRAP_SNAPSHOT.publications.asn.slice(0, 10),
          vendored: BOOTSTRAP_SNAPSHOT.vendored,
          specialAccessed: SPECIAL_REGISTRY_SNAPSHOT.accessed,
        })}
      </p>
    </div>
  );
}
