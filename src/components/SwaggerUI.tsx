"use client";

// ============================================================================
// src/components/SwaggerUI.tsx
// ----------------------------------------------------------------------------
// THE STOCK SWAGGER UI VIEW (the second view on the /api page).
//
// Loads the SELF-HOSTED Swagger UI assets from /vendor/swagger-ui/ (vendored
// into the repo, pinned to a known-good swagger-ui-dist build). They must be
// same-origin: the site CSP is
// script-src 'self' / style-src 'self', so a CDN would be blocked. The spec is
// loaded from /openapi.json.
//
// DOCUMENTATION-ONLY: the site does not serve the API (the endpoints are
// implemented but dormant — see the /api page). Swagger UI is therefore
// initialised with supportedSubmitMethods: [] so there are NO "try it out"
// controls; it is a spec browser, not a request console. Nothing here calls a
// live endpoint.
//
// Mounted only when its tab is selected (so the ~1.5 MB bundle loads lazily).
// If the bundle fails to load or initialise, it degrades to a message plus the
// raw spec download, so the page is never left blank.
// ============================================================================

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// Minimal shape of the global the self-hosted bundle exposes.
interface SwaggerUIBundleFn {
  (opts: Record<string, unknown>): unknown;
  presets: { apis: unknown };
}
declare global {
  interface Window {
    SwaggerUIBundle?: SwaggerUIBundleFn;
  }
}

const CSS_HREF = "/vendor/swagger-ui/swagger-ui.css";
const JS_SRC = "/vendor/swagger-ui/swagger-ui-bundle.js";

export default function SwaggerUI() {
  const t = useTranslations("api");
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Inject the stylesheet once (self-hosted; allowed by style-src 'self').
    if (!document.querySelector(`link[href="${CSS_HREF}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS_HREF;
      document.head.appendChild(link);
    }

    function init() {
      if (cancelled || !ref.current || !window.SwaggerUIBundle) return;
      try {
        window.SwaggerUIBundle({
          url: "/openapi.json",
          domNode: ref.current,
          presets: [window.SwaggerUIBundle.presets.apis],
          layout: "BaseLayout",
          deepLinking: false,
          // DOCUMENTATION-ONLY / INERT. The endpoints are implemented but the
          // site does not serve the API (see the /api page copy for why). An
          // empty supportedSubmitMethods removes every "Try it out" control, so
          // Swagger UI renders as a pure, honest spec browser rather than
          // offering request buttons that would fail against a dormant API.
          supportedSubmitMethods: [],
          tryItOutEnabled: false,
        });
      } catch {
        setFailed(true);
      }
    }

    if (window.SwaggerUIBundle) {
      init();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${JS_SRC}"]`,
      );
      if (existing) {
        existing.addEventListener("load", init);
        if (window.SwaggerUIBundle) init();
      } else {
        const script = document.createElement("script");
        script.src = JS_SRC;
        script.async = true;
        script.onload = init;
        script.onerror = () => setFailed(true);
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <p className="apiref-status">
        {t("swaggerLoadError")}{" "}
        <a className="apiref-link" href="/openapi.yaml" download="openapi.yaml">
          {t("downloadSpec")}
        </a>
      </p>
    );
  }

  return <div className="swagger-ui-host" ref={ref} />;
}
