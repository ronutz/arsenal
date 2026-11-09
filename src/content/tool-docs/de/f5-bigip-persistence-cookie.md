## Was das Tool tut

Das Tool dekodiert den Wert eines Persistenz-Cookies `BIGipServer` von F5 BIG-IP zur IP-Adresse und zum Port des Pool-Members im Backend, oder es geht den umgekehrten Weg und kodiert aus Adresse und Port einen Cookie-Wert. Es beherrscht die vier unverschlüsselten Kodierungen, die BIG-IP verwendet, und läuft vollständig in Ihrem Browser.

## Was das Cookie ist und warum das Dekodieren wichtig ist

Wenn die Cookie-Persistenz von BIG-IP im standardmäßigen Insert-Modus läuft, fügt sie ein Cookie namens `BIGipServer<pool>` hinzu, dessen Wert kodiert, an welches Pool-Member ein Client geschickt wurde, damit der Client zum selben Member zurückkehrt. Der Haken: Die Kodierung ist keine Verschlüsselung. In seiner Standardform kodiert das Cookie ganz offen die interne IP-Adresse und den Port des Pool-Members. Wer das Cookie sehen kann, also der Client und alles auf dem Pfad, kann es dekodieren und erfährt so einen Teil Ihrer internen Topologie. Genau das zu zeigen, ist der Zweck des Tools, und es weist darauf hin, wenn eine dekodierte Adresse in einem privaten Bereich nach RFC 1918 liegt, denn das ist genau das interne Detail, das Sie nicht veröffentlichen wollten.

## Die Kodierungen und ihre Byte-Reihenfolge

Die Feinheit, und der Grund, warum ein eigens dafür gebauter Decoder hilft, ist die Byte-Reihenfolge. In der Standardkodierung für IPv4 ist die Adresse eine einzige Dezimalzahl, deren Bytes als Little-Endian gelesen werden, also in umgekehrter Reihenfolge, und der Port ist ein Dezimalfeld mit vertauschten Bytes. So wird zum Beispiel die Adresse `10.1.1.100` zur Dezimalzahl `1677787402` und Port `80` zum byteweise vertauschten `20480`. Insgesamt definiert BIG-IP vier solche Kodierungen für IPv4, IPv6 und die Varianten mit Route Domain, jede mit eigener Regel; das Tool implementiert sie nach der Dokumentation von F5 (K6917), abgeglichen mit einem bekannten Referenz-Decoder.

## Die Abhilfe, die das Tool nicht aushebeln kann

Die Gegenmaßnahme ist einfach und verdient eine ausdrückliche Erwähnung: Konfigurieren Sie die Cookie-Verschlüsselung im Persistenzprofil (F5 K7784). Ein verschlüsseltes Persistenz-Cookie enthält keine lesbare Adresse, und das Tool kann es nicht dekodieren, das ist so gewollt. Wenn Sie Ihr Produktiv-Cookie hier dekodieren können, kann das jeder andere auch, und das ist das Signal, die Verschlüsselung einzuschalten.

## Verwendung

Fügen Sie einen `BIGipServer`-Cookie-Wert ein, um Adresse und Port des Members zu dekodieren, oder geben Sie eine Adresse und einen Port ein, um einen Cookie-Wert zu erzeugen. Die Berechnung ist deterministisch und lokal; es wird nichts gesendet.

## Ergebnisse teilen

Jeder Modus hat unter seiner Antwort eine eigene Schaltfläche **Ergebnisse teilen**. Sie erzeugt einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen, und der Link enthält die Werte nach dem `#`. Im Modus „Dekodieren“ enthält er eine Kopie des Cookies, das die Seite dekodiert hat, mit Name und Wert, nie die Zeile so, wie eingefügt: Die Seite liest nur, was vor dem ersten `;` steht, und eine eingefügte Zeile kann mehr enthalten, etwa die Attribute einer `Set-Cookie`-Zeile oder den `Cookie`-Wert eines Browsers, in dem ein Sitzungs-Cookie auf das Persistenz-Cookie folgt ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), das Beispiel `Cookie: SID=31d4d96e407aad42; lang=en-US` in Abschnitt 4.2.1; Abschnitt 8.4: Ein Cookie enthält häufig eine Sitzungskennung; abgerufen am 01.11.2026). Die empfangende Seite dekodiert also dasselbe Pool-Member, und der Rest bleibt bei Ihnen. Im Modus „Kodieren“ enthält der Link Adresse, Port und Route Domain so, wie die Seite sie gelesen hat. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Weil die dekodierte oder eingegebene Adresse meist die eines internen Pool-Members ist, ergänzt das Popover eine Zeile, die Sie bittet, sie zu prüfen, bevor Sie den Link senden.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` steht, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Öffnen eines Links.** Der Modus wird geöffnet, seine Felder werden gefüllt, als wären die Werte eingegeben, und die Seite dekodiert oder kodiert wie gewohnt. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
