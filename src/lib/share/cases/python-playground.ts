// ============================================================================
// src/lib/share/cases/python-playground.ts
// ----------------------------------------------------------------------------
// Share cases of the Python playground: the program and the standard input as
// typed, never the output; a credential in either box blocks the link.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { PLAYGROUND_SHARE, type PlaygroundShareState } from "../../tools/python-playground/share"; // the spec
import { EXAMPLES, EXAMPLE_ID } from "../../tools/python-playground/compute"; // the page's opening example

/** The program the page opens with. */
const OPENING = EXAMPLES.find((e) => e.id === EXAMPLE_ID)!; // D-83
/** An AWS access key ID of the documented shape, invented for this case. */
const AWS_KEY = "AKIAQ4W8E2R6T0Y3U7IO"; // nobody's key

/** The cases. */
export const PYTHON_PLAYGROUND_SHARE_CASES = defineShareCases<PlaygroundShareState, PlaygroundShareState>({
  spec: PLAYGROUND_SHARE, // the spec
  accept: [
    { id: "opening", state: { input: OPENING.code, stdin: OPENING.stdin ?? "" }, params: { input: OPENING.code, stdin: OPENING.stdin ?? "" }, restored: { input: OPENING.code, stdin: OPENING.stdin ?? "" } }, // the page as it opens
    { id: "with-stdin", state: { input: "n = int(input())\nprint(n * 2)\n", stdin: "21\n" }, params: { input: "n = int(input())\nprint(n * 2)\n", stdin: "21\n" }, restored: { input: "n = int(input())\nprint(n * 2)\n", stdin: "21\n" } }, // standard input goes too
    { id: "maybe-secret-goes", state: { input: "api_key = \"demo-key-123\"\nprint(len(api_key))\n", stdin: "" }, params: { input: "api_key = \"demo-key-123\"\nprint(len(api_key))\n", stdin: "" }, restored: { input: "api_key = \"demo-key-123\"\nprint(len(api_key))\n", stdin: "" } }, // a secret-looking name: a caution line
  ],
  empty: [
    { id: "blank", state: { input: "", stdin: "" } }, // nothing typed
    { id: "stdin-only", state: { input: "  ", stdin: "data" } }, // no program
  ],
  blocked: [
    { id: "aws-key-in-code", state: { input: `import os\nKEY = "${AWS_KEY}"\nprint(KEY[:4])\n`, stdin: "" }, code: "secret" }, // an AWS access key ID
    { id: "bearer-in-stdin", state: { input: "print(input())\n", stdin: "Authorization: Bearer eyJ0b2tlbiI6InNlY3JldC12YWx1ZSJ9" }, code: "secret" }, // an Authorization line in standard input
  ],
  reject: [
    { id: "no-program", values: { input: null, stdin: "x" } }, // a program is required
    { id: "blank-program", values: { input: "   " } }, // white space
  ],
});
