## What it does

Paste a snippet of a BIG-IP `bigip.conf` and the tool parses it and explains every object in plain language, along with the structure that holds them together. It reads the configuration only, entirely in your browser; it changes nothing and contacts no device.

## How a BIG-IP configuration is shaped

BIG-IP stores its configuration as tmsh objects, and they all follow one shape:

    <module> <component> [<type>] <name> {
        <key> <value>
        <key> { <nested body> }
        <bare-list-item>
    }

The leading words place the object in BIG-IP's module and component hierarchy (`ltm virtual`, `ltm pool`, `net vlan`, and so on), the name identifies it, and the braces hold its fields. Inside a body, newlines separate entries, brace blocks can nest to any depth, quoted strings may contain spaces, and a `#` begins a comment. A backslash sequence inside quotes is shown as written: a monitor's send string holds `\r\n`, and the BIG-IP turns each `\r` into a carriage return and each `\n` into a line feed only when it formats the request ([F5 K2167](https://my.f5.com/manage/s/article/K2167), read 2026-10-27). The tool follows exactly this grammar to break a snippet into its objects and each object into its fields.

## What it explains

Rather than leaving you to recognise each field, the tool describes what the common objects and settings mean: a virtual server's `destination`, `pool`, `profiles`, and `source-address-translation`; a pool's `members`, `monitor`, and `load-balancing-mode`; and the many other objects a configuration ties together. The result is a readable map of what a configuration actually does, which is useful when you inherit a device, review a change, or learn the object model.

## The one thing that is not tmsh

There is a deliberate exception. An `ltm rule` object carries a Tcl iRule in its body, and that body is a script, not tmsh configuration. The parser recognises this and captures the iRule verbatim rather than trying to parse it as objects and fields, so your rule is preserved exactly as written instead of being mangled.

## Using it

Paste a `bigip.conf` snippet, from a single object to a large block, and read the structured, explained breakdown. The parse is deterministic and local, so it is also a safe way to read a configuration exported from a device you cannot or should not query directly.

## Share results

Under the summary of what was found, **Share results** builds a link to this page, only when you press it, that carries the configuration after the `#` with the value of every secret setting replaced by `[redacted]`, never as pasted, because this page shows every field's value. Its popover says first what the link carries and how many values were replaced, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

The settings are `password` (the monitors, [ltm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_http.html): "the password if the monitored target requires authentication"), `passphrase` ([client-ssl](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_client-ssl.html), server-ssl, sys file ssl-key), `secret` ([auth radius-server](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_radius-server.html), auth tacacs, ltm monitor radius), `bind-pw` ([auth ldap](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_ldap.html)), `preshared-key` ([net ipsec ike-peer](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/net/net_ipsec_ike-peer.html)), the SNMP `community-name`, `community` and `trap-community` ([sys snmp](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_snmp.html)), and every setting whose name ends in `-password`, `-passphrase` or `-secret` (`encrypted-password`, `auth-password`, `privacy-password`, [`cookie-encryption-passphrase`](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_persistence_cookie.html), [`encrypt-cookie-secret`](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_http.html), `proxy-ca-passphrase`); F5's tmsh reference pages, read 2026-10-27. A monitor's `send` string keeps its text except the credentials of an `Authorization` or `Proxy-Authorization` header ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2, read 2026-10-27), which become `[redacted]` too. `none` stays. `[redacted]` is one tmsh word, so the copy reads as the same objects, fields and nesting: the tool's share vectors check that the receiving page parses the same tree. Names, addresses and partitions go as pasted.

An iRule body (`ltm rule`) is Tcl, shown here verbatim, and it goes as pasted: when the configuration holds one, the popover says so, so you can check it for a hard-coded token or password first. [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the copy is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the box as a paste would and the page explains it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Related tools

- A Scripted monitor (`ltm monitor scripted`) plays a file of send and expect lines kept in `/config/eav/`; the [BIG-IP Scripted monitor explainer](/tools/bigip-scripted-monitor-explainer) reads that file and simulates the check against a server transcript.
- To collect a configuration from a BIG-IP by script, the [Expect script builder](/tools/expect-script-builder) writes a login-and-run script with a tmsh profile, which turns tmsh's pager off with `modify /cli preference pager disabled display-threshold 0`.
