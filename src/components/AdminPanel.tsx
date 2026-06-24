"use client";

// ============================================================================
// src/components/AdminPanel.tsx
// ----------------------------------------------------------------------------
// ADMIN PANEL (SCAFFOLD) — the control surface for the site's settings.
//
// WHAT THIS IS: a real, config-backed scaffold of the admin panel. It reads the
// CURRENT values from the config modules (features, lead routing, contact,
// TipJar) and renders them as an organized control surface with working widgets
// (toggle switches, etc.).
//
// WHAT IT IS NOT (yet): a live controller. This site is a static export with no
// backend, so toggling a switch here changes only this in-session preview, not
// the deployed site (which reads build-time config). That is stated plainly in
// the banner. When the closed-service layer exists, these same controls bind to
// it and become live, this component is built so that is a wiring change, not a
// rewrite.
//
// All values are passed in from the server page (which can read the config),
// keeping this component a pure, presentational control surface over that data.
// ============================================================================

import { useState } from "react";

// The shapes of the settings this panel surfaces (mirrors the config modules).
export interface AdminFeatureFlag {
  key: string;
  label: string;
  description: string;
  value: boolean;
}
export interface AdminRoutingRow {
  scope: string; // "Global default" | platform | course
  destination: string;
}
export interface AdminTipProvider {
  label: string;
  enabled: boolean;
  configured: boolean;
}
export interface AdminAccessIdentity {
  email: string; // already masked by the server
  idp: string;
  role: string;
}
export interface AdminAccess {
  federatedOnly: boolean;
  identities: AdminAccessIdentity[];
  permissions: string[];
}
export interface AdminData {
  features: AdminFeatureFlag[];
  routingDefault: string;
  routingOverrides: AdminRoutingRow[];
  contactEmail: string;
  contactFormMode: string; // "mailto fallback" | endpoint
  tipProviders: AdminTipProvider[];
  access: AdminAccess;
}

export interface AdminCopy {
  previewBanner: string;
  featuresTitle: string;
  routingTitle: string;
  routingDefaultLabel: string;
  routingNoOverrides: string;
  contactTitle: string;
  contactEmailLabel: string;
  contactFormLabel: string;
  tipJarTitle: string;
  tipConfigured: string;
  tipNotConfigured: string;
  on: string;
  off: string;
  accessTitle: string;
  accessNote: string;
  accessFederatedOnly: string;
  accessRoleLabel: string;
  accessPermsLabel: string;
}

// A presentational toggle that reflects/edits in-session state only.
function Toggle({
  on,
  onToggle,
  labelOn,
  labelOff,
}: {
  on: boolean;
  onToggle: () => void;
  labelOn: string;
  labelOff: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={"admin-toggle" + (on ? " admin-toggle--on" : "")}
    >
      <span className="admin-toggle-track">
        <span className="admin-toggle-thumb" />
      </span>
      <span className="admin-toggle-label mono">{on ? labelOn : labelOff}</span>
    </button>
  );
}

export default function AdminPanel({ data, copy }: { data: AdminData; copy: AdminCopy }) {
  // In-session copy of the feature flags (preview only).
  const [features, setFeatures] = useState(data.features);

  function toggleFeature(key: string) {
    setFeatures((prev) =>
      prev.map((f) => (f.key === key ? { ...f, value: !f.value } : f))
    );
  }

  return (
    <div className="admin">
      <p className="admin-banner">{copy.previewBanner}</p>

      {/* Access control (model only; enforced by the service layer) */}
      <section className="admin-section">
        <h2 className="admin-section-title">{copy.accessTitle}</h2>
        <p className="admin-access-note">{copy.accessNote}</p>
        <ul className="admin-rows">
          {data.access.identities.map((id, i) => (
            <li className="admin-row" key={i}>
              <span className="admin-row-scope mono">{id.email}</span>
              <span className="admin-access-meta">
                <span className="admin-access-idp">{id.idp}</span>
                <span className="admin-access-role mono">{id.role}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="admin-access-facts">
          {data.access.federatedOnly && (
            <span className="admin-access-fact mono">{copy.accessFederatedOnly}</span>
          )}
          <div className="admin-access-perms">
            <span className="admin-access-perms-label">{copy.accessPermsLabel}</span>
            <span className="admin-access-perms-list mono">
              {data.access.permissions.join(" · ")}
            </span>
          </div>
        </div>
      </section>

      {/* Feature flags */}
      <section className="admin-section">
        <h2 className="admin-section-title">{copy.featuresTitle}</h2>
        <ul className="admin-flags">
          {features.map((f) => (
            <li className="admin-flag" key={f.key}>
              <div className="admin-flag-text">
                <span className="admin-flag-label">{f.label}</span>
                <span className="admin-flag-desc">{f.description}</span>
              </div>
              <Toggle
                on={f.value}
                onToggle={() => toggleFeature(f.key)}
                labelOn={copy.on}
                labelOff={copy.off}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Lead routing */}
      <section className="admin-section">
        <h2 className="admin-section-title">{copy.routingTitle}</h2>
        <div className="admin-kv">
          <span className="admin-kv-key">{copy.routingDefaultLabel}</span>
          <span className="admin-kv-val">{data.routingDefault}</span>
        </div>
        {data.routingOverrides.length === 0 ? (
          <p className="admin-muted">{copy.routingNoOverrides}</p>
        ) : (
          <ul className="admin-rows">
            {data.routingOverrides.map((r, i) => (
              <li className="admin-row" key={i}>
                <span className="admin-row-scope mono">{r.scope}</span>
                <span className="admin-row-dest">{r.destination}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Contact */}
      <section className="admin-section">
        <h2 className="admin-section-title">{copy.contactTitle}</h2>
        <div className="admin-kv">
          <span className="admin-kv-key">{copy.contactEmailLabel}</span>
          <span className="admin-kv-val mono">{data.contactEmail}</span>
        </div>
        <div className="admin-kv">
          <span className="admin-kv-key">{copy.contactFormLabel}</span>
          <span className="admin-kv-val">{data.contactFormMode}</span>
        </div>
      </section>

      {/* TipJar */}
      <section className="admin-section">
        <h2 className="admin-section-title">{copy.tipJarTitle}</h2>
        <ul className="admin-rows">
          {data.tipProviders.map((p, i) => (
            <li className="admin-row" key={i}>
              <span className="admin-row-scope">{p.label}</span>
              <span className="admin-row-dest mono">
                {p.configured ? copy.tipConfigured : copy.tipNotConfigured}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
