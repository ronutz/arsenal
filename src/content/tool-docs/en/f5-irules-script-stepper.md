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

## Share results

Under how the run ended, **Share results** builds a link to this page, only when you press it, that carries what the run reads, by name: the script as `#input=`, `&mode=irules` in iRules mode, and in that mode each sample request field you changed (`&uri=`, `&host=`, `&method=`, `&agent=` for the User-Agent). Plain Tcl is the default and is not carried, nor is a sample that plain Tcl does not read. A script is usually a piece of a real iRule, so before you copy anything the popover adds a caution (a script can name internal hosts, pools and data groups), and the page reads every field the link would carry with the same secrets check as the iRule readers on this site.

Before it offers a link at all, it looks for keys and credentials written out where F5's own references put them (all read 2026-10-27):

- the pass phrase of `HTTP::cookie encrypt` and `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- a key in the `AES 128 <hex>` string form, or the key of `AES::encrypt` and `AES::decrypt` written out ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- the value of `-key` or `-keyhex` on `CRYPTO::encrypt`, `decrypt`, `sign` and `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- an `Authorization` or `Proxy-Authorization` header written with `HTTP::header insert` or `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), whose value [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (sections 11.6.2 and 11.7.2) defines as the credentials;
- a literal given with `set` to a variable used in one of those places, as in `CRYPTO::encrypt`'s own example;
- and, from the site's secrets check, a PEM private key, a JWT, an AWS access key ID or a password in a URL.

When the page finds one, there is no link: the popover names the field and the line, and you replace the value with a placeholder and press again. A value whose name only looks like a secret (`set static::api_token "..."`) does not stop the link; the caution line names it instead. No check finds every secret, so read what you send.

Everything the link carries goes after the `#`, which [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has "separated from the rest of the URI prior to a dereference": a browser does not send it to the server when the link is opened, but it stays in the address bar and history of whoever opens it, and anyone who has the link can read it.

- **How long.** A link carries at most 16,384 characters, the bound the site uses for every value after the `#`; a longer script gets no link, and the popover says how long it is.
- **Opening a link.** The fields fill as typing would (a sample request the link changed is shown open), and the page holds the script: a note says it came from a shared link, and nothing runs until you press **Run** or change a field. The teaching interpreter never runs a link's text by itself. A mode other than `tcl` or `irules`, or a sample value in plain Tcl mode, makes the whole link ignored. Accepted or not, the values then leave the page's own address at once, without a request, so a reload, a bookmark or the page's own Share button carries nothing you did not choose to share.

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
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-10-27): section 3.5, the fragment, which carries a Share results link's values
- [F5 iRules reference: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) and [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (read 2026-10-27): where an iRule holds a pass phrase, a key or credentials, which stop a Share results link
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (read 2026-10-27): sections 11.6.2 and 11.7.2, the Authorization and Proxy-Authorization values are credentials
