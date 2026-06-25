# @ronutz/arsenal

The application behind **ronutz.com**: a privacy-first, local-compute network and security toolbox, delivered as a statically exported Next.js Progressive Web App.

## Status

Private, in active development. Not yet open-sourced. See [License](#license).

## What this is

ronutz.com is a personal toolbox and professional portfolio for Rodolfo Nützmann. Its tools run entirely in the browser; nothing is sent to a server unless a tool explicitly says so. The site is statically exported and served from the edge.

- Tools execute client-side on the open-source engine [`@ronutz/netcore`](https://www.npmjs.com/package/@ronutz/netcore).
- A small, optional HTTP API mirrors selected tools server-side, byte-for-byte, using that same engine.
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

- [`@ronutz/netcore`](https://www.npmjs.com/package/@ronutz/netcore): the open-source engine that powers the tools, both in the browser and in the API.
- `@ronutz/concord`: the project's governance and operating framework.

## License

Copyright (c) 2026 Rodolfo Nützmann. All rights reserved.

This repository is currently proprietary while in private development (`UNLICENSED` in `package.json`); no rights are granted. It is intended to be released under the Apache License 2.0 (code) and the Creative Commons Attribution 4.0 International license (content), matching `@ronutz/netcore`, if and when it is opened. At that point, replacing this section and the [`LICENSE`](./LICENSE) file with the corresponding license text is the change that makes it public.

Third-party components redistributed in this repository retain their own licenses; see [`NOTICE`](./NOTICE).
