# LDAP filter explainer

Paste any LDAP search filter and this tool parses it exactly the way a directory server does - per RFC 4515, the string representation every LDAP client, PingDirectory search, PingFederate datastore lookup, and Active Directory query ultimately compiles into.

## What you get

The annotated tree. Each AND (`&`), OR (`|`), and NOT (`!`) node states its rule in plain language; each leaf item is classified by match type - equality, presence (`=*`), substring (wildcards, with initial/contains/ends-with parts in order), `>=`, `<=`, approximate (`~=`), or extensible match. RFC 4515 hex escapes (`\2a`, `\28`, `\29`, `\5c`) are decoded and listed. The famous Active Directory matching-rule OIDs are recognised by name: `1.2.840.113556.1.4.803` (bit-AND - the classic disabled-account test `(userAccountControl:1.2.840.113556.1.4.803:=2)`), `804` (bit-OR), and `1941` (transitive group membership).

## Errors are anchored

A malformed filter fails with the exact character position and a caret under it - the unbalanced parenthesis, the item without `=`, the backslash missing its two hex digits.

## Privacy

Filters often contain internal attribute names and OU structure. Everything is parsed locally in your browser; nothing is transmitted.

## Share results

Under the filter's counts, **Share results** builds a link to this page, only when you press it, that carries the filter as typed after the `#`, including one that does not parse: its anchored error is the reading you may want to show. Its popover says first what the link carries, then a caution of its own: a filter can name users, groups and the shape of your directory, so read it before you send the link. Then it offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

A filter that asserts a value of a password attribute gets no link, and the popover names the attribute: `userPassword` ([RFC 4519](https://www.rfc-editor.org/rfc/rfc4519), section 2.41, OID 2.5.4.35, "octet strings that are known only to the user and the system"), `authPassword` ([RFC 3112](https://www.rfc-editor.org/rfc/rfc3112), OID 1.3.6.1.4.1.4203.1.3.4) and Active Directory's `unicodePwd` ([Microsoft's AD schema](https://learn.microsoft.com/en-us/windows/win32/adschema/a-unicodepwd), attribute ID 1.2.840.113556.1.4.90), all read 2026-11-01. They are recognised by name or OID, in any case and with any options, as [RFC 4512](https://www.rfc-editor.org/rfc/rfc4512) (section 2.5, read 2026-11-01) makes attribute descriptions case-insensitive with options after a `;`. A presence test such as `(userPassword=*)` carries no value and goes.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the filter is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters, the bound the site uses for every value after the `#`; a longer filter gets no link, and the popover says how long it is.
- **Opening a link.** The filter fills the box and the page explains it as for a paste; nothing is sent to a directory. A filter asserting a password is ignored. Either way the value leaves the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
