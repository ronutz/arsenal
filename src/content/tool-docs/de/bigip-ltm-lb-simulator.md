## Was das Tool tut

Das Tool simuliert, wie ein BIG-IP-LTM-Pool den Datenverkehr verteilt. Sie konfigurieren die Pool-Member (jeweils mit Member-Ratio, Node und Node-Ratio, Prioritätsgruppe und der Anzahl vorhandener Persistenzeinträge), wählen dann eine Lastverteilungsmethode und eine Anzahl N von Anfragen, und das Tool zeigt als Verteilung pro Member, wo die nächsten N Verbindungen landen. Es läuft vollständig in Ihrem Browser und ist deterministisch: Dieselben Eingaben ergeben immer dieselbe Antwort.

## Die simulierten Methoden

Simuliert werden die statischen sowie die verbindungs- und sitzungsbasierten Methoden, weil ihr Ergebnis durch die Konfiguration und die von Ihnen vorgegebene Last bestimmt ist. Round Robin schickt jede Anfrage reihum an das nächste Member. Ratio (member) verteilt im Verhältnis zur Ratio jedes Members; Ratio (node) tut dasselbe pro Node und teilt den Anteil eines Nodes unter seinen Membern auf. Least Connections (member und node) schickt jede neue Verbindung an das am wenigsten belastete Member; Weighted Least Connections gewichtet das nach Ratio. Least Sessions schickt an das Member mit den wenigsten Persistenzeinträgen, und das ist genau die Zahl der Persistenzeinträge, die Sie pro Member eingeben.

## Prioritätsgruppen

Die Aktivierung von Prioritätsgruppen entscheidet, welche Member infrage kommen. Jedes Member hat eine Priorität; der Datenverkehr geht zuerst an die Gruppe mit der höchsten Priorität, und eine niedrigere Gruppe wird erst aktiviert, wenn die Zahl der verfügbaren Member in der aktiven Menge unter den von Ihnen gesetzten Schwellenwert fällt (0 deaktiviert die Funktion). Das Tool wendet das an und kennzeichnet jedes Member als aktiv oder im Standby; so sehen Sie, wie eine niedrigere Gruppe untätig bleibt, bis die höhere ausdünnt.

## Was nicht simuliert wird, und warum

Fastest, Observed, Predictive und Dynamic Ratio sind dynamische Methoden, die anhand laufender Laufzeitmetriken entscheiden: Antwortzeit, Verbindungen pro Sekunde, Leistungstrends, SNMP-Daten. Diese Werte gehören nicht zur Konfiguration eines Pools und ändern sich ständig, daher lässt sich aus statischen Eingaben keine feste Verteilung ehrlich berechnen. Das Tool bietet sie in der Liste an, erklärt aber bei ihrer Auswahl, warum es sie nicht simulieren kann, statt Zahlen zu erfinden. Zwei weitere Hinweise zur Ehrlichkeit: Least Connections wird mit einer leeren Verbindungstabelle modelliert, weil das Tool keine aktuelle Verbindungszahl übernimmt, und beginnt daher gleichmäßig; Least Sessions setzt Persistenz nach Quelladresse oder Sitzung voraus, da BIG-IP bei Cookie-basierter Persistenz auf Round Robin zurückfällt.

## Ergebnisse teilen

Am Ende der Antwort erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das ganze Formular als benannte Werte: `members` (eine Zeile pro Member mit Name, Node, Ratio, Node-Ratio, Prioritätsgruppe und Persistenzeinträgen, durch Tabs getrennt), `method`, `threshold` (die Aktivierung der Prioritätsgruppe) und `requests`. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Namen und Nodes bleiben so, wie eingegeben, nur ein darin eingefügter Tab wird als Leerzeichen übertragen.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher werden die Werte beim Öffnen des Links nicht an den Server gesendet. Sie bleiben in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Das ganze Formular wird durch die Werte des Links ersetzt, auch ein Feld, das der Link nicht enthält, und die Seite simuliert sie; es wird nichts gesendet. Ein Wert, den das Formular nicht annehmen würde (eine unbekannte Methode, eine Ratio unter 1, eine Zeile mit fehlendem Feld), macht den Link fehlerhaft, und er wird ganz ignoriert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
