"use client";

// ============================================================================
// src/components/F5xcCeEgressChecklistTool.tsx
// ----------------------------------------------------------------------------
// UI for the F5XC CE egress checklist. Paste F5's published CE IP/domain file;
// pick a site type; get a provenance banner, a purpose-organized allowlist, the
// static port matrix, optional site-to-site rule blocks, a copyable firewall-
// request text, and a curl-host verification script. Parses what you paste.
// Styling reuses cidr-* / jwt-* vocabulary; no new CSS classes.
// ============================================================================

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  parseCeFile,
  buildAllowlist,
  verifierScript,
  PORT_MATRIX,
  OPTIONAL_RULES,
  type SiteType,
} from "@/lib/tools/f5xc-ce-egress-checklist/compute";

const SITES: SiteType[] = ["smsv2", "legacy", "both"];

// D-83 Example: a structurally faithful, trimmed sample of F5's ips-domains.txt.
const EXAMPLE = `## F5 Distributed Cloud SaaS Services
### Public IPv4 subnet ranges for F5 regional edges
#### REs in the Americas
5.182.215.0/25
159.60.190.0/24
## Firewall requirements for Secure Mesh v2 CE sites
### Egress IP-Address Rules
#### Public IPv4 Addresses for Site Registration and Updates
159.60.141.140
### Egress Domain Rules
## F5 Domains: Single wildcard domain
*.volterra.io
## Domains required for registration with F5 Distributed Cloud SaaS services
register.ves.volterra.io
downloads.volterra.io
## Webroot URL Classification Database Domains
localdb-url-daily.brightcloud.com
### Firewall requirements for Legacy CE sites
### Egress Domain Rules (Legacy)
docker.io
*.gcr.io gcr.io storage.googleapis.com
quay.io
## Additional firewall requirements for Customer Edge sites
### Default DNS for Site Registration and Updates
8.8.8.8
### Default NTP for Site Registration and Updates
216.239.35.4`;

export default function F5xcCeEgressChecklistTool() {
  const t = useTranslations("tools.f5xc-ce-egress-checklist");

  const [text, setText] = useState("");
  const [site, setSite] = useState<SiteType>("both");
  const [openRules, setOpenRules] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const parse = useMemo(() => (text.trim() !== "" ? parseCeFile(text) : null), [text]);
  const allow = useMemo(() => (parse && parse.ok ? buildAllowlist(parse, site) : null), [parse, site]);
  const script = useMemo(() => (allow ? verifierScript(allow.flatDomains) : ""), [allow]);
  const fwText = useMemo(() => (allow ? [...allow.flatDomains, ...allow.flatIps].join("\n") : ""), [allow]);

  const copy = useCallback(async (what: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  const toggleRule = (id: string) => setOpenRules((o) => ({ ...o, [id]: !o[id] }));

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="ce-file">
            {t("fileLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setText(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => setText("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea
          id="ce-file"
          className="cidr-input mono json-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("filePlaceholder")}
          rows={8}
          autoComplete="off"
          spellCheck={false}
        />
        <div className="jwt-badges" style={{ marginTop: "0.5rem", gap: "0.4rem" }}>
          <span className="cidr-label" style={{ marginRight: "0.3rem" }}>
            {t("siteLabel")}
          </span>
          {SITES.map((s) => (
            <button
              key={s}
              type="button"
              className="b64-copy"
              onClick={() => setSite(s)}
              style={site === s ? { borderColor: "var(--accent-primary)", color: "var(--accent-primary)" } : undefined}
            >
              {t(`sites.${s}`)}
            </button>
          ))}
        </div>
        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {parse && !parse.ok && (
        <p className="cidr-error" role="alert">
          {t("emptyError")}
        </p>
      )}

      {parse && parse.ok && allow && (
        <div className="jwt-results">
          {/* provenance banner - always states what was parsed */}
          <p className="cipher-note">
            {t("provenance", {
              lines: parse.lineCount,
              domains: parse.counts.domain + parse.counts.wildcard,
              ips: parse.counts.ip + parse.counts.cidr,
            })}
          </p>

          {/* allowlist by purpose */}
          {allow.buckets.map((b) => (
            <section className="jwt-panel" key={b.id}>
              <h4 className="jwt-panel-title">{b.label}</h4>
              {b.domains.length > 0 && (
                <div className="jwt-claim-row">
                  <span className="jwt-claim-label">{t("domains")}</span>
                  <span className="jwt-claim-value mono">{b.domains.join("  ")}</span>
                </div>
              )}
              {b.ips.length > 0 && (
                <div className="jwt-claim-row">
                  <span className="jwt-claim-label">{t("ips")}</span>
                  <span className="jwt-claim-value mono">{b.ips.join("  ")}</span>
                </div>
              )}
            </section>
          ))}

          {/* port matrix (static) */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("portMatrix")}</h4>
            {PORT_MATRIX.map((r, i) => (
              <div className="jwt-claim-row" key={i}>
                <span className="jwt-claim-label">{r.service}</span>
                <span className="jwt-claim-value mono">
                  {r.protocol} {r.ports}
                </span>
              </div>
            ))}
            <p className="cipher-note">{t("portNote")}</p>
          </section>

          {/* optional site-to-site / multi-node rules */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("optionalRules")}</h4>
            <div className="jwt-badges" style={{ gap: "0.4rem", marginBottom: "0.4rem" }}>
              {OPTIONAL_RULES.map((rule) => (
                <button
                  key={rule.id}
                  type="button"
                  className="b64-copy"
                  onClick={() => toggleRule(rule.id)}
                  style={openRules[rule.id] ? { borderColor: "var(--accent-primary)", color: "var(--accent-primary)" } : undefined}
                >
                  {rule.label}
                </button>
              ))}
            </div>
            {OPTIONAL_RULES.filter((r) => openRules[r.id]).map((rule) => (
              <div key={rule.id} style={{ marginTop: "0.3rem" }}>
                <div className="jwt-claim-label">{rule.label}</div>
                {rule.lines.map((ln, i) => (
                  <p className="cipher-note mono" key={i}>
                    {ln}
                  </p>
                ))}
              </div>
            ))}
          </section>

          {/* firewall-request text + verifier script */}
          <section className="jwt-panel">
            <div className="dig-input-head">
              <h4 className="jwt-panel-title">{t("firewallText")}</h4>
              <button type="button" className="b64-copy" onClick={() => copy("fw", fwText)}>
                {copied === "fw" ? t("copied") : t("copy")}
              </button>
            </div>
            <pre className="jwt-claim-value mono" style={{ whiteSpace: "pre-wrap", maxHeight: "12rem", overflow: "auto" }}>
              {fwText}
            </pre>
          </section>

          <section className="jwt-panel">
            <div className="dig-input-head">
              <h4 className="jwt-panel-title">{t("verifier")}</h4>
              <button type="button" className="b64-copy" onClick={() => copy("script", script)}>
                {copied === "script" ? t("copied") : t("copy")}
              </button>
            </div>
            <pre className="jwt-claim-value mono" style={{ whiteSpace: "pre-wrap", maxHeight: "12rem", overflow: "auto" }}>
              {script}
            </pre>
          </section>

          <p className="cipher-note">{t("registrationFlow")}</p>
        </div>
      )}
    </div>
  );
}
