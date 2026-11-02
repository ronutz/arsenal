## What it does

Give a model series or an OS name and the tool says which naming applies, which versions the rename landed at, and what comes with that particular series. The two naming pairs are shown **before any input**, because somebody arriving after a document said one word and their switch said another needs the answer immediately.

## The rename, in one line each

- **ExtremeXOS (EXOS) → Switch Engine**, from 31.6
- **VOSS → Fabric Engine**, from 8.6

Both apply **only to Universal hardware**: 4120, 4220, 5320, 5420, 5520, 5720, 7520, 7720. Anything else keeps the original names, and **the image filenames and boot menus still use them too**, so a boot menu offering to change the OS "to VOSS" on a Fabric Engine switch is neither a bug nor a stale build.

## The warning it always gives

**Changing persona deletes the configuration.** Extreme's own wording: changing the network operating system deletes all configuration files, debug information, logs, events and statistics belonging to the previous one. **It is a rebuild, not a migration**, and the tool says so on every lookup rather than only when a model is recognised.

It also flags the boot question being asked in the negative: **N keeps Switch Engine, Y moves to Fabric Engine**.

## Series caveats it surfaces

- **7520**: stacking works under Switch Engine and **not** under Fabric Engine. If the design needs stacking, the persona choice is already made.
- **5420 and 5520**: upgrading to Switch Engine 31.6 **changes the SNMP SysObjectID**, so monitoring that identifies the device by that value stops recognising it, with nothing looking wrong from the console.
- **Fabric Engine minimums differ**: 8.6 on the 5320, 5420 and 5520; 8.7 on the 5720.

## What it will not do

It works at series level rather than by individual part number, deliberately: the naming question is answered by series, and a table of SKUs would go stale faster than it helped. It does not know your inventory or your installed versions.

## Share results

Under the answer, **Share results** builds a link to this page, only when you press it, that carries the model series or OS name as typed (`input`) after the `#`, and nothing else. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

The two naming pairs and the family list are the page itself, so they are not in the link.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the name is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **Opening a link.** The name fills the box as typing would and the page maps it; nothing is sent. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
