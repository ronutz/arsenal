// ============================================================================
// src/lib/tools/wheel-filename-explainer/example.ts
// ----------------------------------------------------------------------------
// The page's Example (D-83), in a module of its own so the page imports the
// engine and the Example without pulling the golden vectors into its bundle.
// golden-vectors.ts imports these same constants and checks that each one is
// verbatim a vector's input, so the two cannot drift.
// ============================================================================

import type { Target } from "./tags"; // the target shape

/** A real wheel (pip downloaded it on 2026-10-27 for CPython 3.13 on Linux x86-64): FILE_VECTORS[0] and TARGET_VECTORS[0]. */
export const EXAMPLE_FILENAME = "cryptography-50.0.2-cp311-abi3-manylinux_2_34_x86_64.whl"; // stable ABI from 3.11, glibc 2.34+

/** The target of TARGET_VECTORS[0]: this container's interpreter and system. */
export const EXAMPLE_TARGET: Target = { impl: "cpython", major: 3, minor: 13, freeThreaded: false, os: "linux-glibc", osVersion: [2, 39], arch: "x86_64" }; // CPython 3.13, glibc 2.39, x86-64

/** The versions of SPEC_VECTORS[0] (the compatible-release example of the Learn article). */
export const EXAMPLE_VERSIONS = "2.1 2.2 2.9.1 3.0 2.10rc1"; // five candidates, one a release candidate

/** The specifier of SPEC_VECTORS[0]. */
export const EXAMPLE_SPECIFIER = "~=2.2"; // >= 2.2, == 2.*
