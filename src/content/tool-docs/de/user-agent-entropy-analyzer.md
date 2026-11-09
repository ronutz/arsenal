## Was das Tool tut

Fügen Sie einen User-Agent-String ein, und das Tool schlüsselt die identifizierenden Token auf, die er enthält (Browser und Version, Rendering-Engine, Betriebssystem und Version, Geräteklasse und CPU-Architektur), schätzt die unterscheidenden Bits, die jedes davon beiträgt, und zeigt an, ob der String in der reduzierten, eingefrorenen Form vorliegt, die moderne Browser heute senden.

## Worum es geht

Ein User-Agent ist ein kleiner Haufen Entropie. Kein einzelnes Token identifiziert Sie, aber zusammen grenzen sie den Kreis ein, und je detaillierter der String, desto stärker unterscheidet er. Das Tool zeigt diese Fingerprinting-Merkmale ehrlich. Die Bit-Werte dienen der Veranschaulichung und stammen aus veröffentlichter Fingerprinting-Forschung; sie sind keine Live-Messung einer Population. Ziel ist, das Profil dieser Merkmale sichtbar zu machen, nicht, Ihnen eine Note zu geben.

## Wohin die Details gewandert sind

Moderne Browser frieren den User-Agent ein: Chromium setzt die Nebenversion fest auf 0.0.0 und begrenzt die Plattformdetails, und Safari hat einen Großteil seines Strings schon vor langer Zeit festgeschrieben. Die Details sind nicht verschwunden, sondern in die User-Agent Client Hints gewandert (Sec-CH-UA und verwandte Header), die eine Website über den Header Accept-CH aktiv anfordern muss. Die Folge: Die Erfassung von Merkmalen mit hoher Entropie ist jetzt in Headern sichtbar, statt implizit in einem einzigen String zu stecken. Nur Dekodieren und Erklären: Die Eingabe ist ein String, den Sie einfügen; aus Ihrem eigenen Browser wird nichts gelesen, und es wird nichts gesendet.

## Ergebnisse teilen

Unter der Zusammenfassung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den User-Agent so, wie eingegeben (`input`). Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Ein User-Agent-String nennt einen Browser, eine Engine und ein Betriebssystem, und jeder Server, mit dem ein Browser spricht, erhält ihn ohnehin. Das Feld nimmt aber mehrere Zeilen auf, und auch eine ganze Anfrage, aus den Entwicklertools kopiert, wird als User-Agent gelesen. Bevor ein Link angeboten wird, durchläuft der Text daher die Secret-Prüfung der Website: Ist ein Wert seinem Format nach Zugangsdaten (eine `Cookie`-Zeile, [RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitt 4.2.1; Authorization-Zugangsdaten, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2; ein JWS oder JWE; ein Passwort in einer URL; ein privater Schlüssel im PEM-Format; eine AWS-Zugriffsschlüssel-ID), gibt es keinen Link, und das Popover nennt seine Zeile. Fügen Sie nur den User-Agent ein und wählen Sie die Schaltfläche erneut. Ein Wert, dessen Name nur nach einem Secret aussieht, erhält trotzdem einen Link, mit einer Zeile, die ihn nennt.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Text beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Der Text füllt das Feld wie beim Einfügen, und die Seite analysiert ihn; es wird nichts gesendet. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
