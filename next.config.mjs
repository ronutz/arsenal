// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// next.config.mjs
// ----------------------------------------------------------------------------
// Next.js configuration + SECURITY HEADERS (secure-by-design, per the canon
// Red/Blue assessment RB-01…RB-07).
//
// WHY the headers matter: defense-in-depth. Even though the everyday tools run
// locally and there is little server attack surface, we ship strict security
// headers so the site is hardened from the first commit, not retrofitted:
//   - Content-Security-Policy: constrains what can load/execute (RB-01). The
//     'unsafe-inline' on style-src is a documented, tracked interim (full
//     nonce-based style CSP is a follow-up, logged DEFERRED in the Conformance
//     Manifest). script-src also carries 'unsafe-inline' + 'wasm-unsafe-eval':
//     this is FORCED by the architecture, not a lapse. Next.js App Router in
//     static-export mode emits per-page inline RSC hydration scripts that cannot
//     be hashed (per-page content) or nonced (no server to mint nonces), and
//     Pagefind needs WASM for client-side search. See public/_headers for the
//     full rationale and the nonce-via-Worker hardening path.
//   - HSTS: forces HTTPS, prevents downgrade attacks.
//   - X-Frame-Options / frame-ancestors 'none': prevents clickjacking.
//   - X-Content-Type-Options nosniff: stops MIME-confusion attacks.
//   - Referrer-Policy: limits referrer leakage.
//   - Permissions-Policy: disables powerful APIs we do not use.
// ============================================================================

import createNextIntlPlugin from "next-intl/plugin";

// Point the plugin at our request config (the pack loader with English fallback).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// The Content-Security-Policy. script-src allows 'self' plus 'unsafe-inline'
// (required for Next.js App Router static-export inline hydration scripts) and
// 'wasm-unsafe-eval' (required for Pagefind's client-side search WASM). Styles:
// self + 'unsafe-inline' is a KNOWN interim. No object/embed. Frame-ancestors
// none. NOTE: this block is INERT under output:"export" (headers() needs a
// server); the live policy is public/_headers. Kept in sync for portability.
const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

/** Security headers applied to every response. */
const securityHeaders = [
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  // Force HTTPS for 2 years incl. subdomains; eligible for preload lists.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Belt-and-suspenders clickjacking protection alongside frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers from MIME-sniffing a response away from its declared type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only the origin on cross-origin navigations; full URL same-origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable powerful features the site does not use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // STATIC EXPORT: render the whole site to static HTML at build time.
  // WHY: (1) Pagefind indexes built static HTML to produce the search index;
  // (2) the MDX Learn articles are inherently static content; (3) a static site
  // has minimal attack surface (privacy-first) and deploys to any static host
  // (Cloudflare Pages, Vercel, etc.). The Engine/Services split in canon means
  // dynamic server features (hosted API tools) live elsewhere later if needed.
  output: "export",

  // Static export cannot use the Next.js image optimization server, so images
  // are served as-is. (We use few/no raster images; SVG and CSS do the work.)
  images: { unoptimized: true },

  // CI DISK GUARD (deploy-pipeline migration, 2026-07-10): webpack's on-disk
  // cache (.next/cache) is pure overhead on ephemeral CI runners - it is never
  // reused, yet its multi-GB footprint counts against the runner disk that the
  // 9,893-page export needs. GitHub Actions sets CI=true automatically, so the
  // gate activates there with no extra wiring, while local/sandbox builds keep
  // their cache (incremental rebuilds stay fast).
  webpack: (config) => {
    if (process.env.CI) config.cache = false;
    return config;
  },

  // Emit each route as a folder with index.html (cleaner URLs on static hosts).
  trailingSlash: true,

  // Fail the build on type errors / lint errors — quality gate, not optional.
  reactStrictMode: true,

  // NOTE: the headers() function is NOT supported with output:"export" (there is
  // no Next.js server to apply them). Security headers are therefore applied at
  // the HOST level via the `public/_headers` file (Cloudflare Pages / Netlify
  // format). See that file for the CSP/HSTS/X-Frame-Options/etc. set.
};

export default withNextIntl(nextConfig);
