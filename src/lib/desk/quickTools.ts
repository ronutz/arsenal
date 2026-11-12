// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/desk/quickTools.ts
// ----------------------------------------------------------------------------
// QUICK TOOLS ON THE DESK (PLAN-personal-desk-20261112, section 3.6: "a few
// tools usable inside a widget, lazily loaded ... Start with tools whose
// engines are small and pure, declared eligible in their manifest, and link
// to the rest").
//
// A tool is eligible when its manifest (src/lib/tools/<slug>/index.ts) says
// `deskQuick: true` and this file has its adapter: the example the field shows
// (an input from the tool's own golden vectors), and a loader that imports the
// tool's pure engine (its compute.ts alone, not its page) only when the widget
// shows that tool, and turns one input into a few labelled rows. Each loader is
// its own dynamic import, so the desk page carries none of the engines until
// a reader picks one. Nothing typed is kept or sent: the engines compute in
// the browser, as on the tools' own pages. scripts/check-desk-store.mts checks
// that the manifests and this list agree and runs every example.
// ============================================================================

/** One row of a quick tool's answer: a label's key (desk.quick.rows.<key>) and its value. */
export interface QuickRow {
  /** The label's key. */
  key: string;
  /** The value: text shown as it is, a number formatted in the page's language, or yes and no in words. */
  value: string | number | boolean;
}

/** A quick tool's answer to one input. */
export type QuickResult = { ok: true; rows: QuickRow[] } | { ok: false };

/** One quick tool. */
export interface QuickTool {
  /** The example input, verbatim from the tool's golden vectors. */
  example: string;
  /** Load the engine and give the function that answers an input. */
  load: () => Promise<(input: string) => QuickResult>;
}

/** The eligible tools, by slug, in the order the widget offers them. */
export const QUICK_TOOLS: Readonly<Record<string, QuickTool>> = {
  // The subnet calculator: one IPv4 block, its addresses and hosts.
  cidr: {
    // From the tool's golden vectors (the VLSM cases' parent block).
    example: "192.168.1.0/24",
    // The engine.
    load: async () => {
      // The pure engine only.
      const m = await import("@/lib/tools/cidr/compute");
      // One block in, its numbers out; a malformed block is an answer too.
      return (input: string): QuickResult => {
        // The engine throws on input it cannot read.
        try {
          // Analysed.
          const a = m.cidrAnalyze(input.trim());
          // The block as written by the engine, then its numbers.
          return { ok: true, rows: [
            { key: "network", value: `${a.network}/${input.trim().split("/")[1] ?? ""}` },
            { key: "netmask", value: a.netmask },
            { key: "wildcard", value: a.wildcard },
            { key: "broadcast", value: a.broadcast },
            { key: "firstHost", value: a.firstHost },
            { key: "lastHost", value: a.lastHost },
            { key: "usable", value: a.usableHosts },
            { key: "total", value: a.totalAddresses },
          ] };
        } catch {
          // Not a block.
          return { ok: false };
        }
      };
    },
  },
  // Base64: the text encoded, and the input decoded when it is Base64.
  base64: {
    // From the tool's golden vectors.
    example: "foobar",
    // The engine.
    load: async () => {
      // The pure engine only.
      const m = await import("@/lib/tools/base64/compute");
      // Both ways at once, as the tool does.
      return (input: string): QuickResult => {
        // Analysed (never throws: a failed decode is part of the answer).
        const r = m.analyzeCodec(input);
        // The decode under Base64.
        const d = r.decoded.base64;
        // Encoded, decoded (or that it is not Base64), and whether the decoded bytes are text.
        return { ok: true, rows: [
          { key: "encoded", value: r.encoded.base64 },
          { key: "decoded", value: d.ok ? d.text : false },
          ...(d.ok ? [{ key: "utf8", value: d.isUtf8 }] : []),
        ] };
      };
    },
  },
  // Unix time: a timestamp or a date, in the usual forms.
  epoch: {
    // From the tool's golden vectors.
    example: "1700000000000",
    // The engine.
    load: async () => {
      // The pure engine only.
      const m = await import("@/lib/tools/epoch/compute");
      // One instant in, its forms out.
      return (input: string): QuickResult => {
        // The engine throws on input it cannot read.
        try {
          // Analysed.
          const a = m.analyzeEpoch(input.trim());
          // The forms.
          return { ok: true, rows: [
            { key: "iso8601", value: a.formats.iso8601 },
            { key: "httpDate", value: a.formats.httpDate },
            { key: "unixSeconds", value: a.formats.unixSeconds },
            { key: "unixMillis", value: a.formats.unixMillis },
          ] };
        } catch {
          // Not a time.
          return { ok: false };
        }
      };
    },
  },
  // UUIDs: whether one is well formed, its version and variant, and the time inside a version 7.
  uuid: {
    // From the tool's golden vectors.
    example: "550e8400-e29b-41d4-a716-446655440000",
    // The engine.
    load: async () => {
      // The pure engine only.
      const m = await import("@/lib/tools/uuid/compute");
      // One UUID in, what it says out.
      return (input: string): QuickResult => {
        // Inspected (never throws: an invalid UUID is reported).
        const u = m.inspectUuid(input.trim());
        // Not one: said as an answer the widget words.
        if (!u.valid) return { ok: false };
        // Its parts.
        return { ok: true, rows: [
          { key: "version", value: u.version ?? 0 },
          { key: "variant", value: u.variant ?? "" },
          ...(u.timestampIso ? [{ key: "timestamp", value: u.timestampIso }] : []),
        ] };
      };
    },
  },
};

/** The eligible tools' slugs, in order. */
export const QUICK_TOOL_SLUGS: readonly string[] = Object.keys(QUICK_TOOLS);

/** The row labels' keys, for the packs and the guard. */
export const QUICK_ROW_KEYS: readonly string[] = ["network", "netmask", "wildcard", "broadcast", "firstHost", "lastHost", "usable", "total", "encoded", "decoded", "utf8", "iso8601", "httpDate", "unixSeconds", "unixMillis", "version", "variant", "timestamp"];
