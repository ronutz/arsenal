# PAN-OS policy evaluation order

Paste a rulebase that spans Panorama layers and local firewall rules. The tool puts it into the order PAN-OS actually evaluates it, optionally traces one flow to the rule that decides it, and reports the rules that never fire because something above them already matches. Everything runs in the browser.

## The problem it addresses

A standalone firewall evaluates one ordered list, and reading it is straightforward. A Panorama-managed firewall or a Prisma Access tenant does not. It evaluates by layer and by type, in this order:

1. Shared pre-rules
2. Device group pre-rules
3. **Local firewall rules**
4. Device group post-rules
5. Shared post-rules
6. Default rules

The local rules an administrator can see and edit on the firewall sit in the middle of a sandwich they cannot edit from the firewall at all. That is the most common surprise in a Panorama estate: a local rule that looks perfectly correct never runs, because a shared pre-rule two layers above it already matched and evaluation stopped there.

## Shadowing, and why the vendor's own tooling does not report it

Palo Alto's security policy best-practices document is explicit about the gap:

> Commit and Push doesn't provide shadowing information.

A broad rule placed above a specific one captures the traffic the specific rule was written for. The specific rule never fires. Nothing in the push warns you, and the symptom shows up later as traffic being treated in a way nobody intended.

The tool reports shadowing, and flags two cases specially. **Crossing a layer** matters because a local rule shadowed by a shared pre-rule cannot be seen or fixed from the firewall at all; the fix lives in Panorama. **A differing action** matters because it means the outcome is not merely redundant, it is the opposite of what the shadowed rule was written to do.

The shadowing test is deliberately conservative. It reports a rule as shadowed only when the rule above it is a superset on every single field, which means every packet the lower rule could match is already taken. Partial overlaps are not reported, because partial overlap is often intentional, and a shadowing report that cries wolf is one nobody reads, which would be worse than the vendor's current position of reporting nothing.

## The defaults are not symmetric

At the bottom of every rulebase sit two default rules, and they do opposite things:

- **intrazone-default** allows all traffic within a zone
- **interzone-default** denies all traffic between zones

A model that treated "nothing matched" as a single implicit deny would be wrong for every same-zone flow. The tool applies whichever default the zones call for and says which one it used.

Both can be modified to log or apply security profiles, which is worth doing: traffic that reaches the defaults is traffic no rule anticipated.

## Writing a rulebase for the tool

One rule per line. The layer is named first, deliberately: it is the thing this tool exists to reveal, and a grammar that let you omit it would let you forget the very thing you came to check.

```
shared-pre | block-tor      | deny  | from=any to=any app=tor
dg-pre     | allow-dns      | allow | from=trust to=untrust app=dns svc=application-default
local      | web-out        | allow | from=trust to=untrust app=web-browsing
dg-post    | catch-all-deny | deny  | from=any to=any
```

Fields are `key=value`, with commas inside a value for lists. Anything omitted defaults to `any`, which is what PAN-OS does. Accepted keys: `from`, `to`, `src`, `dst`, `app`, `svc`, `user`. Actions are `allow`, `deny`, `drop`, `reset-client`, `reset-server`, `reset-both`.

## What it does not do

It does not read your configuration, connect to Panorama, or collect anything. It does not model App-ID shifting mid-session, security profiles, NAT, or decryption policy. It reasons about the **order** of the rules you give it, which is the part decided at commit time and the part that is hard to see.

## A note on authorization

This site claims no Palo Alto Networks authorization or partnership. The tool reasons about evaluation order published in Palo Alto's own documentation. It is analysis of a public specification, not vendor material, and carries no endorsement.

## Share results

Under the evaluation order, **Share results** builds a link to this page, only when you press it, that carries the rulebase as typed (`#input=...`). The flow you trace is not carried, and when a trace is on the popover says so. Before you copy anything the popover adds a caution: a rulebase names your zones, addresses and users, so read it before you send the link. Everything the link carries goes after the `#`, which [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has "separated from the rest of the URI prior to a dereference": a browser does not send it to the server when the link is opened, but it stays in the address bar and history of whoever opens it, and anyone who has the link can read it.

- **How long.** A link carries at most 16,384 characters, the bound the site uses for every value after the `#`; a longer one gets no link, and the popover says how long it would be.
- **Opening a link.** The link is the same address other links into this tool use: the rules fill the box and are evaluated as a paste would. As with every link into this tool, the value stays after the `#` until you change or clear the field, and then leaves the address without a request.

## Sources

- Palo Alto Networks, *Device Groups*: a firewall evaluates policy rules by layer and by type, top to bottom; local firewall rules display between the pre-rules and post-rules
- Palo Alto Networks, *Security Policy Rulebase Best Practices*: first match wins and comparison stops; Commit and Push does not provide shadowing information
- Palo Alto Networks, *Security Policy Rule Best Practices*: shadowing defined; intrazone-default allows and interzone-default denies
- Palo Alto Networks, *Defining Policies on Panorama*: pre-rules are evaluated first, post-rules last
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-10-27): section 3.5, the fragment, which carries a Share results link's values
