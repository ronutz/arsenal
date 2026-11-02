## What it does

This is a teaching tool. It runs a bounded, brute-force search in your browser that tries to find an input whose hash matches a target digest. Against a weak input, a short PIN or a few lowercase letters, it succeeds in seconds; against anything with real entropy it exhausts its capped keyspace and stops without an answer. That contrast is the point: it shows, first-hand, why a fast unsalted hash is a poor way to protect a password, and why a high-entropy secret is safe even against direct search.

## What a preimage is, and how the search works

A hash is one-way, so there is no formula that turns a digest back into its input. The only generic way to reverse one is to guess: pick a candidate, hash it, and see whether the digest matches. This finder does exactly that. It enumerates candidates over an alphabet and length you choose (digits, lowercase letters, and so on) and hashes each one locally until it finds a match or runs out of candidates. It uses no dictionary, no wordlist, and no precomputed table, so it is purely a demonstration of exhaustive search, not a password-cracking kit.

## Why weak inputs fall and strong ones do not

The number of candidates is the size of the alphabet raised to the length. A 4-digit PIN is only 10^4, that is 10,000 possibilities, trivially searchable; six lowercase letters is 26^6, about 300 million, still small for a computer; but every extra character multiplies the space, so a genuinely random secret pushes the count far beyond what any bounded local search can cover. This is exactly why fast hashes like MD5 or SHA-256, which can be computed billions of times per second, are unsuitable for passwords, and why real systems add a salt and use a deliberately slow key-derivation function, as recommended by the OWASP Password Storage guidance and NIST SP 800-63B.

## What it cannot do

Because the keyspace is capped and there is no wordlist, the tool only ever recovers inputs that were already known to be weak. It cannot attack a salted hash, and it cannot attack a hash produced by a slow key-derivation function such as bcrypt, scrypt, Argon2, or PBKDF2, which are designed to make each guess expensive.

It has no list of breached passwords either. To check whether a particular password has already appeared in a data breach, without sending it, use the [Pwned Passwords check](/dev/out/pwned-passwords) in the red room: it sends only the first five characters of the password's SHA-1 hash, and only when you press Ask or Enter.

## Using it

Enter a target digest, or hash a sample input to produce one, choose the alphabet and maximum length to search, and watch the search run. Try a short numeric input to see it succeed quickly, then add length or widen the alphabet to watch the keyspace outrun the search.

## Share results

Below the search and any result it gave, **Share results** builds a link to this page, only when you press it, that carries the search as you set it up after the `#`: the hash, the alphabet and the maximum length. It never carries what a search found, and opening it never starts one. Its popover says first what the link carries, then a caution of its own, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

The caution matters here more than anywhere: this page exists to show that a fast, unsalted hash of a weak input is the input. Whoever opens the link can press Start search and get the answer you got, so send hashes of test values, never of a real password.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the values are not sent to the server when the link is opened; they stay in the address bar and the history of whoever opens it, and anyone who has the link can read them.

- **Opening a link.** The three fields fill, any search in progress stops, and a note asks you to press Start search: the search runs only when you choose, in your browser. A hash whose algorithm the page cannot tell from its length, an alphabet the page does not offer, or a length outside 1 to that alphabet's ceiling, makes the whole link ignored. Either way the values leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
