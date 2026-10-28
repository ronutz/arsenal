## What it does

Choose the profile stack on a BIG-IP Standard (full-proxy) virtual server, whether it has a client-SSL profile, an HTTP profile, a server-SSL profile, and a pool, and the tool shows the order in which the common iRule events fire, from `CLIENT_ACCEPTED` through `CLIENT_CLOSED`, as both a timeline and a list. It is a model of documented F5 behaviour, computed in your browser; it never connects to a device.

## Why the order depends on the stack

An iRule is event-driven: your Tcl code runs when a named event fires, and which events fire, and in what order, is decided by the virtual server's configuration, not by the script. A full-proxy virtual server processes the client side and the server side as two separate connections, so the events walk through distinct phases: the client connection is accepted, the client-side TLS handshake completes, the HTTP request is parsed, a pool member is selected, the server-side connection is opened, the server-side TLS handshake completes, the request is sent, the response comes back, and finally both sides close. Change the stack and the set of events changes with it.

## What each profile adds

- **No profiles beyond a pool** leaves the connection-level events: `CLIENT_ACCEPTED` at the start, the load-balancing events when a member is chosen, `SERVER_CONNECTED` on the server side, and the `CLOSED` events at the end.
- **A client-SSL profile** adds the client-side TLS events, such as `CLIENTSSL_CLIENTHELLO` and `CLIENTSSL_HANDSHAKE`, before the request is processed.
- **An HTTP profile** adds the request and response events, `HTTP_REQUEST` on the client side and `HTTP_REQUEST_SEND` and `HTTP_RESPONSE` on the server side, so you can act on headers and payload.
- **A server-SSL profile** adds the server-side TLS events for the connection to the pool member.
- **A JSON or SSE profile** is outside this model. BIG-IP 21.0.0 introduced the JSON events ([`JSON_REQUEST`](https://clouddocs.f5.com/api/irules/JSON_REQUEST.html), `JSON_RESPONSE` and their error and missing variants) and [`SSE_RESPONSE`](https://clouddocs.f5.com/api/irules/SSE_RESPONSE.html), and they need a JSON or SSE profile on the virtual server along with the HTTP profile ([BIG-IP 21.0 profiles reference](https://techdocs.f5.com/en-us/bigip-21-0-0/big-ip-local-traffic-management-profiles-reference/model-context-protocol.html), read 2026-10-26). The tool names them in its notes rather than placing them in the sequence.

The tool also places the conditional events, the data-collection paths and the load-balancing failure path (`LB_FAILED`), where they belong in the sequence.

## A note on multiple iRules

When two iRules both handle the same event, the order between them is not the order they are listed; it is controlled by the `priority` command within each event (F5 K12090273), with a default priority applied when none is set. That is a separate axis from the cross-event order this tool lays out.

## Using it

Toggle the profiles on your virtual server and read the resulting event sequence as a timeline and a list. It reflects F5's documented event model (the Master List of iRule Events and the per-event references), so it is a planning and learning aid, not a capture from a live system.

## Share results

Above the event sequence, **Share results** builds a link to this page, only when you press it, that carries the five profile switches by name, each as `1` or `0` (`#clientssl=1&http=1&serverssl=1&pool=1&fastl4=0`), and nothing else; there is always a sequence, so a stack with every switch off gets a link too. Everything the link carries goes after the `#`, which [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has "separated from the rest of the URI prior to a dereference": a browser does not send it to the server when the link is opened, but it stays in the address bar and history of whoever opens it, and anyone who has the link can read it.

- **How long.** A link carries at most 16,384 characters, the bound the site uses for every value after the `#`; five switches are far shorter.
- **Opening a link.** The switches take the link's values (a switch the link does not carry is off) and the sequence is drawn, as clicking them would. A value other than `1` or `0` makes the whole link ignored. Accepted or not, the values then leave the page's own address at once, without a request, so a reload, a bookmark or the page's own Share button carries nothing you did not choose to share.
