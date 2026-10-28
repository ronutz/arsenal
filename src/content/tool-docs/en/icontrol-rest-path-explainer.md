## What it does

Paste an iControl REST URL and the tool decodes it: the TMOS module, the collection, the tilde-encoded partition and folder path together with its `tmsh` equivalent, any sub-collection such as pool members, and the query options. It parses the URL text only: nothing is fetched and nothing leaves the browser.

## The tilde

`/mgmt/tm/ltm/pool/~Common~apps~web_pool` addresses `/Common/apps/web_pool`. The tilde is a folder separator, used because **a URL already uses the slash for its own structure**. The tool always shows the `tmsh` form beside the decoded parts, because that is the form most readers already know.

## The partition detail that causes 404s

A name written without a partition is resolved **in the caller's current partition**. The same request can succeed for one administrator and return 404 for another, with nothing wrong in either case. The tool says so whenever the object name is unqualified.

## Query options

`$select`, `$filter`, `$top`, `$skip`, `expandSubcollections`, `options` and `ver` are explained individually. The one worth knowing is **`expandSubcollections`**: without it, a pool comes back with no members, which is the most common surprise in this API.

## What it will not do

The module table is finite. If a path uses a module the tool does not know, it decodes the structure and **says the module is unrecognised rather than describing it from a guess**. It validates nothing against a device and cannot tell you whether the object exists.

## Share results

Under the overview, **Share results** builds a link to this page, only when you press it, that carries the path after the `#` with any credential in it replaced, never as typed. Its popover says first what the link carries and how many values were replaced, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

- **An auth token in the path** is masked with its shape kept (capitals become `X`, small letters `x`, digits `0`), so the page still reads it as the object it addressed. F5's own guide extends a token with `PATCH /mgmt/shared/authz/tokens/{{ bigip_auth_token }}` ([AS3, Authentication and Authorization](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/userguide/authentication.html), read 2026-10-27), which puts the token itself in the path.
- **A password before the host** (`https://user:password@host/...`) becomes `[redacted]`: [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1 (read 2026-10-27), says applications "should not render as clear text any data after the first colon" of a userinfo.
- **An `X-F5-Auth-Token` or `Authorization` header** pasted with the path loses its credentials to `[redacted]` (the same guide sends the token in `X-F5-Auth-Token`; [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2).

The host, the module, the collection, the object names and the query options go as typed; the tool's share vectors check that the receiving page reads the same parts. [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the copy is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the box as a paste would and the page decodes it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## The companion tool

The F5OS RESTCONF path explainer decodes the platform layer underneath a tenant, which uses RESTCONF over YANG rather than this object model. The two APIs look nothing alike because they come from different traditions, not different versions.
