## Was das Tool tut

Das Tool führt ein kurzes Skript Befehl für Befehl aus und zeigt jeden Befehl auf drei Arten: so, wie er geschrieben ist, als die Wörter, die er tatsächlich erhalten hat, nachdem Tcl Variablen, Befehle und Backslashes ersetzt hat, und das, was er zurückgegeben hat. Unter jedem Befehl sehen Sie die Variablen, die er geändert hat, den Zweig, den `if` oder `switch` genommen hat, und jeden ausgewerteten Ausdruck als Baum. Log-Zeilen werden gesammelt, und Aktionen wie `pool`, `HTTP::redirect`, `drop` oder `reject` werden aufgezeichnet statt ausgeführt.

Im Modus **iRules** antworten die Anfragebefehle (`HTTP::uri`, `HTTP::host`, `HTTP::method`, `HTTP::header`, `IP::client_addr` und weitere) aus einer bearbeitbaren Beispielanfrage, und ein `when`-Block führt seinen Rumpf einmal aus, als wäre das Ereignis ausgelöst worden.

## So lesen Sie die Schritte

Die Befehle stehen in der Reihenfolge, in der sie gestartet wurden. Ein eingerückter Befehl lief innerhalb des Befehls darüber: in dessen Rumpf oder in eckigen Klammern, während die Wörter des äußeren Befehls gebildet wurden; er war also fertig, bevor der äußere Befehl lief. „erhalten“ zeigt die Wörter so, wie der Befehl sie bekommen hat; die gestrichelte Umrandung markiert, wo jedes Wort beginnt und endet, und genau das entscheidet das Quoting.

## Gut zu wissen

- `"$a$b"` verbindet zwei Werte ohne etwas dazwischen; `"$a $b"` behält das Leerzeichen.
- `append` fügt Text genau so an, wie er angegeben ist; `concat` entfernt den Whitespace an beiden Enden jedes Arguments, verwirft leere Argumente und verbindet den Rest mit einfachen Leerzeichen; `lappend` fügt Listenelemente hinzu.
- Für `foreach` ist ein String mit Leerzeichen eine Liste: `foreach item "red green blue"` läuft dreimal.
- `incr` liest `010` als oktale 8, das Ergebnis ist also 9.
- `switch` liest jedes Wort, das mit einem Bindestrich beginnt, als Option. Setzen Sie `--` vor den Wert (F5 K15650046), sonst zerstört ein Wert wie `-foo` den Befehl.
- Ein `expr` ohne geschweifte Klammern ersetzt zweimal: Enthält eine Variable `[log local0. "x"]`, wird dieser Befehl ausgeführt (F5 K57410758). Das Beispiel „Doppelte Ersetzung“ zeigt das.

## Ergebnisse teilen

Unter dem Ende des Durchlaufs erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält mit Namen, was der Durchlauf liest: das Skript als `#input=`, `&mode=irules` im iRules-Modus und in diesem Modus jedes Feld der Beispielanfrage, das Sie geändert haben (`&uri=`, `&host=`, `&method=`, `&agent=` für den User-Agent). Reines Tcl ist der Standard und wird nicht übertragen, ebenso wenig ein Beispielwert, den reines Tcl nicht liest. Ein Skript ist meist ein Stück einer echten iRule; deshalb ergänzt das Popover einen Warnhinweis, bevor Sie etwas kopieren (ein Skript kann interne Hosts, Pools und Data Groups nennen), und die Seite prüft jedes Feld, das der Link enthalten würde, mit derselben Secret-Prüfung wie die Tools dieser Website, die iRules lesen.

Bevor sie überhaupt einen Link anbietet, sucht sie nach Schlüsseln und Zugangsdaten, die dort ausgeschrieben sind, wo die Referenzen von F5 sie vorsehen (alle abgerufen am 27.10.2026):

- die Passphrase von `HTTP::cookie encrypt` und `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- ein Schlüssel in der String-Form `AES 128 <hex>` oder der ausgeschriebene Schlüssel von `AES::encrypt` und `AES::decrypt` ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- der Wert von `-key` oder `-keyhex` bei `CRYPTO::encrypt`, `decrypt`, `sign` und `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- ein `Authorization`- oder `Proxy-Authorization`-Header, der mit `HTTP::header insert` oder `replace` geschrieben wird ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)) und dessen Wert [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (Abschnitte 11.6.2 und 11.7.2) als Zugangsdaten definiert;
- ein Literal, das per `set` einer Variablen zugewiesen wird, die an einer dieser Stellen verwendet wird, wie im Beispiel von `CRYPTO::encrypt` selbst;
- und, aus der Secret-Prüfung der Website, ein privater PEM-Schlüssel, ein JWT, eine Zugriffsschlüssel-ID von AWS oder ein Passwort in einer URL.

Findet die Seite einen davon, gibt es keinen Link: Das Popover nennt Feld und Zeile, und Sie ersetzen den Wert durch einen Platzhalter und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur nach einem Secret aussieht (`set static::api_token "..."`), verhindert den Link nicht; stattdessen nennt ihn der Warnhinweis. Keine Prüfung findet jedes Secret, lesen Sie also, was Sie senden.

Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist ein Skript länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Felder werden gefüllt, als wären sie eingegeben (eine Beispielanfrage, die der Link geändert hat, wird aufgeklappt gezeigt), und die Seite hält das Skript an: Ein Hinweis sagt, dass es aus einem geteilten Link stammt, und ausgeführt wird erst, wenn Sie **Ausführen** wählen oder ein Feld ändern. Der Lerninterpreter führt den Text eines Links nie von selbst aus. Ein anderer Modus als `tcl` oder `irules` oder ein Beispielwert im Modus für reines Tcl führt dazu, dass der ganze Link ignoriert wird. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.

## Grenzen

Das ist ein Lerninterpreter, nicht TMM. Er bildet die Befehle ab, die im Code dieser Seite aufgeführt sind, und stoppt nach 2.000 Befehlen, bei Werten über 1.000.000 Zeichen und bei 200 Verschachtelungsebenen. Arrays, `proc`, `regexp`, `table`, `after` und das Dateisystem werden nicht abgebildet; Befehle, die F5 in iRules deaktiviert (K36322151), stehen ebenfalls nicht zur Verfügung. Ereignis-Timing, Verbindungszustand und andere Ereignisse liegen außerhalb des Umfangs. Über die API wird das Tool nicht angeboten, weil es das Tcl ausführt, das Sie ihm geben.

## Quellen

- [Tcl 8.4 manual: Tcl (the substitution rules)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (abgerufen am 03.10.2026)
- [Tcl 8.4 manual: append](https://www.tcl-lang.org/man/tcl8.4/TclCmd/append.htm), [concat](https://www.tcl-lang.org/man/tcl8.4/TclCmd/concat.htm), [lappend](https://www.tcl-lang.org/man/tcl8.4/TclCmd/lappend.htm), [incr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/incr.htm) und [switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (abgerufen am 03.10.2026)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (abgerufen am 03.10.2026)
- [F5 K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (abgerufen am 03.10.2026)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (abgerufen am 03.10.2026)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (abgerufen am 03.10.2026)
- [F5 iRules reference: log](https://clouddocs.f5.com/api/irules/log.html) (abgerufen am 02.10.2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
- [F5 iRules reference: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) und [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (abgerufen am 27.10.2026): wo eine iRule eine Passphrase, einen Schlüssel oder Zugangsdaten enthält, die einen Link von „Ergebnisse teilen“ verhindern
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (abgerufen am 27.10.2026): Abschnitte 11.6.2 und 11.7.2, die Werte von Authorization und Proxy-Authorization sind Zugangsdaten
