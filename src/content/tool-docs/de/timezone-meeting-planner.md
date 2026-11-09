## Was das Tool tut

Geben Sie einen Zeitpunkt für das Meeting ein, mit Z oder einem ausdrücklichen Offset, denn eine Meetingzeit ohne Offset ist mehrdeutig, und dazu eine Liste von IANA-Zeitzonen, eine pro Zeile. Das Tool liest diesen einen Zeitpunkt in jeder Zone: lokales Datum und Uhrzeit, Wochentag, den Offset zur koordinierten Weltzeit (UTC), den tzdata für dieses Datum angibt, die Datumsverschiebung gegenüber der ersten Zone und eine Markierung für die Arbeitszeit. Die Zeitzonendaten sind die eigene IANA-Datenbank Ihres Browsers, dieselbe, die das Betriebssystem aktuell hält.

## Die Markierungen, offen benannt

Als Arbeitszeit markiert wird 09:00–17:59 Uhr Ortszeit, Montag bis Freitag: der übliche Rahmen, benannt statt versteckt. Eine Spalte für die Datumsverschiebung hebt Teilnehmende hervor, die sich an einem anderen Kalenderdatum befinden, die klassische Überraschung, dass Tokio erst morgen dazukommt, und genau das sollte die Einladung ausdrücklich erwähnen.

## Warum das Datum zählt

Die Sommerzeit ist das, was die Regeln der Zone für genau dieses Datum festlegen: Berlin liegt im Juli bei UTC+2 und im Januar bei UTC+1; São Paulo liegt das ganze Jahr bei UTC-3, seit Brasilien die Sommerzeit 2019 abgeschafft hat. Mit einem echten Datum zu planen, ist der ganze Zweck.

Unter dem Zeitpunkt setzt eine Auswahl für Datum und Uhrzeit den Wert, ohne dass Sie ihn eingeben müssen: Eine Auswahl behält die Sekunden und den Offset des Felds und schreibt Z (UTC), wenn es keinen hatte. Unter den Zeitzonen fügt eine Liste aller IANA-Zeitzonen, die der Browser kennt, die gewählte als neue Zeile hinzu.

## Ergebnisse teilen

Unter der Tabelle erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen und sobald die Seite einen Plan hat. Der Link enthält nach dem `#` den Zeitpunkt des Meetings und die Zeitzonen, eine pro Zeile, so, wie eingegeben. Die lokalen Zeiten werden aus den Zeitzonendaten des Browsers berechnet, der den Link öffnet, und diese Daten verwendet die Seite immer. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` steht, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Öffnen eines Links.** Zeitpunkt und Zeitzonen füllen sich so, wie Sie sie eingeben würden, und die Seite plant. Beides muss vorhanden sein, sonst wird der Link ignoriert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
