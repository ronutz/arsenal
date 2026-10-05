## What it does

Reads an [Expect](/glossary/expect) script and explains it from its text alone: what it spawns, what it waits for and how, what it types and whether a return ends the line, when it hands the keyboard to the user. The commands are listed in source order with their nesting, so the bodies of `expect`, `if`, `foreach`, `while`, `for`, `switch`, `catch` and `proc` are read too. From the `expect` and `send` pairs it reconstructs the dialogue the script conducts, and it reports findings against eighteen rules, each tied to a line and each citing the `expect(1)` manual. The script is parsed with the site's [Tcl](/glossary/tcl) 8.4 engine (Expect's syntax is Tcl's) and never run: nothing is spawned, nothing is sent.

## What it checks

- **E1, a secret in clear text (error):** a literal sent right after a prompt that asks for a password, or a literal assigned to a variable whose name says password, secret or token. The value is masked in the output. Take secrets from the command line (`lindex $argv N`), from the environment (`$env(NAME)`) or from the user (`stty -echo`, `expect_user`).
- **E2, the timeout (warning or note):** `set timeout -1` is an infinite timeout; an `expect` that ran before any `set timeout` used the default. `expect(1)`: "The default timeout period is 10 seconds but may be set, for example to 30, by the command "set timeout 30". An infinite timeout may be designated by the value -1."
- **E3, a pattern that matches too soon (warning or note):** `"*"` and `-re ".*"`, which `expect(1)` says "will flush the output buffer without reading any more output from the process", and one-character prompts such as `">"` or `"$"`, which match the first such character anywhere in the output. Patterns are unanchored; the manual encourages `$` "if you can exactly describe the characters at the end of a string".
- **E4, the script ends on a send (warning):** nothing reads the program's answer. "Upon exiting, all connections to spawned processes are closed."
- **E5, no return (note or warning):** a `send` whose string does not end in `\r` or `\n`; and a braced `send {...\r}`, where Tcl substitutes nothing, so the program receives a backslash and an r. `expect(1)`: "Characters are sent immediately although programs with line-buffered input will not read the characters until a return character is sent. A return character is denoted "\r"."
- **E6, a newline where a return is meant (note):** the string ends in `\n`.
- **E7, no timeout handler (note):** expects on ordinary patterns with no `timeout` (or `default`) pattern. "If no timeout keyword is used, an implicit null action is executed upon timeout", and the script carries on as if the pattern had matched.
- **E8, `exp_continue` outside an expect body (error).**
- **E9, substitution inside a quoted pattern (warning or note):** `[brackets]` run as a command and `$names` are substituted before Expect reads the pattern, in the one-line form and in the braced block alike: "In this one case, the usual Tcl substitutions will occur despite the braces."
- **E10, the host-key question (note):** `ssh` spawned without `StrictHostKeyChecking=no`, `off` or `accept-new`, and no pattern answering a `(yes/no)` question. OpenSSH's default is `ask` (ssh_config(5)).
- **E11, `sleep` (note):** a fixed wait where an `expect` would wait for the event.
- **E12, `log_user 0` never followed by `log_user 1` (note).**
- **E13, `set timeout` after the first expect (warning):** that expect ran on the default.
- **E14, nothing spawned (note).**
- **E15, `stty -echo` never followed by `stty echo` (warning):** the manual's own password-reading idiom restores echo as soon as the password has been read.
- **E16, `close` without `wait` (note):** "close does not call wait since there is no guarantee that closing a process connection will cause it to exit."
- **E17, a send before the first expect (warning):** "It is a good idea to precede the first send to a process by an expect. expect will wait for the process to start, while send cannot."
- **E18, `set timeout` inside a procedure without `global timeout` (note):** "variables written are always in the local scope (unless a "global" command has been issued)", so the value applies to that procedure's expects only.
- **Syntax:** where the Tcl 8.4 parser stops (a missing brace, an unterminated quote), with Tcl's own message; the commands before it are still explained.

## Reading the output

The summary says whether Tcl reads the whole script, counts the findings, names the programs spawned, gives the timeout in force at the first `expect` (the `-timeout` flag, then a value set in the same procedure, then the script's `set timeout`, else the default), and says whether the script ends in `interact`, waits for `eof`, or never waits for the program to end. The dialogue table pairs each `expect` on the process with the `send` that answers it; a masked value there is a secret the script typed in clear. Patterns are listed under each `expect` with their matching style (glob by default, `-re`, `-ex`, `-nocase`) and the keywords `eof`, `timeout`, `full_buffer`, `null` and `default` with what each stands for.

## Limits

- Bodies are read in source order. The explainer cannot know which branch a run takes, how many times a loop runs or whether a procedure is ever called; a `set timeout` inside a procedure that declares `global timeout` is read where the procedure is defined.
- Strings and patterns that depend on a variable are shown as written (`$env(PW)\r`), not as their value.
- The secret detection is a heuristic: a one-word literal sent right after a password prompt, or stored in a variable named like one. A password sent after a prompt the script does not name as such is not caught.
- `expect_before`, `expect_after` and `expect_user` are explained but not added to the dialogue, as they do not wait on the process by themselves.
- Array references such as `$env(HOME)` are accepted; the index is kept as text.

## Sources

- [expect(1), the Expect manual page (Don Libes, NIST; Expect version 5)](https://www.tcl-lang.org/man/expect5.31/expect.1.html) (read 2026-10-05)
- [Expect at core.tcl-lang.org: description, version 5.45.4, maintenance notice](https://core.tcl-lang.org/expect/index) (read 2026-10-05)
- [Tcl 8.4 manual: Tcl, the rules of the language](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (read 2026-10-05)
- [Tcl 8.4 manual: string match, the glob pattern rules](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (read 2026-10-05)
- [OpenSSH ssh_config(5): StrictHostKeyChecking](https://man.openbsd.org/ssh_config.5) (read 2026-10-05)
