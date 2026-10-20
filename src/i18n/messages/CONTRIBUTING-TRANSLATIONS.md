# Contributing a translation

ronutz.com is built so that adding or improving a language takes very little effort, and contributions are welcome. A language is two things: an entry in the locale registry and a JSON message pack. No application code needs to change.

## How the system works

- **The packs.** Each language's text lives in one JSON file of labelled phrases, `src/i18n/messages/<code>.json`. The contribute page offers every live pack as a download, and the downloads are copied from the source packs at every build, so they are always current. `en.json` is the complete reference; every other pack only needs the phrases it translates.
- **English fallback.** Any phrase a pack does not have is shown in English. A partial translation is therefore useful at once: it ships, and the missing phrases stay readable in English until someone fills them in.
- **The registry.** `src/i18n/locales.ts` lists every language with its native name, text direction and translation status. The language switcher, the addresses and the search metadata all follow it.

## Translation status

Each language carries a `status`:

| Status | Meaning |
|---|---|
| `reviewed` | A native speaker has read and approved the pack. |
| `machine-draft` | A first draft made with AI or machine translation, not yet reviewed by a native speaker. |
| `stub` | No pack yet; the language shows English. |

Machine-drafted text is never presented as polished native text. A `machine-draft` is a starting point that a native speaker promotes to `reviewed`. Brazilian Portuguese is written with AI and reviewed gradually, so it keeps the `machine-draft` status and its notice until human review attests otherwise.

## Improve a language in four steps

1. **Download the pack** you want to improve from the contribute page (for a new language, download `en.json`, the reference).
2. **Translate the text after each label.** Change the values only. Never change a label (the key on the left), and leave everything inside curly braces exactly as it is: `{count}`, `{name}` and the like are filled in by the site, and a changed brace breaks the page. Keep product and technical names as they are (BIG-IP, CIDR, F5, Fortinet, and so on), and keep technical jargon the way practitioners in your language actually say it.
3. **Set the status** in the pack's `_meta.status`: `machine-draft` for an AI or machine draft, `reviewed` if you are a native speaker who has checked it.
4. **Send it back.** Email the edited file from the contribute page and say which language it is, or open a pull request in the public repository. Every submission is reviewed by hand.

## Punctuation

- **English** is written without em dashes. Use a comma, a colon, parentheses or a new sentence instead; an en dash appears only between numbers in a range (10–20).
- **Every other language keeps its own natural punctuation.** Do not import the English rule: Romance and Slavic languages use their dash (the Portuguese travessão, the Spanish raya, the Russian тире) where their own typography calls for it; German and the Scandinavian languages use the spaced en dash; Chinese uses its native full-width marks (，。：；) and its own double-width dash. French keeps the space before ; : ! and ?.

## Notes

- **Right-to-left languages** (Arabic, for example) are handled by the layout; the direction comes from the registry, so you only translate the text.
- **Partial packs are welcome.** Translating the navigation and the home page alone is a valuable first contribution.
- **A language not in the registry yet?** Add one line to `LOCALES` in `src/i18n/locales.ts` with the code, native name, English name, direction and `status: "stub"`, then add your pack, or ask for it by email and it will be added for you.
