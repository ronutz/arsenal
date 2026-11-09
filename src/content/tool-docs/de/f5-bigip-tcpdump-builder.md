## Was das Tool tut

Das Tool setzt aus strukturierten Angaben einen korrekten `tcpdump`-Befehl für F5 BIG-IP zusammen: die Schnittstelle (in der eigenen Syntax von BIG-IP), wie viele TMM-Flow-Details enthalten sein sollen, die Snaplen, ob eine Mitschnittdatei geschrieben wird, und einen BPF-Filter. Das Tool formatiert den Befehl, damit Sie ihn kopieren und auf dem Gerät ausführen; es schneidet selbst nichts mit und kontaktiert kein Gerät.

## Warum tcpdump auf BIG-IP anders ist

Auf einem BIG-IP läuft `tcpdump` gegen den Traffic Management Microkernel (TMM), und beim Argument für die Schnittstelle weicht es vom normalen tcpdump ab. Zwei Besonderheiten von BIG-IP sind am wichtigsten:

- **Die Schnittstelle `0.0`** steht für alle TMM-Datenschnittstellen auf einmal. Damit finden Sie gut heraus, wo Datenverkehr fließt (oder nicht fließt), aber sie ist nicht ratenbegrenzt, daher ist ein Filter unerlässlich, damit der Mitschnitt nicht überläuft.
- **Das Detail-Suffix `:n`** steuert, wie viele interne TMM-Informationen jede Paketzeile enthält, und genau dabei passieren die meisten Fehler.

## Das Detail-Suffix und der Fehler, den Sie vermeiden sollten

Ein Suffix an der Schnittstelle erhöht das „Noise“-Level:

- **`:n`** (niedrig) fügt den Namen des virtuellen Servers, die Schnittstelle und die Richtung hinzu.
- **`:nn`** (mittel) fügt Flow-Details hinzu.
- **`:nnn`** (hoch) fügt IP-Adresse und Port beider Seiten des BIG-IP hinzu, sodass Sie eine einzelne Verbindung über den Proxy hinweg verfolgen können.

Ein angehängtes **`p`** (wie in `:nnnp` oder einfach `:p`) schneidet beide Seiten des Proxys zugleich mit: den Flow vom Client zum BIG-IP und den Flow vom BIG-IP zum Pool-Member. Der klassische Fehler ist, dieses Schnittstellensuffix `:n` mit der Kommandozeilenoption `-n` zu verwechseln, die etwas völlig anderes tut (sie schaltet die Namensauflösung ab). Das sind zwei getrennte Dinge, und das Tool bildet sie getrennt ab, damit Sie sie nicht vermengen.

## Verwendung

Wählen Sie Schnittstelle und Detailstufe, setzen Sie bei Bedarf eine Snaplen und eine Ausgabedatei, ergänzen Sie einen BPF-Filter und kopieren Sie den fertigen Befehl. Er wird aus den Optionen der Anleitungen von F5 zum Paket-Tracing (K411 und K13637) gebildet, ist also der Befehl, den ein BIG-IP tatsächlich annimmt.

## Ergebnisse teilen

Unter dem Befehl erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Formular als benannte Werte: `iface`, `filter` und `file` so, wie eingegeben (die Datei nur, solange sie geschrieben wird), und jede Auswahl, die vom Standard des Formulars abweicht (`detail`, `both`, `names`, `snaplen` mit `snapbytes`, `count`, `verbose`, `ether`, `hex`, `write`). Solange das Formular unverändert im Standardzustand ist, ist die Schaltfläche deaktiviert. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Das Formular enthält kein Secret (der Generator formatiert einen Befehl und führt nichts aus), aber Schnittstelle und Filter können interne Adressen und VLANs nennen, deshalb ergänzt das Popover einen eigenen Warnhinweis dieses Tools, bevor Sie etwas kopieren. Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird das Formular beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Werte des Links ersetzen das ganze Formular: Ein Textfeld, das der Link nicht enthält, wird geleert, eine Auswahl, die er nicht enthält, erhält ihren Standardwert, und die Seite setzt den Befehl zusammen. Es wird nichts mitgeschnitten, ausgeführt oder gesendet. Eine Auswahl, die das Formular nicht anbietet, ein Schalter mit einem anderen Wert als 1 oder 0 oder eine Zahl außerhalb des zulässigen Bereichs führt dazu, dass der ganze Link ignoriert wird. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
