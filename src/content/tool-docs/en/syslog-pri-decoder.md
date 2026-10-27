## What it does

Every syslog message begins with a priority value, the PRI, a small number in angle brackets like `<134>` at the very start of the line. It packs two pieces of information into one number. This tool decodes a PRI into its facility and severity, and encodes a facility and severity back into a PRI and its on-the-wire `<PRI>` form. It all runs in your browser.

## The PRI formula

The PRI combines a facility and a severity with the arithmetic defined in RFC 5424:

    PRI = Facility * 8 + Severity
    Facility = PRI / 8   (integer division)
    Severity = PRI % 8

Because severity occupies only the low three bits, you can read a PRI at a glance once you know the pieces. The valid range is 0 to 191, since the facility runs 0 to 23 and the severity 0 to 7.

## Facility and severity

- The **facility** (0 to 23) names the subsystem that produced the message: the kernel, the mail system, the auth system, the syslog daemon itself, and so on, up through the eight `local0` to `local7` slots that network devices and appliances typically use for their own messages.
- The **severity** (0 to 7) rates urgency, and it runs in the counterintuitive direction: 0 is the most severe (Emergency) and 7 the least (Debug), with Error at 3 and Informational at 6 in between.

## Worked example

- `<134>` decodes to facility 16 (`local0`) and severity 6 (Informational), because `134 = 16 * 8 + 6`. That particular value is a common default for network devices logging routine events.

## Using it

Enter a PRI to split it into facility and severity, or pick a facility and severity to get the PRI and the `<PRI>` string you would see on the wire. RFC 5424 defines the modern syslog format; the older BSD format in RFC 3164 uses the same PRI arithmetic.

## Share results

Under the result, in either mode, **Share results** builds a link to this page, only when you press it, that carries one PRI and nothing else: in Decode mode the field as typed (`#input=%3C34%3E`); in Encode mode the PRI the facility and severity make, in its wire form (`#input=%3C134%3E` for local0 and informational), so the link opens in Decode mode on the same facility and severity. Everything the link carries goes after the `#`, which [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has "separated from the rest of the URI prior to a dereference": a browser does not send it to the server when the link is opened, but it stays in the address bar and history of whoever opens it, and anyone who has the link can read it.

- **How long.** A link carries at most 16,384 characters, the bound the site uses for every value after the `#`; a PRI is at most five characters.
- **Opening a link.** The link is the same address other links into this tool use: the PRI fills the Decode field as typing would. As with every link into this tool, the value stays after the `#` until you change or clear the field, and then leaves the address without a request.
