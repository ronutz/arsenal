## What it does

Paste two FortiOS configurations separated by a line of `---` and get a **structural** diff: what changed by section, object and setting. It runs entirely in your browser.

## Why a line diff is the wrong tool here

A textual diff finds a minimal **edit script**, which is not the same thing as the change a human made. Applied to FortiOS output that produces three specific annoyances:

- A block that **moved** is reported as a deletion plus an insertion, so a review of an unchanged object costs the same attention as a real edit.
- An object appears changed because a neighbour grew a line and the alignment shifted.
- Three genuine edits sit buried inside four hundred lines of unchanged context.

This tool parses both sides into section, object and setting, then compares the structures. A block that moved is not a change. A setting that changed is one line naming the old value and the new one.

## The one place order is not noise

For most sections the order of objects is irrelevant — address objects, service objects, interfaces. Reporting a reordering there would be noise, so it is ignored.

For **firewall policy** and its relatives, order **is** the behaviour. First match wins, so moving a policy above another changes what the device does without changing a single setting. That is the edit a line diff buries most thoroughly, because nothing on either side of the move differs textually except position.

Those sections are treated as order-sensitive by name, and a reordering in them is reported as a real finding:

`firewall policy` · `firewall policy6` · `firewall proxy-policy` · `firewall local-in-policy` · `firewall shaping-policy` · `firewall security-policy` · `router policy` · `router policy6` · `system sdwan`

Treating both cases the same way — in either direction — would make the tool wrong, so both behaviours are pinned by golden vectors.

## Input

Two configurations, either separated by a line containing only `---`, or labelled with `BEFORE:` and `AFTER:` on their own lines. Each side is ordinary `show` or `show full-configuration` output.

Nested `config` blocks inside an object are parsed, and their settings are prefixed with the nested path so they cannot collide with a same-named setting on the parent object.

## What it does not do

**It compares, it does not judge.** It will tell you that a policy moved or an address changed; it will not tell you whether that was a good idea, because that depends on intent it cannot see.

It also does not model the semantic weight of a setting. Changing a comment and changing an action both read as one changed setting, and it is left to the reader to know which matters.

Identical input produces silence rather than a reassurance banner. A diff tool that finds phantom changes is untrustworthy on the ones that count, so a vector pins that too.

## Where it fits

Pair it with the FortiGate firewall policy and NAT article, which explains why order determines behaviour in the sections this tool treats as order-sensitive.
