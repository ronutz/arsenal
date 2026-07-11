# OG portrait sources

Build-input images for the OG social-preview generator (`scripts/gen-og.mts`).
NOT served by Next.js (outside `public/`); read at build time and composited
into the brand-page OG cards written to `public/og/` (which is gitignored and
regenerated in CI). Keep these committed so CI can generate the cards.

- `rodolfo-headshot.jpeg` - circle variant (home, about)
- `rodolfo-office.jpg` - panel variant (training, red-education)
