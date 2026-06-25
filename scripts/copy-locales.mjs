// ============================================================================
// scripts/copy-locales.mjs
// ----------------------------------------------------------------------------
// Copies every message pack from src/i18n/messages/ into public/locales/ so the
// contribute page can offer each one as a real, downloadable static file at
// /locales/<code>.json. Runs automatically as the npm `prebuild` step (npm runs
// pre<script> before <script>), so the downloadable copies are always in sync
// with the source packs, no manual step and no drift.
//
// Only files that actually exist are copied, which means exactly the live
// locales (stubs have no pack and fall back to English), matching the download
// list the contribute page derives from LIVE_LOCALES.
// ============================================================================

import { readdirSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "src", "i18n", "messages");
const outDir = join(here, "..", "public", "locales");

mkdirSync(outDir, { recursive: true });

const files = readdirSync(srcDir).filter((f) => f.endsWith(".json"));
let n = 0;
for (const f of files) {
  copyFileSync(join(srcDir, f), join(outDir, f));
  n++;
}

console.log(`[copy-locales] copied ${n} language pack(s) to public/locales/`);
