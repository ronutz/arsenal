// ============================================================================
// src/components/DevOutRdapTool.tsx
// ----------------------------------------------------------------------------
// RDAP LOOKUP - the first /dev/out tool, built around one privacy rule:
// NOTHING LEAVES THE BROWSER UNTIL THE PERSON PRESSES ASK OR ENTER.
//
// 2026-10-20 (Round 1 RT02): Enter in the field always sent the query too, and
// the copy named only Ask. Both now go through ONE handler, send(), with the
// same guards (a valid plan, one query at a time, a late answer for an input
// since changed is dropped), built on src/lib/dev-out/ask.ts, and the copy
// names both. A special-purpose AS number (AS0, AS112, AS_TRANS, documentation,
// private use, the reserved ends; the same IANA table the ASN lookup uses) is
// answered locally and offers no query: AS112 sits inside an ARIN bootstrap
// range, so before this the page offered to ask ARIN about it. A timeout and a
// 200 that is not JSON are now told apart from a network or CORS failure.
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

import { useCallback, useEffect, useMemo, useRef, useState } from "react"; // useRef/useEffect hold the AskGate (RT02)
import { useTranslations } from "next-intl";
import {
  classifyInput, // read first, so a special-purpose AS number never reaches endpoint selection (RT02)
  planQuery,
  parseRdapResponse,
  curlCommand,
  RdapError,
  BOOTSTRAP_SNAPSHOT,
  type RdapSummary,
} from "@/lib/dev-out/rdap/compute";
// The IANA special-purpose AS number table, shared with the ASN lookup (RT02, 2026-10-20).
import { specialFor, type SpecialAsnEntry } from "@/lib/dev-out/asn/compute";
// Special-purpose IPv4 and IPv6 addresses, read from the SSRF classifier's IANA tables (Round 2, 2026-10-25).
import { specialIpFor, type SpecialIp } from "@/lib/dev-out/rdap/special-ip";
// The one send path shared by Ask and Enter (RT02, 2026-10-20).
import { AskGate, askRegistry, isSendKey } from "@/lib/dev-out/ask";

/** The message key for a special-purpose address's kind (Round 2): the classifier's category, multicast named apart. */
function ipCategoryKey(ip: SpecialIp): string {
  // Multicast is rated reserved by the classifier, but says more as itself.
  if (ip.multicast) return "multicast";
  // A registry row rated public or reserved is named by its own Globally Reachable column (true, false, or none:
  // 6to4 and Teredo carry no value), so a 6to4 address carrying a public IPv4 address is not called "reachable".
  if (ip.block && (ip.category === "public" || ip.category === "reserved"))
    return ip.block.globallyReachable === true ? "public" : ip.block.globallyReachable === false ? "reserved" : "noFlag";
  // The classifier's categories, as message keys.
  switch (ip.category) {
    case "loopback": return "loopback";
    case "private": return "private";
    case "link-local": return "linkLocal";
    case "cgnat": return "cgnat";
    case "cloud-metadata": return "cloudMetadata";
    case "public": return "public";
    default: return "reserved";
  }
}

// Example input, faithful to the golden vectors (domain-com).
const EXAMPLE = "example.com";

type FetchState =
  | { phase: "idle" }
  | { phase: "loading"; host: string }
  | { phase: "done"; summary: RdapSummary; raw: unknown; url: string }
  | { phase: "notFound"; url: string }
  | { phase: "httpError"; status: number; url: string }
  | { phase: "netError"; url: string }
  // No answer within the time limit (RT02, 2026-10-20): told apart from a network or CORS failure.
  | { phase: "timeout"; url: string }
  // A 2xx whose body is not JSON (RT02, 2026-10-20): an answer arrived but cannot be read.
  | { phase: "unreadable"; status: number; url: string };

export default function DevOutRdapTool() {
  const t = useTranslations("devOut.rdap");
  // The ASN lookup's special-purpose wording, so both tools explain a reserved number the same way (RT02).
  const tSpecial = useTranslations("devOut.asn.special");

  const [value, setValue] = useState("");
  const [fetchState, setFetchState] = useState<FetchState>({ phase: "idle" });

  // The deterministic pre-flight: recomputed on every keystroke, zero egress.
  const plan = useMemo(() => {
    const trimmed = value.trim();
    if (trimmed === "") return { kind: "empty" as const };
    try {
      // A special-purpose AS number has no registry record to ask for: answered here, with no URL (RT02).
      const input = classifyInput(trimmed);
      if (input.kind === "asn") {
        const special: SpecialAsnEntry | null = specialFor(Number(input.value));
        if (special) return { kind: "special" as const, asn: input.value, special };
      }
      // A special-purpose IP address (documentation, private, loopback, link-local, shared, multicast and every other
      // IANA special-purpose row): answered here as well, with no URL (Round 2, 2026-10-25).
      const specialIp: SpecialIp | null = specialIpFor(input);
      if (specialIp) return { kind: "specialIp" as const, ip: specialIp };
      return { kind: "ok" as const, plan: planQuery(trimmed) };
    } catch (e) {
      const code = e instanceof RdapError ? e.code : "format";
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
    // Only a valid plan has a URL: empty, invalid and special-purpose input send nothing.
    if (plan.kind !== "ok") return;
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
      setFetchState({ phase: "done", summary: parseRdapResponse(out.raw), raw: out.raw, url });
    } else if (out.kind === "notFound") {
      setFetchState({ phase: "notFound", url });
    } else if (out.kind === "httpError") {
      setFetchState({ phase: "httpError", status: out.status, url });
    } else if (out.kind === "timeout") {
      setFetchState({ phase: "timeout", url });
    } else if (out.kind === "unreadable") {
      setFetchState({ phase: "unreadable", status: out.status, url });
    } else {
      // A network failure and a missing CORS header look the same to page JavaScript by design, so the message
      // explains both and hands over the curl equivalent.
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
      {/* A special-purpose AS number (RT02): explained with its RFC, no URL, no Ask, nothing sent. */}
      {plan.kind === "special" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">
              AS{plan.asn}: {tSpecial(plan.special.reasonKey)} {/* colon, not an em dash (D-55) */}
            </h4>
            <p className="cipher-note">
              {tSpecial("body", { rfc: plan.special.rfc })}{" "}
              {tSpecial("range", {
                range: plan.special.start === plan.special.end ? `AS${plan.special.start}` : `AS${plan.special.start}-AS${plan.special.end}`,
              })}
            </p>
            <p className="cipher-note">{tSpecial("noEgress")}</p>
          </section>
        </div>
      )}
      {/* A special-purpose IP address (Round 2): its IANA row, its kind, no URL, no Ask, nothing sent. */}
      {plan.kind === "specialIp" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">
              {plan.ip.address}: {t(`specialIp.cat.${ipCategoryKey(plan.ip)}`)} {/* colon, not an em dash (D-55) */}
            </h4>
            {/* The registry row, with its official name and RFC kept verbatim (G06). */}
            {plan.ip.block && (
              <p className="cipher-note">
                {t("specialIp.row", { registry: `IPv${plan.ip.version}`, prefix: plan.ip.block.prefix, name: plan.ip.block.name, rfc: plan.ip.block.rfc })}
              </p>
            )}
            {/* Multicast has a registry of its own rather than a special-purpose row. */}
            {plan.ip.multicast && !plan.ip.block && (
              <p className="cipher-note">{t("specialIp.multicast", { range: plan.ip.version === 4 ? "224.0.0.0/4" : "ff00::/8" })}</p>
            )}
            {/* An IPv6 address that carries an IPv4 address: which one, and its own row. */}
            {plan.ip.embedded && (
              <p className="cipher-note">
                {t("specialIp.embedded", { ipv4: plan.ip.embedded.ipv4 })}
                {plan.ip.embedded.block &&
                  ` ${t("specialIp.row", { registry: "IPv4", prefix: plan.ip.embedded.block.prefix, name: plan.ip.embedded.block.name, rfc: plan.ip.embedded.block.rfc })}`}
              </p>
            )}
            <p className="cipher-note">{t("specialIp.why")}</p>
            <p className="cipher-note">{t("specialIp.source")}</p>
          </section>
        </div>
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
