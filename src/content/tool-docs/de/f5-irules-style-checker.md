## Was das Tool tut

Das Tool prüft eine iRule anhand des „iRules Style Guide“ von DevCentral (veröffentlicht von JRahm mit Jim_Deucker am 22.12.2022), ergänzt zwei Punkte aus dem Kommentar-Thread des Leitfadens und parst die Regel mit einem echten Tcl 8.4. Die Regel wird geparst, nie ausgeführt. Jeder Befund nennt die Regel, aus der er stammt, die Zeile und was zu ändern ist; betroffene Zeilen werden in einer nummerierten Kopie der Regel markiert.

## Was das Tool prüft

- **Editoreinstellungen (E1 bis E3):** Tabs und Einrückungen, die kein Vielfaches von 4 Leerzeichen sind, Zeilen über 100 Spalten (eine Warnung über 120), Windows-Zeilenenden, Whitespace am Zeilenende, ein fehlender abschließender Zeilenvorschub und Nicht-ASCII-Zeichen, jeweils mit Codepunkt, offiziellem Unicode-Namen und Spalte.
- **Nummerierte Regeln:** Zeichen, die Code zerstören (R1), das Größenlimit von F5 (R2), eine einzelne `{` auf eigener Zeile oder `else` auf einer neuen Zeile (R4), Kommentare am Zeilenende, Kommentare ohne Leerzeichen und Kommentare zwischen `switch`-Mustern (R6), mehrere Befehle in einer Zeile (R7), einzeiliges `if` (R8), Zustand als Wörter wie `yes` gespeichert (R9), die Operatoren `and` / `or` / `not` von F5 (R10), `}{` ohne Leerzeichen oder ein Schlüsselwort, das an seiner Klammer klebt (R11), ungeklammerte Ausdrücke (R12), Variablen in Ausdrücken ohne Leerzeichen drumherum (R13) oder ohne geschweifte Klammern um den Namen (R14), `switch` und `table` ohne `--` (R15), Ereignisse ohne Priorität (R16), `table`-Einträge ohne Timeout oder Lebensdauer (R17; sonst gelten laut der Referenz von F5 zu `table` ein Timeout von 180 Sekunden und eine unbegrenzte Lebensdauer), `static::`-Namen ohne Präfix (R18), Debug-Flags in `static::` (R19) und auskommentierter Code (R20).
- **Aus dem Kommentar-Thread (D1, D2):** `==` oder `!=` mit einem Textstück, wo `eq` oder `ne` gemeint ist (D1); `break` oder `continue` ohne umgebende Schleife, `break` in einem `switch`-Zweig innerhalb einer Schleife und `return` in einem `switch`-Zweig (D2).
- **Syntax:** Ein Fehler, den der Parser von Tcl 8.4 meldet, etwa bei `}{` ohne Leerzeichen („extra characters after close-brace“), bedeutet, dass die iRule überhaupt nicht geladen werden kann.

## Zeichen, die sich im Code verstecken

Die erste Regel des Leitfadens betrifft typografische Anführungszeichen und geschützte Leerzeichen, die ein Textverarbeitungsprogramm einschleust. Die Prüfung klassifiziert jedes Nicht-ASCII-Zeichen mit der Unicode Character Database 18.0.0 und findet so die ganze Familie, nicht nur diese beiden:

- **R1, Fehler:** unsichtbare Zeichen (die Liste Default_Ignorable_Code_Point von Unicode: Leerzeichen und Verbinder mit Nullbreite, die Byte Order Mark, der weiche Trennstrich, bidirektionale Steuerzeichen), Leerzeichen, die nicht das ASCII-Leerzeichen sind (geschützte Leerzeichen, Geviert-Leerzeichen, ideografische und weitere), und typografische Anführungszeichen. In tclsh 8.4.6 getestet: Ein geschütztes Leerzeichen verbindet zwei Wörter zu einem einzigen Befehlsnamen, geschwungene Anführungszeichen gruppieren keine Wörter, und ein Leerzeichen mit Nullbreite nach einer schließenden geschweiften Klammer stoppt die Regel mit „extra characters after close-brace“.
- **E3, Warnung:** Striche, die nicht das ASCII-Zeichen Hyphen-Minus sind. Tcl liest sie weder als Options-Strich noch als Minuszeichen: Ein `switch`, bei dem dort, wo `--` hingehört, ein Halbgeviertstrich (U+2013) getippt wurde, nimmt den Strich als Wert und passt still auf nichts.
- **E3, Hinweis:** andere Zeichen, die wie ASCII aussehen (vollbreite Buchstaben, die Auslassungspunkte, römische Zahlzeichen), und jedes andere Nicht-ASCII-Zeichen.

Das betrifft den Leitfaden selbst: Im Stand vom 03.10.2026 hat sein Beispiel zu `RULE_INIT` ein Leerzeichen mit Nullbreite nach der schließenden geschweiften Klammer, und sein Debug-Beispiel hat eine Zeile, die nur ein solches Zeichen enthält; wer eines der beiden wörtlich kopiert, zerstört die iRule.

## Das Größenlimit

F5 K9204 setzt die Grenze auf 65.520 Zeichen; BIG-IP weigert sich, eine längere iRule zu speichern oder zu laden, mit einer Fehlermeldung, die „Max string size exceeded“ und „max:65520“ enthält. Der Leitfaden rundet das auf 64 KB. Die Prüfung zählt die Zeichen und die Bytes, die sie in UTF-8 belegen, und meldet R2, wenn einer der beiden Werte 65.520 überschreitet.

## Aus dem Kommentar-Thread

- **D1:** Kai Wilke wies darauf hin, dass das Beispiel zu Regel 10 des Leitfadens Text mit `==` vergleicht, und die Autoren stimmten zu, einen Punkt zu `eq` / `ne` aufzunehmen. `==` vergleicht als Zahlen, sobald beide Seiten wie Zahlen aussehen: In Tcl 8.4.6 sind `10 == 012` und `1 == "0x0000001"` beide wahr. Die Seite How To Write Fast Rules von F5 verlangt, Zahlen mit Zahlen und Strings mit Strings zu vergleichen.
- **D2:** Juergen Mang merkte an, dass `switch`-Zweige kein `return` oder `break` brauchen, um zu stoppen. Ein `switch`-Zweig läuft nie in den nächsten weiter, `return` verlässt das ganze Ereignis (Seite von F5 zu `return`), und `break` ohne umgebende Schleife ist in Tcl 8.4.6 ein Fehler (in einem proc-Rumpf geprüft). Was TMM damit in einem Ereignisrumpf macht, dokumentiert F5 nicht.

## Ergebnisse teilen

Unter der Bewertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die iRule so, wie eingefügt, und sonst nichts. Bevor Sie etwas kopieren, ergänzt das Popover einen Warnhinweis: Eine iRule kann interne Hosts, Pools und Data Groups nennen.

Bevor die Seite überhaupt einen Link anbietet, durchsucht sie die iRule nach Schlüsseln und Zugangsdaten, die dort ausgeschrieben sind, wo die Referenzen von F5 sie vorsehen (alle abgerufen am 27.10.2026):

- die Passphrase von `HTTP::cookie encrypt` und `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- ein Schlüssel in der String-Form `AES 128 <hex>` oder der ausgeschriebene Schlüssel von `AES::encrypt` und `AES::decrypt` ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- der Wert von `-key` oder `-keyhex` bei `CRYPTO::encrypt`, `decrypt`, `sign` und `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- ein `Authorization`- oder `Proxy-Authorization`-Header, der mit `HTTP::header insert` oder `replace` geschrieben wird ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)) und dessen Wert [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (Abschnitte 11.6.2 und 11.7.2) als Zugangsdaten definiert;
- ein Literal, das per `set` einer Variablen zugewiesen wird, die an einer dieser Stellen verwendet wird, wie im Beispiel von `CRYPTO::encrypt` selbst;
- und, aus der Secret-Prüfung der Website, ein privater PEM-Schlüssel, ein JWT, eine Zugriffsschlüssel-ID von AWS oder ein Passwort in einer URL.

Findet die Seite einen davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie ersetzen den Wert durch einen Platzhalter und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur nach einem Secret aussieht (`set static::api_token "..."`), verhindert den Link nicht; stattdessen nennt ihn der Warnhinweis. Keine Prüfung findet jedes Secret, lesen Sie also, was Sie senden.

Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist eine iRule länger, gibt es keinen Link, und das Popover nennt ihre Länge. F5 erlaubt iRules mit bis zu 65.520 Zeichen (K9204); eine lange iRule kann diese Prüfung also bestehen und trotzdem für einen Link zu lang sein.
- **Öffnen eines Links.** Der Text füllt das Feld wie beim Einfügen, und die Seite liest ihn so, wie sie eingefügten Text liest; die iRule wird nie ausgeführt. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.

## Grenzen

- Array-Variablen wie `$static::pools($key)` sind gültiges Tcl, aber die Tcl-Engine der Website bildet sie nicht ab. Die Prüfung liest jede als einfache Variable, prüft den Rest der Regel weiter und weist in einem Hinweis darauf hin.
- Manche Regeln lassen sich nicht allein am Text beurteilen. Ob eine Zeile, die mit `#` beginnt, auskommentierter Code oder ein Kommentar ohne Leerzeichen ist, wird anhand des ersten Worts geschätzt, daher sind diese Befunde Hinweise.
- Regel R3 (die iRule in funktionale Blöcke gliedern) ist eine Designentscheidung, die die Prüfung nicht beurteilt. R5 (die Einrückung von 4 Leerzeichen, auch in verschachtelten Werten wie `switch`-Zweigen) deckt die Prüfung der Einrückung ab. Die Editoreinstellung, Zeilenfortsetzungen zu vermeiden, wird nicht geprüft.

## Quellen

- [F5 DevCentral: iRules Style Guide, mit dem Kommentar-Thread](https://community.f5.com/t/irules-style-guide/71151) (abgerufen am 03.10.2026)
- [F5 K9204: iRules are limited to 65,520 characters](https://my.f5.com/manage/s/article/K9204) (abgerufen am 03.10.2026)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (abgerufen am 03.10.2026)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (abgerufen am 03.10.2026)
- [F5 iRules reference: How To Write Fast Rules](https://clouddocs.f5.com/api/irules/HowToWriteFastRules.html) (abgerufen am 03.10.2026)
- [F5 iRules reference: return](https://clouddocs.f5.com/api/irules/return.html) (abgerufen am 03.10.2026)
- [F5 iRules reference: priority](https://clouddocs.f5.com/api/irules/priority.html) (abgerufen am 03.10.2026)
- [F5 iRules reference: table](https://clouddocs.f5.com/api/irules/table.html) (abgerufen am 03.10.2026)
- [Tcl 8.4 manual: switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (abgerufen am 03.10.2026)
- [Tcl 8.4 manual: break](https://www.tcl-lang.org/man/tcl8.4/TclCmd/break.htm) (abgerufen am 03.10.2026)
- [Unicode Character Database 18.0.0: PropList.txt](https://www.unicode.org/Public/UCD/latest/ucd/PropList.txt) (abgerufen am 03.10.2026)
- [Unicode Character Database 18.0.0: DerivedCoreProperties.txt](https://www.unicode.org/Public/UCD/latest/ucd/DerivedCoreProperties.txt) (abgerufen am 03.10.2026)
- [Unicode Character Database 18.0.0: UnicodeData.txt](https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt) (abgerufen am 03.10.2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
- [F5 iRules reference: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) und [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (abgerufen am 27.10.2026): wo eine iRule eine Passphrase, einen Schlüssel oder Zugangsdaten enthält, die einen Link von „Ergebnisse teilen“ verhindern
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (abgerufen am 27.10.2026): Abschnitte 11.6.2 und 11.7.2, die Werte von Authorization und Proxy-Authorization sind Zugangsdaten
