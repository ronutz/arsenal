## Was das Tool tut

Fügen Sie JSON ein, und das Tool validiert es und gibt es dann lesbar formatiert, minimiert oder sortiert aus. Was es von einem einfachen `JSON.parse` unterscheidet, ist das, was es Ihnen sagt, wenn etwas falsch oder ungewöhnlich ist: Ein Parse-Fehler nennt die genaue Zeile, Spalte und den Pfad zum Problem; wiederholte Objektschlüssel werden markiert; und sehr große oder sehr genaue Zahlen bleiben exakt erhalten, statt gerundet zu werden. Alles läuft in Ihrem Browser.

## Ein Parser für die Diagnose

Die Engine ist ein handgeschriebener Parser, der beim Lesen die Position mitverfolgt, statt sich auf das eingebaute Parsen der JavaScript-Laufzeit zu verlassen. Das bringt drei Dinge, die in der Praxis zählen:

- **Genaue Fehler.** Scheitert das Parsen, erhalten Sie die Zeile, die Spalte, den Byte-Offset, eine verständliche Meldung und den Pfad zur Stelle als JSON Pointer (RFC 6901), statt eines einzelnen, von der Engine abhängigen `SyntaxError` ohne Pfad.
- **Erkennung doppelter Schlüssel.** Die JSON-Grammatik erlaubt einem Objekt formal, einen Schlüssel zu wiederholen, und `JSON.parse` behält stillschweigend nur den letzten. Dieses stille Verhalten verdeckt echte Fehler, daher meldet diese Engine jedes gefundene Duplikat mit seinem Pfad.
- **Exakte große Zahlen.** JSON-Zahlen haben keine Größengrenze, doch eine JavaScript-Zahl ist eine 64-Bit-Gleitkommazahl und verliert oberhalb von 2^53 an Genauigkeit. Der Formatierer bewahrt die Ziffern, die Sie geschrieben haben, sodass eine 20-stellige ID oder eine Dezimalzahl mit hoher Genauigkeit nicht stillschweigend gerundet wird.

## Formatieren, minimieren und sortieren

Ist das JSON gültig, können Sie es mit einheitlicher Einrückung lesbar formatieren, auf die kleinste einzeilige Form minimieren oder die Objektschlüssel sortieren, sodass zwei Dokumente, die sich nur in der Reihenfolge der Schlüssel unterscheiden, für einen Vergleich übereinanderliegen. Sortiert wird nach Schlüsseln; Arrays werden nicht umgeordnet, denn ihre Reihenfolge ist in JSON bedeutsam.

## Durchgerechnete Beispiele

- `{"b":1,"a":2}` wird nach Schlüsseln sortiert zu `{"a":2,"b":1}`.
- `{ "a": 1 }` wird minimiert zu `{"a":1}`, ohne Whitespace.
- `{"id":10000000000000001}` behält alle seine Ziffern, während ein Umweg über eine 64-Bit-Gleitkommazahl daraus `10000000000000000` machen würde.
- `{"a":1,"a":2}` wird wegen des doppelten Schlüssels `a` markiert; ein Standard-Parser würde stillschweigend `2` behalten.

## Verwendung

Fügen Sie ein JSON-Dokument ein und wählen Sie, ob es formatiert, minimiert oder sortiert werden soll. Lässt es sich nicht parsen, zeigt der Fehler auf die genaue Stelle; lässt es sich parsen, enthält aber doppelte Schlüssel oder übergroße Zahlen, wird darauf hingewiesen. Das Tool ist eine reine Funktion seiner Eingabe, daher ergibt dasselbe Dokument immer dasselbe Ergebnis.

Für XML erledigt der [XML-Formatierer und -Validator](/tools/xml-formatter) dieselbe Aufgabe: eine Prüfung auf Wohlgeformtheit, die Zeile und Spalte nennt, dann lesbare Formatierung oder Minimierung.

## Ergebnisse teilen

Am Anfang der Auswertung (oder unter einem Parse-Fehler, der ebenfalls eine Auswertung ist) erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das JSON so, wie eingefügt, und die drei Einstellungen (lesbar oder minimiert, die Einrückung, sortierte Schlüssel). Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. JSON enthält oft Passwörter, Schlüssel und interne Namen, daher bittet das Popover Sie, es zu lesen, bevor Sie den Link senden. Der Text bleibt so, wie eingefügt: Die formatierte Ausgabe zeigt jeden Wert, daher lässt sich nichts ersetzen, ohne zu ändern, was die lesende Person sieht. Bevor ein Link angeboten wird, wird der Text nach Zugangsdaten durchsucht, die ein Standard definiert: ein privater Schlüssel im PEM-Format, eine Zeile `Authorization` oder `Proxy-Authorization` mit beliebigem Schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitte 11.6.2 und 11.7.2: Der Wert „consists of credentials“), eine Zeile `Cookie` oder `Set-Cookie` mit Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitte 4.1.1 und 4.2.1), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1, nennt die Form „user:password“ veraltet: „is deprecated“), eine AWS-Zugriffsschlüssel-ID oder ein `ENC`-Wert von FortiOS; alle abgerufen am 01.11.2026. Ist einer davon enthalten, gibt es keinen Link: Das Popover nennt die Zeile, und Sie ersetzen den Wert durch einen Platzhalter und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur wie ein Secret aussieht (ein Eintrag `password` oder `apiKey`), verhindert den Link nicht; das Popover nennt den ersten davon, damit Sie ihn prüfen können. Fünf Namen von Einträgen gelten hier als Zugangsdaten, weil ein Standard festlegt, was sie enthalten: `access_token` und `refresh_token` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), Abschnitte 1.4, 1.5 und 5.1: „Access tokens are credentials used to access protected resources“), `id_token` ([OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), Abschnitt 3.1.3.3), `client_secret` ([RFC 7591](https://www.rfc-editor.org/rfc/rfc7591), Abschnitt 3.2.1) und `registration_access_token` ([RFC 7592](https://www.rfc-editor.org/rfc/rfc7592), Abschnitt 3); alle abgerufen am 01.11.2026. Hat einer davon einen Wert, gibt es keinen Link, wie beim OIDC-Decoder.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` steht, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Der Text füllt das Feld, die Einstellungen werden so gesetzt, wie Sie sie setzen würden, und die Seite formatiert ihn. Eine unbekannte Einstellung führt dazu, dass der Link ignoriert wird. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
