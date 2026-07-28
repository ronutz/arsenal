## What this tool does

Paste your cache directives, the request, and the upstream response. The tool answers **two separate questions** — will this response be **stored**, and will a later matching request be **served** from it — with the ordered rule walk behind each, plus the computed cache key.

They are separate on purpose. A response can be perfectly cacheable and never served because the key differs; a response can be served when it should not be because the key ignores something that mattered.

## The store rules, in order

Caching is off entirely unless `proxy_cache` names a zone — by far the most common reason nothing is ever cached. Only the methods in `proxy_cache_methods` are cached, defaulting to GET and HEAD. A response carrying `Set-Cookie` is not stored, on the assumption it is user-specific. Upstream `Cache-Control: no-cache`, `no-store` or `private` prevents storage. A status with no `proxy_cache_valid` and no freshness header has no lifetime to be stored under. And `proxy_no_cache` with a non-empty, non-zero value prevents the write.

## The pair people swap

`proxy_no_cache` prevents the **write**. `proxy_cache_bypass` skips the **lookup** and still writes the result. They read like synonyms and are opposites in the half that matters — using bypass where you meant no_cache fills the cache with exactly what you were trying to keep out.

## The asymmetry that leaks

NGINX excludes cookied **responses** from storage. It does **not** exclude cookied **requests** from being served a shared entry.

That is usually harmless, because the personalised responses were never stored — until someone adds `proxy_ignore_headers Set-Cookie` to make caching "work" on a backend that sets a session cookie on every response. Now per-user responses sit under a key every user shares. The tool warns on exactly this combination, because it is a two-line change that looks like a performance fix.

## Honest limits

One exchange, not the cache lifecycle: no `proxy_cache_use_stale`, no `proxy_cache_lock`, no revalidation, no `min_uses` accounting, no `Vary` handling. Freshness is treated as present or absent rather than computed, so an expired entry is out of scope. Key rendering substitutes the common variables and leaves anything else as written.
