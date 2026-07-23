# LDAP filter explainer

Paste any LDAP search filter and this tool parses it exactly the way a directory server does - per RFC 4515, the string representation every LDAP client, PingDirectory search, PingFederate datastore lookup, and Active Directory query ultimately compiles into.

## What you get

The annotated tree. Each AND (`&`), OR (`|`), and NOT (`!`) node states its rule in plain language; each leaf item is classified by match type - equality, presence (`=*`), substring (wildcards, with initial/contains/ends-with parts in order), `>=`, `<=`, approximate (`~=`), or extensible match. RFC 4515 hex escapes (`\2a`, `\28`, `\29`, `\5c`) are decoded and listed. The famous Active Directory matching-rule OIDs are recognized by name: `1.2.840.113556.1.4.803` (bit-AND - the classic disabled-account test `(userAccountControl:1.2.840.113556.1.4.803:=2)`), `804` (bit-OR), and `1941` (transitive group membership).

## Errors are anchored

A malformed filter fails with the exact character position and a caret under it - the unbalanced parenthesis, the item without `=`, the backslash missing its two hex digits.

## Privacy

Filters often contain internal attribute names and OU structure. Everything is parsed locally in your browser; nothing is transmitted.
