"use client";

// ============================================================================
// src/components/ApiReference.tsx
// ----------------------------------------------------------------------------
// THE ON-BRAND API REFERENCE.
//
// Renders the OpenAPI spec (fetched from /openapi.json, same-origin, which the
// site CSP's connect-src 'self' allows) using the site's own design tokens, so
// it themes with everything else, including the dedicated "Swagger" theme. It is
// a deliberately small, readable renderer covering exactly what this spec uses
// (paths -> operations, parameters, responses, component schemas), not a full
// OpenAPI UI. The stock Swagger UI view is a separate, self-hosted addition.
//
// "Try it" calls the live endpoint by RELATIVE path (derived from the server's
// URL path), so it works on any origin where the Worker is deployed (production
// and previews alike) without tripping connect-src 'self'.
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

// --- Minimal shapes for the parts of the spec this renderer reads. ----------
interface SchemaObject {
  type?: string;
  description?: string;
  required?: string[];
  properties?: Record<string, SchemaObject>;
  $ref?: string;
  pattern?: string;
  examples?: unknown[];
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
}
interface ParameterObject {
  name: string;
  in: string;
  required?: boolean;
  description?: string;
  schema?: SchemaObject;
  examples?: Record<string, { summary?: string; value: unknown }>;
}
interface MediaType {
  schema?: SchemaObject;
  example?: unknown;
}
interface ResponseObject {
  description?: string;
  content?: Record<string, MediaType>;
}
interface Operation {
  tags?: string[];
  operationId?: string;
  summary?: string;
  description?: string;
  externalDocs?: { description?: string; url: string };
  parameters?: ParameterObject[];
  responses?: Record<string, ResponseObject>;
}
interface OpenApiSpec {
  info: {
    title: string;
    version: string;
    summary?: string;
    description?: string;
    license?: { name: string; url?: string };
  };
  servers?: { url: string; description?: string }[];
  paths: Record<string, Record<string, Operation>>;
  components?: { schemas?: Record<string, SchemaObject> };
}

const METHOD_ORDER = ["get", "post", "put", "patch", "delete", "options", "head"];

/** Resolve "#/components/schemas/Name" to "Name". */
function refName(ref?: string): string | null {
  if (!ref) return null;
  const parts = ref.split("/");
  return parts[parts.length - 1] || null;
}

/** Render a value as pretty JSON. */
function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export default function ApiReference() {
  const t = useTranslations("api");
  const [spec, setSpec] = useState<OpenApiSpec | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/openapi.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data: OpenApiSpec) => {
        if (alive) setSpec(data);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // The relative base path (e.g. "/api/v1") for same-origin try-it calls.
  const basePath = useMemo(() => {
    const url = spec?.servers?.[0]?.url;
    if (!url) return "";
    try {
      return new URL(url).pathname.replace(/\/$/, "");
    } catch {
      return "";
    }
  }, [spec]);

  if (error) return <p className="apiref-status">{t("loadError")}</p>;
  if (!spec) return <p className="apiref-status">{t("loading")}</p>;

  const schemas = spec.components?.schemas ?? {};

  return (
    <div className="apiref">
      {/* Server / base URL + auth summary. */}
      <div className="apiref-meta">
        <div>
          <span className="apiref-meta-label">{t("baseUrlLabel")}</span>
          <code className="apiref-code">{spec.servers?.[0]?.url}</code>
        </div>
        <div>
          <span className="apiref-meta-label">{t("authLabel")}</span>
          <span>{t("authValue")}</span>
        </div>
      </div>

      {/* Operations. */}
      {Object.entries(spec.paths).map(([path, methods]) =>
        Object.entries(methods)
          .sort(
            (a, b) => METHOD_ORDER.indexOf(a[0]) - METHOD_ORDER.indexOf(b[0]),
          )
          .map(([method, op]) => (
            <Operation
              key={`${method} ${path}`}
              method={method}
              path={path}
              op={op}
              basePath={basePath}
              t={t}
            />
          )),
      )}

      {/* Schemas. */}
      {Object.keys(schemas).length > 0 && (
        <section className="apiref-schemas">
          <h2 className="apiref-h2">{t("schemasTitle")}</h2>
          {Object.entries(schemas).map(([name, schema]) => (
            <SchemaTable key={name} name={name} schema={schema} t={t} />
          ))}
        </section>
      )}
    </div>
  );
}

// --- One operation card -----------------------------------------------------
function Operation({
  method,
  path,
  op,
  basePath,
  t,
}: {
  method: string;
  path: string;
  op: Operation;
  basePath: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const queryParams = (op.parameters ?? []).filter((p) => p.in === "query");
  const canTry = method === "get";

  return (
    <section className="apiref-op">
      <div className="apiref-op-head">
        <span className={`apiref-method apiref-method-${method}`}>
          {method.toUpperCase()}
        </span>
        <code className="apiref-path">{path}</code>
      </div>
      {op.summary && <p className="apiref-summary">{op.summary}</p>}
      {op.description && <p className="apiref-desc">{op.description}</p>}
      {op.externalDocs && (
        <p className="apiref-desc">
          <a
            className="apiref-link"
            href={op.externalDocs.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {op.externalDocs.description ?? op.externalDocs.url}
          </a>
        </p>
      )}

      {/* Parameters */}
      {(op.parameters?.length ?? 0) > 0 && (
        <div className="apiref-block">
          <h3 className="apiref-h3">{t("paramsTitle")}</h3>
          <table className="apiref-table">
            <thead>
              <tr>
                <th>{t("fieldLabel")}</th>
                <th>{t("typeLabel")}</th>
                <th>{t("descriptionLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {op.parameters!.map((p) => (
                <tr key={p.name}>
                  <td>
                    <code className="apiref-code">{p.name}</code>
                    {p.required && (
                      <span className="apiref-required">
                        {" "}
                        {t("requiredLabel")}
                      </span>
                    )}
                  </td>
                  <td className="apiref-type">{p.schema?.type ?? "any"}</td>
                  <td>{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Responses */}
      {op.responses && (
        <div className="apiref-block">
          <h3 className="apiref-h3">{t("responsesTitle")}</h3>
          {Object.entries(op.responses).map(([status, resp]) => {
            const media = resp.content?.["application/json"];
            const schema = refName(media?.schema?.$ref);
            return (
              <div key={status} className="apiref-response">
                <div className="apiref-response-head">
                  <span
                    className={`apiref-status-code apiref-status-${status[0]}xx`}
                  >
                    {status}
                  </span>
                  <span>{resp.description}</span>
                  {schema && (
                    <code className="apiref-schema-ref">{schema}</code>
                  )}
                </div>
                {media?.example !== undefined && (
                  <pre className="apiref-pre">{pretty(media.example)}</pre>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Try it (GET only) */}
      {canTry && <TryIt path={path} basePath={basePath} params={queryParams} t={t} />}
    </section>
  );
}

// --- Live try-it panel ------------------------------------------------------
function TryIt({
  path,
  basePath,
  params,
  t,
}: {
  path: string;
  basePath: string;
  params: ParameterObject[];
  t: ReturnType<typeof useTranslations>;
}) {
  // Seed each input from the parameter's first declared example, if any.
  const initial = useMemo(() => {
    const seed: Record<string, string> = {};
    for (const p of params) {
      const first = p.examples ? Object.values(p.examples)[0] : undefined;
      seed[p.name] = first ? String(first.value) : "";
    }
    return seed;
  }, [params]);

  const [values, setValues] = useState<Record<string, string>>(initial);
  const [built, setBuilt] = useState<string | null>(null);

  // INERT / DOCUMENTATION-ONLY. The site does not serve the API (endpoints are
  // implemented but dormant — see the /api page copy). So this panel does NOT
  // call the network. Instead it BUILDS the exact request URL you would send
  // once the API is live, and shows it, so the panel stays educational (you can
  // see precisely what the endpoint expects) without pretending to run.
  function build() {
    const qs = new URLSearchParams();
    for (const p of params) if (values[p.name]) qs.set(p.name, values[p.name]);
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ronutz.com";
    setBuilt(`GET ${origin}${basePath}${path}${qs.toString() ? `?${qs}` : ""}`);
  }

  return (
    <div className="apiref-block apiref-tryit">
      <h3 className="apiref-h3">{t("tryItTitle")}</h3>
      <div className="apiref-tryit-form">
        {params.map((p) => (
          <label key={p.name} className="apiref-tryit-field">
            <span className="apiref-tryit-label">{p.name}</span>
            <input
              className="apiref-input"
              type="text"
              value={values[p.name] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [p.name]: e.target.value }))
              }
              spellCheck={false}
              autoComplete="off"
            />
          </label>
        ))}
        <button
          className="apiref-send"
          type="button"
          onClick={build}
        >
          {t("tryItSend")}
        </button>
      </div>
      <p className="apiref-tryit-hint">{t("tryItHint")}</p>
      {built && (
        <div className="apiref-result">
          <pre className="apiref-pre">{built}</pre>
        </div>
      )}
    </div>
  );
}

// --- A component schema as a field table ------------------------------------
function SchemaTable({
  name,
  schema,
  t,
}: {
  name: string;
  schema: SchemaObject;
  t: ReturnType<typeof useTranslations>;
}) {
  const required = new Set(schema.required ?? []);
  const props = schema.properties ?? {};
  return (
    <div className="apiref-block">
      <h3 className="apiref-h3">
        <code className="apiref-code">{name}</code>
      </h3>
      {schema.description && <p className="apiref-desc">{schema.description}</p>}
      <table className="apiref-table">
        <thead>
          <tr>
            <th>{t("fieldLabel")}</th>
            <th>{t("typeLabel")}</th>
            <th>{t("descriptionLabel")}</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(props).map(([field, fieldSchema]) => (
            <tr key={field}>
              <td>
                <code className="apiref-code">{field}</code>
                {required.has(field) && (
                  <span className="apiref-required"> {t("requiredLabel")}</span>
                )}
              </td>
              <td className="apiref-type">{fieldSchema.type ?? "any"}</td>
              <td>{fieldSchema.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
