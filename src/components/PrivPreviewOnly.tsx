"use client";

// ============================================================================
// src/components/PrivPreviewOnly.tsx
// ----------------------------------------------------------------------------
// Renders its children only when privileged preview is active; otherwise null.
// Used to keep work-in-progress or internal surfaces (e.g. the admin console)
// DARK BY DEFAULT: invisible to ordinary visitors, revealed only for a
// privileged operator who supplies the preview token.
//
// HONEST SCOPE (same as usePrivPreview): render-only, NOT a security boundary.
// On a static export the wrapped children are still serialized into the page's
// hydration data even while visually hidden, and devtools can flip the flag.
// So this hides content by default; it does not protect secrets. Anything truly
// sensitive must not be rendered/serialized at all (mask or omit it upstream),
// or must live behind the real server-side layer.
// ============================================================================

import { usePrivPreview } from "@/lib/preview/usePrivPreview";

export default function PrivPreviewOnly({ children }: { children: React.ReactNode }) {
  const preview = usePrivPreview();
  if (!preview) return null;
  return <>{children}</>;
}
