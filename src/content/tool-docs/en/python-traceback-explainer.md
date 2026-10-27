## What it does

Paste a traceback that CPython printed and the tool takes it apart: every frame with its file, line, function and source line, and what the `^` and `~` markers under it point at; every exception with its class chain from the built-in hierarchy, CPython's own suggestion when there is one, the errno or codec details, and a hint from its documentation; the chain between exceptions ("direct cause" against "during handling"); exception groups with their members and their notes; where to look first; which releases the format points to; and what in the paste may be sensitive, with a redacted copy to share instead of the original. Everything runs in your browser: the paste is read, never run, and never sent anywhere.

It reads the formats of CPython 3.11 to 3.15, the releases the Python Developer's Guide lists as supported on 27 October 2026: 3.15 and 3.14 in bugfix status, 3.13, 3.12 and 3.11 in security status, with end of life in October 2031, 2030, 2029, 2028 and 2027. 3.10 reached end of life on 1 October 2026. Every behaviour below was checked against tracebacks printed that day by CPython 3.11.17, 3.12.3 and 3.13.16, and by CPython 3.14.2 in the build of the site's [Python playground](/tools/python-playground). No 3.15 interpreter was available, so nothing here was tested on 3.15; where 3.15 is mentioned, the source is its documentation. The [article on Python errors and tracebacks](/learn/python-errors-and-tracebacks) teaches the same ground with examples.

## What it reads

**The header and the frames.** A traceback starts with `Traceback (most recent call last):` and lists the frames from the outermost call to the innermost: the last frame is where the exception was raised. Each frame is a line `  File "<file>", line <n>, in <function>`, then the source line indented four spaces when CPython could read the file. The function is the code object's name, so the top level of a script is `<module>`, a lambda is `<lambda>` and a generator expression is `<genexpr>`. The line number can be `None`.

**The markers (PEP 657, 3.11 and later).** Under a frame's source line CPython prints `^` under the expression the frame was running. When the expression has parts, `~` marks the parts and `^` the operation: the operator of a binary operation (`a / b` gives `~^~`), the brackets of a subscript (`cfg["hostname"]` gives `~~~^^^^^^^^^^^^`) and, from 3.13, the brackets of a call (`int(port)` gives `~~~^^^^^^`). The tool turns the markers back into text: the expression, the part under `^` and the parts under `~`. CPython places markers by display column, counting a wide or fullwidth character (East Asian Width W or F) as two columns, and the tool does the same, with the Unicode 15.1.0 width table that CPython 3.13 uses. No markers are printed when CPython was started with `-X no_debug_ranges` or `PYTHONNODEBUGRANGES`, when the expression is the whole line, and from 3.13 also for `x = f(...)` and `return name(...)` when the call is the whole value (3.12 marks `json.loads(body)` in `data = json.loads(body)`; 3.13 does not).

**Expressions over several lines (3.13 and later).** A frame can show an expression that spans several source lines, with markers under each and `...<N lines>...` for the lines left out. 3.11 and 3.12 show only the first line.

**Repeated frames.** After three identical frames (same file, line and function) CPython prints `[Previous line repeated N more times]` instead of the rest. The tool counts them on the frame above.

**Local variables.** `unittest --locals` and `traceback.TracebackException(..., capture_locals=True)` print `name = value` lines under a frame. The tool lists them and warns that values can hold secrets.

**The exception line.** `<type>: <message>`, or `<type>` alone when the message is empty. CPython writes the type as `module.qualname`, except for built-in classes and classes of the script that was run (`__main__`), which it writes without a module. So `ValueError` is built in, `json.decoder.JSONDecodeError` comes from the standard library, and `PollError` was most likely defined in the script.

**Notes and multi-line messages.** Notes added with `add_note()` (PEP 678, 3.11 and later) are printed "immediately after the exception message, in the order in which they were added, with each note starting on a new line". A message that contains line breaks prints the same way, so the text alone cannot tell the rest of a message from a note; the tool shows those lines together and says so.

**A SyntaxError's location.** When code does not compile, CPython prints `  File "<file>", line <n>` with no function, the offending line and `^` markers, then `SyntaxError: <message>`. If the script itself did not compile, nothing ran and there is no `Traceback` header at all; if an imported module did not compile, the location comes after the frames of the code that imported it. These markers count characters, not display columns.

**Chains (PEP 3134).** When an exception is raised while another is handled, CPython prints both, oldest first, joined by a banner:

- `The above exception was the direct cause of the following exception:` means `raise new from original`: a deliberate translation, and the earlier exception is the new one's `__cause__`.
- `During handling of the above exception, another exception occurred:` means the handler of the earlier exception raised a new one: the handler itself failed, and the earlier exception became the new one's `__context__`.
- `raise new from None` prints the new exception alone (PEP 409, PEP 415).

An exception that was created but never raised, such as the cause in `raise ValueError(...) from KeyError(...)`, is printed with no header and no frames.

**Exception groups (PEP 654, 3.11 and later).** A group prints as a box: `+ Exception Group Traceback (most recent call last):`, a `|` margin on every line of the group, and each member under a title `+-+---------------- 1 ----------------`, `+---------------- 2 ----------------` and so on, each with its own traceback, chain and notes, nested one margin deeper per level. The group's message ends with `(N sub-exceptions)`. By default CPython prints 15 members and then `and N more exceptions` (`max_group_width`), and ten levels of nesting and then `... (max_group_depth is 10)`. The tool reads groups to 40 levels, so a traceback printed with larger limits also reads.

**What comes before the traceback.** `Exception in thread <name>:` means `threading.excepthook` printed an exception raised in a thread, and the program may have carried on. `Exception ignored in: ...` means `sys.unraisablehook` printed an exception that could not propagate, from a destructor for example. A log line such as `ERROR:netops.poller:...`, a shell prompt or `>>> ` before the header is left unread, with a note.

**What it does not read.** IPython's and pytest's reports are their own formats, not CPython's; the tool says so and reads only what is in CPython's format (from IPython, the exception line). A log whose every line carries a prefix (a time stamp, a level) is not read. When a paste holds two tracebacks, the first is read and a note gives the line where the second starts. Lines right after an exception line are taken as its message or notes until a blank line, a banner, a new header or a `>>> ` prompt.

## Where the releases differ

Seen in the tracebacks the vectors pin (3.11.17, 3.12.3, 3.13.16 and 3.14.2) and in each release's documentation.

| What | 3.11 | 3.12 | 3.13 | 3.14 | 3.15 |
| --- | --- | --- | --- | --- | --- |
| `^` under the failing expression, `~` around an operator or a subscript | yes | yes | yes | yes | not tested |
| `~` under a called function, `^` under its brackets | no: `^` only | no: `^` only | yes | yes | not tested |
| No markers for an expression that is the whole line | yes | yes | yes, and also for `x = f(...)` and `return name(...)` | as 3.13 | not tested |
| An expression over several lines, with `...<N lines>...` | first line only | first line only | yes | yes | not tested |
| A frame for a list, dict or set comprehension (`<listcomp>`) | yes | no (PEP 709) | no | no | not tested |
| Exception groups, notes | yes | yes | yes | yes | not tested |
| "Did you forget to import 'sys'?" | no | yes | yes | yes | not tested |
| A script named like a standard-library module | "partially initialized module ... (most likely due to a circular import)" | the same | "(consider renaming '...' since it has the same name as the standard library module ...)" | not tested | not tested |
| A misspelt keyword argument | "'max_split' is an invalid keyword argument for split()" | the same | "got an unexpected keyword argument 'max_split'. Did you mean 'maxsplit'?" | as 3.13 | not tested |
| The interactive shell's file name | `<stdin>` | `<stdin>` | `<python-input-0>` | `<python-input-N>` in the documentation's examples | the same in the documentation |
| Colour on a terminal | no | no | yes | yes | yes |
| New built-in exceptions | | | `PythonFinalizationError` | | `ImportCycleError` |

Two more differences showed up in the runs. On 3.11 the "Did you mean" suggestion of a `NameError` is printed by the interpreter's own display but not by `traceback.print_exc()`; from 3.12 both print it. And the Pyodide build of 3.14.2 printed the ssl exceptions as `_ssl.SSLError` (with no `ValueError` in `SSLCertVerificationError`'s chain) where 3.11 to 3.13 print `ssl.SSLError`; the tool knows both spellings. In 26 of the 34 scenarios run on both, the 3.14.2 text was byte for byte the same as 3.13.16's; the other eight differ only in paths, in the depth at which recursion stopped, and in what WebAssembly cannot do (sockets, threads and processes). The 3.15 traceback documentation reads the same as 3.14's apart from its version line; 3.15's new messages (suggestions through inner attributes, Python names for other languages' methods, lazy imports reported at first use) were read but not run.

## The exception's class

The tool knows every documented built-in exception and the standard-library exceptions network and security scripts meet most: `socket.gaierror` and `socket.herror`; the `ssl` errors; `json.decoder.JSONDecodeError`; `asyncio.exceptions.CancelledError`, `InvalidStateError`, `IncompleteReadError` and `LimitOverrunError`; the `subprocess` errors; `urllib.error.URLError`, `HTTPError` and `ContentTooShortError`; and `http.client.HTTPException`, `RemoteDisconnected`, `IncompleteRead`, `BadStatusLine`, `InvalidURL` and `LineTooLong`. For each it shows the class chain, nearest base first (for example `ConnectionRefusedError → ConnectionError → OSError → Exception → BaseException`), a sentence on what it means, the release that added it when that is newer than 3.11, and a link to its entry in the documentation. The chains were printed by the interpreters themselves (each class's `__mro__` on 3.11.17, 3.12.3, 3.13.16 and 3.14.2, identical for every built-in) and match the hierarchy tree on each release's exceptions page; `ImportCycleError` comes from the 3.15 documentation alone. Aliases print under their target's name: `socket.timeout` and `asyncio.TimeoutError` as `TimeoutError`, `IOError` and `EnvironmentError` as `OSError`, `ssl.CertificateError` as `ssl.SSLCertVerificationError`.

For an unknown class, the tool says what the printed name implies: a name without a module is a class of the script that was run (or a built-in newer than the tool), and a name with a module is documented by that module.

**Hints.** For 36 frequent exception classes, and for any message about `'NoneType'`, the tool adds what to check first, each drawn from the class's documentation: `ModuleNotFoundError` (a virtual environment only sees what was installed in it), `KeyError` (`dict.get(key, default)` returns a default instead), `AttributeError` or `TypeError` on `'NoneType'` (a function without a `return` returns `None`, and `re.match()` and `re.search()` return `None` when nothing matches), `UnboundLocalError` (an assignment anywhere in a function makes the name local throughout it), `ConnectionRefusedError`, `TimeoutError`, `socket.gaierror`, `ssl.SSLCertVerificationError` (verify_message says why; `CERT_NONE` accepts just about any certificate), `subprocess.CalledProcessError`, `asyncio.exceptions.CancelledError` (a `TaskGroup` cancels the other tasks when one fails), `AssertionError` (`python -O` removes `assert` statements), `SyntaxError` (the markers show where the parser detected the error, which "is not always the place that needs to be fixed"), and others.

**From the message.** CPython's own suggestions ("Did you mean", "Did you forget to import", "consider renaming"); errno and its text for `[Errno N] text` and `[WinError N] text` (the numbers are the operating system's and differ between systems; a negative number on `socket.gaierror` is one of getaddrinfo's `EAI_*` codes); and the codec, the byte or character, the position and the reason of a `UnicodeDecodeError` or `UnicodeEncodeError`.

## Where to look first

For the exception the traceback ends with (for a group, for each leaf member, up to twenty):

- raised in your own code: that frame, and the values that reached it;
- raised by a `raise` statement: the message says why; when a banner links it to an earlier exception, the reading follows the chain to that one too (the direct cause is the original failure; with "during handling", the first failure is the earlier one and the handler failed after it);
- raised inside the standard library, an installed package or a frozen module: the last frame of your own code before it, which passed in what the library could not handle;
- a SyntaxError: the location, and the frame that imported the file when there is one;
- a `RecursionError`: the frame that repeats; a `KeyboardInterrupt`: where the program was waiting;
- no frames: the exception was never raised itself, or only its last line was pasted.

"Your own code" is any frame that is not in the standard library (`.../lib/python3.X/...`, `...\Lib\...`), an installed package (`site-packages`, or Debian's `dist-packages`), a frozen module (`<frozen ...>`); `<stdin>`, `<string>` and the interactive shell count as yours. This is a reading, not a verdict: the frame that raises is not always where the mistake is.

## Which release printed it

The tool collects evidence and intersects it: a path that names the standard library (`/usr/lib/python3.13/`, `python314.zip`, `Python313\`) gives the release exactly; markers at all mean 3.11 or later; `~` under a call or an expression over several lines, 3.13 or later; a comprehension frame, 3.11 or earlier; an exception group, 3.11 or later; `<python-input-N>`, 3.13 or later; "Did you forget to import", 3.12 or later; "consider renaming" or "Did you mean '...'?" without a colon, 3.13 or later; `PythonFinalizationError`, 3.13 or later; `ImportCycleError`, 3.15. Evidence that contradicts itself (a paste that mixes two releases, or was edited) is reported as such.

## What may be sensitive

A traceback is a log artifact and routinely carries what should not be posted: paths name users and hosts, source lines and messages can hold tokens, passwords and URLs with credentials, and printed locals hold values. The tool looks for:

- a user name in a home directory: `/home/<name>/`, `/Users/<name>/`, `C:\Users\<name>\`, reported once per name with a count;
- everything the site's [code to image](/tools/code-to-image) secrets check finds: private key blocks, `Authorization` headers, AWS access key IDs, JSON Web Tokens, passwords in URLs, FortiOS encrypted values, and secret-looking attributes, members, keys, variables and assignments. Lines longer than 2,000 characters are not given to that check (it slows down on very long lines), and a note says so.

The **redacted copy** replaces each user name with `<user>` and each finding with `[redacted]`, and is what to paste into an issue or a ticket. The checks are not complete: read the copy before posting it.

For the same reason the page never puts a traceback in a link as you pasted it (its share setting is "never"). Its **Share results** button, in this section, builds a link only when you press it, and the link carries the redacted copy above after the `#`, never the paste; when some lines were longer than 2,000 characters and so went unchecked, it offers no link and says why. [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5) has the fragment "separated from the rest of the URI prior to a dereference", so the copy is not sent to the server when the link is opened, but anyone who has the link can read it: read the copy first. A link fills the box as a paste would and the page explains it; the value then leaves the page's address, without a request. The copy is limited to 16,384 characters, the bound the site uses for every value after the `#`. Nor is the tool offered over the site's API: sending a traceback to a server to have it explained would send its secrets with it, and a program that holds a traceback already has the exception object, which the standard library's `traceback.TracebackException` reads exactly.

## Limits

At most 200,000 characters, 5,000 lines and 5,000 characters on a line; exception groups to 40 levels of nesting. The longest input in the tests took about 0.4 seconds.

## Worked example

The Example button loads the traceback CPython 3.13.16 printed for this script, which polls a lab device on a port where nothing listens:

```python
# poll.py: open an SSH session to each device in the inventory; nothing listens on the lab's port here.
import socket  # TCP

INVENTORY = {"r1": "127.0.0.1"}  # device name and management address
SSH_PORT = 2222  # the lab's SSH port


class PollError(Exception):
    """A device could not be polled."""


def open_session(host, port):
    # Connect with a short timeout.
    return socket.create_connection((host, port), timeout=2)


def poll(inventory):
    # Turn a refusal into the application's own error, keeping the original as its cause.
    for name, host in inventory.items():
        try:
            open_session(host, SSH_PORT)
        except ConnectionRefusedError as err:
            err.add_note(f"device {name} ({host})")
            raise PollError(f"{name}: SSH port {SSH_PORT} closed") from err


poll(INVENTORY)
```

The tool reads two exceptions joined by the "direct cause" banner. The first, `ConnectionRefusedError: [Errno 111] Connection refused`, has four frames: two in `poll.py` and two in `/usr/lib/python3.13/socket.py`, and one line after its exception line, `device r1 (127.0.0.1)`, which is the note. The second, `PollError: r1: SSH port 2222 closed`, is a class of the script (no module in its name) raised by a `raise` statement. Where to look first: `PollError` was raised on purpose; its direct cause is the refusal, raised inside the standard library, and the last frame of the script before it is `open_session`, line 14. The path names the 3.13 standard library, and the `~` under each called function confirms 3.13 or later. The user name in `/home/ana/` is reported, and the redacted copy has `/home/<user>/` in its place.

## Provenance

The behaviour is pinned by the golden vector set `python-traceback-explainer-golden-2026-10-27b`: 57 traceback vectors (45 printed by 3.13.16, including an interactive session, a thread, logging, `sys.unraisablehook`, `unittest --locals`, `-X no_debug_ranges`, colour, `python -m` and a Windows-style file name given to `compile()`; six printed by the other releases, four on 3.11.17, one on 3.12.3 and one on 3.14.2; IPython 9.17.1's report; the last line of a 3.13.16 traceback alone; and four 3.13.16 tracebacks transformed with CR LF line breaks, no-break spaces, an indentation and a cut), eight refusals, 26 display widths and 14 class chains. The expected structure of every traceback (types, messages, notes, links, frames, positions, whether markers were printed and the kind of expression under them) was not produced by the tool: a harness ran each script again and wrote it from the exception objects (`traceback.TracebackException`, `FrameSummary` and CPython's own per-frame text), and on every scenario and release the tool's reading of the printed text agreed with it in all 3,971 comparisons. The readings (where to look first, the release range, the notes and findings, the redacted copies) were written by hand from the rules above. Six share vectors pin what a Share results link carries: the redacted copies of the Example, the secrets vector and the Windows path vector, and no link for a line the secrets check skipped, a paste that is not a traceback, or an empty box. 100,000 random and mutated pastes never made it fail.

## API

Not exposed over the API, on purpose: see "What may be sensitive" above.

## Sources

All read 2026-10-27.

- Python 3.15 documentation: [traceback](https://docs.python.org/3/library/traceback.html) (with the [3.11](https://docs.python.org/3.11/library/traceback.html), [3.12](https://docs.python.org/3.12/library/traceback.html), [3.13](https://docs.python.org/3.13/library/traceback.html) and [3.14](https://docs.python.org/3.14/library/traceback.html) editions, compared), [Built-in Exceptions](https://docs.python.org/3/builtins/exceptions.html) (with the 3.11 to 3.14 editions), [Command line and environment](https://docs.python.org/3/using/cmdline.html), [sys](https://docs.python.org/3/library/sys.html), [threading](https://docs.python.org/3/library/threading.html), [sysconfig](https://docs.python.org/3/library/sysconfig.html), [unittest](https://docs.python.org/3/library/unittest.html), [venv](https://docs.python.org/3/library/venv.html), [codecs](https://docs.python.org/3/library/codecs.html), [re](https://docs.python.org/3/library/re.html), [Built-in Types](https://docs.python.org/3/builtins/stdtypes.html), [socket](https://docs.python.org/3/library/socket.html), [ssl](https://docs.python.org/3/library/ssl.html), [json](https://docs.python.org/3/library/json.html), [asyncio exceptions](https://docs.python.org/3/library/asyncio-exceptions.html), [Coroutines and Tasks](https://docs.python.org/3/library/asyncio-task.html), [subprocess](https://docs.python.org/3/library/subprocess.html), [urllib.error](https://docs.python.org/3/library/urllib.error.html), [http.client](https://docs.python.org/3/library/http.client.html)
- [The Python Tutorial: Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html) and [More Control Flow Tools](https://docs.python.org/3/tutorial/controlflow.html); [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) and [Execution model](https://docs.python.org/3/reference/executionmodel.html); [Programming FAQ: UnboundLocalError](https://docs.python.org/3/faq/programming.html)
- What's New in Python [3.11](https://docs.python.org/3/whatsnew/3.11.html), [3.12](https://docs.python.org/3/whatsnew/3.12.html), [3.13](https://docs.python.org/3/whatsnew/3.13.html), [3.14](https://docs.python.org/3/whatsnew/3.14.html), [3.15](https://docs.python.org/3/whatsnew/3.15.html)
- [PEP 657](https://peps.python.org/pep-0657/), [PEP 654](https://peps.python.org/pep-0654/), [PEP 678](https://peps.python.org/pep-0678/), [PEP 3134](https://peps.python.org/pep-3134/), [PEP 409](https://peps.python.org/pep-0409/), [PEP 415](https://peps.python.org/pep-0415/), [PEP 709](https://peps.python.org/pep-0709/), [PEP 3151](https://peps.python.org/pep-3151/)
- [Python Developer's Guide: Status of Python versions](https://devguide.python.org/versions/)
- [Debian Python Policy](https://www.debian.org/doc/packaging-manuals/python-policy/): `dist-packages`
- Unicode Character Database [15.1.0 EastAsianWidth.txt](https://www.unicode.org/Public/15.1.0/ucd/EastAsianWidth.txt) (16.0.0 and 17.0.0 compared) and [UAX #11, East Asian Width](https://www.unicode.org/reports/tr11/)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-10-27): section 3.5, the fragment, which carries a Share results link's values
