// ============================================================================
// src/types/netcore.d.ts
// ----------------------------------------------------------------------------
// Ambient type declaration for @ronutz/netcore (the Engine).
//
// WHY THIS EXISTS: netcore ships plain JavaScript (.mjs) with no bundled type
// declarations. While it was linked locally (file:../netcore), TypeScript
// inferred types from source. Now that arsenal consumes it from npm, TypeScript
// applies its stricter rule for installed packages (a JS package in node_modules
// must provide declarations, source is not inferred), so the import would be an
// implicit `any` and fail the strict build.
//
// This file declares the Engine's public surface so the build is fully typed.
// It is a SHIM: the correct long-term fix is for netcore itself to ship these
// types (a `types` entry + .d.ts) in a future release, after which this file is
// deleted and arsenal gets the types directly from the package.
//
// The declaration mirrors netcore/src/index.mjs (the brand-blind public surface,
// C-04 / C-60). arsenal only uses `cidrTool.run`; the rest is typed pragmatically.
// ============================================================================

declare module "@ronutz/netcore" {
  // --- The CIDR reference tool (a namespace export: `export * as cidrTool`) ---
  export namespace cidrTool {
    /** The shape cidrTool.run() returns (mirrors the Engine's output). */
    interface CidrResult {
      input: string;
      network: string;
      broadcast: string;
      netmask: string;
      wildcard: string;
      firstHost: string;
      lastHost: string;
      totalAddresses: number;
      usableHosts: number;
    }

    /** Compute CIDR/subnet facts locally from "address/prefix". Throws on invalid input. */
    function run(input: string): CidrResult;

    /** The tool's manifest entry (frozen). */
    const manifest: Readonly<Record<string, unknown>>;

    // Golden/reject vectors used by the Engine's own conformance tests.
    const goldenVectors: readonly unknown[];
    const rejectVectors: readonly unknown[];
    const GOLDEN_VECTOR_SET_ID: string;
    const CIDR_GOLDEN_VECTORS: readonly unknown[];
    const CIDR_REJECT_VECTORS: readonly unknown[];
  }

  // --- Remaining Engine exports (typed pragmatically until netcore ships .d.ts) ---
  export function validateManifest(manifest: unknown): { ok: boolean; [key: string]: unknown };
  export const _security: unknown;
  export function createRegistry(...args: unknown[]): unknown;
  export function createByoaiAdapter(...args: unknown[]): unknown;
  export function runMigrations(...args: unknown[]): unknown;
  export const MIGRATIONS: readonly unknown[];
}
