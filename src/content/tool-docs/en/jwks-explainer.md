## What it does

Paste a JSON Web Key Set and the tool breaks it down key by key: for each key it reads the type, the key id, the intended use and algorithm, and the type-specific parameters, and it flags any key that contains private material. If you also paste a JWT, it matches the token to the key that should verify it by comparing key ids. Nothing leaves your browser.

## What a JWKS is

A JSON Web Key Set (JWKS) is the JSON document an identity provider publishes, usually at `/.well-known/jwks.json`, so that anyone can verify the tokens it signs without a shared secret. It is simply a list of keys:

    { "keys": [ {JWK}, {JWK}, ... ] }

Each entry is a JSON Web Key (JWK) describing one key: its type (`kty`, such as RSA, EC, or OKP), an optional key id (`kid`), what it is for (`use`, typically `sig` for signing or `enc` for encryption), the algorithm it goes with (`alg`), and the parameters specific to that key type.

## Public and private material

This distinction is the security point of the tool. A JWKS published for verification should contain only public keys. Each key type has public parameters and private ones: an RSA key publishes its modulus and exponent (`n`, `e`) and keeps its private exponent (`d`) secret; an elliptic-curve key publishes its coordinates (`x`, `y`) and keeps its private scalar (`d`); a symmetric key (`oct`) is nothing but the secret (`k`). If a key in the set carries any of the private fields, it means private key material has been exposed, which is a serious mistake, so the tool flags it explicitly.

## Matching a token to its key

A signed JWT usually names, in its header, the key id (`kid`) of the key that signed it. A verifier looks through the JWKS for the key with that `kid` and uses it. The tool does the same: given a JWT and a set, it finds the key whose `kid` matches the token's, which is exactly the lookup a real verifier performs before checking the signature. The key parameters follow RFC 7517 and RFC 7518, with the OKP key type for Edwards-curve keys (such as Ed25519) defined in RFC 8037.

## Using it

Paste a JWKS to inspect every key and catch any exposed private material, and optionally paste a JWT to see which key in the set is the one meant to verify it.
