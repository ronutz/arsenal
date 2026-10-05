"use client";

// ============================================================================
// src/components/CertChainBuilderTool.tsx
// ----------------------------------------------------------------------------
// THE CERTIFICATE CHAIN BUILDER AND VALIDATOR, as a page.
//
// Paste a leaf and its intermediates (and the root, if you have it) in any
// order. The engine (src/lib/tools/cert-chain-builder) builds the path the way
// a TLS client's path builder does, checks RFC 5280's structural rules along
// it, and hands back the chain a server should send. This component renders
// that result and adds the one thing the pure engine cannot do: it verifies
// each link's signature with WebCrypto, in this browser, after the structural
// result is on screen, and labels the outcome as checked here.
//
// PRIVACY: everything runs in the page. The engine never fetches (not the
// caIssuers, CRL or OCSP URLs a certificate names), and WebCrypto verifies
// locally. All output is rendered as escaped text through React.
//
// TIME: the engine is clock-free; the instant it judges validity at is an
// input. The page passes its clock, truncated to the second, unless the reader
// sets a date in "as of", which is how the Example stays self-consistent for
// ever: the example loads the vector's own instant (D-83: the example is the
// vector, verbatim, instant included).
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, GOLDEN_VECTORS, type ChainResult, type ChainCert, type Finding } from "@/lib/tools/cert-chain-builder";
import { verifyPathSignatures, type SignatureCheck } from "@/lib/tools/cert-chain-builder/verify-signatures";
import { usePrefill } from "@/lib/use-prefill";

/** The vector the Example button loads, verbatim (D-83). */
const EXAMPLE_ID = "lets-encrypt-served-chain";

/** The clock, as the engine wants it: ISO 8601 UTC to the second. */
function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** The CN of a single-line DN, or the whole DN when it has none. */
function cnOf(dn: string): string {
  const m = /(?:^|, )CN=([^,]+)/.exec(dn);
  return m ? m[1] : dn;
}

/** A compact date: "2026-10-04" from "2026-10-04T12:00:00Z". */
const day = (iso: string): string => iso.slice(0, 10);

export default function CertChainBuilderTool() {
  const t = useTranslations("tools.cert-chain-builder");
  const example = GOLDEN_VECTORS.find((v) => v.id === EXAMPLE_ID)!;

  // The pasted certificates and the instant. `asOf` is a date (YYYY-MM-DD) the
  // reader chose, or "" for the live clock. The clock is sampled once per
  // change of input, so a result does not flicker as seconds pass.
  const [text, setText] = useState("");
  const [asOf, setAsOf] = useState("");
  const [clock, setClock] = useState<string | null>(null);
  useEffect(() => setClock(nowIso()), [text]);
  const now = asOf ? `${asOf}T00:00:00Z` : clock ?? undefined;

  // The structural result, recomputed on every change; the engine is cheap.
  const r: ChainResult | null = useMemo(() => (text.trim() ? run({ text, now }) : null), [text, now]);

  // The browser-side signature checks, run after each structural result.
  const [sigs, setSigs] = useState<SignatureCheck[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    setSigs(null);
    if (!r || !r.ok || r.path.length === 0) return;
    verifyPathSignatures(r.certs, r.path).then((checks) => { if (!cancelled) setSigs(checks); });
    return () => { cancelled = true; };
  }, [r]);

  // Example and Clear (D-83). The example brings its own instant.
  const loadExample = useCallback(() => { setText(example.input.text); setAsOf(example.input.now ? day(example.input.now) : ""); }, [example]);
  const clear = useCallback(() => { setText(""); setAsOf(""); }, []);
  usePrefill((v) => setText(v));

  // The ordered PEM to copy: without the root by default, as servers send it.
  const [includeRoot, setIncludeRoot] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback(async (what: string, value: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(what); setTimeout(() => setCopied(null), 1500); } catch { /* clipboard unavailable: the text is still selectable */ }
  }, []);

  // Role of a certificate on the path, for the table.
  const roleOf = (c: ChainCert, pos: number, total: number): string => {
    if (pos === 0 && !c.isCa) return t("role.endEntity");
    if (pos === 0 && c.isCa) return t("role.targetCa");
    if (pos === total - 1 && c.selfSigned) return t("role.root");
    return t("role.intermediate");
  };
  // Validity of a certificate at the instant, for the table.
  const statusOf = (c: ChainCert): { key: "valid" | "expired" | "notYet" | "unknown" } => {
    if (!r?.validAt) return { key: "unknown" };
    if (r.validAt < c.notBefore) return { key: "notYet" };
    if (c.notAfter < r.validAt) return { key: "expired" };
    return { key: "valid" };
  };
  // Signature check for a certificate, once the browser has run it.
  const sigOf = (idx: number): SignatureCheck | undefined => sigs?.find((s) => s.cert === idx);

  // A finding's message, with the positions and names it refers to.
  const findingText = (f: Finding): string => {
    const at = f.at === null ? "" : String(f.at + 1);
    const other = f.other === null ? "" : String(f.other + 1);
    const cn = f.at === null || !r ? "" : cnOf(r.certs[f.at].subject);
    const otherCn = f.other === null || !r ? "" : cnOf(r.certs[f.other].subject);
    return t(`finding.${f.code}`, { at, other, cn, otherCn, detail: f.detail ?? "" });
  };

  return (
    <div className="cidr-tool jwt-tool ccb-tool">
      {/* The input: certificates, the instant, Example / Clear. */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="ccb-input">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={loadExample}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={clear}>{t("clear")}</button>
          </div>
        </div>
        <textarea id="ccb-input" className="cidr-input jwt-input mono" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("inputPlaceholder")} rows={8} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} aria-describedby="ccb-privacy" />
        <p id="ccb-privacy" className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">●</span>{t("runsLocally")}</p>
        <div className="ccb-asof">
          <label className="cidr-label" htmlFor="ccb-asof">{t("asOfLabel")}</label>
          <input id="ccb-asof" className="cidr-input mono ccb-asof-input" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
          <span className="hmac-build-note">{asOf ? t("asOfChosen", { date: asOf }) : t("asOfClock", { instant: clock ?? "" })}</span>
        </div>
      </div>

      {r && (
        <div className="jwt-results ccb-results">
          {/* The verdict. */}
          <div className={`tcl-verdict ${r.verdict === "complete" ? "tcl-verdict-ok" : r.verdict === "invalid" || r.verdict === "incomplete" || r.verdict === "unreadable" ? "tcl-verdict-bad" : "tcl-verdict-warn"}`} role="status">
            <p><span className="tcl-verdict-label">{t(`verdict.${r.verdict}`)}</span> {t(`verdictBody.${r.verdict}`, { n: r.order.length, missing: r.missingIssuer ? cnOf(r.missingIssuer.name) : "" })}</p>
          </div>

          {/* The path, in the order a server sends it. */}
          {r.order.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("pathTitle")}</h4>
              <div className="cidr-table-wrap">
                <table className="cidr-table ccb-path">
                  <thead>
                    <tr>
                      <th scope="col">{t("col.send")}</th>
                      <th scope="col">{t("col.input")}</th>
                      <th scope="col">{t("col.role")}</th>
                      <th scope="col">{t("col.subject")}</th>
                      <th scope="col">{t("col.validity")}</th>
                      <th scope="col">{t("col.key")}</th>
                      <th scope="col">{t("col.link")}</th>
                      <th scope="col">{t("col.signature")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.path.map((link, pos) => {
                      const c = r.certs[link.cert];
                      const st = statusOf(c);
                      const sg = sigOf(link.cert);
                      return (
                        <tr key={link.cert}>
                          <td className="mono">{pos + 1}</td>
                          <td className="mono">{link.cert + 1}</td>
                          <td>{roleOf(c, pos, r.path.length)}</td>
                          <td className="ccb-dn" title={c.subject}>{cnOf(c.subject)}<span className="ccb-issuer">{t("issuedBy", { cn: cnOf(c.issuer) })}</span></td>
                          <td className="mono ccb-validity"><span className={`ccb-status ccb-status--${st.key}`}>{t(`status.${st.key}`)}</span> {day(c.notBefore)} {"→"} {day(c.notAfter)}</td>
                          <td className="mono">{c.keyAlgorithm}{c.keySizeBits ? ` ${c.keySizeBits}` : ""}{c.curve ? ` ${c.curve}` : ""}</td>
                          <td>{t(`link.${link.matchedBy}`, { n: link.issuer === null ? "" : String(link.issuer + 1) })}</td>
                          <td>{sg ? <span className={`ccb-sig ccb-sig--${sg.status}`}>{t(`sig.${sg.status}`)}</span> : <span className="ccb-sig ccb-sig--pending">{link.issuer === null && !c.selfSigned ? t("sig.noKey") : t("sig.pending")}</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="hmac-build-note">{t("pathNote")}</p>
            </section>
          )}

          {/* The missing issuer, named. */}
          {r.missingIssuer && (
            <section className="jwt-panel ccb-missing">
              <h4 className="jwt-panel-title">{t("missingTitle")}</h4>
              <p className="tcl-finding-msg">{t(r.certs[r.order[r.order.length - 1]].isCa ? "missingBodyCa" : "missingBodyLeaf", { name: r.missingIssuer.name })}</p>
              {r.missingIssuer.aki && <p className="tcl-finding-msg">{t("missingAki")} <code>{r.missingIssuer.aki}</code></p>}
              {r.missingIssuer.caIssuerUrls.length > 0 && <p className="tcl-finding-msg">{t("missingAia")} {r.missingIssuer.caIssuerUrls.map((u) => <code key={u} className="ccb-url">{u}</code>)}</p>}
            </section>
          )}

          {/* Findings, most severe first. */}
          {r.findings.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("findingsTitle")}</h4>
              <ul className="tcl-findings">
                {r.findings.map((f, i) => (
                  <li key={`${f.code}-${i}`} className={`tcl-finding tcl-finding-${f.severity}`}>
                    <div className="tcl-finding-head">
                      <span className={`irl-sev irl-sev-${f.severity === "error" ? "high" : f.severity}`}>{t(`sev.${f.severity}`)}</span>
                      <span className="tcl-finding-title">{t(`findingTitle.${f.code}`)}</span>
                    </div>
                    <p className="tcl-finding-msg">{findingText(f)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* The chain to configure. */}
          {r.order.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("pemTitle")}</h4>
              <div className="dig-input-actions ccb-pem-actions">
                {r.endsAtSelfSigned && r.order.length > 1 && (
                  <div className="seg-group" role="group" aria-label={t("pemRootLabel")}>
                    <button type="button" className={`seg-btn${!includeRoot ? " seg-btn--active" : ""}`} aria-pressed={!includeRoot} onClick={() => setIncludeRoot(false)}>{t("pemWithoutRoot")}</button>
                    <button type="button" className={`seg-btn${includeRoot ? " seg-btn--active" : ""}`} aria-pressed={includeRoot} onClick={() => setIncludeRoot(true)}>{t("pemWithRoot")}</button>
                  </div>
                )}
                <button type="button" className="b64-copy" onClick={() => copy("pem", includeRoot ? r.orderedPem.withRoot : r.orderedPem.withoutRoot)}>{copied === "pem" ? t("copied") : t("copy")}</button>
              </div>
              <pre className="ccb-pem mono">{includeRoot ? r.orderedPem.withRoot : r.orderedPem.withoutRoot}</pre>
              <p className="hmac-build-note">{t("pemNote")}</p>
            </section>
          )}

          {/* Every certificate, in detail. */}
          {r.certs.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("certsTitle", { n: r.certs.length })}</h4>
              {r.certs.map((c) => (
                <details key={c.index} className="ccb-cert">
                  <summary><span className="mono">{c.index + 1}</span> {cnOf(c.subject)}{c.duplicateOf !== null ? ` (${t("duplicateOf", { n: c.duplicateOf + 1 })})` : ""}</summary>
                  <dl className="jwt-claims">
                    <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("field.subject")}</dt><dd className="jwt-claim-value mono">{c.subject}</dd></div>
                    <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("field.issuer")}</dt><dd className="jwt-claim-value mono">{c.issuer}</dd></div>
                    <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("field.serial")}</dt><dd className="jwt-claim-value mono">{c.serial}</dd></div>
                    <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("field.validity")}</dt><dd className="jwt-claim-value mono">{c.notBefore} {"→"} {c.notAfter}</dd></div>
                    <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("field.ski")}</dt><dd className="jwt-claim-value mono">{c.ski ?? t("absent")}</dd></div>
                    <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("field.aki")}</dt><dd className="jwt-claim-value mono">{c.aki ?? t("absent")}</dd></div>
                    <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("field.basicConstraints")}</dt><dd className="jwt-claim-value mono">{c.basicConstraintsPresent ? `cA ${c.isCa ? "TRUE" : "FALSE"}${c.pathLen !== null ? `, pathLenConstraint ${c.pathLen}` : ""}` : t("absent")}</dd></div>
                    <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("field.keyUsage")}</dt><dd className="jwt-claim-value mono">{c.keyUsagePresent ? c.keyUsage.join(", ") : t("absent")}</dd></div>
                    <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("field.eku")}</dt><dd className="jwt-claim-value mono">{c.extendedKeyUsage.length ? c.extendedKeyUsage.join(", ") : t("absent")}</dd></div>
                    <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("field.san")}</dt><dd className="jwt-claim-value mono">{c.sanCount}</dd></div>
                    <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("field.signature")}</dt><dd className="jwt-claim-value mono">{c.signatureAlgorithm}</dd></div>
                    <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("field.revocation")}</dt><dd className="jwt-claim-value mono">{[...c.crlUrls, ...c.ocspUrls].length ? [...c.crlUrls.map((u) => `CRL ${u}`), ...c.ocspUrls.map((u) => `OCSP ${u}`)].join("\n") : t("absent")}</dd></div>
                  </dl>
                  <button type="button" className="b64-copy" onClick={() => copy(`cert-${c.index}`, c.pem)}>{copied === `cert-${c.index}` ? t("copied") : t("copyOne")}</button>
                </details>
              ))}
            </section>
          )}

          {/* What a validator would still do that this page does not. */}
          <p className="hmac-build-note ccb-limits">{t("limits")}</p>
        </div>
      )}
    </div>
  );
}
