# OAuth flow chooser

The first question of every OAuth or OpenID Connect integration - PingFederate, PingAM, PingOne, or anything else - is *which flow*. This tool encodes the modern answer as a deterministic decision, and cites the RFC behind every line of it.

## Three questions

What kind of app is it (server-side web, SPA, native, service-to-service, or a limited-input device)? Does it need to know **who** the user is (that is OpenID Connect's job, layered on the same flow)? Does it need access while the user is away (refresh tokens)?

## The answers it gives

Server, SPA, and native apps all get **authorization code** - confidential with a secret where a backend exists, public **with PKCE** (RFC 7636) where one does not, and the RFC 8252 system-browser rule spelled out for native. Service-to-service gets **client credentials** (RFC 6749 §4.4) with the note that refresh tokens SHOULD NOT be issued there. TVs and kiosks get the **device grant** (RFC 8628) with its user_code-on-a-second-device dance.

## The half that matters just as much

Every result includes the *avoided* list: **implicit** and **ROPC (password)** are retired by name, per the OAuth 2.0 Security Best Current Practice (RFC 9700), with the reasons - tokens in fragments, credentials in apps - stated plainly. Public clients requesting offline access get the refresh-token **rotation** requirement; asking a machine-to-machine flow for end-user identity raises a contradiction warning instead of a wrong answer.

Everything is decided locally; the three answers carry no secrets and nothing is transmitted.

## Share results

Under the recommended flow's name and grant, **Share results** builds a link to this page, only when you press it, that carries your three answers after the `#`: the application type by its stable name (`app=spa`), and each question you answered yes (`identity=1`, `offline=1`). Nothing you type goes, because there is nothing to type. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the answers are not sent to the server when the link is opened; they stay in the address bar and the history of whoever opens it.

- **Opening a link.** The three answers replace the form's and the page recommends the same flow, in the browser. An application type the page does not offer, or an answer other than 1 or 0, makes the whole link ignored. Either way the values leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
