// ============================================================================
// src/components/DevOutAsnLookupTool.tsx
// ----------------------------------------------------------------------------
// ASN LOOKUP - the second /dev/out tool, same privacy rule as the first:
// NOTHING LEAVES THE BROWSER UNTIL THE PERSON PRESSES ASK OR ENTER.
//
// 2026-10-20 (Round 1 RT02): Enter in the field always sent the query too, and
// the copy named only Ask. Both now go through ONE handler, send(), with the
// same guards (a plan of kind "query", one query at a time, a late answer for
// an input since changed is dropped), built on src/lib/dev-out/ask.ts, and the
// copy names both. A timeout and a 200 that is not JSON are now told apart from
// a network or CORS failure instead of all reading as one.
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
//
// 2026-10-19 (PRIME, "Accept asdot"): dotted input (asdot and asdot+, RFC
// 5396) is accepted and converted to asplain for the lookup; the page shows
// the asplain, asdot and asdot+ forms of every valid number, and for dotted
// input the high x 65536 + low arithmetic.
// ============================================================================
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react"; // useRef/useEffect hold the AskGate (RT02)
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
// The one send path shared by Ask and Enter (RT02, 2026-10-20).
import { AskGate, askRegistry, isSendKey } from "@/lib/dev-out/ask";

// Example input, faithful to the golden vectors (routing vector "arin").
const EXAMPLE = "AS15169";

type FetchState =
  | { phase: "idle" }
  | { phase: "loading"; host: string }
  | { phase: "done"; summary: AutnumSummary; raw: unknown; url: string; answeredBy: string }
  | { phase: "notFound"; url: string }
  | { phase: "httpError"; status: number; url: string }
  | { phase: "netError"; url: string }
  // No answer within the time limit (RT02, 2026-10-20): told apart from a network or CORS failure.
  | { phase: "timeout"; url: string }
  // A 2xx whose body is not JSON (RT02, 2026-10-20): an answer arrived but cannot be read.
  | { phase: "unreadable"; status: number; url: string };

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

  // One query at a time, and only the latest input's answer is shown (RT02, 2026-10-20).
  const gateRef = useRef<AskGate | null>(null);
  if (gateRef.current === null) gateRef.current = new AskGate();
  // Leaving the page abandons a query still in flight.
  useEffect(() => () => gateRef.current?.invalidate(), []);

  const onChange = useCallback((next: string) => {
    setValue(next);
    // A query in flight belongs to the old input: abandon it, so its answer is never shown against this one.
    gateRef.current?.invalidate();
    setFetchState({ phase: "idle" }); // stale results never outlive their input
  }, []);

  // The one and only egress point, reached from the Ask button AND from Enter in the field, with the same guards.
  const send = useCallback(async () => {
    // Only a globally assignable number has a URL: special-purpose, unallocated, invalid and empty input send nothing.
    if (plan.kind !== "ok" || plan.plan.kind !== "query") return;
    // One query at a time: a second Ask or Enter while one is in flight does nothing.
    const started = gateRef.current?.begin();
    if (!started) return;
    // The exact URL the page displayed before the action.
    const { url } = plan.plan;
    const host = new URL(url).hostname;
    setFetchState({ phase: "loading", host });
    // Browser-direct to the registry; the outcome is sorted in askRegistry.
    const out = await askRegistry(url, started.controller);
    // The input changed while the query was out: its answer describes another input, so it is dropped.
    if (!gateRef.current?.isCurrent(started.ticket)) return;
    gateRef.current.end(started.ticket);
    if (out.kind === "ok") {
      // finalUrl is the last hop after any redirects: who really answered.
      const answeredBy = new URL(out.finalUrl).hostname;
      setFetchState({ phase: "done", summary: summarizeAutnum(out.raw), raw: out.raw, url, answeredBy });
    } else if (out.kind === "notFound") {
      setFetchState({ phase: "notFound", url });
    } else if (out.kind === "httpError") {
      setFetchState({ phase: "httpError", status: out.status, url });
    } else if (out.kind === "timeout") {
      setFetchState({ phase: "timeout", url });
    } else if (out.kind === "unreadable") {
      setFetchState({ phase: "unreadable", status: out.status, url });
    } else {
      // A network failure and a missing CORS header (RIPE, as of 2026-07-08) look the same to page JavaScript; the
      // message explains both and hands over the curl.
      setFetchState({ phase: "netError", url });
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
            // Enter is the keyboard twin of Ask: the same handler, the same guards, named in the copy (RT02).
            if (isSendKey(e)) {
              e.preventDefault();
              void send();
            }
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

      {/* RFC 5396 notations (2026-10-19): the asplain number the lookup uses, its asdot and asdot+ forms, */}
      {/* and for dotted input the arithmetic that turned it into asplain. Computed locally, zero egress. */}
      {plan.kind === "ok" && (
        <div>
          {/* Dotted input: show high x 65536 + low = asplain before anything else. */}
          {plan.plan.classified.dotted && (
            <p className="cipher-note mono">
              {t("dotted", {
                // What the person typed, trimmed.
                input: value.trim(),
                // The high 16-bit half as a string (no locale grouping).
                high: String(plan.plan.classified.dotted.high),
                // The low 16-bit half as a string.
                low: String(plan.plan.classified.dotted.low),
                // The resulting asplain number.
                asplain: plan.plan.classified.asplain,
              })}
            </p>
          )}
          {/* All three notations, always, labelled by their RFC 5396 names. */}
          <p className="cipher-note mono">
            {t("forms", {
              // Decimal value: what registries and the lookup use.
              asplain: plan.plan.classified.asplain,
              // asdot: plain below 65536, dotted from 65536 up.
              asdot: plan.plan.classified.asdot,
              // asdot+: always dotted.
              asdotPlus: plan.plan.classified.asdotPlus,
            })}
          </p>
        </div>
      )}

      {/* Special-purpose ASN: a complete answer with zero egress. */}
      {plan.kind === "ok" && plan.plan.kind === "special" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">
              {plan.plan.normalized}: {t(`special.${plan.plan.special.reasonKey}`)} {/* colon, not an em dash (D-55, 2026-10-19) */}
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
              {plan.plan.normalized}: {t("unallocated.title")} {/* colon, not an em dash (D-55, 2026-10-19) */}
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
              onClick={() => void send()}
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
      {/* No answer in time (RT02): the registry may be slow or the path congested; nothing was proxied. */}
      {fetchState.phase === "timeout" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("timeoutTitle")}</h4>
            <p className="cipher-note">{t("timeoutBody")}</p>
            <p className="cipher-note mono">{curlCommand(fetchState.url)}</p>
          </section>
        </div>
      )}
      {/* An answer that is not JSON (RT02): shown as such, never as a result. */}
      {fetchState.phase === "unreadable" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("unreadableTitle", { status: fetchState.status })}</h4>
            <p className="cipher-note">{t("unreadableBody")}</p>
            <p className="cipher-note mono">{curlCommand(fetchState.url)}</p>
          </section>
        </div>
      )}
      {fetchState.phase === "done" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">
              {fetchState.summary.range ?? t("resultTitle")}
              {fetchState.summary.name ? ` - ${fetchState.summary.name}` : ""}
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
