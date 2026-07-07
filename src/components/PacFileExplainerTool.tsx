"use client";

// ============================================================================
// src/components/PacFileExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE PAC FILE EXPLAINER + VALIDATOR.
//
// Paste a Proxy Auto-Config file and it reads back, all offline:
//   - the proxy directives it can return (DIRECT / PROXY / SOCKS / ...),
//     including semicolon failover chains, each explained;
//   - the PAC helper functions it uses, with the DNS-consulting ones flagged;
//   - a set of structural and correctness lints;
//   - a callout when it recognizes a Netskope Cloud Explicit Proxy file.
// Empty input renders a reference of the directives and helpers.
//
// CRITICAL: the file is read lexically and NEVER evaluated. The engine throws
// on oversized input (the worker-compatible contract), so the run is wrapped
// and errors render in the shared error box. Chrome strings come from
// tools.pac-file-explainer; the explanatory text is English by design, like
// its explainer siblings.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  type PacResult,
  type PacDirective,
  type PacHelper,
  type PacLint,
} from "@/lib/tools/pac-file-explainer";

/** The live-run result, with thrown errors folded into an error envelope. */
type LiveResult = { ok: true; value: PacResult } | { ok: false; message: string };

// The one-click example (D-83): the documented Netskope Cloud Explicit Proxy
// steering template, so the parse shown matches a real-world PAC.
const EXAMPLE = `function FindProxyForURL(url, host) {
  url = url.toLowerCase();
  host = host.toLowerCase();
  if (isPlainHostName(host)) {
    return "DIRECT";
  }
  if (shExpMatch(host, "*.login.microsoftonline.com")) {
    return "DIRECT";
  }
  if (url.substring(0, 5) == "http:" || url.substring(0, 6) == "https:") {
    return "PROXY eproxy-acme.goskope.com:8081";
  }
  return "DIRECT";
}`;

/** Map a lint kind to the shared panel styling. */
function lintPanelClass(kind: PacLint["kind"]): string {
  if (kind === "error" || kind === "warn") return "jwt-panel dig-warnings";
  return "jwt-panel";
}

/** One parsed directive: the raw return string and its explained parts. */
function DirectiveCard({ d }: { d: PacDirective }) {
  return (
    <article className="tmsh-object pac-directive">
      <header className="tmsh-object-head">
        <span className="tmsh-object-name mono">{d.raw}</span>
        {d.failover && <span className="tmsh-type-badge pac-failover">failover</span>}
      </header>
      <ul className="pac-parts">
        {d.parts.map((p, i) => (
          <li key={i} className="pac-part">
            <span className="mono pac-part-kw">{p.keyword}{p.endpoint ? " " + p.endpoint : ""}</span>
            <span className="gdf-step-behavior">{p.explain}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

/** One helper function found in the file. */
function HelperCard({ h }: { h: PacHelper }) {
  return (
    <article className={`tmsh-object pac-helper ${h.dnsConsulting ? "pac-helper-dns" : ""}`}>
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge mono">{h.name}</span>
        {h.count > 1 && <span className="pac-helper-count mono">x{h.count}</span>}
        {h.dnsConsulting && <span className="tmsh-type-badge pac-dns-badge">DNS</span>}
      </header>
      <p className="gdf-step-behavior">{h.explain}</p>
    </article>
  );
}

export default function PacFileExplainerTool() {
  const t = useTranslations("tools.pac-file-explainer");
  const [input, setInput] = useState("");

  const live: LiveResult = useMemo(() => {
    try {
      return { ok: true, value: run(input).result };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  }, [input]);

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool pac-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="pac-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="pac-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("inputPlaceholder")}
          spellCheck={false}
          rows={12}
          aria-describedby="pac-privacy"
        />
        <p id="pac-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
        </p>
      </div>

      {!live.ok && (
        <p className="cidr-error" role="alert">{live.message}</p>
      )}

      {live.ok && (
        <div className="jwt-results pac-results">
          {/* Lints / findings first. */}
          {live.value.lints.length > 0 && (
            <div className={lintPanelClass(live.value.lints.some((l) => l.kind === "error") ? "error" : live.value.lints[0].kind)}>
              <div className="jwt-panel-title">{t("findingsTitle")}</div>
              <ul className="dig-warning-list">
                {live.value.lints.map((l, i) => (
                  <li key={i} className={`pac-lint pac-lint-${l.kind}`}>{l.text}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Reference (empty input): directives + helpers glossary. */}
          {live.value.mode === "reference" && live.value.reference && (
            <>
              <div className="jwt-panel">
                <div className="jwt-panel-title">{t("returnValuesTitle")}</div>
                <ul className="pac-parts">
                  {live.value.reference.directives.map((d, i) => (
                    <li key={i} className="pac-part">
                      <span className="mono pac-part-kw">{d.keyword}</span>
                      <span className="gdf-step-behavior">{d.explain}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="jwt-panel">
                <div className="jwt-panel-title">{t("helpersTitle")}</div>
                <ul className="pac-parts">
                  {live.value.reference.helpers.map((h, i) => (
                    <li key={i} className="pac-part">
                      <span className="mono pac-part-kw">{h.name}</span>
                      <span className="gdf-step-behavior">{h.explain}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Parse mode: structure, directives, helpers. */}
          {live.value.mode === "parse" && (
            <>
              {live.value.directives.length > 0 && (
                <>
                  <div className="jwt-panel">
                    <div className="jwt-panel-title">{t("directivesTitle")}</div>
                  </div>
                  {live.value.directives.map((d, i) => (
                    <DirectiveCard d={d} key={i} />
                  ))}
                </>
              )}

              {live.value.helpers.length > 0 && (
                <>
                  <div className="jwt-panel">
                    <div className="jwt-panel-title">{t("helpersTitle")}</div>
                  </div>
                  {live.value.helpers.map((h, i) => (
                    <HelperCard h={h} key={i} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
