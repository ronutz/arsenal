# Contributing to ronutz.com (ARSENAL)

Thanks for your interest in improving the project. This is the application behind
[ronutz.com](https://ronutz.com): a privacy-first, local-compute network and
security toolbox, delivered as a statically exported Next.js Progressive Web App.

Contributions are welcome, whether that is a bug report, a fix, a new tool, a
translation, or a documentation improvement. ronutz.com remains the canonical,
maintained deployment.

## Licensing of contributions

By submitting a contribution you agree that it is licensed under the same terms
as the project:

- **Code** under the [Apache License 2.0](./LICENSE).
- **Content** (written material: articles, tool copy, documentation) under
  [CC BY 4.0](./LICENSE-CONTENT).

Both require attribution to be preserved downstream.

## Ground rules (the project's standing principles)

These are load-bearing; please respect them:

- **Tools compute, they never guess.** Every tool is deterministic and computes
  locally in the browser. No tool should send user input to a server as part of
  its normal operation.
- **All code is commented and documented.** No exceptions. Files carry a header
  explaining what they are and why; non-obvious logic is explained inline.
- **Facts are sourced, never invented.** Anything factual in a tool or Learn
  article must be grounded in an authoritative source (e.g. an RFC, a vendor
  doc). Do not write technical claims from memory.
- **English and Portuguese ship together.** New user-facing copy is authored in
  `en` and native-quality `pt-BR`; the other locales fall back per key until
  translated.
- **No em-dashes in public-facing copy.**

## Development

```bash
npm install
npm run build      # static export to ./out (runs prebuild guards first)
npm run dev        # local dev server
```

The `prebuild` step runs a set of guards (tool/article/registry/i18n
consistency). A change must pass them and `npx tsc --noEmit` before it can build.

## Adding a tool

Each tool is an end-to-end unit: a pure compute engine with a golden-vector test
suite, a client component, its registry entry, its EN + pt-BR documentation, and
at least the Learn articles its completeness warrants. See
[`TOOL-BUILD-RUNBOOK.md`](./TOOL-BUILD-RUNBOOK.md) for the full checklist.

## Reporting bugs and requesting features

Open an issue. For bugs, include steps to reproduce, what you expected, and what
happened. For a tool request, describe the input, the computation, and the
authoritative source that defines the correct output.

## Security

Please do not open public issues for security problems. See
[`SECURITY.md`](./SECURITY.md) for how to report them responsibly.

## Code of conduct

Participation is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md).
