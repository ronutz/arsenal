## Was das Tool tut

Zwei Richtungen, automatisch erkannt. Fügen Sie griechischen Text ein, und das Tool zerlegt ihn Buchstabe für Buchstabe (Name, Transliteration, der Hinweis auf das Schluss-Sigma, wo er zutrifft) und transliteriert das Ganze. Geben Sie Buchstabennamen ein (lambda; mu omega), und das Tool erzeugt die Zeichen mit ihren Verwendungshinweisen. Unter dem Konverter steht die vollständige Referenztabelle der 24 Buchstaben: Zeichenpaar, Name, moderne Umschrift mit der klassischen Form in Klammern, wo sie abweicht, und die Stelle, an der man in der Technik jedem Buchstaben am ehesten begegnet ist.

## Der Bezug zur Technik

Das griechische Alphabet ist das zweite Alphabet jedes technischen Fachs: Das kleine My steht für Mikro, das große Omega für Ohm, Lambda für die Wellenlänge und den Lambda-Kalkül, das große Sigma summiert, das kleine steht für die Standardabweichung, und das große Delta ist die Änderung selbst. Die Tabelle sagt, wo sich jeder Buchstabe nützlich macht.

## Transliteration, offen benannt

Das Tool folgt dem verbreitet gelehrten modernen Schema (Beta zu v, Eta zu i); wo die klassische Umschrift abweicht (Beta zu b, Eta zu e), werden beide gezeigt, denn ein Tool, das stillschweigend eine wählt, rät an Ihrer Stelle.

## Ergebnisse teilen

Unter der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen und sobald die Seite eine Auswertung hat; ein Text, den sie ablehnt, hat keine, die sich teilen ließe. Der Link enthält nach dem `#` das Feld so, wie eingegeben (griechischen Text oder Buchstabennamen). Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Öffnen eines Links.** Der Text füllt das Feld wie beim Einfügen, und die Seite zerlegt ihn oder setzt die Zeichen zusammen. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
