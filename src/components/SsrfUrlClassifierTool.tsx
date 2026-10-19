"use client";

// ============================================================================
// src/components/SsrfUrlClassifierTool.tsx
// ----------------------------------------------------------------------------
// Paste a URL; see where it points and whether a server fetching it would be
// steered at internal infrastructure. All classification is pure and local
// (compute.ts) and never touches the network - no DNS, no request (D-53); this
// component only renders the result. Category, risk, and flag text are rendered
// through translation keys (not the engine's English reasons), so the verdict is
// fully localized; the engine supplies only structured values (the decoded
// address, the obfuscation form, the scheme).
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { classifyUrl, VECTORS, type HostCategory, type RiskLevel } from "@/lib/tools/ssrf-url-classifier"; // VECTORS added 2026-10-19b for the D-83 example

// D-83 (fixed 2026-10-19b): the Example button loads a golden vector's input verbatim. The previous
// literal "http://2130706433/latest/meta-data/" matched no vector; this one is pinned by name.
const EXAMPLE_VECTOR = "decimal-encoded metadata URL (the Example button)"; // the vector's name in golden-vectors.ts
const EXAMPLE = VECTORS.find((v) => v.name === EXAMPLE_VECTOR)!.input; // "http://2852039166/latest/meta-data/", verbatim

// Categories in a stable display order (internal-first, so the risky ones lead).
const CATEGORY_ORDER: HostCategory[] = [
  "loopback",
  "cloud-metadata",
  "link-local",
  "private",
  "internal-name",
  "reserved",
  "cgnat",
  "public",
  "unresolved",
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="ssrf-field">
      <span className="ssrf-field-label">{label}</span>
      <span className="ssrf-field-value dig-mono">{value}</span>
    </div>
  );
}

export default function SsrfUrlClassifierTool() {
  const t = useTranslations("tools.ssrf-url-classifier");
  const [input, setInput] = useState("");

  const typed = input.trim().length > 0;
  const result = useMemo(() => {
    if (!typed) return null;
    try {
      return classifyUrl(input);
    } catch {
      return null;
    }
  }, [input, typed]);

  const riskLevel: RiskLevel | null = result ? result.risk : null;
  // 2026-10-19b: derived flags for the special-purpose rows (all false or null when there is no result).
  const anycastBlock = result ? (result.embedding ? result.embeddedSpecialBlock : result.specialBlock) : null; // the row of the address that decided the rating
  const specialPublic = Boolean(result && result.category === "public" && result.specialBlock && !result.embedding && !result.anycastService); // a named row that rates public
  const noReach = Boolean(result && result.specialBlock && result.specialBlock.globallyReachable === null && !result.embedding); // a deprecated row without the booleans

  return (
    <div className="cidr-tool jwt-tool dig-tool ssrf-tool">
      <div className="b64-head">
        <label className="b64-label">{t("input.label")}</label>
        <div className="b64-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>
            {t("input.example")}
          </button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>
            {t("input.clear")}
          </button>
        </div>
      </div>

      <textarea
        className="b64-input dig-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("input.placeholder")}
        rows={2}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />

      <p className="dig-privacy">{t("privacy")}</p>

      {result && (
        <div className="dig-output">
          {/* Verdict headline: risk level + the category it points to. */}
          <div className={"ssrf-verdict ssrf-risk-" + riskLevel}>
            <div className="ssrf-verdict-risk">
              <span className="ssrf-verdict-risk-label">{t("verdict.riskLabel")}</span>
              <span className="ssrf-verdict-risk-value">{t("risk." + result.risk)}</span>
            </div>
            <div className="ssrf-verdict-cat">
              <span className="ssrf-verdict-cat-value">{t("category." + result.category)}</span>
              <span className="ssrf-verdict-cat-desc">{t("categoryDesc." + result.category)}</span>
            </div>
          </div>

          {/* What you pasted: structured, language-neutral values. */}
          <div className="jwt-panel ssrf-facts">
            <div className="jwt-panel-title">{t("facts.title")}</div>
            <div className="ssrf-field-list">
              {result.scheme && <Field label={t("facts.scheme")} value={result.scheme} />}
              {result.host && <Field label={t("facts.host")} value={result.host} />}
              {result.canonicalIp && result.canonicalIp !== result.host && (
                <Field label={t("facts.canonicalIp")} value={result.canonicalIp} />
              )}
              {result.ipVersion && <Field label={t("facts.ipVersion")} value={"IPv" + result.ipVersion} />}
              {/* 2026-10-19: the IPv4 address an IPv6 host carries (IPv4-mapped, NAT64, 6to4); the rating comes from it. */}
              {result.embeddedIpv4 && <Field label={t("facts.embeddedIpv4")} value={result.embeddedIpv4} /> /* the carried IPv4 address */}
              {/* 2026-10-19: the IANA special-purpose registry row, written as the registry names it (language-neutral). */}
              {result.specialBlock && ( // only when the engine names a registry row
                <Field // one more fact row
                  label={t("facts.specialBlock")} // "Special-purpose block"
                  value={`${result.specialBlock.prefix} ${result.specialBlock.name} (${result.specialBlock.rfc})`} // prefix, IANA name, RFC
                /> // end registry-row Field
              ) /* end specialBlock */}
              {/* 2026-10-19b: the IANA IPv4 registry row of the carried address, when an IPv6 host carries one. */}
              {result.embeddedSpecialBlock && ( // only for an embedding whose IPv4 address sits in a registry row
                <Field // one more fact row
                  label={t("facts.embeddedBlock")} // "Block of the embedded IPv4 address (IANA)"
                  value={`${result.embeddedSpecialBlock.prefix} ${result.embeddedSpecialBlock.name} (${result.embeddedSpecialBlock.rfc})`} // prefix, IANA name, RFC
                /> // end embedded-row Field
              ) /* end embeddedSpecialBlock */}
              {/* 2026-10-19b: a Teredo address carries two IPv4 addresses and a port (RFC 4380 section 4); all are shown. */}
              {result.teredo && <Field label={t("facts.teredoServer")} value={result.teredo.serverIpv4} /> /* bits 32 to 63 */}
              {result.teredo && <Field label={t("facts.teredoClient")} value={result.teredo.clientIpv4} /> /* bits 96 to 127, XOR undone */}
              {result.teredo && <Field label={t("facts.teredoPort")} value={String(result.teredo.clientPort)} /> /* bits 80 to 95, XOR undone */}
              {result.teredo && <Field label={t("facts.teredoFlags")} value={"0x" + result.teredo.flags.toString(16).padStart(4, "0")} /> /* bits 64 to 79, as hex */}
              {result.port && <Field label={t("facts.port")} value={result.port} />}
              {result.path && result.path !== "/" && <Field label={t("facts.path")} value={result.path} />}
            </div>
          </div>

          {/* Flags: obfuscation, dangerous scheme, embedded credentials. */}
          {(result.obfuscated || result.schemeFlag || result.hasUserinfo || result.embedding || result.anycastService || specialPublic || noReach) && ( // embedding added 2026-10-19; the last three 2026-10-19b
            <div className="jwt-panel ssrf-flags">
              <div className="jwt-panel-title">{t("flags.title")}</div>
              <ul className="ssrf-flag-list">
                {result.obfuscated && result.obfuscationForm && result.canonicalIp && (
                  <li className="ssrf-flag ssrf-flag-warn">
                    {t("flags.obfuscated", {
                      form: t("form." + result.obfuscationForm),
                      ip: result.canonicalIp,
                    })}
                  </li>
                )}
                {/* 2026-10-19: which IPv4-in-IPv6 embedding was decoded, and the address it carries. */}
                {result.embedding && result.embeddedIpv4 && ( // only for an IPv6 host that carries an IPv4 address
                  <li className="ssrf-flag ssrf-flag-warn">{/* same warning style as the other flags */}
                    {t("flags.embedded", { embedding: t("embedding." + result.embedding), ip: result.embeddedIpv4 }) /* embedding name + carried address */}
                  </li> // end embedding flag
                ) /* end embedding branch */}
                {/* 2026-10-19: 64:ff9b:1::/48 leaves the prefix length to the operator, so say which RFC 6052 layout was read. */}
                {result.embedding === "nat64-local" && result.embeddingLayout !== null && ( // local-use prefix only
                  <li className="ssrf-flag ssrf-flag-warn">{t("flags.embeddedLayout", { length: result.embeddingLayout }) /* the /n layout used */}</li>
                ) /* end layout flag */}
                {/* 2026-10-19b: the IPv4-compatible format is deprecated; say so beside the rating. */}
                {result.embedding === "ipv4-compatible" && <li className="ssrf-flag ssrf-flag-warn">{t("flags.ipv4Compatible")}</li> /* RFC 4291 section 2.5.5.1 */}
                {/* 2026-10-19b: Teredo carries a server and a client address; name both and the one that decided. */}
                {result.teredo && result.embeddedIpv4 && ( // only for a Teredo host
                  <li className="ssrf-flag ssrf-flag-warn">{t("flags.teredo", { server: result.teredo.serverIpv4, client: result.teredo.clientIpv4, ip: result.embeddedIpv4 }) /* both addresses, the deciding one */}</li>
                ) /* end Teredo flag */}
                {/* 2026-10-19b: a registry anycast service address (PCP, TURN, DNS-SD SRP, 6a44 relay), named even when it rates public. */}
                {result.anycastService && anycastBlock && ( // the deciding address is an anycast service row
                  <li className="ssrf-flag ssrf-flag-warn">{t("flags.anycastService", { prefix: anycastBlock.prefix, name: anycastBlock.name, rfc: anycastBlock.rfc, reachable: anycastBlock.globallyReachable === true ? "yes" : "no" }) /* row named, rating explained */}</li>
                ) /* end anycast flag */}
                {/* 2026-10-19b: any other special-purpose row the registry marks globally reachable (AS112, AMT, ORCHIDv2, DETs). */}
                {specialPublic && result.specialBlock && ( // public, named, not an embedding, not anycast
                  <li className="ssrf-flag ssrf-flag-warn">{t("flags.specialPublic", { prefix: result.specialBlock.prefix, name: result.specialBlock.name, rfc: result.specialBlock.rfc }) /* why it rates public */}</li>
                ) /* end special-public flag */}
                {/* 2026-10-19b: a deprecated row with no Globally Reachable value (192.88.99.0/24, 2001:10::/28). */}
                {noReach && result.specialBlock && ( // no embedding decoded, registry value absent
                  <li className="ssrf-flag ssrf-flag-warn">{t("flags.noReach", { prefix: result.specialBlock.prefix, name: result.specialBlock.name, rfc: result.specialBlock.rfc }) /* why it is not rated public */}</li>
                ) /* end no-reach flag */}
                {result.schemeFlag && (
                  <li className="ssrf-flag ssrf-flag-warn">{t("flags.scheme", { scheme: result.schemeFlag })}</li>
                )}
                {result.hasUserinfo && <li className="ssrf-flag ssrf-flag-warn">{t("flags.userinfo")}</li>}
              </ul>
            </div>
          )}

          {/* Defenses: static, localized guidance. */}
          <div className="jwt-panel ssrf-defenses">
            <div className="jwt-panel-title">{t("defenses.title")}</div>
            <ul className="ssrf-defense-list">
              <li>{t("defenses.allowlist")}</li>
              <li>{t("defenses.blockRanges")}</li>
              <li>{t("defenses.resolveThenCheck")}</li>
              <li>{t("defenses.noRedirects")}</li>
              <li>{t("defenses.schemes")}</li>
            </ul>
          </div>

          <p className="ssrf-note">{t("classifierNote")}</p>
        </div>
      )}

      {/* A short legend of what each destination category means. */}
      {!result && (
        <div className="jwt-panel ssrf-legend">
          <div className="jwt-panel-title">{t("legend.title")}</div>
          <div className="ssrf-legend-list">
            {CATEGORY_ORDER.map((c) => (
              <div key={c} className="ssrf-legend-row">
                <span className={"ssrf-legend-dot ssrf-risk-" + riskForLegend(c)} />
                <span className="ssrf-legend-cat">{t("category." + c)}</span>
                <span className="ssrf-legend-desc">{t("categoryDesc." + c)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Mirror of the engine's risk mapping, for coloring the idle legend only.
function riskForLegend(c: HostCategory): RiskLevel {
  if (c === "public") return "low";
  if (c === "cgnat") return "medium";
  if (c === "unresolved") return "unknown";
  return "high";
}
