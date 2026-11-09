## Was das Tool tut

Geben Sie dem Tool Beginn und Ende der Gültigkeit eines Zertifikats, also `notBefore` und `notAfter`, und es ermittelt die praktischen Folgen: wie lange das Zertifikat gültig ist, in welcher Phase des Zeitplans des CA/Browser Forum für sinkende Gültigkeitsdauern es ausgestellt wurde und ob seine Laufzeit unter die Obergrenze dieser Phase passt, wie viele Erneuerungen pro Jahr dieser Rhythmus bedeutet, wie lange die Domain- und Identitätsvalidierung in diesem Zeitraum wiederverwendet werden darf, sowie eine empfohlene Vorlaufzeit und das Datum für „Spätestens am … erneuern“. Es ist reine Datumsrechnung und läuft vollständig offline.

## Warum Zertifikatslaufzeiten sinken

Öffentlich vertrauenswürdige TLS-Zertifikate werden seit Jahren kürzer, und das CA/Browser Forum legt mit Ballot SC-081v3 einen Zeitplan fest, der die maximale Gültigkeit stufenweise von 398 Tagen über 200 und 100 Tage bis 2029 auf 47 Tage senkt. Kürzere Zertifikate begrenzen, wie lange ein kompromittiertes oder fehlerhaft ausgestelltes Zertifikat nutzbar bleibt, machen eine manuelle Erneuerung aber auch unpraktikabel, und genau darum geht es: Der Zeitplan erzwingt praktisch die Automatisierung. Zwei verwandte Fristen schrumpfen mit der Gültigkeit: der Zeitraum, für den eine Validierung der Domainkontrolle (DCV) wiederverwendet werden darf, und der Zeitraum, für den validierte Identitätsangaben zum Zertifikatsinhaber (SII, Subject Identity Information) wiederverwendet werden dürfen. Ein größerer Teil des Verfahrens muss also öfter wiederholt werden.

## Was der Plan Ihnen sagt

Aus nur zwei Daten leitet das Tool das ganze Bild ab:

- die **Gültigkeitsdauer** und die Phase von SC-081v3, der sie entspricht, mit einem klaren Ja oder Nein, ob die Dauer innerhalb der Obergrenze dieser Phase liegt;
- den **Erneuerungsrhythmus** als Erneuerungen pro Jahr, für die aktuelle und für jede künftige Obergrenze, sodass Sie sehen, wie der Aufwand wächst;
- die **Fristen für die Wiederverwendung von DCV und SII**, die für den Ausstellungszeitraum gelten; und
- eine **empfohlene Vorlaufzeit für die Erneuerung** und das daraus folgende Datum für „Spätestens am … erneuern“, damit eine Erneuerung vor dem Ablauf abgeschlossen ist und nicht auf den letzten Drücker.

## Die eigentliche Antwort ist Automatisierung

Weil dieser Zeitplan bei einem 47-Tage-Zertifikat endet, skaliert es nicht, jedes Zertifikat viele Male im Jahr von Hand zu erneuern. Die übliche Antwort ist das Protokoll ACME (RFC 8555), die automatisierte Ausstellung und Erneuerung, die Tools wie certbot nutzen; die Zahlen des Planers zum Rhythmus sind eigentlich ein Argument dafür, es einzuführen.

## Verwendung

Geben Sie die Daten `notBefore` und `notAfter` des Zertifikats ein und lesen Sie Gültigkeit, Passung zum Zeitplan, Erneuerungsrhythmus, Fristen für die Wiederverwendung und das empfohlene Erneuerungsdatum ab. Die Berechnung ist eine reine Funktion dieser beiden Daten; ob ein Zertifikat gerade jetzt abgelaufen ist, wird getrennt angezeigt, gemessen an der Uhr Ihres Geräts.

## Ergebnisse teilen

Am Ende der Zusammenfassung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die beiden Daten, Ausstellung und Ablauf: `/tools/cert-renewal-planner#input=2026-01-01&notafter=2027-02-02`. Die verbleibenden Tage enthält er nicht: Die Seite zählt sie nach der Uhr dessen, der den Link öffnet. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher werden die Daten beim Öffnen des Links nicht an den Server gesendet. Sie bleiben in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Öffnen eines Links.** Beide Daten werden gesetzt, und die Seite plant. Jedes muss ein tatsächlich existierender Tag in der Form JJJJ-MM-TT sein, der einzigen Form, die ein Datumsfeld annimmt; alles andere führt dazu, dass der ganze Link ignoriert wird. In beiden Fällen verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
