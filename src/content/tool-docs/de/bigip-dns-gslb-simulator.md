## Was das Tool tut

Das Tool modelliert Global Server Load Balancing in BIG-IP DNS (früher GTM), das zweistufig arbeitet: Eine Wide IP wählt zuerst einen Pool, dann wählt der Pool einen virtuellen Server. Konfigurieren Sie Ihre Pools (jeweils mit Ratio, Regions-Tag, Zustand verfügbar oder nicht verfügbar und einer Methode für die Member-Auswahl) und deren Member, legen Sie dann die Pool-Methode der Wide IP, eine Client-Region und eine Anzahl N von Anfragen fest. Das Tool berechnet, wie die nächsten N DNS-Anfragen zur Namensauflösung aufgelöst werden: zuerst die Verteilung auf die Pools, dann die Verteilung auf die Member innerhalb jedes Pools.

## Was simuliert wird und was nicht

Deterministisch auf beiden Ebenen: Round Robin (reihum und gleichmäßig), Ratio (gewichtet, nach dem Verfahren des größten Rests), Global Availability (alle Anfragen an die erste verfügbare Ressource in der Reihenfolge der Liste, die übrigen als Reserve) und Topology (die Ressource, deren Region zum Client passt, gewinnt mit der höchsten Punktzahl; bei Gleichstand innerhalb der Siegerpunktzahl geht es reihum). Ein nicht verfügbarer Pool oder ein nicht verfügbares Member erhält nichts, und der Datenverkehr verteilt sich neu auf die verfügbaren.

Die dynamischen Methoden (Quality of Service, Completion Rate, Round Trip Time, Fewest Hops, Kilobytes/Second, Packet Rate, Virtual Server Score, Least Connections, CPU) hängen von laufenden Leistungsmetriken ab, die die big3d-Agenten in jedem Rechenzentrum erfassen. Diese lassen sich offline nicht nachbilden; das Tool weist deshalb klar darauf hin, statt eine Verteilung zu erfinden. Es ist dieselbe Ehrlichkeitsregel, die der LTM-Simulator bei seinen dynamischen Methoden befolgt.

## Warum zwei Ebenen wichtig sind

Das häufigste Missverständnis bei GSLB ist, Pool-Auswahl und Member-Auswahl als eine einzige Entscheidung zu betrachten. Es sind zwei getrennte Entscheidungen, und jede kann eine andere Methode verwenden: Eine Wide IP wählt Pools vielleicht nach Topology (europäische Clients in den EU-Pool), während jeder Pool einen virtuellen Server nach Ratio wählt (den größeren Standort stärker gewichten). Das Tool macht diese Trennung sichtbar: Sie sehen, welcher Pool geantwortet hat und welcher virtuelle Server darin aufgelöst hat. So wird das Zusammenspiel der beiden Ebenen konkret statt abstrakt.

## Ergebnisse teilen

Unter der Pool-Ebene (oder bei einer dynamischen Methode der Wide IP unter der Erklärung) erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das ganze Formular als benannte Werte: `method`, `region` (fehlt, wenn leer), `requests`, `pools` (eine Zeile pro Pool: Name, Ratio, Region, Verfügbarkeit und Member-Methode, durch Tabs getrennt) und `members` (eine Zeile pro Member: Nummer seines Pools, Name, Ratio, Region und Verfügbarkeit). Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Namen und Regionen bleiben so, wie eingegeben, nur ein darin eingefügter Tab wird als Leerzeichen übertragen.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher werden die Werte beim Öffnen des Links nicht an den Server gesendet. Sie bleiben in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Das ganze Formular wird durch die Werte des Links ersetzt, auch ein Feld, das der Link nicht enthält, und die Seite simuliert sie; es wird nichts gesendet. Ein Wert, den das Formular nicht annehmen würde (eine unbekannte Methode, eine Ratio unter 1, eine Zeile mit fehlendem Feld), macht den Link fehlerhaft, und er wird ganz ignoriert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
