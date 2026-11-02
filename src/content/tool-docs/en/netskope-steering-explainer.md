## What it does

Describe the situation (managed device or not, on a site or roaming, whether the certificate bundle can be installed, whether policy needs to name the user) and the tool says which steering method fits: the endpoint client, an IPsec or GRE tunnel, an explicit proxy, or chaining from a proxy already in place. **Every method lists what it costs, chosen or not**, because a tool that only listed the downsides of the options it rejected would be an advert for the one it picked.

## The interaction it warns about

**The client detects other steering methods and by default disables itself when it finds IPsec, GRE or an explicit proxy.** So running both is not automatically belt and braces: it is one of them, decided by a setting most people have never opened.

The tool also offers the third arrangement: deploy the client alongside the tunnel **not to steer**, but to provision certificates and supply user identity. The tunnel carries the traffic; the client answers who the user is.

## The hard limit it states

**Without the Netskope root and intermediate certificates on the endpoint there is no TLS inspection and no SAML authentication.** Traffic arrives and policy runs on metadata alone. A rule written as though content were visible will look correct in the console and will not do what its author believes.

## How this differs from the steering decision explainer

They answer different questions and both are on this site:

- **This tool is a design question**: which on-ramp should be deployed for this situation?
- **The steering decision explainer is a runtime question**: given a steering configuration already in place, what happens to *this specific flow*: steered, bypassed, blocked or direct?

Choose the method here; trace the flow there.

## What it will not do

It does not know your licences, your tenant or your existing configuration. DNS steering, for instance, requires specific licences and applies only to certain configuration types, which the tool cannot verify for you.

## Share results

Under the heading of the methods, **Share results** builds a link to this page, only when you press it, that carries the seven answers after the `#`, each as 1 or 0, always, so a link keeps its meaning if a default changes. The answers describe a situation and name no system or person. The page shows methods as it opens, so the button is available at once. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The boxes are ticked as if clicked, and the methods follow. A link missing an answer is ignored. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
