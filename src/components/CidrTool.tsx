"use client";

// ============================================================================
// src/components/CidrTool.tsx
// ----------------------------------------------------------------------------
// THE CIDR / SUBNETTING TOOLKIT — four modes over one address-math core.
//
//   • Subnet   — single CIDR analysis via cidrAnalyze (arsenal-local, pure;
//                identical math to the engine it replaced, RFC 3021 for /31).
//   • VLSM     — variable-length subnets carved from a parent block.
//   • Supernet — summarize a prefix list into the minimal covering set.
//   • Overlap  — overlaps / containment between prefixes, gaps within a scope.
//
// PRIVACY/SECURITY (the architecture IS the control): every computation runs
// ENTIRELY IN THE BROWSER. No fetch, no API, no server — nothing to log, leak,
// or subpoena. All output is rendered as escaped text through React (no
// dangerouslySetInnerHTML), so even malformed input cannot inject markup.
//
// i18n: every visible string comes from the message pack via useTranslations.
// ============================================================================

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { cidrAnalyze } from "@/lib/tools/cidr";
// Arsenal-local extended compute (pure; structured so it could be lifted into an open library later).
import {
  allocateVlsm,
  aggregate,
  analyzeOverlapGap,
  parseCidrList,
  CidrInputError,
  type VlsmResult,
  type AggregateResult,
  type OverlapGapResult,
} from "@/lib/tools/cidr";
import { usePrefill } from "@/lib/use-prefill";

type Mode = "subnet" | "vlsm" | "supernet" | "overlap";
const MODES: Mode[] = ["subnet", "vlsm", "supernet", "overlap"];

/** The shape cidrAnalyze returns (single-subnet). */
interface SubnetResult {
  network: string;
  broadcast: string;
  netmask: string;
  wildcard: string;
  firstHost: string;
  lastHost: string;
  totalAddresses: number;
  usableHosts: number;
}

interface ReqRow {
  label: string;
  hosts: string;
}

// Error codes the extended compute throws that have their own localized hint.
const KNOWN_ERR = new Set(["ipv4", "octet", "format", "prefix", "tooMany"]);

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="cidr-stat">
      <span className="cidr-stat-label">{label}</span>
      <span className={"cidr-stat-value" + (mono ? " mono" : "")}>{value}</span>
    </div>
  );
}

// ---- address-bit helpers (pure) -------------------------------------------
/** Parse the prefix length from a CIDR string; null when absent or invalid. */
function parsePrefix(input: string): number | null {
  const m = input.trim().match(/\/(\d{1,2})\s*$/);
  if (!m) return null;
  const p = parseInt(m[1], 10);
  return p >= 0 && p <= 32 ? p : null;
}

/** The address portion of a CIDR string, before any slash. */
function parseIpPart(input: string): string {
  return input.trim().split("/")[0].trim();
}

/** A dotted netmask to its prefix length, or null when not a contiguous mask. */
function maskToPrefix(netmask: string): number | null {
  const octs = netmask.split(".");
  if (octs.length !== 4) return null;
  let bits = "";
  for (const o of octs) {
    if (!/^\d{1,3}$/.test(o)) return null;
    const n = Number(o);
    if (n > 255) return null;
    bits += n.toString(2).padStart(8, "0");
  }
  const m = bits.match(/^(1*)(0*)$/);
  return m ? m[1].length : null;
}

/** Dotted IPv4 to its four octet values, or null when malformed. */
function ipToOctets(ip: string): number[] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const out: number[] = [];
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    out.push(n);
  }
  return out;
}

/**
 * The 32-bit octet grid: each octet's eight bits with its decimal value, the
 * network bits (index below the prefix) highlighted apart from the host bits.
 */
function OctetBits({ octets, prefix }: { octets: number[]; prefix: number }) {
  return (
    <div className="cidr-bits-grid">
      {octets.map((oct, oi) => (
        <div className="cidr-bits-octet" key={oi}>
          <div className="cidr-bits-cells">
            {oct
              .toString(2)
              .padStart(8, "0")
              .split("")
              .map((b, bi) => {
                const globalBit = oi * 8 + bi;
                const isNetwork = globalBit < prefix;
                const boundary = globalBit === prefix - 1 && prefix > 0 && prefix < 32;
                return (
                  <span
                    key={bi}
                    className={
                      "cidr-bit " +
                      (isNetwork ? "cidr-bit--net" : "cidr-bit--host") +
                      (b === "1" ? " cidr-bit--on" : "") +
                      (boundary ? " cidr-bit--boundary" : "")
                    }
                  >
                    {b}
                  </span>
                );
              })}
          </div>
          <span className="cidr-bits-dec mono">{oct}</span>
        </div>
      ))}
    </div>
  );
}

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "192.168.1.0/24";

export default function CidrTool() {
  const t = useTranslations("tools.cidr");
  const [mode, setMode] = useState<Mode>("subnet");
  const [error, setError] = useState<string | null>(null);

  // Map a thrown error to a localized message (stable codes -> hints).
  const mapError = useCallback(
    (e: unknown): string => {
      if (e instanceof CidrInputError && KNOWN_ERR.has(e.code)) return t(`err.${e.code}`);
      return t("errors.invalid");
    },
    [t],
  );

  // ---- subnet mode ----
  const [value, setValue] = useState("");
  const [subnet, setSubnet] = useState<SubnetResult | null>(null);
  const runSubnet = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError(t("errors.empty"));
      setSubnet(null);
      return;
    }
    try {
      setSubnet(cidrAnalyze(trimmed));
      setError(null);
    } catch (e) {
      setError(mapError(e));
      setSubnet(null);
    }
  }, [value, t, mapError]);

  // Slider: rewrite the prefix of the current address and recompute at once.
  const onPrefixChange = useCallback(
    (p: number) => {
      const ip = parseIpPart(value) || "192.168.1.0";
      const next = `${ip}/${p}`;
      setValue(next);
      try {
        setSubnet(cidrAnalyze(next));
        setError(null);
      } catch (e) {
        setError(mapError(e));
        setSubnet(null);
      }
    },
    [value, mapError],
  );

  // ---- vlsm mode ----
  const [parent, setParent] = useState("");
  const [reqs, setReqs] = useState<ReqRow[]>([{ label: "", hosts: "" }]);
  const [vlsm, setVlsm] = useState<VlsmResult | null>(null);
  const setReq = (i: number, patch: Partial<ReqRow>) =>
    setReqs((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addReq = () => setReqs((rs) => [...rs, { label: "", hosts: "" }]);
  const removeReq = (i: number) => setReqs((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs));
  const runVlsm = useCallback(() => {
    if (!parent.trim()) {
      setError(t("err.format"));
      setVlsm(null);
      return;
    }
    const requirements = reqs
      .filter((r) => r.hosts.trim() !== "" && /^\d+$/.test(r.hosts.trim()))
      .map((r) => ({ label: r.label.trim() || undefined, hosts: Number(r.hosts.trim()) }));
    if (requirements.length === 0) {
      setError(t("err.noReqs"));
      setVlsm(null);
      return;
    }
    try {
      setVlsm(allocateVlsm(parent.trim(), requirements));
      setError(null);
    } catch (e) {
      setError(mapError(e));
      setVlsm(null);
    }
  }, [parent, reqs, t, mapError]);

  // ---- supernet mode ----
  const [aggInput, setAggInput] = useState("");
  const [agg, setAgg] = useState<AggregateResult | null>(null);
  const runAgg = useCallback(() => {
    try {
      const list = parseCidrList(aggInput);
      if (list.length === 0) {
        setError(t("err.noPrefixes"));
        setAgg(null);
        return;
      }
      setAgg(aggregate(list));
      setError(null);
    } catch (e) {
      setError(mapError(e));
      setAgg(null);
    }
  }, [aggInput, t, mapError]);

  // ---- overlap mode ----
  const [ovInput, setOvInput] = useState("");
  const [scope, setScope] = useState("");
  const [ov, setOv] = useState<OverlapGapResult | null>(null);
  const runOv = useCallback(() => {
    try {
      const list = parseCidrList(ovInput);
      if (list.length === 0) {
        setError(t("err.noPrefixes"));
        setOv(null);
        return;
      }
      setOv(analyzeOverlapGap(list, scope.trim() || undefined));
      setError(null);
    } catch (e) {
      setError(mapError(e));
      setOv(null);
    }
  }, [ovInput, scope, t, mapError]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
  };

  const subnetRows = subnet
    ? [
        { label: t("results.network"), value: subnet.network },
        { label: t("results.broadcast"), value: subnet.broadcast },
        { label: t("results.netmask"), value: subnet.netmask },
        { label: t("results.wildcard"), value: subnet.wildcard },
        { label: t("results.firstHost"), value: subnet.firstHost },
        { label: t("results.lastHost"), value: subnet.lastHost },
        { label: t("results.totalAddresses"), value: subnet.totalAddresses.toLocaleString() },
        { label: t("results.usableHosts"), value: subnet.usableHosts.toLocaleString() },
      ]
    : [];

  // Current prefix the slider reflects: from the input, else the result mask, else /24.
  const sliderPrefix = parsePrefix(value) ?? (subnet ? maskToPrefix(subnet.netmask) : null) ?? 24;

  // Octets + prefix for the bit grid, derived from the computed network address.
  const bitOctets = subnet ? ipToOctets(subnet.network) : null;
  const bitPrefix = subnet ? maskToPrefix(subnet.netmask) : null;

  usePrefill((v) => {
    setValue(v);
    try {
      setSubnet(cidrAnalyze(v.trim()));
      setError(null);
    } catch (e) {
      setError(mapError(e));
      setSubnet(null);
    }
  });

  return (
    <div className="cidr-tool">
      <div className="cidr-head">
        <h3 className="cidr-title">{t("title")}</h3>
        <p className="cidr-desc">{t(`modeDesc.${mode}`)}</p>
      </div>

      {/* mode tabs */}
      <div className="cidr-modes" role="tablist" aria-label={t("title")}>
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={"cidr-mode-tab" + (mode === m ? " is-active" : "")}
            onClick={() => switchMode(m)}
          >
            {t(`modes.${m}`)}
          </button>
        ))}
      </div>

      {/* ---------- SUBNET ---------- */}
      {mode === "subnet" && (
        <div className="cidr-input-row">
          <div className="dig-input-head">
            <label className="cidr-label" htmlFor="cidr-input">
              {t("inputLabel")}
            </label>
            <div className="dig-input-actions">
              <button type="button" className="b64-copy" onClick={() => { setValue(EXAMPLE); try { setSubnet(cidrAnalyze(EXAMPLE.trim())); setError(null); } catch (e) { setError(mapError(e)); setSubnet(null); } }}>{t("example")}</button>
              <button type="button" className="b64-copy" onClick={() => { setValue(""); setSubnet(null); setError(null); }}>{t("clear")}</button>
            </div>
          </div>
          <div className="cidr-controls">
            <input
              id="cidr-input"
              className="cidr-input mono"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  runSubnet();
                }
              }}
              placeholder={t("inputPlaceholder")}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" className="cidr-button" onClick={runSubnet}>
              {t("compute")}
            </button>
          </div>
          <div className="cidr-slider-row">
            <label className="cidr-label cidr-slider-label" htmlFor="cidr-prefix-slider">
              {t("prefixSlider")}
              <span className="cidr-slider-value mono">/{sliderPrefix}</span>
            </label>
            <input
              id="cidr-prefix-slider"
              className="cidr-slider"
              type="range"
              min={0}
              max={32}
              value={sliderPrefix}
              onChange={(e) => onPrefixChange(Number(e.target.value))}
              aria-label={t("prefixSlider")}
            />
          </div>
        </div>
      )}

      {/* ---------- VLSM ---------- */}
      {mode === "vlsm" && (
        <div className="cidr-input-row">
          <label className="cidr-label" htmlFor="cidr-parent">
            {t("vlsm.parentLabel")}
          </label>
          <input
            id="cidr-parent"
            className="cidr-input mono"
            type="text"
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            placeholder={t("vlsm.parentPlaceholder")}
            autoComplete="off"
            spellCheck={false}
          />
          <p className="cidr-label cidr-reqs-label">{t("vlsm.reqsLabel")}</p>
          <div className="cidr-reqs">
            {reqs.map((r, i) => (
              <div className="cidr-req-row" key={i}>
                <input
                  className="cidr-input cidr-req-name"
                  type="text"
                  value={r.label}
                  onChange={(e) => setReq(i, { label: e.target.value })}
                  placeholder={t("vlsm.namePlaceholder")}
                  autoComplete="off"
                />
                <input
                  className="cidr-input cidr-req-hosts mono"
                  type="text"
                  inputMode="numeric"
                  value={r.hosts}
                  onChange={(e) => setReq(i, { hosts: e.target.value.replace(/[^\d]/g, "") })}
                  placeholder={t("vlsm.hostsPlaceholder")}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="cidr-req-remove"
                  onClick={() => removeReq(i)}
                  aria-label={t("vlsm.remove")}
                  disabled={reqs.length <= 1}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="cidr-controls cidr-vlsm-actions">
            <button type="button" className="cidr-button--ghost cidr-add" onClick={addReq}>
              + {t("vlsm.addRow")}
            </button>
            <button type="button" className="cidr-button" onClick={runVlsm}>
              {t("vlsm.run")}
            </button>
          </div>
        </div>
      )}

      {/* ---------- SUPERNET ---------- */}
      {mode === "supernet" && (
        <div className="cidr-input-row">
          <label className="cidr-label" htmlFor="cidr-agg">
            {t("supernet.label")}
          </label>
          <textarea
            id="cidr-agg"
            className="cidr-input cidr-textarea mono"
            value={aggInput}
            onChange={(e) => setAggInput(e.target.value)}
            placeholder={t("supernet.placeholder")}
            rows={5}
            autoComplete="off"
            spellCheck={false}
          />
          <div className="cidr-controls cidr-vlsm-actions">
            <button type="button" className="cidr-button" onClick={runAgg}>
              {t("supernet.run")}
            </button>
          </div>
        </div>
      )}

      {/* ---------- OVERLAP ---------- */}
      {mode === "overlap" && (
        <div className="cidr-input-row">
          <label className="cidr-label" htmlFor="cidr-ov">
            {t("overlap.label")}
          </label>
          <textarea
            id="cidr-ov"
            className="cidr-input cidr-textarea mono"
            value={ovInput}
            onChange={(e) => setOvInput(e.target.value)}
            placeholder={t("overlap.placeholder")}
            rows={5}
            autoComplete="off"
            spellCheck={false}
          />
          <label className="cidr-label cidr-reqs-label" htmlFor="cidr-scope">
            {t("overlap.scopeLabel")}
          </label>
          <input
            id="cidr-scope"
            className="cidr-input mono"
            type="text"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder={t("overlap.scopePlaceholder")}
            autoComplete="off"
            spellCheck={false}
          />
          <div className="cidr-controls cidr-vlsm-actions">
            <button type="button" className="cidr-button" onClick={runOv}>
              {t("overlap.run")}
            </button>
          </div>
        </div>
      )}

      <p className="cidr-privacy">
        <span className="cidr-lock" aria-hidden="true">
          ●
        </span>
        {t("runsLocally")}
      </p>

      {error && (
        <p className="cidr-error" role="alert">
          {error}
        </p>
      )}

      {/* ---------- RESULTS: subnet ---------- */}
      {mode === "subnet" && subnet && (
        <dl className="cidr-results">
          {subnetRows.map((row) => (
            <div className="cidr-result-row" key={row.label}>
              <dt className="cidr-result-label">{row.label}</dt>
              <dd className="cidr-result-value mono">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {mode === "subnet" && subnet && bitOctets && bitPrefix !== null && (
        <div className="cidr-bits">
          <div className="cidr-bits-head">
            <span className="cidr-bits-title">{t("bitsHeading")}</span>
            <span className="cidr-bits-caption">
              <span className="cidr-bits-legend cidr-bits-legend--net">
                {bitPrefix} {t("bitsNetwork")}
              </span>
              <span className="cidr-bits-legend cidr-bits-legend--host">
                {32 - bitPrefix} {t("bitsHost")}
              </span>
            </span>
          </div>
          <OctetBits octets={bitOctets} prefix={bitPrefix} />
          <p className="cidr-bits-note">{t("bitsNote")}</p>
        </div>
      )}

      {mode === "subnet" && subnet && (
        <div className="cidr-range">
          <div className="cidr-bits-head">
            <span className="cidr-bits-title">{t("rangeHeading")}</span>
          </div>
          {(() => {
            const allUsable = subnet.usableHosts === subnet.totalAddresses;
            const usableStr = subnet.usableHosts.toLocaleString();
            const rangeStr =
              subnet.network === subnet.broadcast
                ? subnet.network
                : `${subnet.firstHost} \u2013 ${subnet.lastHost}`;
            const x0 = 24;
            const x1 = 656;
            const W = x1 - x0;
            const barY = 24;
            const barH = 46;
            if (allUsable) {
              return (
                <svg className="cidr-range-svg" viewBox="0 0 680 116" role="img" aria-label={t("rangeHeading")}>
                  <rect x={x0} y={barY} width={W} height={barH} rx="6" fill="var(--accent-primary)" fillOpacity="0.16" stroke="var(--accent-primary)" />
                  <text x={(x0 + x1) / 2} y={barY + 20} textAnchor="middle" className="cidr-range-usable-in">
                    {usableStr} {t("usableShort")}
                  </text>
                  <text x={(x0 + x1) / 2} y={barY + 36} textAnchor="middle" className="cidr-range-span">
                    {subnet.network === subnet.broadcast ? subnet.network : `${subnet.network} \u2013 ${subnet.broadcast}`}
                  </text>
                </svg>
              );
            }
            const netW = 72;
            const bcW = 72;
            const usX = x0 + netW;
            const usW = W - netW - bcW;
            const bcX = x1 - bcW;
            const netC = x0 + netW / 2;
            const bcC = bcX + bcW / 2;
            const usC = usX + usW / 2;
            return (
              <svg className="cidr-range-svg" viewBox="0 0 680 116" role="img" aria-label={t("rangeHeading")}>
                <rect x={x0} y={barY} width={netW} height={barH} rx="6" className="cidr-range-rsv" />
                <rect x={usX} y={barY} width={usW} height={barH} fill="var(--accent-primary)" fillOpacity="0.16" stroke="var(--accent-primary)" />
                <rect x={bcX} y={barY} width={bcW} height={barH} rx="6" className="cidr-range-rsv" />
                <text x={usC} y={barY + 20} textAnchor="middle" className="cidr-range-usable-in">
                  {usableStr} {t("usableShort")}
                </text>
                <text x={usC} y={barY + 36} textAnchor="middle" className="cidr-range-span">
                  {rangeStr}
                </text>
                <text x={netC} y={barY + barH + 20} textAnchor="middle" className="cidr-range-name">{t("results.network")}</text>
                <text x={netC} y={barY + barH + 35} textAnchor="middle" className="cidr-range-addr">{subnet.network}</text>
                <text x={bcC} y={barY + barH + 20} textAnchor="middle" className="cidr-range-name">{t("results.broadcast")}</text>
                <text x={bcC} y={barY + barH + 35} textAnchor="middle" className="cidr-range-addr">{subnet.broadcast}</text>
              </svg>
            );
          })()}
          <p className="cidr-bits-note">
            {subnet.usableHosts === subnet.totalAddresses ? t("rfcNote") : t("reservedNote")}
          </p>
        </div>
      )}

      {/* ---------- RESULTS: vlsm ---------- */}
      {mode === "vlsm" && vlsm && (
        <div className="cidr-output">
          <div className="cidr-stats">
            <Stat label={t("vlsm.stat.parent")} value={vlsm.parent} mono />
            <Stat label={t("vlsm.stat.used")} value={vlsm.usedAddresses.toLocaleString()} />
            <Stat label={t("vlsm.stat.free")} value={vlsm.freeAddresses.toLocaleString()} />
            <Stat label={t("vlsm.stat.utilization")} value={vlsm.utilizationPct + "%"} />
          </div>
          <div className="cidr-table-wrap">
            <table className="cidr-table">
              <thead>
                <tr>
                  <th>{t("vlsm.th.name")}</th>
                  <th>{t("vlsm.th.hosts")}</th>
                  <th>{t("vlsm.th.network")}</th>
                  <th>{t("vlsm.th.prefix")}</th>
                  <th>{t("vlsm.th.netmask")}</th>
                  <th>{t("vlsm.th.range")}</th>
                  <th>{t("vlsm.th.broadcast")}</th>
                  <th>{t("vlsm.th.usable")}</th>
                </tr>
              </thead>
              <tbody>
                {vlsm.subnets.map((s, i) => (
                  <tr key={i}>
                    <td>{s.label || "—"}</td>
                    <td>{s.requestedHosts.toLocaleString()}</td>
                    <td className="mono">{s.network}</td>
                    <td className="mono">/{s.prefix}</td>
                    <td className="mono">{s.netmask}</td>
                    <td className="mono">
                      {s.firstHost} – {s.lastHost}
                    </td>
                    <td className="mono">{s.broadcast}</td>
                    <td>{s.usableHosts.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {vlsm.unallocated.length > 0 && (
            <div className="cidr-unfit">
              <span className="cidr-section-title">{t("vlsm.unfit")}</span>
              <ul className="cidr-unfit-list">
                {vlsm.unallocated.map((u, i) => (
                  <li key={i}>{(u.label || "—") + ": " + u.hosts.toLocaleString()}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ---------- RESULTS: supernet ---------- */}
      {mode === "supernet" && agg && (
        <div className="cidr-output">
          <div className="cidr-stats">
            <Stat label={t("supernet.stat.inputs")} value={agg.inputCount.toLocaleString()} />
            <Stat label={t("supernet.stat.addresses")} value={agg.inputAddresses.toLocaleString()} />
            <Stat label={t("supernet.stat.blocks")} value={agg.aggregatedCount.toLocaleString()} />
          </div>
          <span className="cidr-section-title">{t("supernet.minimal")}</span>
          <ul className="cidr-block-list">
            {agg.aggregated.map((b, i) => (
              <li className="cidr-block mono" key={i}>
                {b.cidr}
              </li>
            ))}
          </ul>
          {agg.singleSupernet && (
            <>
              <span className="cidr-section-title">{t("supernet.single")}</span>
              <ul className="cidr-block-list">
                <li className="cidr-block mono">{agg.singleSupernet.cidr}</li>
              </ul>
              {agg.supernetExtraAddresses > 0 && (
                <p className="cidr-note">
                  {t("supernet.singleExtra", { extra: agg.supernetExtraAddresses.toLocaleString() })}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* ---------- RESULTS: overlap ---------- */}
      {mode === "overlap" && ov && (
        <div className="cidr-output">
          <div className="cidr-stats">
            <Stat label={t("overlap.stat.covered")} value={ov.coveredAddresses.toLocaleString()} />
            {ov.scopeAddresses !== null && (
              <Stat label={t("overlap.stat.scope")} value={ov.scopeAddresses.toLocaleString()} />
            )}
          </div>
          <span className="cidr-section-title">{t("overlap.overlapsTitle")}</span>
          {ov.overlaps.length === 0 ? (
            <p className="cidr-empty">{t("overlap.noOverlaps")}</p>
          ) : (
            <ul className="cidr-overlap-list">
              {ov.overlaps.map((o, i) => (
                <li className="cidr-overlap-row" key={i}>
                  <span className="mono">{o.a}</span>
                  <span className={"cidr-badge cidr-badge--" + o.kind}>{t(`overlap.kind.${o.kind}`)}</span>
                  <span className="mono">{o.b}</span>
                  <span className="cidr-overlap-meta mono">
                    {o.overlapStart} – {o.overlapEnd} · {o.overlapAddresses.toLocaleString()} {t("overlap.addresses")}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {ov.scope && (
            <>
              <span className="cidr-section-title">{t("overlap.gapsTitle")}</span>
              {ov.gaps.length === 0 ? (
                <p className="cidr-empty">{t("overlap.noGaps")}</p>
              ) : (
                <ul className="cidr-block-list">
                  {ov.gaps.map((g, i) => (
                    <li className="cidr-block mono" key={i}>
                      {g.cidr}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
