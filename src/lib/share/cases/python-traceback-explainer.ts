// ============================================================================
// src/lib/share/cases/python-traceback-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the Python traceback explainer: the redacted copy goes, the
// user names and secrets it replaced never do; long unchecked lines block it.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { PYTHON_TRACEBACK_SHARE } from "../../tools/python-traceback-explainer/share"; // the spec
import { EXAMPLE_TRACEBACK } from "../../tools/python-traceback-explainer/example"; // the Example (golden vector example-poll's input)
import { TRACEBACK_VECTORS } from "../../tools/python-traceback-explainer/golden-vectors"; // the tool's own vectors

/** The secrets vector: a home directory, a JSON Web Token in a Bearer header and a password in a URL. */
const SECRETS = TRACEBACK_VECTORS.find((v) => v.id === "secrets"); // pinned there with its redacted copy

/** The cases. */
export const PYTHON_TRACEBACK_SHARE_CASES = defineShareCases(Object.freeze({
  spec: PYTHON_TRACEBACK_SHARE, // the spec
  accept: [
    { // the Example: the user name leaves every path
      id: "example", state: { input: EXAMPLE_TRACEBACK }, params: { input: EXAMPLE_TRACEBACK.split("/home/ana/").join("/home/<user>/") },
      restored: { input: EXAMPLE_TRACEBACK.split("/home/ana/").join("/home/<user>/") }, mustNotContain: ["/home/ana/"],
    },
    { // the secrets vector: its hand-written redacted copy, and none of the three secrets
      id: "secrets", state: { input: SECRETS?.input ?? "" }, params: { input: SECRETS?.redacted ?? "" }, restored: { input: SECRETS?.redacted ?? "" },
      mustNotContain: ["/home/ana/", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbmEifQ.c2ln", "S3cr3t-pw"],
    },
  ],
  empty: [
    { id: "nothing", state: { input: "" } }, // nothing pasted
    { id: "not-a-traceback", state: { input: "hello world" } }, // refused by the reader: nothing to share
  ],
  blocked: [
    { id: "long-line", state: { input: "Traceback (most recent call last):\n  File \"/home/ana/x.py\", line 1, in <module>\n    f(\"" + "a".repeat(2100) + "\")\nValueError: token=abc123secretdemo\n" }, code: "secrets-skipped" }, // a line the check did not read
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
}));
