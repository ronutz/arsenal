"use client";

// ============================================================================
// src/components/OpensslSClientExplainerTool.tsx
// ----------------------------------------------------------------------------
// The openssl s_client explainer's page component. Two boxes, either or both:
// the command line and what it printed. The engine (src/lib/tools/
// openssl-s-client-explainer/compute.ts) does all the reading, locally and
// purely; this component only renders it. The interface chrome comes from the
// message packs (tools.openssl-s-client-explainer.*); the explanations of
// options, output lines, verification codes and findings come from the
// engine's own tables in English and Brazilian Portuguese, and every other
// locale reads the English ones, as the packs fall back to English.
//
// SHARE RESULTS (2026-10-27): a button under the findings builds, only when
// pressed, a link carrying both boxes with every Master-Key, Resumption PSK
// and command-line password replaced by [redacted] (spec: src/lib/tools/
// openssl-s-client-explainer/share.ts); the popover says how many values
// were. An arriving link (useShareArrival, after usePrefill: its names are not
// "input", so the serial console's #input= handoff works exactly as before)
// fills both boxes as a paste would; the address loses the values at once.
// ============================================================================

import { useMemo, useState } from "react"; // state and memoised parse
import { useLocale, useTranslations } from "next-intl"; // locale and interface strings
import { usePrefill } from "@/lib/use-prefill"; // a value handed over in the address (#input=), such as the serial console's s_client report
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { OPENSSL_S_CLIENT_SHARE, encodeSClientShare } from "@/lib/tools/openssl-s-client-explainer/share"; // this tool's share spec: both boxes, secrets replaced
import { Link } from "@/i18n/navigation"; // locale-aware links to sibling tools
// The engine is imported from its own modules, not from the tool's index, so the page does not carry the captures
// and golden vectors that the index (the manifest) pulls in.
import {
  explain, // the engine's entry point
  SESSION_FIELDS, // SSL-Session field explanations
  type ConnectionSummary, // one handshake
  type ExplainedOption, // one option
  type Finding, // one finding
  type OutputItem, // one output line or block
} from "@/lib/tools/openssl-s-client-explainer/compute";
import { GROUP_LABELS, type Bilingual, type OptionGroup } from "@/lib/tools/openssl-s-client-explainer/options"; // option groups and the text shape
import { VERIFY_CODE_BY_NUMBER } from "@/lib/tools/openssl-s-client-explainer/verify-codes"; // verification codes
// The Example button loads a golden vector verbatim (D-83): a real OpenSSL 3.5.9 run of 2026-10-27 against a server
// that does not send its intermediate (captures.ts says how the runs were made).
// Imported from its own small module so the page does not load every vector.
import { EXAMPLE_COMMAND, EXAMPLE_OUTPUT } from "@/lib/tools/openssl-s-client-explainer/example";

/** The order option groups are shown in. */
const GROUP_ORDER: OptionGroup[] = ["target", "sni", "verify", "trust", "protocol", "crypto", "display", "session", "client-auth", "app", "status", "io", "dane", "psk", "provider", "tuning"]; // display order

/** A block longer than this many lines is shown folded. */
const FOLD_AT = 8; // lines

/** One label/value row. */
function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="dig-row">
      <span className="dig-row-label">{label}</span>
      <span className={mono ? "dig-row-value dig-mono" : "dig-row-value"}>{value}</span>
    </div>
  ); // a row
}

/** The severity mark class of a finding (reusing the advisory-flag vocabulary). */
function flagClass(f: Finding): string {
  return f.severity === "high" ? "awaf-flag awaf-flag-warn" : f.severity === "warn" ? "awaf-flag awaf-flag-note" : "awaf-flag awaf-flag-info"; // red, amber, accent
}

/** Raw text of an item, folded when long. */
function RawText({ text, showLabel }: { text: string; showLabel: string }) {
  const lines = text.split("\n"); // its lines
  if (lines.length <= FOLD_AT) return <pre className="curl-body-text dig-mono">{text}</pre>; // short: shown whole
  return (
    <details>
      <summary className="curl-muted">{showLabel}</summary>
      <pre className="curl-body-text dig-mono">{text}</pre>
    </details>
  ); // long: folded
}

export default function OpensslSClientExplainerTool() {
  const t = useTranslations("tools.openssl-s-client-explainer"); // interface strings
  const locale = useLocale(); // the page locale
  const L = (b: Bilingual | null | undefined) => (b ? (locale === "pt-BR" ? b.pt : b.en) : ""); // pick the language; others read English
  const [command, setCommand] = useState(""); // the command box
  const [output, setOutput] = useState(""); // the output box
  // A value handed over in the address (#input=, src/lib/handoff.ts) fills the output box: the serial console's
  // detected-token panel hands an s_client report here (2026-10-27). The box's value goes to usePrefill too, so a
  // Clear, an Example or an edit drops the handoff from the address (RT01, 2026-10-20).
  usePrefill((v) => setOutput(v), output);
  // An arriving share link (after usePrefill): both boxes, as a paste would fill them (an absent box is emptied).
  useShareArrival(OPENSSL_S_CLIENT_SHARE, (state) => { setCommand(state.command); setOutput(state.output); }); // the copy
  // What Share results may carry: both boxes with every secret replaced, and how many were (for the popover).
  const share = useMemo(() => encodeSClientShare({ command, output }), [command, output]); // memoised; empty boxes give nothing to share
  const result = useMemo(() => explain({ command, output }), [command, output]); // the explanation
  const empty = command.trim() === "" && output.trim() === ""; // nothing to show yet
  const cmd = result.command; // the command part
  const out = result.output; // the output part

  // Options grouped for display.
  const grouped = useMemo(() => {
    const m = new Map<string, ExplainedOption[]>(); // group -> options
    for (const o of cmd?.options ?? []) { const g = o.group; if (!m.has(g)) m.set(g, []); m.get(g)!.push(o); } // bucket
    return m; // grouped
  }, [cmd]);

  /** The summary rows of one connection. */
  const summary = (c: ConnectionSummary) => {
    const vc = c.verifyCode !== null ? VERIFY_CODE_BY_NUMBER.get(c.verifyCode) : undefined; // its code row
    return (
      <div className="dig-record" key={c.index}>
        {/* The card head: which handshake, full or resumed, and the verification result as a badge. */}
        <div className="dig-record-head">
          <span className="dig-type-badge">{t("output.connection", { n: c.index })}</span>
          {c.reused !== null && <span className="curl-tag">{c.reused ? "Reused" : "New"}</span>}
          {c.verifyCode !== null && <span className={c.verifyCode === 0 ? "jwt-badge jwt-badge--ok" : "jwt-badge jwt-badge--bad"}>{t("summary.verifyBadge", { code: c.verifyCode })}</span>}
          {c.verifyCode === null && c.verification !== null && <span className={c.verification === "ok" ? "jwt-badge jwt-badge--ok" : "jwt-badge jwt-badge--bad"}>{c.verification === "ok" ? "Verification: OK" : "Verification error"}</span>}
        </div>
        {/* What was negotiated, one row per fact the output gave (rows without a value are left out). */}
        <div className="dig-rdata-fields">
          {c.protocol && <Row label={t("summary.protocol")} value={c.protocol} mono />}
          {c.cipher && <Row label={t("summary.cipher")} value={c.cipher} mono />}
          {c.cipherLineVersion && c.protocol && c.cipherLineVersion !== c.protocol && <Row label={t("summary.cipherLine")} value={c.cipherLineVersion} mono />}
          {c.tempKey && <Row label={t("summary.tempKey")} value={c.tempKey} mono />}
          {c.peerSignatureType && <Row label={t("summary.signature")} value={`${c.peerSignatureType}${c.peerSigningDigest ? " / " + c.peerSigningDigest : ""}`} mono />}
          {c.serverKeyBits !== null && <Row label={t("summary.serverKey")} value={`${c.serverKeyBits} bit`} mono />}
          {c.serverSubject && <Row label={t("summary.subject")} value={c.serverSubject} mono />}
          {c.alpn !== null && <Row label="ALPN" value={c.alpn === "" ? t("summary.alpnNone") : c.alpn} mono />}
          {c.handshakeRead !== null && <Row label={t("summary.handshake")} value={t("summary.handshakeValue", { read: c.handshakeRead, written: c.handshakeWritten ?? 0 })} />}
          {c.verifiedPeername && <Row label={t("summary.peername")} value={c.verifiedPeername} mono />}
          {c.ocsp && <Row label="OCSP" value={c.ocsp === "none" ? t("summary.ocspNone") : `${t("summary.ocspStapled")}${c.ocspCertStatus ? ": " + c.ocspCertStatus : ""}`} />}
          {c.tickets > 0 && <Row label={t("summary.tickets")} value={String(c.tickets)} />}
        </div>
        {/* The verification code with its constant and its meaning. */}
        {vc && <p className="dig-meaning"><strong className="dig-mono">{vc.code} ({vc.constant})</strong>: {L(vc.meaning)}</p>}
        {/* The certificates as the server sent them, with links to the chain builder and the X.509 inspector. */}
        {c.chain.length > 0 && (
          <div className="dig-rdata-fields">
            <div className="awaf-group-heading">{t("summary.chain", { n: c.chain.length })}</div>
            {c.chain.map((e) => (
              <p className="dig-meaning" key={e.depth}>
                <strong className="dig-mono">{e.depth}</strong> <span className="dig-mono">s: {e.subject}</span><br />
                <span className="dig-mono">i: {e.issuer}</span>
                {e.notAfter && <><br /><span className="curl-muted">{t("summary.validity", { from: e.notBefore ?? "?", to: e.notAfter })}</span></>}
              </p>
            ))}
            <p className="dig-meaning"><Link href="/tools/cert-chain-builder">{t("links.chainBuilder")}</Link> · <Link href="/tools/x509">{t("links.x509")}</Link></p>
          </div>
        )}
      </div>
    ); // the card
  };

  /** One output item, with its explanation and, for a session block, its fields. */
  const itemView = (it: OutputItem, idx: number) => (
    <div className="dig-record" key={idx}>
      {/* The item head: its kind, its line numbers, and its connection when -reconnect made several. */}
      <div className="dig-record-head">
        <span className="dig-type-badge">{it.kind}</span>
        <span className="dig-ttl">{it.start === it.end ? t("output.line", { n: it.start }) : t("output.lines", { start: it.start, end: it.end })}</span>
        {(out?.connections.length ?? 1) > 1 && <span className="dig-class">{t("output.connection", { n: it.connection })}</span>}
      </div>
      {/* The lines as pasted (folded when long), what they mean, and the reading of this item's own values. */}
      <RawText text={it.text} showLabel={t("output.show", { n: it.end - it.start + 1 })} />
      <p className="dig-meaning">{L(it.explain)}</p>
      {it.detail && <p className="dig-meaning"><strong>{L(it.detail)}</strong></p>}
      {/* An SSL-Session block: every field with its meaning (long values such as the ticket or the secrets are cut). */}
      {it.kind === "ssl-session" && (
        <div className="dig-rdata-fields">
          {Object.entries(it.fields).map(([k, v]) => (
            <p className="dig-meaning" key={k}><strong className="dig-mono">{k}</strong>{v ? <span className="dig-mono">: {v.length > 72 ? v.slice(0, 72) + "…" : v}</span> : null}{SESSION_FIELDS[k] ? <> · {L(SESSION_FIELDS[k])}</> : null}</p>
          ))}
        </div>
      )}
      {it.kind === "pem" && <p className="dig-meaning"><Link href="/tools/x509">{t("links.x509")}</Link></p>}
    </div>
  ); // the card

  return (
    <div className="cidr-tool jwt-tool dig-tool">
      {/* -- inputs, with the Example/Clear row (D-83) -- */}
      <div className="dig-input-head">
        <label htmlFor="sclient-cmd" className="cidr-label">{t("input.commandLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => { setCommand(EXAMPLE_COMMAND); setOutput(EXAMPLE_OUTPUT); }}>{t("input.example")}</button>
          <button type="button" className="b64-copy" onClick={() => { setCommand(""); setOutput(""); }}>{t("input.clear")}</button>
        </div>
      </div>
      <textarea id="sclient-cmd" className="cidr-input dig-textarea" value={command} onChange={(e) => setCommand(e.target.value)} placeholder={t("input.commandPlaceholder")} spellCheck={false} autoCapitalize="off" autoCorrect="off" rows={3} />
      <label htmlFor="sclient-out" className="cidr-label">{t("input.outputLabel")}</label>
      <textarea id="sclient-out" className="cidr-input dig-textarea" value={output} onChange={(e) => setOutput(e.target.value)} placeholder={t("input.outputPlaceholder")} spellCheck={false} autoCapitalize="off" autoCorrect="off" rows={12} />
      <p className="cidr-privacy"><span className="cidr-lock">&#128274;</span> {t("privacy")}</p>

      {!empty && (
        <div className="jwt-results dig-results">
          {result.splitFromOutput && <p className="cidr-note">{t("output.split")}</p>}
          {out?.truncated && <p className="cidr-note">{t("output.truncated")}</p>}

          {/* -- findings -- */}
          <div className="jwt-panel dig-warnings">
            <div className="jwt-panel-title">{t("findings.title")}</div>
            {result.findings.length === 0 && <p className="dig-meaning">{t("findings.none")}</p>}
            <ul className="awaf-flag-list">
              {result.findings.map((f, i) => (
                <li key={`${f.id}-${i}`} className={flagClass(f)}>
                  <span className="awaf-flag-mark">&#9679;</span>
                  <strong>{t(`severity.${f.severity}`)}</strong> {L(f.text)} <span className="curl-muted">({f.source})</span>
                </li>
              ))}
            </ul>
            {/* Share results: under the findings, at the start of its own row; the copy, never the paste. */}
            <div className="rdap-ask-row">
              <ShareResultsButton encoding={share.encoding} carries={t("share.carries", { redacted: "[redacted]" })} details={[t("share.redacted", { n: share.redacted })]} title={t("name")} />
            </div>
          </div>

          {/* -- the command -- */}
          {cmd && cmd.found && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("command.title")}</div>
              <Row label={t("command.target")} value={`${cmd.target.host ?? "?"}:${cmd.target.port ?? "?"}${cmd.target.portDefaulted ? " " + t("command.portDefaulted") : ""}`} mono />
              <Row label="SNI" value={cmd.sni.value ?? t("command.noSni")} mono />
              <p className="dig-meaning">{L(cmd.sni.text)}</p>
              {cmd.stdinClosed && <Row label={t("command.stdin")} value={cmd.inputFrom ?? "|"} mono />}
              {cmd.outputTo && <Row label={t("command.pipedTo")} value={cmd.outputTo} mono />}
              {cmd.options.length === 0 && <p className="dig-meaning">{t("command.noOptions")}</p>}
              {GROUP_ORDER.map((g) => grouped.get(g) ? (
                <div key={g} className="dig-rdata-fields">
                  <div className="awaf-group-heading">{L(GROUP_LABELS[g])}</div>
                  <ul className="curl-opts">
                    {grouped.get(g)!.map((o, i) => (
                      <li key={`${o.name}-${i}`}>
                        <code className="curl-flag dig-mono">{o.typed}{o.value !== null ? ` ${o.value}` : ""}</code>
                        {o.deprecated && <span className="curl-tag">{t("command.deprecated")}</span>} {o.since && <span className="curl-tag">{t("command.since", { v: o.since })}</span>} {o.notIn35 && <span className="curl-tag">{t("command.notIn35")}</span>}
                        <span className="curl-opt-desc"> {L(o.text)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null)}
              {grouped.get("unknown") && (
                <div className="dig-rdata-fields">
                  <div className="awaf-group-heading">{t("command.unknown")}</div>
                  <ul className="curl-opts">{grouped.get("unknown")!.map((o, i) => <li key={i}><code className="curl-flag dig-mono">{o.typed}</code></li>)}</ul>
                </div>
              )}
              {cmd.absent.length > 0 && (
                <div className="dig-rdata-fields">
                  <div className="awaf-group-heading">{t("command.absent")}</div>
                  <ul className="curl-opts">
                    {cmd.absent.map((a) => (
                      <li key={a.name}><code className="curl-flag dig-mono">{a.name}</code><span className="curl-opt-desc"> {L(a.text)}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* -- the output: one summary per handshake, then every line -- */}
          {out && out.recognised && (
            <>
              <div className="jwt-panel">
                <div className="jwt-panel-title">{t("output.title")} <span className="dig-sec-count">({t(`output.layout.${out.layout}`)})</span></div>
                {out.connections.map((c) => summary(c))}
              </div>
              <div className="jwt-panel">
                <div className="jwt-panel-title">{t("output.walk")} <span className="dig-sec-count">({out.items.length})</span></div>
                {out.items.filter((x) => x.kind !== "separator" && x.kind !== "blank").map((it, i) => itemView(it, i))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  ); // the tool
}
