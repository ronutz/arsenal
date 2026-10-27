// ============================================================================
// src/components/DevOutDohLookupTool.tsx
// ----------------------------------------------------------------------------
// DNS-OVER-HTTPS LOOKUP - a /dev/out tool (2026-10-27), on the rule every
// red-room tool keeps: NOTHING LEAVES THE BROWSER UNTIL THE READER PRESSES ASK
// OR ENTER, and then exactly the request shown on screen.
//
// Typing runs only the local layers (src/lib/dev-out/doh-lookup): the name (or
// an IP address, for PTR) is read, the query is built in DNS wire format, and
// the exact GET request is shown BEFORE anything is sent. Ask and Enter share
// one handler, send(), on the AskGate of src/lib/dev-out/ask.ts: one query at
// a time, and an answer that arrives after any choice changed is dropped. The
// answer is decoded strictly and checked against the question; a failure is
// explained, never shown as an answer, and offers the curl command that
// repeats the request.
//
// LAYOUT (reworked 2026-10-27 after looking at it at 390 and 1280 px, under
// PRIME's standing UX rule): the controls read as one sentence (name, type,
// resolver, switches); the request is one card whose URL wraps, with Ask
// right under it and the query's octets folded away; an answer opens with a
// summary (what came back, the response code, the DNSSEC state) and the
// records themselves, grouped by RRset with their signatures folded away and
// each type explained once per section; the reading of the header, the
// flags, EDNS and the HTTP exchange follows, in aligned rows.
//
// The names of record types, response codes and options are protocol tokens
// and stay in English in every locale; their meanings come from the dig output
// explainer's own tables (English and Brazilian Portuguese), so this page and
// the dig tools explain a record the same way.
// Styling reuses the established tool vocabulary (cidr-*, jwt-*, dig-*,
// curlb-*, seg-*, dcb-*, rdap-*, tcl-details, cipher-note); inside .env-out the
// tokens render red.
// ============================================================================
"use client";

// React state, memoised values and callbacks, the AskGate's ref.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// The devOut.doh messages (sliced in by the page) and the locale, for the meaning tables.
import { useLocale, useTranslations } from "next-intl";
// Locale-aware internal links.
import { Link } from "@/i18n/navigation";
// The rel every external link carries (the site's rule: new tab, noopener).
import { externalRel } from "@/lib/links";
// The local layers and the one request.
import {
  planLookup,
  readAnswer,
  askDoh,
  curlCommand,
  groupRecords,
  resolverById,
  RESOLVERS,
  QUERY_TYPES,
  EXAMPLE,
  SOURCE_SNAPSHOT,
  type Assessment,
  type MismatchRefusal,
  type RecordGroup,
  type ResolverId,
} from "@/lib/dev-out/doh-lookup/compute";
// The decoded message's shapes and the hex dump.
import { hexDump, type Message, type WireRecord, type WireRefusal } from "@/lib/dev-out/doh-lookup/wire";
// The opcode names.
import { OPCODE_NAMES } from "@/lib/dev-out/doh-lookup/tables";
// The dig output explainer's meanings (English), the same text the dig tools show.
import { RCODE_MEANINGS, RRTYPE_MEANINGS } from "@/lib/tools/dig-output-explainer/compute";
// Their Brazilian Portuguese versions.
import { RCODE_MEANINGS_PT, RRTYPE_MEANINGS_PT } from "@/lib/tools/dig-output-explainer/meanings-pt";
// The one send path shared by Ask and Enter.
import { AskGate, isSendKey } from "@/lib/dev-out/ask";

/** The header flags, in dig's order. */
const FLAGS = ["qr", "aa", "tc", "rd", "ra", "ad", "cd"] as const;

/** The most answer octets the raw view shows. */
const RAW_MAX = 4096;

/** What the request produced, as the page shows it. */
type FetchState =
  // Nothing asked yet, or a choice changed since.
  | { phase: "idle" }
  // The one request is in flight.
  | { phase: "loading" }
  // An answer to this query.
  | { phase: "answer"; url: string; message: Message; assessment: Assessment; body: Uint8Array; status: number; cacheControl: string | null }
  // Not a well-formed DNS message.
  | { phase: "wire"; url: string; code: WireRefusal; offset: number | null }
  // A DNS message that does not answer this query.
  | { phase: "mismatch"; url: string; code: MismatchRefusal }
  // Any non-2xx status.
  | { phase: "httpError"; url: string; status: number }
  // A 2xx that is not application/dns-message.
  | { phase: "notDns"; url: string; status: number; contentType: string | null }
  // More than 65535 octets.
  | { phase: "tooLarge"; url: string }
  // Network, CORS or Content-Security-Policy failure.
  | { phase: "netError"; url: string }
  // No answer within the time limit.
  | { phase: "timeout"; url: string }
  // A 2xx whose body could not be read.
  | { phase: "unreadable"; url: string; status: number };

// Wrapping for RDATA and the curl command: at spaces first, inside a token only when it cannot fit (dig-rdata alone
// breaks anywhere, which split "port=443" and "ZONEMD" mid-word at 390 px; seen 2026-10-27).
const WORD_WRAP = { wordBreak: "normal", overflowWrap: "anywhere" } as const;

/**
 * One labelled row, the dig tools' layout.
 * @param props the label, the value, and whether the value is code
 * @returns the row
 */
function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  // Label and value side by side.
  return (
    <div className="dig-row">
      {/* The label. */}
      <span className="dig-row-label">{label}</span>
      {/* The value, in monospace when it is protocol data. */}
      <span className={mono ? "dig-row-value dig-mono" : "dig-row-value"}>{value}</span>
    </div>
  );
}

/**
 * The badge colour for a response code: NOERROR is good, a negative answer is a caution, anything else is bad.
 * @param rcode the full response code
 * @returns the badge's modifier class
 */
function rcodeBadge(rcode: number): string {
  // NOERROR.
  if (rcode === 0) return "jwt-badge jwt-badge--ok mono";
  // NXDOMAIN: an answer, a negative one.
  if (rcode === 3) return "jwt-badge jwt-badge--warn mono";
  // SERVFAIL, REFUSED, FORMERR and the rest.
  return "jwt-badge jwt-badge--bad mono";
}

export default function DevOutDohLookupTool() {
  // The tool's messages.
  const t = useTranslations("devOut.doh");
  // The locale, for the meaning tables.
  const locale = useLocale();
  // Brazilian Portuguese meanings where translated, English per key otherwise (the dig explainer's own rule).
  const pt = locale === "pt-BR";
  // Response code meanings.
  const rcodeMeanings: Record<string, string> = pt ? { ...RCODE_MEANINGS, ...RCODE_MEANINGS_PT } : RCODE_MEANINGS;
  // Record type meanings.
  const typeMeanings: Record<string, string> = pt ? { ...RRTYPE_MEANINGS, ...RRTYPE_MEANINGS_PT } : RRTYPE_MEANINGS;

  // The name (or address).
  const [name, setName] = useState("");
  // The type.
  const [type, setType] = useState("A");
  // The resolver.
  const [resolverId, setResolverId] = useState<ResolverId>("cloudflare");
  // EDNS(0) with padding.
  const [edns, setEdns] = useState(true);
  // DO.
  const [dnssecOk, setDnssecOk] = useState(false);
  // CD.
  const [checkingDisabled, setCheckingDisabled] = useState(false);
  // The request's outcome.
  const [fetchState, setFetchState] = useState<FetchState>({ phase: "idle" });

  // One query at a time, and only the current choices' answer is shown.
  const gateRef = useRef<AskGate | null>(null);
  // Created once.
  if (gateRef.current === null) gateRef.current = new AskGate();
  // Leaving the page abandons a query still in flight.
  useEffect(() => () => gateRef.current?.invalidate(), []);

  // The pre-flight, recomputed on every change: local, deterministic, no egress.
  const plan = useMemo(
    () => planLookup({ name, type, resolver: resolverId, edns, dnssecOk, checkingDisabled }),
    [name, type, resolverId, edns, dnssecOk, checkingDisabled],
  );
  // The resolver on show.
  const resolver = resolverById(resolverId);

  // Any change: the query in flight (if any) answered other choices, so it is abandoned and the old result cleared.
  const changed = useCallback(() => {
    // Abandon.
    gateRef.current?.invalidate();
    // Clear.
    setFetchState({ phase: "idle" });
  }, []);

  // The one and only egress point, reached from the Ask button AND from Enter in the field, with the same guards.
  const send = useCallback(async () => {
    // Only a ready plan has a URL: empty or refused input sends nothing.
    if (plan.kind !== "ready") return;
    // One query at a time.
    const started = gateRef.current?.begin();
    // Busy: ignored.
    if (!started) return;
    // The exact URL and options the page displayed before the action.
    const { url, options } = plan;
    // In flight.
    setFetchState({ phase: "loading" });
    // Browser-direct to the resolver: GET, Accept only, no credentials, no referrer, no cache, no redirects.
    const out = await askDoh(url, started.controller);
    // A choice changed while the query was out: its answer belongs to other choices, so it is dropped.
    if (!gateRef.current?.isCurrent(started.ticket)) return;
    // Free the gate.
    gateRef.current.end(started.ticket);
    // Sort the outcome.
    if (out.kind === "ok") {
      // Decode strictly and check against the question.
      const read = readAnswer(out.body, options);
      // An answer.
      if (read.ok) setFetchState({ phase: "answer", url, message: read.message, assessment: read.assessment, body: out.body, status: out.status, cacheControl: out.cacheControl });
      // Not a DNS message.
      else if (read.reason === "wire") setFetchState({ phase: "wire", url, code: read.code, offset: read.offset });
      // Not an answer to this question.
      else setFetchState({ phase: "mismatch", url, code: read.code });
    } else if (out.kind === "httpError") {
      // A status other than 2xx.
      setFetchState({ phase: "httpError", url, status: out.status });
    } else if (out.kind === "notDnsMessage") {
      // Another media type.
      setFetchState({ phase: "notDns", url, status: out.status, contentType: out.contentType });
    } else if (out.kind === "tooLarge") {
      // Oversize.
      setFetchState({ phase: "tooLarge", url });
    } else if (out.kind === "timeout") {
      // No answer in time.
      setFetchState({ phase: "timeout", url });
    } else if (out.kind === "unreadable") {
      // A body that could not be read.
      setFetchState({ phase: "unreadable", url, status: out.status });
    } else {
      // Network, CORS and CSP failures look the same to page JavaScript; the message explains them together.
      setFetchState({ phase: "netError", url });
    }
  }, [plan]);

  // Load the example (the golden vectors pin its exact URL).
  const onExample = useCallback(() => {
    // The example's name, type and resolver.
    setName(EXAMPLE.name);
    setType(EXAMPLE.type);
    setResolverId(EXAMPLE.resolver);
    // The default switches.
    setEdns(true);
    setDnssecOk(false);
    setCheckingDisabled(false);
    // Anything in flight is stale.
    changed();
  }, [changed]);

  // Clear the name and any result.
  const onClear = useCallback(() => {
    // Empty.
    setName("");
    // Stale.
    changed();
  }, [changed]);

  // A failure panel: title, explanation, and the curl that repeats the request from the reader's machine.
  const failurePanel = (title: string, body: string, url: string) => (
    <div className="jwt-results">
      <section className="jwt-panel">
        {/* What went wrong. */}
        <h2 className="jwt-panel-title">{title}</h2>
        {/* Why, and that nothing is shown as an answer. */}
        <p className="cipher-note">{body}</p>
        {/* The same request by hand, writing the binary answer to a file: boxed like the request, wrapping inside itself. */}
        <div className="dig-record">
          <div className="dig-mono dig-rdata" style={{ ...WORD_WRAP, marginTop: 0 }}>
            {curlCommand(url)}
          </div>
        </div>
      </section>
    </div>
  );

  // One record's data inside an RRset card: the RDATA on the primary line, then its facts on one secondary line
  // (reworked 2026-10-27 after looking at it: a labelled row per fact gave each DNSKEY five lines and repeated the
  // labels on every key). The remarks are the group's, shown once under the records (see groupCard).
  const recordBody = (r: WireRecord, key: string) => (
    <div key={key}>
      {/* The RDATA in presentation form: the line the reader came for. */}
      <div className="dig-mono dig-rdata" style={WORD_WRAP}>
        {r.rdata.text}
      </div>
      {/* The facts, when the type has any: label and value pairs on one wrapping line, values in the mono face. */}
      {r.rdata.facts.length > 0 && (
        <p className="dig-meaning" style={{ marginTop: "0.2rem" }}>
          {r.rdata.facts.map((f, i) => (
            <span key={f.key}>
              {/* A separator between pairs. */}
              {i > 0 && " · "}
              {/* The label, then the value. */}
              {t(`fact.${f.key}`)} <span className="dig-mono">{f.value}</span>
            </span>
          ))}
        </p>
      )}
      {/* A record whose RDATA did not have its type's shape. */}
      {r.rdata.malformed && <p className="dig-meaning">{t("malformedRecord")}</p>}
    </div>
  );

  // The remarks on a list of records, each kind once, in order of first appearance: every remark names the field
  // value it is about (flags 256, priority 0 and so on), so the reader can match it to the records above it.
  const groupNotes = (records: WireRecord[]) => [...new Set(records.flatMap((r) => r.rdata.notes))];

  // One RRset as a card: type, owner, TTL and class once in the head; each record's data below; signatures folded.
  const groupCard = (g: RecordGroup, key: string) => {
    // The TTLs in the RRset (normally one value; a cache can show records of one RRset with the same TTL only).
    const ttls = [...new Set(g.records.map((r) => r.ttl))];
    // The first signature, for the folded summary line.
    const sig = g.signatures[0];
    // Its facts, by key.
    const fact = (k: string) => sig?.rdata.facts.find((f) => f.key === k)?.value ?? "";
    // The card.
    return (
      <div className="dig-record" key={key}>
        <div className="dig-record-head">
          {/* The type. */}
          <span className="dig-type-badge">{g.typeName}</span>
          {/* The owner. */}
          <span className="dig-mono dig-record-name">{g.owner}</span>
          {/* How many records, when more than one. */}
          {g.records.length > 1 && <span className="dig-ttl">{t("groupCount", { count: g.records.length })}</span>}
          {/* The TTL as received. */}
          <span className="dig-ttl">TTL {ttls.join(", ")}s</span>
          {/* The class. */}
          <span className="dig-class">{g.records[0].className}</span>
        </div>
        {/* Each record's data. */}
        {g.records.map((r, i) => recordBody(r, `${key}-${i}`))}
        {/* The remarks on these records, each kind once. */}
        {groupNotes(g.records).map((n) => (
          <p className="dig-meaning" key={n}>
            {t(`note.${n}`)}
          </p>
        ))}
        {/* The signatures over this RRset, folded: the summary says who signed and until when. */}
        {sig && (
          <details className="tcl-details" style={{ marginTop: "0.6rem" }}>
            <summary>
              {t("signedBy", { count: g.signatures.length, signer: fact("signer"), isRoot: fact("signer") === "." ? "yes" : "no", tag: fact("keyTag"), until: fact("expiresOn") })}
            </summary>
            {g.signatures.map((s, i) => recordBody(s, `${key}-sig-${i}`))}
            {/* The remarks on the signatures (a TTL with its top bit set, for one), each kind once. */}
            {groupNotes(g.signatures).map((n) => (
              <p className="dig-meaning" key={n}>
                {t(`note.${n}`)}
              </p>
            ))}
          </details>
        )}
      </div>
    );
  };

  // A section of records: grouped into RRsets, each type explained once at the end.
  const section = (title: string, records: WireRecord[], id: string) => {
    // The RRsets.
    const groups = groupRecords(records);
    // The types present, once each, signatures included.
    const types = [...new Set(records.map((r) => r.typeName))];
    // The section.
    return (
      <section className="jwt-panel" key={id} aria-label={title}>
        {/* Title and record count. */}
        <h2 className="jwt-panel-title">
          {title} <span className="dig-sec-count">({records.length})</span>
        </h2>
        {/* Empty (only the answer section is ever shown empty). */}
        {records.length === 0 && <p className="dig-meaning">{t("sectionEmpty")}</p>}
        {/* Each RRset. */}
        {groups.map((g, i) => groupCard(g, `${id}-${i}`))}
        {/* What each type is, once, from the dig explainer's table. */}
        {types
          .filter((x) => typeMeanings[x])
          .map((x) => (
            <p className="dig-meaning" key={x}>
              <strong className="dig-mono">{x}</strong>: {typeMeanings[x]}
            </p>
          ))}
      </section>
    );
  };

  // The headline of an answer: what came back, in words.
  const headline = (m: Message, a: Assessment, qtypeName: string): string => {
    // NOERROR with records of the asked type.
    if (m.rcode === 0 && a.answersOfType > 0) return t("summary.records", { count: a.answersOfType, type: qtypeName });
    // NOERROR with an alias but nothing of the type at its end.
    if (m.rcode === 0 && a.cnames > 0) return t("summary.aliasOnly", { type: qtypeName });
    // NOERROR with nothing: NODATA.
    if (m.rcode === 0) return t("summary.nodata", { type: qtypeName });
    // NXDOMAIN.
    if (m.rcode === 3) return t("summary.nxdomain");
    // SERVFAIL.
    if (m.rcode === 2) return t("summary.servfail");
    // Any other code.
    return t("summary.other", { rcode: m.rcodeName });
  };

  return (
    <div className="cidr-tool jwt-tool dig-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          {/* The field's label. */}
          <label className="cidr-label" htmlFor="doh-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            {/* The golden-vector example. */}
            <button type="button" className="b64-copy" onClick={onExample}>
              {t("example")}
            </button>
            {/* Empty the field. */}
            <button type="button" className="b64-copy" onClick={onClear}>
              {t("clear")}
            </button>
          </div>
        </div>
        {/* Not inside a form, no name attribute: nothing can submit it anywhere. */}
        <input
          id="doh-input"
          className="cidr-input mono"
          type="text"
          value={name}
          placeholder={t("placeholder")}
          onChange={(e) => {
            // The new name.
            setName(e.target.value);
            // Stale.
            changed();
          }}
          onKeyDown={(e) => {
            // Enter is the keyboard twin of Ask: the same handler, the same guards, named in the copy.
            if (isSendKey(e)) {
              // No default action for Enter.
              e.preventDefault();
              // The one send path.
              void send();
            }
          }}
          aria-describedby="doh-privacy"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={300}
        />

        <div className="dcb-segs">
          {/* The record type. */}
          <label className="dcb-seg">
            <span className="curlb-field-label">{t("typeLabel")}</span>
            <select
              id="doh-type"
              className="curlb-select"
              value={type}
              onChange={(e) => {
                // The new type.
                setType(e.target.value);
                // Stale.
                changed();
              }}
            >
              {/* The offered types. */}
              {QUERY_TYPES.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          {/* The resolver: three buttons on a row of their own. */}
          <div className="dcb-seg">
            <span className="curlb-field-label" id="doh-resolver-label">
              {t("resolverLabel")}
            </span>
            <div className="seg-group" role="group" aria-labelledby="doh-resolver-label" style={{ marginBottom: 0 }}>
              <div className="seg">
                {RESOLVERS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={"seg-btn" + (resolverId === r.id ? " seg-btn--active" : "")}
                    aria-pressed={resolverId === r.id}
                    onClick={() => {
                      // The new resolver.
                      setResolverId(r.id);
                      // Stale.
                      changed();
                    }}
                  >
                    {r.service}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* The resolver's operator and the one host this page reaches, with its documentation and privacy policy. */}
        <p className="dig-meaning">
          {t("resolverIs", { service: resolver.service, operatedBy: t(`operatedBy.${resolver.id}`), host: resolver.host })}{" "}
          <a href={resolver.docs} target="_blank" rel={externalRel(resolver.docs)}>
            {t("resolverDocs")}
          </a>
          {" · "}
          <a href={resolver.privacy} target="_blank" rel={externalRel(resolver.privacy)}>
            {t("resolverPrivacy")}
          </a>
        </p>

        {/* The query's switches. */}
        <div className="curlb-checks" style={{ marginTop: "0.75rem" }}>
          {/* EDNS(0) with padding. */}
          <label className="curlb-check">
            <input
              type="checkbox"
              checked={edns}
              onChange={(e) => {
                // On or off.
                setEdns(e.target.checked);
                // Stale.
                changed();
              }}
            />
            <span>{t("ednsSwitch")}</span>
          </label>
          {/* DO: needs EDNS. */}
          <label className="curlb-check">
            <input
              type="checkbox"
              checked={edns && dnssecOk}
              disabled={!edns}
              onChange={(e) => {
                // On or off.
                setDnssecOk(e.target.checked);
                // Stale.
                changed();
              }}
            />
            <span>{t("doSwitch")}</span>
          </label>
          {/* CD. */}
          <label className="curlb-check">
            <input
              type="checkbox"
              checked={checkingDisabled}
              onChange={(e) => {
                // On or off.
                setCheckingDisabled(e.target.checked);
                // Stale.
                changed();
              }}
            />
            <span>{t("cdSwitch")}</span>
          </label>
        </div>

        {/* The tool's own privacy note: what is sent, to whom, and when. */}
        <p className="cidr-privacy" id="doh-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("nothingLeaves", { host: resolver.host })}
        </p>
      </div>

      {/* Input that cannot become a query: nothing is sent. */}
      {plan.kind === "invalid" && (
        <p className="cidr-error" role="alert">
          {t(`invalid.${plan.code}`, { label: plan.label ?? "" })}
        </p>
      )}

      {/* The request, computed locally and shown before any egress, with Ask right under it. */}
      {plan.kind === "ready" && (
        <>
          <p className="rdap-plan">{t("willAsk", { host: plan.resolver.host })}</p>
          <div className="dig-record">
            <div className="dig-record-head">
              {/* The method. */}
              <span className="dig-type-badge">GET</span>
              {/* The question, in words a reader recognises. */}
              <span className="dig-mono dig-record-name">
                {plan.qname} {plan.qtypeName}
              </span>
              {/* The size of the DNS message inside. */}
              <span className="dig-ttl">{t("octets", { count: plan.query.length })}</span>
            </div>
            {/* The exact URL (long, so it wraps inside itself) and the one header. */}
            <div className="dig-mono dig-rdata">{plan.url}</div>
            <div className="dig-mono dig-rdata">Accept: application/dns-message</div>
          </div>
          {/* The row wraps on a narrow screen, so the button keeps its label on one line. */}
          <div className="rdap-ask-row" style={{ flexWrap: "wrap" }}>
            {/* Ask: the same send() as Enter. */}
            <button type="button" className="b64-copy" onClick={() => void send()} disabled={fetchState.phase === "loading"}>
              {fetchState.phase === "loading" ? t("asking") : t("ask", { service: plan.resolver.service })}
            </button>
            {/* The egress marker. */}
            <span className="envout-badge mono">{t("egressBadge")}</span>
          </div>
          {/* What the query holds, folded: the fields and the octets. */}
          <details className="tcl-details" style={{ marginTop: "0.5rem" }}>
            <summary>{t("rawQuery", { count: plan.query.length })}</summary>
            <dl className="jwt-claims">
              {/* The query name. */}
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("planName")}</dt>
                <dd className="jwt-claim-value mono">{plan.qname}</dd>
              </div>
              {/* The address it was derived from. */}
              {plan.reverseOf && (
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("planReverse")}</dt>
                  <dd className="jwt-claim-value mono">{plan.reverseOf}</dd>
                </div>
              )}
              {/* Type and class. */}
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("planType")}</dt>
                <dd className="jwt-claim-value mono">{plan.qtypeName} IN</dd>
              </div>
              {/* The header this page sets. */}
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("planHeader")}</dt>
                <dd className="jwt-claim-value">{t("planHeaderValue", { flags: ["RD", "AD", ...(plan.options.checkingDisabled ? ["CD"] : [])].join(" ") })}</dd>
              </div>
              {/* EDNS(0). */}
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("planEdns")}</dt>
                <dd className="jwt-claim-value">
                  {plan.options.edns ? t("planEdnsOn", { dnssec: plan.options.dnssecOk ? "yes" : "no" }) : t("planEdnsOff")}
                </dd>
              </div>
            </dl>
            {/* The octets. */}
            <pre className="jwt-json">{plan.dump}</pre>
            {/* What they are, and how GET and POST carry them. */}
            <p className="cipher-note">{t("rawQueryNote")}</p>
          </details>
        </>
      )}

      {/* The answer: summary and records first, the reading of the message after. */}
      {fetchState.phase === "answer" && (
        <div className="jwt-results dig-results">
          {/* What came back, in one line, and the three verdicts. */}
          <section className="jwt-panel" aria-label={t("summaryLabel")}>
            <h2 className="jwt-panel-title">{headline(fetchState.message, fetchState.assessment, plan.kind === "ready" ? plan.qtypeName : "")}</h2>
            <div className="jwt-badges">
              {/* The response code. */}
              <span className={rcodeBadge(fetchState.message.rcode)}>{fetchState.message.rcodeName}</span>
              {/* The DNSSEC state. */}
              <span
                className={
                  // Validated is good, a possible validation failure is bad, an unsigned or unchecked answer is neutral.
                  fetchState.assessment.dnssec === "validated"
                    ? "jwt-badge jwt-badge--ok"
                    : fetchState.assessment.dnssec === "servfailHint"
                      ? "jwt-badge jwt-badge--bad"
                      : "jwt-badge"
                }
              >
                {t(`badge.${fetchState.assessment.dnssec}`)}
              </span>
              {/* Truncated. */}
              {fetchState.assessment.truncated && <span className="jwt-badge jwt-badge--bad">{t("badge.truncated")}</span>}
              {/* Size and who answered, on one line (a wrap split the host at its hyphen at 390 px). */}
              <span className="jwt-badge mono" style={{ whiteSpace: "nowrap" }}>{t("badge.from", { size: fetchState.message.size, host: plan.kind === "ready" ? plan.resolver.host : "" })}</span>
            </div>
            {/* A negative answer, and how long it may be cached. */}
            {fetchState.assessment.negative && (
              <p className="dig-meaning">
                {t(`negative.${fetchState.assessment.negative.kind}`, {
                  ttl: fetchState.assessment.negative.ttl,
                  soaTtl: fetchState.assessment.negative.soaTtl,
                  minimum: fetchState.assessment.negative.minimum,
                  zone: fetchState.assessment.negative.zone,
                  // The root zone is named in words rather than as a lone ".".
                  isRoot: fetchState.assessment.negative.zone === "." ? "yes" : "no",
                  type: plan.kind === "ready" ? plan.qtypeName : "",
                })}
              </p>
            )}
            {/* Compact denial. */}
            {fetchState.assessment.compactDenial && <p className="dig-meaning">{t("compactDenial")}</p>}
            {/* TC. */}
            {fetchState.assessment.truncated && <p className="dig-meaning">{t("truncated")}</p>}
          </section>

          {/* The records: the answer section always, the other two only when they hold something. */}
          {section(t("sectionAnswer"), fetchState.message.answer, "answer")}
          {fetchState.message.authority.length > 0 && section(t("sectionAuthority"), fetchState.message.authority, "authority")}
          {fetchState.message.additional.length > 0 && section(t("sectionAdditional"), fetchState.message.additional, "additional")}

          {/* DNSSEC: what the resolver reports, and where to read further. */}
          <section className="jwt-panel">
            <h2 className="jwt-panel-title">{t("dnssecTitle")}</h2>
            <p className="dig-meaning">{t(`dnssec.${fetchState.assessment.dnssec}`)}</p>
            {/* Signatures returned. */}
            <p className="dig-meaning">{t("signatures", { count: fetchState.assessment.signatures, asked: fetchState.message.edns?.dnssecOk ? "yes" : "no" })}</p>
            {/* Extended DNS Errors, if any. */}
            {fetchState.assessment.ede.map((o, i) => (
              <Row key={i} label={t("edeLabel")} value={`${o.edeCode} (${o.edeName ?? "?"})${o.edeText ? `: ${o.edeText}` : ""}`} mono />
            ))}
            {/* Where to read further. */}
            <p className="dig-meaning">
              {t("readFurther")} <Link href="/learn/dnssec-end-to-end">{t("dnssecLab")}</Link> ·{" "}
              <Link href="/tools/dig-output-explainer">{t("digExplainer")}</Link> ·{" "}
              <Link href="/tools/dig-command-builder">{t("digBuilder")}</Link>
            </p>
          </section>

          {/* The header and its flags, in aligned rows. */}
          <section className="jwt-panel">
            <h2 className="jwt-panel-title">{t("headerTitle")}</h2>
            {/* The response code and what it means. */}
            <Row label={t("rcode")} value={`${fetchState.message.rcodeName} (${fetchState.message.rcode})`} mono />
            {rcodeMeanings[fetchState.message.rcodeName === "DSOTYPENI" ? "RESERVED11" : fetchState.message.rcodeName] && (
              <p className="dig-meaning">{rcodeMeanings[fetchState.message.rcodeName === "DSOTYPENI" ? "RESERVED11" : fetchState.message.rcodeName]}</p>
            )}
            {/* Opcode, ID, and the four counts on one row. */}
            <Row label={t("opcode")} value={OPCODE_NAMES[fetchState.message.header.opcode] ?? String(fetchState.message.header.opcode)} mono />
            <Row label="ID" value={String(fetchState.message.header.id)} mono />
            {/* The four counts, each name and number kept together so a wrap never strands a number on its own line
                (seen at 1280 px in pt-BR, 2026-10-27); the names are the RFC 1035 field names, the same in every
                language. */}
            <div className="dig-row">
              {/* The label. */}
              <span className="dig-row-label">{t("counts")}</span>
              {/* QDCOUNT, ANCOUNT, NSCOUNT and ARCOUNT with their values. */}
              <span className="dig-row-value dig-mono">
                {(
                  [
                    ["QDCOUNT", fetchState.message.header.qdcount],
                    ["ANCOUNT", fetchState.message.header.ancount],
                    ["NSCOUNT", fetchState.message.header.nscount],
                    ["ARCOUNT", fetchState.message.header.arcount],
                  ] as const
                ).map(([n, v], i) => (
                  <span key={n}>
                    {/* A separator between counts, outside the unbreakable part so a line ends with it. */}
                    {i > 0 && " · "}
                    {/* The name and its number, never split. */}
                    <span style={{ whiteSpace: "nowrap" }}>
                      {n} {v}
                    </span>
                  </span>
                ))}
              </span>
            </div>
            {/* No question echoed. */}
            {fetchState.assessment.noQuestion && <p className="dig-meaning">{t("noQuestion")}</p>}
            {/* Compression, a teaching figure. */}
            <p className="dig-meaning">{t("pointers", { count: fetchState.message.pointers })}</p>
            {/* Each flag: name and state on the left, what that state means here on the right. */}
            <dl className="jwt-claims" style={{ marginTop: "0.75rem" }} aria-label={t("flagsTitle")}>
              {FLAGS.map((f) => (
                <div className="jwt-claim-row" key={f}>
                  {/* The same markup for set and clear, so every row has the same height; the state is a word. */}
                  <dt className="jwt-claim-label">
                    <strong className="dig-mono">{f.toUpperCase()}</strong> {fetchState.message.header[f] ? t("flagSet") : t("flagClear")}
                  </dt>
                  <dd className="jwt-claim-value">{t(`flag.${f}.${fetchState.message.header[f] ? "set" : "clear"}`)}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* EDNS(0): the OPT record. */}
          <section className="jwt-panel">
            <h2 className="jwt-panel-title">{t("ednsTitle")}</h2>
            {fetchState.message.edns ? (
              <>
                {/* Version, payload size, DO. */}
                <Row label={t("ednsVersion")} value={String(fetchState.message.edns.version)} mono />
                <Row label={t("ednsPayload")} value={t("octets", { count: fetchState.message.edns.payloadSize })} />
                <Row label="DO" value={fetchState.message.edns.dnssecOk ? t("flagSet") : t("flagClear")} />
                {/* Each option. */}
                {fetchState.message.edns.options.map((o, i) => (
                  <Row key={i} label={`${o.name ?? t("ednsOption")} (${o.code})`} value={o.code === 12 ? t("octets", { count: o.length }) : o.text} mono={o.code !== 12} />
                ))}
                {/* What the payload size and padding mean over HTTPS. */}
                <p className="dig-meaning">{t("ednsNote")}</p>
                {fetchState.assessment.paddingOctets !== null && fetchState.assessment.paddingOctets > 0 && (
                  <p className="dig-meaning">{t("paddingNote", { padding: fetchState.assessment.paddingOctets, size: fetchState.message.size })}</p>
                )}
              </>
            ) : (
              // No OPT record: dropped by the resolver, or never asked for.
              <p className="dig-meaning">{fetchState.assessment.ednsDropped ? t("ednsDropped") : t("ednsNotAsked")}</p>
            )}
          </section>

          {/* The HTTP exchange and the answer's octets. */}
          <section className="jwt-panel">
            <h2 className="jwt-panel-title">{t("httpTitle")}</h2>
            {/* Status, media type, cache control, size. */}
            <Row label={t("httpStatus")} value={String(fetchState.status)} mono />
            <Row label={t("httpType")} value="application/dns-message" mono />
            {fetchState.cacheControl && <Row label="Cache-Control" value={fetchState.cacheControl} mono />}
            <Row label={t("httpSize")} value={t("octets", { count: fetchState.message.size })} />
            {/* What a successful status means for DNS errors, and the cache. */}
            <p className="dig-meaning">{t("httpNote")}</p>
            {/* The octets, folded. */}
            <details className="tcl-details" style={{ marginTop: "0.6rem" }}>
              <summary>{t("rawAnswer", { count: fetchState.body.length })}</summary>
              <pre className="jwt-json">{hexDump(fetchState.body, RAW_MAX)}</pre>
              {fetchState.body.length > RAW_MAX && <p className="cipher-note">{t("rawCapped", { shown: RAW_MAX })}</p>}
            </details>
          </section>
        </div>
      )}

      {/* Not a DNS message: refused, never guessed at. */}
      {fetchState.phase === "wire" &&
        failurePanel(t("wireTitle"), `${t(`wire.${fetchState.code}`, { offset: fetchState.offset ?? 0 })} ${t("wireBody")}`, fetchState.url)}
      {/* A DNS message, but not the answer to this question. */}
      {fetchState.phase === "mismatch" && failurePanel(t("mismatchTitle"), `${t(`mismatch.${fetchState.code}`)} ${t("wireBody")}`, fetchState.url)}
      {/* Any non-2xx status, verbatim. */}
      {fetchState.phase === "httpError" && failurePanel(t("httpErrorTitle", { status: fetchState.status }), t("httpErrorBody"), fetchState.url)}
      {/* Another media type. */}
      {fetchState.phase === "notDns" &&
        failurePanel(t("notDnsTitle", { status: fetchState.status }), t("notDnsBody", { type: fetchState.contentType ?? "-" }), fetchState.url)}
      {/* Oversize. */}
      {fetchState.phase === "tooLarge" && failurePanel(t("tooLargeTitle"), t("tooLargeBody"), fetchState.url)}
      {/* Network, CORS or CSP. */}
      {fetchState.phase === "netError" && failurePanel(t("netErrorTitle"), t("netErrorBody"), fetchState.url)}
      {/* No answer in time. */}
      {fetchState.phase === "timeout" && failurePanel(t("timeoutTitle"), t("timeoutBody"), fetchState.url)}
      {/* A body that could not be read. */}
      {fetchState.phase === "unreadable" && failurePanel(t("unreadableTitle", { status: fetchState.status }), t("unreadableBody"), fetchState.url)}

      {/* Provenance of the local layers: small and upright, so it does not read as part of a result or an error above it. */}
      <p className="dig-meaning" style={{ marginTop: "1.25rem" }}>
        {t("provenance", { accessed: SOURCE_SNAPSHOT.accessed })}
      </p>
    </div>
  );
}
