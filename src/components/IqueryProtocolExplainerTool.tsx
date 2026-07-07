"use client";

// ============================================================================
// src/components/IqueryProtocolExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE F5 iQUERY PROTOCOL EXPLAINER + iqdump/log DECODER.
//
// Three ways to use it, all offline:
//   - paste iqdump output      -> the header comments and <xml_connection>
//                                 stanza are read back field by field;
//   - paste /var/log/gtm lines -> the iQuery state-change / big3d-connection
//                                 messages are decoded;
//   - type or click a topic    -> the iQuery architecture is explained in F5's
//                                 own terms (mesh, port 4353, trust, iqdump,
//                                 metrics, gtmd, big3d, VLAN).
// Empty input renders the topic index as clickable buttons.
//
// The engine throws on oversized/invalid input (the worker-compatible
// contract), so the live run is wrapped and errors render in the shared error
// box. Chrome strings come from tools.iquery-protocol-explainer; the engine's
// explanatory text is English by design, like its explainer siblings.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  type IqueryResult,
  type DecodedField,
  type IqueryNote,
  type TopicInfo,
} from "@/lib/tools/iquery-protocol-explainer";

/** The live-run result, with thrown errors folded into an error envelope. */
type LiveResult = { ok: true; value: IqueryResult } | { ok: false; message: string };

// The one-click example (D-83): the real iqdump output sample published by F5
// in K000139663, so the decode shown matches genuine device output.
const EXAMPLE = `<!-- Local hostname: lc1.example.com -->
<!-- Connected to big3d at: ::ffff:10.10.10.10:4353 -->
<!-- Subscribing to syncgroup: default -->
<!-- Fri Apr 26 15:23:30 2024 -->
<xml_connection>
<version>16.1.3.3</version>
<big3d>big3d Version 16.1.3.3.0.0.3</big3d>
<connection_id>847</connection_id>`;

/** Map a note kind to the shared panel styling used across tools. */
function notePanelClass(kind: IqueryNote["kind"]): string {
  if (kind === "warn") return "jwt-panel dig-warnings";
  if (kind === "good") return "jwt-panel";
  return "jwt-panel";
}

/** One decoded field: label, raw value, plain-language explanation. */
function FieldCard({ f }: { f: DecodedField }) {
  return (
    <article className="tmsh-object iq-field">
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge mono">{f.label}</span>
        <span className="tmsh-object-name mono">{f.value}</span>
      </header>
      <p className="gdf-step-behavior">{f.explain}</p>
    </article>
  );
}

/** One explained topic. */
function TopicCard({ topic }: { topic: TopicInfo }) {
  return (
    <article className="tmsh-object iq-topic">
      <header className="tmsh-object-head">
        <span className="tmsh-object-name">{topic.title}</span>
      </header>
      <p className="gdf-step-behavior">{topic.body}</p>
    </article>
  );
}

export default function IqueryProtocolExplainerTool() {
  const t = useTranslations("tools.iquery-protocol-explainer");
  const [input, setInput] = useState("");

  // Empty input still produces a result here (the topic index), so we always
  // run unless the box is truly empty of non-whitespace AND we want the index.
  const live: LiveResult | null = useMemo(() => {
    try {
      return { ok: true, value: run(input) };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  }, [input]);

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool lbm-tool gdf-tool iq-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="iq-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="iq-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("inputPlaceholder")}
          spellCheck={false}
          rows={10}
          aria-describedby="iq-privacy"
        />
        <p id="iq-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
        </p>
      </div>

      {live && !live.ok && (
        <p className="cidr-error" role="alert">
          {live.message}
        </p>
      )}

      {live && live.ok && (
        <div className="jwt-results iq-results">
          {/* Notes first. */}
          {live.value.notes.length > 0 && (
            <div className={notePanelClass(live.value.notes[0].kind)}>
              <div className="jwt-panel-title">{t("notesTitle")}</div>
              <ul className="dig-warning-list">
                {live.value.notes.map((n, i) => (
                  <li key={i} className={`iq-note iq-note-${n.kind}`}>{n.text}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Topic index: clickable buttons that fill the box with the topic id. */}
          {live.value.mode === "topics-index" && live.value.topics && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("topicsTitle")}</div>
              <div className="iq-topic-buttons">
                {live.value.topics.map((tp) => (
                  <button
                    key={tp.id}
                    type="button"
                    className="b64-copy iq-topic-btn"
                    onClick={() => setInput(tp.id)}
                  >
                    {tp.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* A single explained topic. */}
          {live.value.mode === "topic" && live.value.topic && (
            <TopicCard topic={live.value.topic} />
          )}

          {/* Decoded iqdump / log fields. */}
          {(live.value.mode === "iqdump" || live.value.mode === "log") && live.value.fields.length > 0 && (
            <>
              <div className="jwt-panel">
                <div className="jwt-panel-title">{live.value.title}</div>
              </div>
              {live.value.fields.map((f, i) => (
                <FieldCard f={f} key={i} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
