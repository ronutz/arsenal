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
