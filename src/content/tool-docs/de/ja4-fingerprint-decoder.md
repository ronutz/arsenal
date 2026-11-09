## Was das Tool tut

Ein JA4 ist ein Fingerprint eines TLS-Clients, berechnet aus den Feldern seines ClientHello: der TLS-Version, den angebotenen Cipher-Suiten, den gesendeten Erweiterungen, den Signaturalgorithmen und dem ALPN. Zwei Clients, die ihr ClientHello auf dieselbe Weise aufbauen, erzeugen denselben JA4; so erkennen Server, Proxys und passive Sensoren Client-Software, ohne etwas zu entschlüsseln. Das Tool zerlegt einen JA4 in seine Teile oder berechnet den gehashten JA4 aus den rohen, ungehashten Werten. Alles läuft in Ihrem Browser.

## So ist ein JA4 aufgebaut

Ein JA4 hat drei durch Unterstriche verbundene Abschnitte, `JA4_a_JA4_b_JA4_c`, zum Beispiel `t13d1516h2_8daaf6152771_e5627efa2ab1`.

- **JA4_a** ist für Menschen lesbar und zehn Zeichen lang:
  - Transport: `t` für TLS über TCP, `q` für QUIC, `d` für DTLS;
  - TLS-Version: `13` für TLS 1.3, `12` für 1.2 usw., gelesen aus der Erweiterung supported_versions, sofern vorhanden;
  - SNI: `d`, wenn das ClientHello einen Servernamen (eine Domain) enthält, `i`, wenn nicht (eine bloße IP);
  - die Anzahl der Cipher-Suiten zweistellig;
  - die Anzahl der Erweiterungen zweistellig (diese Anzahl schließt SNI und ALPN ein);
  - die ALPN-Markierung: erstes und letztes Zeichen des ersten ALPN-Werts, also `h2` für HTTP/2, oder `00`, wenn es kein ALPN gibt.
- **JA4_b** sind die ersten zwölf Hexziffern des SHA-256 der sortierten Liste der Cipher-Suiten.
- **JA4_c** sind die ersten zwölf Hexziffern des SHA-256 der Liste der Erweiterungen (sortiert, ohne SNI und ALPN), gefolgt von der Liste der Signaturalgorithmen in ihrer ursprünglichen Reihenfolge.

Da JA4_b und JA4_c gekürzte Hashes sind, sind sie Einwegwerte: Das Tool kann sie anzeigen, aber nicht die Listen der Cipher-Suiten oder Erweiterungen aus ihnen zurückgewinnen.

## GREASE

GREASE (die reservierten Werte aus draft-davidben-tls-grease) hält TLS erweiterbar, indem Clients zufällige, ungenutzte Werte senden, die Server ignorieren müssen. JA4 ignoriert sie ebenfalls, sodass sie nie die Anzahlen oder die Hashes beeinflussen. Fügen Sie rohe Werte mit GREASE ein, filtert das Tool sie heraus, bevor es zählt, sortiert und hasht.

## Die Sortierung macht JA4 robust

Ältere Fingerprints wie JA3 hashten die Listen der Cipher-Suiten und Erweiterungen in der Reihenfolge, in der der Client sie gesendet hat. Moderne Browser wählen die Reihenfolge der TLS-Erweiterungen inzwischen bei jeder Verbindung absichtlich zufällig, was einen JA3 jedes Mal verändert und ihn damit aushebelt. JA4 sortiert Cipher-Suiten und Erweiterungen vor dem Hashen, sodass der Fingerprint stabil bleibt, selbst wenn der Client die Reihenfolge mischt. Das ist der Hauptgrund, warum JA4 den JA3 weitgehend abgelöst hat.

## Durchgerechnetes Beispiel

Der Fingerprint `t13d1516h2_8daaf6152771_e5627efa2ab1` ergibt dekodiert TLS über TCP, TLS 1.3, SNI vorhanden, 15 Cipher-Suiten, 16 Erweiterungen und ALPN `h2` (HTTP/2). Das ist das durchgerechnete Beispiel aus der JA4-Spezifikation und einer der Referenzvektoren (Golden Vectors) dieses Tools: Der SHA-256 der sortierten Liste der Cipher-Suiten ergibt `8daaf6152771`, die sortierten Erweiterungen plus Signaturalgorithmen ergeben `e5627efa2ab1`.

## Ein Hinweis zur Lizenz

JA4 (Fingerprinting von TLS-Clients) wird von FoxIO unter der freizügigen BSD-3-Clause-Lizenz veröffentlicht, zu denselben Bedingungen wie das ursprüngliche JA3; es darf also frei implementiert werden, auch in kommerziellen Tools. Die übrigen Mitglieder der JA4+-Familie wie JA4S, JA4H, JA4X und JA4T stehen unter der FoxIO License 1.1, die eine Monetarisierung ohne gesonderte Vereinbarung nicht erlaubt; dieses Tool implementiert daher nur JA4.

## JA3, der Vorgänger

Das Tool verarbeitet auch JA3, den älteren Fingerprint, den JA4 abgelöst hat. Ein JA3 ist der MD5 aus fünf dezimalen Feldern des ClientHello in der Reihenfolge, in der sie gesendet wurden: `SSLVersion,Ciphers,Extensions,EllipticCurves,EllipticCurvePointFormats`, zum Beispiel `769,47-53-5-10-49161-49162-49171-49172-50-56-19-4,0-10-11,23-24-25,0`. Fügen Sie einen JA3-String ein, berechnet das Tool seinen MD5 und schlüsselt die Felder auf; fügen Sie einen bloßen MD5 aus 32 Zeichen ein, erkennt es ihn als JA3-Hash, den es als Einwegwert nicht dekodieren kann. JA3 steht wie JA4 unter BSD 3-Clause. Er ist reihenfolgeabhängig, daher erzeugt ein Browser, der die Reihenfolge seiner Erweiterungen zufällig wählt, bei jeder Verbindung einen anderen JA3; genau deshalb gibt es JA4.

## Verwendung

Das Tool erkennt selbst, was Sie einfügen: Ein JA4 enthält Unterstriche, ein JA3 besteht aus dezimalen, durch Kommas getrennten Feldern oder ist ein bloßer MD5. Fügen Sie einen gehashten JA4 ein, um ihn zu dekodieren, ein rohes JA4_r (der Wert `JA4_a`, gefolgt von den ungehashten Listen der Cipher-Suiten, Erweiterungen und Signaturalgorithmen, durch Unterstriche getrennt), um den gehashten JA4 zu berechnen, einen JA3-String, um seinen MD5 zu berechnen und seine Felder zu sehen, oder einen JA3-MD5, um ihn zu erkennen. Der Weg über den rohen JA4 sortiert die Listen für Sie und filtert GREASE heraus, sodass sortierte Eingaben und Eingaben in ursprünglicher Reihenfolge denselben kanonischen JA4 ergeben.

## Ergebnisse teilen

Unter der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält den Fingerprint so, wie eingefügt (`#input=t13d1516h2_8daaf6152771_e5627efa2ab1`), und sonst nichts. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ein Fingerprint ist weit kürzer.
- **Öffnen eines Links.** Der Fingerprint füllt das Feld wie beim Einfügen, und die Seite liest ihn erneut; ein fehlerhafter erhält die eigene Meldung der Seite. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.
