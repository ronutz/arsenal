## Was das Tool tut

Geben Sie einen Wert so ein, wie er in einer iRule steht, etwa `010`, `0x1F`, `08`, `1e3` oder `" 12 "`, und das Tool zeigt, wie Tcl 8.4.6 ihn liest. Laut F5 (K6091) wurde der Befehlssatz der iRules aus der Tcl-Basisversion 8.4.6 entwickelt; das sind also die Regeln, die ein BIG-IP anwendet. Die Engine hinter dem Tool wurde mit einem echten Interpreter für Tcl 8.4.6 abgeglichen, der aus dem offiziellen Quellcode gebaut wurde.

## So lesen Sie das Ergebnis

- **Die Überschrift** sagt, ob der Text eine Ganzzahl, ein Double (Gleitkommazahl) oder keine Zahl ist, in welcher Basis eine Ganzzahl geschrieben wurde und wie Tcl sie ausgibt. `010` ist die Ganzzahl 8, oktal geschrieben.
- **Dieselbe Ganzzahl in anderen Notationen** zeigt die Ganzzahl dezimal, hexadezimal, oktal und binär und wie man sie in einer iRule schreibt. Tcl 8.4 hat keine Binärnotation, daher hat diese Zeile keine Tcl-Form.
- **Der Double-Wert im Detail** zeigt, was die 12 ausgegebenen Stellen verbergen: Tcl 8.4 gibt Double-Werte mit 12 signifikanten Stellen aus (sein `tcl_precision` ist standardmäßig 12), daher wird `0.1` als `0.1` ausgegeben, während der gespeicherte Wert `0.1000000000000000055511151231257827021181583404541015625` ist.
- **Zwei Stellen, an denen Tcl Zahlen liest** vergleicht den direkt in einen Ausdruck geschriebenen Wert (`expr {08}`, ein Fehler, bevor irgendetwas läuft) mit demselben Text in einer Variablen (`set x 08; expr {$x + 0}`, ein Fehler erst, wenn die Arithmetik die Zahl braucht).
- **Vergleich mit** führt `==`, `eq`, `<` und `>` gegen einen zweiten Wert Ihrer Wahl aus, mit der Begründung für jedes Ergebnis.

## Gut zu wissen

- Eine führende 0 bedeutet oktal: `010 == 8` ist wahr und `010 eq 8` falsch, weil `eq` Text vergleicht.
- `08` und `09` sind überhaupt keine Zahlen. In der Arithmetik scheitern sie mit „can't use invalid octal number“; in einem Vergleich werden sie still zu Text, daher ist `"08" == 8` falsch.
- Ein Double ist für Tcl nie eine Ganzzahl: `3.0 == 3` ist wahr, aber `3.0` wird mit seinem Dezimalpunkt ausgegeben, und `%` lehnt den Wert ab.
- Werte von 2 hoch 63 bis 2 hoch 64 minus 1 werden akzeptiert und laufen zu negativen Zahlen über; alles Größere wird abgelehnt.

## Ergebnisse teilen

Unter der Überschrift und ihren Hinweisen erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält den Wert genau so, wie eingegeben, mit Leerzeichen (sie gehören zu dem Wert, den Tcl liest), als `#input=` und den Vergleichswert als `&other=`, wenn dieses Feld gesetzt ist. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; eine Zahl ist weit kürzer.
- **Öffnen eines Links.** Beide Felder werden gefüllt, als wären sie eingegeben, und die Seite liest den Wert; ein Vergleich, den der Link nicht enthält, lässt dieses Feld leer, so wie es beim Absender war. Jeder Wert wird angenommen, wie bei der Eingabe: Die Seite sagt, was Tcl daraus macht. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.

## Grenzen

Ganzzahlen werden mit 64 Bit Breite modelliert. Tcl 8.4 verwendet den C-Typ `long` der Plattform, für die es gebaut wurde, daher würde ein 32-Bit-Build große Werte anders lesen; das Tool weist darauf hin, wenn ein Wert nicht in 32 Bit passt.

## Quellen

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (abgerufen am 03.10.2026)
- [Tcl 8.4 manual: expr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/expr.htm) (abgerufen am 03.10.2026)
- [F5 iRules reference: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (abgerufen am 02.10.2026)
- [Tcl 8.4.6 source code, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (der Referenzinterpreter; `doc/tclvars.n` dokumentiert den Standardwert 12 für `tcl_precision`)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
