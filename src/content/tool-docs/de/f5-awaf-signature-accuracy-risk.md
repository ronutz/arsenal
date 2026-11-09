## Was das Tool tut

Lesen Sie die beiden Eigenschaften ab, die F5 für jede Angriffssignatur in F5 AWAF (Advanced WAF, früher BIG-IP ASM, Application Security Manager) veröffentlicht: Genauigkeit (Accuracy) und Risiko (Risk). Geben Sie dazu an, ob die Signatur Ihre Systeme überhaupt betrifft und ob sie durchgesetzt wird, und das Tool zeigt Ihnen, wie anfällig die Signatur für False Positives ist, wie viel Schaden ein echter Treffer anrichten würde und welcher Tuning-Schritt daraus folgt. Es ist deterministisch und läuft vollständig in Ihrem Browser.

## Warum Eigenschaften und keine Suche nach Signatur-IDs

Der Signatursatz von F5 ist proprietär und riesig, daher wäre eine Datenbank pro ID weder machbar noch ehrlich. F5 dokumentiert aber, was Accuracy und Risk für jede Signatur bedeuten, und genau diese beiden Eigenschaften bestimmen das Tuning von False Positives; deshalb arbeitet das Tool mit ihnen. Sie lesen Accuracy, Risk und Systems direkt aus dem Eintrag der Signatur in der Richtlinie ab.

## Genauigkeit ist Anfälligkeit für False Positives

F5 definiert die Genauigkeit als die Fähigkeit einer Signatur, den Angriff zu erkennen, einschließlich ihrer Anfälligkeit für Fehlalarme (False Positives), und hält klar fest, dass eine höhere Genauigkeit zu weniger False Positives führt. Eine Signatur mit Accuracy Low hat also eine hohe Wahrscheinlichkeit für False Positives, Medium eine gewisse und High eine geringe. Das Risiko ist eine eigene Achse: der mögliche Schaden, wenn der Angriff gelingt, von Aufklärung (Low) über die Offenlegung sensibler Daten oder mäßigen Schaden (Medium) bis zur vollständigen Kompromittierung des Systems oder zu Denial of Service (High).

## Der Quadrant aus Genauigkeit und Risiko

Das Tool ordnet die Signatur in eine 2x2-Matrix ein. Niedrige Genauigkeit und niedriges Risiko ergeben den Hauptkandidaten zum Lockern: häufige False Positives, wenig Verlust durch das Lockern. Niedrige Genauigkeit und hohes Risiko bedeuten anfällig für False Positives, aber gefährlich; Sie untersuchen daher die tatsächliche Anfrage, bevor Sie deaktivieren, statt einen möglichen echten Angriff durchzuwinken. Hohe Genauigkeit und hohes Risiko sind ein verlässlicher Block mit viel auf dem Spiel, den Sie nicht lockern. Hohe Genauigkeit und niedriges Risiko sind verlässlich, aber mit wenig Schadenspotenzial. Das Tool markiert außerdem eine Signatur, die auf ein System zielt, das Ihre Anwendung nicht nutzt, als reines Rauschen, und zeigt die Genauigkeit als Stellschraube: Da die Genauigkeit ein Filterkriterium für Signatursätze ist, erzeugt ein Satz, der auf Signaturen mit höherer Genauigkeit ausgerichtet ist, weniger False Positives.

## Grundlagen

Die Definitionen von Genauigkeit und Risiko stammen aus der Dokumentation Working with Attack Signatures von F5 und der klassischen Referenz zu Angriffssignaturen von BIG-IP ASM (die die niedrige, mittlere und hohe Wahrscheinlichkeit für False Positives ausführt sowie die Eingrenzung von Signatursätzen nach System und Genauigkeit), dazu aus K70544352 zur Reduzierung von False Positives. Nichts, was Sie auswählen, wird hochgeladen oder verlässt die Seite.

## Ergebnisse teilen

Unter der Bewertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die vier Auswahlen mit ihren IDs: `accuracy`, `risk`, `system` und `enforcement`. Alle vier werden immer übertragen, sodass der Link dieselbe Auswertung öffnet. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` steht, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Öffnen eines Links.** Die vier Auswahlen werden gesetzt, und die Seite rechnet wie bei einer Änderung. Eine Auswahl, die die Seite nicht anbietet, führt dazu, dass der ganze Link ignoriert wird. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
