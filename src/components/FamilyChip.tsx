// ============================================================================
// src/components/FamilyChip.tsx
// ----------------------------------------------------------------------------
// A small family (category) tag: colored dot + text label. The hue arrives as
// a per-chip CSS custom property (--chip-color) so the stylesheet stays purely
// semantic; the label text uses theme tokens, keeping WCAG-AA contrast on all
// themes (the color itself is supplementary — see categoryColors.ts).
// Server-safe: no state, renders anywhere.
// ============================================================================

import { categoryColor } from "@/config/categoryColors";

export default function FamilyChip({
  category,
  label,
}: {
  /** Category key (drives the hue). */
  category: string;
  /** Localized label (from tools.categories.*). */
  label: string;
}) {
  return (
    <span
      className="family-chip"
      style={{ "--chip-color": categoryColor(category) } as React.CSSProperties}
    >
      <span className="family-chip-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
