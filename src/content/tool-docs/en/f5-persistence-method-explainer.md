## What it does

Paste BIG-IP persistence profiles and virtual servers as a tmsh snippet and the tool explains the persistence behind each: which method it is, what it keys on, how it behaves, the fields that matter, and the ways it fails in practice. For each virtual server it also lays out the persistence chain, the primary method and the fallback used when the primary produces no record. It parses the configuration in your browser and contacts no device.

## What persistence is, and why the method matters

Persistence, also called session affinity, keeps a client pinned to the same pool member across multiple connections, which stateful applications need so that a session started on one server continues on that server. BIG-IP offers several methods, and the important thing is that each one keys on something different, so each one has its own failure mode. Choosing a method is really choosing what to key on and accepting how that key can break.

## The common methods and how they fail

- **Source-address** persistence keys on the client's IP address. Its classic failure is many clients arriving from behind a single NAT or proxy: they share one address, so they all pin to one pool member and the load skews. It also breaks if a client's address changes mid-session.
- **Cookie** persistence keys on an HTTP cookie the BIG-IP manages, in modes that insert, rewrite, or passively read it. It is precise, but it requires HTTP and a client that accepts cookies, so it does not apply to non-HTTP traffic.
- **SSL** persistence keys on the TLS session ID. It fails when clients rotate or renegotiate session IDs, or when session IDs are short-lived, which is why it is so often paired with a fallback.
- **Universal** persistence keys on a value an iRule extracts from the traffic, which lets you persist on almost anything (a token, a header, a field) at the cost of writing the rule.

Settings such as match-across-services, match-across-virtuals, and match-across-pools widen the scope over which a persistence record applies, and the tool reads these where they are set.

## The primary and fallback chain

A virtual server can name a primary persistence profile and a fallback one. When the primary method finds no existing record for a connection, BIG-IP uses the fallback to place it. A well-known pairing is SSL session-ID persistence with source-address as the fallback, so that a client whose session ID is not yet known is still pinned by IP. The tool shows this chain per virtual server so you can see what actually decides a member. For the bytes inside a persistence cookie specifically, the BIG-IP persistence cookie decoder is the companion tool; this one explains the method around it.

## Using it

Paste persistence profiles, virtual servers, or both, and read the method, keying, fields, and failure modes for each, plus the primary-to-fallback chain per virtual server. The parse is deterministic and local.

## Share results

At the head of the reading, **Share results** builds a link to this page, only when you press it, that carries the profiles and virtual servers after the `#` with the value of every secret setting replaced by `[redacted]`, never as pasted. A cookie profile can hold one: [`cookie-encryption-passphrase`](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_persistence_cookie.html) "Specifies a passphrase to be used for cookie encryption" (F5's tmsh reference, ltm persistence cookie, read 2026-10-27). Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

The copy is the [tmsh config explainer](/tools/f5-tmsh-config-explainer)'s, made with the same parser this page reads with, so every password, pass phrase, secret and SNMP community value of a larger paste is replaced too; the popover says how many were. `[redacted]` is one tmsh word, so the receiving page reads the same profiles, chains and fields. Profile, virtual server, pool and cookie names go as pasted; so does an iRule body, and the popover says so when there is one. [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the copy is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the box as a paste would and the page explains it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
