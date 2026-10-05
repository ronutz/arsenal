## What it does

Reads one syslog message as received, or one TCP frame carrying a message, and names every field in the order its RFC names them. Two grammars are tried: the RFC 5424 message (PRI, VERSION, TIMESTAMP, HOSTNAME, APP-NAME, PROCID, MSGID, STRUCTURED-DATA, MSG) and the BSD form RFC 3164 describes (PRI, TIMESTAMP, HOSTNAME, TAG, CONTENT). The PRI is opened into facility and severity through the same tables the [syslog PRI decoder](/tools/syslog-pri-decoder) uses. Whatever is non-compliant is flagged in the RFC's own words, and the structured data is opened element by element, with the IANA-registered parameters explained. Nothing is sent anywhere.

## What it checks, and where each rule comes from

RFC 5424 (March 2009), read 2026-10-05:

- The PRI: `<` PRIVAL `>`, PRIVAL = Facility × 8 + Severity, three to five characters; "The only time a value of 0 follows the < is for the Priority value of 0. Otherwise, leading 0s MUST NOT be used" (§6.2.1). Above 191 there is no facility.
- VERSION: a non-zero digit followed by up to two digits; "This document uses a VERSION value of 1" (§6.2.2).
- TIMESTAMP: "a formalized timestamp derived from RFC 3339"; "The T and Z characters in this syntax MUST be upper case"; "Leap seconds MUST NOT be used"; TIME-SECFRAC is a dot and one to six digits; or the NILVALUE (§6.2.3 and §6).
- HOSTNAME 1 to 255, APP-NAME 1 to 48, PROCID 1 to 128, MSGID 1 to 32 printable US-ASCII characters, or the NILVALUE (§6).
- STRUCTURED-DATA: `[` SD-ID *(SP SD-PARAM) `]`, elements adjacent; an SD-ID is at most 32 characters; "The same SD-ID MUST NOT exist more than once in a message"; registered names carry no at-sign, private names carry one and an enterprise number; inside a PARAM-VALUE the characters `"`, `\` and `]` are escaped with a backslash (§6.3). The IANA SD-IDs of §7 are timeQuality (tzKnown, isSynced, syncAccuracy), origin (ip, enterpriseId, software, swVersion) and meta (sequenceId, sysUpTime, language); a parameter outside those lists under one of those ids is flagged.
- MSG: "If a syslog application encodes MSG in UTF-8, the string MUST start with the Unicode byte order mask (BOM)" (§6.4); non-ASCII text without the BOM is of unknown encoding and is flagged.
- Length: "Any transport receiver MUST be able to accept messages of up to and including 480 octets in length. All transport receiver implementations SHOULD be able to accept messages of up to and including 2048 octets in length" (§6.1).

RFC 3164 (August 2001), read 2026-10-05:

- The packet "MUST be 1024 bytes or less" (§4.1).
- TIMESTAMP "Mmm dd hh:mm:ss" in local time, the month one of the twelve English abbreviations, and "If the day of the month is less than 10, then it MUST be represented as a space and then the number" (§4.1.2).
- HOSTNAME "will contain the hostname, as it knows itself. If it does not have a hostname, then it will contain its own IP address" (§4.1.2).
- TAG "is a string of ABNF alphanumeric characters that MUST NOT exceed 32 characters. Any non-alphanumeric character will terminate the TAG field" (§4.1.3).
- A packet whose HEADER cannot be read: the receiver treats everything after the PRI as the message (§4.3).

Transports, read 2026-10-05: UDP port 514 (RFC 5426 §3.1); TCP with octet counting, "SYSLOG-FRAME = MSG-LEN SP SYSLOG-MSG", where "It can be assumed that octet-counting framing is used if a syslog frame starts with a digit", or non-transparent framing with a TRAILER that "most often is ASCII LF" (RFC 6587 §3.4.1 and §3.4.2); TLS on TCP port 6514 (RFC 5425 §4.1). A leading count or a trailing newline in the pasted text is read as that framing, and the declared count is checked against the message's actual octets.

## Limits

- One message at a time. A file of lines is for the reader's log pipeline; paste the line in question.
- The parser reads the message, not the network: it cannot know the transport the message came by, only the framing bytes it carries.
- The RFC 3164 form has no year and no zone in its timestamp; the parser says so rather than guessing them.
- Input is cut at 8,192 characters.

## Sources

- [RFC 5424, The Syslog Protocol, sections 6 to 7](https://www.rfc-editor.org/rfc/rfc5424#section-6) (read 2026-10-05)
- [RFC 3164, The BSD syslog Protocol, sections 4.1 to 4.3](https://www.rfc-editor.org/rfc/rfc3164#section-4.1) (read 2026-10-05)
- [RFC 5426, Transmission of Syslog Messages over UDP](https://www.rfc-editor.org/rfc/rfc5426#section-3.1) (read 2026-10-05)
- [RFC 5425, TLS Transport Mapping for Syslog, section 4.1](https://www.rfc-editor.org/rfc/rfc5425#section-4.1) (read 2026-10-05)
- [RFC 6587, Transmission of Syslog Messages over TCP, sections 3.4.1 and 3.4.2](https://www.rfc-editor.org/rfc/rfc6587#section-3.4.1) (read 2026-10-05)
