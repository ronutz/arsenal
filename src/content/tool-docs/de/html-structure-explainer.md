## Was das Tool tut

Das Tool liest HTML (ein ganzes Dokument oder ein Fragment) mit demselben Parser, den Browser laut Spezifikation verwenden, und zeigt, was dabei herauskommt: den Baum (jedes Element, jeden Textknoten und jeden Kommentar, eingerückt nach Tiefe, mit der Zeile seines Tags), die Elemente, die der Parser ohne Tag erzeugt hat, die End-Tags, die er ergänzt hat, die Formatierungselemente, die er aufgeteilt hat, den Inhalt, den er aus einer Tabelle verschoben hat, den Dokumentmodus (No-Quirks, Limited-Quirks oder Quirks), DOCTYPE, Titel, Sprache und Kodierung, die das Dokument deklariert, jeden Parse-Fehler mit dem Code des Standards samt Zeile und Spalte, die Gliederung der Überschriften und eine Liste von Befunden zu Struktur und Barrierefreiheit, jeder an einen Satz des HTML Standard oder von WCAG 2.2 gebunden. Außerdem zählt es, was ausgeführt worden wäre und nicht ausgeführt wurde: script-Elemente, Inline-Event-Handler, javascript:-URLs, style-Elemente, iframes.

Der Parser ist parse5, der spezifikationskonforme HTML-Parser, den jsdom, Cheerio und der Angular-Compiler verwenden; er läuft mit Quellpositionen, mit eingeschaltetem Callback für Parse-Fehler und mit ausgeschaltetem Scripting-Flag (so, wie DOMParser parst). Es wird nichts ausgeführt, abgerufen oder gerendert. Die gehostete API führt denselben Code aus und liefert denselben Baum.

## Den Baum lesen

- Ein **Punkt** in der Zeilenspalte markiert einen Knoten ohne Position im Quelltext: Der Parser hat ihn erzeugt. Der Standard: „Omitting an element's start tag in the situations described below does not mean the element is not present; it is implied, but it is still there.“ Das Element ist also trotzdem da, nur implizit. Üblich sind html, head, body und tbody.
- **Ende ergänzt** markiert ein Element, dessen End-Tag nicht im Quelltext steht. Bei 19 Elementen erlaubt der Standard das (13.1.2.4 Optional tags: html, head, body, li, dt, dd, p, rt, rp, optgroup, option, colgroup, caption, thead, tbody, tfoot, tr, td, th); bei jedem anderen Element heißt es, dass das End-Tag fehlte oder ein anderes End-Tag das Element zuerst geschlossen hat, und Befund D13 sagt, welches.
- **Teil n** markiert das Ergebnis des Adoption Agency Algorithm: Schließt ein End-Tag ein Formatierungselement (a, b, i, em, strong, font, small, s, u, code, nobr, big, tt, strike), das nicht das innerste offene Element ist, schließt der Parser es und öffnet um das Folgende eine Kopie neu; aus einem Element im Quelltext werden so mehrere (Befund D14).
- **verschoben** markiert Foster Parenting: Text oder Elemente, die innerhalb einer Tabelle stehen, wo nur Tabellenteile vorkommen dürfen, werden vor der Tabelle eingefügt (Befund D15).
- **void** markiert die 13 Elemente, die nie ein End-Tag haben (area, base, br, col, embed, hr, img, input, link, meta, source, track, wbr). Ein abschließender Schrägstrich ist bei ihnen „unnecessary and has no effect of any kind“, also überflüssig und wirkungslos; bei jedem anderen HTML-Element ist er ein Parse-Fehler, und das Element bleibt offen.

## Die Parse-Fehler

Der Standard legt die Fehlerbehandlung genau fest, daher hat auch ein Dokument mit Fehlern genau einen Baum: „Parse errors are only errors with the syntax of HTML.“ Seine Tabelle der benannten Fehler (13.2.2) enthält 52 Codes, jeder mit einer nicht normativen Beschreibung; die Seite zitiert die Beschreibung neben jedem Fehler. Die Fehler beim Aufbau des Baums (ein verirrtes End-Tag, am Ende offen gebliebene Elemente, ein zweites body) beschreibt der Standard im Fließtext ohne Codes; parse5 benennt sie selbst (missing-doctype, end-tag-without-matching-open-element, open-elements-left-after-eof und neun weitere), und die Seite kennzeichnet, welche Instanz den jeweiligen Code vergeben hat.

## Die Befunde

D1 kein DOCTYPE und D2 ein Legacy-DOCTYPE (Quirks-Modus); D3 kein lang am Wurzelelement (WCAG 3.1.1); D4 der Titel fehlt, ist mehrfach vorhanden oder leer (Inhaltsmodell von head, WCAG 2.4.2); D5 die Deklaration der Zeichenkodierung fehlt, steht hinter den ersten 1024 Byte oder ist nicht UTF-8; D6 img ohne alt und D7 img mit leerem alt (WCAG 1.1.1 und die Regeln des Standards zu Alternativtext); D8 ein Link oder eine Schaltfläche, die nur aus Bildern ohne Alternativtext besteht; D9 Sprünge in den Überschriften und ein fehlendes h1 (4.3.11: „less than, equal to, or 1 greater“); D10 doppelte ids; D11 und D12 die veralteten Elemente und Attribute aus Abschnitt 16.2, jeweils mit der Ersatzempfehlung des Standards; D13 bis D16, was der Parser repariert hat; D17 ein beschriftbares Bedienelement ohne Beschriftung; D18, was nicht ausgeführt wurde; D19 leere Überschriften (WCAG 2.4.6); D20 die Elemente, die der Parser erzeugt hat.

## Ergebnisse teilen

Unter der Bewertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das HTML so, wie eingefügt: Baum, Parse-Fehler und Befunde hängen von jedem seiner Zeichen ab, daher lässt sich nichts ersetzen, ohne die Auswertung zu ändern. Das Popover nennt zuerst, was der Link enthält, dann einen eigenen Warnhinweis (eingefügtes HTML kann interne Hosts und Pfade nennen), und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Der Schalter „Attributwerte vollständig anzeigen“ wird nicht übertragen.

Eine aus einer angemeldeten Sitzung gespeicherte Seite kann trotzdem Zugangsdaten enthalten, daher durchläuft der Text die Secret-Prüfung der Website, bevor ein Link angeboten wird. Ist ein Wert seinem Format nach ein Secret, gibt es keinen Link, und das Popover nennt seine Zeile: ein privater Schlüssel im PEM-Format ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), Abschnitte 10 und 11), ein JWS oder JWE ([RFC 7515](https://www.rfc-editor.org/rfc/rfc7515), Abschnitt 7.1, die Serialisierung, die JWTs verwenden, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), Authorization-Zugangsdaten als Header-Zeile ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1) oder eine AWS-Zugriffsschlüssel-ID. Setzen Sie einen Platzhalter an seine Stelle und wählen Sie die Schaltfläche erneut. Ein Wert, dessen Name nur wie ein Secret aussieht (ein JSON-Eintrag wie `apiToken`), erhält trotzdem einen Link, und der Warnhinweis nennt seine Zeile, damit Sie sie zuerst prüfen.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird das HTML beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Das HTML ersetzt den Inhalt des Feldes wie beim Einfügen, und die Seite parst es; es wird nichts ausgeführt, abgerufen oder gerendert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Grenzen

- parse5 8.0.1 implementiert den Standard auf dem Stand seines Releases. Die Tokenisierung von Verarbeitungsanweisungen, die der Standard 2026 ergänzt hat, fehlt darin: `<?…>` wird unter dem früheren Namen unexpected-question-mark-instead-of-tag-name gemeldet und zu einem Kommentar, was auch der aktuelle Standard bei einem xml-Ziel tut.
- Die Befunde lesen die Struktur, nicht die Bedeutung: Ob ein Alternativtext gut ist, ob eine Überschrift ihren Abschnitt beschreibt oder ob ein Sprachtag in lang stimmt, kann ein Parser nicht beantworten. headingoffset und headingreset werden auf die Gliederung nicht angewendet.
- Die Liste des Baums endet bei 2.000 Knoten (die Zählungen umfassen alles); Eingaben über 200.000 Zeichen werden abgelehnt.

## Quellen

- [HTML Living Standard, 13 The HTML syntax: 13.2.2 Parse errors](https://html.spec.whatwg.org/multipage/parsing.html#parse-errors) (abgerufen am 05.10.2026)
- [HTML Living Standard, 4.3.11 Headings and outlines](https://html.spec.whatwg.org/multipage/sections.html#headings-and-outlines) (abgerufen am 05.10.2026)
- [HTML Living Standard, 16.2 Non-conforming features](https://html.spec.whatwg.org/multipage/obsolete.html#non-conforming-features) (abgerufen am 05.10.2026)
- [WCAG 2.2, W3C Recommendation 12 December 2024](https://www.w3.org/TR/WCAG22/) (abgerufen am 05.10.2026)
- [parse5](https://github.com/inikulin/parse5) (abgerufen am 05.10.2026)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 01.11.2026): Abschnitt 3.5, das Fragment, das ein Link von „Ergebnisse teilen“ verwendet
