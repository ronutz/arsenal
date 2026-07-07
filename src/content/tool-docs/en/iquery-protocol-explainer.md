## What it does

Paste the output of the F5 `iqdump` command, lines from `/var/log/gtm`, or the name of a topic, and this explains F5's iQuery protocol without touching a device. iQuery is the proprietary, XML-based protocol that BIG-IP DNS (formerly GTM) uses to talk to the `big3d` agent on itself and on every other BIG-IP it knows about. The tool decodes what you paste and explains the architecture behind it. It is a decode-and-explain tool that runs entirely in your browser, grounded in F5's own BIG-IP DNS/GTM documentation.

## Decoding iqdump output

`iqdump` streams the live iQuery data between two systems so you can verify the path and the SSL authentication. Paste its output and the tool reads back the header comment lines, the local hostname you ran it from, the `big3d` peer it connected to and the port (4353), the synchronization group it subscribed to, and the timestamp, then the `<xml_connection>` stanza fields such as `version`, the `big3d` build string, and `connection_id`. Each field is explained, and a present `big3d` peer line is called out as evidence that the TCP path and SSL trust to that agent are working, because a broken path makes `iqdump` report an error instead.

## Decoding /var/log/gtm lines

The `gtmd` process logs iQuery mesh health to `/var/log/gtm`. Paste those lines and the tool decodes the box state-change messages, for example a `green --> red` transition that means a BIG-IP became unavailable over iQuery, along with the `SNMP_TRAP` entries and the `big3d` connection established/lost messages. A `green --> red` transition is flagged with what to check next: the iQuery path (TCP 4353, SSL trust) to that box, and whether its `big3d` is running and version-compatible.

## Explaining the architecture

Type or click a topic and the tool explains it in F5's terms: the iQuery mesh of long-lived connections, TCP port 4353, the SSL certificate-based trust that `bigip_add`, `big3d_install`, and `gtm_add` bootstrap, the `iqdump` command itself, what iQuery carries (object availability plus the load-balancing metrics dynamic GSLB needs), the `gtmd` and `big3d` agents, and the VLAN rule that iQuery is sent only on the VLAN on which a system receives it.

## Scope and grounding

This explains and decodes; it never opens a socket, runs `iqdump`, or fetches anything, and the same input always produces the same output. It reads the shape of `iqdump` and log text rather than validating an entire iQuery exchange. Every fact comes from F5's BIG-IP DNS/GTM concepts and implementations manuals, the LTM-DNS operations guide, and the K-articles on iQuery trust and troubleshooting; the example is a real `iqdump` sample published by F5. Note that the Link Controller module was removed in BIG-IP 21.0.0. Nothing you paste leaves the page.
