## What it does

Reads the file a BIG-IP LTM Scripted monitor plays (the send and expect lines kept in `/config/eav/`) and explains it the way F5's documentation says the monitor reads it. Every line is shown as written and as read: the keyword, the text with its quotation marks removed and F5's escape sequences resolved, how a send ends (CR LF, LF alone, CR alone or nothing), and what a known reply or command means in SMTP, POP3, IMAP or FTP, with the RFC section. The findings check the file against every rule F5 states and flag everything F5 leaves open, rules S1 to S16, each tied to a line.

Give it a server transcript as well and it simulates the check: each send goes out, each expect is compared with the next server reply, and the result is **pass**, **fail at line N** with F5's reason, or **undetermined at line N** where F5's text does not say what the monitor does. Nothing connects anywhere: the transcript is text you paste, and the script is read, never run. The [Scripted monitor lab](/learn/bigip-ltm-scripted-monitors#lab-scripted-monitor-dialogue) in the Learn article plays a script against a server that follows the RFCs, line by line, and shows which of F5's rules stops it.

The facts are F5's: the BIG-IP 21.1.0 LTM Monitors Reference, "Scripted monitor settings", and the TMSH Reference for `ltm monitor scripted`. The protocol facts come from RFC 5321 (SMTP), RFC 1939 (POP3), RFC 9051 (IMAP4rev2) and RFC 959 (FTP). All were read on 2026-10-27.

## The rules F5 states

- **S1, a CR in a line (error).** F5: scripts "must use hard-return line endings (LF), not soft-return line endings (CR-LF)". A file saved on Windows has a CR before every LF. The finding says whether the CR ends the line or sits inside it.
- **S2, not exactly one space after the keyword (error).** F5: "Exactly one character space must be used to separate the send or expect instruction keywords from the text". Two or more spaces, or a tab, are flagged.
- **S3, characters after a closing quotation mark (error).** F5: "The text to send or match extends to the end of the line, even when using quotation marks. Any characters that follow a closing quotation mark will break the match." On an expect line the simulator therefore fails the check there; on a send line F5 does not say what is sent, so the simulator stops as undetermined.
- **S4, a first word that is not send or expect (error).** F5 documents those two keywords only. The finding says when the word is a capitalised keyword (`Expect`), a comment (`#`), or a sign that an Expect (Tcl) script was pasted (`spawn`, `set`, `#!/usr/bin/expect` and the like).
- **S5, an escape sequence F5 does not list (warning).** F5's table: `\a` bell, `\b` backspace, `\f` form feed, `\n` new line, `\r` return, `\t` tab, `\v` vertical tab, `\\` backslash, `\'` single quotation mark. Anything else after a backslash, such as `\x0d` or `\"`, is not documented.
- **The prefix rule (the simulator's match).** F5: "Matching text can match the prefix of a response, but cannot match a substring that is not a prefix, that is, a substring that starts other than at the beginning of the response." When the text occurs later in the reply, the step says at which character.
- **The order.** F5: "the lines of the file are always read in the sequence specified". The simulator walks the file top to bottom and stops at the first line that fails or cannot be decided.

## What F5 leaves open

F5's text does not settle these, so the explainer flags them as warnings and the simulator stops there with **undetermined** and the reason, rather than guessing:

- **S9, a blank line.** Blank lines after the last instruction are noted but cannot change a match.
- **S10, white space before the keyword.**
- **S11, a quotation form F5 does not describe:** single quotation marks (F5 lists an escape for the single quotation mark but does not say whether single quotation marks enclose a text), an opening quotation mark with no closing one, or a quotation mark inside an unquoted text.
- **S12, an empty text** (`expect` alone, or `expect ""`).
- **S13, a last line without LF.** An expect on such a line stops the simulation; a send there is only noted.
- **S14, no expect line at all:** nothing the server says is ever checked.
- **Case.** When the reply starts with the text in another case (`+ok` against `+OK`), the simulator says undetermined: F5 does not say whether the comparison is case-sensitive.
- **What a response is.** F5 does not say how much of a multi-line reply the monitor reads before comparing. When a match would need the monitor to have read past the end of the reply's first line, the simulator says undetermined.
- **An unquoted line that ends in CR** (a CR-LF file without quotation marks): F5 says LF only, but not how such a line is then read.

## Advice from the RFCs

- **S6, a send with no line ending (warning).** SMTP, POP3, IMAP and FTP end every command with CR LF (RFC 5321 2.3.8, RFC 1939 section 3, RFC 9051 2.2, RFC 959 section 4), so a server of those protocols waits for one. F5's own example writes `\r\n` at the end of each send; nothing in F5's text says the monitor adds a line ending.
- **S7, a send ending in LF alone or CR alone (note).** RFC 5321 2.3.8: a conforming implementation must not recognise any other line terminator than CR LF.
- **S8, an expect written like a pattern (note):** a leading `^`, a trailing `$`, `.*` or `.+`, or Expect's `-re`, `-gl`, `-ex` or `-nocase`. The text is matched literally; F5 says the only monitors that support regular expression matching are HTTP, HTTPS, HTTP/2, TCP and UDP.
- **S15, a credential in a send (warning):** `PASS` (POP3, FTP) or `LOGIN` (IMAP). The password is masked everywhere in the output, the transcript comparison included. The file keeps it in clear, the tmsh reference lists no TLS option for the monitor type, and RFC 9051 6.2.3 says LOGIN must not be used on unsecure networks. POP3 allows QUIT and IMAP allows LOGOUT before authentication, so a check that never logs in is usually possible.
- **S16, an expect on a reply code and a space (note),** such as `"250 "`. In SMTP and FTP multi-line replies every line but the last starts with the code and a hyphen (RFC 5321 4.2.1, RFC 959 4.2), so `"250 "` is never the start of an EHLO reply; expect the code alone.

## The transcript, and how the simulation reads it

Write the session as the RFCs do: `S:` before each line the server sends, `C:` before each line the client sends.

```
S: 220 foo.com Simple Mail Transfer Service Ready
C: HELO bigip1.somecompany.net
S: 250 foo.com
C: quit
S: 221 foo.com Service closing transmission channel
```

- A **reply** is a run of `S:` lines; a `C:` line or a blank line ends it. Put a blank line between two `S:` runs when the server sends them as separate replies.
- Each `S:` line is read as ending in **CR LF**, as all four protocols require. The spaces after `S:` and `C:` are notation, not data (RFC 1939 writes `S:  +OK` with two).
- Each **expect** is compared with the **next reply**, from its first character. This is the simulator's one assumption: F5 does not say what counts as "the response" when a reply has several lines. Wherever that could change the verdict, the simulator says undetermined.
- Each **send** is compared with the next `C:` line, if there is one; a difference is noted (the transcript may come from another client), never a failure.
- When the transcript has **no reply left** for an expect, the check fails there: F5's Timeout row says a target that does not respond within the Timeout is considered down.
- Lines that start with neither `S:` nor `C:` are ignored and listed.

The reasons a check fails: the text occurs in the reply but not at its start (with the offset); the reply does not start with the text and does not contain it; the reply ends before the text does; characters follow a closing quotation mark, or the CR of a CR-LF ending does; no reply arrives.

## Reading the output

The summary counts lines, sends, expects and findings, and says when the file does not end with an LF. The simulation shows the verdict, then one row per line reached: the line, what it sends or expects as the monitor reads it, the reply it was compared with (numbered as in the transcript) or, for a send, whether the transcript shows the same client line, and the outcome. The table of lines shows each line as written, where a control character the file really holds (the CR of a CR-LF ending, a tab) appears as its Unicode picture, such as ␍ or ␉, and an escape typed as a backslash and a letter stays as typed; elsewhere text is shown with F5's escape sequences and a backslash as two.

The **Example** button loads F5's own SMTP script from the Monitors Settings Reference, verbatim, with a session shaped like RFC 5321's: it passes.

## Timing

The script has no timer of its own in F5's documentation. The monitor's Interval (10 seconds by default for Scripted, per the tmsh reference) and Timeout (31 seconds, three times the Interval plus one) decide when a member is marked down, as for every monitor; [the article on LTM health monitors](/learn/ltm-health-monitors) and its [monitor timing lab](/learn/ltm-health-monitors#lab-f5-monitor-timing) show how they combine.

## Limits

- The explainer applies F5's published rules. What a given BIG-IP build does beyond them, it cannot know; where the documentation is silent it says undetermined instead.
- The transcript is yours: the simulator does not know how your server really answers, how fast, or whether it answers only part of a reply.
- The credential check is a pattern: `PASS x` and `tag LOGIN user password`. A password sent another way (AUTH, for example) is not recognised.
- Test the real monitor on the system: `tmsh run ltm monitor scripted NAME destination ADDRESS:PORT`, then `tmsh show ltm monitor scripted NAME test-result`, or the Test button in the Configuration utility.

## API

The same engine answers the `/api/v1/bigip-scripted-monitor-explainer` operation of the site's HTTP API, described in the OpenAPI contract on the [API page](/api); the contract also says whether this site serves the API.

- **Request.** A JSON object, `{"script": "...", "transcript": "..."}`, in the body of a POST or in the `input` query parameter of a GET; the transcript may be empty or left out. The script is limited to 32,768 characters and the transcript to 65,536.
- **Response.** `lines` (each with `line`, `raw`, `kind`, `keyword`, `written`, `quoted`, `decoded`, `length`, `ending`, `hint`, `secret`, `breaks` and `open`), `findings` (`rule`, `severity`, `line`, `params`), `counts`, `sends`, `expects`, `endsWithLf`, `transcript` (`replies`, `clientLines`, `ignoredLines`) and `simulation` (`verdict`, `stopLine`, `reason`, `steps`, `unreadReplies`, `unusedClientLines`, `notes`), the last two null when no transcript is given. A password is masked in every field.

## Sources

- [F5, BIG-IP 21.1.0 LTM Monitors Reference, Monitors Settings Reference: Scripted monitor settings, the escape sequences and F5's SMTP example; the TCP Receive String and which monitors support regular expressions](https://techdocs.f5.com/en-us/bigip-21-1-0/big-ip-local-traffic-manager-monitors-reference/monitors-settings-reference.html#scripted-monitor-settings) (read 2026-10-27)
- [F5 TMSH Reference v17, ltm monitor scripted: options and defaults, run and show test-result](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_scripted.html) (read 2026-10-27)
- [RFC 5321, Simple Mail Transfer Protocol](https://www.rfc-editor.org/rfc/rfc5321) (read 2026-10-27)
- [RFC 1939, Post Office Protocol, Version 3](https://www.rfc-editor.org/rfc/rfc1939) (read 2026-10-27)
- [RFC 9051, Internet Message Access Protocol (IMAP), Version 4rev2](https://www.rfc-editor.org/rfc/rfc9051) (read 2026-10-27)
- [RFC 959, File Transfer Protocol](https://www.rfc-editor.org/rfc/rfc959) (read 2026-10-27)
- Learn: [BIG-IP LTM Scripted monitors](/learn/bigip-ltm-scripted-monitors), [How LTM health monitors decide up or down](/learn/ltm-health-monitors). Related: the [Expect script explainer](/tools/expect-script-explainer), for Expect itself, and the [tmsh config explainer](/tools/f5-tmsh-config-explainer), for the `ltm monitor scripted` object that names the file.
