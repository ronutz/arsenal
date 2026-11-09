## Was das Tool tut

Text kann weit mehr enthalten, als er zeigt. Ein Leerzeichen ohne Breite sitzt spurlos zwischen zwei Buchstaben, ein Right-to-Left Override lässt eine Codezeile in einer anderen Reihenfolge erscheinen als der, die der Compiler liest, ein kyrillisches „а“ geht als lateinisches „a“ durch, und ein Zeilentrennzeichen beginnt in Ihrem Editor eine neue Zeile, in Ihrem Parser aber nicht. Der Inspektor zeigt, was wirklich da ist, Codepunkt für Codepunkt.

Er hat vier Modi:

- **Text untersuchen** zählt den Text, sagt, ob etwas einen genaueren Blick verdient, listet nach Art auf, was gefunden wurde, markiert bidirektionale Steuerzeichen, die am Zeilenende offen geblieben sind, und Wörter, die Schriften mischen, stellt den Text in der gespeicherten Reihenfolge dar, jedes versteckte Zeichen als Markierung, listet jeden Codepunkt auf, bietet eine bereinigte Kopie an und schreibt den Text als Escape-Sequenzen in acht Sprachen.
- **Ein Codepunkt** nimmt einen Codepunkt in beliebiger Schreibweise an (`U+00E9`, `é`, `0xE9`, `&eacute;`, `\u00e9`, `zero width space`, `BOM`) und zeigt Namen und Aliasse, Eigenschaften, Kodierungen, Escape-Sequenzen und Wissenswertes dazu.
- **Nach Namen suchen** listet die Codepunkte auf, deren Name oder Alias Wörter enthält, die mit den eingegebenen Wörtern beginnen.
- **Normalisieren** zeigt einen Text in NFC, NFD, NFKC und NFKD mit den Codepunkten und UTF-8-Bytes jeder Form und vergleicht ihn in jeder Form mit einem zweiten Text.

## Was das Tool in einem Text meldet

| Befund | Was es ist | Warum es zählt |
|---|---|---|
| Bidirektionales Steuerzeichen | Eines der zwölf Zeichen mit Bidi_Control (LRM, RLM, ALM, LRE, RLE, LRO, RLO, PDF, LRI, RLI, FSI, PDI) | Ändert die angezeigte Reihenfolge des umgebenden Texts; die Angriffsklasse Trojan Source (CVE-2021-42574) |
| Am Zeilenende offen | Ein Embedding, Override oder Isolate ohne PDF oder PDI vor dem Zeilenende | Alles danach in dieser Zeile kann in einer anderen Reihenfolge angezeigt werden, als es gelesen wird |
| Unsichtbar | Default_Ignorable_Code_Point: Zeichen ohne Breite, die BOM, Variantenselektoren, Tag-Zeichen | Wird als nichts dargestellt, aber Zeichenfolgenvergleiche, Längen und Hashwerte sehen es |
| Steuerzeichen | Ein Steuercode außer TAB, LF und CR | Kein Text; Tools verwerfen ihn, zeigen ein Kästchen oder brechen ab |
| Zeilenumbruch außer LF oder CR | VT, FF, NEL (U+0085), LINE SEPARATOR (U+2028), PARAGRAPH SEPARATOR (U+2029) | Ein Editor und eine Sprache können uneins darüber sein, wo eine Zeile endet (UTS #55, Line-Break-Spoofing) |
| Einzelnes Surrogat, Nichtzeichen | Codepunkte, die keine Zeichen sind | Ungültig in UTF-8 (Surrogate) oder nie für den Austausch gedacht (Nichtzeichen) |
| Private Nutzung, nicht zugewiesen | Keine öffentliche Bedeutung oder noch kein Zeichen | Schriftarten und Systeme unterscheiden sich, oder der Text stammt aus einer neueren Unicode-Version als Ihre |
| Ersatzzeichen | U+FFFD | Markiert oft einen früheren Dekodierfehler |
| Nicht-ASCII-Leerzeichen, -Anführungszeichen, -Strich | Geschützte und andere Leerzeichen, typografische Anführungszeichen, Halbgeviert- und Geviertstriche, das Minuszeichen | Sehen aus wie ASCII; Parser und Vergleiche sind sich uneinig |
| Verwechselbar mit ASCII | Ein Zeichen, das UTS #39 auf einen ASCII-Prototyp abbildet | Homoglyphen: kyrillisches а für a, griechisches ο für o |
| Gestaltetes ASCII | Ein Zeichen, dessen Kompatibilitätszerlegung ASCII ist | Vollbreite Buchstaben, Ligaturen und Ähnliches |
| Wort mit gemischten Schriften | Ein Wort, dessen Buchstaben kein gemeinsames Schriftsystem haben | `pаypal` mit kyrillischem а; Japanisch, das Han, Hiragana und Katakana mischt, wird nicht markiert |

Die Erkennung gemischter Schriften folgt UTS #39: Die erweiterte Schriftmenge (Augmented Script Set) jedes Zeichens besteht aus seinen Script_Extensions plus den Schriftsystemen, die Schriften kombinieren (Han ergänzt Hanb, Hntl, Jpan und Kore; Hiragana und Katakana ergänzen Jpan; Hangul ergänzt Kore; Bopomofo ergänzt Hanb; Latin ergänzt Hntl). Ein Zeichen mit Common oder Inherited passt zu jeder Schrift, und ein Wort ist gemischt, wenn die Schnittmenge dieser Mengen über alle seine Zeichen leer ist.

## Der Text in gespeicherter Reihenfolge

Das Anzeigefeld stellt den Text von links nach rechts in der Reihenfolge im Speicher dar, wobei die bidirektionale Umordnung für das Feld selbst ausgeschaltet ist, sodass kein Steuerzeichen im Text das Angezeigte umordnen kann. Jedes Zeichen, das einen genaueren Blick verdient, wird zu einer Markierung mit seinem Codepunkt; rote Markierungen ändern Bedeutung oder Reihenfolge, gelbe ahmen etwas nach. Zeigen Sie mit der Maus auf eine Markierung oder fokussieren Sie sie, um ihren Namen zu sehen.

## Bereinigen

Die bereinigte Kopie kann unsichtbare und bidirektionale Zeichen entfernen, Nicht-ASCII-Leerzeichen durch SPACE ersetzen (und LINE SEPARATOR, PARAGRAPH SEPARATOR und NEL durch LF), typografische Anführungszeichen und Striche in `'`, `"` und `-` umwandeln und, wenn Sie es wünschen, Homoglyphen durch das ASCII ersetzen, das sie nachahmen. Diese letzte Option ist standardmäßig ausgeschaltet, weil sie auch echte Wörter in Kyrillisch, Griechisch und anderen Schriften ändert.

## Escape-Sequenzen

Der ganze Text lässt sich in JSON, JavaScript, Python, HTML, CSS, als URL, als C-String mit `u8` oder als Tcl-Wort in Anführungszeichen (iRules) schreiben. Jede Form maskiert die Zeichen, die ihre Sprache reserviert, und alles außerhalb des druckbaren ASCII. Beim Bau dieses Tools wurde jede Form von 4.000 Codepunkten aus allen siebzehn Ebenen sowie von zwei Belastungstexten von der Sprache selbst zurückdekodiert (CPython, Node, GCC, Tcl 8.4.6 und Chromium für HTML und CSS), und jede kam unverändert zurück.

Manche Formen können nicht jedes Zeichen aufnehmen, und das Tool sagt das, statt etwas Falsches zu schreiben:

- **Tcl 8.4 und iRules** haben keine Escape-Sequenz für ein Zeichen jenseits von U+FFFF: `\u` nimmt höchstens vier Hexziffern auf, und der Interpreter von Tcl 8.4.6 liest die vier UTF-8-Bytes eines solchen Zeichens als vier einzelne Zeichen.
- **HTML** kann kein einzelnes Surrogat enthalten, und eine Referenz auf U+0080 bis U+009F ergibt ein anderes Zeichen: 27 dieser 32 Referenzen werden als Windows-1252 gelesen (`&#x85;` ergibt Auslassungspunkte), daher schreibt das Tool diese Zeichen unmaskiert.
- **CSS** macht aus einer maskierten 0 oder einem maskierten Surrogat U+FFFD.
- **C**: Ein Universal Character Name kann weder ein Zeichen unter U+00A0 außer `$`, `@` und `` ` `` benennen noch ein Surrogat; das Tool schreibt die UTF-8-Bytes von U+0080 bis U+009F stattdessen oktal.
- **URLs** prozentkodieren UTF-8-Bytes, und ein einzelnes Surrogat hat keine.

## Ein Codepunkt

- **Name.** Die Eigenschaft Name; bei einem Steuerzeichen sein erster formaler Alias (Steuerzeichen haben keinen Namen); bei allem anderen ohne Namen sein Codepunkt-Label, etwa `<surrogate-D800>` oder `<reserved-0378>`.
- **Aliasse.** Jeder formale Alias mit seinem Typ: Korrektur, Steuerzeichenname, Alternative, Phantomname oder Abkürzung (`BOM` und `ZWNBSP` für U+FEFF).
- **Eigenschaften.** General_Category, Block, Script und Script_Extensions sowie die Unicode-Version, die den Codepunkt hinzugefügt hat.
- **Kodierungen.** UTF-8-Bytes, UTF-16-Codeeinheiten (jenseits von U+FFFF ein Surrogatpaar) und UTF-32.
- **Escape-Sequenzen und Referenzen.** Die acht Formen von oben für diesen einen Codepunkt, dazu die dezimale, die hexadezimale und die benannte HTML-Referenz, mit einem Hinweis, wenn eine Referenz nicht wieder diesen Codepunkt ergibt.

## Normalisierung

Derselbe sichtbare Text kann als verschiedene Folgen von Codepunkten gespeichert sein: é als U+00E9 oder als e gefolgt von U+0301 COMBINING ACUTE ACCENT. Der Modus **Normalisieren** zeigt einen Text in den vier Normalisierungsformen von UAX #15, jede mit ihren Codepunkten, ihren UTF-8-Bytes und der Angabe, ob sie vom eingegebenen Text abweicht: NFD (kanonische Zerlegung), NFC (kanonische Zerlegung, dann kanonische Zusammensetzung), NFKD (Kompatibilitätszerlegung) und NFKC (Kompatibilitätszerlegung, dann kanonische Zusammensetzung).

NFC und NFD behalten Kompatibilitätszeichen wie die Ligatur ﬁ (U+FB01) und vollbreite Buchstaben bei; NFKC und NFKD ersetzen sie durch ihre einfachen Entsprechungen, und UAX #15 warnt, dass das wichtige Unterschiede auslöschen kann. Die K-Formen gehören daher dorthin, wo genau das beabsichtigt ist. Singletons wie U+212B ANGSTROM SIGN und U+2126 OHM SIGN überstehen keine Form, und kombinierende Zeichen werden in die kanonische Reihenfolge gebracht, sodass A, U+030A, U+0323 in NFC zu U+1EA0 U+030A wird.

Geben Sie unter **Vergleichen mit** einen zweiten Text ein, und das Tool sagt, ob die beiden wie eingegeben und in jeder Form gleich sind: identisch, kanonisch äquivalent (gleich unter NFC und NFD), nur unter NFKC und NFKD gleich oder unter jeder Form verschieden. Beide Seiten vor dem Vergleich in dieselbe Form zu bringen, ist der Kern der Sache; der [Artikel zur Unicode-Normalisierung](/learn/unicode-normalisation) erklärt, warum.

Die Formen berechnet `String.prototype.normalize` (ECMA-262, Abschnitt 22.1.3.15) mit den Unicode-Tabellen der JavaScript-Engine, in der das Tool läuft: auf dieser Seite Ihr Browser. Diese Tabellen können älter sein als die Daten von 18.0.0, die die anderen Modi verwenden. Die Stabilitätsrichtlinie von Unicode garantiert, dass ein Text aus Zeichen, die eine Engine kennt, in jeder späteren Version zum selben Ergebnis normalisiert wird; der einzige Unterschied, den eine ältere Engine machen kann, besteht also darin, ein Zeichen, das neuer ist als ihre Tabellen, unverändert durchzulassen. Jeder Text wird bis zu seinen ersten 1.000 Codepunkten gelesen.

## Ergebnisse teilen

Unter der ersten Antwort des aktiven Modus erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Feld dieses Modus so, wie Sie es eingegeben haben, und die Auswahlen des Modus. Der Name des Felds nennt den Modus: `text` für „Text untersuchen“, mit den vier Schaltern für die Bereinigung (`invisible`, `spaces`, `punct`, `fold`) und `escape`, der Sprache, in der der Text ausgeschrieben wird; `cp` für „Ein Codepunkt“; `query` für „Nach Namen suchen“; `norm` für „Normalisieren“, mit `compare`, wenn ein zweiter Text eingegeben wurde. Eine Auswahl auf ihrem Standardwert wird weggelassen. Versteckte Zeichen wie bidirektionale Steuerzeichen und Leerzeichen ohne Breite werden exakt übertragen. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Text beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Der Modus wird gesetzt, sein Feld füllt sich wie beim Einfügen, seine Auswahlen werden gesetzt, und die Seite rechnet (die Namenstabelle wird in der Seite geladen, wie beim Einfügen). Zwei Felder auf einmal, eine Auswahl, die zu einem anderen Modus gehört, ein Wert, den die Seite nicht anbietet, oder ein Inhalt, der länger ist, als sein Feld zulässt, führt dazu, dass der ganze Link ignoriert wird. In beiden Fällen verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
- **Links aus der ASCII-Tabelle.** Ein Codepunkt, der als `#input=` übergeben wird, öffnet „Ein Codepunkt“ weiterhin genau wie bisher; „Ergebnisse teilen“ verwendet eigene Namen, sodass sich beides nie vermischt.

## Grenzen

- Spalten werden in Codepunkten gezählt, Positionen ebenso. Editoren zählen möglicherweise stattdessen UTF-16-Einheiten oder die Zeichen, die Benutzer wahrnehmen.
- Die Erkennung gemischter Schriften arbeitet Wort für Wort; sie prüft keine ganzen Bezeichner über Satzzeichen hinweg und entscheidet nicht, ob eine Mischung legitim ist.
- Die Verwechslungsdaten decken Zeichen ab, die wie ASCII-Text aussehen. Verwechslungen zwischen zwei Nicht-ASCII-Schriften liegen außerhalb des Umfangs.
- Das Tool zeigt die Sicht von Unicode 18.0.0. Ein System mit älteren Daten kennt möglicherweise Zeichen nicht, die seither hinzugekommen sind (13.007 kamen mit 18.0).
- Die Normalisierung verwendet die Unicode-Version der JavaScript-Engine, in der sie läuft, nicht 18.0.0: siehe „Normalisierung“ oben.

## Quellen

- [Unicode Character Database 18.0.0](https://www.unicode.org/Public/18.0.0/ucd/): UnicodeData.txt, DerivedName.txt, NameAliases.txt, PropList.txt, DerivedCoreProperties.txt, Blocks.txt, DerivedAge.txt, Scripts.txt, ScriptExtensions.txt, LineBreak.txt, PropertyValueAliases.txt (abgerufen am 03.10.2026)
- [UTS #39: Unicode Security Mechanisms (18.0.0) and confusables.txt](https://www.unicode.org/reports/tr39/) (abgerufen am 03.10.2026)
- [UTS #55: Unicode Source Code Handling](https://www.unicode.org/reports/tr55/) (abgerufen am 03.10.2026)
- [UAX #9: Unicode Bidirectional Algorithm](https://www.unicode.org/reports/tr9/) (abgerufen am 03.10.2026)
- [UAX #44: Unicode Character Database](https://www.unicode.org/reports/tr44/) (abgerufen am 03.10.2026)
- [The Unicode Standard 18.0.0, Kapitel 3, 4, 5 und 23](https://www.unicode.org/versions/Unicode18.0.0/) (abgerufen am 03.10.2026)
- [NVD: CVE-2021-42574](https://nvd.nist.gov/vuln/detail/CVE-2021-42574) (abgerufen am 03.10.2026)
- [RFC 3629: UTF-8](https://www.rfc-editor.org/rfc/rfc3629) (abgerufen am 03.10.2026)
- [RFC 2781: UTF-16](https://www.rfc-editor.org/rfc/rfc2781) (abgerufen am 03.10.2026)
- [RFC 8259: JSON](https://www.rfc-editor.org/rfc/rfc8259) (abgerufen am 03.10.2026)
- [ECMA-262: ECMAScript Language Specification](https://tc39.es/ecma262/) (abgerufen am 03.10.2026)
- [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) (abgerufen am 03.10.2026)
- [ISO/IEC 9899:2011 committee draft N1570 (C11), 6.4.3](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) (abgerufen am 03.10.2026)
- [Tcl 8.4 manual: Tcl](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (abgerufen am 03.10.2026)
- [WHATWG HTML: parsing (numeric character references)](https://html.spec.whatwg.org/multipage/parsing.html) (abgerufen am 03.10.2026)
- [WHATWG HTML: named character references](https://html.spec.whatwg.org/entities.json) (abgerufen am 03.10.2026)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 03.10.2026); Abschnitt 3.5 (abgerufen am 27.10.2026): das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
- [UAX #15: Unicode Normalization Forms, revision 58 (Unicode 18.0.0)](https://www.unicode.org/reports/tr15/) (abgerufen am 26.10.2026)
- [Unicode Character Encoding Stability Policies: Normalization Stability](https://www.unicode.org/policies/stability_policy.html) (abgerufen am 26.10.2026)
- [ECMA-262: String.prototype.normalize, Abschnitt 22.1.3.15](https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype.normalize) (abgerufen am 26.10.2026)
