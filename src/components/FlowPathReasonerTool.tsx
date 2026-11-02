"use client";

// ============================================================================
// src/components/FlowPathReasonerTool.tsx
// ----------------------------------------------------------------------------
// FLOW PATH REASONER - client component (fieldcraft tool 11, wave A-2).
// The hop map renders through the shared LineageDiagram (one stage per hop,
// transforms and TLS boundaries as wrapped notes) - the same component the
// vendor genealogy pages use, so the path map inherits its typography and
// yesterday's wrapping fixes with zero new CSS. Free text flows ONLY into
// the export. D-83 Example loads the "federated-app-proxy" snapshot vector
// input VERBATIM; results render only after the form is touched.
//
// PAGE LANGUAGE (02/11/2026): the reading comes from runLocalisable() (every
// sentence an EngineText) and is turned into the page's language once, by
// inPageLanguage(); the hop map, the side-flows, the domains, the checklist,
// the Why panel and the exported map then read in Portuguese on the pt-BR page
// and exactly as before in English (the notes stay as typed). The two TLS
// markers on the hop map are message keys (hop.*). The engine is imported from
// compute directly (not the index, which also pulls the manifest and the
// vectors into the page).
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  runLocalisable,
  artifactToMarkdown,
  RULE_COUNT,
  type FprInput,
} from "@/lib/tools/flow-path-reasoner/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import { SignalBadge } from "@/components/fieldcraft/FieldcraftShared";
import LineageDiagram, { type LineageStage } from "@/components/LineageDiagram";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // a shared link fills the form as typing would
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is given
import { FLOW_PATH_SHARE, checkFlowPathNotes, encodeFlowPathShare, type FlowPathShareState } from "@/lib/tools/flow-path-reasoner/share"; // this tool's share spec: the form and the notes, checked

/** Share results with nothing to share: the button is disabled (the result is not shown yet). */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // module constant

const BLANK: FprInput = {
  archetype: "direct",
  resolution: "public-dns",
  intermediaries: "none",
  transformation: "none",
  tls: "end-to-end",
  auth: "none",
  returnPath: "known-symmetric",
  preset: "generic",
};

// D-83 Example = the "federated-app-proxy" snapshot vector input, verbatim.
const EXAMPLE: FprInput = {
  archetype: "identity-federated",
  resolution: "public-dns",
  intermediaries: "proxy-waf",
  transformation: "proxy-source",
  tls: "terminate-once",
  auth: "redirect-idp",
  returnPath: "known-symmetric",
  preset: "generic",
};

const OPTIONS = {
  archetype: ["direct", "internet-published", "load-balancer", "proxy-waf", "site-to-site-vpn", "outbound-sse", "identity-federated", "east-west", "unknown-mixed"],
  resolution: ["public-dns", "private-dns", "split-horizon", "hosts-static", "service-discovery", "multiple", "unknown"],
  intermediaries: ["none", "firewall", "load-balancer", "proxy-waf", "vpn", "sse-casb", "multiple", "unknown"],
  transformation: ["none", "dnat", "snat", "both", "proxy-source", "multiple", "unknown"],
  tls: ["end-to-end", "terminate-once", "terminate-reencrypt", "multiple-terminations", "plaintext", "unknown"],
  auth: ["none", "local", "redirect-idp", "agent-connector", "multiple", "unknown"],
  returnPath: ["known-symmetric", "known-asymmetric", "policy-routed", "multiple-exits", "unknown"],
  preset: ["generic", "load-balancer", "dns", "tls-pki", "firewall"],
} as const;

type FieldKey = keyof typeof OPTIONS;

export default function FlowPathReasonerTool() {
  const t = useTranslations("tools.flow-path-reasoner");
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences in the page's language (02/11/2026)
  const [input, setInput] = useState<FprInput>(BLANK);
  const [notes, setNotes] = useState({ nodeLabels: "", title: "", notes: "" });
  const [touched, setTouched] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const n = {
      ...(notes.nodeLabels.trim() ? { nodeLabels: notes.nodeLabels.trim() } : {}),
      ...(notes.title.trim() ? { title: notes.title.trim() } : {}),
      ...(notes.notes.trim() ? { notes: notes.notes.trim() } : {}),
    };
    return inPageLanguage(runLocalisable({ ...input, notes: Object.keys(n).length ? n : undefined }), tx); // the reading, in the page's language
  }, [input, notes, tx]);

  // Share results (2026-11-01): the form and the notes as one state; the notes check runs once per change and feeds
  // the button, the caution line and the blocked message; there is something to share only while the map is shown.
  const shareState = useMemo<FlowPathShareState>(() => ({ input, notes }), [input, notes]); // what a link carries
  const shareCheck = useMemo(() => checkFlowPathNotes(shareState), [shareState]); // credentials and secret-looking names in the notes
  const share = useMemo<ShareEncoding>(() => (touched ? encodeFlowPathShare(shareState, shareCheck) : NOTHING), [touched, shareState, shareCheck]); // the button's encoding
  const shareMaybe = shareCheck.maybe[0] ?? null; // the first secret-looking value, for the caution line
  // A note's link name to the label the form shows for it (the popover names the note it found something in).
  const NOTE_LABEL: Record<string, string> = { title: "notes.title", nodelabels: "notes.nodeLabels", notes: "notes.free" }; // link name -> message key
  const noteLabel = (field: string): string => (NOTE_LABEL[field] ? t(NOTE_LABEL[field]) : field); // the form's own words
  // A shared link sets the choices and the notes as typing would; the checklist ticks start empty and the map computes.
  useShareArrival(FLOW_PATH_SHARE, (s) => { setInput({ ...s.input }); setNotes({ ...s.notes }); setChecked(new Set()); setTouched(true); });

  const set = (k: FieldKey, v: string) => {
    setInput((p) => ({ ...p, [k]: v }) as FprInput);
    setTouched(true);
  };

  // The hop map as LineageDiagram stages: one stage per chain node; the
  // node's note carries its transform + TLS markers (wrapped by the shared
  // component). Side-flow nodes (resolver, IdP) are rendered separately.
  const hopStages: LineageStage[] = useMemo(() => {
    const chain = result.nodes.filter((n) => !["resolver", "idp"].includes(n.kind));
    return chain.map((n) => {
      const marks: string[] = [...n.transforms];
      if (n.tlsBoundary === "terminates") marks.push(t("hop.tlsEnds")); // "TLS ends here", in the page's language (02/11/2026)
      if (n.tlsBoundary === "terminates-and-reoriginates") marks.push(t("hop.tlsRestarts")); // "TLS ends & re-starts"
      return {
        nodes: [{ label: n.label, note: marks.length ? marks.join(" · ") : undefined, tone: n.kind === "unknown" ? ("muted" as const) : ("default" as const) }],
      };
    });
  }, [result, t]);

  const exportMarkdown = () => artifactToMarkdown({ ...result.artifact, generated: new Date().toISOString().slice(0, 10) }, tx); // the Generated line in the page's language too

  const copyMd = async () => {
    try {
      await navigator.clipboard.writeText(exportMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable: the download path remains */
    }
  };

  const downloadMd = () => {
    const blob = new Blob([exportMarkdown()], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "flow-path-map.md";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const selectField = (key: FieldKey) => (
    <div className="fc-field" key={key}>
      <label className="cidr-label" htmlFor={`fpr-${key}`}>
        {t(`form.${key}`)}
      </label>
      <select id={`fpr-${key}`} className="cidr-input" value={input[key]} onChange={(e) => set(key, e.target.value)}>
        {OPTIONS[key].map((o) => (
          <option key={o} value={o}>
            {t(`options.${key}.${o}`)}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="cidr-tool jwt-tool">
      <div className="dig-input-head">
        <span className="cidr-label">{t("form.heading")}</span>
        <div className="dig-input-actions">
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setInput(EXAMPLE);
              setNotes({ nodeLabels: "", title: "", notes: "" });
              setChecked(new Set());
              setTouched(true);
            }}
          >
            {t("example")}
          </button>
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setInput(BLANK);
              setNotes({ nodeLabels: "", title: "", notes: "" });
              setChecked(new Set());
              setTouched(false);
            }}
          >
            {t("clear")}
          </button>
        </div>
      </div>

      <p className="cipher-note">{t("intro", { rules: RULE_COUNT })}</p>

      <div className="fc-form-grid">{(Object.keys(OPTIONS) as FieldKey[]).map((k) => selectField(k))}</div>

      <details className="fc-notes">
        <summary className="cipher-note">{t("notes.summary")}</summary>
        <p className="cipher-note">{t("notes.hint")}</p>
        <div className="fc-form-grid">
          <div className="fc-field">
            <label className="cidr-label" htmlFor="fpr-title">{t("notes.title")}</label>
            <input id="fpr-title" className="cidr-input" value={notes.title} onChange={(e) => setNotes((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="fc-field">
            <label className="cidr-label" htmlFor="fpr-labels">{t("notes.nodeLabels")}</label>
            <input id="fpr-labels" className="cidr-input" value={notes.nodeLabels} onChange={(e) => setNotes((p) => ({ ...p, nodeLabels: e.target.value }))} placeholder={t("notes.nodeLabelsPh")} />
          </div>
          <div className="fc-field">
            <label className="cidr-label" htmlFor="fpr-notes">{t("notes.free")}</label>
            <input id="fpr-notes" className="cidr-input" value={notes.notes} onChange={(e) => setNotes((p) => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
      </details>

      {touched && (
        <>
          <section className="fc-check-group">
            <h3 className="fc-subhead">{t("results.map")}</h3>
            <LineageDiagram title={t("results.mapTitle")} desc={t("results.mapDesc")} stages={hopStages} />
            <p className="cipher-note">{t("results.mapModel")}</p>
          </section>

          {/* Share results (2026-11-01): under the hop map (the answer), before the unknowns, side flows and domains. The caution and a note's secret-looking value show only beside a link;
              a note holding a credential gives no link, naming the note. */}
          <div className="rdap-ask-row">
            <ShareResultsButton
              encoding={share}
              carries={t("share.carries")}
              details={[t("share.caution"), ...(shareMaybe ? [t("share.maybeSecret", { field: noteLabel(shareMaybe.field), label: shareMaybe.label })] : [])]}
              blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blockedSecret", { field: noteLabel(String(share.values?.field ?? "")), label: String(share.values?.label ?? "") }) : ""}
              title={t("name")}
            />
          </div>

          {result.unknowns.length > 0 && (
            <section className="fc-check-group">
              <h3 className="fc-subhead">{t("results.unknowns")}</h3>
              <ul className="fc-why-rules">
                {result.unknowns.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </section>
          )}

          {result.warnings.map((w) => (
            <p key={w.id} className="fc-warning" role="note">
              <strong className="mono">{w.id}</strong> {w.message}
            </p>
          ))}

          {result.sideFlows.length > 0 && (
            <section className="fc-check-group">
              <h3 className="fc-subhead">{t("results.sideFlows")}</h3>
              {result.sideFlows.map((sf) => (
                <div key={sf.id} className="fc-why-block">
                  <p className="fc-subhead">{sf.title}</p>
                  <p className="cipher-note">{sf.note}</p>
                </div>
              ))}
            </section>
          )}

          {result.tlsSegments.length > 0 && (
            <section className="fc-check-group">
              <h3 className="fc-subhead">{t("results.tls")}</h3>
              <ul className="fc-why-rules">
                {result.tlsSegments.map((s) => (
                  <li key={s.id}>
                    <code className="mono">{s.id}</code> {s.fromNode} → {s.toNode}: {s.note}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.transforms.length > 0 && (
            <section className="fc-check-group">
              <h3 className="fc-subhead">{t("results.transforms")}</h3>
              <ul className="fc-why-rules">
                {result.transforms.map((tr, i) => (
                  <li key={i}>
                    <code className="mono">{tr.kind.toUpperCase()}</code> @ {tr.nodeId}: {tr.effect}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="fc-check-group">
            <h3 className="fc-subhead">{t("results.domains")}</h3>
            {result.domains.map((d) => (
              <div key={d.id} className="fc-why-block">
                <p className="fc-subhead mono">
                  {d.id} <SignalBadge signal={d.signal} label={t(`signal.${d.signal}`)} /> · {d.score}
                </p>
                <p className="cipher-note">{d.candidate}</p>
                <p className="cipher-note">
                  <strong>{t("results.supports")}:</strong> {d.supports}
                </p>
                <p className="cipher-note">
                  <strong>{t("results.weakens")}:</strong> {d.weakens}
                </p>
              </div>
            ))}
          </section>

          {result.evidencePoints.length > 0 && (
            <section className="fc-check-group">
              <h3 className="fc-subhead">{t("results.evidence")}</h3>
              <ul className="fc-why-rules">
                {result.evidencePoints.map((e) => (
                  <li key={e.nodeId}>{e.note}</li>
                ))}
              </ul>
            </section>
          )}

          {result.checklist.length > 0 && (
            <section className="fc-check-group">
              <h3 className="fc-subhead">{t("results.checklist")}</h3>
              <ul className="fc-why-rules">
                {result.checklist.map((c) => (
                  <li key={c.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={checked.has(c.id)}
                        onChange={(e) => {
                          const next = new Set(checked);
                          if (e.target.checked) next.add(c.id);
                          else next.delete(c.id);
                          setChecked(next);
                        }}
                      />{" "}
                      {c.text}
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <details className="fc-why">
            <summary className="cipher-note">{t("results.whyHeading")}</summary>
            <p className="cipher-note">{t("results.whyIntro")}</p>
            <ul className="fc-why-rules">
              {result.firedRules.map((r) => (
                <li key={r.id}>
                  <code className="mono">{r.id}</code>: {r.reason}
                </li>
              ))}
            </ul>
          </details>

          <div className="fc-export-row">
            <button type="button" className="b64-copy" onClick={copyMd}>
              {copied ? t("results.copied") : t("results.copyMd")}
            </button>
            <button type="button" className="b64-copy" onClick={downloadMd}>
              {t("results.downloadMd")}
            </button>
          </div>
          <p className="cipher-note">{t("results.privacy")}</p>
        </>
      )}
    </div>
  );
}
