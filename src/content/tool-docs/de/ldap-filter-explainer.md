# LDAP-Filter erklärt

Fügen Sie einen beliebigen Suchfilter für LDAP (Lightweight Directory Access Protocol) ein, und das Tool parst ihn genau so, wie es ein Verzeichnisserver tut: nach RFC 4515, der Zeichenfolgendarstellung, in die letztlich jeder LDAP-Client, jede Suche in PingDirectory, jede Datastore-Abfrage in PingFederate und jede Abfrage in Active Directory übersetzt wird.

## Was Sie erhalten

Den kommentierten Baum. Jeder Knoten AND (`&`), OR (`|`) und NOT (`!`) nennt seine Regel in verständlicher Sprache; jedes Blattelement wird nach seiner Abgleichart eingeordnet: Gleichheit, Vorhandensein (`=*`), Teilzeichenfolge (Wildcards, mit Anfangs-, Mittel- und Endteil in ihrer Reihenfolge), `>=`, `<=`, ungefähr (`~=`) oder Extensible Match. Hex-Escapes nach RFC 4515 (`\2a`, `\28`, `\29`, `\5c`) werden dekodiert und aufgelistet. Die bekannten OIDs der Matching-Rules von Active Directory werden erkannt und beim Namen genannt: `1.2.840.113556.1.4.803` (bitweises AND, der klassische Test auf deaktivierte Konten `(userAccountControl:1.2.840.113556.1.4.803:=2)`), `804` (bitweises OR) und `1941` (transitive Gruppenmitgliedschaft).

## Fehler zeigen auf die Stelle

Ein fehlerhafter Filter scheitert mit der genauen Zeichenposition und einem Caret darunter: die unausgeglichene Klammer, das Element ohne `=`, der Backslash, dem seine zwei Hexziffern fehlen.

## Datenschutz

Filter enthalten oft interne Attributnamen und die OU-Struktur. Alles wird lokal in Ihrem Browser geparst; es wird nichts übertragen.

## Ergebnisse teilen

Unter den Kennzahlen des Filters erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Filter so, wie eingegeben, auch einen, der sich nicht parsen lässt: Gerade dessen Fehler mit der genauen Position ist vielleicht die Auswertung, die Sie zeigen möchten. Das Popover nennt zuerst, was der Link enthält, dann einen eigenen Warnhinweis: Ein Filter kann Benutzer, Gruppen und die Struktur Ihres Verzeichnisses nennen, lesen Sie ihn also, bevor Sie den Link senden. Dann bietet es „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Prüft ein Filter einen Wert eines Passwortattributs, gibt es keinen Link, und das Popover nennt das Attribut: `userPassword` ([RFC 4519](https://www.rfc-editor.org/rfc/rfc4519), Abschnitt 2.41, OID 2.5.4.35, „octet strings that are known only to the user and the system“, also Oktettfolgen, die nur der Benutzer und das System kennen), `authPassword` ([RFC 3112](https://www.rfc-editor.org/rfc/rfc3112), OID 1.3.6.1.4.1.4203.1.3.4) und `unicodePwd` von Active Directory ([AD-Schema von Microsoft](https://learn.microsoft.com/en-us/windows/win32/adschema/a-unicodepwd), Attribut-ID 1.2.840.113556.1.4.90), alle abgerufen am 01.11.2026. Erkannt werden sie am Namen oder an der OID, in beliebiger Groß- und Kleinschreibung und mit beliebigen Optionen, denn laut [RFC 4512](https://www.rfc-editor.org/rfc/rfc4512) (Abschnitt 2.5, abgerufen am 01.11.2026) unterscheiden Attributbeschreibungen nicht zwischen Groß- und Kleinschreibung, und Optionen folgen nach einem `;`. Ein Test auf Vorhandensein wie `(userPassword=*)` enthält keinen Wert und geht mit.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Filter beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der Filter länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Der Filter füllt das Feld, und die Seite erklärt ihn wie beim Einfügen; an ein Verzeichnis wird nichts gesendet. Ein Filter, der ein Passwort prüft, wird ignoriert. In beiden Fällen verschwindet der Wert sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
