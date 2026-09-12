// ============================================================================
// src/app/[locale]/about/layout.tsx
// ----------------------------------------------------------------------------
// Carries schema.org/Person across /about AND EVERY PAGE BENEATH IT - the era
// pages and the credentials page - which is what PRIME asked for on
// 2026-09-11.
//
// A layout rather than five per-page edits: a descendant added later inherits
// it automatically, so the coverage cannot quietly fall behind the section it
// describes. The layout adds no markup of its own; it exists only to emit the
// JSON-LD alongside whatever the page renders.
// ============================================================================

import { PersonSchema } from "@/components/PersonSchema";

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PersonSchema />
      {children}
    </>
  );
}
