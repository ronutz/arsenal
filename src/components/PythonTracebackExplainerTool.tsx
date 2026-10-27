"use client";

// ============================================================================
// src/components/PythonTracebackExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the Python traceback explainer. Paste a traceback printed by CPython
// 3.11 to 3.15; the page shows, in this order: what happened and where to look
// first; what the format says about the release; notes about the paste; what
// in it may be sensitive, with a redacted copy to share instead; then every
// exception of the chain, oldest first, with the banner that links each to
// the next, its class chain and hint, and its frames with their source lines,
// markers and file kinds; exception groups show their members, nested.
//
// The engine (src/lib/tools/python-traceback-explainer/compute.ts) does all
// the work, in the browser; this component only renders it. It imports the
// engine and the Example directly, not the package index, so the golden
// vectors stay out of the page's bundle. Styling reuses existing classes
// (cidr-*, jwt-*, dig-*, json-*, b64-copy, cipher-note); no new CSS class.
//
// SHARE RESULTS (2026-10-27, PRIME): a button in the "what may be sensitive"
// section builds, only when pressed, a link carrying the redacted copy, never
// the paste as typed, and none at all when lines were too long for the
// secrets check (spec: src/lib/tools/python-traceback-explainer/share.ts). An
// arriving link (useShareArrival) fills the box as a paste would and the page
// explains it; the address loses the value at once (history.replaceState).
// ============================================================================

import { useMemo, useState } from "react"; // state and the memoised reading
import { useTranslations } from "next-intl"; // this tool's messages
import { explainTraceback, type ChainItem, type ExcNode, type FirstLook, type FrameNode, type TracebackResult } from "@/lib/tools/python-traceback-explainer/compute"; // the engine
import { EXAMPLE_TRACEBACK } from "@/lib/tools/python-traceback-explainer/example"; // D-83: verbatim the input of golden vector example-poll
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the spec encodes
import { PYTHON_TRACEBACK_SHARE, encodeTracebackReading } from "@/lib/tools/python-traceback-explainer/share"; // this tool's share spec: the redacted copy only

/** Nothing to share (the button is disabled). */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // a constant, so the button sees no change

/** The message function of this tool's namespace. */
type T = ReturnType<typeof useTranslations>;

/** The message id of a known exception: "_ssl_X" reads the "ssl_X" text (the same class under 3.14.2's spelling). */
const excKey = (id: string): string => (id.startsWith("_ssl_") ? id.slice(1) : id); // one text for both spellings

/**
 * Find an exception by id in a chain tree.
 * @param chain the top-level chain
 * @param id the id
 * @returns the node, or null
 */
function findExc(chain: ChainItem[], id: string): ExcNode | null {
  for (const it of chain) { // each exception
    if (it.exc.id === id) return it.exc; // found
    if (it.exc.group) for (const m of it.exc.group.members) { const f = findExc(m, id); if (f) return f; } // in a member
  } // items
  return null; // not here
} // findExc

/**
 * One "where to look first" sentence (and the earlier exception's, when linked).
 * @param t messages
 * @param r the reading
 * @param f the first-look reading
 * @returns the sentence
 */
function lookText(t: T, r: TracebackResult, f: FirstLook): string {
  const e = findExc(r.chain, f.exc); // the exception it is about
  const fr = e && f.frame !== null ? e.frames[f.frame] : null; // the frame it points at
  const inner = f.innerKind ? t(`inside.${f.innerKind}`) : ""; // where the innermost frame is ("inside the standard library")
  let own: string; // this exception's reading
  if (f.kind === "syntax") { // the SyntaxError location comes first; the frame, if any, is the import that loaded the file
    const loc = { file: e?.location?.file ?? "", line: e?.location?.lineno ?? "", column: e?.location?.column ?? "?" }; // where the parser stopped
    own = fr ? t("look.syntaxImported", { exc: f.exc, ...loc, importFile: fr.file, importLine: fr.lineno ?? "None" }) : t("look.syntax", { exc: f.exc, ...loc }); // with or without the import
  } else {
    const where = fr ? { file: fr.file, line: fr.lineno ?? "None", func: fr.func } : { file: "", line: "", func: "" }; // file, line, function
    own = t(`look.${f.kind}`, { exc: f.exc, type: e?.type ?? "", inner, ...where }); // the reading
  } // kinds
  if (!f.previous) return own; // no earlier exception
  const p = findExc(r.chain, f.previous.exc); // the earlier one
  return `${own} ${t(`look.previous.${f.previous.link}`, { exc: f.previous.exc, type: p?.type ?? "" })} ${lookText(t, r, f.previous.look)}`; // and where the earlier one points
} // lookText

/**
 * The source lines of a frame, each followed by its marker line, as CPython printed them.
 * @param f the frame
 * @returns the text for a pre element
 */
function frameSource(f: FrameNode): string {
  const out: string[] = []; // the lines
  f.source.forEach((s, i) => { out.push(s); const m = f.markers[i]; if (m) out.push(m); }); // a line, then its markers
  return out.join("\n"); // as one block
} // frameSource

/** One frame. */
function FrameView({ t, f, n }: { t: T; f: FrameNode; n: number }) {
  return (
    <div className="dig-record">
      {/* The frame's identity: its number from the outside in, the file kind, the file, the line and the function. */}
      <div className="dig-record-head">
        <span className="dig-type-badge">{t("frame.number", { n })}</span>
        <span className="dig-class">{t(`kinds.${f.kind}`)}</span>
        <span className="dig-mono dig-record-name">{f.file}</span>
        <span className="dig-ttl">{t("frame.where", { line: f.lineno ?? "None", func: f.func })}</span>
      </div>
      {/* The source as printed, markers included; nothing when CPython had no source to show. */}
      {f.source.length > 0 ? <pre className="json-output mono">{frameSource(f)}</pre> : <p className="dig-meaning">{t("frame.noSource")}</p>}
      {/* What the markers point at: the expression, and with ~ the part under ^ (call, subscript or operator). */}
      {f.mark && <p className="dig-meaning">{t("mark.expression", { text: f.mark.expression })}</p>}
      {f.mark && f.mark.focusKind && <p className="dig-meaning">{t(`mark.${f.mark.focusKind}`, { focus: f.mark.focus ?? "", rest: (f.mark.rest ?? []).join(" / ") })}</p>}
      {f.elided > 0 && <p className="dig-meaning">{t("frame.elided", { n: f.elided, marker: "\"...<N lines>...\"" })}</p>}
      {f.repeated > 0 && <p className="dig-meaning">{t("frame.repeated", { n: f.repeated })}</p>}
      {/* Local variables printed under the frame (unittest --locals, capture_locals): they can hold secrets. */}
      {f.locals.length > 0 && (
        <>
          <p className="dig-meaning">{t("frame.locals", { n: f.locals.length })}</p>
          <pre className="json-output mono">{f.locals.map((l) => `${l.name} = ${l.value}`).join("\n")}</pre>
        </>
      )}
    </div>
  );
} // FrameView

/** One exception, with its frames and, for a group, its members. */
function ExcView({ t, e }: { t: T; e: ExcNode }) {
  // A group past max_group_depth: CPython printed only "... (max_group_depth is N)".
  if (e.depthLimited !== null) return <p className="dig-meaning">{t("exc.depthLimited", { id: e.id, n: e.depthLimited })}</p>;
  const k = e.known; // the table entry
  return (
    <div className="jwt-panel">
      {/* The exception line: its id, the type and the message. */}
      <div className="dig-record-head">
        <span className="dig-type-badge">{e.id}</span>
        <span className="dig-mono dig-record-name">{e.type ?? t("exc.missing")}</span>
      </div>
      {e.message !== null && <pre className="json-output mono">{e.message}</pre>}
      {e.type !== null && e.message === null && e.extra.length === 0 && <p className="dig-meaning">{t("exc.noMessage")}</p>}
      {/* The lines after the exception line: the rest of the message, or notes; the text cannot tell which. */}
      {e.extra.length > 0 && (
        <>
          <p className="dig-meaning">{t("exc.extra", { n: e.extra.length })}</p>
          <pre className="json-output mono">{e.extra.join("\n")}</pre>
        </>
      )}
      {/* What the class is: its chain, its description and its documentation, or why it is not in the table. */}
      {k ? (
        <>
          <div className="dig-row"><span className="dig-row-label">{t("exc.chain")}</span><span className="dig-row-value dig-mono">{[k.name, ...k.chain].join(" → ")}</span></div>
          <p className="dig-meaning">{t(`excDesc.${excKey(k.id)}`)}</p>
          {k.since && <p className="dig-meaning">{t("exc.since", { since: k.since })}</p>}
          <p className="cipher-note"><a href={k.doc} target="_blank" rel="noopener noreferrer">{t("exc.docs")}</a></p>
        </>
      ) : e.type !== null ? <p className="dig-meaning">{t(e.module ? "exc.unknownModule" : "exc.unknownBare", { module: e.module ?? "" })}</p> : null}
      {e.hint && <p className="dig-meaning">{t(`hint.${excKey(e.hint)}`)}</p>}
      {/* CPython's own suggestions, errno, codec details. */}
      {e.suggestions.map((s, i) => <p key={i} className="dig-meaning">{t(`suggestion.${s.kind}`, { value: s.value, path: s.path ?? "" })}</p>)}
      {e.oserror && <div className="dig-row"><span className="dig-row-label">{e.oserror.windows ? "WinError" : "errno"}</span><span className="dig-row-value dig-mono">{`${e.oserror.errno}: ${e.oserror.text}`}</span></div>}
      {e.oserror && <p className="dig-meaning">{t(e.oserror.errno < 0 && e.type === "socket.gaierror" ? "exc.gaiErrno" : "exc.errno")}</p>}
      {e.codec && <p className="dig-meaning">{t("exc.codec", { codec: e.codec.codec, what: e.codec.what, position: e.codec.position, reason: e.codec.reason })}</p>}
      {/* The SyntaxError location: the file never ran, or a module did not compile. */}
      {e.location && (
        <div className="dig-record">
          <div className="dig-record-head">
            <span className="dig-class">{t("location.title")}</span>
            <span className="dig-mono dig-record-name">{e.location.file}</span>
            <span className="dig-ttl">{t("location.where", { line: e.location.lineno, column: e.location.column ?? "?" })}</span>
          </div>
          {e.location.text !== null && <pre className="json-output mono">{e.location.text + (e.location.marker ? "\n" + e.location.marker : "")}</pre>}
          {e.location.marked !== null && <p className="dig-meaning">{e.location.marked === "" ? t("location.endOfLine") : t("location.marked", { text: e.location.marked })}</p>}
        </div>
      )}
      {/* The frames, outermost first, as CPython printed them. */}
      {e.hasTraceback && e.frames.length > 0 && <p className="cipher-note">{t("exc.framesOrder", { n: e.frames.length })}</p>}
      {e.frames.map((f, i) => <FrameView key={i} t={t} f={f} n={i + 1} />)}
      {!e.hasTraceback && e.type !== null && !e.location && <p className="dig-meaning">{t("exc.noTraceback")}</p>}
      {/* A group's members: each member is a chain of its own. */}
      {e.group && (
        <>
          <p className="dig-meaning">{t("group.members", { n: e.group.members.length, more: e.group.more })}</p>
          {e.group.members.map((m, i) => (
            <details key={i} open={i < 3}>
              <summary>{t("group.member", { n: i + 1, type: m.length ? m[m.length - 1].exc.type ?? "" : "" })}</summary>
              <ChainView t={t} chain={m} />
            </details>
          ))}
          {e.group.more > 0 && <p className="dig-meaning">{t("group.more", { n: e.group.more })}</p>}
        </>
      )}
    </div>
  );
} // ExcView

/** A chain: each exception, then the banner that links it to the next. */
function ChainView({ t, chain }: { t: T; chain: ChainItem[] }) {
  return (
    <>
      {chain.map((it) => (
        <div key={it.exc.id}>
          <ExcView t={t} e={it.exc} />
          {/* The banner CPython printed after this exception, and what it means. */}
          {it.link && <p className="cipher-note">{t(`link.${it.link}`)}</p>}
        </div>
      ))}
    </>
  );
} // ChainView

/** The Python traceback explainer. */
export default function PythonTracebackExplainerTool() {
  const t = useTranslations("tools.python-traceback-explainer"); // this tool's messages
  const [input, setInput] = useState(""); // the paste
  const [copied, setCopied] = useState(false); // the Copy button's feedback

  // The engine runs on every change; it never throws, and an empty box shows nothing.
  const r = useMemo(() => (input.trim() === "" ? null : explainTraceback(input)), [input]); // the reading

  // An arriving share link: the redacted copy fills the box as a paste would, and the page explains it.
  useShareArrival(PYTHON_TRACEBACK_SHARE, (state) => setInput(state.input)); // the copy

  // What Share results may carry: the redacted copy, or nothing, or blocked when lines went unchecked.
  const share = useMemo<ShareEncoding>(() => (r && r.ok ? encodeTracebackReading(r) : NOTHING), [r]); // from the reading already made

  /** Copy the redacted copy to the clipboard and say so for a moment. */
  function copyRedacted() {
    if (!r || !r.ok) return; // nothing to copy
    navigator.clipboard?.writeText(r.redacted).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 1500); }, // "Copied", then back
      () => {}, // a refused clipboard changes nothing on the page
    ); // writeText
  } // copyRedacted

  const last = r && r.ok ? r.chain[r.chain.length - 1].exc : null; // the exception the traceback ends with
  const rel = r && r.ok ? r.release : null; // the release reading

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="pytb-input">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            {/* D-83 Example/Clear row: the sample is golden vector example-poll's input, byte for byte. */}
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE_TRACEBACK)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="pytb-input"
          className="cidr-input mono saml-textarea json-input"
          rows={14}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="pytb-privacy"
        />
        <p id="pytb-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">●</span> {t("runsLocally")}
        </p>
      </div>

      {/* Refused: why. */}
      {r && !r.ok && r.error && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{t(`errors.${r.error.code}`, r.error.params ?? {})}</p>
          {r.notes.some((n) => n.code === "foreign-format") && <p className="json-error-message">{t("notes.foreign-format")}</p>}
        </div>
      )}

      {r && r.ok && last && rel && (
        <div className="jwt-results">
          {/* What happened, and where to look first. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("summary.title")}</h4>
            <p className="dig-meaning">{last.type ? t("summary.endsWith", { type: last.type, message: last.message ?? "" }) : t("summary.cut")}</p>
            <p className="dig-meaning">{t("summary.counts", { exceptions: r.stats.exceptions, frames: r.stats.frames, groups: r.stats.groups })}</p>
            <h4 className="jwt-panel-title">{t("look.title")}</h4>
            <ul className="dig-warning-list">
              {r.firstLook.map((f, i) => <li key={i}>{lookText(t, r, f)}</li>)}
            </ul>
            <p className="cipher-note">{t("look.caveat")}</p>
          </section>

          {/* What the format says about the release that printed it. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("release.title")}</h4>
            <p className="dig-meaning">
              {rel.conflict ? t("release.conflict") : rel.min !== null && rel.min === rel.max ? t("release.exact", { v: rel.min }) : rel.min !== null && rel.max !== null ? t("release.between", { min: rel.min, max: rel.max }) : rel.min !== null ? t("release.atLeast", { v: rel.min }) : rel.max !== null ? t("release.atMost", { v: rel.max }) : t("release.unknown")}
            </p>
            {rel.evidence.length > 0 && (
              <ul className="dig-warning-list">
                {rel.evidence.map((ev, i) => <li key={i}>{t(`release.evidence.${ev.code}`, { line: ev.line, detail: ev.detail ?? "" })}</li>)}
              </ul>
            )}
            <p className="cipher-note">{t("release.supported")}</p>
          </section>

          {/* Notes about the paste and the reading. */}
          {r.notes.filter((n) => n.code !== "sensitive").length > 0 && (
            <section className="jwt-panel dig-warnings">
              <h4 className="jwt-panel-title">{t("notesTitle")}</h4>
              <ul className="dig-warning-list">
                {r.notes.filter((n) => n.code !== "sensitive").map((n, i) => (
                  <li key={i}><span className="dig-warn-mark">&#9650;</span> {t(`notes.${n.code}`, n.params ?? {})}</li>
                ))}
              </ul>
            </section>
          )}

          {/* What may be sensitive, and the redacted copy to share instead. */}
          <section className="jwt-panel">
            <div className="json-output-head">
              <h4 className="jwt-panel-title">{t("sensitive.title")}</h4>
              <button type="button" className="json-copy-btn" onClick={copyRedacted}>{copied ? t("copied") : t("sensitive.copy")}</button>
            </div>
            {r.sensitive.length === 0 ? <p className="dig-meaning">{t("sensitive.none")}</p> : (
              <ul className="dig-warning-list">
                {r.sensitive.map((s, i) => <li key={i}>{t(`sensitive.rules.${s.rule}`, { line: s.line, column: s.column, label: s.label, n: s.count })}</li>)}
              </ul>
            )}
            <p className="cipher-note">{t("sensitive.warning", { user: "<user>", redacted: "[redacted]" })}</p>
            {/* Share results: the redacted copy above, as a link; its own row, so the popover opens below the button. */}
            <div className="rdap-ask-row">
              <ShareResultsButton
                encoding={share}
                carries={t("share.carries", { user: "<user>", redacted: "[redacted]" })}
                blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blocked", { n: Number(share.values?.n ?? 0), max: Number(share.values?.max ?? 0) }) : ""}
                title={t("name")}
              />
            </div>
          </section>

          {/* Every exception, oldest first, as CPython printed them. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("chain.title")}</h4>
            <p className="cipher-note">{t(r.chain.length > 1 ? "chain.order" : "chain.single", { n: r.chain.length })}</p>
            <ChainView t={t} chain={r.chain} />
          </section>
        </div>
      )}
    </div>
  );
} // PythonTracebackExplainerTool
