## Was das Tool tut

Das Tool beantwortet, warum eine DLP-Regel (Data Loss Prevention) ausgelöst hat oder nicht, indem es drei Dinge trennt, die meist in eins zusammenfallen und die jeweils für sich scheitern:

1. **Kandidaten**: wie viele Zeichenfolgen die richtige Form haben
2. **Treffer**: wie viele davon die Prüfsumme bestehen
3. **Schwellenwert**: ob diese Anzahl erreicht, was die Regel verlangt

Eine Regel, die nicht ausgelöst hat, ist an genau einer dieser Stufen gescheitert, und welche es war, sagt Ihnen, was zu ändern ist.

## Warum die Prüfsumme mehr zählt als das Muster

Eine vordefinierte Datenkennung ist kein regulärer Ausdruck. Eine sechzehnstellige Zeichenfolge ist ein *Kandidat*; ob sie als Treffer zählt, hängt von Arithmetik ab.

Diese eine Tatsache erklärt die meisten Diskussionen beim DLP-Tuning. **„Es hat eine Bestellnummer markiert“** ist meist eine Nummer, die zufällig Luhn besteht. **„Es hat eine echte Karte übersehen“** ist meist eine mit vertauschter Ziffer, die an Luhn scheitert und daher für die Engine keine Karte ist. Keine der beiden Beschwerden lässt sich durch eine Diskussion über das Muster beheben.

## Die Kennungen

**Zahlungskarte**: der Luhn-Algorithmus, wie er für Kartennummern festgelegt ist. Beachten Sie, dass gültige Karten dreizehn bis neunzehn Stellen haben; Regeln, die auf sechzehn zugeschnitten sind, übersehen den Rest.

**CPF und CNPJ**: die brasilianischen Kennungen, jede mit zwei Prüfziffern nach Modulo 11. Folgen wiederholter Ziffern wie `111.111.111-11` erfüllen die Arithmetik, werden aber nie vergeben und daher abgewiesen.

Diese drei sind enthalten, weil ihre Validierung ein veröffentlichter, eindeutiger Algorithmus ist. Eine Kennung, deren Regeln nicht öffentlich sind, lässt sich nicht redlich nachbilden.

## Datenschutz

Alles bleibt in Ihrem Browser. Nichts, was Sie einfügen, wird übertragen, gespeichert oder protokolliert; das ist hier wichtiger als bei den meisten Tools, denn es geht ja gerade darum, Inhalte einzufügen, die Sie für sensibel halten.

## Ehrliche Grenzen

**Das ist nicht die Engine von Netskope.** Das Tool bildet den Schritt der Prüfsumme nach, der die Leute überrascht. Schlüsselwörter in der Nähe (Proximity), Wörterbücher, Document Fingerprinting, Exact Data Match, OCR und die Erkennung von Dateitypen liegen alle außerhalb des Umfangs, und keines davon wird angenähert.

Die Formerkennung ist hier bewusst einfach; null Kandidaten bedeutet daher *dieses Tool hat keine gefunden*, nicht *die Plattform würde keine finden*. Außerdem zählt das Tool eine wiederholte Nummer nur einmal; ob eine bestimmte Plattform Vorkommen oder unterschiedliche Werte zählt, ändert das Verhalten des Schwellenwerts, und diese Konfiguration bildet das Tool nicht nach.

## Ergebnisse teilen

Unter der Bewertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen; Ihren Text enthält der Link nie. Im Feld steht, was Sie für sensibel halten: Zahlungskartennummern (eine PAN, „primary account number“, ist laut [Glossar des PCI SSC](https://www.pcisecuritystandards.org/glossary/), abgerufen am 01.11.2026, die „unique payment card number ... that identifies the issuer and the cardholder account“), CPF- und CNPJ-Nummern und die Wörter darum herum. Was die Seite diagnostiziert, ist strukturell, daher enthält der Link nach dem `#` Ersatzwerte: eine Zeile pro Kandidat, in der Reihenfolge der Seite, jede mit den Trennzeichen und der Länge des Kandidaten und mit Ziffern, die die Seite erzeugt (Nullen, die Position des Kandidaten in der Liste und Prüfziffern, die so gewählt sind, dass die Prüfsumme genau so besteht oder scheitert wie beim Kandidaten, bestätigt durch dieselben Prüfungen nach Luhn und Modulo 11, die die Seite ausführt); eine Folge wiederholter Ziffern, die niemandes Nummer ist, geht unverändert mit. Kennung und Schwellenwert gehen ebenfalls mit. Bevor der Link angeboten wird, wertet die Seite die Ersatzwerte erneut aus und muss zur selben Diagnose kommen (dieselben Kandidaten nach Form, Ergebnis und Begründung, dieselbe Anzahl, dieselbe Bewertung und dieselben Befunde), sonst gibt es keinen Link. Ein Text ohne Kandidaten erhält keinen Link, weil sich seine Diagnose auf den Text selbst bezieht. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Ersatzwerte füllen das Feld, Kennung und Schwellenwert werden gesetzt, und die Seite wertet aus; ein Hinweis unter der Bewertung sagt, dass die Nummern Ersatzwerte sind. Ein Link, dessen Zeilen keine Ersatzwerte für ihre Position sind, wird ignoriert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
