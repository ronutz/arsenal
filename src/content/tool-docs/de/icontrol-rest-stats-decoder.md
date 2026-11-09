## Was das Tool tut

Fügen Sie eine Statistikantwort von iControl REST ein, und das Tool flacht sie zu einer Zeile pro Statistik ab. Es entpackt die Hüllen `entries`, `nestedStats`, `value` und `description`, kürzt die URL-Schlüssel auf die Objekte, die sie benennen, und gruppiert das Ergebnis nach Objekt. Eine rein lokale Umwandlung: Es wird nichts abgerufen, und nichts verlässt den Browser.

## Warum die Antwort abgeflacht werden muss

Eine Statistik-Payload von BIG-IP verpackt jedes Blatt in `value` oder `description`, jede Ebene in `entries` und `nestedStats`, und verwendet als Schlüssel des äußeren Objekts eine vollständige URL. Drei Hüllen um eine einzige Zahl. Die Struktur ist eher selbstbeschreibend als abwegig, aber auf einen Blick nicht lesbar, und ein Pool mit seinen Membern kann vier Ebenen tief verschachtelt sein.

## Die Aufteilung in 64 Bit, der Teil, auf den es ankommt

F5 teilt große Zähler in die Hälften `.high` und `.low` auf, weil JSON-Zahlen eine 64-Bit-Ganzzahl nicht sicher darstellen können. `serverside.bitsIn.high = 3` und `serverside.bitsIn.low = 1000000` sind **nicht zwei Statistiken**: Sie sind ein einziger Zähler, dessen Wert `(high << 32) + low` ist, also 12.885.901.888.

**Das Tool setzt sie zusammen und kennzeichnet die zusammengesetzten Werte**, sodass Sie die Rechnung prüfen können, statt ihr zu vertrauen. Ein Abflacher, der die Hälften getrennt ausgibt, meldet Ihre meistgenutzten Zähler stillschweigend zu niedrig.

## Summen, keine Raten

Jeder Zähler ist eine Summe seit dem letzten Zurücksetzen, und die Payload enthält kein Intervall. **Aus einer einzelnen Stichprobe lässt sich keine Rate ableiten.** Das Tool weist bei jeder Dekodierung darauf hin, denn einen Zähler statt seiner Ableitung zu plotten ist ein bewährter Weg zu einem Dashboard, das ewig steigt.

## Was das Tool nicht tut

Es interpretiert die Statistiken nicht und kennt Ihr Abfrageintervall nicht. Eine Konfigurationsantwort lehnt es mit einer klaren Meldung ab, statt eine leere Ausgabe zu erzeugen, denn das Fehlen eines `entries`-Objekts ist das verlässliche Erkennungszeichen.

## Ergebnisse teilen

Unter dem abgeflachten Text erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Statistikantwort so, wie eingefügt. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Eine Statistikantwort enthält Zähler und die Objekte, zu denen sie gehören, keine Zugangsdaten: iControl REST überträgt das Token im Header `X-F5-Auth-Token` der Anfrage ([Leitfaden zu AS3 von F5, Authentication and Authorization](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/userguide/authentication.html), abgerufen am 27.10.2026). Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird die Antwort beim Öffnen des Links nicht an den Server gesendet. Sie bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; die Statistik einer Collection kann darüber hinausgehen, und dann nennt das Popover die Länge des geteilten Inhalts, statt einen Link anzubieten.
- **Öffnen eines Links.** Das JSON füllt das Feld wie beim Einfügen, und die Seite flacht es ab. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
