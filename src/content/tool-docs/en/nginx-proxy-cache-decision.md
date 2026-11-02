## What this tool does

Paste your cache directives, the request, and the upstream response. The tool answers **two separate questions**: will this response be **stored**, and will a later matching request be **served** from it? Behind each answer is the ordered rule walk, plus the computed cache key.

They are separate on purpose. A response can be perfectly cacheable and never served because the key differs; a response can be served when it should not be because the key ignores something that mattered.

## The store rules, in order

Caching is off entirely unless `proxy_cache` names a zone, by far the most common reason nothing is ever cached. Only the methods in `proxy_cache_methods` are cached, defaulting to GET and HEAD. A response carrying `Set-Cookie` is not stored, on the assumption it is user-specific. Upstream `Cache-Control: no-cache`, `no-store` or `private` prevents storage. A status with no `proxy_cache_valid` and no freshness header has no lifetime to be stored under. And `proxy_no_cache` with a non-empty, non-zero value prevents the write.

## The pair people swap

`proxy_no_cache` prevents the **write**. `proxy_cache_bypass` skips the **lookup** and still writes the result. They read like synonyms and are opposites in the half that matters: using bypass where you meant no_cache fills the cache with exactly what you were trying to keep out.

## The asymmetry that leaks

NGINX excludes cookied **responses** from storage. It does **not** exclude cookied **requests** from being served a shared entry.

That is usually harmless, because the personalised responses were never stored, until someone adds `proxy_ignore_headers Set-Cookie` to make caching "work" on a backend that sets a session cookie on every response. Now per-user responses sit under a key every user shares. The tool warns on exactly this combination, because it is a two-line change that looks like a performance fix.

## Honest limits

One exchange, not the cache lifecycle: no `proxy_cache_use_stale`, no `proxy_cache_lock`, no revalidation, no `min_uses` accounting, no `Vary` handling. Freshness is treated as present or absent rather than computed, so an expired entry is out of scope. Key rendering substitutes the common variables and leaves anything else as written.

## Share results

Under the two verdicts, **Share results** builds a link to this page, only when you press it, that carries a copy of the box after the `#`; it carries the box as typed only if you tick the switch described below. The exchange's headers are the lesson, and pasted from a browser's developer tools they are live: cookie values are commonly session identifiers ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 8.4, read 2026-11-01) and an `Authorization` value "consists of credentials" ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2, read 2026-11-01). The decision reads whether those headers are there, never their values; only the rendered cache key shows a value, where the key names `$cookie_<name>` or `$http_<name>` ([ngx_http_core_module, Embedded Variables](https://nginx.org/en/docs/http/ngx_http_core_module.html#variables), read 2026-11-01). So the copy replaces each cookie value of a `request_header Cookie:` line, the cookie value of a `response_header Set-Cookie:` line (its name and attributes stay), the credentials after the scheme of an `Authorization` or `Proxy-Authorization` line (the scheme stays), and the whole value of a header whose name looks secret (`X-Api-Key`, `X-Auth-Token`) with `[redacted]`; every other byte stays as typed, comments included. Before the link is offered, the copy is decided again and must give the same decision (stored, served, every rule's outcome, every warning), or there is no link; the key and the step that quotes it then show `[redacted]` where a value was. The copy is then searched for a credential still in it (a JWT in the URI, a key): one means no link, and the popover names its line.

Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. It also says how many values were replaced. When it replaced any, a switch under its first line, **Include the replaced values in the link**, lets you send them after all, for an exchange written with made-up values or a key that names a cookie: it is off every time the popover opens; ticked, the link carries the box as typed, and the popover warns that cookie values are often live sessions and `Authorization` values are credentials. The switch is not offered when a credential has already stopped the link.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy (or, with the switch, the box) fills the box as a paste would, and the page decides. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
