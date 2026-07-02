## What it does

Choose the profile stack on a BIG-IP Standard (full-proxy) virtual server, whether it has a client-SSL profile, an HTTP profile, a server-SSL profile, and a pool, and the tool shows the order in which the common iRule events fire, from `CLIENT_ACCEPTED` through `CLIENT_CLOSED`, as both a timeline and a list. It is a model of documented F5 behaviour, computed in your browser; it never connects to a device.

## Why the order depends on the stack

An iRule is event-driven: your Tcl code runs when a named event fires, and which events fire, and in what order, is decided by the virtual server's configuration, not by the script. A full-proxy virtual server processes the client side and the server side as two separate connections, so the events walk through distinct phases: the client connection is accepted, the client-side TLS handshake completes, the HTTP request is parsed, a pool member is selected, the server-side connection is opened, the server-side TLS handshake completes, the request is sent, the response comes back, and finally both sides close. Change the stack and the set of events changes with it.

## What each profile adds

- **No profiles beyond a pool** leaves the connection-level events: `CLIENT_ACCEPTED` at the start, the load-balancing events when a member is chosen, `SERVER_CONNECTED` on the server side, and the `CLOSED` events at the end.
- **A client-SSL profile** adds the client-side TLS events, such as `CLIENTSSL_CLIENTHELLO` and `CLIENTSSL_HANDSHAKE`, before the request is processed.
- **An HTTP profile** adds the request and response events, `HTTP_REQUEST` on the client side and `HTTP_REQUEST_SEND` and `HTTP_RESPONSE` on the server side, so you can act on headers and payload.
- **A server-SSL profile** adds the server-side TLS events for the connection to the pool member.

The tool also places the conditional events, the data-collection paths and the load-balancing failure path (`LB_FAILED`), where they belong in the sequence.

## A note on multiple iRules

When two iRules both handle the same event, the order between them is not the order they are listed; it is controlled by the `priority` command within each event (F5 K12090273), with a default priority applied when none is set. That is a separate axis from the cross-event order this tool lays out.

## Using it

Toggle the profiles on your virtual server and read the resulting event sequence as a timeline and a list. It reflects F5's documented event model (the Master List of iRule Events and the per-event references), so it is a planning and learning aid, not a capture from a live system.
