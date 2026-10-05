"use client";

// ============================================================================
// src/components/DigCommandBuilderTool.tsx
// ----------------------------------------------------------------------------
// DIG COMMAND BUILDER: say what to look up, where to ask, how to ask and what
// to print, and watch one dig command line assemble, every token explained,
// with findings for the combinations the manual says are redundant or
// contradictory and a summary of what the query will carry. All state feeds
// the pure engine (compute.ts); nothing is executed or sent (D-49). The page
// opens on the Example (D-83), a vector verbatim.
// ============================================================================

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, VECTORS, COMMON_TYPES, CLASSES, DEFAULT_PORT, type DigInput, type DigResult, type Transport, type Ipv, type Klass, type OutputMode } from "@/lib/tools/dig-command-builder";

/** The vector the Example button loads, verbatim (D-83). */
const EXAMPLE_ID = "example-mx-dnssec";

/** The empty intent (the Clear state). */
const EMPTY: DigInput = {};

/** The transports in the order the control shows them. */
const TRANSPORTS: Transport[] = ["udp", "tcp", "tls", "https"];
/** The output modes in the order the control shows them. */
const OUTPUTS: OutputMode[] = ["full", "short", "answer", "yaml"];
/** The address-family choices. */
const FAMILIES: Ipv[] = ["", "4", "6"];
/** The marker the type select uses for "another type, typed below". */
const OTHER = "OTHER";

/** A copy button that confirms for a moment. */
function CopyBtn({ text, label, done }: { text: string; label: string; done: string }) {
  // Whether the confirmation is showing.
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="curl-copy"
      onClick={() => {
        try {
          // Clipboard write; the confirmation reverts after 1.2 s.
          void navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        } catch {
          /* clipboard unavailable; no-op */
        }
      }}
    >
      {ok ? done : label}
    </button>
  );
}

export default function DigCommandBuilderTool() {
  const t = useTranslations("tools.dig-command-builder");
  // The example vector.
  const example = VECTORS.find((v) => v.id === EXAMPLE_ID)!;
  // The whole intent, the engine's input; opens on the example.
  const [s, setS] = useState<DigInput>(example.input);
  // Whether the type select is on "other" (a mnemonic typed by hand).
  const typeUpper = (s.type ?? "").toUpperCase();
  const typeIsCommon = typeUpper === "" || COMMON_TYPES.includes(typeUpper);
  const [otherType, setOtherType] = useState(!typeIsCommon);

  // The engine runs on every change.
  const r: DigResult = useMemo(() => run(s), [s]);

  /** Merge a partial into the intent. */
  const up = useCallback((patch: Partial<DigInput>) => setS((cur) => ({ ...cur, ...patch })), []);
  /** D-83 Example and Clear. */
  const loadExample = useCallback(() => { setS(example.input); setOtherType(false); }, [example]);
  const clear = useCallback(() => { setS(EMPTY); setOtherType(false); }, []);

  // Convenience flags for the form.
  const reverse = !!(s.reverse ?? "").trim();
  const transport: Transport = s.transport ?? "udp";
  const output: OutputMode = s.output ?? "full";
  const isIxfr = typeUpper === "IXFR";
  // The error findings (shown in place of the command).
  const errors = r.findings.filter((f) => f.severity === "error");
  const others = r.findings.filter((f) => f.severity !== "error");

  /** A yes/no badge for the summary (neutral: neither answer is the "good" one in general). */
  const yn = (v: boolean) => <span className={"jwt-badge " + (v ? "dcb-yes" : "dcb-no")}>{v ? t("eff.yes") : t("eff.no")}</span>;

  return (
    <div className="cidr-tool jwt-tool curlb-tool dcb-tool">
      {/* The header row: label, Example, Clear (D-83). */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <span className="cidr-label">{t("inputsLabel")}</span>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={loadExample}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={clear}>{t("clear")}</button>
          </div>
        </div>
        <p className="hmac-build-note">{t("inputsHint")}</p>
      </div>

      <div className="curlb-form">
        {/* 1. What to look up. */}
        <div className="curlb-section">
          <div className="curlb-section-title">{t("sec.question")}</div>
          <div className="curlb-grid">
            <label className="curlb-field curlb-field--wide">
              <span className="curlb-field-label">{t("ui.name")}</span>
              <input id="dcb-name" className="curlb-input" value={s.name ?? ""} onChange={(e) => up({ name: e.target.value })} placeholder="example.com" spellCheck={false} autoComplete="off" maxLength={300} disabled={reverse} />
            </label>
            <label className="curlb-field curlb-field--narrow">
              <span className="curlb-field-label">{t("ui.type")}</span>
              <select id="dcb-type" className="curlb-select" value={otherType ? OTHER : (typeUpper || "A")} disabled={reverse} onChange={(e) => { if (e.target.value === OTHER) { setOtherType(true); up({ type: "" }); } else { setOtherType(false); up({ type: e.target.value }); } }}>
                {COMMON_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}
                <option value={OTHER}>{t("ui.typeOther")}</option>
              </select>
            </label>
            {otherType && (
              <label className="curlb-field curlb-field--narrow">
                <span className="curlb-field-label">{t("ui.typeMnemonic")}</span>
                <input id="dcb-type-other" className="curlb-input" value={s.type ?? ""} onChange={(e) => up({ type: e.target.value })} placeholder="TLSA, TYPE65" spellCheck={false} autoComplete="off" maxLength={16} disabled={reverse} />
              </label>
            )}
            {isIxfr && (
              <label className="curlb-field curlb-field--narrow">
                <span className="curlb-field-label">{t("ui.serial")}</span>
                <input id="dcb-serial" className="curlb-input" value={s.ixfrSerial ?? ""} onChange={(e) => up({ ixfrSerial: e.target.value })} placeholder="2026100401" spellCheck={false} autoComplete="off" maxLength={10} inputMode="numeric" />
              </label>
            )}
            <label className="curlb-field curlb-field--narrow">
              <span className="curlb-field-label">{t("ui.class")}</span>
              <select id="dcb-class" className="curlb-select" value={s.klass ?? "IN"} disabled={reverse} onChange={(e) => up({ klass: e.target.value as Klass })}>
                {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="curlb-field curlb-field--wide">
              <span className="curlb-field-label">{t("ui.reverse")}</span>
              <input id="dcb-reverse" className="curlb-input" value={s.reverse ?? ""} onChange={(e) => up({ reverse: e.target.value })} placeholder="192.0.2.1, 2001:db8::1" spellCheck={false} autoComplete="off" maxLength={300} />
            </label>
          </div>
          <p className="hmac-build-note">{t("ui.questionNote")}</p>
        </div>

        {/* 2. Where to ask. */}
        <div className="curlb-section">
          <div className="curlb-section-title">{t("sec.where")}</div>
          <div className="curlb-grid">
            <label className="curlb-field curlb-field--wide">
              <span className="curlb-field-label">{t("ui.server")}</span>
              <input id="dcb-server" className="curlb-input" value={s.server ?? ""} onChange={(e) => up({ server: e.target.value })} placeholder="192.0.2.53, ns1.example.com" spellCheck={false} autoComplete="off" maxLength={300} />
            </label>
            <label className="curlb-field curlb-field--narrow">
              <span className="curlb-field-label">{t("ui.port", { port: DEFAULT_PORT[transport] })}</span>
              <input id="dcb-port" className="curlb-input" value={s.port ?? ""} onChange={(e) => up({ port: e.target.value })} placeholder={String(DEFAULT_PORT[transport])} spellCheck={false} autoComplete="off" maxLength={5} inputMode="numeric" />
            </label>
            <label className="curlb-field">
              <span className="curlb-field-label">{t("ui.source")}</span>
              <input id="dcb-source" className="curlb-input" value={s.source ?? ""} onChange={(e) => up({ source: e.target.value })} placeholder="192.0.2.10#5300" spellCheck={false} autoComplete="off" maxLength={300} />
            </label>
          </div>
          <div className="dcb-segs">
            <div className="dcb-seg">
              <span className="curlb-field-label">{t("ui.transport")}</span>
              <div className="seg-group" role="group" aria-label={t("ui.transport")}>
                {TRANSPORTS.map((x) => (
                  <button key={x} type="button" className={"seg-btn" + (transport === x ? " seg-btn--active" : "")} aria-pressed={transport === x} onClick={() => up({ transport: x })}>{t(`transport.${x}`)}</button>
                ))}
              </div>
            </div>
            <div className="dcb-seg">
              <span className="curlb-field-label">{t("ui.family")}</span>
              <div className="seg-group" role="group" aria-label={t("ui.family")}>
                {FAMILIES.map((x) => (
                  <button key={x || "any"} type="button" className={"seg-btn" + ((s.ipv ?? "") === x ? " seg-btn--active" : "")} aria-pressed={(s.ipv ?? "") === x} onClick={() => up({ ipv: x })}>{t(`family.${x || "any"}`)}</button>
                ))}
              </div>
            </div>
          </div>
          {transport === "https" && (
            <div className="curlb-grid">
              <label className="curlb-field">
                <span className="curlb-field-label">{t("ui.endpoint")}</span>
                <input id="dcb-endpoint" className="curlb-input" value={s.httpsEndpoint ?? ""} onChange={(e) => up({ httpsEndpoint: e.target.value })} placeholder="/dns-query" spellCheck={false} autoComplete="off" maxLength={300} />
              </label>
            </div>
          )}
          <p className="hmac-build-note">{t(`transportNote.${transport}`)}</p>
        </div>

        {/* 3. How to ask. */}
        <div className="curlb-section">
          <div className="curlb-section-title">{t("sec.how")}</div>
          <div className="curlb-checks">
            <label className="curlb-check"><input type="checkbox" checked={!!s.trace} onChange={(e) => up({ trace: e.target.checked })} /><span>{t("ui.trace")}</span></label>
            <label className="curlb-check"><input type="checkbox" checked={!!s.nssearch} onChange={(e) => up({ nssearch: e.target.checked })} /><span>{t("ui.nssearch")}</span></label>
            <label className="curlb-check"><input type="checkbox" checked={!!s.norecurse} onChange={(e) => up({ norecurse: e.target.checked })} /><span>{t("ui.norecurse")}</span></label>
            <label className="curlb-check"><input type="checkbox" checked={!!s.dnssec} onChange={(e) => up({ dnssec: e.target.checked })} /><span>{t("ui.dnssec")}</span></label>
            <label className="curlb-check"><input type="checkbox" checked={!!s.cd} onChange={(e) => up({ cd: e.target.checked })} /><span>{t("ui.cd")}</span></label>
            <label className="curlb-check"><input type="checkbox" checked={!!s.ignore} onChange={(e) => up({ ignore: e.target.checked })} /><span>{t("ui.ignore")}</span></label>
          </div>
          <div className="curlb-section-title dcb-subtitle">{t("sec.edns")}</div>
          <div className="curlb-grid">
            <label className="curlb-field curlb-field--narrow">
              <span className="curlb-field-label">{t("ui.bufsize")}</span>
              <input id="dcb-bufsize" className="curlb-input" value={s.bufsize ?? ""} onChange={(e) => up({ bufsize: e.target.value })} placeholder="1232" spellCheck={false} autoComplete="off" maxLength={5} inputMode="numeric" />
            </label>
            <label className="curlb-field">
              <span className="curlb-field-label">{t("ui.subnet")}</span>
              <input id="dcb-subnet" className="curlb-input" value={s.subnet ?? ""} onChange={(e) => up({ subnet: e.target.value })} placeholder="198.51.100.0/24, 0" spellCheck={false} autoComplete="off" maxLength={300} />
            </label>
          </div>
          <div className="curlb-checks">
            <label className="curlb-check"><input type="checkbox" checked={!!s.nsid} onChange={(e) => up({ nsid: e.target.checked })} /><span>{t("ui.nsid")}</span></label>
            <label className="curlb-check"><input type="checkbox" checked={!!s.nocookie} onChange={(e) => up({ nocookie: e.target.checked })} /><span>{t("ui.nocookie")}</span></label>
            <label className="curlb-check"><input type="checkbox" checked={!!s.noedns} onChange={(e) => up({ noedns: e.target.checked })} /><span>{t("ui.noedns")}</span></label>
          </div>
          <div className="curlb-section-title dcb-subtitle">{t("sec.timing")}</div>
          <div className="curlb-grid">
            <label className="curlb-field curlb-field--narrow">
              <span className="curlb-field-label">{t("ui.timeout")}</span>
              <input id="dcb-timeout" className="curlb-input" value={s.timeout ?? ""} onChange={(e) => up({ timeout: e.target.value })} placeholder="5" spellCheck={false} autoComplete="off" maxLength={5} inputMode="numeric" />
            </label>
            <label className="curlb-field curlb-field--narrow">
              <span className="curlb-field-label">{t("ui.tries")}</span>
              <input id="dcb-tries" className="curlb-input" value={s.tries ?? ""} onChange={(e) => up({ tries: e.target.value })} placeholder="3" spellCheck={false} autoComplete="off" maxLength={4} inputMode="numeric" />
            </label>
            <label className="curlb-field curlb-field--narrow">
              <span className="curlb-field-label">{t("ui.retry")}</span>
              <input id="dcb-retry" className="curlb-input" value={s.retry ?? ""} onChange={(e) => up({ retry: e.target.value })} placeholder="2" spellCheck={false} autoComplete="off" maxLength={4} inputMode="numeric" />
            </label>
          </div>
        </div>

        {/* 4. What to print. */}
        <div className="curlb-section">
          <div className="curlb-section-title">{t("sec.output")}</div>
          <div className="dcb-segs">
            <div className="dcb-seg">
              <span className="curlb-field-label">{t("ui.output")}</span>
              <div className="seg-group" role="group" aria-label={t("ui.output")}>
                {OUTPUTS.map((x) => (
                  <button key={x} type="button" className={"seg-btn" + (output === x ? " seg-btn--active" : "")} aria-pressed={output === x} onClick={() => up({ output: x })}>{t(`output.${x}`)}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="curlb-checks">
            {output === "short" && (
              <label className="curlb-check"><input type="checkbox" checked={!!s.identify} onChange={(e) => up({ identify: e.target.checked })} /><span>{t("ui.identify")}</span></label>
            )}
            <label className="curlb-check"><input type="checkbox" checked={!!s.multiline} onChange={(e) => up({ multiline: e.target.checked })} /><span>{t("ui.multiline")}</span></label>
            <label className="curlb-check"><input type="checkbox" checked={!!s.ttlunits} onChange={(e) => up({ ttlunits: e.target.checked })} /><span>{t("ui.ttlunits")}</span></label>
            <label className="curlb-check"><input type="checkbox" checked={!!s.qr} onChange={(e) => up({ qr: e.target.checked })} /><span>{t("ui.qr")}</span></label>
          </div>
        </div>

        {/* 5. Local machine. */}
        <div className="curlb-section">
          <div className="curlb-section-title">{t("sec.local")}</div>
          <div className="curlb-grid">
            <label className="curlb-field">
              <span className="curlb-field-label">{t("ui.keyfile")}</span>
              <input id="dcb-keyfile" className="curlb-input" value={s.keyfile ?? ""} onChange={(e) => up({ keyfile: e.target.value })} placeholder="/etc/dig/key.conf" spellCheck={false} autoComplete="off" maxLength={300} />
            </label>
          </div>
          <div className="curlb-checks">
            <label className="curlb-check"><input type="checkbox" checked={!!s.norc} onChange={(e) => up({ norc: e.target.checked })} /><span>{t("ui.norc")}</span></label>
          </div>
          <p className="hmac-build-note">{t("ui.keyNote")}</p>
        </div>
      </div>

      {/* The command. */}
      <div className="curlb-preview">
        <div className="curlb-preview-head">
          <span className="curl-code-lang">{t("ui.preview")}</span>
          {r.ok && (
            <span className="curlb-preview-actions">
              <CopyBtn text={r.command} label={t("ui.copy")} done={t("ui.copied")} />
            </span>
          )}
        </div>
        {r.ok ? (
          <pre className="curl-code-body dig-mono curlb-cmd dcb-cmd">{r.command}</pre>
        ) : errors.length > 0 && errors[0].code !== "empty" ? (
          <div className="curl-error">{errors.map((f) => <div key={f.code}>{t(`finding.${f.code}`, f.params ?? {})}</div>)}</div>
        ) : (
          <div className="curl-muted dcb-empty">{t("ui.empty")}</div>
        )}
        <p className="curl-muted curlb-shellnote">{t("ui.shellNote")}</p>
      </div>

      {/* Findings. */}
      {others.length > 0 && (
        <ul className="tcl-findings dcb-findings">
          {others.map((f, i) => (
            <li key={f.code + i} className={"tcl-finding tcl-finding-" + f.severity}>
              <div className="tcl-finding-head">
                <span className={"irl-sev " + (f.severity === "warning" ? "irl-sev-warning" : "irl-sev-info")}>{t(`severity.${f.severity}`)}</span>
                <span className="tcl-finding-title">{t(`findingTitle.${f.code}`)}</span>
              </div>
              <p className="tcl-finding-msg">{t(`finding.${f.code}`, f.params ?? {})}</p>
            </li>
          ))}
        </ul>
      )}

      {/* What the query carries. */}
      {r.ok && r.effective && (
        <section className="jwt-panel dcb-effective">
          <h4 className="jwt-panel-title">{t("eff.title")}</h4>
          <dl className="jwt-claims">
            <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("eff.question")}</dt><dd className="jwt-claim-value mono">{r.effective.question.name} {r.effective.question.type} {r.effective.question.klass}</dd></div>
            <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("eff.asked")}</dt><dd className="jwt-claim-value">{t(`eff.askedValue.${r.effective.servers}`)}</dd></div>
            <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("eff.transport")}</dt><dd className="jwt-claim-value">{t(`eff.via.${r.effective.transport}`, { port: r.effective.port })}{r.effective.transport === "UDP" && <span className="dcb-sub"> {r.effective.tcpFallback ? t("eff.fallbackYes") : t("eff.fallbackNo")}</span>}</dd></div>
            <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("eff.rd")}</dt><dd className="jwt-claim-value">{yn(r.effective.recursionDesired)} {r.effective.iterative && <span className="dcb-sub">{t("eff.iterative")}</span>}</dd></div>
            <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("eff.do")}</dt><dd className="jwt-claim-value">{yn(r.effective.dnssecOk)}</dd></div>
            <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("eff.cd")}</dt><dd className="jwt-claim-value">{yn(r.effective.checkingDisabled)}</dd></div>
            <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("eff.ad")}</dt><dd className="jwt-claim-value">{yn(r.effective.authenticData)} <span className="dcb-sub">{t("eff.adNote")}</span></dd></div>
            <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("eff.edns")}</dt><dd className="jwt-claim-value">{yn(r.effective.edns)} <span className="dcb-sub">{r.effective.edns ? (r.effective.bufsize !== null ? t("eff.bufsize", { n: r.effective.bufsize }) : t("eff.bufsizeDefault")) : t("eff.noOpt")}</span></dd></div>
            <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("eff.cookie")}</dt><dd className="jwt-claim-value">{yn(r.effective.cookie)}</dd></div>
            <div className="jwt-claim-row"><dt className="jwt-claim-label">{t("eff.signed")}</dt><dd className="jwt-claim-value">{yn(r.effective.signed)}</dd></div>
          </dl>
          <p className="hmac-build-note">{t("eff.note")}</p>
        </section>
      )}

      {/* Every token explained. */}
      {r.ok && r.parts.length > 0 && (
        <div className="curlb-parts">
          <div className="curlb-section-title">{t("ui.partsTitle")}</div>
          {r.parts.map((part, i) => (
            <div className="curlb-part" key={i}>
              <code className="curl-flag dig-mono">{part.text}</code>
              <span className="curl-opt-desc">{t(`explain.${part.explain}`)}</span>
            </div>
          ))}
        </div>
      )}

      <p className="cidr-privacy">{t("ui.privacy")}</p>
    </div>
  );
}
