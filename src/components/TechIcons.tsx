// ============================================================================
// src/components/TechIcons.tsx
// ----------------------------------------------------------------------------
// ORIGINAL TECHNOLOGY ICONOGRAPHY — hand-drawn SVG icons representing the kinds
// of systems worked on across the vendor history (switch, router, firewall,
// load balancer, metro node, gateway, WLAN). All geometry is original and
// generic; these depict technical concepts, not any vendor's branding.
//
// Used as visual accents in the vendor-page hero. Each icon is a small inline
// SVG that inherits color from currentColor, so it picks up the accent token.
// Server-safe (pure presentational SVG, no client state).
// ============================================================================

import type { CSSProperties, ReactElement } from "react";

export type TechIconName =
  | "switch"
  | "router"
  | "firewall"
  | "loadbalancer"
  | "metro"
  | "gateway"
  | "wlan";

interface TechIconProps {
  name: TechIconName;
  size?: number;
  style?: CSSProperties;
  className?: string;
}

// Each icon draws on a 24x24 grid with a 1.5 stroke, currentColor.
const PATHS: Record<TechIconName, ReactElement> = {
  // A network switch: a flat device with multiple ports.
  switch: (
    <>
      <rect x="2" y="8" width="20" height="8" rx="1.5" />
      <path d="M5 16v2M9 16v2M13 16v2M17 16v2M5 6v2M9 6v2M13 6v2M17 6v2" />
    </>
  ),
  // A router: a box with bidirectional routing arrows.
  router: (
    <>
      <rect x="2" y="13" width="20" height="7" rx="1.5" />
      <circle cx="6" cy="16.5" r="0.8" />
      <path d="M9 3l3-1 3 1M12 2v8M16 5l1 3-3 1M8 5L7 8l3 1" />
    </>
  ),
  // A firewall: a brick wall with a flame mark.
  firewall: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="1" />
      <path d="M3 11h18M3 15.5h18M9 6v5M15 6v5M6.5 11v4.5M12 11v4.5M17.5 11v4.5M9 15.5V20M15 15.5V20" />
    </>
  ),
  // A load balancer: one input fanning to several backends.
  loadbalancer: (
    <>
      <circle cx="4" cy="12" r="2" />
      <circle cx="20" cy="5" r="2" />
      <circle cx="20" cy="12" r="2" />
      <circle cx="20" cy="19" r="2" />
      <path d="M6 12h4M10 12l8-6M10 12h8M10 12l8 6" />
    </>
  ),
  // A metropolitan-area node: connected rings.
  metro: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="4" r="1.6" />
      <circle cx="12" cy="20" r="1.6" />
      <circle cx="4.5" cy="8" r="1.6" />
      <circle cx="19.5" cy="8" r="1.6" />
      <circle cx="4.5" cy="16" r="1.6" />
      <circle cx="19.5" cy="16" r="1.6" />
      <path d="M12 9V5.6M12 15v3.4M9.5 10.5L6 8.8M14.5 10.5L18 8.8M9.5 13.5L6 15.2M14.5 13.5L18 15.2" />
    </>
  ),
  // A secure gateway: a shield over a connection.
  gateway: (
    <>
      <path d="M12 2l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V5z" />
      <path d="M9 11l2 2 4-4" />
    </>
  ),
  // WLAN: a wireless access point radiating signal.
  wlan: (
    <>
      <path d="M12 20v-6" />
      <circle cx="12" cy="12" r="1.4" />
      <path d="M8.5 8.5a5 5 0 017 0M6 6a8.5 8.5 0 0112 0" />
    </>
  ),
};

export default function TechIcon({ name, size = 24, style, className }: TechIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
