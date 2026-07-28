## What this tool does

Paste a `location`, its `proxy_pass`, and a request URI. The tool computes what the backend actually receives — and shows the **same configuration with the trailing slash flipped**, so the difference is visible rather than described.

## The rule

`proxy_pass http://backend;` has **no URI part**, so the original request URI is passed through unchanged, location prefix and all. `proxy_pass http://backend/;` **has** a URI part — even that single slash counts — so the part of the request matching the location prefix is **replaced** by it.

With `location /app/` and a request for `/app/page`: the first form sends `/app/page`, the second sends `/page`, and `proxy_pass http://backend/v2/;` sends `/v2/page`.

Which you want depends on the backend. An application mounted at the same path needs the prefix kept; one that does not know it sits behind a prefix needs it stripped. Choosing wrong produces a 404 from the backend for a request the proxy handled perfectly.

## The doubled slash is real

A location without a trailing slash plus a URI part sends a genuinely doubled slash upstream — `location /app` with `proxy_pass http://backend/` turns `/app/page` into `//page`. This tool reproduces that rather than tidying it, because a prettier answer than NGINX gives would hide the exact defect you came here to find.

## What it refuses

Regular-expression and named locations may not carry a URI part: there is no literal prefix to replace, so NGINX rejects the configuration at startup. The tool reports that rather than inventing a result.

## The variable exception

A variable anywhere in the value suspends the prefix substitution entirely, and moves upstream resolution to request time — which usually requires a `resolver` and turns a name failure into a runtime error rather than one `nginx -t` would catch.

## Honest limits

No `rewrite`, `try_files` or internal redirects: this answers what path the backend receives, not what the whole request does. Upstream blocks are not resolved to servers, and query strings pass through unmodelled.
