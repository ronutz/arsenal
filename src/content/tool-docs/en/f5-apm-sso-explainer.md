# APM SSO method explainer

The job of BIG-IP Zero Trust Access (formerly BIG-IP APM - Access Policy Manager) after authentication is to keep authenticating for you, and the Single Sign-On Methods chapter defines exactly eight ways it does that: HTTP Basic, NTLMv1, NTLMv2, Kerberos constrained delegation, Form Based, Forms - Client Initiated, OAuth Bearer, and SAML. This tool renders each as a card with its mechanism, its credentials plumbing, its prerequisites, and its quirks, all condensed faithfully from the chapter and the method-specific guides.

The verdict on every card is the chapter's own blast-radius paragraph, and it is the operational headline: a misconfigured SSO object for HTTP Basic, NTLMv1, NTLMv2, Kerberos, OAuth Bearer, or SAML can disable SSO for all authentication methods in that user's session. Form Based and Forms - Client Initiated are the only two methods not disabled when another method's object is broken. One bad Kerberos SSO configuration and every application in the session can lose its SSO; one bad form configuration and only that application does. That asymmetry decides how carefully each object class deserves to be handled.

The Kerberos card carries the full prerequisite list: a delegation account in Active Directory per server realm, its SPN entered as the Account Name in SPN format, the realm in uppercase, Resource-Based Constrained Delegation for multi-realm estates, and the manual's own line, worth framing: APM Kerberos SSO does not need or use a keytab file. Its natural front doors are the methods where the password never travels in clear text, client certificates and NTLM among the chapter's own examples. NTLMv2 carries the documented quirk that a 401 with more than one WWW-Authenticate: NTLM header makes SSO fail, expected behaviour per the manual. Forms - Client Initiated carries its design's cleverest detail: the JavaScript APM inserts assigns the password parameter a token rather than the actual password, so the credential never sits in the page.

The plumbing note on every lookup ties the methods to the machinery: access-policy agents populate the session variables SSO consumes, the classic wiring being a Logon Page followed by SSO Credential Mapping, feeding session.logon.last.* into session.sso.token.last.*.

Everything runs locally; nothing you type leaves the page.

## Share results

At the top of the reading, **Share results** builds a link to this page, only when you press it, that carries the method name as typed after the `#`, and nothing else. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

This page takes no SSO configuration at all: it reads a name from its table of eight methods, or `methods`, and refuses anything else. A link is offered only for a name it reads, and an arriving link is accepted only for the same, so neither an SSO object nor a credential can travel in one.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the text is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The text fills the box as a paste would and the page reads it; nothing is sent anywhere. The value then leaves the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
