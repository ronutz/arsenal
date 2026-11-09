## Was das Tool tut

Fügen Sie den Abschnitt F5 Ethernet Trailer so ein, wie Wireshark ihn anzeigt, oder die rohen Bytes des Trailers als Hex, und das Tool erklärt jedes Feld: Richtung, Slot und TMM, den virtuellen Server, die Flow- und Peer-Kennungen und die eigene RST-Ursache des Geräts. Lokal und offline; das Tool parst den eingefügten Text und kontaktiert nichts.

## Warum es sich lohnt, den Trailer zu lesen

Führen Sie tcpdump **auf** einem BIG-IP mit den Noise-Flags aus (`:n` niedrig, `:nn` mittel, `:nnn` hoch, mit `-s0`), und jeder Frame enthält die eigene Darstellung des Geräts zu diesem Paket. Die **RST-Ursache** ist das Feld, das den Aufwand lohnt: Ein Mitschnitt ohne sie zeigt, dass eine Verbindung abgebrochen ist; mit ihr sagt Ihnen das Gerät, dass es selbst die Verbindung beendet hat, und warum.

## Wovor das Tool warnt

**Flow-IDs sind nur innerhalb einer Kombination aus Slot und TMM eindeutig, und sie werden wiederverwendet.** Dieselbe ID kann früher oder später im selben Mitschnitt an Paketen auftauchen, die nichts miteinander zu tun haben. Das Tool sagt das bei jeder Dekodierung, denn eine Flow-ID, die man für global eindeutig hält, führt zu einem selbstsicheren, falschen Schluss.

Es weist auch auf `f5ethtrailer.anyflowid` hin, das die ID als Flow- oder als Peer-Kennung findet und so **beide Seiten** der Verbindung liefert; ein Filter nur auf `flowid` liefert die Hälfte dessen, was Sie wollten.

## *** Der Abschnitt, dessen Dekodierung das Tool verweigert ***

Ab **BIG-IP v15** kann der Trailer einen **TLS-Provider-Abschnitt mit Sitzungs-Secrets** enthalten. Wireshark macht daraus Keylog-Einträge und entschlüsselt den Mitschnitt.

**Das Tool erkennt diesen Abschnitt, teilt Ihnen mit, dass er vorhanden ist, und dekodiert nichts davon.** Ein Referenzvektor (Golden Vector) stellt sicher, dass nirgends in der Ausgabe jemals ein Secret erscheint.

Der Grund ist das, was man wissen sollte: **Ein Mitschnitt mit hohem Noise-Level auf einem Gerät ab v15 kann die Schlüssel zu seinen eigenen TLS-Sitzungen enthalten.** F5 dokumentiert, dass der Trailer das Gerät nie über die Leitung verlässt; das stimmt, und es betrifft die Leitung. Die Datei ist eine andere Frage, und wer sie an ein Ticket hängt oder jemandem im Team schickt, schickt die Schlüssel mit.

## Was das Tool nicht tut

Es liest keine pcap-Dateien und kann Ihren Mitschnitt nicht sehen. Steht eine RST-Ursache nicht in seiner Tabelle, sagt es das, statt eine Erklärung dafür zu erfinden.

## Ergebnisse teilen

Unter der Übersicht erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Trailer-Text so, wie eingefügt, aber nie das, dessen Dekodierung die Seite verweigert. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

- **TLS-Secrets: kein Link.** Findet die Seite einen TLS-Provider-Abschnitt oder nennt der Text ein Secret oder eine Keylog-Zeile, gibt es überhaupt keinen Link, und das Popover nennt den Grund. Die Feldliste von Wireshark für den Trailer ([f5ethtrailer display filter reference](https://www.wireshark.org/docs/dfref/f/f5ethtrailer.html), abgerufen am 27.10.2026) enthält `f5ethtrailer.tls.master_secret`, die Traffic-Secrets von Client und Server und `f5ethtrailer.tls.keylog`: die Schlüssel zu den eigenen TLS-Sitzungen des Mitschnitts. Sie wegzulassen, würde ändern, was die Seite über den Trailer aussagt, daher wird stattdessen nichts gesendet.
- **Bytes: nur der Header.** Eingefügte Bytes werden nur übernommen, wenn sie ausschließlich der Header des Trailers sind (Magic-Wert, Länge und Version, 8 Byte laut der Feldliste von Wireshark). Alles andere, davor oder danach, können die eigenen Daten des Pakets oder die Provider-Abschnitte des Trailers sein, TLS-Secrets eingeschlossen, die die Seite nie liest: kein Link, und das Popover schlägt vor, stattdessen die Textansicht aus Wireshark zu teilen.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Text beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Der Text füllt das Feld wie beim Einfügen, und die Seite dekodiert ihn. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
