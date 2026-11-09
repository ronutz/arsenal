## Was das Tool tut

Beschreiben Sie eine Entscheidung als geordnete Regeln („Pfade, die mit /api beginnen, gehen an api_pool, /login geht an login_pool, alles andere an web_pool“), und das Tool schreibt sie auf drei Arten:

- als Kette aus `if` und `elseif`,
- als `switch` (mit `-glob`, wenn eine Regel es braucht, und `--` vor dem Wert),
- als Abfrage mit `class match` auf Data Groups, mit den `tmsh`-Definitionen der Data Groups.

Ein Testwert läuft dann im Lerninterpreter durch jede erzeugte Regel, und die Seite zeigt, welchen Pool jede Form gewählt hat.

## Warum die Formen voneinander abweichen können

`if` und `switch` nehmen die **erste** passende Regel, in der geschriebenen Reihenfolge. `class match` mit `starts_with` oder `ends_with` liefert den **längsten** passenden Eintrag, unabhängig von der Reihenfolge (so steht es in der Referenz von F5 zu `class`). Mit den Regeln `/api` und `/api/v2` geht der Testwert `/api/v2/users` über `if` und `switch` an `api_pool`, über `class match` aber an `api_v2_pool`. Das Tool markiert außerdem eine Regel, die nie greifen kann, weil eine frühere Regel immer zuerst passt.

## Gut zu wissen

- Wird der Wert in Kleinbuchstaben umgewandelt (`string tolower`), ist der Vergleich unabhängig von Groß- und Kleinschreibung, aber dann kann ein Regelwert mit Großbuchstaben nie passen; das Tool warnt davor.
- `class match` kennt keinen Glob-Vergleich, daher schließt eine Glob-Regel die Form mit Data Group aus.
- Ein Regelwert mit einer geschweiften Klammer ohne Gegenstück wird mit vorangestelltem Backslash geschrieben (`\{`). Tcl zählt die geschweiften Klammern in einem geklammerten Rumpf auch zwischen doppelten Anführungszeichen (Regel 5 der Syntaxseite von Tcl 8.4), daher würde eine einzelne Klammer die Regel zerstören; ein echtes Tcl 8.4.6 bricht mit `missing close-brace` ab.
- Bei `HTTP::path` wird ein Testwert am ersten Fragezeichen abgeschnitten: `HTTP::path` enthält den Query-String nicht (Referenz von F5 zu `HTTP::path`), daher vergleichen die Regeln nur den Teil davor.
- Eintragsnamen mit anderen Zeichen als Buchstaben, Ziffern und `_ . / : -` werden in den `tmsh`-Definitionen in doppelte Anführungszeichen gesetzt. Dieses Quoting wurde nicht auf einem BIG-IP ausprobiert: Listen Sie die Data Group nach dem Anlegen in `tmsh` auf und prüfen Sie die Einträge.
- Der erzeugte Code folgt dem DevCentral iRules Style Guide (Einrückung mit 4 Leerzeichen, eine Priorität am Ereignis, geklammerte Ausdrücke, geklammerte Variablennamen, `--` bei `switch` und `class`), und die Stilprüfung für iRules dieser Website findet darin nichts.

## Ergebnisse teilen

Unter der Bewertung des Testwerts erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält die ganze Entscheidung als benannte Werte: `#subject=` (und `&header=` für einen Header), `&lower=1` oder `0`, die Regeln der Reihe nach als eine Tcl-Liste aus Listen `{comparison value pool}` (`&rules={starts_with /api api_pool} {equals /login login_pool}`, im Link prozentkodiert), dazu den Standardpool, den Namen der Data Group und den Testwert (`&default=`, `&group=`, `&test=`), wenn sie gesetzt sind. Die Namen von Pools, Data Groups und Headern stammen von Ihnen; für sie gilt der übliche Warnhinweis des Popovers. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; selbst 50 Regeln bleiben weit darunter.
- **Öffnen eines Links.** Die Entscheidung aus dem Link ersetzt das ganze Formular, auch das Beispiel, mit dem die Seite öffnet (ein Feld, das der Link nicht enthält, wird geleert; eine Entscheidung nach einem Header ohne angegebenen Namen verwendet `User-Agent`, den Standard der Seite), und die drei Formen werden erzeugt. Ein unbekannter Anfragewert oder Vergleich, ein Wert für die Regeln, der keine Liste aus Listen mit drei Elementen ist, mehr als 50 Regeln oder ein Wert, der länger ist, als die Seite erlaubt, führt dazu, dass der ganze Link ignoriert wird. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.

## Quellen

- [F5 iRules reference: class](https://clouddocs.f5.com/api/irules/class.html) (abgerufen am 02.10.2026)
- [F5 iRules reference: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (abgerufen am 02.10.2026)
- [Tcl 8.4 manual: switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (abgerufen am 03.10.2026)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (abgerufen am 03.10.2026)
- [F5 DevCentral: iRules Style Guide](https://community.f5.com/t/irules-style-guide/71151) (abgerufen am 03.10.2026)
- [F5 iRules reference: priority](https://clouddocs.f5.com/api/irules/priority.html) (abgerufen am 03.10.2026)
- [F5 iRules reference: HTTP::path](https://clouddocs.f5.com/api/irules/HTTP__path.html) (abgerufen am 03.10.2026)
- [Tcl 8.4 manual: Tcl (the substitution rules)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (abgerufen am 03.10.2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
