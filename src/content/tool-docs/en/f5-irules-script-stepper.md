## What it does

Runs a short snippet one command at a time and shows each command three ways: as written, as the words it actually received after Tcl substituted variables, commands and backslashes, and what it returned. Under each command you see the variables it changed, the branch `if` or `switch` took, and every expression it evaluated as a tree. Log lines are collected, and actions such as `pool`, `HTTP::redirect`, `drop` or `reject` are recorded rather than performed.

In **iRules** mode the request commands (`HTTP::uri`, `HTTP::host`, `HTTP::method`, `HTTP::header`, `IP::client_addr` and others) answer from an editable sample request, and a `when` block runs its body once as if the event had fired.

## How to read the steps

Commands are listed in the order they started. An indented command ran inside the one above it: in its body, or inside brackets while the outer command's words were being built, which means it finished before the outer command ran. "received" shows the words as the command got them; the dashed outline marks where each word begins and ends, which is what quoting decides.

## Worth knowing

- `"$a$b"` joins two values with nothing between; `"$a $b"` keeps the space.
- `append` adds text exactly as given; `concat` trims the white space at both ends of each argument, drops empty ones and joins the rest with single spaces; `lappend` adds list elements.
- A string with spaces is a list to `foreach`: `foreach item "red green blue"` runs three times.
- `incr` reads `010` as octal 8, so the result is 9.
- `switch` reads any word starting with a dash as an option. Put `--` before the value (F5 K15650046), or a value such as `-foo` breaks the command.
- An unbraced `expr` substitutes twice: if a variable holds `[log local0. "x"]`, that command runs (F5 K57410758). The "Double substitution" example shows it.

## Limits

This is a teaching interpreter, not TMM. It models the commands listed in this page's code and stops after 2,000 commands, at values over 1,000,000 characters, and at 200 levels of nesting. Arrays, `proc`, `regexp`, `table`, `after` and the filesystem are not modelled; commands F5 disables in iRules (K36322151) are not available either. Event timing, connection state and other events are out of scope. The tool is not offered over the API, because it executes the Tcl you give it.

## Sources

- [Tcl 8.4 manual: Tcl (the substitution rules)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (read 2026-10-03)
- [Tcl 8.4 manual: append](https://www.tcl-lang.org/man/tcl8.4/TclCmd/append.htm), [concat](https://www.tcl-lang.org/man/tcl8.4/TclCmd/concat.htm), [lappend](https://www.tcl-lang.org/man/tcl8.4/TclCmd/lappend.htm), [incr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/incr.htm) and [switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (read 2026-10-03)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (read 2026-10-03)
- [F5 K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (read 2026-10-03)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (read 2026-10-03)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (read 2026-10-03)
- [F5 iRules reference: log](https://clouddocs.f5.com/api/irules/log.html) (read 2026-10-02)
