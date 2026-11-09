## Was das Tool tut

Testen, erklären und debuggen Sie einen regulären Ausdruck. Geben Sie ein Muster und einen Text ein, und das Tool zeigt jeden Treffer mit seinen Erfassungsgruppen live, während Sie tippen; geben Sie nur ein Muster ein, zerlegt es dieses in kommentierte Teile, damit Sie lesen können, was jeder Teil tut; und durchgehend warnt es, wenn ein Muster katastrophales Backtracking riskiert. Es verwendet die Regex-Engine von JavaScript (ECMAScript) und läuft vollständig in Ihrem Browser.

## Vier Aufgaben in einem

Das Tool erledigt die vier Dinge, die Sie von einer Regex-Werkbank tatsächlich erwarten:

- **Testen.** Es kompiliert Muster und Flags, meldet Syntaxfehler in verständlichen Worten und führt das Muster auf Ihre Eingabe aus; es liefert jeden Treffer mit seinen nummerierten und benannten Erfassungsgruppen. Die Zahl der gesammelten Treffer ist begrenzt, sodass ein Muster, das eine riesige Eingabe trifft, die Seite nicht blockieren kann.
- **Erklären.** Es zerlegt das Muster in kommentierte Token und benennt jeden Quantifizierer, jede Zeichenklasse, Gruppe und Assertion, sodass Sie einen regulären Ausdruck verstehen, ohne ihn im Kopf ausführen zu müssen.
- **Auf ReDoS prüfen.** Es sucht nach den Strukturen, die katastrophales Backtracking verursachen, und warnt Sie davor.
- **Dialekte vergleichen.** Es listet jedes Konstrukt im Muster auf, dessen Unterstützung oder Bedeutung sich zwischen ECMAScript, PCRE2 (NGINX) und Tcl Advanced Regular Expressions (iRules auf BIG-IP) unterscheidet, statisch, ohne das Muster irgendwo anders als hier auszuführen. Der Abschnitt „Dialekte“ unten erklärt das.

## Was ReDoS ist, und warum es hier wichtig ist

Regular Expression Denial of Service (ReDoS) entsteht, wenn ein Muster bei bestimmten Eingaben auf exponentiell viele Arten per Backtracking zurückgehen kann, sodass eine kurze Zeichenfolge die Engine praktisch endlos laufen lässt. Die klassische Form ist ein Quantifizierer auf einer Gruppe, die selbst einen Quantifizierer enthält, etwa `(a+)+`, angewendet auf eine Eingabe, die am Ende nicht passt. Im Browser ist das unmittelbar relevant: Ein synchroner Regex-Abgleich lässt sich nicht unterbrechen, ein katastrophales Muster würde die Seite also aufhängen. Deshalb begrenzt das Tool seine Arbeit und kennzeichnet riskante Muster, und das ist eine ernst gemeinte Warnung, die Sie beachten sollten, bevor Sie ein Muster ausliefern, das auf nicht vertrauenswürdigen Eingaben läuft. Das [Lab im Artikel zum Backtracking](/learn/regex-catastrophic-backtracking#lab-regex-partitions) zählt, auf wie viele Arten `(a+)+` eine Folge von a zerlegen kann.

## Die Engine und ihr Dialekt

Die Syntax regulärer Ausdrücke unterscheidet sich zwischen Sprachen, und dieses Tool verwendet den Dialekt von JavaScript, wie die ECMAScript-Spezifikation ihn definiert, mit ihren Flags (global, ignore-case, multiline, dotall, unicode und sticky) und ihrer Unterstützung für benannte Gruppen und Lookarounds. Wenn Sie reguläre Ausdrücke für JavaScript schreiben oder für etwas mit derselben Semantik, bekommen Sie genau das, was Sie hier sehen. Zu jeder anderen Engine siehe „Dialekte“ unten.

Unter dem Muster fügt je eine Schaltfläche pro Flag dieses dem Feld „Flags“ hinzu oder entfernt es wieder, jede benannt nach ihrer RegExp-Eigenschaft (`g global`, `i ignoreCase` und so weiter); in das Feld lässt sich weiterhin tippen.

## Dialekte

Der Tester führt eine Engine aus, ECMAScript, aber die Muster, die Fachleute für Netzwerk und Sicherheit schreiben, bleiben selten in JavaScript. Ein Block `location ~` in NGINX, eine iRule auf BIG-IP und eine Signatur einer Web Application Firewall (WAF) übergeben das Muster jeweils an eine andere Engine, und dieselben Zeichen können dort Verschiedenes bedeuten. Der Abschnitt **Portierbarkeit** liest die Token Ihres Musters und listet jedes Konstrukt auf, dessen Unterstützung oder Bedeutung sich zwischen drei Dialekten unterscheidet:

- **ECMAScript**, wie die Ausgabe 2026 von ECMA-262 es definiert (die 17. Ausgabe; ihre RegExp-Grammatik ist im Entwurf für 2027 unverändert), zusammen mit dem Browser-Anhang, der zum Beispiel `\A` zum einfachen Buchstaben A macht, wenn weder das Flag `u` noch `v` gesetzt ist.
- **PCRE2**, wie das eigene Handbuch es beschreibt. NGINX braucht die Bibliothek PCRE für reguläre Ausdrücke in `location` und im Rewrite-Modul, seine Direktiven `map` und `server_name` nehmen ebenfalls reguläre Ausdrücke an, und seit 1.21.5 verwendet es PCRE2, sofern es nicht mit `--without-pcre2` gebaut wird, was die ursprüngliche Bibliothek PCRE auswählt.
- **Tcl Advanced Regular Expressions (AREs)**, wie das Handbuch `re_syntax` von Tcl 8.4 sie beschreibt. Laut F5 wurde der Befehlssatz der iRules von BIG-IP aus der Tcl-Basisversion 8.4.6 entwickelt (K6091), und `regexp` und `regsub` stehen nicht auf der Liste der deaktivierten Tcl-Befehle (K36322151). Die Handbücher zu Tcl 8.6 und 9.0 ergänzen weder Lookbehind noch benannte Gruppen, und ihr `\w` umfasst zusätzlich die verbindenden Satzzeichen (Connector Punctuation).

Jedes Konstrukt erhält eine Antwort pro Dialekt: **gleich** (unterstützt, mit der Bedeutung, die der Titel der Zeile angibt), **abweichend** (unterstützt, aber mit anderer Bedeutung oder Syntax, und die Zeile sagt, wie) oder **nicht unterstützt** (ein Fehler oder als etwas anderes gelesen, und die Zeile sagt, was davon). Der Abschnitt erscheint auch dann, wenn Ihr Browser das Muster nicht kompilieren kann, denn genau darum geht es, wenn Sie ein Muster aus NGINX oder einer iRule einfügen.

Wo diese Muster zu Hause sind, lesen andere Tools sie: Der [Location-Abgleich in NGINX](/tools/nginx-location-matcher) zeigt, welchen Block `location` eine URI auswählt, der [iRules-Performance-Linter](/tools/f5-irules-performance-linter) kennzeichnet `regexp` und `regsub`, wo ein String-Befehl genügen würde, und [Expect-Skripte erklärt](/tools/expect-script-explainer) liest die Muster eines Expect-Skripts, dessen `-re`-Muster laut expect(1) (Expect 5.45.4) „follow the syntax defined by Tcl's regexp“, also der Syntax des Tcl-Befehls regexp folgen; die Tcl-Spalte gilt daher auch für sie.

| Konstrukt | ECMAScript | PCRE2 | Tcl ARE |
|---|---|---|---|
| Lookbehind, feste Länge: `(?<=ab)`, `(?<=colour\|color)` | gleich | gleich: jeder Zweig der obersten Ebene mit fester Länge, bis zu 65.535 Zeichen | nicht unterstützt: nur Lookahead |
| Lookbehind, variabel mit Maximum: `(?<=colou?r)` | gleich | abweichend: ab 10.43 jeder Zweig bis zu einer Grenze, die der Aufrufer setzt, standardmäßig 255; darüber oder vor 10.43 nicht unterstützt | nicht unterstützt |
| Lookbehind ohne Maximum: `(?<=\d+)` | gleich | nicht unterstützt | nicht unterstützt |
| Lookahead mit einer Gruppe oder einer Rückreferenz | gleich | gleich | abweichend: Klammern darin erfassen nie; eine Rückreferenz wird nicht unterstützt |
| Benannte Gruppe `(?<name>...)` | gleich, die einzige Schreibweise | gleich; außerhalb des UTF-Modus muss der Name ASCII sein | nicht unterstützt |
| Benannte Gruppe `(?P<name>...)` oder `(?'name'...)` | nicht unterstützt | gleich | nicht unterstützt |
| Benannte Rückreferenz `\k<name>` | gleich | gleich | nicht unterstützt |
| `\k'name'`, `\k{name}`, `\g{name}`, `\g1`, `\g{-1}`, `(?P=name)` | nicht unterstützt | gleich | nicht unterstützt |
| Modifikatoren mit begrenzter Geltung `(?i:...)`, `(?i-s:...)` | gleich ab ECMAScript 2025, nur die Buchstaben i, m und s | gleich | nicht unterstützt |
| Bloße Optionen `(?i)`, `(?im)` | nicht unterstützt | gleich | nur ganz am Anfang; i und x bedeuten dasselbe, m ist zeilenumbruchsensitiver Vergleich und s der Standardmodus |
| Possessive Quantifizierer `a++`, `a*+` | nicht unterstützt | gleich | nicht unterstützt |
| Atomare Gruppe `(?>...)` | nicht unterstützt | gleich | nicht unterstützt |
| `\A` | nicht unterstützt | gleich | gleich |
| `\Z` | nicht unterstützt | gleich: Ende oder vor einem abschließenden Zeilenumbruch | abweichend: nur das äußerste Ende |
| `\z` | nicht unterstützt | gleich | nicht unterstützt |
| `$` | gleich: Ende; mit `m` vor Zeilenendezeichen | abweichend: auch vor einem abschließenden Zeilenumbruch, sofern PCRE2_DOLLAR_ENDONLY nicht gesetzt ist | gleich: Ende; mit `-line` vor jedem Zeilenumbruch |
| `.` | gleich: nicht LF, CR, U+2028 oder U+2029, außer mit `s` | abweichend: nicht die Zeichen der Zeilenumbruchkonvention, standardmäßig nur LF | abweichend: trifft Zeilenumbrüche, außer beim zeilenumbruchsensitiven Vergleich |
| POSIX-Klasse `[[:alpha:]]` | nicht unterstützt | gleich: ASCII, außer mit PCRE2_UCP; auch `ascii`, `word` und `[:^name:]` | abweichend: Unicode-Locale; zwölf Namen, keine Negation |
| `[[:<:]]`, `[[:>:]]` | nicht unterstützt | gleich, in eine Wortgrenze umgewandelt | gleich, veraltet |
| `\Q...\E` | nicht unterstützt | gleich | nicht unterstützt; `***=` macht einen ganzen Ausdruck literal |
| `\p{L}`, `\P{L}` | abweichend mit `u` oder `v` (strengere Namen); ohne nicht unterstützt | gleich: lockere Namen, bloße Skriptnamen | nicht unterstützt |
| `\pL` | nicht unterstützt | gleich | nicht unterstützt |
| Genügsame Quantifizierer `*?`, `+?`, `??`, `{n,m}?` | gleich | gleich | abweichend: Präferenzregeln für den längsten oder kürzesten Treffer |
| `\b` | gleich: ASCII-Wortzeichen | gleich: ASCII, außer mit PCRE2_UCP | abweichend: Backspace; die Grenze ist `\y` |
| `\B` | gleich | gleich | abweichend: ein Backslash; die Nicht-Grenze ist `\Y` |
| `\w`, `\W` | gleich: ASCII | gleich: ASCII, außer mit PCRE2_UCP | abweichend: Unicode-Locale |
| `\D`, `\S` oder `\W` in eckigen Klammern | gleich | gleich | nicht unterstützt |
| `\m`, `\M`, `\y`, `\Y` | nicht unterstützt: einfache Buchstaben in einem Browser ohne `u` oder `v` | nicht unterstützt: ein Fehler | gleich: Wort-Constraints |
| `{,n}` | nicht unterstützt: literaler Text ohne `u` oder `v` | gleich ab 10.43 | nicht unterstützt: literaler Text |

### Signaturen von Web Application Firewalls

Die Signatursyntax von F5 für Angriffs- und Bot-Signaturen von BIG-IP ASM (ein Handbuch, das für BIG-IP ASM 14.1.0 bis 21.0.0 gilt) nennt drei Regeloptionen für reguläre Ausdrücke. Die Option `pcre` basiert auf der Syntax von PCRE, aber welche PCRE-Bibliothek in welcher Version sie verwendet, gibt F5 nicht an. Die Option `re2` nimmt die Open-Source-Syntax RE2 an, die F5 aus Performancegründen empfiehlt, und diese Ansicht vergleicht RE2 nicht. Die Option `ipp`, nur für Bot-Signaturen, verwendet eine Engine auf Basis von Intel, deren Syntax F5 nicht angibt. Die Spalte PCRE2 ist für die Option `pcre` also der nächstliegende Anhaltspunkt, mehr nicht.

### Was die Ansicht nicht prüft

Sie ist ein statischer Vergleich der Syntax, keine zweite Engine: Sie führt Ihr Muster nie in PCRE2 oder Tcl aus. Sie prüft keine Grenzen der Engines (Grenzen von Quantifizierern, Größe des Musters, die Lookbehind-Grenze über ihren Standardwert von 255 hinaus), weder Performance noch Backtracking-Verhalten, keine Optionen, die ein Produkt für Sie setzt (`~*` von NGINX ohne Beachtung der Groß- und Kleinschreibung, die Modifikatoren einer Signatur, UTF- oder UCP-Modus von PCRE2, den Schalter `-line` von Tcl), und keine Konstrukte außerhalb ihrer Liste, etwa Subroutinenaufrufe, Bedingungen, Kommentare, `\K`, `\G`, `\R`, `\X` sowie hexadezimale oder oktale Escape-Sequenzen. Ein Muster ohne Zeilen ist damit nicht als portierbar bewiesen; es verwendet lediglich nichts aus der Liste.

## Verwendung

Geben Sie Muster und Flags ein und optional einen Text zum Abgleichen, und lesen Sie die Live-Treffer, die Erklärung Token für Token, die Zeilen zur Portierbarkeit und eine etwaige Warnung zum Backtracking. **Beispiel zur Portierbarkeit** lädt ein Muster, das jeder Dialekt anders liest. Alles wird lokal berechnet.

## Ergebnisse teilen

Unter dem Testtext erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen und sobald es ein Muster gibt. Der Link enthält nach dem `#` Muster, Flags und Testtext so, wie eingegeben. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Testtext besteht oft aus echten Daten, daher bittet das Popover Sie, ihn zu lesen, bevor Sie den Link senden. Der Testtext bleibt so, wie eingegeben: Die Treffer sind die Auswertung, und ein darin ersetzter Wert würde anders getroffen. Bevor ein Link angeboten wird, wird der Text nach Zugangsdaten durchsucht, die ein Standard definiert: ein privater Schlüssel im PEM-Format, eine Zeile `Authorization` oder `Proxy-Authorization` mit beliebigem Schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitte 11.6.2 und 11.7.2: Der Wert „consists of credentials“), eine Zeile `Cookie` oder `Set-Cookie` mit einem Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitte 4.1.1 und 4.2.1), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1: Die Form „user:password“ „is deprecated“), eine AWS-Zugriffsschlüssel-ID oder ein `ENC`-Wert von FortiOS; alle abgerufen am 01.11.2026. Findet sich eines davon, gibt es keinen Link: Das Popover nennt das Feld und die Zeile, und Sie setzen einen Platzhalter an seine Stelle und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur nach einem Secret aussieht (ein `password=` in einer Query, `api_key = ...`), blockiert den Link nicht; das Popover nennt den ersten solchen Wert, damit Sie ihn prüfen können.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` steht, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die drei Felder werden so gefüllt, wie Sie sie eingeben würden, und die Seite erklärt und gleicht ab. Ein Muster, das die statische Prüfung wegen katastrophalen Backtrackings kennzeichnet, wartet weiterhin hinter **Trotzdem ausführen**: Ein Link gibt diese Zustimmung nie. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Quellen

- [ECMA-262, ECMAScript 2026 Language Specification (17th edition), 22.2.1 Patterns](https://tc39.es/ecma262/2026/#sec-patterns), [22.2.2 Pattern Semantics](https://tc39.es/ecma262/2026/#sec-pattern-semantics), [Annex B.1.2 Regular Expressions Patterns](https://tc39.es/ecma262/2026/#sec-regular-expressions-patterns) und die [Introduction](https://tc39.es/ecma262/2026/#sec-intro) (ECMAScript 2025 hat Inline-Modifikatoren eingeführt) (abgerufen am 26.10.2026)
- [ECMA-262 draft, 22.2 RegExp Objects](https://tc39.es/ecma262/multipage/text-processing.html): Die Mustergrammatik des Entwurfs für 2027 entspricht der Ausgabe 2026 (abgerufen am 26.10.2026)
- [PCRE2 manual: pcre2pattern](https://www.pcre2.org/doc/pcre2pattern/), [pcre2syntax](https://www.pcre2.org/doc/pcre2syntax/), [pcre2api](https://www.pcre2.org/doc/pcre2api/) und [pcre2build](https://www.pcre2.org/doc/pcre2build/) (Handbuch 10.50-DEV; abgerufen am 26.10.2026)
- [Tcl 8.4 manual: re_syntax](https://www.tcl-lang.org/man/tcl8.4/TclCmd/re_syntax.htm) und [regexp](https://www.tcl-lang.org/man/tcl8.4/TclCmd/regexp.htm); [Tcl 8.6.18: re_syntax](https://www.tcl-lang.org/man/tcl8.6/TclCmd/re_syntax.htm); [Tcl 9.0.4: re_syntax](https://www.tcl-lang.org/man/tcl9.0/TclCmd/re_syntax.html) (abgerufen am 26.10.2026)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) und [K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (abgerufen am 26.10.2026)
- [F5 BIG-IP ASM: Attack and Bot Signatures, Signature Syntax](https://techdocs.f5.com/en-us/bigip-14-1-0/big-ip-asm-attack-and-bot-signatures-14-1-0/signature-syntax.html) (gilt für BIG-IP ASM 14.1.0 bis 21.0.0; abgerufen am 26.10.2026)
- nginx: [location](https://nginx.org/en/docs/http/ngx_http_core_module.html#location), [map](https://nginx.org/en/docs/http/ngx_http_map_module.html#map), [Building nginx from Sources](https://nginx.org/en/docs/configure.html) und [Regular expression captures](https://nginx.org/en/docs/regex_captures.html) (abgerufen am 26.10.2026)
- [expect(1), Quelltext der Manpage von Expect 5.45.4](https://core.tcl-lang.org/expect/raw?name=expect.man&ci=expect-5-45-4) (abgerufen am 27.10.2026): Muster im Stil von regexp folgen der Syntax, die der Tcl-Befehl regexp definiert
