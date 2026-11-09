## Was das Tool tut

Fügen Sie eine `location`, ihr `proxy_pass` und eine Anfrage-URI ein. Das Tool berechnet, was das Backend tatsächlich erhält, und zeigt **dieselbe Konfiguration mit umgekehrtem abschließendem Schrägstrich**, damit der Unterschied sichtbar wird, statt nur beschrieben.

## Die Regel

`proxy_pass http://backend;` hat **keinen URI-Teil**, daher wird die ursprüngliche Anfrage-URI unverändert weitergereicht, samt Location-Präfix. `proxy_pass http://backend/;` **hat** einen URI-Teil, und auch dieser einzelne Schrägstrich zählt; der Teil der Anfrage, der auf das Location-Präfix passt, wird daher durch ihn **ersetzt**.

Mit `location /app/` und einer Anfrage nach `/app/page` sendet die erste Form `/app/page`, die zweite `/page`, und `proxy_pass http://backend/v2/;` sendet `/v2/page`.

Was Sie wollen, hängt vom Backend ab. Eine Anwendung, die unter demselben Pfad eingehängt ist, braucht das Präfix; eine, die nicht weiß, dass sie hinter einem Präfix sitzt, braucht es entfernt. Eine falsche Wahl erzeugt ein 404 vom Backend für eine Anfrage, die der Proxy einwandfrei behandelt hat.

## Der doppelte Schrägstrich ist echt

Eine Location ohne abschließenden Schrägstrich plus ein URI-Teil sendet tatsächlich einen doppelten Schrägstrich an den Upstream: `location /app` mit `proxy_pass http://backend/` macht aus `/app/page` den Pfad `//page`. Das Tool bildet das nach, statt es zu bereinigen, denn eine schönere Antwort als die von NGINX würde genau den Fehler verdecken, den Sie hier suchen.

## Was das Tool ablehnt

Locations mit regulärem Ausdruck und benannte Locations dürfen keinen URI-Teil haben: Es gibt kein wörtliches Präfix, das ersetzt werden könnte, daher lehnt NGINX die Konfiguration beim Start ab. Das Tool meldet das, statt ein Ergebnis zu erfinden.

## Die Ausnahme mit Variablen

Eine Variable irgendwo im Wert setzt die Ersetzung des Präfixes ganz aus und verlegt die Namensauflösung des Upstreams auf den Zeitpunkt der Anfrage; das erfordert meist einen `resolver` und macht aus einem Namensfehler einen Laufzeitfehler statt eines Fehlers, den `nginx -t` erkennen würde.

## Ehrliche Grenzen

Kein `rewrite`, kein `try_files` und keine internen Weiterleitungen: Das Tool beantwortet, welchen Pfad das Backend erhält, nicht, was mit der ganzen Anfrage geschieht. Upstream-Blöcke werden nicht in Server aufgelöst, und Query-Strings laufen ohne Modellierung durch.

## Ergebnisse teilen

Unter dem Ergebnis erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen und sobald die Seite ein Ergebnis hat. Der Link enthält nach dem `#` das Feld so, wie eingegeben. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Der Wert von proxy_pass nennt ein Backend, einen Hostnamen oder eine Adresse, die meist intern ist, und die Seite zeigt ihn im umgekehrten Gegenstück erneut, daher wird nichts herausgeschnitten: Das Popover bittet Sie, ihn zu prüfen. Bevor ein Link angeboten wird, wird das Feld nach Zugangsdaten durchsucht, die ein Standard definiert: ein privater Schlüssel im PEM-Format, eine `Authorization`- oder `Proxy-Authorization`-Zeile mit beliebigem Schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitte 11.6.2 und 11.7.2: Der Wert „consists of credentials“), eine `Cookie`- oder `Set-Cookie`-Zeile mit einem Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitt 8.4: Server „commonly store a nonce (or "session identifier") in a cookie“), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1), eine AWS-Zugriffsschlüssel-ID oder ein `ENC`-Wert von FortiOS; alle abgerufen am 01.11.2026. Enthält das Feld einen davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie ersetzen den Wert durch einen Platzhalter und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur wie ein Secret aussieht (ein JSON-Eintrag `token`, ein `token=` in einer Query), blockiert den Link nicht; das Popover nennt den ersten, damit Sie ihn prüfen können.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Das Feld füllt sich wie beim Einfügen, und die Seite berechnet den Pfad (der Upstream wird nie aufgelöst oder kontaktiert). Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
