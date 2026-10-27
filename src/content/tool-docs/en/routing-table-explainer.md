## What it does

Paste what a host printed for its routing table and the tool reads it for you. It recognises four printouts: Linux iproute2 (`ip route`, `ip route show table all`, `ip -6 route`, `ip -d route`), Linux net-tools (`netstat -rn` and `route -n`, the "Kernel IP routing table"), BSD and macOS `netstat -rn` ("Routing tables", "Internet:", "Internet6:"), and Windows `route print` with its IPv4 and IPv6 tables, Active and Persistent. Every route becomes one row of the same table (destination prefix, next hop, interface, metric, type, table) and each row opens into a field-by-field reading in plain language. The tool then lists the default routes of every table and says which one wins, and a second box answers "which route does this destination use?" by the router's rules. Nothing leaves the browser, and no route is changed or queried.

## What each field means

The readings come from the manuals of the commands, read on 2026-10-19.

- **iproute2.** The destination comes first; `default` is "equivalent to IP 0/0 or to IPv6 ::/0", and a bare address is a host route because "If the length of the prefix is missing, ip assumes a full-length host route" ([ip-route(8)](https://man7.org/linux/man-pages/man8/ip-route.8.html)). Then come `via` (the next-hop router), `dev` (the output device), `proto` (kernel, boot, static, ra and redirect have fixed meanings; any other tag is not interpreted by the kernel, [rtnetlink(7)](https://man7.org/linux/man-pages/man7/rtnetlink.7.html)), `scope` (host, link, global), `src` (the preferred source address), `metric` ("routes with lower values are preferred"), `table`, the next-hop flag `onlink`, and options such as `pref`, `mtu` and `nhid`. A leading type word says what the route does: unicast forwards, local and broadcast belong to the host's own table, and blackhole, unreachable, prohibit and throw do not forward. Indented `nexthop` lines are attached to the route above as its multipath hops, with their `weight`.
- **net-tools.** Destination plus Genmask is the prefix ("'0.0.0.0' for the default route"), Gateway is "The gateway address or '*' if none set", and the Flags letters are those [route(8)](https://man7.org/linux/man-pages/man8/route.8.html) lists under OUTPUT: U up, H host, G use gateway, R, D, M, A, C and ! for reject. `route -n` prints Metric, Ref and Use; `netstat -rn` prints MSS, Window and irtt instead.
- **BSD and macOS.** The Flags letters are decoded from [FreeBSD netstat(1)](https://man.freebsd.org/cgi/man.cgi?query=netstat&sektion=1) (U, G, H, S, B, b, D, L, M, R, X, 1, 2, 3) and from Apple's netstat.1, which adds C, c, I, i, m, r, W, Y and g; a letter that only macOS lists is marked as such. A `link#N` gateway is a direct route, and a gateway such as `0:e0:b5:36:cf:4f` is a link-layer address. These printouts carry no metric.
- **Windows.** Active Routes are the routes in use; Persistent Routes are stored configuration ([Microsoft Learn, KB 2966111](https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/incorrect-default-gateways-in-persistent-routes)). In the IPv4 table, Netmask gives the prefix length, Gateway is a next-hop address or `On-link`, Interface is the address of the local adapter, and among routes to the same destination "the route with the lowest metric is selected" ([Microsoft Learn, The IP routing table](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2003/cc779122(v=ws.10))). In the IPv6 table, If is an interface number from the Interface List; a gateway that wraps onto the next line is joined to its row.

Anything the tool does not understand is shown, never dropped: a token it cannot read stays on its route under "Not understood", and a line that is neither a route nor known structure (headers, rulers, section titles, an echoed `$ ip route` prompt) is listed with its line number.

## Default routes and the lookup

A default route is a route of prefix length zero. When a table holds several, they have the same length, so the metric decides and the lowest wins; the tool names the winner, or says why it cannot (equal metrics, or a printout with no comparable metric, such as BSD netstat or Windows Persistent Routes reading `Default`).

The lookup applies the pruning rules of [RFC 1812, section 5.2.4.3](https://www.rfc-editor.org/rfc/rfc1812.txt): basic match keeps the routes whose prefix contains the destination, longest match keeps the longest of them, and among equal lengths the lowest metric wins. It shows the candidates, the survivors and the rule that decided. For iproute2 it reads the tables in the order of the three default policy rules, local, then main, then default ([ip-rule(8)](https://man7.org/linux/man-pages/man8/ip-rule.8.html)); any other table, such as a `table 100`, is listed as not consulted, since only a policy rule of its own would reach it. A winning `throw` route sends the lookup on to the next table, as ip-route(8) describes. On Windows only Active Routes are consulted. Routes whose destination is not an address with a length (a name printed without `-n`, an abbreviation, a redacted value) are listed as left out.

## Things it cannot know

- `ip route show table 100` prints no `table` word on its lines, so a pasted listing of one table is read as table main, the listing default.
- iproute2 prints no metric when it is zero: in the capture behind the examples, `route -n` showed Metric 0 for a route that `ip route` printed without one, and the tool compares such a route as metric 0.
- The Linux net-tools "Kernel IPv6 routing table" is kept as not understood, because route(8) documents the IPv4 columns only; paste `ip -6 route` instead.
- Policy rules other than the three defaults are not in a routing table printout, so the tool cannot follow them.

## Examples

The Example button loads a real `ip route show` captured on 2026-10-19 on a host at 192.0.2.2 and asks about 192.0.2.77: the default 0.0.0.0/0 and the connected 192.0.2.0/24 both contain it, and the /24 wins by longest match, so the packet is delivered on-link on eth0. The golden vectors add the same host's `ip route show table all` (where 192.0.2.200 is inside a /25 of table 100, but no rule reaches table 100 and main's /24 delivers it), its `ip -d route show table 100` (two defaults with metrics 100 and 200, and blackhole, unreachable, prohibit and throw routes), its `netstat -rn` and `route -n`, FRRouting's sixteen-way multipath example, a Windows 10 `route print` (ff02::1 matches two ff00::/8 routes and metric 331 beats 5256), Microsoft's persistent-routes example, and the FreeBSD Handbook's `netstat -nr` and `netstat -r` tables.

## Share results

At the top of the reading, **Share results** builds a link to this page, only when you press it, that carries the table as pasted (`#input=...`) and, when you typed one, the destination (`&destination=192.0.2.77`); which route's field-by-field reading is open is not carried. Before you copy anything the popover adds a caution: a routing table names internal addresses, gateways and interfaces, so read it before you send the link. Everything the link carries goes after the `#`, which [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has "separated from the rest of the URI prior to a dereference": a browser does not send it to the server when the link is opened, but it stays in the address bar and history of whoever opens it, and anyone who has the link can read it.

- **How long.** A link carries at most 16,384 characters, the bound the site uses for every value after the `#`; a longer one gets no link, and the popover says how long it would be.
- **Opening a link.** The table fills the box as a paste would, the destination fills its field (and is cleared when the link has none), and the page parses and looks up again. The page refuses a malformed destination with its own message, as typing would. Accepted or not, the values then leave the page's own address at once, without a request, so a reload, a bookmark or the page's own Share button carries nothing you did not choose to share.

## API

The same engine answers the `/api/v1/routing-table-explainer` operation of the site's HTTP API, written out field by field in the OpenAPI contract on the [API page](/api), with examples taken from the golden vectors. The contract also says whether this site serves the API.

- **Request.** Either the printout as text, which is parsed only, or a JSON object `{"text": "<the printout>", "lookup": "<an IPv4 or IPv6 address>"}`, which is parsed and then looked up.
- **Response.** `parse` holds `format` (`iproute2`, `netstat-linux`, `netstat-bsd`, `windows` or `unknown`), `routes` (each with `index`, `line`, `raw`, `section`, `family`, `destination`, `prefix`, `prefixLength`, `isDefault`, `type`, `gateway`, `onLink`, `interface`, `metric`, `metricText`, `protocol`, `scope`, `src`, `flags`, `nhFlags`, `nexthops`, `attributes`, `unparsed` and `notes`), `interfaces` (the Windows Interface List), `defaults` (per table: `section`, `consulted`, `candidates`, `winner` and `reason`), `unparsedLines`, `structureLines`, `lineCount` and `warnings`. `lookup` is null, or holds `destination`, `family`, `stages` (each with `section`, `candidates`, `longest`, `survivors`, `winner`, `outcome` and `decidedBy`), `skipped`, `unusable`, `winner`, `action` and `decidedBy`. For the example capture with the lookup 192.0.2.77 the answer is the route at `index` 1 (192.0.2.0/24, shown as #2 on the page), action `on-link`, decided by `longest-prefix`.
- **Errors.** HTTP 400, `invalid_input`, with the engine's message: a lookup that is not one IPv4 or IPv6 address, or a request that starts with `{` but is not the JSON object above. Text that is not a routing table is not refused: `format` is `unknown` and the lines are listed as not understood.

## Sources

- [ip-route(8), Linux manual page, iproute2, man7.org copy of 4 August 2026](https://man7.org/linux/man-pages/man8/ip-route.8.html) (read 2026-10-19): SYNOPSIS and DESCRIPTION
- [ip-rule(8), Linux manual page, iproute2](https://man7.org/linux/man-pages/man8/ip-rule.8.html) (read 2026-10-19): the three default rules
- [rtnetlink(7), Linux manual page, man-pages 6.19](https://man7.org/linux/man-pages/man7/rtnetlink.7.html) (read 2026-10-19): rtm_type, rtm_protocol and rtm_scope
- [route(8), Linux manual page, net-tools](https://man7.org/linux/man-pages/man8/route.8.html) (read 2026-10-19): OUTPUT
- [netstat(8), Linux manual page, net-tools](https://man7.org/linux/man-pages/man8/netstat.8.html) (read 2026-10-19): --route
- [netstat(1), FreeBSD 15.1, 7 April 2026](https://man.freebsd.org/cgi/man.cgi?query=netstat&sektion=1) (read 2026-10-19): the -r letter table
- [Apple, network_cmds, netstat.tproj/netstat.1](https://github.com/apple-oss-distributions/network_cmds/blob/main/netstat.tproj/netstat.1) (read 2026-10-19): the letter table
- [FreeBSD Handbook, Advanced Networking, 35.2 Gateways and Routes](https://docs.freebsd.org/en/books/handbook/advanced-networking/) (read 2026-10-19)
- [Microsoft Learn, Windows commands, route](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/route_ws2008) (read 2026-10-19)
- [Microsoft Learn, The IP routing table (Windows Server 2003)](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2003/cc779122(v=ws.10)) (read 2026-10-19)
- [Microsoft Learn, KB 2966111, persistent routes](https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/incorrect-default-gateways-in-persistent-routes) (read 2026-10-19)
- [RFC 1812, Requirements for IP Version 4 Routers, June 1995](https://www.rfc-editor.org/rfc/rfc1812.txt) (read 2026-10-19): section 5.2.4.3
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-10-27): section 3.5, the fragment, which carries a Share results link's values
