## Was das Tool tut

BIG-IP 21.1 hat bigd, den Daemon für die Health-Monitore, als einzelne Multithread-Instanz neu aufgebaut, die bis zu 15.000 Monitore der Control Plane bedienen kann, und genau dokumentiert, wie sich die automatische Thread-Anzahl aus der Anzahl der vCPUs ergibt. Das Tool bildet diese beiden Formeln wörtlich ab: Geben Sie eine vCPU-Anzahl und den Systemtyp ein, und es liefert die Thread-Anzahl, die das System ableiten würde, die Obergrenze für das manuelle Überschreiben mit bigd.numprocs und die Obergrenze für Monitore. Eine bloße Zahl berechnet beide Formeln nebeneinander.

## Die beiden Formeln

Für Systeme mit Hyperthreading nennen die Release Notes von F5 `Number of BigD Threads = (Number of vCPUs × 6) ÷ 10`, mit der Begründung, dass HT-Kerne mit etwa 60 % der Leistung eines echten Kerns laufen. Für normale Systeme (ohne HT) lautet die Formel `Number of BigD Threads = (Number of vCPUs ÷ 2) − 1`. Ergibt eine Formel einen Bruch (8 vCPUs mit Hyperthreading ergeben 4,8), nennen die Release Notes keine Rundungsregel; daher zeigt das Tool sowohl den exakten Wert als auch die abgerundete Zahl ganzer Threads und sagt das ausdrücklich. Bei 2 vCPUs ist das ehrliche Ergebnis der normalen Formel 0; bigd läuft trotzdem, verstehen Sie diesen Grenzfall also als minimales Threading, nicht als Fehlen.

## Das Überschreiben und die Obergrenze

Die DB-Variable `bigd.numprocs` legt die Thread-Anzahl manuell fest, ist aber auf die Anzahl der verfügbaren vCPUs begrenzt; ihr Standardwert 0 bedeutet automatische Berechnung mit den Formeln oben. Der Multithread-Daemon unterstützt bis zu 15.000 Monitore der Control Plane. Zur Einordnung bei der Dimensionierung: Die Notes von F5 zu 21.0 empfehlen, bigd bei höchstens 5.000 Monitorinstanzen zu halten und darüber hinaus auf In-TMM-Monitore umzusteigen, die mit einer Zuweisung von 8 GB extramb bis 25.000 skalieren.

## Welche Plattformen Hyperthreading nutzen

Die Wahl der Formel hängt von der Plattform ab, und die Plattformdokumentation von F5 selbst klärt das. Bei rSeries teilt sich die Familie genau in der Mitte: Die Appliances der Mittel- und Oberklasse (r5000, r10000 und die Familie r12000 in den Dimensionierungstabellen von F5) nutzen Hyperthreading, wobei jeder Intel-Kern als zwei vCPUs erscheint, während r2000 und r4000 eine CPU-Klasse ohne Hyperthreading verwenden und nur in physischen Kernen gezählt werden. VELOS nutzt auf beiden Blade-Typen Hyperthreading: Die vCPUs eines Tenants sind Hyperthreads, zwei pro physischem Kern, wobei BIG-IP-Tenants die Aufteilung HT-Split verwenden (K15003), bei der TMM einen Hyperthread jedes Kerns übernimmt. Auch iSeries und VIPRION zählen vCPUs in der Dimensionierungssprache von F5 als Hyperthreads, aber auf keiner von beiden läuft BIG-IP 21.x, daher zeigt das Tool die Zuordnung für sie nur zur Einordnung. Virtual Edition übernimmt, was der Hypervisor bereitstellt: Prüfen Sie im Gastsystem (`lscpu`, Thread(s) per core), und wählen Sie die passende Formel.

Geben Sie die Plattform direkt in das Eingabefeld ein: `8 r10900` wählt die Formel für Hyperthreading, `16 r4800` die normale, `22 velos` Hyperthreading, `8 ve` zeigt beide mit dem Hinweis, den Host zu prüfen. Ein ausdrückliches `ht` oder `normal` überschreibt immer den Standard der Plattform, für den Fall, dass Hyperthreading in der Firmware deaktiviert wurde.

## Durchgerechnete Beispiele

`8 ht` ergibt exakt 4,8, also 4 ganze Threads. `10 ht` landet glatt bei 6. `16 normal` ergibt 7. `40 ht` ergibt 24. `6` allein zeigt beide: 3,6 (abgerundet 3) mit Hyperthreading, 2 normal.

## Ergebnisse teilen

Unter den beiden Formeln erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Zeile so, wie eingegeben: `/tools/f5-bigd-thread-calculator#input=8%20r10900`. Eine vCPU-Anzahl und eine Plattform verraten nichts über Ihr Netzwerk. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird die Zeile beim Öffnen des Links nicht an den Server gesendet. Sie bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Eine Zeile aus wenigen Wörtern, weit unter den 16.384 Zeichen, die die Website nach dem `#` zulässt.
- **Öffnen eines Links.** Die Zeile füllt das Feld wie bei der Eingabe, und die Seite rechnet. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Herkunft

Die Formeln, das Verhalten der Obergrenze und die Grenze von 15.000 stammen wörtlich aus den Release Notes von F5 „New Features in BIG-IP Version 21.1.0“ (BigD enhancements for large-scale configurations), abgerufen am 08.07.2026; die Empfehlung zu 5.000 Instanzen und die Zahlen zu In-TMM stammen aus dem Gegenstück zu 21.0.0. Maßgeblich ist immer die tatsächliche Thread-Anzahl des laufenden Systems.
