# @ronutz/arsenal

[![CI](https://github.com/ronutz/arsenal/actions/workflows/ci.yml/badge.svg)](https://github.com/ronutz/arsenal/actions/workflows/ci.yml)
[![REUSE status](https://api.reuse.software/badge/github.com/ronutz/arsenal)](https://api.reuse.software/info/github.com/ronutz/arsenal)
[![License: Apache-2.0](https://img.shields.io/badge/code-Apache--2.0-blue.svg)](./LICENSE)
[![Content: CC BY 4.0](https://img.shields.io/badge/content-CC%20BY%204.0-lightgrey.svg)](./LICENSE-CONTENT)

The application behind **ronutz.com**: a privacy-first, local-compute network and security toolbox, delivered as a statically exported Next.js Progressive Web App.

## Status

Open source. Code is licensed under the Apache License 2.0; the written content is licensed under CC BY 4.0. See [License](#license).

## What this is

ronutz.com is a personal toolbox and professional portfolio for Rodolfo Nützmann. Its tools run entirely in the browser; nothing is sent to a server unless a tool explicitly says so. The site is statically exported and served from the edge.

- Tools execute client-side on in-house engines that live in this repository (`src/lib/`); there is no external engine dependency.
- A small HTTP API mirrors selected tools server-side, byte-for-byte, using those same in-house engines. The API is documented but not served from this site (see the `/api` page for why).
- The interface is available in multiple languages.

## Tech

- Next.js (static export, `output: "export"`), React, next-intl.
- Deployed on Cloudflare Workers.
- Strict Content-Security-Policy; all third-party assets are self-hosted (no CDN).

## Build

```bash
npm install
npm run build      # static export to ./out
```

Refreshing the vendored Swagger UI assets (manual, not part of the build):

```bash
npm run update-swagger-ui            # latest
npm run update-swagger-ui -- 5.32.8  # pin a version
```

## Related

- `@ronutz/concord`: the project's governance and operating framework.

## License

Copyright 2026 Rodolfo Nützmann.

This project is dual-licensed:

- **Source code** is licensed under the **Apache License 2.0**. See [`LICENSE`](./LICENSE).
- **Content** (the written material: every Learn article, the tool copy and explanatory prose, and the documentation) is licensed under the **Creative Commons Attribution 4.0 International License (CC BY 4.0)**. See [`LICENSE-CONTENT`](./LICENSE-CONTENT).

Both licenses require attribution: if you reuse the code or the content, credit Rodolfo Nützmann (ronutz.com) and indicate any changes. ronutz.com remains the canonical, maintained source.

Third-party components redistributed in this repository retain their own licenses; see [`NOTICE`](./NOTICE).

Licensing is machine-readable: the project is [REUSE 3.3](https://reuse.software) compliant. Every file's copyright and license are declared in [`REUSE.toml`](./REUSE.toml), and full license texts live in [`LICENSES/`](./LICENSES). Run `reuse lint` to verify.
