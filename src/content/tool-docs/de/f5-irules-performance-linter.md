## Was das Tool tut

Fügen Sie eine iRule ein; der Linter markiert Zeile für Zeile eine kleine Menge zuverlässig erkennbarer, von F5 dokumentierter Anti-Patterns bei Performance und Korrektheit, jeweils mit Schweregrad, dem auslösenden Token, der Begründung und der Abhilfe. Er ist ein statischer Scanner (kein Tcl-Parser, keine Ausführung) und deckt daher bewusst nur Muster ab, die eine zeilenweise Suche zuverlässig und mit wenigen False Positives findet. Er ersetzt keine Messung: Kombinieren Sie ihn mit dem iRules-Laufzeitrechner, der echte Timing-Statistiken auswertet, um die tatsächlichen Kosten einer Regel zu sehen. Alles läuft lokal.

## Was das Tool markiert

**Variablen im globalen Namespace** (`$::x`, `set ::x`, das Schlüsselwort `global`) werden als HOCH markiert. Der Validator von F5 erkennt das Schlüsselwort `global` ab v10 und stuft den virtuellen Server auf eine einzige TMM-Instanz herab (CMP-Herabstufung), sodass ein Prozessor alle Verbindungen dieses virtuellen Servers bearbeitet; globale Variablen gelten seit v10 als veraltet. Die überholte Form `$::datagroup` ist noch schlimmer: Ab Version 11 löst der Zugriff auf eine Data Group auf diese Weise einen Tcl-Laufzeitfehler aus und sendet einen Reset an den Client. Die Abhilfe ist der CMP-sichere Namespace `static::` für gemeinsame Konstanten, gewöhnliche lokale Variablen für Daten pro Verbindung oder der Befehl `class` für Data Groups.

**`expr` ohne geschweifte Klammern** ist eine WARNUNG. Tcl ersetzt und parst die ungeklammerte Form erneut und kann doppelt ersetzen; ein geklammerter Ausdruck lässt sich vom Bytecode-Compiler optimieren. Die Abhilfe ist `expr { ... }`.

**`matchclass` / `findclass`** sind INFO. Beide wurden in v10 zugunsten des Befehls `class` als veraltet markiert, der laut F5 bessere Funktionalität und Performance bietet. Die Abhilfe ist `class match` / `class search`.

**`regexp` / `regsub`** sind INFO. Reguläre Ausdrücke kosten deutlich mehr als feste String-Operationen; ist der Treffer ein Präfix, ein Suffix, ein exakter Wert oder ein einfacher Glob, sind `string`, `scan`, `switch -glob` oder `class` günstiger. Bleibt es bei einem regulären Ausdruck, listet die Ansicht zur Portierbarkeit im [Regex-Toolkit](/tools/regex) die Konstrukte auf, die sich in den Advanced Regular Expressions von Tcl, dem Dialekt, den das Toolkit mit BIG-IP iRules beschriftet, anders lesen als in JavaScript oder PCRE2.

## Was das Tool bewusst nicht markiert

`static::`-Variablen (CMP-sicher), `class match` / `class search` und geklammertes `expr` sind korrekt und bleiben ohne Befund. Persistenz, Tabellen und der Befehl `session` sind auf aktuellen Versionen CMP-kompatibel und werden daher nicht als CMP-Probleme behandelt. Reine Kommentarzeilen werden übersprungen.

## Ergebnisse teilen

Unter der Zusammenfassung der Befunde erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die iRule so, wie eingefügt, und sonst nichts. Bevor Sie etwas kopieren, ergänzt das Popover einen Warnhinweis: Eine iRule kann interne Hosts, Pools und Data Groups nennen.

Bevor die Seite überhaupt einen Link anbietet, durchsucht sie die iRule nach Schlüsseln und Zugangsdaten, die dort ausgeschrieben sind, wo die Referenzen von F5 sie vorsehen (alle abgerufen am 27.10.2026):

- die Passphrase von `HTTP::cookie encrypt` und `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- ein Schlüssel in der String-Form `AES 128 <hex>` oder der ausgeschriebene Schlüssel von `AES::encrypt` und `AES::decrypt` ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- der Wert von `-key` oder `-keyhex` bei `CRYPTO::encrypt`, `decrypt`, `sign` und `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- ein `Authorization`- oder `Proxy-Authorization`-Header, der mit `HTTP::header insert` oder `replace` geschrieben wird ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)) und dessen Wert [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (Abschnitte 11.6.2 und 11.7.2) als Zugangsdaten definiert;
- ein Literal, das per `set` einer Variablen zugewiesen wird, die an einer dieser Stellen verwendet wird, wie im Beispiel von `CRYPTO::encrypt` selbst;
- und, aus der Secret-Prüfung der Website, ein privater PEM-Schlüssel, ein JWT, eine Zugriffsschlüssel-ID von AWS oder ein Passwort in einer URL.

Findet die Seite einen davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie ersetzen den Wert durch einen Platzhalter und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur nach einem Secret aussieht (`set static::api_token "..."`), verhindert den Link nicht; stattdessen nennt ihn der Warnhinweis. Keine Prüfung findet jedes Secret, lesen Sie also, was Sie senden.

Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist eine iRule länger, gibt es keinen Link, und das Popover nennt ihre Länge.
- **Öffnen eines Links.** Der Text füllt das Feld wie beim Einfügen, und die Seite liest ihn so, wie sie eingefügten Text liest; die iRule wird nie ausgeführt. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.
