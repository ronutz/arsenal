"use client";

// ============================================================================
// src/components/ApiAffordance.tsx
// ----------------------------------------------------------------------------
// The in-page "Also available as an API" affordance shown beneath a tool. It is
// entirely driven by src/config/apiSurface.ts: it asks that config which
// features (endpoint / curl / docs / tryIt) are surfaced for this tool and, if
// none are, renders NOTHING. With the config currently all-off, this component
// is invisible on every page. Turning it on is a config edit, not a code edit.
//
// SCOUT (copy) lives entirely in the i18n "apiAffordance" namespace so wording
// can be revised without touching this file. PRISM (visual) lives entirely in
// the .api-affordance CSS in src/app/components.css and references only semantic
// theme tokens, so restyling never touches this file either. The markup here is
// deliberately minimal and quiet: a native <details> disclosure that stays
// collapsed and muted until a reader opens it.
//
// PRIVILEGED PREVIEW: a render-only authoring aid. A privileged operator can add
// ?priv=<token> to a URL to preview every affordance while the surface is still
// globally off. This reveals UI only; it is compared client-side against a
// build-time env token and is NEVER consulted by the Worker, so it does not open
// the API. It is not a security boundary and is documented as such. It is
// hardened (hashing + session persistence) separately; with the env unset it is
// inert, so preview never activates and the panel stays dark.
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePrivPreview } from "@/lib/preview/usePrivPreview";
import {
  API_SURFACE,
  surfacedFeatures,
  gateForApiFeature,
} from "@/config/apiSurface";

/** Origin used to build absolute example URLs shown in the curl snippet. */
const API_ORIGIN = "https://ronutz.com";

/**
 * Tools whose API takes a JSON request body (POST) rather than a `?input=`
 * query string (GET). Kept as a small local constant so this client component
 * never imports the heavy engine registry. Source of truth: the tool registry's
 * `structured: true` entries; keep in sync when a structured tool is added.
 */
const STRUCTURED_SLUGS = new Set<string>([
  "f5-bigip-tcpdump-builder",
  "cert-renewal-planner",
  "csr-decoder",
  "diff",
  "hmac",
  "totp-hotp",
]);

// usePrivPreview now lives in src/lib/preview/usePrivPreview.ts (imported above),
// hardened with a hashed token, session persistence, and an off-switch.

export interface ApiAffordanceProps {
  /** Tool slug, matching the API path /api/v1/<slug> and the config key. */
  slug: string;
  /**
   * Optional realistic example input for the curl snippet. For string tools this
   * is the raw `input` value; for structured tools it is a JSON string body.
   * When omitted a neutral placeholder is shown.
   */
  example?: string;
}

export default function ApiAffordance({ slug, example }: ApiAffordanceProps) {
  // Hooks first, unconditionally, before any early return.
  const preview = usePrivPreview();
  const t = useTranslations("apiAffordance");
  const [copied, setCopied] = useState(false);

  // Ask the config what is surfaced for this tool. Nothing => render nothing.
  const features = surfacedFeatures(API_SURFACE, slug, { preview });
  if (features.length === 0) return null;

  const show = (f: "endpoint" | "curl" | "docs" | "tryIt") => features.includes(f);
  const structured = STRUCTURED_SLUGS.has(slug);
  const endpointUrl = `${API_ORIGIN}/api/v1/${slug}`;

  // Build a copy-paste example appropriate to the tool's input style.
  const curl = structured
    ? `curl -X POST "${endpointUrl}" \\\n  -H "content-type: application/json" \\\n  -d '${example ?? "{ }"}'`
    : `curl "${endpointUrl}?input=${encodeURIComponent(example ?? "VALUE")}"`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(curl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable; no-op */
    }
  };

  // A gate id may be attached even while a feature is surfaced; expose it as a
  // data attribute so styling/telemetry can react later without more markup.
  const gate = gateForApiFeature(API_SURFACE, slug, "endpoint");

  return (
    <details className="api-affordance" data-gate={gate ?? undefined}>
      <summary className="api-affordance-summary">
        <span className="api-affordance-glyph" aria-hidden="true">
          {"</>"}
        </span>
        <span className="api-affordance-label">{t("label")}</span>
        {preview && <span className="api-affordance-preview">{t("previewBadge")}</span>}
      </summary>

      <div className="api-affordance-body">
        <p className="api-affordance-tagline">{t("tagline")}</p>

        {show("endpoint") && (
          <div className="api-affordance-row">
            <span className="api-affordance-rowlabel">{t("endpointLabel")}</span>
            <a className="api-affordance-endpoint" href={endpointUrl}>
              <code>{endpointUrl}</code>
            </a>
          </div>
        )}

        {show("curl") && (
          <div className="api-affordance-curl">
            <div className="api-affordance-curlhead">
              <span className="api-affordance-rowlabel">{t("curlLabel")}</span>
              <button type="button" className="api-affordance-copy" onClick={onCopy}>
                {copied ? t("copied") : t("copy")}
              </button>
            </div>
            <pre className="api-affordance-pre">
              <code>{curl}</code>
            </pre>
          </div>
        )}

        {(show("docs") || show("tryIt")) && (
          <div className="api-affordance-links">
            {show("docs") && (
              <Link className="api-affordance-doclink" href="/api">
                {t("docsLabel")}
              </Link>
            )}
            {show("tryIt") && (
              <Link className="api-affordance-doclink" href="/api">
                {t("tryItLabel")}
              </Link>
            )}
          </div>
        )}

        <p className="api-affordance-privacy">{t("privacyNote")}</p>
      </div>
    </details>
  );
}
