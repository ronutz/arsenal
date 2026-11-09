## Was das Tool tut

`findstr`, `substr` und `getfield` sind Befehle, die F5 den iRules hinzufügt, um ein Stück aus einem Wert herauszuschneiden. Das Tool führt den gewählten Befehl auf Ihrem String aus und markiert das Ergebnis auf einem Lineal: den gefundenen Suchtext, die übersprungenen Zeichen, den Terminator, die Trennzeichen und das zurückgegebene Feld. Daneben läuft das reine Tcl, das dieselbe Aufgabe erledigt, in derselben Engine, sodass Sie sehen, ob beide wirklich übereinstimmen.

## Die drei Befehle

- `findstr string search ?skip? ?terminator?` sucht `search`, rückt vom Anfang des Treffers um `skip` Zeichen vor und gibt dann alles bis zum Terminator zurück. Das Beispiel von F5: `findstr "<sip:+12065551234@sip.example.com>" "@" 1 ">"` gibt `sip.example.com` zurück.
- `substr string skip ?terminator?` beginnt bei Index `skip`, wobei 0 das erste Zeichen ist. `substr "abcdefghijklm" 2 "gh"` gibt `cdef` zurück.
- `getfield string separator field` teilt an jedem Vorkommen des Trennzeichens, das ein Zeichen oder ein String sein kann, und gibt dieses Feld zurück, gezählt ab 1.

Bei `findstr` und `substr` ist ein Terminator, der eine Zahl ist, eine Länge (bis zu so vielen Zeichen, weniger, wenn der String vorher endet); jeder andere Terminator ist Text, vor dem gestoppt wird. Alle veröffentlichten Beispiele von F5 zu diesen Befehlen geben die Tests des Tools exakt wieder.

## Was F5 nicht dokumentiert

Wo die Seiten von F5 schweigen, nennt das Tool die Annahme, die es getroffen hat, markiert mit „Nicht von F5 dokumentiert“:

- `findstr`, wenn der Suchtext fehlt. Das Tool gibt einen leeren String zurück. F5 nennt `findstr` gleichwertig zu `string range` mit `string first`, aber diese Entsprechung gibt in diesem Fall den ganzen String zurück; beide Beschreibungen können also nicht zugleich stimmen.
- Eine Anzahl von 0. Nach der Regel von F5 („that many characters“, also so viele Zeichen) käme nichts zurück, aber das eigene `substr`-Beispiel von F5 mit 0 gibt den Rest des Strings zurück; das Tool folgt dem Beispiel, und laut der Anmerkung eines Mitwirkenden auf der API-Referenzseite von F5 funktionierte 0 unter 11.5.4 und 11.6.0 nicht.
- Ein Skip-Wert hinter dem Ende, ein negativer Skip-Wert oder eine negative Anzahl, ein leerer Terminator und eine Feldnummer bei `getfield` außerhalb der vorhandenen Felder.

Prüfen Sie diese Fälle auf einem BIG-IP, bevor Sie sich darauf verlassen.

## Ergebnisse teilen

Unter dem Ergebnis erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält das Formular als benannte Werte: den String als `#input=`, den Befehl als `&command=` und die Felder des Befehls, die etwas enthalten (`&search=`, `&skip=`, `&terminator=`, `&separator=`, `&field=`). Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; sind die Felder länger, gibt es keinen Link, und das Popover nennt ihre Länge.
- **Öffnen eines Links.** Befehl, String und Felder werden gefüllt, als wären sie eingegeben (ein Feld, das der Link nicht enthält, bleibt leer; ein Link ohne Befehl öffnet `findstr`, den ersten Befehl der Seite), und das Ergebnis wird berechnet. Ein unbekannter Befehl oder ein Feld, das der Befehl nicht annimmt, führt dazu, dass der ganze Link ignoriert wird. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.

## Quellen

- [F5 tmsh reference: findstr](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_findstr.html) (abgerufen am 03.10.2026)
- [F5 tmsh reference: substr](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_substr.html) (abgerufen am 03.10.2026)
- [F5 tmsh reference: getfield](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_getfield.html) (abgerufen am 03.10.2026)
- [F5 iRules reference: substr, mit der Anmerkung eines Mitwirkenden zur Anzahl 0](https://clouddocs.f5.com/api/irules/substr.html) (abgerufen am 02.10.2026)
- [Tcl 8.4 manual: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (abgerufen am 03.10.2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
