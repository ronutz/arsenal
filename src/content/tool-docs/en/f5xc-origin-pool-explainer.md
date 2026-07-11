## What it does

This tool decodes an F5 Distributed Cloud (XC) origin_pool spec. Paste the origin_pool object from the Console's JSON view, its spec body, or a create/get envelope, and it lays out what the pool actually does: every origin server's type and address, the pool port, the load-balancing algorithm and endpoint selection, the health checks it references, and the TLS-to-origin settings. It runs entirely in your browser.

## Origin servers: type and place

An origin pool can point at origins in several ways, and the tool names each one. A public IP or public DNS name reaches origins over the internet. An IP or DNS name "on given sites" reaches origins through a Customer Edge or Regional Edge and carries a site or virtual-site locator - the tool shows that location. K8s and Consul service names use service discovery on a site. There are also virtual-network and custom-endpoint variants. Each origin can also carry labels, which the tool lists.

## Where weights and priorities actually live

A common misconception is that origin servers in a pool have weights and priorities. They do not. Inside a pool, the origin servers are a flat list served according to the pool's algorithm. Weights and priorities are set one level up, on the pool's reference inside a route or the load balancer's default pools - each reference is a pool plus a weight plus a priority. The tool states this so you look in the right place.

## The pool port and endpoint selection

The port can be explicit, taken from the endpoint, or automatic - and automatic means 443 when TLS to origin is enabled and 80 when it is not. Endpoint selection controls which Regional Edge egresses to the origin: Local Preferred (the default) egresses from the local RE when it has a healthy origin entry, and otherwise forwards over the F5 global network to an RE that does. That is why the same origin can appear many times in the Console, once per RE.

## TLS to origin

If TLS to origin is enabled, the tool decodes the security level - reusing the same level data as the TLS security-level mapper, so High is minimum TLS 1.2 - along with the SNI mode (use the Host header, an explicit value, or no SNI), the server-verification choice, and whether mTLS is on. It flags the case that matters most: skipping origin-server verification. That still encrypts the connection, but it does not validate the origin's certificate, so the tool calls it out.
