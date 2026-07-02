## What it does

This is a teaching tool. It runs a bounded, brute-force search in your browser that tries to find an input whose hash matches a target digest. Against a weak input, a short PIN or a few lowercase letters, it succeeds in seconds; against anything with real entropy it exhausts its capped keyspace and stops without an answer. That contrast is the point: it shows, first-hand, why a fast unsalted hash is a poor way to protect a password, and why a high-entropy secret is safe even against direct search.

## What a preimage is, and how the search works

A hash is one-way, so there is no formula that turns a digest back into its input. The only generic way to reverse one is to guess: pick a candidate, hash it, and see whether the digest matches. This finder does exactly that. It enumerates candidates over an alphabet and length you choose (digits, lowercase letters, and so on) and hashes each one locally until it finds a match or runs out of candidates. It uses no dictionary, no wordlist, and no precomputed table, so it is purely a demonstration of exhaustive search, not a password-cracking kit.

## Why weak inputs fall and strong ones do not

The number of candidates is the size of the alphabet raised to the length. A 4-digit PIN is only 10^4, that is 10,000 possibilities, trivially searchable; six lowercase letters is 26^6, about 300 million, still small for a computer; but every extra character multiplies the space, so a genuinely random secret pushes the count far beyond what any bounded local search can cover. This is exactly why fast hashes like MD5 or SHA-256, which can be computed billions of times per second, are unsuitable for passwords, and why real systems add a salt and use a deliberately slow key-derivation function, as recommended by the OWASP Password Storage guidance and NIST SP 800-63B.

## What it cannot do

Because the keyspace is capped and there is no wordlist, the tool only ever recovers inputs that were already known to be weak. It cannot attack a salted hash, and it cannot attack a hash produced by a slow key-derivation function such as bcrypt, scrypt, Argon2, or PBKDF2, which are designed to make each guess expensive.

## Using it

Enter a target digest, or hash a sample input to produce one, choose the alphabet and maximum length to search, and watch the search run. Try a short numeric input to see it succeed quickly, then add length or widen the alphabet to watch the keyspace outrun the search.
