// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// user-agent-entropy-analyzer / golden-vectors.ts
// ----------------------------------------------------------------------------
// Known-answer vectors. Each UA string is a real, documented browser UA shape;
// the expected browser/OS/engine parse is known independently of this tool.
// ============================================================================

import { analyzeUa, UaInputError } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "user-agent-entropy-analyzer-v1";

export interface UaVector {
  id: string;
  input: string;
  expect: {
    browser?: string;
    os?: string;
    engine?: string;
    device?: string;
    reduced?: boolean;
    errorIncludes?: string;
  };
}

export const GOLDEN_VECTORS: UaVector[] = [
  { id: "v1", input: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    expect: { browser: "Chrome", os: "Windows", engine: "Blink (Chromium)", device: "desktop", reduced: true } },
  { id: "v2", input: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    expect: { browser: "Safari", os: "macOS", engine: "WebKit (Safari)", device: "desktop" } },
  { id: "v3", input: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
    expect: { browser: "Safari", os: "iOS", device: "phone" } },
  { id: "v4", input: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    expect: { browser: "Chrome", os: "Android", device: "phone", reduced: true } },
  { id: "v5", input: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.2151.97",
    expect: { browser: "Microsoft Edge", os: "Windows" } },
  { id: "v6", input: "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
    expect: { browser: "Firefox", os: "Linux", engine: "Gecko (Firefox)", device: "desktop" } },
  { id: "e1", input: "just some random text", expect: { errorIncludes: "does not look like" } },
  { id: "e2", input: "", expect: { errorIncludes: "Paste a User-Agent" } },
];

export interface VerifyReport { pass: boolean; failures: string[] }

export function verifyVectors(): VerifyReport {
  const failures: string[] = [];
  for (const v of GOLDEN_VECTORS) {
    try {
      const a = analyzeUa(v.input);
      if (v.expect.errorIncludes) { failures.push(`${v.id}: expected error but parsed`); continue; }
      if (v.expect.browser !== undefined && a.browser !== v.expect.browser) failures.push(`${v.id}: browser ${a.browser} != ${v.expect.browser}`);
      if (v.expect.os !== undefined && a.os !== v.expect.os) failures.push(`${v.id}: os ${a.os} != ${v.expect.os}`);
      if (v.expect.engine !== undefined && a.engine !== v.expect.engine) failures.push(`${v.id}: engine ${a.engine} != ${v.expect.engine}`);
      if (v.expect.device !== undefined && a.deviceHint !== v.expect.device) failures.push(`${v.id}: device ${a.deviceHint} != ${v.expect.device}`);
      if (v.expect.reduced !== undefined && a.isReducedUA !== v.expect.reduced) failures.push(`${v.id}: reduced ${a.isReducedUA} != ${v.expect.reduced}`);
    } catch (e) {
      if (!(e instanceof UaInputError)) { failures.push(`${v.id}: unexpected ${String(e)}`); continue; }
      if (!v.expect.errorIncludes) { failures.push(`${v.id}: unexpected error ${e.message}`); continue; }
      if (!e.message.includes(v.expect.errorIncludes)) failures.push(`${v.id}: error "${e.message}" lacks "${v.expect.errorIncludes}"`);
    }
  }
  return { pass: failures.length === 0, failures };
}
