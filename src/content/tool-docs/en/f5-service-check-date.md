## What it does

Give the tool a BIG-IP version and it returns the minimum service check date that version's license must carry; give it a service check date and it returns the newest version you can upgrade to, along with the newer branches you cannot reach yet and the date each one needs. It is a two-way lookup over a vendored copy of F5's published License Check Date table, and it runs entirely in your browser.

## The two dates it works from

Every BIG-IP version carries a static **License Check Date**: the minimum service check date a license must have to be allowed to boot that version. Every license carries a **Service Check Date**: the earlier of the date it was last activated and the date its service contract expires. When you upgrade to a new major or minor version, the system compares the two, and if the license's Service Check Date is earlier than the version's License Check Date, the upgraded system boots but does not load its configuration until the license is reactivated. The tool encodes F5's License Check Date table (from K7727) and does that comparison for you, in either direction.

Dates are handled in the exact form BIG-IP writes into `bigip.license`, the eight-digit `yyyymmdd` (so `20230208` is 8 February 2023), and shown in ISO form too. The comparison is pure date arithmetic with no clock involved: both the version's date and the service check date are inputs, so the same inputs always give the same answer.

## Worked examples

Enter a version, get its floor. `17.1.3` resolves to the `17.1.x` branch and reports a minimum service check date of `2023-02-08` (`20230208`); `21.1` reports `2026-04-15`; `16.1.x` reports `2021-06-11`.

Enter a service check date, get your ceiling. A service check date of `2023-06-15` reaches up to `17.1.x` as the newest branch, and reports the branches you cannot reach yet: `17.5.x` (needs `2025-02-12`), `21.0.x` (needs `2025-10-29`), and `21.1.x` (needs `2026-04-15`). A recent date such as `2026-05-01` reaches the newest branch with nothing blocked; a date older than the whole table reaches nothing, the signal that the license needs reactivating before any upgrade.

## Only major and minor upgrades are gated

The check applies to an upgrade, which F5 defines as a change in the first or second version number. A move between maintenance or point releases within the same branch is an update, and it triggers no service check date verification at all. That is why the tool works at major.minor granularity: once your service check date is recent enough to reach `17.1.x`, it is recent enough for every maintenance and point release in that branch. So the answer for `17.1.0`, `17.1.3`, and `17.1.x` is the same single date.

## Using it

Type a BIG-IP version (`17.1.3`, `21.1`, `16.1.x`) or a service check date (`20230611`, `2023-06-11`, or `2023/06/11`); the tool detects which you gave and answers accordingly. Because this encodes vendor documentation rather than a fixed standard, and F5 adds a row with each release, confirm any value against F5 K7727 or the target system's `/etc/version_date` before a production upgrade.
