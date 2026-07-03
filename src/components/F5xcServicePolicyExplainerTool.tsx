"use client";

// ============================================================================
// src/components/F5xcServicePolicyExplainerTool.tsx
// ----------------------------------------------------------------------------
// Paste an F5 XC service_policy spec, get its match logic spelled out. The parse
// is pure, local, and decode-only (compute.ts); this only renders it.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  parseServicePolicy,
  type MatchLine,
  type PredicateView,
  type RuleView,
} from "@/lib/tools/f5xc-service-policy-explainer";

const EXAMPLE = JSON.stringify(
  {
    metadata: { name: "acmecorp-web", namespace: "staging" },
    spec: {
      server_name: "database.production.customer.volterra.us",
      rule_list: {
        rules: [
          {
            metadata: { name: "allow-api-get", description: "Allow GET to the documented API" },
            spec: {
              action: "ALLOW",
              path: { prefix_values: ["/api/"] },
              http_method: { methods: ["GET"] },
              headers: [{ name: "Accept-Encoding", item: { exact_values: ["gzip"] } }],
            },
          },
          {
            metadata: { name: "deny-bad-asn" },
            spec: { action: "DENY", asn_list: { as_numbers: [64512, 65000] } },
          },
          { metadata: { name: "allow-all" }, spec: { action: "ALLOW" } },
        ],
      },
    },
  },
  null,
  2,
);

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="dig-row">
      <span className="dig-row-label">{label}</span>
      <span className={mono ? "dig-row-value dig-mono" : "dig-row-value"}>{value}</span>
    </div>
  );
}

// A single rendered match criterion (one MatchLine).
function Line({ line, t }: { line: MatchLine; t: ReturnType<typeof useTranslations> }) {
  // "note" lines are structural hints, not comparisons.
  if (line.op === "note") {
    const v = line.values[0];
    if (v === "any") return <span className="f5xc-any">{t("op.any")}</span>;
    if (v === "encoded-path") return <span className="f5xc-hint">{t("op.encodedPath")}</span>;
    return <span className="f5xc-hint">{v}</span>;
  }
  const opLabel = t(`op.${line.op}`);
  const multi = line.values.length > 1;
  return (
    <div className="f5xc-line">
      {line.subject && <span className="f5xc-subject dig-mono">{line.subject}</span>}
      <span className="f5xc-op">{opLabel}</span>
      {line.values.length > 0 && (
        <span className="f5xc-vals">
          {line.values.map((v, i) => (
            <span key={i} className="f5xc-val dig-mono">{v}</span>
          ))}
        </span>
      )}
      {multi && (line.op === "exact" || line.op === "methods" || line.op === "asn" || line.op === "prefixes" || line.op === "classes" || line.op === "categories" || line.op === "ports" || line.op === "keys") && (
        <span className="f5xc-orhint">{t("logic.orInline")}</span>
      )}
    </div>
  );
}

function Predicate({ p, t }: { p: PredicateView; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="f5xc-pred">
      <div className="f5xc-pred-head">
        <span className="f5xc-pred-label">{t(`predicate.${p.key}`) /* falls through to key if unmapped is avoided by full map */}</span>
        {p.inverted && <span className="f5xc-badge f5xc-badge-invert">{t("logic.inverted")}</span>}
        {p.caseSensitiveExact && <span className="f5xc-badge f5xc-badge-case">{t("logic.caseSensitive")}</span>}
      </div>
      <div className="f5xc-pred-lines">
        {p.lines.map((ln, i) => (
          <Line key={i} line={ln} t={t} />
        ))}
      </div>
    </div>
  );
}

function actionClass(action: string) {
  if (action === "ALLOW") return "f5xc-act f5xc-act-allow";
  if (action === "DENY") return "f5xc-act f5xc-act-deny";
  return "f5xc-act f5xc-act-next";
}

function Rule({ rule, index, t }: { rule: RuleView; index: number; t: ReturnType<typeof useTranslations> }) {
  const actionKey = rule.action === "ALLOW" ? "allow" : rule.action === "DENY" ? "deny" : rule.action === "NEXT_POLICY" ? "nextPolicy" : "other";
  return (
    <div className={rule.expired ? "f5xc-rule f5xc-rule-expired" : "f5xc-rule"}>
      <div className="f5xc-rule-head">
        <span className="f5xc-rule-idx">{index + 1}</span>
        <span className="f5xc-rule-name dig-mono">{rule.name ?? t("rule.unnamed")}</span>
        <span className={actionClass(rule.action)}>{t(`rule.action.${actionKey}`)}</span>
        {rule.expired && <span className="f5xc-badge f5xc-badge-expired">{t("rule.expired")}</span>}
      </div>
      {rule.description && <div className="f5xc-rule-desc">{rule.description}</div>}
      {rule.predicates.length === 0 ? (
        <div className="f5xc-rule-anymatch">{t("rule.matchesEverything")}</div>
      ) : (
        <>
          <div className="f5xc-rule-andnote">{t("logic.andAll")}</div>
          <div className="f5xc-preds">
            {rule.predicates.map((p, i) => (
              <Predicate key={i} p={p} t={t} />
            ))}
          </div>
        </>
      )}
      {rule.actionModifiers.length > 0 && (
        <div className="f5xc-mods">
          <span className="f5xc-mods-label">{t("rule.modifiers")}</span>
          {rule.actionModifiers.map((m) => (
            <span key={m} className="f5xc-mod dig-mono">{m}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function F5xcServicePolicyExplainerTool() {
  const t = useTranslations("tools.f5xc-service-policy-explainer");
  const [input, setInput] = useState("");
  const parsed = useMemo(() => parseServicePolicy(input), [input]);
  const show = input.trim().length > 0 && parsed.recognized;
  const showNot = input.trim().length > 0 && !parsed.recognized;

  const dispKey =
    parsed.disposition.kind === "allow_all" ? "allow_all"
      : parsed.disposition.kind === "deny_all" ? "deny_all"
        : parsed.disposition.kind === "allow_list" ? "allow_list"
          : parsed.disposition.kind === "deny_list" ? "deny_list"
            : parsed.disposition.kind === "legacy_rule_list" ? "legacy_rule_list"
              : parsed.disposition.kind === "rule_list" ? "rule_list"
                : "unknown";

  const algoKey = parsed.ruleCombiningAlgorithm ?? "FIRST_MATCH";

  return (
    <div className="cidr-tool jwt-tool dig-tool f5xc-tool">
      <div className="dig-input-head">
        <label htmlFor="f5xc-in" className="cidr-label">{t("input.label")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("input.example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("input.clear")}</button>
        </div>
      </div>
      <textarea
        id="f5xc-in"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("input.placeholder")}
        spellCheck={false}
        rows={14}
      />
      <p className="cidr-privacy"><span className="cidr-lock">&#128274;</span> {t("privacy")}</p>

      {showNot && <div className="dig-notdig">{parsed.parseError ? t("parseError", { detail: parsed.parseError }) : t("notPolicy")}</div>}

      {show && (
        <div className="jwt-results dig-results f5xc-results">
          {/* -- warnings (headline) -- */}
          {parsed.warnings.length > 0 && (
            <div className="jwt-panel dig-warnings">
              <div className="jwt-panel-title">{t("warnings.title")}</div>
              <ul className="dig-warning-list">
                {parsed.warnings.map((w) => (
                  <li key={w}><span className="dig-warn-mark">&#9650;</span> {t(`warnings.${w}`)}</li>
                ))}
              </ul>
            </div>
          )}

          {/* -- overview -- */}
          <div className="jwt-panel">
            <div className="jwt-panel-title">{t("overview.title")}</div>
            {(parsed.name || parsed.namespace) && (
              <Row label={t("overview.name")} value={[parsed.name, parsed.namespace].filter(Boolean).join(" / ")} mono />
            )}
            <Row label={t("overview.appliesTo")} value={t(`serverScope.${parsed.serverScope?.kind ?? "any_server"}`)} />
            {parsed.serverScope && parsed.serverScope.lines.some((l) => l.op !== "note") && (
              <div className="f5xc-scope-lines">
                {parsed.serverScope.lines.map((ln, i) => <Line key={i} line={ln} t={t} />)}
              </div>
            )}
            <Row label={t("overview.disposition")} value={t(`disposition.${dispKey}`)} />
          </div>

          {/* -- rule_list: algorithm + rules -- */}
          {parsed.disposition.kind === "rule_list" && (
            <>
              <div className="jwt-panel f5xc-algo">
                <div className="jwt-panel-title">{t("algorithm.title")}</div>
                <div className="f5xc-algo-name dig-mono">{algoKey}</div>
                <p className="f5xc-algo-desc">{t(`algorithm.${algoKey}`)}</p>
                <p className="f5xc-algo-note">{t("algorithm.defaultDeny")}</p>
              </div>

              <div className="jwt-panel">
                <div className="jwt-panel-title">{t("rules.title", { count: parsed.rules.length })}</div>
                <div className="f5xc-rules">
                  {parsed.rules.map((r, i) => (
                    <Rule key={i} rule={r} index={i} t={t} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* -- allow_list / deny_list source list -- */}
          {(parsed.disposition.kind === "allow_list" || parsed.disposition.kind === "deny_list") && parsed.disposition.sourceList && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("sourceList.title")}</div>
              <p className="f5xc-algo-note">{t(`sourceList.${parsed.disposition.kind}`)}</p>
              <div className="f5xc-scope-lines">
                {parsed.disposition.sourceList.lines.map((ln, i) => <Line key={i} line={ln} t={t} />)}
              </div>
              {parsed.disposition.sourceList.defaultAction && (
                <Row label={t("sourceList.defaultAction")} value={parsed.disposition.sourceList.defaultAction} mono />
              )}
            </div>
          )}

          {/* -- legacy_rule_list references -- */}
          {parsed.disposition.kind === "legacy_rule_list" && parsed.disposition.legacyRefs && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("legacy.title")}</div>
              <p className="f5xc-algo-note">{t("legacy.note")}</p>
              <div className="f5xc-scope-lines">
                {parsed.disposition.legacyRefs.map((ref, i) => (
                  <div key={i} className="f5xc-val dig-mono">{ref}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
