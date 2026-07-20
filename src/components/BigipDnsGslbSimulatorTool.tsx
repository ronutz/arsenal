// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

"use client";
// ============================================================================
// BigipDnsGslbSimulatorTool — UI for the BIG-IP DNS (GTM) GSLB simulator.
// Two-tier: configure wide-IP pools (each with a ratio, region, up/down, a
// member-selection method, and virtual-server members), pick the wide-IP pool
// method + client region + request count, and see how the next N DNS requests
// resolve - pool by pool, then member by member. Dynamic (metric-driven)
// methods show an explanation instead of a fabricated distribution.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { simulate, SIMULABLE_METHODS, DYNAMIC_METHODS, type GslbInput, type GslbMethod } from "@/lib/tools/bigip-dns-gslb-simulator/compute";

interface MemberRow { id: string; ratio: number; region: string; up: boolean }
interface PoolRow { id: string; ratio: number; region: string; up: boolean; method: GslbMethod; members: MemberRow[] }

const ALL_METHODS: GslbMethod[] = [...SIMULABLE_METHODS, ...DYNAMIC_METHODS];

const EXAMPLE: { poolMethod: GslbMethod; clientRegion: string; requests: number; pools: PoolRow[] } = {
  poolMethod: "topology",
  clientRegion: "eu",
  requests: 100,
  pools: [
    { id: "pool-americas", ratio: 2, region: "na", up: true, method: "round-robin", members: [
      { id: "vs-sfo", ratio: 1, region: "na", up: true },
      { id: "vs-nyc", ratio: 1, region: "na", up: true },
    ] },
    { id: "pool-emea", ratio: 1, region: "eu", up: true, method: "ratio", members: [
      { id: "vs-lon", ratio: 3, region: "eu", up: true },
      { id: "vs-fra", ratio: 1, region: "eu", up: true },
    ] },
  ],
};

const blankMember = (i: number): MemberRow => ({ id: `vs-${i}`, ratio: 1, region: "", up: true });
const blankPool = (i: number): PoolRow => ({ id: `pool-${i}`, ratio: 1, region: "", up: true, method: "round-robin", members: [blankMember(1)] });

export default function BigipDnsGslbSimulatorTool() {
  const t = useTranslations("tools.bigip-dns-gslb-simulator");
  const [poolMethod, setPoolMethod] = useState<GslbMethod>(EXAMPLE.poolMethod);
  const [clientRegion, setClientRegion] = useState(EXAMPLE.clientRegion);
  const [requests, setRequests] = useState(EXAMPLE.requests);
  const [pools, setPools] = useState<PoolRow[]>(EXAMPLE.pools);

  const result = useMemo(() => {
    const input: GslbInput = { poolMethod, clientRegion, requests, pools };
    return simulate(input);
  }, [poolMethod, clientRegion, requests, pools]);

  // --- pool + member mutators ---
  const addPool = () => setPools([...pools, blankPool(pools.length + 1)]);
  const removePool = (pi: number) => pools.length > 1 && setPools(pools.filter((_, j) => j !== pi));
  const setPoolField = (pi: number, field: keyof PoolRow, value: string | boolean) => {
    setPools(pools.map((p, j) => {
      if (j !== pi) return p;
      if (field === "ratio") return { ...p, ratio: Math.max(1, Math.floor(Number(value) || 1)) };
      if (field === "up") return { ...p, up: Boolean(value) };
      if (field === "method") return { ...p, method: value as GslbMethod };
      return { ...p, [field]: value };
    }));
  };
  const addMember = (pi: number) => setPools(pools.map((p, j) => j === pi ? { ...p, members: [...p.members, blankMember(p.members.length + 1)] } : p));
  const removeMember = (pi: number, mi: number) => setPools(pools.map((p, j) => j === pi ? { ...p, members: p.members.length > 1 ? p.members.filter((_, k) => k !== mi) : p.members } : p));
  const setMemberField = (pi: number, mi: number, field: keyof MemberRow, value: string | boolean) => {
    setPools(pools.map((p, j) => {
      if (j !== pi) return p;
      const members = p.members.map((m, k) => {
        if (k !== mi) return m;
        if (field === "ratio") return { ...m, ratio: Math.max(1, Math.floor(Number(value) || 1)) };
        if (field === "up") return { ...m, up: Boolean(value) };
        return { ...m, [field]: value };
      });
      return { ...p, members };
    }));
  };

  const clearAll = () => { setPoolMethod("round-robin"); setClientRegion(""); setRequests(100); setPools([blankPool(1)]); };
  const loadExample = () => { setPoolMethod(EXAMPLE.poolMethod); setClientRegion(EXAMPLE.clientRegion); setRequests(EXAMPLE.requests); setPools(EXAMPLE.pools); };

  const methodLabel = (m: GslbMethod) => t(`method.${m}`);

  return (
    <div className="cidr-tool jwt-tool">
      {/* --- Wide-IP controls --- */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label">{t("wideIpLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={loadExample}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={clearAll}>{t("clear")}</button>
            <button type="button" className="b64-copy" onClick={addPool}>{t("addPool")}</button>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", alignItems: "center", marginBottom: "0.6rem" }}>
          <label className="cidr-label" style={{ margin: 0 }}>{t("poolMethodLabel")}</label>
          <select className="cidr-input mono" style={{ width: "auto" }} value={poolMethod} onChange={(e) => setPoolMethod(e.target.value as GslbMethod)}>
            {ALL_METHODS.map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}
          </select>
          <label className="cidr-label" style={{ margin: 0 }}>{t("clientRegionLabel")}</label>
          <input className="cidr-input mono" style={{ width: "6rem" }} value={clientRegion} onChange={(e) => setClientRegion(e.target.value)} placeholder="eu" aria-label={t("clientRegionLabel")} />
          <label className="cidr-label" style={{ margin: 0 }}>{t("requestsLabel")}</label>
          <input className="cidr-input mono" style={{ width: "5rem" }} type="number" min={0} value={requests} onChange={(e) => setRequests(Math.max(0, Math.floor(Number(e.target.value) || 0)))} aria-label={t("requestsLabel")} />
        </div>

        {/* --- Pools, each with members --- */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {pools.map((p, pi) => (
            <div key={pi} className="cidr-table" style={{ border: "1px solid var(--border-subtle, #1e293b)", borderRadius: "8px", padding: "0.7rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                <span className="mono" style={{ color: "var(--accent)" }}>{t("poolWord")}</span>
                <input className="cidr-input mono" style={{ width: "9rem" }} value={p.id} onChange={(e) => setPoolField(pi, "id", e.target.value)} aria-label={t("poolIdCol")} />
                <label className="cidr-label" style={{ margin: 0 }}>{t("ratioCol")}</label>
                <input className="cidr-input mono" style={{ width: "3.5rem" }} type="number" min={1} value={p.ratio} onChange={(e) => setPoolField(pi, "ratio", e.target.value)} aria-label={t("ratioCol")} />
                <label className="cidr-label" style={{ margin: 0 }}>{t("regionCol")}</label>
                <input className="cidr-input mono" style={{ width: "5rem" }} value={p.region} onChange={(e) => setPoolField(pi, "region", e.target.value)} placeholder="na" aria-label={t("regionCol")} />
                <label className="cidr-label" style={{ margin: 0 }}>{t("memberMethodLabel")}</label>
                <select className="cidr-input mono" style={{ width: "auto" }} value={p.method} onChange={(e) => setPoolField(pi, "method", e.target.value)}>
                  {ALL_METHODS.map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}
                </select>
                <label className="cidr-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <input type="checkbox" checked={p.up} onChange={(e) => setPoolField(pi, "up", e.target.checked)} /> {t("upCol")}
                </label>
                <button type="button" className="b64-copy" onClick={() => addMember(pi)}>{t("addMember")}</button>
                {pools.length > 1 && <button type="button" className="b64-copy" onClick={() => removePool(pi)}>{t("removePool")}</button>}
              </div>

              {/* member rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", paddingLeft: "1rem" }}>
                {p.members.map((m, mi) => (
                  <div key={mi} style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
                    <span className="mono" style={{ opacity: 0.6 }}>{t("memberWord")}</span>
                    <input className="cidr-input mono" style={{ width: "8rem" }} value={m.id} onChange={(e) => setMemberField(pi, mi, "id", e.target.value)} aria-label={t("memberIdCol")} />
                    <label className="cidr-label" style={{ margin: 0 }}>{t("ratioCol")}</label>
                    <input className="cidr-input mono" style={{ width: "3.5rem" }} type="number" min={1} value={m.ratio} onChange={(e) => setMemberField(pi, mi, "ratio", e.target.value)} aria-label={t("ratioCol")} />
                    <label className="cidr-label" style={{ margin: 0 }}>{t("regionCol")}</label>
                    <input className="cidr-input mono" style={{ width: "5rem" }} value={m.region} onChange={(e) => setMemberField(pi, mi, "region", e.target.value)} placeholder="na" aria-label={t("regionCol")} />
                    <label className="cidr-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <input type="checkbox" checked={m.up} onChange={(e) => setMemberField(pi, mi, "up", e.target.checked)} /> {t("upCol")}
                    </label>
                    {p.members.length > 1 && <button type="button" className="b64-copy" onClick={() => removeMember(pi, mi)}>{t("removeMember")}</button>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">●</span>
          {t("runsLocally")}
        </p>
      </div>

      {/* --- Errors --- */}
      {result && !result.ok && result.error && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{result.error}</p>
        </div>
      )}

      {/* --- Dynamic wide-IP method: not simulable --- */}
      {result && result.ok && !result.simulable && result.reasonCode && (
        <div className="tmsh-results">
          <section>
            <h3 className="cidr-h">{t("notSimulableTitle")}</h3>
            <p className="cidr-note">{t(`reason.${result.reasonCode}`)}</p>
            <p className="cidr-note">{t("notSimulableGeneric")}</p>
          </section>
        </div>
      )}

      {/* --- Simulable result: pool tier then member tier --- */}
      {result && result.ok && result.simulable && (
        <div className="tmsh-results">
          <section>
            <h3 className="cidr-h">{t("poolTierTitle")}</h3>
            <table className="cidr-table">
              <thead><tr><th>{t("poolIdCol")}</th><th>{t("upCol")}</th><th>{t("countCol")}</th><th>{t("pctCol")}</th></tr></thead>
              <tbody>
                {result.poolDistribution.map((p) => (
                  <tr key={p.poolId}>
                    <td className="mono">{p.poolId}</td>
                    <td>{p.up ? t("upYes") : t("upNo")}</td>
                    <td className="mono">{p.count}</td>
                    <td className="mono">{p.pct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="cidr-h">{t("memberTierTitle")}</h3>
            <table className="cidr-table">
              <thead><tr><th>{t("poolIdCol")}</th><th>{t("memberIdCol")}</th><th>{t("regionCol")}</th><th>{t("upCol")}</th><th>{t("countCol")}</th><th>{t("pctCol")}</th></tr></thead>
              <tbody>
                {result.memberDistribution.map((m) => (
                  <tr key={`${m.poolId}/${m.memberId}`}>
                    <td className="mono">{m.poolId}</td>
                    <td className="mono">{m.memberId}</td>
                    <td className="mono">{m.region || "-"}</td>
                    <td>{m.up ? t("upYes") : t("upNo")}</td>
                    <td className="mono">{m.count}</td>
                    <td className="mono">{m.pct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.poolDistribution.some((p) => !p.memberSimulable) && (
              <p className="cidr-note">{t("memberDynamicNote")}</p>
            )}
          </section>

          {result.notes.length > 0 && (
            <section>
              <h3 className="cidr-h">{t("notesTitle")}</h3>
              <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                {result.notes.map((nkey, i) => <li key={i} className="cidr-note">{t(`note.${nkey}`)}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
