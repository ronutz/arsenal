"use client"; // a client component: state, events, the Share popover

// ============================================================================
// src/components/AclFirstMatchEvaluatorTool.tsx
// ----------------------------------------------------------------------------
// ACL first-match evaluator (02/11/2026): paste a Cisco IOS or IOS XE IPv4
// access list, describe one packet, and read which entry decides it. The
// engine (src/lib/tools/acl-first-match-evaluator) reads the list, walks it in
// the order the device tests it and lints it; this component only lays the
// reading out, in the order a reader needs it:
//   1. the list box (Example / Clear, D-83), the scope of what is read and a
//      link to the ACL article for other platforms;
//   2. when the text holds several lists, which one to evaluate, and the test
//      packet (five short fields in a grid that wraps, the two ports with up
//      and down arrows since 03/11/2026, and the ACK or RST box, TCP only),
//      each in a headed panel;
//   3. the verdict first, then Share results under it (the reader's next step
//      after the answer), then the walk with the field that ruled out every
//      entry above the match, the lint, the entries with each address as
//      wildcard and prefix, what was read with the lines not read, and the
//      notes. Entry text wraps at its spaces, never inside an address, and no
//      block scrolls sideways (reviewed at 390 and 1280 px, en and pt-BR).
// Every sentence the engine writes arrives as an EngineText and is shown
// through engineTexts(t) (pack keys tools.acl-first-match-evaluator.engine.*),
// so the pt-BR page reads in Portuguese.
// Styling reuses the existing vocabulary (cidr-*, dig-*, jwt-*, tcl-* notes,
// panos-* traffic grid, toggle, action badge and decision line): no new CSS.
// ============================================================================

import { useMemo, useState } from "react"; // state and memoised readings
import { useLocale, useTranslations } from "next-intl"; // this tool's messages and the page's locale
import { Link } from "@/i18n/navigation"; // a locale-aware link (the ACL article)
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { ACL_FIRST_MATCH_SHARE } from "@/lib/tools/acl-first-match-evaluator/share"; // this tool's share spec
import { analyseAclLocalisable, type AclAddress, type AclReading } from "@/lib/tools/acl-first-match-evaluator/compute"; // the engine, sentences with ids
import { ACL_VECTORS } from "@/lib/tools/acl-first-match-evaluator/golden-vectors"; // the golden vectors, for the Example (D-83)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { StepperField, stepperKeyDown } from "@/components/NumberStepper"; // up and down arrows for the two port fields (03/11/2026)

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

/** D-83 Example: golden vector course-lab-vlan20-ssh-denied (the course lab's list; SSH from VLAN 20 is denied by entry 20). */
const EXAMPLE = ACL_VECTORS.find((v) => v.id === "course-lab-vlan20-ssh-denied")!; // the vector

/** The Learn article that explains other platforms' end of list. */
const ARTICLE = "/learn/access-control-lists-on-switches-and-routers"; // locale-agnostic

/** Protocol values offered in the field's list (any keyword the engine reads, or a number, may be typed). */
const PROTOCOL_CHOICES = ["tcp", "udp", "icmp", "gre", "esp", "ospf", "eigrp", "pim", "igmp"]; // suggestions

/** Lint kinds shown with the flag style (something to fix or check); the rest are information. */
const FLAGGED = new Set(["shadowed", "redundant", "redundant-later", "never-matches", "non-contiguous", "ignored-bits", "long-remark"]); // flagged kinds

/** The note the page shows beside the box already (with its link), so the notes panel leaves it out. */
const SCOPE_NOTE_ID = "note.scope"; // the engine's scope note

/** The reading, or an error the engine threw (too long), or nothing yet. */
type Result = { ok: true; data: AclReading<EngineText> } | { ok: false; error: unknown } | null; // the three states

/** The tool's page body: the list, the packet, and the reading. */
export default function AclFirstMatchEvaluatorTool() {
  const t = useTranslations("tools.acl-first-match-evaluator"); // this tool's messages
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const locale = useLocale(); // for counts of addresses
  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]); // the page's number format
  const [input, setInput] = useState(""); // the pasted list
  const [list, setList] = useState(""); // the list chosen ("" for the first)
  const [protocol, setProtocol] = useState(""); // the packet's protocol
  const [source, setSource] = useState(""); // its source address
  const [srcport, setSrcport] = useState(""); // its source port
  const [destination, setDestination] = useState(""); // its destination address
  const [dstport, setDstport] = useState(""); // its destination port
  const [ackrst, setAckrst] = useState(false); // ACK or RST set

  const p = protocol.trim().toLowerCase(); // the protocol as typed
  const portsApply = p === "" || p === "tcp" || p === "udp" || p === "6" || p === "17"; // ports are read for TCP and UDP only
  const ackApplies = p === "" || p === "tcp" || p === "6"; // the box is read for TCP only
  const packetGiven = p !== "" && source.trim() !== "" && destination.trim() !== ""; // the three fields every packet needs

  // The reading: pure, recomputed only when an input changes.
  const result = useMemo<Result>(() => {
    if (input.trim() === "") return null; // nothing pasted
    try { // an over-long text throws, with its sentence
      return { ok: true, data: analyseAclLocalisable({ acl: input, list, packet: packetGiven ? { protocol, source, destination, sourcePort: srcport, destinationPort: dstport, ackOrRst: ackrst } : null }) }; // read, walked, linted
    } catch (e) {
      return { ok: false, error: e }; // over the bounds: shown through tx.error
    } // try
  }, [input, list, packetGiven, protocol, source, destination, srcport, dstport, ackrst]); // its inputs

  // An arriving share link: every field fills as typing would, and the page reads them (nothing is contacted).
  useShareArrival(ACL_FIRST_MATCH_SHARE, (s) => { setInput(s.input); setList(s.list); setProtocol(s.protocol); setSource(s.source); setSrcport(s.srcport); setDestination(s.destination); setDstport(s.dstport); setAckrst(s.ackrst); }); // as typed

  // What Share results may carry: the list and the packet as typed, once a list was read (memoised).
  const share = useMemo<ShareEncoding>(() => (result?.ok ? ACL_FIRST_MATCH_SHARE.encode({ input, list, protocol, source, srcport, destination, dstport, ackrst }) : NOTHING), [result, input, list, protocol, source, srcport, destination, dstport, ackrst]); // the encoding
  const shareBlocked = !share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? "") }) : ""; // why there is no link, or nothing

  /** Fill every field from the Example vector. */
  const loadExample = () => {
    setInput(EXAMPLE.acl); setList(EXAMPLE.list ?? ""); // the list
    setProtocol(EXAMPLE.packet?.protocol ?? ""); setSource(EXAMPLE.packet?.source ?? ""); setSrcport(EXAMPLE.packet?.sourcePort ?? ""); // the packet's source side
    setDestination(EXAMPLE.packet?.destination ?? ""); setDstport(EXAMPLE.packet?.destinationPort ?? ""); setAckrst(!!EXAMPLE.packet?.ackOrRst); // its destination side
  }; // loadExample
  /** Empty every field. */
  const clearAll = () => { setInput(""); setList(""); setProtocol(""); setSource(""); setSrcport(""); setDestination(""); setDstport(""); setAckrst(false); }; // cleared

  const data = result?.ok ? result.data : null; // the reading, when there is one
  const selected = data ? data.lists.find((l) => l.name === data.selected) ?? null : null; // the list evaluated
  const bySeq = new Map((selected?.entries ?? []).map((e) => [e.seq, e])); // its entries by number
  const kindWord = (k: string) => t(k === "standard" ? "kinds.standard" : "kinds.extended"); // a list kind in words

  /** One address test: as written when that differs, the wildcard form, the prefix (or why none), the count. */
  const addressView = (a: AclAddress) => (
    <>{/* written form (when it differs), wildcard form, prefix, count */}
      {(a.form !== "wildcard" || a.ignoredBitsSet) && <><code className="dig-mono">{a.written}</code>{" = "}</>}
      <code className="dig-mono">{a.base} {a.wildcard}</code>
      {" · "}{a.prefix ? t("entries.prefix", { prefix: a.prefix }) : t("entries.noPrefix")}
      {" · "}{t("entries.count", { count: nf.format(a.addresses) })}
    </>
  ); // addressView

  return (
    <div className="cidr-tool jwt-tool dig-tool">
      {/* -- the list -- */}
      <div className="dig-input-head">
        <label htmlFor="acl-in" className="cidr-label">{t("input.label")}</label>
        <div className="dig-input-actions">
          {/* D-83 Example/Clear row: the Example is a golden vector, byte for byte. */}
          <button type="button" className="b64-copy" onClick={loadExample}>{t("input.example")}</button>
          <button type="button" className="b64-copy" onClick={clearAll}>{t("input.clear")}</button>
        </div>
      </div>
      <p className="dig-meaning">{t("input.help")}</p>
      <textarea
        id="acl-in"
        className="cidr-input dig-textarea"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("input.placeholder")}
        spellCheck={false}
        autoComplete="off"
        rows={8}
      />
      <p className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">&#128274;</span> {t("privacy")}</p>
      {/* The scope, beside the box, with the article that explains other platforms' end of list. */}
      <p className="dig-meaning">{t("scope.text")} <Link className="apiref-link" href={ARTICLE}>{t("scope.link")}</Link></p>

      {/* -- which list (when there are several) and the test packet, each a headed panel -- */}
      <div className="jwt-results">
        {data && data.lists.length > 1 && (
          <section className="jwt-panel">
            <h4 className="jwt-panel-title" id="acl-lists-h">{t("lists.label")}</h4>
            <div className="dig-input-actions" role="group" aria-labelledby="acl-lists-h">
              {data.lists.map((l) => (
                <button key={l.name} type="button" className="b64-copy" aria-pressed={data.selected === l.name} onClick={() => setList(l.name)}>{l.name} ({kindWord(l.kind)})</button>
              ))}
            </div>
            <p className="dig-meaning">{t("lists.help")}</p>
          </section>
        )}
        <section className="jwt-panel">
          <h4 className="jwt-panel-title" id="acl-pkt-h">{t("packet.title")}</h4>
          {/* acl-traffic: wider columns than the shared grid, so a port field keeps room beside its arrows (03/11/2026). */}
          <div className="panos-traffic acl-traffic" role="group" aria-labelledby="acl-pkt-h">
            <label className="panos-traffic-field">
              <span>{t("packet.protocol")}</span>
              <input value={protocol} onChange={(e) => setProtocol(e.target.value)} list="acl-protocols" placeholder={t("packet.protocolPlaceholder")} spellCheck={false} autoComplete="off" autoCapitalize="none" />
            </label>
            <label className="panos-traffic-field">
              <span>{t("packet.source")}</span>
              <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="10.1.20.25" inputMode="decimal" spellCheck={false} autoComplete="off" />
            </label>
            {/* A port field: its label stands beside it (not around it, or the arrows' names would join the field's). */}
            <div className="panos-traffic-field">
              {/* The label, tied to the field by id. */}
              <label htmlFor="acl-srcport"><span>{t("packet.sourcePort")}</span></label>
              {/* Up and down arrows, whole numbers 0 to 65535 as the engine reads a port (packet.port), disabled with the field. */}
              <StepperField value={srcport} onValue={setSrcport} min={0} max={65535} integer label={t("packet.sourcePort")} inputId="acl-srcport" disabled={!portsApply}>
                <input id="acl-srcport" value={srcport} onChange={(e) => setSrcport(e.target.value)} onKeyDown={stepperKeyDown({ value: srcport, onValue: setSrcport, min: 0, max: 65535, integer: true })} placeholder="51514" inputMode="numeric" disabled={!portsApply} spellCheck={false} autoComplete="off" />
              </StepperField>
            </div>
            <label className="panos-traffic-field">
              <span>{t("packet.destination")}</span>
              <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="10.1.99.10" inputMode="decimal" spellCheck={false} autoComplete="off" />
            </label>
            {/* The destination port, laid out as the source port. */}
            <div className="panos-traffic-field">
              {/* The label, tied to the field by id. */}
              <label htmlFor="acl-dstport"><span>{t("packet.destinationPort")}</span></label>
              {/* Up and down arrows, 0 to 65535, disabled with the field. */}
              <StepperField value={dstport} onValue={setDstport} min={0} max={65535} integer label={t("packet.destinationPort")} inputId="acl-dstport" disabled={!portsApply}>
                <input id="acl-dstport" value={dstport} onChange={(e) => setDstport(e.target.value)} onKeyDown={stepperKeyDown({ value: dstport, onValue: setDstport, min: 0, max: 65535, integer: true })} placeholder="22" inputMode="numeric" disabled={!portsApply} spellCheck={false} autoComplete="off" />
              </StepperField>
            </div>
          </div>
          <datalist id="acl-protocols">{PROTOCOL_CHOICES.map((c) => <option key={c} value={c} />)}</datalist>
          <label className="panos-toggle">
            <input type="checkbox" checked={ackrst} disabled={!ackApplies} onChange={(e) => setAckrst(e.target.checked)} />
            <span>{t("packet.ackrst")}</span>
          </label>
          <p className="dig-meaning">{t("packet.help")}</p>
        </section>
      </div>

      {result && !result.ok && <p className="cidr-error" role="alert">{tx.error(result.error)}</p>}

      {data && (
        <div className="jwt-results dig-results">
          {/* -- the packet could not be read -- */}
          {data.packetErrors.length > 0 && (
            <div role="alert">
              {data.packetErrors.map((m, i) => <p key={i} className="cidr-error">{tx.say(m)}</p>)}
            </div>
          )}

          {/* -- the verdict -- */}
          {data.verdict ? (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("verdict.title")}</h4>
              <p className="panos-decision">
                <span className={`panos-action ${data.verdict.action === "permit" ? "panos-action-allow" : "panos-action-deny"}`}>{data.verdict.action}</span>{" "}
                {tx.say(data.verdict.sentence)}
              </p>
              {/* The deciding entry, wrapping at its spaces on a phone (never a box that scrolls sideways). */}
              {data.verdict.text && <p className="dig-record-head"><code className="dig-mono">{data.verdict.seq} {data.verdict.text}</code></p>}
            </section>
          ) : (
            !packetGiven && selected && <p className="dig-meaning">{t("packet.none")}</p>
          )}

          {/* Share results: under the answer it shares, at the start of its own row (ROLLOUT section 7). */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={[t("share.caution")]} blockedMessage={shareBlocked} title={t("name")} />
          </div>

          {/* -- the walk -- */}
          {data.steps.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("walk.title")}</h4>
              <p className="dig-meaning">{t("walk.help")}</p>
              <ol className="dig-records">
                {data.steps.map((s) => (
                  <li key={s.seq} className="dig-record">
                    <div className="dig-record-head">
                      <code className="dig-mono">{s.seq} {s.text}</code>
                      {s.matched
                        ? <span className={`panos-action ${s.action === "permit" ? "panos-action-allow" : "panos-action-deny"}`}>{t("walk.match")}</span>
                        : <span className="dig-record-type">{t(`fields.${s.field}`)}</span>}
                    </div>
                    <p className="dig-record-explain">{tx.say(s.reason)}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* -- the lint -- */}
          {selected && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("lint.title")}</h4>
              {data.lint.length === 0 ? <p className="dig-meaning">{t("lint.none")}</p> : (
                <ul className="tcl-notes">
                  {data.lint.map((l, i) => <li key={i} className={FLAGGED.has(l.kind) ? "tcl-note tcl-note-flag" : "tcl-note"}>{tx.say(l.sentence)}</li>)}
                </ul>
              )}
            </section>
          )}

          {/* -- the entries, in the order tested, each address as wildcard and prefix -- */}
          {selected && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("entries.title", { list: selected.name, kind: kindWord(selected.kind) })}</h4>
              {selected.entries.length === 0 && <p className="dig-meaning">{t("entries.none")}</p>}
              <ol className="dig-records">
                {selected.evaluationOrder.map((seq) => {
                  const e = bySeq.get(seq)!; // the entry
                  const options = [e.established ? "established" : "", e.fragments ? "fragments" : "", e.log ?? ""].filter(Boolean).join(" "); // its options as written
                  return (
                    <li key={seq} className="dig-record">
                      <div className="dig-record-head">
                        <code className="dig-mono">{seq} {e.text}</code>
                        <span className="dig-record-type">{e.seqGiven ? t("entries.line", { line: e.line }) : `${t("entries.seqAssigned")}, ${t("entries.line", { line: e.line })}`}</span>
                      </div>
                      <dl className="dig-kv">
                        <div><dt>{t("entries.source")}</dt><dd>{addressView(e.source)}</dd></div>
                        {e.sourcePort && <div><dt>{t("entries.sourcePort")}</dt><dd><code className="dig-mono">{e.sourcePort.written}</code></dd></div>}
                        {e.destination && <div><dt>{t("entries.destination")}</dt><dd>{addressView(e.destination)}</dd></div>}
                        {e.destinationPort && <div><dt>{t("entries.destinationPort")}</dt><dd><code className="dig-mono">{e.destinationPort.written}</code></dd></div>}
                        {options && <div><dt>{t("entries.options")}</dt><dd><code className="dig-mono">{options}</code></dd></div>}
                      </dl>
                    </li>
                  );
                })}
              </ol>
              {selected.remarks.length > 0 && (
                <>
                  <p className="cidr-label">{t("remarks.title")}</p>
                  <ul className="tcl-notes">
                    {selected.remarks.map((r) => <li key={r.line} className="tcl-note"><span className="dig-record-type">{t("entries.line", { line: r.line })}</span> {r.text}</li>)}
                  </ul>
                </>
              )}
            </section>
          )}

          {/* -- what was read in the whole text, and the lines not read (listed with the reason, never dropped) -- */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("summary.title")}</h4>
            <dl className="dig-kv">
              <div><dt>{t("summary.lists")}</dt><dd>{data.lists.length}</dd></div>
              <div><dt>{t("summary.entries")}</dt><dd>{data.counts.entries}</dd></div>
              <div><dt>{t("summary.remarks")}</dt><dd>{data.counts.remarks}</dd></div>
              <div><dt>{t("summary.issues")}</dt><dd>{data.counts.issues}</dd></div>
            </dl>
            {data.issues.length > 0 && (
              <>
                {/* Under the count row that names them, so no second heading. */}
                <ol className="dig-records" aria-label={t("issues.title")}>
                  {data.issues.map((i) => (
                    <li key={i.line} className="dig-record">
                      <div className="dig-record-head">
                        <span className="dig-record-type">{t("issues.line", { line: i.line })}</span>
                        <code className="dig-record-name dig-mono">{i.text}</code>
                      </div>
                      <p className="dig-record-explain">{tx.say(i.reason)}</p>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>

          {/* -- notes (the scope note is beside the box already) -- */}
          {data.notes.some((n) => n.id !== SCOPE_NOTE_ID) && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("notes.title")}</h4>
              <ul className="tcl-notes">
                {data.notes.filter((n) => n.id !== SCOPE_NOTE_ID).map((n, i) => <li key={i} className="tcl-note">{tx.say(n)}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
