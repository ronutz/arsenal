## Was das Tool tut

Wählen Sie eine Violation, die Sie in F5 AWAF (Advanced WAF, früher BIG-IP ASM, Application Security Manager) triagieren: ihre Kategorie, ihr durchschnittliches Violation Rating und ob die Prüfung durchgesetzt wird, im Staging ist oder zu einer Richtlinie im Modus Transparent gehört. Das Tool liefert die Bewertung von F5 auf Grundlage des Ratings, ob die Violation gerade Datenverkehr blockiert, und die eng begrenzte Behebung für diese Kategorie, falls sich herausstellt, dass es ein echtes False Positive ist. Es ist das Gegenstück zur Abschätzung der Lernvergiftung: Jenes Tool warnt vor zu starkem Lockern, dieses zeigt, wie man ein echtes False Positive richtig lockert. Es ist deterministisch und läuft vollständig in Ihrem Browser.

## Die Bewertung ergibt sich aus dem Rating

Advanced WAF weist jeder Transaktion ein Violation Rating von 1 bis 5 zu, und dieses Rating entscheidet, wie ein vermutetes False Positive zu behandeln ist. Ratings von 4 oder 5 sind wahrscheinlich echte Angriffe und blockieren selbst dann, wenn das Block-Flag jeder Violation ausgeschaltet ist; daher rät das Tool, den Vorschlag zu verwerfen, ohne die Richtlinie zu ändern. Ein Rating von 3 ist mehrdeutig und muss zuerst im Event Log untersucht werden. Ratings von 1 und 2 sind meist echte False Positives; daher rät das Tool, die eng begrenzte Korrektur anzuwenden (oder den Lernvorschlag zu akzeptieren), sobald Sie bestätigt haben, dass die Anfrage legitim ist.

## Das Tool berücksichtigt Staging und den Modus Transparent

Ob eine Violation tatsächlich blockiert, hängt von der Durchsetzung ab. Das Tool kennzeichnet eine Violation nur dann als blockierend, wenn die Richtlinie im Modus Blocking ist und das Rating 4 oder 5 beträgt. Eine Signatur im Staging protokolliert, blockiert aber nicht, und eine Richtlinie im Modus Transparent blockiert nichts; in diesen Fällen weist das Tool darauf hin, dass das False Positive ein Lernsignal und keine gestörte Benutzererfahrung ist und dass die Korrektur für den Zeitpunkt zählt, an dem die Durchsetzung eingeschaltet wird.

## Die Behebung ist immer eng begrenzt

Für jede Violation-Kategorie nennt das Tool die dokumentierte Korrektur, und jede Option ist auf die betreffende URL oder den betreffenden Parameter begrenzt, nie eine Deaktivierung für die ganze Richtlinie. Eine Signatur für eine URL deaktivieren, eine zulässige Entität hinzufügen, ein Metazeichen zum Zeichensatz dieser Entität hinzufügen, eine bestimmte Länge erhöhen, einen Parameter als Datei-Upload kennzeichnen, ein XML- oder JSON-Inhaltsprofil zuordnen oder Potential False Positive Detection aktivieren: All das sind eng begrenzte Aktionen. Das Tool wiederholt immer die Disziplin, die für das Ganze gilt: Lockern Sie nur dort, wo tatsächlich ein False Positive aufgetreten ist, nie dort, wo ein echter Angriff die Violation verursacht hat.

## Grundlagen

Die Logik vom Rating zur Aktion und die eng begrenzten Behebungen stammen aus K70544352 von F5 (Reducing false positive violations), aus der Dokumentation Working with Violations von BIG-IP ASM (die festlegt, wie das Rating das Blockieren steuert und welche Violations nicht lernbar sind) und aus der Anleitung Refining Security Policies with Learning. Nichts, was Sie auswählen, wird hochgeladen oder verlässt die Seite. Prüfen Sie eine Änderung in der Produktion gegen die Dokumentation und die konkrete Anfrage in Ihrem Event Log.

## Ergebnisse teilen

Unter der Bewertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die drei Auswahlen mit ihren IDs: `category`, `rating` und `state`. Alle drei werden immer übertragen, sodass der Link dieselbe Triage öffnet, auch wenn sich die Ausgangsauswahl der Seite ändert. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` steht, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Öffnen eines Links.** Die drei Auswahlen werden gesetzt, und die Seite rechnet wie bei einer Änderung. Eine Auswahl, die die Seite nicht anbietet, führt dazu, dass der ganze Link ignoriert wird. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
