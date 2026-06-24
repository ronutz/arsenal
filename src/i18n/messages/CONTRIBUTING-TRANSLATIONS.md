# Contributing a Translation

ronutz.com is designed so that **adding or improving a language takes very little effort** and is open to community contributions. A language is just two things: an entry in the locale registry and a JSON message pack. No application code needs to change.

## How the system works

- **The registry** — `src/i18n/locales.ts` lists every language, its native name, text direction, and translation status. This is the single source of truth; the language switcher, URL routing, and SEO all derive from it.
- **The packs** — `src/i18n/messages/<code>.json` holds the actual translated strings for one language. `en.json` is the complete source; every other pack only needs the keys it translates.
- **English fallback** — any key a pack is missing automatically shows the English text. So a *partial* translation is fine and useful: it ships immediately, and missing pieces stay readable in English until someone fills them in.

## Translation status (evidence-gated, like everything here)

Each language carries a `status`:

| Status | Meaning |
|---|---|
| `reviewed` | A native speaker has read and approved the pack. Fully trusted. |
| `machine-draft` | An AI/machine draft (e.g. DeepL). Useful, but **not yet** human-reviewed. |
| `stub` | No real pack yet. Falls back to English. |

We do not present machine-drafted copy as if it were polished native text. A `machine-draft` is a starting point that a native speaker promotes to `reviewed`.

## Add or improve a language in four steps

1. **Copy the source.** Duplicate `src/i18n/messages/en.json` to `src/i18n/messages/<your-code>.json` (use the BCP-47 code from the registry, e.g. `fr`, `ja`, `zh-Hant-TW`).
2. **Translate the values.** Translate the string values only. **Do not change the keys.** Keep technical product names (BIG-IP, CIDR, F5, Fortinet, and so on) as they are. Keep the copy free of em dashes, matching the house style.
3. **Set the status.** In your pack's `_meta.status`, use `machine-draft` if it is an AI draft, or `reviewed` if you are a native speaker who has checked it. If the language is brand new to the project, also confirm its entry in `src/i18n/locales.ts` (most are already registered).
4. **Open a pull request.** Describe which language and whether it is a draft or a native-reviewed translation.

## Notes

- **Right-to-left languages** (e.g. Arabic) are already handled by the layout; you only need to translate the text. Direction is set from the registry.
- **Partial packs are welcome.** Translating just the navigation and hero is a valuable first contribution; the rest stays in English until completed.
- **New language not in the registry?** Add one line to `LOCALES` in `src/i18n/locales.ts` with the code, native name, English name, direction, and `status: "stub"`, then add your pack.
