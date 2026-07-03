# F5 BIG-IP license explainer

Paste the contents of `/config/bigip.license`, the full file or any fragment, and get a plain-language reading of what the license actually says. The parser runs entirely in your browser: nothing is uploaded, and key or signature values are never displayed, only their presence and length.

## What it reads

The explainer decodes the whole observable structure of the file. It identifies the management flavor: a `BIG-IQ Product License File` header together with `license_manager_key` or `pool_license_information` fields marks a license managed by BIG-IQ License Manager, while a `BIG-IP System License Key File` header marks one licensed directly on the system. It reads the identity block (`Auth vers`, `Usage`, `Vendor`), the licensing dates (`Licensed date` and `Service check date`, both in the file's compact `yyyymmdd` form), the `Registration Key` (checked against the published 5-5-5-5-7 shape from F5 K7752 and K3782), the `Licensed version`, and the `Platform ID` with a conservative decode (Z100-family means BIG-IP Virtual Edition, per F5 K02011230; unmapped IDs point you to F5 K9476).

Modules are read from their real grammar: each `active module` line is pipe-separated into the module name, that module's own 7-7 key, and its feature list, and a file can carry several such lines with distinct keys. `optional module` lines list features that are licensable but dormant until licensed. Repeatable `Exclusive_version` lines (the permitted software range, per F5 K42091606), `Deny_version` lines, and `Exclusive_Platform` lines are collected into constraint lists, and every remaining feature or limit token (`perf_VE_throughput_Mbps`, `mod_ltm`, `asm_apps`, and the rest) is shown with its value normalized: the file uses both `enabled` and `enable`, and both `UNLIMITED` and `unlimited`.

## The K7727 verdict

The `Service check date` is judged against F5's License Check Date table (K7727) using the same vendored table the F5 service check date tool uses, so both tools always agree: you see the newest version this license can boot and the nearest branch that would require a reactivation first.

## Using it

Paste and read; the Example button loads a masked, structure-faithful sample. Treat the file as sensitive: it carries your registration key, per-module keys, and the Dossier and Authorization signatures. This tool never displays those values, and because field meanings are vendor documentation rather than a fixed standard, confirm licensing decisions against F5's own documentation or support.
