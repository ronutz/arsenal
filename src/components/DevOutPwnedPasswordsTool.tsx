// ============================================================================
// src/components/DevOutPwnedPasswordsTool.tsx
// ----------------------------------------------------------------------------
// PWNED PASSWORDS CHECK - the third /dev/out tool (2026-10-26), same rule as
// the RDAP and ASN lookups: NOTHING LEAVES THE BROWSER UNTIL THE READER PRESSES
// ASK OR ENTER, and then only the first five characters of the password's
// SHA-1 hash.
//
// Typing runs only the local layers (src/lib/dev-out/pwned-passwords/compute):
// Web Crypto hashes the UTF-8 bytes, the hash is cut into the five characters
// that would be sent and the 35 that stay, and the exact request is shown
// BEFORE anything is sent. Ask and Enter share one handler, send(), on the
// AskGate of src/lib/dev-out/ask.ts: one query at a time, and an answer that
// arrives after the password changed is dropped. The answer is read strictly
// (padding lines with a count of 0 discarded, a malformed body refused) and
// compared on the device; a failure is explained, never shown as a result.
//
// The password lives only in this component's state: no storage, no URL, no
// fragment, no log. The input is type=password with a Show/Hide control; the
// 35 characters that stay on the device are masked while the password is
// masked, because an unsalted SHA-1 of a weak password is as revealing as the
// password itself (anyone can look it up in a cracked-hash list).
// Styling reuses the established tool vocabulary (cidr-*, jwt-*, cipher-note,
// b64-copy, rdap-*); inside .env-out the tokens render red.
// ============================================================================
"use client";

// React state, memoised callbacks, the AskGate's ref and the hashing effect.
import { useCallback, useEffect, useRef, useState } from "react";
// The devOut.pwned messages (sliced in by the page's MessageSlice).
import { useTranslations } from "next-intl";
// The local layers and the one request.
import {
  planCheck,
  assessRange,
  askRange,
  curlCommand,
  API_HOST,
  PADDING_HEADER_NAME,
  PADDING_HEADER_VALUE,
  SUFFIX_LENGTH,
  SOURCE_SNAPSHOT,
  type CheckPlan,
  type RangeRefusal,
} from "@/lib/dev-out/pwned-passwords/compute";
// The one send path shared by Ask and Enter, and the shared timeout the copy names.
import { AskGate, isSendKey } from "@/lib/dev-out/ask";

// Example input, verbatim from the golden vectors (HASH_VECTORS "password"): a well-known breached test string.
const EXAMPLE = "password";

// The mask shown in place of the 35 kept characters while the password is hidden.
const SUFFIX_MASK = "•".repeat(SUFFIX_LENGTH);

/** The page's view of the hashing step: computed locally, before any egress. */
type PlanState = CheckPlan | { kind: "hashing" };

/** What the request produced, as the page shows it. */
type FetchState =
  // Nothing asked yet (or the password changed since).
  | { phase: "idle" }
  // The one request is in flight.
  | { phase: "loading" }
  // The suffix is in the corpus.
  | { phase: "found"; prefix: string; count: number; real: number; padded: number; lines: number }
  // The suffix is not in the corpus.
  | { phase: "notFound"; prefix: string; real: number; padded: number; lines: number }
  // A 2xx whose body is not a range: refused, never shown as a result.
  | { phase: "refused"; prefix: string; code: RangeRefusal; line: number | null }
  // Any non-2xx status.
  | { phase: "httpError"; prefix: string; status: number }
  // Network, CORS or Content-Security-Policy failure.
  | { phase: "netError"; prefix: string }
  // No answer within the time limit.
  | { phase: "timeout"; prefix: string }
  // A 2xx whose body could not be read at all.
  | { phase: "unreadable"; prefix: string; status: number };

export default function DevOutPwnedPasswordsTool() {
  // The tool's messages.
  const t = useTranslations("devOut.pwned");

  // The password, in this component's state only.
  const [value, setValue] = useState("");
  // Whether the password (and the kept 35 characters) are shown in clear.
  const [shown, setShown] = useState(false);
  // The local pre-flight: hashing, then what would be sent.
  const [plan, setPlan] = useState<PlanState>({ kind: "empty" });
  // The request's outcome.
  const [fetchState, setFetchState] = useState<FetchState>({ phase: "idle" });

  // One query at a time, and only the current password's answer is shown.
  const gateRef = useRef<AskGate | null>(null);
  // Created once.
  if (gateRef.current === null) gateRef.current = new AskGate();
  // Leaving the page abandons a query still in flight.
  useEffect(() => () => gateRef.current?.invalidate(), []);

  // Hash on every change, locally; a slower digest for an older value is discarded by the cleanup flag.
  useEffect(() => {
    // Whether this run still describes the field's value.
    let live = true;
    // Compute the plan (Web Crypto is asynchronous).
    void planCheck(value).then((p) => {
      // Only the latest value's plan is kept.
      if (live) setPlan(p);
    });
    // A newer value makes this run stale.
    return () => {
      // Stale from here on.
      live = false;
    };
  }, [value]);

  // Every change of the password: new value, plan pending, any query in flight abandoned, old result cleared.
  const onChange = useCallback((next: string) => {
    // The new value.
    setValue(next);
    // Ask stays disabled until the new hash is ready.
    setPlan(next === "" ? { kind: "empty" } : { kind: "hashing" });
    // A query in flight belongs to the old password: abandon it, so its answer is never shown against this one.
    gateRef.current?.invalidate();
    // Stale results never outlive their input.
    setFetchState({ phase: "idle" });
  }, []);

  // Clear also hides the password again.
  const onClear = useCallback(() => {
    // Empty the field and everything derived from it.
    onChange("");
    // Back to masked.
    setShown(false);
  }, [onChange]);

  // The one and only egress point, reached from the Ask button AND from Enter in the field, with the same guards.
  const send = useCallback(async () => {
    // Only a hashed password has a URL: empty input, hashing in progress and no Web Crypto send nothing.
    if (plan.kind !== "ready") return;
    // One query at a time: a second Ask or Enter while one is in flight does nothing.
    const started = gateRef.current?.begin();
    // Busy: ignored.
    if (!started) return;
    // The exact URL and prefix the page displayed before the action; the suffix stays in this closure.
    const { url, prefix, suffix } = plan;
    // Show the request as in flight.
    setFetchState({ phase: "loading" });
    // Browser-direct to the service, padding on, no credentials, no referrer, no cache.
    const out = await askRange(url, started.controller);
    // The password changed while the query was out: its answer describes another password, so it is dropped.
    if (!gateRef.current?.isCurrent(started.ticket)) return;
    // Free the gate.
    gateRef.current.end(started.ticket);
    // Sort the outcome.
    if (out.kind === "ok") {
      // Read the answer and compare on the device.
      const v = assessRange(out.body, suffix);
      // Found: with its count and the line tallies.
      if (v.kind === "found") setFetchState({ phase: "found", prefix, count: v.count, real: v.real, padded: v.padded, lines: v.lines });
      // Not found.
      else if (v.kind === "notFound") setFetchState({ phase: "notFound", prefix, real: v.real, padded: v.padded, lines: v.lines });
      // Not a range: refused.
      else setFetchState({ phase: "refused", prefix, code: v.code, line: v.line });
    } else if (out.kind === "httpError") {
      // A status other than 2xx.
      setFetchState({ phase: "httpError", prefix, status: out.status });
    } else if (out.kind === "timeout") {
      // No answer in time.
      setFetchState({ phase: "timeout", prefix });
    } else if (out.kind === "unreadable") {
      // A body that could not be read.
      setFetchState({ phase: "unreadable", prefix, status: out.status });
    } else {
      // Network, CORS and CSP failures look the same to page JavaScript; the message explains them together.
      setFetchState({ phase: "netError", prefix });
    }
  }, [plan]);

  // A failure panel: title, explanation, and the curl that repeats the request from the reader's machine.
  const failurePanel = (title: string, body: string, prefix: string) => (
    <div className="jwt-results">
      <section className="jwt-panel">
        {/* What went wrong. */}
        <h4 className="jwt-panel-title">{title}</h4>
        {/* Why, and that nothing is shown as a result. */}
        <p className="cipher-note">{body}</p>
        {/* The same request by hand: prefix and padding header only. */}
        <p className="cipher-note mono">{curlCommand(prefix)}</p>
      </section>
    </div>
  );

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          {/* The field's label. */}
          <label className="cidr-label" htmlFor="pwned-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            {/* Show or hide the password (and the kept 35 characters with it); the label names the action, so no
                aria-pressed on top of it. */}
            <button type="button" className="b64-copy" aria-controls="pwned-input" onClick={() => setShown((s) => !s)}>
              {shown ? t("hide") : t("show")}
            </button>
            {/* The golden-vector example, a well-known breached test string. */}
            <button type="button" className="b64-copy" onClick={() => onChange(EXAMPLE)}>
              {t("example")}
            </button>
            {/* Empty the field and hide again. */}
            <button type="button" className="b64-copy" onClick={onClear}>
              {t("clear")}
            </button>
          </div>
        </div>
        {/* Not inside a form, no name attribute: nothing can submit it anywhere. */}
        <input
          id="pwned-input"
          className="cidr-input mono"
          type={shown ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            // Enter is the keyboard twin of Ask: the same handler, the same guards, named in the copy.
            if (isSendKey(e)) {
              // No default action for Enter.
              e.preventDefault();
              // The one send path.
              void send();
            }
          }}
          aria-describedby="pwned-privacy"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {/* The tool's own privacy note: what is sent, to whom, and what is not. */}
        <p className="cidr-privacy" id="pwned-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("nothingLeaves", { host: API_HOST })}
        </p>
      </div>

      {/* Hashing in progress (Web Crypto is asynchronous; usually too quick to see). */}
      {plan.kind === "hashing" && <p className="cipher-note">{t("hashing")}</p>}

      {/* No Web Crypto on this page (plain HTTP): nothing hashed, nothing sent. */}
      {plan.kind === "noCrypto" && (
        <p className="cidr-error" role="alert">
          {t("noCrypto")}
        </p>
      )}

      {/* The pre-flight: computed locally, shown before any egress. */}
      {plan.kind === "ready" && (
        <>
          <dl className="jwt-claims" style={{ marginTop: "0.75rem" }}>
            {/* The full hash, prefix in clear, suffix masked unless the password is shown. */}
            <div className="jwt-claim-row">
              <dt className="jwt-claim-label">{t("hashLabel")}</dt>
              <dd className="jwt-claim-value mono">
                <strong>{plan.prefix}</strong> {shown ? plan.suffix : SUFFIX_MASK}
              </dd>
            </div>
            {/* What would be sent, to whom. */}
            <div className="jwt-claim-row">
              <dt className="jwt-claim-label">{t("sentLabel")}</dt>
              <dd className="jwt-claim-value">{t("sentValue", { prefix: plan.prefix, host: API_HOST })}</dd>
            </div>
            {/* What stays. */}
            <div className="jwt-claim-row">
              <dt className="jwt-claim-label">{t("keptLabel")}</dt>
              <dd className="jwt-claim-value">{shown ? t("keptValue") : `${t("keptValue")} ${t("keptMasked")}`}</dd>
            </div>
          </dl>
          {/* The exact request, before it is sent. */}
          <p className="rdap-plan">
            {t("willAsk", { host: API_HOST })} <code className="mono">GET {plan.url}</code>{" "}
            <code className="mono">
              {PADDING_HEADER_NAME}: {PADDING_HEADER_VALUE}
            </code>
          </p>
          <div className="rdap-ask-row">
            {/* Ask: the same send() as Enter. */}
            <button type="button" className="b64-copy" onClick={() => void send()} disabled={fetchState.phase === "loading"}>
              {fetchState.phase === "loading" ? t("asking") : t("ask")}
            </button>
            {/* The egress marker. */}
            <span className="envout-badge mono">{t("egressBadge")}</span>
          </div>
        </>
      )}

      {/* Found in the corpus. */}
      {fetchState.phase === "found" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("foundTitle", { count: fetchState.count })}</h4>
            {/* The verdict as a badge. */}
            <div className="jwt-badges" style={{ marginTop: "0.5rem" }}>
              <span className="jwt-badge jwt-badge--bad mono">{t("foundBadge")}</span>
            </div>
            <p className="cipher-note">{t("foundBody")}</p>
            {/* What came back and what was discarded. */}
            <p className="cipher-note">
              {t("rangeStats", { prefix: fetchState.prefix, lines: fetchState.lines, real: fetchState.real, padded: fetchState.padded })}
            </p>
          </section>
        </div>
      )}

      {/* Not in the corpus. */}
      {fetchState.phase === "notFound" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("notFoundTitle")}</h4>
            {/* The verdict as a badge. */}
            <div className="jwt-badges" style={{ marginTop: "0.5rem" }}>
              <span className="jwt-badge jwt-badge--ok mono">{t("notFoundBadge")}</span>
            </div>
            <p className="cipher-note">{t("notFoundBody")}</p>
            {/* What came back and what was discarded. */}
            <p className="cipher-note">
              {t("rangeStats", { prefix: fetchState.prefix, lines: fetchState.lines, real: fetchState.real, padded: fetchState.padded })}
            </p>
          </section>
        </div>
      )}

      {/* A body that is not a range: explained, never shown as a result. */}
      {fetchState.phase === "refused" &&
        failurePanel(
          t("refusedTitle"),
          `${t(`refused.${fetchState.code}`, { line: fetchState.line ?? 0 })} ${t("refusedBody")}`,
          fetchState.prefix,
        )}
      {/* Any non-2xx status, verbatim. */}
      {fetchState.phase === "httpError" && failurePanel(t("httpErrorTitle", { status: fetchState.status }), t("httpErrorBody"), fetchState.prefix)}
      {/* Network, CORS or CSP. */}
      {fetchState.phase === "netError" && failurePanel(t("netErrorTitle"), t("netErrorBody"), fetchState.prefix)}
      {/* No answer in time. */}
      {fetchState.phase === "timeout" && failurePanel(t("timeoutTitle"), t("timeoutBody"), fetchState.prefix)}
      {/* A 2xx whose body could not be read. */}
      {fetchState.phase === "unreadable" && failurePanel(t("unreadableTitle", { status: fetchState.status }), t("unreadableBody"), fetchState.prefix)}

      {/* Provenance of the local layers. */}
      <p className="cipher-note" style={{ marginTop: "1rem" }}>
        {t("provenance", { accessed: SOURCE_SNAPSHOT.accessed })}
      </p>
    </div>
  );
}
