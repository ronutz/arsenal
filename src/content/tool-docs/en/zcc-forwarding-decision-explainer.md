# ZCC forwarding decision explainer

Paste a Zscaler Client Connector posture - the detected network state, the ZIA forwarding action, the Z-Tunnel version, optionally the ZPA action - and read back the documented decision spine, layer by layer, exactly as the vendor's reference architecture and help portal describe it.

## Why an explainer, and not a simulator

This tool exists in the form its ratification clause specified, and the reason is stated here before anything else. The verification pass (2026-07-21, against the Secure Mobile Access with Zscaler Client Connector reference architecture and help.zscaler.com) found the decision **spine** publicly documented end to end: how the trusted-network state is determined, what each of ZIA's four per-state actions does, what each Z-Tunnel version captures, the automatic Z-Tunnel 2.0-to-1.0 failover, the hybrid web-split, and ZPA's two actions. That spine is deterministic, and this tool computes it.

What is **not** published is a single precedence order for the bypass layer. The mechanisms are each documented - Application Bypass, Destination and Domain Exclusions and Inclusions, VPN Gateway Bypass, the app-profile PAC, the forwarding-profile PAC with its Z-Tunnel 2.0 bypass macro - but when several of them address the same flow, Zscaler publishes recipes, not a conflict-resolution matrix. A simulator would have to invent that matrix. This tool declines: it renders every documented mechanism as an explained ledger and adjudicates nothing. Same no-invention rule as the rest of this site's tools.

## Input grammar

One setting per line, `key = value`. Lines starting with `#` are comments.

- `network` - trusted | vpn | off-trusted (required)
- `zia-action` - tunnel | twlp | enforce-proxy | none (required)
- `tunnel` - zt2 | zt1 (only with the tunneling actions)
- `web-split` - on | off (the documented Z-Tunnel 2.0 hybrid mode)
- `zpa-action` - tunnel | none (optional)

## What you get back

The spine renders as layered cards: the network state with the documented detection criteria (DNS Server and Search Domains recommended as the most static, ANY/ALL matching, the Pre-Defined Trusted Networks exclusivity, and the documented dynamic-resolution failure mode); the ZIA action's documented meaning; the Z-Tunnel semantics for your choice - Z-Tunnel 1.0's web-only 80/443 proxy tunnel versus Z-Tunnel 2.0's all-ports DTLS/TLS capture, with the automatic failover and, when enabled, the hybrid web-split; and the ZPA layer's deliberately smaller two-action decision. Below the spine sit the bypass ledger and the standing notes, including the reference architecture's own recommendation table (Trusted = None, VPN = Tunnel with Local Proxy, Off-Trusted = Tunnel, Z-Tunnel 2.0) and the fail-open/fail-close overlays.

Everything runs locally in your browser; nothing you paste leaves the page.

## Sources

- Zscaler Reference Architecture: Secure Mobile Access with Zscaler Client Connector - the states, actions, criteria, tunnel semantics, failover, and recommendation table
- Zscaler Help: About Z-Tunnel 1.0 & Z-Tunnel 2.0
- Zscaler Help: Best Practices for Adding Bypasses for Z-Tunnel 2.0 - the two-PAC division of labor
- Zscaler Help: Configuring Forwarding Profiles for Zscaler Client Connector
