// ============================================================================
// src/components/TipJar.tsx
// ----------------------------------------------------------------------------
// TIPJAR — renders the creator-support links, or nothing.
//
// DOUBLE-GATED, so it can never appear half-built:
//   1. The `tipJar` feature flag must be ON (the admin switch).
//   2. At least one provider must be enabled AND have a URL.
// If either is false, this renders nothing.
//
// 0% commission is stated plainly. Every link goes direct to the provider in a
// new tab. Server component; copy passed in from the parent's i18n context.
// ============================================================================

import { isEnabled } from "@/config/features";
import { activeTipProviders, hasActiveTipProviders } from "@/config/tipJar";

export interface TipJarCopy {
  heading: string;
  blurb: string;
  zeroCommission: string;
}

export default function TipJar({ copy }: { copy: TipJarCopy }) {
  // Gate 1: the feature flag.
  if (!isEnabled("tipJar")) return null;
  // Gate 2: at least one configured provider.
  if (!hasActiveTipProviders()) return null;

  const providers = activeTipProviders();

  return (
    <section className="tipjar" aria-labelledby="tipjar-heading">
      <h2 id="tipjar-heading" className="tipjar-heading">
        {copy.heading}
      </h2>
      <p className="tipjar-blurb">{copy.blurb}</p>

      <div className="tipjar-providers">
        {providers.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="tipjar-provider"
          >
            {p.label}
          </a>
        ))}
      </div>

      <p className="tipjar-note mono">{copy.zeroCommission}</p>
    </section>
  );
}
