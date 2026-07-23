# OAuth flow chooser

The first question of every OAuth or OpenID Connect integration - PingFederate, PingAM, PingOne, or anything else - is *which flow*. This tool encodes the modern answer as a deterministic decision, and cites the RFC behind every line of it.

## Three questions

What kind of app is it (server-side web, SPA, native, service-to-service, or a limited-input device)? Does it need to know **who** the user is (that is OpenID Connect's job, layered on the same flow)? Does it need access while the user is away (refresh tokens)?

## The answers it gives

Server, SPA, and native apps all get **authorization code** - confidential with a secret where a backend exists, public **with PKCE** (RFC 7636) where one does not, and the RFC 8252 system-browser rule spelled out for native. Service-to-service gets **client credentials** (RFC 6749 §4.4) with the note that refresh tokens SHOULD NOT be issued there. TVs and kiosks get the **device grant** (RFC 8628) with its user_code-on-a-second-device dance.

## The half that matters just as much

Every result includes the *avoided* list: **implicit** and **ROPC (password)** are retired by name, per the OAuth 2.0 Security Best Current Practice (RFC 9700), with the reasons - tokens in fragments, credentials in apps - stated plainly. Public clients requesting offline access get the refresh-token **rotation** requirement; asking a machine-to-machine flow for end-user identity raises a contradiction warning instead of a wrong answer.

Everything is decided locally; the three answers carry no secrets and nothing is transmitted.
