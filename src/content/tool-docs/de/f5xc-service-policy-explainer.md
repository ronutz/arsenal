## Was das Tool tut

Fügen Sie eine `service_policy` von F5XC (F5 Distributed Cloud) als JSON ein, und das Tool legt genau dar, wie sie abgleicht: für welchen Server-Geltungsbereich sie gilt, in welcher Reihenfolge ihre Regeln ausgewertet werden und für jede Regel deren Aktion und die Bedingungen, die erfüllt sein müssen. Es liest die Richtliniendefinition vollständig in Ihrem Browser und wertet nichts gegen echten Datenverkehr aus.

## Was eine Service Policy ist

Auf der Plattform F5 Distributed Cloud entscheidet eine Service Policy, welche Anfragen einen Load-Balancer erreichen und welche abgewiesen werden; sie ist das Gegenstück der Plattform zur Abgleichlogik für Anfragen, die Sie auf einem klassischen BIG-IP als iRule schreiben würden. Eine Richtlinie hat einen **Server-Geltungsbereich**, der festlegt, für welche Server sie gilt, eine **Behandlung**, die das Standardverhalten bestimmt, und eine geordnete **Regelliste**. Die Reihenfolge zählt: Die Regeln werden nacheinander ausgewertet, und die erste passende entscheidet über das Ergebnis; wer sie von oben nach unten liest, versteht, was die Richtlinie tatsächlich tut.

## Wie eine Regel zutrifft

Jede Regel verbindet eine **Aktion**, etwa Zulassen oder Ablehnen, mit einer Menge von Bedingungen, die alle erfüllt sein müssen, damit die Regel greift. Das Tool stellt jede Bedingung so dar, wie das Schema sie definiert:

- den **Matcher** und was er prüft (eine Quelle, einen Header, einen Pfad usw.);
- seine **Kriterien**, also ob er nach exaktem Wert, nach regulärem Ausdruck oder nach Präfix abgleicht;
- die **Und/Oder-Logik**, die mehrere Werte verknüpft;
- eine etwaige **Invertierung**, bei der der Treffer negiert wird; und
- die Beachtung der **Groß-/Kleinschreibung** beim Vergleich.

Diese Punkte verständlich darzustellen ist der eigentliche Nutzen: Eine Service Policy ist als rohes JSON schwer zu lesen, und ein einziger falsch gelesener Matcher oder eine invertierte Bedingung ist genau das, was den falschen Datenverkehr zulässt oder blockiert.

## Grundlage: das Schema

Die Feldnamen und Strukturen, die das Tool versteht, folgen dem offiziellen OpenAPI-Schema von F5 Distributed Cloud für die Service Policy und ihre Regeln; die Dekodierung bildet daher das echte Objekt ab und keine Vermutung. Das Tool arbeitet lokal und ohne ausgehenden Datenverkehr: Es parst und erklärt das eingefügte JSON, kontaktiert nie die Plattform und testet die Richtlinie nie gegen echte Anfragen. Fehlerhafte Eingaben werden gemeldet, statt eine Ausnahme auszulösen.

## Verwendung

Fügen Sie eine `service_policy`-Spezifikation als JSON ein und lesen Sie den Server-Geltungsbereich, die geordneten Regeln sowie Aktion und Bedingungen jeder Regel. Die Dekodierung ist deterministisch und lokal.

## Ergebnisse teilen

Unter dem Überblick erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen und sobald die Seite die Richtlinie erkennt. Der Link enthält nach dem `#` die Richtlinie so, wie eingefügt. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Eine Richtlinie kann interne Hosts, Adressbereiche, ASNs sowie Header- und Cookie-Namen nennen: Das Popover bittet Sie, sie zu prüfen. Die Seite stellt jeden Matcher mit seinen Werten dar, daher lässt sich nichts herausschneiden, ohne die Auswertung zu ändern; stattdessen blockieren Zugangsdaten den Link. Bevor ein Link angeboten wird, wird die Richtlinie nach Zugangsdaten durchsucht, die ein Standard definiert: ein privater Schlüssel im PEM-Format, eine Zeile `Authorization` oder `Proxy-Authorization` mit beliebigem Schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitte 11.6.2 und 11.7.2: Der Wert „consists of credentials“), eine Zeile `Cookie` oder `Set-Cookie` mit einem Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitt 8.4: Server „commonly store a nonce (or "session identifier") in a cookie“), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1), eine AWS-Zugriffsschlüssel-ID oder ein `ENC`-Wert von FortiOS, dazu zwei Dinge, die das Schema von F5 Distributed Cloud selbst definiert: ein Secret vom Typ SecretType, also eine URL in `clear_secret_info` oder ein Ort in `blindfold_secret_info` (die [XC-API-Referenz](https://docs.cloud.f5.com/docs-v2/api/views-http-loadbalancer): „SecretType is used in an object to indicate a sensitive/confidential field“), und ein Matcher für den Header `Authorization` mit literalem Wert; alle abgerufen am 01.11.2026. Findet sich eines davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie setzen einen Platzhalter an seine Stelle und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur nach einem Secret aussieht (ein JSON-Member `token`, ein `token=` in einer Query, ein Matcher für `X-Api-Key` oder ein Cookie), blockiert den Link nicht; das Popover nennt den ersten solchen Wert, damit Sie ihn prüfen können.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Richtlinie füllt das Feld wie beim Einfügen, und die Seite liest sie (dekodiert, nie ausgewertet). Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
