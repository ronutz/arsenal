## Was das Tool tut

Der Rechner übersetzt die Konfiguration eines Rate Limiters von F5 Distributed Cloud (XC) in genau das, was sie bewirkt. Sie geben die vier Felder ein, die die Konsole von F5 abfragt (**Number**, **Per Period**, **Periods** und **Burst Multiplier**), dazu die **Mitigation Action** (und einen Lockout, wenn Sie Block wählen); der Rechner ermittelt die effektive Rate, die Entsprechungen pro Sekunde, Minute und Stunde, die Burst-Obergrenze und eine verständliche Beschreibung, wie die Durchsetzung abläuft. Er läuft vollständig in Ihrem Browser.

## Die Rechnung hinter der Rate

XC drückt eine Rate als *Number Anfragen pro (Periods x Per Period)* aus. Deshalb sind `[1, Seconds, 60]` und `[1, Minutes, 1]` dasselbe Limit, nämlich eine Anfrage pro Minute, was regelmäßig für Überraschung sorgt. Der Rechner normalisiert jede Konfiguration auf ein einziges Fenster in Sekunden und zeigt die entsprechenden Raten pro Sekunde, Minute und Stunde, sodass sich zwei Konfigurationen direkt vergleichen lassen.

## Burst und Durchsetzung

Der **Burst Multiplier** ist der maximal erlaubte Burst an Anfragen als Vielfaches der Rate (Standard 1); ein Limit von 15 Anfragen pro Sekunde mit dem Multiplikator 3x erlaubt einen Burst von 45 Anfragen. Die Durchsetzung arbeitet nach dem Leaky-Bucket-Verfahren: Läuft der Bucket über, antwortet der Load-Balancer mit **HTTP 429**.

## Die Falle bei der Mitigation

Die am häufigsten missverstandene Einstellung ist die **Mitigation Action**. **Disabled umgeht das Rate Limiting nicht**: Der Leaky Bucket antwortet beim Überlaufen weiterhin mit 429; Disabled heißt nur, dass kein zusätzlicher Lockout-Timer greift. **Block** setzt einen Lockout obendrauf: Sobald der Bucket überläuft, wird der Benutzer für die volle Lockout-Dauer blockiert, auch wenn sich der Bucket leert, und kann erst nach Ablauf des Timers wieder senden (höchstens 48 Stunden). Der Rechner sagt, welches Verhalten Ihre Konfiguration ergibt.

## Einschränkungen, die der Rechner nennt

Gezählt wird verteilt pro Regional Edge und pro Proxy, daher sehen Sie kurzzeitig womöglich mehr Anfragen als das Limit, bevor sich die Durchsetzung einpendelt. Und wenn Sie Regeln für Server-URLs und API-Endpunkte schichten, werden sie nach dem ersten Treffer in der Reihenfolge ausgewertet, in der Sie sie konfigurieren.

## Ergebnisse teilen

Unter der effektiven Rate erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` jedes Feld: Number, Per Period, Periods, Burst Multiplier, Mitigation Action und den Lockout mit seiner Einheit, jeweils so, wie die Berechnung es liest (ein leerer Burst Multiplier als 1). Jedes Feld wird mitgesendet, auch wenn es dem Standardwert entspricht, sodass ein Link seine Bedeutung behält, falls sich ein Standardwert ändert; die Zahlen nennen kein System und keine Person. Die Seite zeigt beim Öffnen sofort ein Ergebnis, daher steht die Schaltfläche gleich zur Verfügung. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Felder werden gesetzt, als wären sie eingegeben, und das Ergebnis folgt. Ein Link mit einem Wert, den die Seite ablehnen würde, wird als Ganzes ignoriert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
