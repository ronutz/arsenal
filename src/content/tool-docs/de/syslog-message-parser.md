## Was das Tool tut

Das Tool liest eine Syslog-Meldung so, wie sie empfangen wurde, oder einen TCP-Frame, der eine Meldung enthält, und benennt jedes Feld in der Reihenfolge, in der der zugehörige RFC die Felder nennt. Zwei Grammatiken werden versucht: die Meldung nach RFC 5424 (PRI, VERSION, TIMESTAMP, HOSTNAME, APP-NAME, PROCID, MSGID, STRUCTURED-DATA, MSG) und die BSD-Form, die RFC 3164 beschreibt (PRI, TIMESTAMP, HOSTNAME, TAG, CONTENT). Der PRI-Wert wird über dieselben Tabellen in Facility und Schweregrad aufgeschlüsselt, die der [Syslog-PRI-Decoder und -Encoder](/tools/syslog-pri-decoder) verwendet. Alles, was nicht konform ist, wird mit dem Wortlaut des RFC selbst markiert, und die strukturierten Daten werden Element für Element aufgeschlüsselt, mit Erklärung der bei der IANA registrierten Parameter. Es wird nichts gesendet.

## Was das Tool prüft und woher jede Regel stammt

RFC 5424 (März 2009), abgerufen am 05.10.2026:

- Der PRI-Wert: `<` PRIVAL `>`, PRIVAL = Facility × 8 + Severity, drei bis fünf Zeichen; „The only time a value of 0 follows the < is for the Priority value of 0. Otherwise, leading 0s MUST NOT be used“ (§6.2.1). Oberhalb von 191 gibt es keine Facility.
- VERSION: eine Ziffer ungleich null, gefolgt von bis zu zwei Ziffern; „This document uses a VERSION value of 1“ (§6.2.2).
- TIMESTAMP: „a formalized timestamp derived from RFC 3339“; „The T and Z characters in this syntax MUST be upper case“; „Leap seconds MUST NOT be used“; TIME-SECFRAC ist ein Punkt mit einer bis sechs Ziffern; oder der NILVALUE (§6.2.3 und §6).
- HOSTNAME 1 bis 255, APP-NAME 1 bis 48, PROCID 1 bis 128, MSGID 1 bis 32 druckbare US-ASCII-Zeichen oder der NILVALUE (§6).
- STRUCTURED-DATA: `[` SD-ID *(SP SD-PARAM) `]`, die Elemente direkt aneinander; eine SD-ID hat höchstens 32 Zeichen; „The same SD-ID MUST NOT exist more than once in a message“; registrierte Namen enthalten kein At-Zeichen, private Namen enthalten eines und eine Enterprise-Nummer; innerhalb eines PARAM-VALUE werden die Zeichen `"`, `\` und `]` durch einen vorangestellten Backslash maskiert (§6.3). Die SD-IDs der IANA aus §7 sind timeQuality (tzKnown, isSynced, syncAccuracy), origin (ip, enterpriseId, software, swVersion) und meta (sequenceId, sysUpTime, language); ein Parameter außerhalb dieser Listen unter einer dieser IDs wird markiert.
- MSG: „If a syslog application encodes MSG in UTF-8, the string MUST start with the Unicode byte order mask (BOM)“ (§6.4); Nicht-ASCII-Text ohne BOM hat eine unbekannte Kodierung und wird markiert.
- Länge: „Any transport receiver MUST be able to accept messages of up to and including 480 octets in length. All transport receiver implementations SHOULD be able to accept messages of up to and including 2048 octets in length“ (§6.1).

RFC 3164 (August 2001), abgerufen am 05.10.2026:

- Das Paket: „MUST be 1024 bytes or less“ (§4.1).
- TIMESTAMP „Mmm dd hh:mm:ss“ in Ortszeit, der Monat eine der zwölf englischen Abkürzungen, und „If the day of the month is less than 10, then it MUST be represented as a space and then the number“ (§4.1.2).
- HOSTNAME „will contain the hostname, as it knows itself. If it does not have a hostname, then it will contain its own IP address“ (§4.1.2).
- TAG „is a string of ABNF alphanumeric characters that MUST NOT exceed 32 characters. Any non-alphanumeric character will terminate the TAG field“ (§4.1.3).
- Ein Paket, dessen HEADER sich nicht lesen lässt: Der Empfänger behandelt alles nach dem PRI-Wert als Meldung (§4.3).

Transportwege, abgerufen am 05.10.2026: UDP-Port 514 (RFC 5426 §3.1); TCP mit Octet Counting, „SYSLOG-FRAME = MSG-LEN SP SYSLOG-MSG“, wobei „It can be assumed that octet-counting framing is used if a syslog frame starts with a digit“, oder Non-Transparent-Framing mit einem TRAILER, der „most often is ASCII LF“ (RFC 6587 §3.4.1 und §3.4.2); TLS auf TCP-Port 6514 (RFC 5425 §4.1). Eine vorangestellte Zahl oder ein abschließender Zeilenumbruch im eingefügten Text wird als dieses Framing gelesen, und die angegebene Zahl wird mit den tatsächlichen Oktetten der Meldung abgeglichen.

## Grenzen

- Eine Meldung auf einmal. Eine Datei voller Zeilen ist Sache Ihrer Log-Pipeline; fügen Sie die fragliche Zeile ein.
- Der Parser liest die Meldung, nicht das Netzwerk: Er kann nicht wissen, über welchen Transportweg die Meldung kam, nur welche Framing-Bytes sie enthält.
- Die Form nach RFC 3164 hat in ihrem Zeitstempel kein Jahr und keine Zeitzone; der Parser sagt das, statt beides zu erraten.
- Die Eingabe wird bei 8.192 Zeichen abgeschnitten.

## Ergebnisse teilen

Unter der Bewertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält die Meldung so, wie eingefügt (`#input=...`), und sonst nichts. Bevor Sie etwas kopieren, fügt das Popover einen Warnhinweis hinzu: Eine Log-Meldung kann Hosts, Benutzer und Adressen nennen; lesen Sie sie daher, bevor Sie den Link senden. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der Inhalt länger, gibt es keinen Link, und das Popover nennt die Länge, die er hätte.
- **Öffnen eines Links.** Der Text ersetzt den Inhalt des Feldes (die Seite öffnet sich mit dem „Beispiel“) wie beim Einfügen, und die Seite liest ihn erneut. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.

## Quellen

- [RFC 5424, The Syslog Protocol, Abschnitte 6 bis 7](https://www.rfc-editor.org/rfc/rfc5424.html#section-6) (abgerufen am 05.10.2026)
- [RFC 3164, The BSD syslog Protocol, Abschnitte 4.1 bis 4.3](https://www.rfc-editor.org/rfc/rfc3164.html#section-4.1) (abgerufen am 05.10.2026)
- [RFC 5426, Transmission of Syslog Messages over UDP](https://www.rfc-editor.org/rfc/rfc5426.html#section-3.1) (abgerufen am 05.10.2026)
- [RFC 5425, TLS Transport Mapping for Syslog, Abschnitt 4.1](https://www.rfc-editor.org/rfc/rfc5425.html#section-4.1) (abgerufen am 05.10.2026)
- [RFC 6587, Transmission of Syslog Messages over TCP, Abschnitte 3.4.1 und 3.4.2](https://www.rfc-editor.org/rfc/rfc6587.html#section-3.4.1) (abgerufen am 05.10.2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
