// ============================================================================
// src/components/ToolFunding.tsx
// ----------------------------------------------------------------------------
// PER-TOOL FUNDING — the "support this tool" panel on a specific tool.
//
// DOUBLE-GATED: the `toolFunding` flag must be on AND the tool must have at least
// one configured funding link. Otherwise renders nothing. Distinct from the
// general TipJar: this is contextual to one tool and can name a concrete purpose.
//
// Server component; the funding data and the gate result are resolved by the
// parent and passed in. Links go direct to the provider in a new tab.
// ============================================================================

import type { FundingLink } from "@/config/toolFunding";

export interface ToolFundingCopy {
  title: string;
  pitch: string;
  purposeLabel: string;
}

interface ToolFundingProps {
  /** Resolved on the server: flag on AND the tool has funding links. */
  enabled: boolean;
  /** Optional concrete purpose for this tool. */
  purpose?: string;
  /** The active funding links. */
  links: FundingLink[];
  copy: ToolFundingCopy;
}

export default function ToolFunding({ enabled, purpose, links, copy }: ToolFundingProps) {
  if (!enabled || links.length === 0) return null;

  return (
    <section className="toolfund" aria-labelledby="toolfund-heading">
      <h3 id="toolfund-heading" className="toolfund-title">
        {copy.title}
      </h3>
      <p className="toolfund-pitch">{copy.pitch}</p>

      {/* Optional concrete purpose for this specific tool. */}
      {purpose && purpose.trim().length > 0 && (
        <p className="toolfund-purpose">
          <span className="toolfund-purpose-label mono">{copy.purposeLabel}</span>
          <span className="toolfund-purpose-text">{purpose}</span>
        </p>
      )}

      <div className="toolfund-links">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="toolfund-link"
          >
            {l.label}
          </a>
        ))}
      </div>
    </section>
  );
}
