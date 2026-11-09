## Was das Tool tut

Dies ist ein Codec in beide Richtungen für fünf Textkodierungen. Geben Sie Text ein, erhalten Sie gleichzeitig die Formen in Base64, URL-sicherem Base64, Base32, hexadezimal und in Prozentkodierung; geben Sie eine kodierte Zeichenfolge ein, wird sie zurück in Text dekodiert. Die Dekodierung ist tolerant: Fehlendes Padding und verstreuter Whitespace werden akzeptiert, und ist ein dekodierter Bytestrom kein gültiger UTF-8-Text, wird das Ergebnis als binär gekennzeichnet, statt als kaputte Zeichen angezeigt zu werden. Alles läuft in Ihrem Browser; nichts wird hochgeladen.

## Die fünf Kodierungen

Alle fünf bilden Text (als Bytes) auf eine ASCII-sichere Darstellung ab und zurück, jede nach einem Standard:

- **Base64** (RFC 4648, Abschnitt 4) verwendet das Alphabet `A-Z a-z 0-9 + /` und füllt mit `=` auf. Es vergrößert die Daten um etwa ein Drittel und ist die Kodierung hinter den Zugangsdaten von HTTP Basic, `base64(user:password)`, definiert in RFC 7617.
- **URL-sicheres Base64** (RFC 4648, Abschnitt 5) ersetzt `+` und `/` durch `-` und `_` und lässt das Padding mit `=` meist weg, sodass die Zeichenfolge in URLs und Dateinamen sicher ist. Jedes Segment eines JWT verwendet diese Kodierung.
- **Base32** (RFC 4648, Abschnitt 6) verwendet `A-Z 2-7` und füllt mit `=` auf. Es unterscheidet nicht zwischen Groß- und Kleinschreibung und vermeidet leicht verwechselbare Zeichen; deshalb taucht es etwa in TOTP-Secrets auf.
- **Hexadezimal (Base16)** (RFC 4648, Abschnitt 8) verwendet `0-9 A-F`, zwei Zeichen pro Byte.
- **Prozentkodierung** (RFC 3986, Abschnitt 2) lässt die nicht reservierten Zeichen (`A-Z a-z 0-9 - . _ ~`) unverändert und kodiert jedes andere Byte als `%XX`. Das ist die URL-Kodierung.

## Padding, Whitespace und binäre Ergebnisse

Base64 und Base32 werden normalerweise mit `=` auf eine ganze Zahl von Blöcken aufgefüllt, doch in der Praxis kommen Zeichenfolgen oft ohne Padding oder mit eingefügten Zeilenumbrüchen an; der Decoder akzeptiert daher beides. Dekodieren Sie einen Wert, dessen Bytes keinen gültigen UTF-8-Text ergeben (ein komprimierter Blob, ein Bild, ein roher Schlüssel), meldet das Tool, dass das Ergebnis binär ist, statt es als kaputten Text darzustellen. So wissen Sie, dass die Dekodierung funktioniert hat, auch wenn der Inhalt nicht für Menschen lesbar ist.

## Durchgerechnete Beispiele

- Der Text `hello` wird zu Base64 `aGVsbG8=`, URL-sicherem Base64 `aGVsbG8`, Base32 `NBSWY3DP`, Hex `68656c6c6f` und in Prozentkodierung zu `hello` (alle seine Zeichen sind nicht reserviert).
- Der Base64-Wert `dXNlcjpwYXNz`, typische Zugangsdaten für HTTP Basic, wird zu `user:pass` dekodiert.

## Verwendung

Geben Sie Text ein, um alle fünf Kodierungen nebeneinander zu sehen, oder fügen Sie einen kodierten Wert ein, um ihn zu dekodieren. Da der Codec eine reine Funktion seiner Eingabe ist, ergibt derselbe Text immer dieselbe Ausgabe.

## Ergebnisse teilen

Unter der Ausgabe erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Text im Feld so, wie eingegeben, dazu Richtung, Codec und Anzahl der Schichten, sofern sie von den Standardwerten (Kodieren, Base64, eine Schicht) abweichen: `/tools/base64#text=dXNlcjpwYXNz&direction=decode`. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Kodierter Text verbirgt oft Zugangsdaten: HTTP Basic sendet `user:password` in Base64 ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), Abschnitt 2, abgerufen am 27.10.2026). Deshalb ergänzt das Popover einen eigenen Warnhinweis dieses Tools, bevor Sie etwas kopieren. Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Text beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Richtung, Codec und Schichten werden gesetzt, und der Text füllt das Feld wie beim Einfügen; die Seite berechnet jede Kodierung wie gewohnt. Eine Richtung oder ein Codec, den die Seite nicht anbietet, oder Schichten außerhalb von 1 bis 3 führen dazu, dass der ganze Link ignoriert wird. In beiden Fällen verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
- **Links von anderen Seiten.** Ein Wert, der als `#input=` übergeben wird, füllt das Feld weiterhin genau wie bisher. „Ergebnisse teilen“ verwendet eigene Namen (`text`, `direction`, `codec`, `layers`), sodass sich beides nie vermischt.
