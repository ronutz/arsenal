## Was das Tool tut

Das Tool führt einen `string`-Unterbefehl von Tcl 8.4.6 aus und zeichnet das Ergebnis auf ein Zeichenlineal: jedes Zeichen des Strings mit seinem Index, eingefärbt nach dem, was der Befehl damit getan hat (durchsucht, gefunden, zurückgegeben, ersetzt, abgeschnitten oder der erste Unterschied bei einem Vergleich). Abgedeckt sind siebzehn Unterbefehle: `length`, `bytelength`, `tolower`, `toupper`, `range`, `index`, `first`, `last`, `map`, `match`, `compare`, `equal`, `trim`, `trimleft`, `trimright`, `replace` und `repeat`.

## So lesen Sie das Ergebnis

- **Der Befehl** ist die exakte Zeile zum Einfügen in eine iRule, mit dem Quoting, das Tcl braucht.
- **Das Lineal** nummeriert die Zeichen ab 0, so wie jedes Index-Argument zählt.
- **Index-Argumente** zeigt, wie jeder Index gelesen wurde: `end-1` bedeutet das vorletzte Zeichen, und ein als `010` geschriebener Index ist oktal, bedeutet also 8.
- **Der eine Durchgang von string map** listet jede Position auf: beibehalten oder durch welchen Schlüssel und Wert ersetzt.

## Gut zu wissen

- `length` zählt Zeichen; `bytelength` zählt die Bytes des internen UTF-8 von Tcl, daher hat `héllo` 5 Zeichen und 6 Byte.
- `string map` macht einen Durchgang von links nach rechts. An jeder Position gewinnt der erste passende Schlüssel der Liste, und ersetzter Text wird nie erneut geprüft: `string map {a 1 ab 2} abab` ergibt `1b1b`, `{ab 2 a 1}` dagegen `22`.
- `compare` ordnet nach Zeichencode, daher ergibt `string compare bench Chair` den Wert 1.
- `string index` und `string range` geben einen leeren String zurück, keinen Fehler, wenn der Index außerhalb des Strings liegt.
- `trim` entfernt eine **Menge** von Zeichen in beliebiger Reihenfolge, kein Wort.
- Tcl 8.4.6 akzeptiert `e` oder `en` allein als `end`, aber `e-1` ist ein Fehler.
- Die Umwandlung von Groß- und Kleinschreibung verwendet die eigenen Unicode-Tabellen von Tcl 8.4.6, die sich bei etwa tausend Zeichen von denen eines modernen Browsers unterscheiden (zum Beispiel hat Tcl 8.4.6 keine Großbuchstabenform für `µ`).

## Ergebnisse teilen

Unter dem Ergebnis erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält das Formular als benannte Werte: den Unterbefehl als `#op=`, dann jedes Argumentfeld, das etwas enthält, unter seinem eigenen Namen (`&string=`, `&first=`, `&needle=`, `&haystack=`, `&mapping=` und so weiter) und `&nocase=1`, wenn **-nocase** bei einem Unterbefehl aktiviert ist, der es annimmt. Ein einzelnes `#input=` gibt es nicht: Welches Feld den bearbeiteten Text enthält, hängt vom Unterbefehl ab. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; sind die Felder länger, gibt es keinen Link, und das Popover nennt ihre Länge.
- **Öffnen eines Links.** Der Unterbefehl und seine Felder werden gefüllt, als wären sie eingegeben (ein Feld, das der Link nicht enthält, bleibt leer), und das Ergebnis wird berechnet. Ein unbekannter Unterbefehl, ein Feld, das der Unterbefehl nicht annimmt, oder `-nocase`, wo es nicht gilt, führt dazu, dass der ganze Link ignoriert wird; Feldtext wird so, wie eingegeben, angenommen, und ein fehlerhafter Index erhält die Fehlermeldung von Tcl selbst, wie bei der Eingabe. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.

## Grenzen

Zeichen jenseits der Basic Multilingual Plane werden abgelehnt, weil Tcl 8.4 sie nicht als ein einzelnes Zeichen speichern kann. `string is`, `totitle`, `wordstart` und `wordend` werden nicht abgebildet. Bei `repeat` sind die Ergebnisse auf 100.000 Zeichen begrenzt.

## Quellen

- [Tcl 8.4 manual: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (abgerufen am 03.10.2026)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (abgerufen am 03.10.2026)
- [Tcl 8.4.6 source code, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (der Referenzinterpreter, gegen den die Engine getestet wird)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
