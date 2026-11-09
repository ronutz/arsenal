## Was das Tool tut

Das Tool wertet einen Ausdruck so aus, wie `expr`, `if` und `while` es in einer iRule tun, und zeigt die ganze Auswertung: den Wert und wie er gespeichert ist, den Ausdruck mit den Operanden jedes Operators in Klammern, sodass die Rangfolge sichtbar wird, einen Baum aller Schritte und bei einem Vergleich, was `==`, `eq`, `<` und `>` jeweils aus denselben beiden Operanden machen. Variablen erhalten ihre Werte über gewöhnliche `set`-Befehle, daher verhält sich das Quoting genau wie in einer iRule.

Zwei Modi: **Tcl 8.4** (reines Tcl 8.4.6, die Basis, die F5 in K6091 nennt) und **iRules**, der die von F5 dokumentierten Operatoren hinzufügt (`contains`, `starts_with`, `ends_with`, `equals`, `matches_glob`, `matches_regex`, `and`, `or`, `not`) sowie Anfragebefehle wie `[HTTP::uri]`, die aus einer bearbeitbaren Beispielanfrage beantwortet werden.

## So lesen Sie den Baum

Jeder Kasten ist ein Teil des Ausdrucks: sein Quelltext, ein Pfeil und das, was er ergeben hat. Operanden stehen unter ihrem Operator. Die Hinweise unter einem Kasten sagen, was dort geschehen ist, zum Beispiel „Als Ganzzahlen verglichen: 10 und 10“ für `$x == $y`, wenn `x` auf `012` gesetzt ist, oder „Als Text verglichen, weil die linke Seite keine Zahl ist“. Ein Teil mit der Markierung „nie ausgewertet“ wurde von `&&`, `||` oder `?:` übersprungen.

## Gut zu wissen

- `==` und die anderen Vergleichsoperatoren vergleichen Zahlen, wenn beide Seiten als Zahlen lesbar sind, und sonst Text. `eq` und `ne` vergleichen immer Text.
- Bei einem Textvergleich entscheiden die Zeichencodes, daher steht jeder Großbuchstabe vor jedem Kleinbuchstaben: `"bench" < "Chair"` ist falsch.
- `true == 1` ist falsch: `true` ist ein boolesches Wort, keine Zahl, daher werden Texte verglichen.
- Tcl 8.4 hat keinen Operator `**`; `2 ** 3` ist ein Syntaxfehler.
- Ganzzahldivision rundet in Richtung minus unendlich (`7 / -2` ergibt `-4`), und ein Rest erhält das Vorzeichen des Divisors.
- Ein Literal wie `08`, das im Ausdruck steht, wird beim Kompilieren des Ausdrucks abgelehnt, bevor irgendein Teil davon ausgeführt wird.
- Setzen Sie Ihre Ausdrücke in geschweifte Klammern. Ohne sie ersetzt Tcl den Text zweimal, was langsamer ist und Daten als Code ausführen lässt (F5 K57410758 und K15650046). Das Tool „iRules-Skripte im Einzelschritt“ zeigt, wie das geschieht.

## Ergebnisse teilen

Unter dem Ergebnis erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält mit Namen, was die Auswertung liest: den Ausdruck als `#input=`, die set-Befehle als `&setup=`, `&mode=irules` im iRules-Modus und in diesem Modus die Beispielwerte für `HTTP::uri` und `HTTP::host`, sofern Sie sie geändert haben (`&uri=`, `&host=`). Reines Tcl ist der Standard und wird nicht übertragen, ebenso wenig ein Beispielwert, den reines Tcl nicht liest. In den set-Befehlen landen Werte, die aus einer iRule kopiert wurden, daher prüft die Seite jedes Feld, das der Link enthalten würde, mit derselben Secret-Prüfung wie die Tools dieser Website, die iRules lesen.

Bevor sie überhaupt einen Link anbietet, sucht sie nach Schlüsseln und Zugangsdaten, die dort ausgeschrieben sind, wo die Referenzen von F5 sie vorsehen (alle abgerufen am 27.10.2026):

- die Passphrase von `HTTP::cookie encrypt` und `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- ein Schlüssel in der String-Form `AES 128 <hex>` oder der ausgeschriebene Schlüssel von `AES::encrypt` und `AES::decrypt` ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- der Wert von `-key` oder `-keyhex` bei `CRYPTO::encrypt`, `decrypt`, `sign` und `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- ein `Authorization`- oder `Proxy-Authorization`-Header, der mit `HTTP::header insert` oder `replace` geschrieben wird ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)) und dessen Wert [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (Abschnitte 11.6.2 und 11.7.2) als Zugangsdaten definiert;
- ein Literal, das per `set` einer Variablen zugewiesen wird, die an einer dieser Stellen verwendet wird, wie im Beispiel von `CRYPTO::encrypt` selbst;
- und, aus der Secret-Prüfung der Website, ein privater PEM-Schlüssel, ein JWT, eine Zugriffsschlüssel-ID von AWS oder ein Passwort in einer URL.

Findet die Seite einen davon, gibt es keinen Link: Das Popover nennt Feld und Zeile, und Sie ersetzen den Wert durch einen Platzhalter und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur nach einem Secret aussieht (`set static::api_token "..."`), verhindert den Link nicht; stattdessen nennt ihn der Warnhinweis. Keine Prüfung findet jedes Secret, lesen Sie also, was Sie senden.

Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; sind die Felder zusammen länger, gibt es keinen Link, und das Popover nennt ihre Länge.
- **Öffnen eines Links.** Die Felder werden gefüllt, als wären sie eingegeben (eine Beispielanfrage, die der Link geändert hat, wird aufgeklappt gezeigt), und die Seite hält sie an: Ein Hinweis sagt, dass sie aus einem geteilten Link stammen, und ausgewertet wird erst, wenn Sie **Auswerten** wählen oder ein Feld ändern. Der Lerninterpreter führt den Text eines Links nie von selbst aus. Ein anderer Modus als `tcl` oder `irules` oder ein Beispielwert im Modus für reines Tcl führt dazu, dass der ganze Link ignoriert wird. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.

## Grenzen

F5 dokumentiert seine Wortoperatoren, aber nicht ihren Vorrang gegenüber den Tcl-Operatoren; das Tool ordnet `contains`, `starts_with` und die anderen bei `==` ein, `and` und `or` bei `&&` und `||`. `rand()` und `srand()` werden abgelehnt, weil sich ihre Ergebnisse nicht reproduzieren lassen. Befehle, die innerhalb eines Ausdrucks laufen (in eckigen Klammern), verwenden denselben kleinen Interpreter wie „iRules-Skripte im Einzelschritt“, begrenzt auf 2.000 Befehle. Über die API wird dieses Tool nicht angeboten, weil es das Tcl ausführt, das Sie ihm geben.

## Quellen

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (abgerufen am 03.10.2026)
- [Tcl 8.4 manual: expr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/expr.htm) (abgerufen am 03.10.2026)
- [F5 iRules reference: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (abgerufen am 02.10.2026)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (abgerufen am 03.10.2026)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (abgerufen am 03.10.2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
- [F5 iRules reference: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) und [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (abgerufen am 27.10.2026): wo eine iRule eine Passphrase, einen Schlüssel oder Zugangsdaten enthält, die einen Link von „Ergebnisse teilen“ verhindern
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (abgerufen am 27.10.2026): Abschnitte 11.6.2 und 11.7.2, die Werte von Authorization und Proxy-Authorization sind Zugangsdaten
