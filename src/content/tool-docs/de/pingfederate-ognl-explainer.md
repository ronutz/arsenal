## Was das Tool tut

In PingFederate können Sie OGNL-Ausdrücke in Attribut-Mappings und Ausstellungskriterien (Issuance Criteria) schreiben, für die Fälle, in denen ein einfaches Mapping nicht reicht. Das Tool liest einen solchen Ausdruck, erklärt ihn Konstrukt für Konstrukt und weist dann auf das hin, was eher in der Produktion als im Test schiefgeht. Es läuft in Ihrem Browser und wertet den Ausdruck nie aus.

## Warum die Auswahl des Kontexts wichtig ist

Ein Attribut-Mapping und ein Ausstellungskriterium sind beide Ausdrücke, und sie sollen Verschiedenes zurückgeben. Ein Mapping erzeugt den Wert, der in der Assertion oder im Token weitergegeben wird. Ein Kriterium ergibt true oder false, und die Ausstellung geht nur weiter, wenn es true ist. Das falsche zu wählen ist ein häufiger Konfigurationsfehler, und er fällt nicht laut auf: Ein Kriterium, das eine Zeichenfolge statt eines booleschen Werts zurückgibt, verhält sich so, dass es wie ein Autorisierungsproblem an ganz anderer Stelle aussieht. Die Auswahl gibt es, damit das Tool Ihnen sagen kann, wenn das Geschriebene nicht zu der Stelle passt, an die Sie es setzen.

## Was das Tool erklärt

Erkannt werden die Konstrukte, die in echten Mappings vorkommen: ein Attribut nach Namen lesen, es auf null prüfen, einen Wert in eine Zeichenfolge umwandeln, die Groß- und Kleinschreibung normalisieren, die Zeichenfolgenoperationen, die eine Domain von einem Benutzernamen abtrennen oder Whitespace bereinigen, den ein Verzeichnis seit 2004 mitschleppt, Bedingungen, die einen Standardwert liefern, Map-Literale, die Gruppennamen aus dem Verzeichnis in Rollennamen der Anwendung übersetzen, sowie die Projektionen und Auswahlen, die mehrwertige Attribute wie Gruppenmitgliedschaften behandeln.

## Die Diagnosen, und warum es jede gibt

**Attribute, die ohne Null-Prüfung gelesen werden.** Das ist die mit Abstand häufigste Ursache dafür, dass ein Ausdruck im Test funktioniert und in der Produktion scheitert, und der Grund ist unspektakulär: Die Konten für den Test sind ordentlicher als das Verzeichnis. Ein Attribut, das im eigenen Konto immer vorhanden ist, ist nicht in allen Konten vorhanden; fehlend ist nicht dasselbe wie leer, und beides kommt vor. Das Tool nennt die Attribute, die es gelesen sieht, damit Sie entscheiden können, bei welchen Sie sich tatsächlich sicher sind.

**Statische Java-Methodenaufrufe.** Konstrukte wie `@java.lang.String@format` werden unterstützt und sind manchmal genau richtig. Sie sind aber auch der Grund, warum das Schreiben von Ausdrücken im Produkt eine eigene Administratorrolle ist: Dasselbe Konstrukt, das ein Datum formatiert, kann noch sehr viel mehr erreichen als ein Datum. Die Kennzeichnung ist kein Rat, es zu entfernen, sondern ein Hinweis, dass dieser Ausdruck etwas tut, was nur die Rolle für Ausdrücke können sollte.

**Ein Kriterium ohne jeden Vergleich.** Enthält ein Ausstellungskriterium keinen Vergleich, keinen Mitgliedschaftstest und keinen Musterabgleich, gibt es wahrscheinlich keinen booleschen Wert zurück, sondern irgendetwas anderes.

**Ein Mapping, das ein Attribut nur durchreicht.** Legitim, und meist ganz ohne Ausdruck zu erreichen. Das ist vorzuziehen, wo es geht, denn ein einfaches Mapping ist für alle Administratoren sichtbar, während ein Ausdruck nur von der Rolle für Ausdrücke bearbeitet werden kann, und wer ihn irgendwann debuggt, hat diese Rolle womöglich nicht.

**Ausdrücke, die lang geworden sind.** Lange Ausdrücke sind schwer zu prüfen, noch schwerer zu übergeben und für alle ohne die Rolle für Ausdrücke unsichtbar, und dazu gehören die meisten, die einmal für sie verantwortlich sein werden.

## Warum das Tool nie auswertet

Ein Tool, das Ausdrücke erklärt und sie dabei auswertet, wäre ein Dienst zur Codeausführung, und genau diese Eigenschaft macht das Schreiben von Ausdrücken in PingFederate selbst zu einem geschützten Recht. Das Tool parst und beschreibt. Wenn Sie wissen wollen, was ein Ausdruck für einen bestimmten Benutzer zurückgibt, finden Sie das mit einer Testverbindung in einer Nicht-Produktivumgebung heraus, nicht auf einer Webseite.

## Ergebnisse teilen

Ganz oben in der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Ausdruck so, wie eingegeben, und, wenn es ein Ausstellungskriterium ist, wo er verwendet wird (ein Attribut-Mapping ist der Standard und wird daher weggelassen). Das Popover nennt zuerst, was der Link enthält, dann einen eigenen Warnhinweis: Ausdrücke nennen echte Attribute und manchmal echte Gruppen, lesen Sie ihn also, bevor Sie den Link senden. Dann bietet es „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Findet die Secret-Prüfung der Website in einem Ausdruck Zugangsdaten in einer Schreibweise, die sie an ihrer Form erkennt, gibt es keinen Link, und das Popover nennt sie und ihre Zeile: ein privater Schlüssel im PEM-Format, ein Authorization-Header, eine AWS-Zugriffsschlüssel-ID, ein JWT, ein Passwort in einer URL oder ein `ENC`-Wert von FortiOS. Setzen Sie einen Platzhalter an seine Stelle und wählen Sie die Schaltfläche erneut; die Seite erklärt so oder so dieselben Konstrukte.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher werden die Werte beim Öffnen des Links nicht an den Server gesendet. Sie bleiben in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Ausdruck und Kontext füllen die Seite, die ihn wie beim Einfügen erklärt; wie immer wird nichts ausgewertet, und es wird nichts gesendet. Ein Kontext, den die Seite nicht anbietet, oder ein Ausdruck mit Zugangsdaten führt dazu, dass der ganze Link ignoriert wird. In beiden Fällen verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
