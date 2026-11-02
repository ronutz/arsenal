"use client";

// ============================================================================
// src/components/F5xcApiPathExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the F5XC API path explainer. Paste an OpenAPI/Swagger spec; the
// version, a summary, defined security schemes, flags, and every operation
// (method, path, params, body, responses, auth) are shown, with unauthenticated
// and object-level badges. Flags render from i18n by code. Reuses cidr-/jwt-.
//
// Share results (2026-11-01, wave 4B): a button under the summary panel builds
// a link, only when pressed, carrying the file as pasted (src/lib/tools/
// f5xc-api-path-explainer/share.ts, posture input-caution, with a caution
// line); a credential in the file blocks the link and names its line. An
// arriving link (useShareArrival) fills the box, and the page reads it.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { explainSpec } from "@/lib/tools/f5xc-api-path-explainer/compute";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first maybe-secret, for the popover line
import { checkXcBox } from "@/lib/tools/f5xc-object-linter/xc-share-secrets"; // the site's check with the F5 XC findings
import { API_PATH_SHARE, encodeApiPathShare } from "@/lib/tools/f5xc-api-path-explainer/share"; // this tool's share spec

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

const EXAMPLE = JSON.stringify(
  {
    openapi: "3.0.3",
    info: { title: "Orders API" },
    components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } } },
    security: [{ bearerAuth: [] }],
    paths: {
      "/orders": {
        get: { summary: "List orders", responses: { "200": {}, "401": {} } },
        post: { summary: "Create order", requestBody: { content: { "application/json": {} } }, responses: { "201": {} } },
      },
      "/orders/{id}": {
        get: { summary: "Get order", parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {} } },
        delete: { security: [], summary: "Delete order", parameters: [{ name: "id", in: "path", required: true }], responses: { "204": {} }, deprecated: true },
      },
    },
  },
  null,
  2,
);

export default function F5xcApiPathExplainerTool() {
  const t = useTranslations("tools.f5xc-api-path-explainer");
  const [text, setText] = useState("");
  const r = useMemo(() => (text.trim() !== "" ? explainSpec(text) : null), [text]);
  // An arriving share link (2026-11-01): the box fills as a paste would, and the page reads it.
  useShareArrival(API_PATH_SHARE, (s) => setText(s.input)); // the link's text
  // The check runs only once there is a reading to share (memoised on the box).
  const report = useMemo(() => (r && r.recognized ? checkXcBox(text) : null), [r, text]); // null while there is none
  // What Share results may carry: the file as pasted, unless it holds a credential.
  const share = useMemo<ShareEncoding>(() => (report ? encodeApiPathShare({ input: text }, r, report) : NOTHING), [report, r, text]); // the encoding
  // The first secret-looking name with a value, named in the popover in place of the plain caution.
  const maybe = useMemo(() => (report ? firstSharePlace(report.maybe) : null), [report]); // or null

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="oas-json">
            {t("inputLabel")}
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
        <textarea id="oas-json" className="cidr-input mono json-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("placeholder")} rows={9} autoComplete="off" spellCheck={false} />
        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {r && !r.ok && (
        <p className="cidr-error" role="alert">
          {r.error}
        </p>
      )}
      {r && r.ok && !r.recognized && (
        <p className="cidr-error" role="alert">
          {t("unrecognized")}
        </p>
      )}

      {r && r.recognized && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">
              <span className="jwt-badge mono">OpenAPI {r.version}</span>
              {r.title ? ` ${r.title}` : ""}
            </h4>
            <p className="cipher-note">
              {t("summaryLine", { paths: r.summary.paths, operations: r.summary.operations, unauthenticated: r.summary.unauthenticated, pathParams: r.summary.withPathParams, deprecated: r.summary.deprecated })}
            </p>
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("schemesLabel")}</span>
              <span className="jwt-claim-value mono">{r.securitySchemes.length ? r.securitySchemes.join(", ") : t("schemesNone")}</span>
            </div>
            {r.flags.map((f, i) => (
              <p className="cipher-note" key={i}>
                ⚠ {t(`flag.${f.code}`, f.params)}
              </p>
            ))}
          </section>

          {/* Share results (2026-11-01): under the summary, before the long list of operations, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton
              encoding={share}
              carries={t("share.carries")}
              details={[maybe ? t("share.maybeSecret", { line: maybe.line, label: maybe.label, more: maybe.more }) : t("share.caution")]}
              blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""}
              title={t("name")}
            />
          </div>

          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("opsTitle")}</h4>
            {r.operations.map((op, i) => (
              <div className="jwt-claim-row" key={i}>
                <span className="jwt-claim-label">
                  <span className="jwt-badge mono">{op.method}</span>
                </span>
                <span className="jwt-claim-value">
                  <span className="mono">{op.path}</span>{" "}
                  <span className={`jwt-badge mono ${op.authenticated ? "jwt-badge--ok" : "jwt-badge--bad"}`}>{op.authenticated ? t("badge.authenticated") : t("badge.unauthenticated")}</span>
                  {op.hasPathParam && <span className="jwt-badge mono jwt-badge--warn">{t("badge.pathParam")}</span>}
                  {op.deprecated && <span className="jwt-badge mono">{t("badge.deprecated")}</span>}
                  {op.summary ? <div>{op.summary}</div> : null}
                  <div className="mono" style={{ fontSize: "0.85em", opacity: 0.85 }}>
                    {op.params.length > 0 && (
                      <div>
                        {t("paramsLabel")}: {op.params.map((p) => `${p.name} (${p.location}${p.required ? " *" : ""})`).join(", ")}
                      </div>
                    )}
                    {op.hasRequestBody && (
                      <div>
                        {t("bodyLabel")}: {op.requestContentTypes.length ? op.requestContentTypes.join(", ") : "yes"}
                      </div>
                    )}
                    {op.responseCodes.length > 0 && (
                      <div>
                        {t("responsesLabel")}: {op.responseCodes.join(", ")}
                      </div>
                    )}
                    <div>
                      {t("securityLabel")}: {op.security.length ? op.security.join(", ") : t("opSecurityNone")}
                    </div>
                  </div>
                </span>
              </div>
            ))}
            <p className="cipher-note">{t("requiredLegend")}</p>
          </section>
        </div>
      )}
    </div>
  );
}
