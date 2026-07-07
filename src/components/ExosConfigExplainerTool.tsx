"use client";

// ============================================================================
// src/components/ExosConfigExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE EXTREMEXOS (EXOS / Switch Engine) CONFIG EXPLAINER.
//
// Paste an EXOS configuration and it reads it back, all offline:
//   - findings / observations first (line and VLAN counts, routing warnings);
//   - an aggregated VLAN summary (tag, tagged/untagged ports, IP addresses);
//   - every command explained in plain English, grouped by category (VLANs,
//     ports, Layer 3, link aggregation, spanning tree, accounts, management,
//     security).
// Empty input renders the EXOS verb reference.
//
// The engine throws on oversized input (the worker-compatible contract), so the
// run is wrapped and errors render in the shared error box. Chrome strings come
// from tools.exos-config-explainer; the explanatory text is English by design,
// like its explainer siblings.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  type ExosResult,
  type ExosVlan,
  type ExosNote,
} from "@/lib/tools/exos-config-explainer";

/** The live-run result, with thrown errors folded into an error envelope. */
type LiveResult = { ok: true; value: ExosResult } | { ok: false; message: string };

// The one-click example (D-83): a representative EXOS config drawn from the
// golden vectors, using command shapes from the ExtremeXOS Command Reference.
const EXAMPLE = `# core switch
create vlan engineering tag 100
configure vlan engineering add ports 1:1, 1:2, 1:3 tagged
configure vlan engineering ipaddress 10.1.1.1/24
create vlan voice tag 200
configure vlan voice add ports 2:1 untagged
enable ipforwarding
configure iproute add default 10.1.1.254
enable sharing 1:1 grouping 1:1, 1:2 algorithm address-based lacp
create account admin netops
configure ports 1:10 display-string uplink
disable ports 1:24`;

/** Map a note kind to the shared panel styling. */
function notePanelClass(kind: ExosNote["kind"]): string {
  if (kind === "warn") return "jwt-panel dig-warnings";
  return "jwt-panel";
}

/** One aggregated VLAN card. */
function VlanCard({ v }: { v: ExosVlan }) {
  return (
    <article className="tmsh-object exos-vlan">
      <header className="tmsh-object-head">
        <span className="tmsh-object-name mono">{v.name}</span>
        {v.tag && <span className="tmsh-type-badge mono">tag {v.tag}</span>}
      </header>
      <ul className="exos-vlan-facts">
        {v.taggedPorts.length > 0 && (
          <li><span className="exos-fact-k">tagged ports</span> <span className="mono">{v.taggedPorts.join(", ")}</span></li>
        )}
        {v.untaggedPorts.length > 0 && (
          <li><span className="exos-fact-k">untagged ports</span> <span className="mono">{v.untaggedPorts.join(", ")}</span></li>
        )}
        {v.ipAddresses.length > 0 && (
          <li><span className="exos-fact-k">IP (routed)</span> <span className="mono">{v.ipAddresses.join(", ")}</span></li>
        )}
      </ul>
    </article>
  );
}

export default function ExosConfigExplainerTool() {
  const t = useTranslations("tools.exos-config-explainer");
  const [input, setInput] = useState("");

  const live: LiveResult = useMemo(() => {
    try {
      return { ok: true, value: run(input).result };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  }, [input]);

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool exos-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="exos-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="exos-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("inputPlaceholder")}
          spellCheck={false}
          rows={12}
          aria-describedby="exos-privacy"
        />
        <p id="exos-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
        </p>
      </div>

      {!live.ok && (
        <p className="cidr-error" role="alert">{live.message}</p>
      )}

      {live.ok && (
        <div className="jwt-results exos-results">
          {/* Findings / notes. */}
          {live.value.notes.length > 0 && (
            <div className={notePanelClass(live.value.notes.some((n) => n.kind === "warn") ? "warn" : live.value.notes[0].kind)}>
              <div className="jwt-panel-title">{t("findingsTitle")}</div>
              <ul className="dig-warning-list">
                {live.value.notes.map((n, i) => (
                  <li key={i} className={`exos-note exos-note-${n.kind}`}>{n.text}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Reference (empty input): verb glossary. */}
          {live.value.mode === "reference" && live.value.reference && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("verbsTitle")}</div>
              <p className="gdf-step-behavior exos-ref-note">{live.value.reference.note}</p>
              <ul className="exos-vlan-facts">
                {live.value.reference.verbs.map((v) => (
                  <li key={v.verb}>
                    <span className="mono exos-fact-k">{v.verb}</span> <span className="gdf-step-behavior">{v.explain}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Aggregated VLAN summary. */}
          {live.value.vlans.length > 0 && (
            <>
              <div className="jwt-panel">
                <div className="jwt-panel-title">{t("vlansTitle")}</div>
              </div>
              {live.value.vlans.map((v, i) => (
                <VlanCard v={v} key={i} />
              ))}
            </>
          )}

          {/* Per-command explanations, grouped by category. */}
          {live.value.mode === "parse" && live.value.groups.map((g) => (
            <div className="jwt-panel exos-group" key={g.category}>
              <div className="jwt-panel-title">{g.label}</div>
              <ul className="exos-cmd-list">
                {live.value.lines
                  .filter((l) => l.category === g.category)
                  .map((l, i) => (
                    <li key={i} className="exos-cmd">
                      <code className="exos-cmd-raw mono">{l.raw}</code>
                      <span className="gdf-step-behavior exos-cmd-explain">{l.summary}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
