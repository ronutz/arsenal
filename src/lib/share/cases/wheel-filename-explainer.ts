// ============================================================================
// src/lib/share/cases/wheel-filename-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the wheel filename & PEP 440 version explainer: a file name
// with or without the target check's choices, or versions with a specifier;
// a URL holding a credential before its "@" gets no link.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { WHEEL_SHARE, type WheelShareState } from "../../tools/wheel-filename-explainer/share"; // the spec
import type { Target } from "../../tools/wheel-filename-explainer/tags"; // the target shape

/** The page's Example file name. */
const FILE = "cryptography-50.0.2-cp311-abi3-manylinux_2_34_x86_64.whl"; // verbatim
/** The page's Example target. */
const TARGET: Target = { impl: "cpython", major: 3, minor: 13, freeThreaded: false, os: "linux-glibc", osVersion: [2, 39], arch: "x86_64" }; // CPython 3.13, glibc 2.39
/** A Windows target, free-threaded (Windows carries no OS version). */
const WIN: Target = { impl: "cpython", major: 3, minor: 14, freeThreaded: true, os: "windows", osVersion: [0, 0], arch: "arm64" }; // CPython 3.14t on Windows on Arm
/** A single-part token in a private index URL's user-name place (pip's documented form); invented for this case. */
const TOKEN = "f3c9a1e07b5d42aa9e6b"; // nobody's token

/** The cases. */
export const WHEEL_FILENAME_SHARE_CASES = defineShareCases<WheelShareState, WheelShareState>({
  spec: WHEEL_SHARE, // the spec
  accept: [
    { id: "file-alone", state: { mode: "file", input: FILE, target: null }, params: { input: FILE }, restored: { mode: "file", input: FILE, target: null } }, // the file name, target closed
    { id: "file-with-target", state: { mode: "file", input: FILE, target: TARGET }, params: { input: FILE, impl: "cpython", python: "3.13", ft: "0", os: "linux-glibc", osver: "2.39", arch: "x86_64" }, restored: { mode: "file", input: FILE, target: TARGET } }, // the Example, target open
    { id: "windows-target", state: { mode: "file", input: "numpy-2.3.4-cp314-cp314t-win_arm64.whl", target: WIN }, params: { input: "numpy-2.3.4-cp314-cp314t-win_arm64.whl", impl: "cpython", python: "3.14", ft: "1", os: "windows", osver: "", arch: "arm64" }, restored: { mode: "file", input: "numpy-2.3.4-cp314-cp314t-win_arm64.whl", target: WIN } }, // Windows: no OS version
    { id: "public-url", state: { mode: "file", input: `https://files.example.org/packages/${FILE}`, target: null }, params: { input: `https://files.example.org/packages/${FILE}` }, restored: { mode: "file", input: `https://files.example.org/packages/${FILE}`, target: null } }, // a URL without credentials goes
    { id: "versions", state: { mode: "versions", versions: "2.1 2.2 2.9.1 3.0 2.10rc1", spec: "~=2.2" }, params: { mode: "versions", versions: "2.1 2.2 2.9.1 3.0 2.10rc1", spec: "~=2.2" }, restored: { mode: "versions", versions: "2.1 2.2 2.9.1 3.0 2.10rc1", spec: "~=2.2" } }, // the versions Example
    { id: "versions-no-spec", state: { mode: "versions", versions: "1.0.post1\n1.0\n1.0a1", spec: "" }, params: { mode: "versions", versions: "1.0.post1\n1.0\n1.0a1", spec: "" }, restored: { mode: "versions", versions: "1.0.post1\n1.0\n1.0a1", spec: "" }, mustNotContain: [TOKEN] }, // no specifier
  ],
  empty: [
    { id: "file-blank", state: { mode: "file", input: "", target: null } }, // nothing typed
    { id: "versions-blank", state: { mode: "versions", versions: "", spec: "" } }, // nothing typed
  ],
  blocked: [
    { id: "token-url", state: { mode: "file", input: `https://${TOKEN}@pypi.corp.example/simple/cryptography/${FILE}`, target: null }, code: "credentials" }, // a single-part token
    { id: "password-url", state: { mode: "file", input: `https://deploy:S3cretPw@pypi.corp.example/simple/x/${FILE}`, target: null }, code: "credentials" }, // user:password
  ],
  reject: [
    { id: "nothing", values: { input: null } }, // no file name
    { id: "unknown-mode", values: { mode: "file", input: FILE } }, // the file mode writes no mode
    { id: "file-with-versions", values: { input: FILE, versions: "1.0" } }, // a field of the other mode
    { id: "versions-with-file", values: { mode: "versions", versions: "1.0", input: FILE } }, // a field of the other mode
    { id: "versions-blank", values: { mode: "versions", versions: " " } }, // nothing to read
    { id: "partial-target", values: { input: FILE, impl: "cpython", python: "3.13" } }, // a target only whole
    { id: "minor-not-offered", values: { input: FILE, impl: "cpython", python: "3.9", ft: "0", os: "linux-glibc", osver: "2.39", arch: "x86_64" } }, // 3.9 is not offered
    { id: "ft-on-pypy", values: { input: FILE, impl: "pypy", python: "3.13", ft: "1", os: "linux-glibc", osver: "2.39", arch: "x86_64" } }, // free-threaded is CPython's
    { id: "glibc-not-offered", values: { input: FILE, impl: "cpython", python: "3.13", ft: "0", os: "linux-glibc", osver: "2.40", arch: "x86_64" } }, // 2.40 is not offered
    { id: "arch-not-for-os", values: { input: FILE, impl: "cpython", python: "3.13", ft: "0", os: "macos", osver: "14.0", arch: "aarch64" } }, // macOS names it arm64
    { id: "windows-with-version", values: { input: FILE, impl: "cpython", python: "3.13", ft: "0", os: "windows", osver: "10.0", arch: "x86_64" } }, // Windows carries none
  ],
});
