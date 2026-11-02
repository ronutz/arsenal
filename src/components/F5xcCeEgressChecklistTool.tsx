"use client";

// ============================================================================
// src/components/F5xcCeEgressChecklistTool.tsx
// ----------------------------------------------------------------------------
// UI for the F5XC CE egress checklist. Paste F5's published CE IP/domain file;
// pick a site type; get a provenance banner, a purpose-organized allowlist, the
// static port matrix, optional site-to-site rule blocks, a copyable firewall-
// request text, and a curl-host verification script. Parses what you paste.
// Styling reuses cidr-* / jwt-* vocabulary; no new CSS classes.
//
// Share results (2026-11-01, wave 4B): a button under the provenance line, at
// the top of the long result, builds a link, only when pressed, carrying the
// file as pasted and the site type (src/lib/tools/f5xc-ce-egress-checklist/
// share.ts, posture input-caution, with a caution line); a credential in the
// text blocks the link. An arriving link fills the box and picks the site.
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
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first maybe-secret, for the popover line
import { checkXcBox } from "@/lib/tools/f5xc-object-linter/xc-share-secrets"; // the site's check with the F5 XC findings
import { CE_EGRESS_SHARE, encodeCeEgressShare } from "@/lib/tools/f5xc-ce-egress-checklist/share"; // this tool's share spec

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

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

  // An arriving share link (2026-11-01): the box fills as a paste would and the site type is picked.
  useShareArrival(CE_EGRESS_SHARE, (s) => { setText(s.input); setSite(s.site); }); // the link's values
  // The check runs only once the file parsed into an allowlist (memoised on the box).
  const report = useMemo(() => (allow ? checkXcBox(text) : null), [allow, text]); // null while there is none
  // What Share results may carry: the file and the site type, unless the text holds a credential.
  const share = useMemo<ShareEncoding>(() => (report ? encodeCeEgressShare({ input: text, site }, true, report) : NOTHING), [report, text, site]); // the encoding
  // The first secret-looking name with a value, named in the popover in place of the plain caution.
  const maybe = useMemo(() => (report ? firstSharePlace(report.maybe) : null), [report]); // or null

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

          {/* Share results (2026-11-01): under the provenance line, before the long allowlist, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton
              encoding={share}
              carries={t("share.carries")}
              details={[maybe ? t("share.maybeSecret", { line: maybe.line, label: maybe.label, more: maybe.more }) : t("share.caution")]}
              blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""}
              title={t("name")}
            />
          </div>

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
