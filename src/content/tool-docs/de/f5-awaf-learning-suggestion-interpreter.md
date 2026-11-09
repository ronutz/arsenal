## Was das Tool tut

Beschreiben Sie einen Vorschlag aus Traffic Learning von F5 AWAF (Advanced WAF, früher BIG-IP ASM, Application Security Manager): seine Aktion, seinen Learning Score, das durchschnittliche Violation Rating, den Lernmodus und ob der Datenverkehr dahinter vertrauenswürdig ist. Das Tool zeigt Ihnen, ob die Annahme des Vorschlags die Richtlinie lockert oder verschärft, ob eine Lockerung ein echtes False Positive behebt oder die Sicherheit lockert und ob das automatische Lernen ihn gleich für Sie durchsetzt. Es ist die Brücke zwischen der Abschätzung der Lernvergiftung und der Triage von False Positives und läuft vollständig in Ihrem Browser.

## Lockern oder verschärfen

F5 teilt Vorschläge in zwei Richtungen ein. Verschärfende Vorschläge machen die Richtlinie spezifischer: eine Wildcard entfernen und explizite Entitäten hinzufügen, eine Entität im Staging durchsetzen, ein Attribut präzisieren. Sie anzunehmen verbessert in der Regel die Sicherheit. Lockernde Vorschläge lockern die Richtlinie: eine zulässige Entität hinzufügen, ein Metazeichen zulassen, ein Attribut lockern, eine Violation oder eine Signatur deaktivieren. Eine legitime Entität hinzuzufügen, die die Richtlinie einfach noch nicht gelernt hatte, ist risikoarm, aber eine Lockerung, die die Durchsetzung verringert, verlangt Urteilsvermögen, und das Tool urteilt anhand des Violation Rating: 1 oder 2 behebt wahrscheinlich ein False Positive, 3 muss untersucht werden, 4 oder 5 bedeutet, dass Sie einen echten Angriff durchlassen würden.

## Der Learning Score und der Weg zur Vergiftung

Jeder Vorschlag hat einen Learning Score, der zeigt, wie nahe das System daran ist, ihn anzunehmen, und der Score steigt, je niedriger das Violation Rating ist. Die Vorschläge mit dem niedrigsten Rating, also diejenigen, die am wahrscheinlichsten False Positives sind, erreichen die automatische Annahme deshalb am schnellsten. Das ist so gewollt, aber genau das treibt auch ein Angreifer nach oben, der viele Violations mit niedrigem Rating einspeist. Ist der Modus Automatic, verringert die Lockerung die Durchsetzung, ist der Datenverkehr nicht vertrauenswürdig und steigt der Score, markiert das Tool diesen Weg zur Vergiftung und verweist Sie auf die Abschätzung der Lernvergiftung, um zu sehen, wie weit der Schwellenwert für die automatische Annahme noch entfernt ist. Beim Lernen im Modus Manual muss ein Mensch jeden Vorschlag akzeptieren, daher wird nichts ohne Prüfung durchgesetzt.

## Die Disziplin

Bei jeder Lockerung, die die Durchsetzung verringert, wiederholt das Tool die Regel von F5: Lockern Sie die Richtlinie nur dort, wo ein False Positive aufgetreten ist, nie dort, wo ein echter Angriff die Violation verursacht hat. Am Violation Rating erkennen Sie, welcher Fall vorliegt, und deshalb bestimmt es die Bewertung.

## Grundlagen

Die Kategorien Lockern und Verschärfen stammen aus K03513854 von F5; das Verhalten des Learning Score, die automatische Übernahme bei 100 % im Modus Automatic und die Disziplin bei False Positives stammen aus der Dokumentation zum Lernen in ASM und aus K70544352. Das Tool bildet dokumentiertes Verhalten ab und hängt nicht vom genauen (je nach Version unterschiedlichen) JSON der Vorschläge in der REST-API ab; Sie beschreiben den Vorschlag anhand des Bildschirms Traffic Learning. Nichts, was Sie auswählen, verlässt die Seite.

## Ergebnisse teilen

Unter der Bewertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die fünf Auswahlen mit ihren IDs: `action`, `score` (0 bis 100), `rating` (1 bis 5 oder `na`), `mode` und `trust`. Alle fünf werden immer übertragen, sodass der Link dieselbe Auswertung öffnet. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` steht, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Öffnen eines Links.** Die fünf Auswahlen werden gesetzt, und die Seite rechnet wie bei einer Änderung. Eine Auswahl, die die Seite nicht anbietet, führt dazu, dass der ganze Link ignoriert wird. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
