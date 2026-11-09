## Was das Tool tut

Fügen Sie XML ein, und das Tool parst es in eine lesbare Struktur: die XML-Deklaration, den DOCTYPE mit allen Entitäten, die er deklariert, und den vollständigen Elementbaum mit seinen Namespaces und Attributen, dazu CDATA, Kommentare und Verarbeitungsanweisungen. Es prüft, ob das Dokument wohlgeformt ist, und führt eine Sicherheitsanalyse der XML-Angriffsfläche durch. Es ruft nichts ab und löst nichts auf.

## Was das Tool zeigt

XML packt mehrere Arten von Knoten in ein Dokument, und das Tool trennt sie: die **Deklaration** mit Version und Kodierung; den **DOCTYPE** und alle **Entitäten**, die er definiert; den **Elementbaum** mit **Namespaces** (den `xmlns`-Bindungen) und **Attributen** pro Element; und die **CDATA**-Abschnitte, **Kommentare** und **Verarbeitungsanweisungen**. Es prüft außerdem die Wohlgeformtheit im Sinne von XML: dass jedes Tag sein Gegenstück hat und dass das Dokument genau ein Wurzelelement besitzt.

## Die Angriffsfläche von XML

XML ist auf eine Weise mächtig, die es gefährlich macht, wenn es aus einer nicht vertrauenswürdigen Quelle stammt, und die Sicherheitsanalyse des Tools markiert genau die Stellen, an denen diese Gefahr steckt:

- **Überhaupt ein DOCTYPE**, denn erst die Dokumenttypdefinition ermöglicht alles Weitere;
- **Externe Entitäten**, die eine lokale Datei oder eine URL einbinden können und der Mechanismus von XXE-Angriffen (XML External Entity) sind;
- **Parameter-Entitäten**, eine Form, mit der XXE an naiven Abwehrmaßnahmen vorbeigeschmuggelt wird; und
- **Entity-Expansion**, die Verschachtelung hinter dem Denial-of-Service-Angriff Billion Laughs.

Genau darum geht es, wenn diese Punkte benannt werden: Sie sehen, ob ein bestimmtes Dokument etwas versucht, das ein reines Datendokument nie tun würde.

## Konstruktionsbedingt sicher

Das Tool ist ein Text-Tokenizer, kein XML-Prozessor. Es liest das Dokument als Text und beschreibt seine Struktur; es löst nie eine Entität auf, öffnet nie einen externen Verweis und expandiert nie etwas. Deshalb kann es feindseliges XML sicher analysieren: Genau die Funktionen, vor denen es warnt, werden beschrieben, nicht ausgeführt. Es ist das allgemeine Gegenstück zum SAML-Decoder, der eine DTD vollständig ablehnt, weil eine SAML-Nachricht legitimerweise nie eine enthält.

## Verwendung

Fügen Sie ein XML-Dokument ein und lesen Sie Deklaration, DOCTYPE und Entitäten, den Elementbaum und die Sicherheitsmarkierungen ab. Das Parsen ist deterministisch und lokal, daher können Sie XML aus jeder Quelle gefahrlos untersuchen.

Für jede Wohlgeformtheitsregel von XML 1.0 mit Zeile und Spalte des ersten Fehlers und um ein Dokument lesbar zu formatieren oder zu minimieren, verwenden Sie den [XML-Formatierer und -Validator](/tools/xml-formatter).

## Ergebnisse teilen

Unter der Bewertung der Wohlgeformtheit erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen und sobald die Seite das Dokument als XML gelesen hat. Der Link enthält nach dem `#` das Dokument so, wie eingefügt. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. XML kann interne Hosts und Personen nennen, daher bittet das Popover Sie, es zu lesen, bevor Sie den Link senden. Bevor ein Link angeboten wird, wird der Text nach Zugangsdaten durchsucht, die ein Standard definiert: ein privater Schlüssel im PEM-Format, eine Zeile `Authorization` oder `Proxy-Authorization` mit beliebigem Schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitte 11.6.2 und 11.7.2: Der Wert „consists of credentials“), eine Zeile `Cookie` oder `Set-Cookie` mit einem Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitte 4.1.1, 4.2.1 und 8.4, wonach ein Cookie üblicherweise eine Session-ID enthält), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1), eine AWS-Zugriffsschlüssel-ID oder ein `ENC`-Wert von FortiOS; alle abgerufen am 01.11.2026. Findet sich eines davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie setzen einen Platzhalter an seine Stelle und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur nach einem Secret aussieht (ein JSON-Member `token`, ein `password=` in der Query einer URL), blockiert den Link nicht; das Popover nennt den ersten solchen Wert, damit Sie ihn prüfen können. Zwei weitere Stellen gelten hier als Zugangsdaten: das `Password` eines `UsernameToken` von WS-Security ([OASIS UsernameToken Profile 1.1.1](https://docs.oasis-open.org/wss-m/wss/v1.1.1/os/wss-UsernameTokenProfile-v1.1.1-os.html), abgerufen am 01.11.2026: Es „provides password information (or equivalent such as a hash)“) und eine signierte oder verschlüsselte SAML-Assertion, wie im SAML-Decoder. Ein Element oder Attribut, dessen Name nach einem Secret aussieht (`password`, `apiKey`, `client_secret`), wird stattdessen im Popover genannt.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Das Dokument füllt das Feld wie beim Einfügen, und die Seite liest es lokal: Keine Entität wird aufgelöst, und nichts wird abgerufen. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
