# F5 BIG-IP license explainer

Paste the contents of `/config/bigip.license`, the full file or any fragment, and get a plain-language reading of what the license actually says. The parser runs entirely in your browser: nothing is uploaded, and key or signature values are never displayed, only their presence and length.

## What it reads

The explainer decodes the whole observable structure of the file. It identifies the management flavour: a `BIG-IQ Product License File` header together with `license_manager_key` or `pool_license_information` fields marks a license managed by BIG-IQ License Manager, while a `BIG-IP System License Key File` header marks one licensed directly on the system. It reads the identity block (`Auth vers`, `Usage`, `Vendor`), the licensing dates (`Licensed date` and `Service check date`, both in the file's compact `yyyymmdd` form), the `Registration Key` (checked against the published 5-5-5-5-7 shape from F5 K7752 and K3782), the `Licensed version`, and the `Platform ID` with a conservative decode (Z100-family means BIG-IP Virtual Edition, per F5 K02011230; unmapped IDs point you to F5 K9476).

Modules are read from their real grammar: each `active module` line is pipe-separated into the module name, that module's own 7-7 key, and its feature list, and a file can carry several such lines with distinct keys. `optional module` lines list features that are licensable but dormant until licensed. Repeatable `Exclusive_version` lines (the permitted software range, per F5 K42091606), `Deny_version` lines, and `Exclusive_Platform` lines are collected into constraint lists, and every remaining feature or limit token (`perf_VE_throughput_Mbps`, `mod_ltm`, `asm_apps`, and the rest) is shown with its value normalised: the file uses both `enabled` and `enable`, and both `UNLIMITED` and `unlimited`.

## The K7727 verdict

The `Service check date` is judged against F5's License Check Date table (K7727) using the same vendored table the F5 service check date tool uses, so both tools always agree: you see the newest version this license can boot and the nearest branch that would require a reactivation first.

## Using it

Paste and read; the Example button loads a masked, structure-faithful sample. Treat the file as sensitive: it carries your registration key, per-module keys, and the Dossier and Authorization signatures. This tool never displays those values, and because field meanings are vendor documentation rather than a fixed standard, confirm licensing decisions against F5's own documentation or support.

## Share results

At the end of the first panel, **Share results** builds a link to this page, only when you press it, that carries the licence after the `#` with every key and signature masked, never as pasted. Its popover says first what the link carries and how many values were masked, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

Masked: the registration key and every add-on key, wherever they stand (comments and `tmsh show sys license` lines included), and the Dossier, Authorization, `license_manager_key` and `pool_license_information` values, which this page already shows as presence and length only. F5's tmsh reference ([sys license](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_license.html), read 2026-10-27) is why: a licence is installed with `registration-key` and `add-on-keys`, and after a revoke "the registration key may subsequently be re-used to relicense this or another VE instance". F5's own articles agree: [K7752](https://my.f5.com/manage/s/article/K7752) (read 2026-10-27) gives the shapes masked here, a 27-character base registration key and seven-and-seven add-on keys, and calls the dossier "an encrypted list of key characteristics used to identify the platform"; [K3782](https://my.f5.com/manage/s/article/K3782) (read 2026-10-27) has a Virtual Edition's support cases opened with the last seven digits of its registration key. Each value keeps its shape (capitals and digits become `X`, small letters `x`), so the receiving page reads the same licence, the same verdict on each key's shape and the same lengths, with the keys shown masked; the tool's share vectors check it. Dates, modules, features, constraints, the platform and the serial number go as pasted. [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the copy is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the box as a paste would and the page reads it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
