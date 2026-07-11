"use client";

// ============================================================================
// src/components/BigipLtmLbSimulatorTool.tsx
// ----------------------------------------------------------------------------
// UI for the BIG-IP LTM load balancing simulator. Configure pool members
// (ratio, node + node ratio, priority group, persistence records), pick a
// method and a request count, and see where the next N connections land.
// Dynamic (metric-driven) methods show an explanation instead of a fake
// distribution. Reuses cidr-/jwt- vocabulary; inline styles for layout/bars.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { simulate, SIMULABLE_METHODS, DYNAMIC_METHODS, type Member, type Method } from "@/lib/tools/bigip-ltm-lb-simulator/compute";

interface Row {
  id: string;
  node: string;
  ratio: number;
  nodeRatio: number;
  priority: number;
  persistence: number;
}

const EXAMPLE: Row[] = [
  { id: "web-1", node: "10.0.0.1", ratio: 3, nodeRatio: 2, priority: 1, persistence: 40 },
  { id: "web-2", node: "10.0.0.2", ratio: 2, nodeRatio: 2, priority: 1, persistence: 10 },
  { id: "web-3", node: "10.0.0.3", ratio: 1, nodeRatio: 1, priority: 0, persistence: 0 },
];

const ALL_METHODS: Method[] = [...SIMULABLE_METHODS, ...DYNAMIC_METHODS];

export default function BigipLtmLbSimulatorTool() {
  const t = useTranslations("tools.bigip-ltm-lb-simulator");
  const [rows, setRows] = useState<Row[]>(EXAMPLE);
  const [method, setMethod] = useState<Method>("round-robin");
  const [threshold, setThreshold] = useState(0);
  const [requests, setRequests] = useState(100);

  const result = useMemo(() => {
    const members: Member[] = rows.map((r) => ({ id: r.id, node: r.node, ratio: r.ratio, nodeRatio: r.nodeRatio, priority: r.priority, persistence: r.persistence }));
    return simulate({ members, method, minActiveMembers: threshold, requests });
  }, [rows, method, threshold, requests]);

  const addRow = () => setRows([...rows, { id: `member-${rows.length + 1}`, node: `10.0.0.${rows.length + 1}`, ratio: 1, nodeRatio: 1, priority: 0, persistence: 0 }]);
  const removeRow = (i: number) => rows.length > 1 && setRows(rows.filter((_, j) => j !== i));
  const setField = (i: number, field: keyof Row, value: string) => {
    const num = field === "id" || field === "node" ? value : Math.max(field === "ratio" || field === "nodeRatio" ? 1 : 0, Math.floor(Number(value) || 0));
    setRows(rows.map((r, j) => (j === i ? { ...r, [field]: num } : r)));
  };

  const num = (i: number, field: keyof Row, min: number) => (
    <input className="cidr-input mono" style={{ width: "4.5rem" }} type="number" min={min} value={rows[i][field] as number} onChange={(e) => setField(i, field, e.target.value)} aria-label={t(`col.${field}`)} />
  );

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label">{t("membersLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => { setRows(EXAMPLE); setMethod("round-robin"); setThreshold(0); setRequests(100); }}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={addRow}>
              {t("addMember")}
            </button>
          </div>
        </div>

        {/* member rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
              <input className="cidr-input mono" style={{ width: "6rem" }} value={r.id} onChange={(e) => setField(i, "id", e.target.value)} aria-label={t("col.id")} placeholder={t("col.id")} />
              <input className="cidr-input mono" style={{ width: "8rem" }} value={r.node} onChange={(e) => setField(i, "node", e.target.value)} aria-label={t("col.node")} placeholder={t("col.node")} />
              <span className="jwt-claim-label">{t("col.ratio")}</span>
              {num(i, "ratio", 1)}
              <span className="jwt-claim-label">{t("col.nodeRatio")}</span>
              {num(i, "nodeRatio", 1)}
              <span className="jwt-claim-label">{t("col.priority")}</span>
              {num(i, "priority", 0)}
              <span className="jwt-claim-label">{t("col.persistence")}</span>
              {num(i, "persistence", 0)}
              {rows.length > 1 && (
                <button type="button" className="b64-copy" onClick={() => removeRow(i)} aria-label={t("removeMember")}>
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {/* controls */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", marginTop: "0.6rem" }}>
          <label className="jwt-claim-label" htmlFor="lb-method">
            {t("methodLabel")}
          </label>
          <select id="lb-method" className="cidr-input mono" style={{ width: "auto" }} value={method} onChange={(e) => setMethod(e.target.value as Method)}>
            {ALL_METHODS.map((mth) => (
              <option key={mth} value={mth}>
                {t(`method.${mth}`)}
              </option>
            ))}
          </select>
          <label className="jwt-claim-label" htmlFor="lb-threshold">
            {t("thresholdLabel")}
          </label>
          <input id="lb-threshold" className="cidr-input mono" style={{ width: "4.5rem" }} type="number" min={0} value={threshold} onChange={(e) => setThreshold(Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
          <label className="jwt-claim-label" htmlFor="lb-requests">
            {t("requestsLabel")}
          </label>
          <input id="lb-requests" className="cidr-input mono" style={{ width: "6rem" }} type="number" min={0} value={requests} onChange={(e) => setRequests(Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
        </div>

        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {result && !result.ok && (
        <p className="cidr-error" role="alert">
          {result.error}
        </p>
      )}

      {/* dynamic method: not simulable */}
      {result && result.ok && !result.simulable && result.reasonCode && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("notSimulableTitle")}</h4>
            <p className="cipher-note">{t(`reason.${result.reasonCode}`)}</p>
          </section>
        </div>
      )}

      {/* distribution */}
      {result && result.ok && result.simulable && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("resultTitle")}</h4>
            <p className="cipher-note">{t("summaryLine", { requests: result.requests, active: result.activeIds.length, standby: result.standbyIds.length })}</p>
            {result.distribution.map((d, i) => (
              <div key={i} className="jwt-claim-row" style={{ alignItems: "center" }}>
                <span className="jwt-claim-label">
                  <span className="mono">{d.id}</span>{" "}
                  {!d.active && <span className="jwt-badge mono">{t("standbyBadge")}</span>}
                </span>
                <span className="jwt-claim-value" style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                  <span className="mono" style={{ minWidth: "5.5rem" }}>
                    {d.count} ({d.pct.toFixed(1)}%)
                  </span>
                  <span style={{ flex: 1, height: "0.5rem", background: "var(--surface-2, rgba(148,163,184,0.15))", borderRadius: "3px", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${d.pct}%`, background: d.active ? "var(--accent)" : "var(--surface-3, rgba(148,163,184,0.4))" }} />
                  </span>
                </span>
              </div>
            ))}
            {result.notes.map((code, i) => (
              <p className="cipher-note" key={i}>
                {t(`note.${code}`)}
              </p>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
