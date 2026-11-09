## Was das Tool tut

`scan` ist der günstige Weg, einen Wert in einer iRule zu zerlegen; die Referenz von F5 zu `matches_regex` merkt an, dass ein String-Befehl effizienter ist als ein regulärer Ausdruck und sich die meisten Fälle mit `string match` oder `scan` lösen lassen. Geben Sie dem Tool einen Wert, ein Format und die Variablennamen, und es stellt jede Direktive des Formats den Zeichen gegenüber, die sie verbraucht hat, dem Wert, den sie erzeugt hat, und der Variablen, die ihn erhalten hat; dann sagt es genau, warum das Scannen stoppte. Der Wert wird auf einem Lineal dargestellt, die Zeichen jeder Konvertierung in eigener Farbe.

## So lesen Sie das Ergebnis

- **Rückgabe von scan** ist das Ergebnis des Befehls: mit Variablennamen die Anzahl der Variablen, die einen Wert erhalten haben; ohne Namen eine Liste der konvertierten Werte.
- **Direktive für Direktive** hat eine Zeile pro Direktive: ein Literal, das passen musste, Whitespace, der beliebig viel überspringt, oder eine Konvertierung wie `%d`, `%s` oder `%[^&]`.
- **Variablen danach** zeigt, was jede benannte Variable enthält. Eine Variable nach der Stelle, an der das Scannen stoppte, wird von diesem scan nicht gesetzt.

## Gut zu wissen

- `-1` bedeutet, dass die Eingabe vor der ersten Konvertierung endete; `0` bedeutet, dass eine Konvertierung versucht wurde und nicht passte. Prüfen Sie auf beides, wenn ein Wert leer sein kann.
- `%d` überspringt führenden Whitespace und liest dezimal; `%i` entnimmt die Basis einem Präfix, daher ergibt `08`, mit `%i` gelesen, 0 und stoppt bei der 8. Verwenden Sie `%d` für Uhrzeiten und Codes mit führenden Nullen.
- `%s` stoppt bei Whitespace; `%[^&]` liest alles bis zu einem kaufmännischen Und.
- Tcl 8.4.6 speichert Ganzzahlkonvertierungen über einen C-`int`: `3000000000`, mit `%d` gelesen, kommt als `-1294967296` zurück, und der Modifikator `l` ändert daran in 8.4.6 nichts. Um eine große Zahl unverändert zu erhalten, lesen Sie sie mit `%[0-9]` als Text und lassen Sie `expr` sie interpretieren.
- `%n` speichert die Menge der bisher verbrauchten Eingabe. Das Handbuch spricht von Zeichen, aber Tcl 8.4.6 zählt Bytes seines internen UTF-8, daher zählt jedes Zeichen außerhalb von ASCII 2 oder 3.

## Ergebnisse teilen

Unter dem Ergebnis erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält die drei Felder so, wie eingegeben: den zu zerlegenden Wert als `#input=`, das Format als `&format=` und die Variablennamen als `&vars=`, jeweils weggelassen, wenn leer. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; sind die Felder länger, gibt es keinen Link, und das Popover nennt ihre Länge.
- **Öffnen eines Links.** Die Felder werden gefüllt, als wären sie eingegeben (ein Feld, das der Link nicht enthält, bleibt leer, so wie es beim Absender war), und der scan wird erklärt. Jeder Text wird angenommen, wie bei der Eingabe: Ein fehlerhaftes Format erhält die Fehlermeldung von Tcl selbst. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.

## Grenzen

Die Engine folgt `Tcl_ScanObjCmd` aus Tcl 8.4.6 und wurde an Tausenden erzeugter Fälle mit einem echten Interpreter für Tcl 8.4.6 abgeglichen. Ganzzahlergebnisse, die von der C-Bibliothek der Plattform abhängen, sind gekennzeichnet.

## Quellen

- [Tcl 8.4 manual: scan](https://www.tcl-lang.org/man/tcl8.4/TclCmd/scan.htm) (abgerufen am 03.10.2026)
- [F5 iRules reference: matches_regex](https://clouddocs.f5.com/api/irules/matches_regex.html) (abgerufen am 02.10.2026)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (abgerufen am 03.10.2026)
- [Tcl 8.4.6 source code, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (der Referenzinterpreter)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
