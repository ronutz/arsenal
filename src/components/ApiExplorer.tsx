"use client";

// ============================================================================
// src/components/ApiExplorer.tsx
// ----------------------------------------------------------------------------
// Holds the two views of the API and a tab toggle between them: the on-brand
// Reference (default) and the stock Swagger UI. Swagger UI is mounted only when
// its tab is active, so its large bundle is fetched lazily and the default load
// stays light. Reference always works; Swagger UI is the opt-in second view.
// ============================================================================

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import ApiReference from "./ApiReference";
import SwaggerUI from "./SwaggerUI";

type View = "reference" | "swagger";

export default function ApiExplorer() {
  const t = useTranslations("api");
  const [view, setView] = useState<View>("reference");
  // When a tool page links here with ?op=<operationId>&tag=<tag>, open the
  // Swagger view and deep-link to that operation. Read once on mount.
  const [target, setTarget] = useState<{ op: string; tag: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const op = params.get("op");
    const tag = params.get("tag");
    if (op) {
      setTarget({ op, tag: tag ?? "" });
      setView("swagger");
    }
  }, []);

  return (
    <div className="api-explorer">
      <div className="api-viewtoggle" role="tablist" aria-label={t("referenceTitle")}>
        <button
          type="button"
          role="tab"
          aria-selected={view === "reference"}
          className={`api-viewtab${view === "reference" ? " is-active" : ""}`}
          onClick={() => setView("reference")}
        >
          {t("viewReference")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "swagger"}
          className={`api-viewtab${view === "swagger" ? " is-active" : ""}`}
          onClick={() => setView("swagger")}
        >
          {t("viewSwagger")}
        </button>
      </div>

      {view === "reference" ? (
        <ApiReference />
      ) : (
        <>
          <p className="api-swagger-caveat">{t("swaggerCaveat")}</p>
          <SwaggerUI target={target} />
        </>
      )}
    </div>
  );
}
