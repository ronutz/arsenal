// ============================================================================
// src/lib/share/cases/expect-script-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the Expect script explainer: a copy with every secret rule E1
// flags replaced by the page's bullets; a secret written with escapes, or
// another credential, blocks the link. The copies themselves are pinned by
// the tool's share vectors (expect-script-explainer/2026-11-01).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { EXPECT_EXPLAINER_SHARE, type ExpectExplainerShareState } from "../../tools/expect-script-explainer/share"; // the spec
import { SHARE_VECTORS } from "../../tools/expect-script-explainer/golden-vectors"; // the pinned copies

/** A share vector's script and copy. */
function pair(id: string): { script: string; copy: string; secrets: string[] } {
  const v = SHARE_VECTORS.find((x) => x.id === id)!; // the vector
  return { script: v.script, copy: "copy" in v.expect ? v.expect.copy : "", secrets: v.secrets }; // its script and copy
} // pair

/** The page's Example (the password after "Password:" becomes bullets). */
const EXAMPLE = pair("share-example-telnet"); // telnet-hardcoded
/** A password set into a variable named like one. */
const SETVAR = pair("share-set-variable"); // set password "..."
/** A script with nothing E1 flags. */
const CLEAN = pair("share-clean"); // secrets from argv

/** The cases. */
export const EXPECT_SCRIPT_EXPLAINER_SHARE_CASES = defineShareCases<ExpectExplainerShareState, ExpectExplainerShareState>({
  spec: EXPECT_EXPLAINER_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE.script }, params: { input: EXAMPLE.copy }, restored: { input: EXAMPLE.copy }, mustNotContain: EXAMPLE.secrets }, // the Example's password never travels
    { id: "set-variable", state: { input: SETVAR.script }, params: { input: SETVAR.copy }, restored: { input: SETVAR.copy }, mustNotContain: SETVAR.secrets }, // a variable's password replaced, its reference kept
    { id: "clean", state: { input: CLEAN.script }, params: { input: CLEAN.script }, restored: { input: CLEAN.script } }, // nothing to replace: as pasted
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
  ],
  blocked: [
    { id: "escaped", state: { input: SHARE_VECTORS.find((x) => x.id === "share-escaped-refused")!.script }, code: "escaped" }, // a secret written with escapes
    { id: "url-password", state: { input: "set timeout 10\nspawn curl -s https://ops:Gr8-pass@nms.example.net/api/backup\nexpect eof\n" }, code: "secret" }, // another credential: a password in a URL
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "  " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
