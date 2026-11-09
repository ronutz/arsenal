## Was das Tool tut

Das Tool wandelt ein Dokument in Ihrem Browser zwischen JSON und YAML um, in beide Richtungen. Aus JSON erzeugt es YAML im Blockstil, aus YAML erzeugt es JSON. Scheitert das Parsen, nennt der Fehler die genaue Zeile und Spalte, und geht bei einer Umwandlung unterwegs etwas verloren, erklärt ein Hinweis, was und warum.

## Die beiden Richtungen

- **JSON zu YAML.** Das JSON wird zuerst von demselben genauen, positionsverfolgenden Parser validiert, den der JSON-Formatierer verwendet; ein ungültiges Dokument wird daher mit Zeile, Spalte und Pfad als JSON Pointer abgelehnt statt mit einem vagen Fehlschlag. Die gültigen Daten werden dann als YAML im Blockstil geschrieben.
- **YAML zu JSON.** Das YAML wird nach einem JSON-kompatiblen Schema geparst und als JSON serialisiert. Anker und Aliase (der Wiederverwendungsmechanismus `&name` und `*name` von YAML) werden an Ort und Stelle aufgelöst, und Blockskalare (die mehrzeiligen Zeichenfolgenstile von YAML) werden zu gewöhnlichen JSON-Zeichenfolgen.

## Die Fallen beim Quoting, die das Tool abfängt

YAML ist bekannt dafür, ein bloßes Wort bereitwillig als etwas anderes als eine Zeichenfolge zu lesen, und genau dort gehen Hin- und Rückumwandlungen schief. Der bekannteste Fall ist das „Norwegen-Problem“: Das bloße Wort `NO` wird als boolescher Wert false gelesen, und dasselbe passiert mit `yes`, `on` und `off` sowie mit Werten wie `1.0` (eine Zahl, nicht die Zeichenfolge „1.0“) und `08` (kein gültiges Oktal). Beim Ausgeben von YAML setzt der Konverter diese Werte in Anführungszeichen, sodass das, was Sie als Zeichenfolge gemeint haben, eine Zeichenfolge bleibt.

## Was bei der Umwandlung verloren gehen kann

Manches gibt es nur im einen Format und nicht im anderen, daher weisen die Hinweise darauf hin:

- **Kommentare.** YAML hat Kommentare, JSON nicht; bei der Umwandlung von YAML in JSON entfallen Kommentare daher.
- **Anker und Aliase.** Sie werden zu ihrem vollständigen Wert aufgelöst; aus einem kompakten gemeinsamen Verweis im YAML der Quelle werden in der Ausgabe wiederholte Daten.

## Durchgerechnete Beispiele

- JSON `{"port":8080,"tls":true}` wird zu den YAML-Zeilen `port: 8080` und `tls: true`.
- YAML `country: NO` wird beim Einlesen zu JSON `{"country":"NO"}`, und wird das wieder als YAML ausgegeben, steht der Wert in Anführungszeichen, `country: "NO"`, damit er nicht für false gehalten wird.

## Verwendung

Fügen Sie JSON ein, um YAML zu erhalten, oder YAML, um JSON zu erhalten. Lesen Sie die Hinweise zur Umwandlung, wenn sie erscheinen: Sie sagen Ihnen, ob sich etwas, etwa ein Kommentar oder ein Anker, auf eine Weise geändert hat, die Sie kennen sollten. Für eine gegebene Eingabe ist die Umwandlung deterministisch.

## Ergebnisse teilen

Am Anfang der Auswertung (oder unter einem Parse-Fehler, der ebenfalls eine Antwort ist) erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Quelle so, wie eingefügt, die Richtung und die Einrückung. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Konfigurationen enthalten oft Passwörter, Schlüssel und interne Namen, daher bittet das Popover Sie, sie zu lesen, bevor Sie den Link senden. Der Text bleibt so, wie eingefügt: Die umgewandelte Ausgabe zeigt jeden Wert. Bevor ein Link angeboten wird, wird der Text nach Zugangsdaten durchsucht, die ein Standard definiert: ein privater Schlüssel im PEM-Format, eine Zeile `Authorization` oder `Proxy-Authorization` mit beliebigem Schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitte 11.6.2 und 11.7.2: Der Wert „consists of credentials“), eine Zeile `Cookie` oder `Set-Cookie` mit Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitte 4.1.1 und 4.2.1), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1, nennt die Form „user:password“ veraltet: „is deprecated“), eine AWS-Zugriffsschlüssel-ID oder ein `ENC`-Wert von FortiOS; alle abgerufen am 01.11.2026. Ist einer davon enthalten, gibt es keinen Link: Das Popover nennt die Zeile, und Sie ersetzen den Wert durch einen Platzhalter und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur wie ein Secret aussieht (ein Schlüssel `password:` oder `apiKey`), verhindert den Link nicht; das Popover nennt den ersten davon, damit Sie ihn prüfen können. Fünf Namen von Einträgen und Schlüsseln gelten hier als Zugangsdaten, weil ein Standard festlegt, was sie enthalten: `access_token` und `refresh_token` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), Abschnitte 1.4, 1.5 und 5.1: „Access tokens are credentials used to access protected resources“), `id_token` ([OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), Abschnitt 3.1.3.3), `client_secret` ([RFC 7591](https://www.rfc-editor.org/rfc/rfc7591), Abschnitt 3.2.1) und `registration_access_token` ([RFC 7592](https://www.rfc-editor.org/rfc/rfc7592), Abschnitt 3); alle abgerufen am 01.11.2026. Hat einer davon einen Wert, gibt es keinen Link, wie beim OIDC-Decoder.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` steht, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Der Text füllt das Feld, die Einstellungen werden so gesetzt, wie Sie sie setzen würden, und die Seite wandelt ihn um. Eine unbekannte Einstellung führt dazu, dass der Link ignoriert wird. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
