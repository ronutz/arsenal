// ============================================================================
// src/components/DevOutRdapTool.tsx
// ----------------------------------------------------------------------------
// RDAP LOOKUP - the first /dev/out tool, built around one privacy rule:
// NOTHING LEAVES THE BROWSER UNTIL THE PERSON PRESSES ASK.
//
// Typing runs only the deterministic layers (classify -> vendored-bootstrap
// endpoint selection -> URL) and shows, before any egress, exactly which
// registry would be asked. The fetch happens on an explicit button press,
// browser-direct to the official registry (never through ronutz.com servers
// in this version). Failure paths are designed, not hidden:
//   - HTTP 404      -> "the registry has no object by that name" (honest)
//   - other HTTP    -> status shown verbatim
//   - network/CORS  -> explained (some registries, RIPE among them as of
//                      2026-07-08, do not send CORS headers), with the exact
//                      curl equivalent to run locally instead
// Styling reuses the established tool vocabulary (cidr-*, jwt-*, cipher-note,
// b64-copy); inside .env-other the tokens render green for free.
// ============================================================================
"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  planQuery,
  parseRdapResponse,
  curlCommand,
  RdapError,
  BOOTSTRAP_SNAPSHOT,
  type RdapSummary,
} from "@/lib/dev-out/rdap/compute";

// Example input, faithful to the golden vectors (domain-com).
const EXAMPLE = "example.com";

type FetchState =
  | { phase: "idle" }
  | { phase: "loading"; host: string }
  | { phase: "done"; summary: RdapSummary; raw: unknown; url: string }
  | { phase: "notFound"; url: string }
  | { phase: "httpError"; status: number; url: string }
  | { phase: "netError"; url: string };

export default function DevOutRdapTool() {
  const t = useTranslations("devOut.rdap");

  const [value, setValue] = useState("");
  const [fetchState, setFetchState] = useState<FetchState>({ phase: "idle" });

  // The deterministic pre-flight: recomputed on every keystroke, zero egress.
  const plan = useMemo(() => {
    const trimmed = value.trim();
    if (trimmed === "") return { kind: "empty" as const };
    try {
      return { kind: "ok" as const, plan: planQuery(trimmed) };
    } catch (e) {
      const code = e instanceof RdapError ? e.code : "format";
      return { kind: "error" as const, code };
    }
  }, [value]);

  const onChange = useCallback((next: string) => {
    setValue(next);
    setFetchState({ phase: "idle" }); // stale results never outlive their input
  }, []);

  // The one and only egress point: an explicit user action.
  const ask = useCallback(async () => {
    if (plan.kind !== "ok") return;
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
        setFetchState({ phase: "done", summary: parseRdapResponse(raw), raw, url });
      }
    } catch {
      // TypeError covers both network failure and a missing CORS header; the
      // distinction is invisible to page JavaScript by design, so the message
      // explains both and hands over the curl equivalent.
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
          <label className="cidr-label" htmlFor="rdap-input">
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
          id="rdap-input"
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
      {plan.kind === "ok" && (
        <>
          <p className="rdap-plan">
            {t("willAsk", {
              registry: new URL(plan.plan.url).hostname,
              kind: t(`kinds.${plan.plan.input.kind}`),
            })}{" "}
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
              {fetchState.summary.displayName ?? t("resultTitle")}
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
              {summaryRow(t("fields.class"), fetchState.summary.objectClassName)}
              {summaryRow(t("fields.handle"), fetchState.summary.handle)}
              {Object.entries(fetchState.summary.events).map(([action, date]) => (
                <div className="jwt-claim-row" key={action}>
                  <dt className="jwt-claim-label">{action}</dt>
                  <dd className="jwt-claim-value mono">{date.slice(0, 10)}</dd>
                </div>
              ))}
              {fetchState.summary.entities
                .filter((e) => e.name)
                .map((e, i) => (
                  <div className="jwt-claim-row" key={i}>
                    <dt className="jwt-claim-label">{e.roles.join(", ") || t("fields.entity")}</dt>
                    <dd className="jwt-claim-value">{e.name}</dd>
                  </div>
                ))}
              {summaryRow(
                t("fields.nameservers"),
                fetchState.summary.nameservers.length > 0
                  ? fetchState.summary.nameservers.join(", ")
                  : null,
              )}
              {summaryRow(
                t("fields.dnssec"),
                fetchState.summary.dnssecSigned === null
                  ? null
                  : fetchState.summary.dnssecSigned
                    ? t("fields.signed")
                    : t("fields.unsigned"),
              )}
              {summaryRow(t("fields.port43"), fetchState.summary.port43)}
            </dl>
            {fetchState.summary.noticeTitles.length > 0 && (
              <p className="cipher-note">
                {t("fields.notices")}: {fetchState.summary.noticeTitles.join(" · ")}
              </p>
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

      {/* Provenance of the routing layer: the vendored bootstrap snapshot. */}
      <p className="cipher-note" style={{ marginTop: "1rem" }}>
        {t("bootstrapNote", {
          vendored: BOOTSTRAP_SNAPSHOT.vendored,
          dns: BOOTSTRAP_SNAPSHOT.publications.dns.slice(0, 10),
        })}
      </p>
    </div>
  );
}
