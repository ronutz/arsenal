## What it does

On a BIG-IP, "does this start at 0 or at 1?" has no single answer. Tcl, the language under iRules, counts every position from 0. Several commands F5 added count from 1. Counters return 1 for the first item. Many zeros in the configuration are values rather than positions. The finder collects 76 of these places, each with its source, so you can check the one you are about to rely on.

It has two modes:

- **Look up** lists the places, grouped by part of the system: Tcl inside iRules, the commands F5 adds to iRules, configuration objects, platform and hardware, the APIs, and logging and packet capture. Search by command or term, or filter by where counting starts.
- **Translate a position** takes a position the way people count it, where 1 is the first, turns it into the number each command needs, runs each command in the site's Tcl 8.4.6 teaching engine, and shows the off-by-one version next to it.

## How to read an entry

- **The badge** says how the place counts: `0` starts at 0, `1` starts at 1, `←` counts from the right (`end`, `end-1`, the last N), `0·1` means both bases meet in the same place, `=0` means 0 is a value with a meaning (default, no limit, all, success, equal), and `n` means a count that is easy to mistake for a position.
- **Counts**, **First**, **Last** and **Nothing there** say what is counted, how to reach the first and the last item, and what comes back when nothing is there (-1, 0 or an empty string).
- **Example** shows the code and what it returns. Every Tcl example was run in a real tclsh 8.4.6.
- **Watch out** is the trap that entry is known for.
- **F5's pages disagree** appears when two F5 statements cannot both be right.
- **How sure** separates four levels: stated by the Tcl manual and run in tclsh 8.4.6; stated by the source; shown only by an example on the source page; and two F5 statements that disagree.
- **Sources** lists every page the entry rests on, with the date it was read.

## Rules of thumb

1. Tcl positions count from 0, and `end` is the last index, the length minus one.
2. F5's field-style numbers count from 1: `getfield` fields, `URI::path` depths, LTM policy path-segment indexes, the legacy `matchclass`.
3. Counters return 1 for the first item: `HTTP::request_num`, `table incr`.
4. Many zeros are values, not positions: route domain 0, port 0, `connection-limit 0`, `SSL::verify_result` 0, and tcpdump's `0.0`.
5. Lower goes first almost everywhere (event priority, policy ordinals, BIG-IP DNS order, syslog severity), except pool priority groups, where higher wins.
6. In an `if`, 0 is false and every other number is true, -1 included: compare an index with `>= 0` instead of testing it, and store your own flags as 0 or 1, as the DevCentral iRules Style Guide asks.

## The translator

Pick a question, give a value and N (1 is the first):

- **The Nth character**: `string index` and `string range` with N-1, and F5's `substr`, next to `string index` with N.
- **The Nth field after a split**: F5's `getfield` with N, and `split` then `lindex` with N-1, next to both counted the wrong way.
- **The Nth segment of a path**: the same two commands, with the empty piece before a leading slash taken into account, next to the version that forgets it.
- **The last N labels of a host name**: F5's `domain`, and `split`, `lrange` from the end and `join`, next to the version that takes one label too many.
- **The Nth element of a Tcl list**: `lindex` with N-1, next to `lindex` with N.
- **Where text first appears**: `string first`, and the test `>= 0`, next to an `if` on the index itself.

Each row is marked **Its own numbering** (the right number for that command), **Off by one**, or **A related answer**. The answer at the top is what the first right row returned, and a note appears when right rows disagree with each other. Notes explain the cases that change the numbers: a value that starts with the separator, a path with a query string (`HTTP::uri` includes it, `HTTP::path` does not), a separator of more than one character (`split` treats each character as a separator, `getfield` uses the whole string), and a match at index 0 or a miss at -1.

## Where F5's pages disagree

Reading the sources closely turned up places where two F5 statements cannot both be right. None was tested on a BIG-IP for this tool, so treat each one as a question to check on your version: the `substr` count of 0, the `URI::path` example comments, the `matchclass` value for no match, the range on the `priority` page, the `DNSMSG::record` example's variable name, the iControl REST description of a policy ordinal, the order of APM access control lists (ACLs), and the priority `LB::server` reports for a member with none configured. Each conflict appears on its entry, with both sources.

## Limits

- The translator takes a value of up to 2,000 characters, an N from 1 to 1,000, a separator of up to 20 characters and search text of up to 200 characters, and each command stops after 200 steps.
- The F5 commands in the translator behave as F5's pages describe them. Where a page is silent, the row says so: F5's `getfield` page has no example where the string starts with the separator, so the tool's reading of that case is marked as an assumption.
- Platform, configuration and API entries come from F5's documentation and were not tested on hardware for this tool.
- Everything runs in your browser. Nothing is sent anywhere, and nothing runs on a BIG-IP.

## Sources

The tool lists every source with the date it was read, 109 in all. The main ones:

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (read 2026-10-03)
- [F5 K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (read 2026-10-03)
- [Tcl 8.4 manual: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (read 2026-10-03)
- [Tcl 8.4 manual: lindex](https://www.tcl-lang.org/man/tcl8.4/TclCmd/lindex.htm) (read 2026-10-03)
- [Tcl 8.4 manual: split](https://www.tcl-lang.org/man/tcl8.4/TclCmd/split.htm) (read 2026-10-03)
- [Tcl 8.4 manual: if](https://www.tcl-lang.org/man/tcl8.4/TclCmd/if.htm) (read 2026-10-03)
- [F5 iRules reference: getfield](https://clouddocs.f5.com/api/irules/getfield.html) (read 2026-10-03)
- [F5 iRules reference: substr](https://clouddocs.f5.com/api/irules/substr.html) (read 2026-10-03)
- [F5 iRules reference: domain](https://clouddocs.f5.com/api/irules/domain.html) (read 2026-10-03)
- [F5 iRules reference: URI::path](https://clouddocs.f5.com/api/irules/URI__path.html) (read 2026-10-03)
- [F5 iRules reference: priority](https://clouddocs.f5.com/api/irules/priority.html) (read 2026-10-03)
- [F5 tmsh reference: ltm policy](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_policy.html) (read 2026-10-03)
- [F5 tmsh reference: ltm pool](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_pool.html) (read 2026-10-03)
- [F5 K411: Overview of packet tracing with the tcpdump utility](https://my.f5.com/manage/s/article/K411) (read 2026-10-03)
- [F5 DevCentral: iRules Style Guide](https://community.f5.com/t/irules-style-guide/71151) (read 2026-10-03)
