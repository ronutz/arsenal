## Was das Tool tut

Zwei Modi für exakte Zeitarithmetik. Zwischen zwei Zeitpunkten: die vorzeichenbehaftete Spanne, aufgeschlüsselt von der größten Einheit an (Wochen, Tage, Stunden, Minuten, Sekunden) und in jeder Einheit vollständig als Gesamtwert angegeben, dazu die kanonische Dauer nach ISO 8601. Zeitpunkt plus oder minus eine Dauer: der resultierende Zeitstempel. Dauern werden nach ISO 8601 (P1DT2H30M, PT90M, P1W) oder in einfacher Kurzschreibweise (1d 2h 30m; 90min) gelesen. Alles wird auf der Zeitachse der koordinierten Weltzeit (UTC) in Ihrem Browser berechnet.

## Was das Tool ablehnt, und warum

„Einen Monat“ zu addieren ist Kalenderarithmetik: Ein Monat hat 28 bis 31 Tage und ein Jahr 365 oder 366, daher hat P1M keine einzige exakte Länge. Das Tool lehnt Monate und Jahre mit genau dieser Begründung ab, statt stillschweigend eine Konvention zu wählen. Ein Tag hat hier genau 24 Stunden und eine Woche genau 7 Tage: exakte Zeit, offen benannt.

## Offsets

Ein Zeitstempel ohne Offset wird als UTC gelesen, und diese Annahme wird vermerkt. Fügen Sie Z oder einen ausdrücklichen Offset hinzu (zum Beispiel -03:00), dann hängt die Antwort nie davon ab, auf welchem Rechner das Tool gerade läuft.

Unter jedem Zeitpunkt setzt eine Auswahl für Datum und Uhrzeit den Wert, ohne dass Sie ihn eingeben müssen. Eine Auswahl behält die Sekunden und den Offset, die das Feld bereits hatte, und schreibt Z (UTC), wenn es keinen hatte; ein anderer Offset als Z oder ein Datum allein wird weiterhin eingegeben.

## Ergebnisse teilen

Unter dem Ergebnis erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen und sobald die Seite ein Ergebnis hat. Der Link enthält nach dem `#` den Modus und seine Felder: die beiden Zeitpunkte für die Spanne zwischen ihnen oder den Startzeitpunkt, die Dauer und Addieren oder Subtrahieren. Die Felder des anderen Modus sind nicht enthalten. Zeitpunkte und Dauern verraten nichts über Sie. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` steht, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Öffnen eines Links.** Der Modus wird gewählt, seine Felder füllen sich so, wie Sie sie eingeben würden, und die Seite rechnet; die Felder des anderen Modus behalten, was Sie dort hatten. Ein unbekannter Modus oder eine unbekannte Operation, ein fehlendes Feld oder ein Feld des anderen Modus führt dazu, dass der Link ignoriert wird. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
