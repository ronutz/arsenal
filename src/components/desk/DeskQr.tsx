"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskQr.tsx
// ----------------------------------------------------------------------------
// A QR CODE DRAWN AS SVG, from the in-house encoder (src/lib/desk/qr.ts), for
// pairing another browser with My desk's sync. Dark modules on a light ground
// with a four-module quiet zone, whatever the theme: a reader's camera needs
// that contrast, so these two colours are fixed on purpose (black and white),
// not theme tokens. One path for all dark modules; crisp edges. The link it
// encodes is written beside it by the caller, so the code is never the only
// way.
// ============================================================================

// React's memo.
import { useMemo } from "react";
// The encoder.
import { encodeQr } from "@/lib/desk/qr";

/**
 * The QR code.
 *
 * @param props the text to encode and the accessible name
 * @returns the SVG
 */
export default function DeskQr(props: { text: string; label: string }) {
  // The matrix and its drawing, made once per text.
  const { size, d } = useMemo(() => {
    // Encoded.
    const q = encodeQr(props.text);
    // One square per dark module, offset by the quiet zone.
    const parts: string[] = [];
    // Every module.
    q.modules.forEach((row, y) => row.forEach((dark, x) => { if (dark) parts.push(`M${x + 4} ${y + 4}h1v1h-1z`); }));
    // The side with the quiet zone, and the path.
    return { size: q.size + 8, d: parts.join("") };
  }, [props.text]);
  // Drawn.
  return (
    <svg className="desk-qr" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={props.label} shapeRendering="crispEdges">
      <rect width={size} height={size} fill="#ffffff" />
      <path d={d} fill="#000000" />
    </svg>
  );
}
