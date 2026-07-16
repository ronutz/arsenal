"use client";

// ============================================================================
// src/components/PacketCapturePlanBuilderTool.tsx
// ----------------------------------------------------------------------------
// PACKET CAPTURE PLAN BUILDER - client component (fieldcraft tool 6, wave A).
// Quick mode is the whole mode: eight selects, live plan on every change.
// Free text (labels/reference/notes) flows ONLY into the export artifact,
// never into rule matching - the engine enforces it; the UI mirrors it by
// keeping notes in a collapsed details block. D-83 Example loads the
// "lb-timeout-classic" snapshot vector input VERBATIM; Clear returns to the
// neutral default. Results render only after the user touches the form - a
// default plan appearing unprompted would read as advice nobody asked for.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  artifactToMarkdown,
  RULE_COUNT,
  type PcpbInput,
} from "@/lib/tools/packet-capture-plan-builder";
import { SignalBadge } from "@/components/fieldcraft/FieldcraftShared";

// Neutral default (Clear) and the D-83 Example (= lb-timeout-classic vector).
const BLANK: PcpbInput = {
  archetype: "direct",
  symptom: "timeout",
  trafficClass: "tcp",
  intermediaries: "none",
  transformation: "none",
  access: "both-endpoints",
  timeBehavior: "constant",
  preset: "generic",
};

const EXAMPLE: PcpbInput = {
  archetype: "load-balancer",
  symptom: "timeout",
  trafficClass: "tcp",
  intermediaries: "none",
  transformation: "none",
  access: "both-endpoints",
  timeBehavior: "constant",
  preset: "load-balancer",
};

const OPTIONS = {
  archetype: ["direct", "load-balancer", "firewall-nat", "proxy-waf", "site-to-site-vpn", "outbound-sse", "east-west", "unknown-mixed"],
  symptom: ["timeout", "reset", "tls-failure", "http-error", "packet-loss", "intermittent-latency", "one-way", "connect-failure"],
  trafficClass: ["tcp", "udp", "icmp", "dns", "tls", "http", "mixed"],
  intermediaries: ["none", "firewall", "nat-snat", "load-balancer", "proxy-waf", "vpn-gateway", "multiple", "unknown"],
  transformation: ["none", "address-translation", "tls-termination", "protocol-proxying", "auth-redirect", "multiple", "unknown"],
  access: ["client-only", "server-only", "one-intermediary", "both-endpoints", "endpoint-plus-intermediary", "multiple-points", "unknown"],
  timeBehavior: ["constant", "intermittent", "change-related", "load-related", "client-specific", "location-specific", "unknown"],
  preset: ["generic", "load-balancer", "dns", "tls-pki", "firewall"],
} as const;

type FieldKey = keyof typeof OPTIONS;

export default function PacketCapturePlanBuilderTool() {
  const t = useTranslations("tools.packet-capture-plan-builder");
  const [input, setInput] = useState<PcpbInput>(BLANK);
  const [notes, setNotes] = useState({ labels: "", reference: "", notes: "" });
  const [touched, setTouched] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const n = {
      ...(notes.labels.trim() ? { labels: notes.labels.trim() } : {}),
      ...(notes.reference.trim() ? { reference: notes.reference.trim() } : {}),
      ...(notes.notes.trim() ? { notes: notes.notes.trim() } : {}),
    };
    return run({ ...input, notes: Object.keys(n).length ? n : undefined });
  }, [input, notes]);

  const set = (k: FieldKey, v: string) => {
    setInput((p) => ({ ...p, [k]: v }) as PcpbInput);
    setTouched(true);
  };

  const exportMarkdown = () => artifactToMarkdown({ ...result.artifact, generated: new Date().toISOString().slice(0, 10) });

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
    a.download = "packet-capture-plan.md";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const selectField = (key: FieldKey) => (
    <div className="fc-field" key={key}>
      <label className="cidr-label" htmlFor={`pcpb-${key}`}>
        {t(`form.${key}`)}
      </label>
      <select id={`pcpb-${key}`} className="cidr-input" value={input[key]} onChange={(e) => set(key, e.target.value)}>
        {OPTIONS[key].map((o) => (
          <option key={o} value={o}>
            {t(`options.${key}.${o}`)}
          </option>
        ))}
      </select>
    </div>
  );

  const pointName = (id: string) => {
    const p = result.points.find((x) => x.id === id);
    return p ? `${p.id} - ${p.where}` : id;
  };

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
              setNotes({ labels: "", reference: "", notes: "" });
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
              setNotes({ labels: "", reference: "", notes: "" });
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
            <label className="cidr-label" htmlFor="pcpb-labels">{t("notes.labels")}</label>
            <input id="pcpb-labels" className="cidr-input" value={notes.labels} onChange={(e) => setNotes((p) => ({ ...p, labels: e.target.value }))} placeholder={t("notes.labelsPh")} />
          </div>
          <div className="fc-field">
            <label className="cidr-label" htmlFor="pcpb-reference">{t("notes.reference")}</label>
            <input id="pcpb-reference" className="cidr-input" value={notes.reference} onChange={(e) => setNotes((p) => ({ ...p, reference: e.target.value }))} placeholder={t("notes.referencePh")} />
          </div>
          <div className="fc-field">
            <label className="cidr-label" htmlFor="pcpb-freenotes">{t("notes.free")}</label>
            <input id="pcpb-freenotes" className="cidr-input" value={notes.notes} onChange={(e) => setNotes((p) => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
      </details>

      {!touched && <p className="cipher-note">{t("emptyState")}</p>}

      {touched && (
        <>
          {result.warnings.map((w) => (
            <p key={w.id} className="fc-warning" role="note">
              <strong className="mono">{w.id}</strong> {w.message}
            </p>
          ))}

          {result.phases.map((ph) => (
            <section key={ph.id} className="fc-check-group">
              <h3 className="fc-subhead">{t(`results.${ph.id}`)}</h3>
              {ph.pointIds.length === 0 ? (
                <p className="cipher-note">{t("results.phaseEmpty")}</p>
              ) : (
                <ul className="fc-why-rules">
                  {ph.pointIds.map((id) => (
                    <li key={id}>
                      <code className="mono">{pointName(id)}</code>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section className="fc-check-group">
            <h3 className="fc-subhead">{t("results.points")}</h3>
            {result.points.map((p) => (
              <div key={p.id} className="fc-why-block">
                <p className="fc-subhead mono">
                  {p.id} <SignalBadge signal={p.signal} label={t(`signal.${p.signal}`)} /> · {p.score}
                </p>
                <p className="cipher-note">{p.where}</p>
                <p className="cipher-note mono">{t("results.filter")}: <code className="mono">{p.filterHint}</code></p>
                {p.expects.length > 0 && (
                  <ul className="fc-why-rules">
                    {p.expects.map((e, i) => (
                      <li key={i}>
                        <strong>{e.observe}</strong> — {e.means}
                      </li>
                    ))}
                  </ul>
                )}
                {p.presetNote && <p className="cipher-note">{p.presetNote}</p>}
              </div>
            ))}
          </section>

          {result.matrix.length > 0 && (
            <section className="fc-check-group">
              <h3 className="fc-subhead">{t("results.matrix")}</h3>
              {result.matrix.map((m) => (
                <div key={m.id} className="fc-why-block">
                  <p className="fc-subhead">{m.candidate}</p>
                  <p className="cipher-note">
                    <strong>{t("results.supports")}:</strong> {m.supports}
                  </p>
                  <p className="cipher-note">
                    <strong>{t("results.weakens")}:</strong> {m.weakens}
                  </p>
                </div>
              ))}
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
                  <code className="mono">{r.id}</code> — {r.reason}
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
