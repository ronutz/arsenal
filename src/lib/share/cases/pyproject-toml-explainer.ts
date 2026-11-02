// ============================================================================
// src/lib/share/cases/pyproject-toml-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the pyproject.toml explainer: a copy with every credential of
// an http or https URL replaced by bullets (a password after the user name, or
// a lone user name that may be a single-part token); a URL written with a \u
// escape, or another credential, blocks the link.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { PYPROJECT_SHARE, type PyprojectShareState } from "../../tools/pyproject-toml-explainer/share"; // the spec
import { EXAMPLE_PYPROJECT } from "../../tools/pyproject-toml-explainer/example"; // the page's Example

/** A project file whose uv index embeds a user and a password (uv's "Package indexes" page shows this form). */
const UV_INDEX = "[project]\nname = \"netcheck\"\nversion = \"0.1.0\"\n\n[[tool.uv.index]]\nname = \"internal\"\nurl = \"https://public:Koala-2026@pypi.corp.example/simple\"\n"; // a password
/** Its copy. */
const UV_INDEX_COPY = "[project]\nname = \"netcheck\"\nversion = \"0.1.0\"\n\n[[tool.uv.index]]\nname = \"internal\"\nurl = \"https://public:••••••••@pypi.corp.example/simple\"\n"; // the password replaced
/** A direct reference whose URL carries a single-part token in the user name's place (pip's documented form); invented. */
const TOKEN_DEP = "[project]\nname = \"netcheck\"\nversion = \"0.1.0\"\ndependencies = [\"corp-lib @ https://ghp9Xr2Lk7Qw3Ze5@git.corp.example/corp-lib-1.2.0.tar.gz\"]\n"; // a token
/** Its copy. */
const TOKEN_DEP_COPY = "[project]\nname = \"netcheck\"\nversion = \"0.1.0\"\ndependencies = [\"corp-lib @ https://••••••••@git.corp.example/corp-lib-1.2.0.tar.gz\"]\n"; // the token replaced
/** An ssh URL's user is a login name, not a credential: it stays. */
const SSH_DEP = "[project]\nname = \"netcheck\"\nversion = \"0.1.0\"\ndependencies = [\"corp-lib @ git+ssh://git@git.corp.example/corp-lib.git@3f1c2a9\"]\n"; // no credential

/** The cases. */
export const PYPROJECT_TOML_SHARE_CASES = defineShareCases<PyprojectShareState, PyprojectShareState>({
  spec: PYPROJECT_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE_PYPROJECT }, params: { input: EXAMPLE_PYPROJECT }, restored: { input: EXAMPLE_PYPROJECT } }, // the page's Example, as pasted (nothing to replace)
    { id: "uv-index-password", state: { input: UV_INDEX }, params: { input: UV_INDEX_COPY }, restored: { input: UV_INDEX_COPY }, mustNotContain: ["Koala-2026"] }, // the password replaced, the user kept
    { id: "direct-reference-token", state: { input: TOKEN_DEP }, params: { input: TOKEN_DEP_COPY }, restored: { input: TOKEN_DEP_COPY }, mustNotContain: ["ghp9Xr2Lk7Qw3Ze5"] }, // the token replaced
    { id: "ssh-user-stays", state: { input: SSH_DEP }, params: { input: SSH_DEP }, restored: { input: SSH_DEP } }, // an ssh login name is not a credential
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
  ],
  blocked: [
    { id: "escaped-url", state: { input: "[project]\nname = \"x\"\nversion = \"1\"\n[[tool.uv.index]]\nurl = \"https://tok\\u0065n@pypi.corp.example/simple\"\n" }, code: "escaped" }, // a URL written with a \u escape
    { id: "aws-key", state: { input: "[project]\nname = \"x\"\nversion = \"1\"\n[tool.deploy]\naws_access_key_id = \"AKIAP3L8N1M6B4V9C2X5\"\n" }, code: "secret" }, // another credential: an AWS access key ID (invented)
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " \n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
