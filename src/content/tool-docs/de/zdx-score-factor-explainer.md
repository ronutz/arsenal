# ZDX-Score-Faktoren erklärt

Fügen Sie die Metriken ein, die Zscaler Digital Experience liefert (den zusammengesetzten Score, die Metriken der Web Probe, die Metriken von CloudPath), und lesen Sie, was jede davon ist, nach der Dokumentation des Herstellers selbst: welche Probe-Familie sie misst, was sie bedeutet und wie die dokumentierte Semantik des Scores greift.

## Ehrlicher Rahmen, vorab benannt

Zscaler dokumentiert die Faktoren des ZDX-Scores, den Probe-Rhythmus, die Regel des niedrigsten Werts pro Stunde, die Skala von 0 bis 100 und alle drei Bereiche (Good 66–100, Okay 34–65, Poor 0–33), veröffentlicht die genaue zusammengesetzte Formel aber **nicht**. Dieses Tool **berechnet daher keinen Score aus Metriken**. Es ordnet einen angegebenen Score in die drei dokumentierten Bereiche ein, erklärt die dokumentierte Bedeutung jeder Metrik und ihre Zuordnung zur Probe-Familie und benennt offen, wo die Dokumentation endet. Bei Rohmetriken macht kein veröffentlichter Schwellenwert einen Wert für sich allein gut oder schlecht (die Alarmkriterien von ZDX legen Administratoren pro Regel fest), daher erklärt das Tool die Metrik und verzichtet auf eine Bewertung. Es gilt dieselbe Regel wie für die übrigen Tools der Website: nichts erfinden.

## Eingabegrammatik

Eine Metrik pro Zeile, `metric = value`. Zeilen, die mit `#` beginnen, sind Kommentare.

- `score`: der zusammengesetzte ZDX-Score, eine ganze Zahl von 0 bis 100 (Zscaler rundet jeden Score auf die nächste ganze Zahl)
- `pft`, `dns`, `srt`: Zeiten der Web Probe in Millisekunden (Page Fetch Time, DNS Time, Server Response Time)
- `availability`: Availability der Web Probe, in Prozent von 0 bis 100
- `path-latency`, `path-loss`: Metriken von CloudPath (Millisekunden, Prozent)

## Was Sie erhalten

Jede Metrik erscheint als Auswertungskarte: mit dem Badge ihrer Probe-Familie (Web Probe / CloudPath / zusammengesetzt), ihrer dokumentierten Bedeutung (Page Fetch Time fordert nur das Dokument der obersten Seite an, Server Response Time ist die Zeit bis zum ersten Byte) und, beim Score, der Einordnung in den dokumentierten Bereich Good, Okay oder Poor, bei Poor mit dem Hinweis auf die automatische Ursachenanalyse. Sind beide Probe-Familien vorhanden, erscheint die diagnostische Aufteilung: Schlechte Web-Metriken über einem sauberen Pfad weisen auf die Anwendung hin, ein schlechter Pfad belastet das Netzwerk. Die grundsätzlichen Hinweise enthalten die dokumentierte Semantik, auf der jede Auswertung beruht: Probes alle fünf Minuten; der niedrigste Wert der Stunde als Stundenwert; Scores von Anwendungen mitteln den niedrigsten Wert jedes Benutzers, während Scores von Abteilung, Standort, Stadt und Organisation den niedrigsten Wert jedes Zeitintervalls mitteln; die drei Score-Typen (Synthetic Probe, RUM und Combined), die für dieselbe Anwendung voneinander abweichen können; die Verzögerung der Telemetrie von rund zwanzig Minuten; und die kleine Abweichung zwischen API und Dashboard durch näherungsweise Aggregation.

Alles läuft lokal in Ihrem Browser; nichts, was Sie einfügen, verlässt die Seite.

## Ergebnisse teilen

Am Anfang der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Metriken so, wie eingefügt. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Metriken können beschreiben, wie eine interne Anwendung arbeitet (deshalb ergänzt das Popover einen Warnhinweis). Bevor ein Link angeboten wird, wird das Feld auf Zugangsdaten geprüft, die ein Standard definiert: ein privater Schlüssel im PEM-Format ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), Abschnitt 10), eine `Authorization`-Zeile ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2), eine `Cookie`-Zeile mit einem Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitt 4.2.1), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1), eine AWS-Zugriffsschlüssel-ID oder ein `ENC`-Wert von FortiOS; alle abgerufen am 01.11.2026. Die Grammatik hat für keinen davon einen Platz, aber eine Kommentarzeile ist Freitext. Enthält das Feld einen davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie ersetzen den Wert durch einen Platzhalter und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur wie ein Secret aussieht, verhindert den Link nicht; das Popover nennt den ersten.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Das Feld füllt sich wie beim Einfügen, und die Seite wertet jede Metrik aus. Es wird nichts kontaktiert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Quellen

- [Zscaler Reference Architecture: Zscaler Digital Experience (ZDX)](https://help.zscaler.com/downloads/zdx/reference-architecture/zscaler-digital-experience-zdx/zscaler-digital-experience-zdx-reference-architecture.pdf), zu Probe-Metriken, Rhythmus und der Semantik des niedrigsten Werts pro Stunde und der Mittelung über Gruppen (abgerufen am 09.11.2026)
- [Zscaler Help: Evaluating User Details](https://help.zscaler.com/zdx/evaluating-user-details) (der dokumentierte Bereich Poor von 0 bis 33 und seine automatische Ursachenanalyse; abgerufen am 09.11.2026)
- [Zscaler Help: Understanding the ZDX API](https://help.zscaler.com/legacy-apis/understanding-zdx-api) (die Verzögerung der Telemetrie und die Kalibrierung der Abweichung bei Aggregaten; abgerufen am 09.11.2026)
- [Zscaler Help: Understanding the ZDX Score](https://help.zscaler.com/zdx/understanding-zdx-score) (die Skala von 0 bis 100, die drei Bereiche, die Regeln der Aggregation, das Runden auf ganze Zahlen und die Score-Typen; abgerufen am 26.10.2026)

Die Fragment-Regel hinter „Ergebnisse teilen“ steht in [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.5 (abgerufen am 01.11.2026), und die Zugangsdaten, nach denen die Prüfung sucht, sind in RFC 7468, RFC 9110, RFC 6265 und RFC 7519 definiert (am selben Tag abgerufen).
