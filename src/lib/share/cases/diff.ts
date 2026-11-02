// ============================================================================
// src/lib/share/cases/diff.ts
// ----------------------------------------------------------------------------
// Share cases of the text diff: both boxes as pasted and both options,
// always written; a credential in either box blocks the link.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { DIFF_SHARE, type DiffShareState } from "../../tools/diff/share"; // the spec

/** A configuration change, before. */
const BEFORE = "hostname edge-01\ninterface port1\n    set allowaccess ping https\nend"; // three lines that matter
/** And after. */
const AFTER = "hostname edge-01\ninterface port1\n    set allowaccess ping https ssh\nend"; // one line changed
/** An AWS access key ID of the documented shape, invented for this case. */
const AWS_KEY = "AKIAZ7Q2X5V9K3M1R8TW"; // nobody's key

/** The cases. */
export const DIFF_SHARE_CASES = defineShareCases<DiffShareState, DiffShareState>({
  spec: DIFF_SHARE, // the spec
  accept: [
    { id: "example", state: { original: "line1\nline2", changed: "line1\nline2\nline3", ignoreSpace: false, ignoreCase: false }, params: { original: "line1\nline2", changed: "line1\nline2\nline3", ignorespace: "0", ignorecase: "0" }, restored: { original: "line1\nline2", changed: "line1\nline2\nline3", ignoreSpace: false, ignoreCase: false } }, // the page's Example
    { id: "config-options", state: { original: BEFORE, changed: AFTER, ignoreSpace: true, ignoreCase: true }, params: { original: BEFORE, changed: AFTER, ignorespace: "1", ignorecase: "1" }, restored: { original: BEFORE, changed: AFTER, ignoreSpace: true, ignoreCase: true } }, // both options on
    { id: "empty-original", state: { original: "", changed: "new file\n", ignoreSpace: false, ignoreCase: false }, params: { original: "", changed: "new file\n", ignorespace: "0", ignorecase: "0" }, restored: { original: "", changed: "new file\n", ignoreSpace: false, ignoreCase: false } }, // an empty box carries nothing and comes back empty
    { id: "no-changes", state: { original: "same", changed: "SAME", ignoreSpace: false, ignoreCase: true }, params: { original: "same", changed: "SAME", ignorespace: "0", ignorecase: "1" }, restored: { original: "same", changed: "SAME", ignoreSpace: false, ignoreCase: true } }, // identical under ignore case: a reading too
    { id: "maybe-secret-goes", state: { original: "db_password = \"old-pass-1\"", changed: "db_password = \"new-pass-2\"", ignoreSpace: false, ignoreCase: false }, params: { original: "db_password = \"old-pass-1\"", changed: "db_password = \"new-pass-2\"", ignorespace: "0", ignorecase: "0" }, restored: { original: "db_password = \"old-pass-1\"", changed: "db_password = \"new-pass-2\"", ignoreSpace: false, ignoreCase: false } }, // a secret-looking name: a caution line, not a block
  ],
  empty: [
    { id: "both-empty", state: { original: "", changed: "", ignoreSpace: false, ignoreCase: false } }, // nothing pasted
  ],
  blocked: [
    { id: "aws-key-changed", state: { original: "aws_access_key_id = OLDKEY", changed: `aws_access_key_id = ${AWS_KEY}`, ignoreSpace: false, ignoreCase: false }, code: "secret" }, // an AWS access key ID in the Changed box
    { id: "url-password-original", state: { original: "url = https://svc:Xy9-pass@git.example.net/repo", changed: "url = https://git.example.net/repo", ignoreSpace: false, ignoreCase: false }, code: "secret" }, // a password in a URL in the Original box
  ],
  reject: [
    { id: "nothing", values: { ignorespace: "0", ignorecase: "0" } }, // no text
    { id: "no-options", values: { original: "a", changed: "b" } }, // the options are always written
    { id: "bad-option", values: { original: "a", changed: "b", ignorespace: "yes", ignorecase: "0" } }, // not 1 or 0
  ],
});
