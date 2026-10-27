## What it does

Writes a complete [Expect](/glossary/expect) script from a few choices: how to connect (ssh, telnet or another program, such as a serial console client), the host and the user, how the login is authenticated, a device profile, the commands, the timeouts and where the output goes. The script logs in, raises privilege where you ask for it, deals with paging, runs the commands one at a time, and logs out. By default it changes nothing on the device: where turning paging off would be a global configuration change, it answers the pager instead, and changing the setting is an explicit choice that comes with its restore. Nothing is run and nothing leaves the browser: you copy or download the script and run it yourself.

Every script it can write passes the [Expect script explainer](/tools/expect-script-explainer) with no error and no warning, and the page runs the explainer on the script as you build it. The tool's golden vectors check that promise for every combination class of choices, more than two thousand of them. The notes the explainer may still show are deliberate: E5 on the single Space that answers a `--More--` prompt, and E12 on a script that writes only to a log file.

## Secrets: never in the script

- **An ssh key.** ssh runs with `BatchMode=yes`, which, in ssh_config(5)'s words, disables "user interaction such as password prompts and host key confirmation requests", for scripts and other batch jobs. The key must work on its own: load it into `ssh-agent`, or give a key file (`-i`, with `IdentitiesOnly=yes` so only that key is offered).
- **A password from an environment variable.** The script checks that the variable is set and not empty (status 2 otherwise), copies it, and removes it from the environment with `unset env(NAME)` before starting the connection, so the program it spawns does not inherit it.
- **A password asked for at run time.** The idiom of expect(1): `stty -echo`, `send_user`, `expect_user -re "(.*)\n"`, `stty echo`, with its own two minutes to type it (`-timeout 120` inside the block) and echo turned back on in every outcome. The script then needs a terminal.

Nothing secret reaches a log either. The login runs with `log_user 0`, so a device that echoes the password cannot put it on the screen, and the transcript file, when you ask for one, is opened only after the login and the enable step. Expect's log records what `expect_user` reads even with echo off, and `exp_internal` prints every `send` in full, so the builder never opens a log before the secrets are used and never turns `exp_internal` on. Both facts were checked with the real `expect` 5.45.4 and are explained in [Secrets in Expect scripts](/learn/expect-secrets-and-safe-scripts).

ssh always gets `-o StrictHostKeyChecking=accept-new`: ssh_config(5) says that with it "ssh will automatically add new host keys to the user's known_hosts file, but will not permit connections to hosts with changed host keys". The builder never writes `no`, which accepts a changed key.

## Device profiles

The profiles come from the suite's data module, each value read in the vendor's own documents on 2026-10-27 and explained in [Expect against network devices](/learn/expect-against-network-devices):

- **Cisco IOS XE:** `terminal length 0` for the session, `--More--` answered with Space, `enable` with its `Password:` question.
- **F5 BIG-IP (tmsh):** `modify /cli preference pager disabled display-threshold 0`, a preference of the user whose duration the reference does not state, with no documented value to restore.
- **Fortinet FortiOS:** by default the script answers each `--More--` with a Space and `exp_continue`, and the device's configuration is left as it was. Turning paging off is an explicit choice: `config system console`, `set output standard`, `end`, a global configuration change that every administrator's session sees, so the builder then warns and adds the documented restore (`set output more`), which you can decline.
- **Extreme Switch Engine:** `disable cli paging session`, for the session.
- **Extreme Fabric Engine:** `terminal more disable`, whose scope the reference does not state, with `terminal more enable` to put it back; `enable` may ask questions the documents do not print, so the builder offers it only without a password.
- **Generic:** your own prompt regexp, and a paging command if you have one.

Each prompt regexp is written literally between braces, `-re {...}`, so Tcl substitutes nothing in it.

## How the script is put together

- The timeout is set before the first `expect`, so nothing waits on the default of 10 seconds.
- One `expect` handles the whole login: each question (user name, password) is answered once, a second one means it was refused and stops the script with status 1, the prompt ends the login, and `timeout` and `eof` arms stop the script with a message.
- Every braced block starts with a newline after the brace. Expect 5.45.4 reads one braced argument as patterns and bodies only in that case; written on one line, the block would be a single pattern (the explainer's rule E19).
- `run_command` sends a line ending in `\r` and waits for the prompt. A pattern that matches any line ending, with `exp_continue`, restarts the timer at every line, so the command timeout counts silence rather than the whole command, and long output does not time out while it is still arriving.
- When paging is answered, the pattern is written `-ex "--More--"`, since `expect` reads any word that begins with `-` as a flag (the explainer's rule E20).
- The end is the logout command followed by `expect eof`, or a `close` when you give no logout command, then `wait`, so the process is reaped.

Exit statuses: 0 done; 1 the login failed; 2 missing or wrong input; 3 a command did not finish; 4 the session closed early.

## What it checks in your input

- Host names and addresses only (no leading hyphen, so a value can never reach ssh as an option); with the host taken from the command line, the script checks the argument the same way when it runs.
- A port only for ssh (`-p`); for telnet on another port, use Another program.
- Program command lines, key files and log files without spaces, `~` or characters Tcl would substitute.
- Commands as plain text, up to 40 of 300 characters each; every `\`, `"`, `$`, `[`, `]`, `{` and `}` is protected with a backslash so the device receives the command as typed.
- Timeouts from 1 to 3600 seconds, never `-1`.
- A generic prompt regexp with balanced braces, and never one that matches at once (`.*`, `^`, `$`).

A command that asks a question is not answered: the script stops with status 3 when the command timeout passes. When a command starts like one of the profile's documented confirmations (`reload`, `save configuration`, `reboot`, `reset`, `execute restore`), the builder says so.

## Limits

- The builder writes the script; it never runs it. Run it against a lab device first.
- It waits for the profile's prompt pattern. A banner line or a command line that itself ends in `>` or `#` and arrives in a separate piece can be mistaken for the prompt; [the article on network devices](/learn/expect-against-network-devices) discusses prompt patterns.
- Comments and messages in the script are in English, like the commands themselves.
- It does not answer confirmations, handle several devices in one script or keep each command's output apart; edit the script for that, then check it again with the [explainer](/tools/expect-script-explainer).

## Related tools and reading

- **What the script collects.** When it is configuration, the explainer for the platform reads it: the [tmsh config explainer](/tools/f5-tmsh-config-explainer), the [FortiOS CLI config explainer](/tools/fortios-cli-config-explainer) and the [ExtremeXOS config explainer](/tools/exos-config-explainer).
- **Why the script is written this way.** Tcl's quoting, which decides what reaches the device, is in [Tcl for Expect writers](/learn/tcl-for-expect-writers); the timer that `exp_continue` restarts in `run_command`, in [Expect's timeouts, eof and loops](/learn/expect-timeouts-eof-and-loops); and what Expect writes to a log, in [Debugging Expect](/learn/expect-debugging-and-logging).

## Sources

- [expect(1), Expect 5.45.4 manual source, core.tcl-lang.org](https://core.tcl-lang.org/expect/raw?name=expect.man&ci=expect-5-45-4) (read 2026-10-27)
- [expect.c, Expect 5.45.4: how expect reads its arguments](https://core.tcl-lang.org/expect/raw?name=expect.c&ci=expect-5-45-4) (read 2026-10-27)
- [OpenSSH ssh(1)](https://man.openbsd.org/ssh.1) (read 2026-10-27)
- [OpenSSH ssh_config(5): StrictHostKeyChecking, BatchMode, IdentitiesOnly](https://man.openbsd.org/ssh_config.5) (read 2026-10-27)
- [RFC 854, Telnet Protocol Specification](https://www.rfc-editor.org/rfc/rfc854) (read 2026-10-27)
- The device profiles' vendor documents, listed with their dates in [Expect against network devices](/learn/expect-against-network-devices) (read 2026-10-27)
