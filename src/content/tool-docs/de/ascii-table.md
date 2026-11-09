## Was das Tool tut

ASCII hat 128 Codes, 0 bis 127, und die meisten Menschen brauchen immer nur einen davon: den Code eines Zeichens, das Zeichen hinter einem Code oder die Art, es in einer Konfigurationsdatei, einer JSON-Zeichenfolge oder einer iRule zu schreiben. Das Tool beantwortet diese Fragen für jeden Code und stellt klar, wenn das, was Sie vor sich haben, gar kein ASCII ist.

Es hat vier Teile:

- **Nachschlagen** liest einen Code in jeder Notation und zeigt alles darüber: die Zahlen, die Bits, die Namen, wofür der Code 1968 definiert wurde und was Linux heute damit macht, wie man ihn an sieben Stellen schreibt und welche Sprachen ihn als Whitespace zählen.
- **Die Tabelle** ordnet die 128 Codes so an, wie RFC 20 sie zeichnet, acht Spalten mal sechzehn Zeilen, oder als Liste. Wählen Sie einen beliebigen Code, um ihn beim Nachschlagen zu sehen.
- **Text zu Codes** nimmt einen eingefügten Text und zeigt den Code jedes Zeichens; alles außerhalb von ASCII wird mit Namen aufgeführt, mit dem Grund, warum es Probleme machen kann.
- **Whitespace im Vergleich** stellt die zehn Codes, die Whitespace sein könnten, sieben Definitionen gegenüber, die sich darüber uneinig sind.

## Was das Feld zum Nachschlagen liest

| Sie geben ein | Gelesen als |
|---|---|
| `A` | das Zeichen selbst (ein `'A'` in Anführungszeichen funktioniert auch) |
| `65` | dezimal |
| `0x41`, `41h`, `x41` | hexadezimal |
| `0o101` | oktal |
| `1000001`, `00100101` | sieben oder acht Binärziffern, als Bits gelesen |
| `0b1000001` | binär mit Präfix |
| `4/1` | Spalte/Zeile nach RFC 20: Spalte 4, Zeile 1 |
| `U+0041` | Unicode-Notation |
| `&#65;`, `&#x41;`, `&excl;` | numerische und benannte HTML-Referenzen |
| `%41` | Prozentkodierung |
| `\x41`, `\101`, `\n`, `\u0041`, `\u{1F600}` | Escape-Sequenzen mit Backslash |
| `^A`, `^[`, `^?` | Caret-Notation |
| `NUL`, `LF`, `line feed`, `Reverse Slant` | Abkürzungen und Namen aus RFC 20, Unicode 1.0 und dem aktuellen Unicode |
| `en dash`, `minus sign` | jeder Unicode-Name oder Alias (tolerant abgeglichen: Groß- und Kleinschreibung, Leerzeichen, Unterstriche und Bindestriche im Wortinneren werden ignoriert, wie es die Regel UAX44-LM2 in UAX #44 vorgibt) |

Sieben oder acht Binärziffern für sich allein werden als Bits gelesen, weil eine so lange Folge aus Nullen und Einsen fast immer genau das ist. Eine längere Dezimalzahl wie `1000` wird dezimal gelesen und liegt außerhalb von ASCII.

## Einen Code lesen

- **Zahlen.** Dezimal, hexadezimal, oktal, sieben Bits und das volle Byte. Das oberste Bit des Bytes ist 0: RFC 20 legte 7-Bit-ASCII „in an 8 bit byte whose high order bit is always 0“ ab.
- **Spalte/Zeile.** RFC 20 benennt jede Position nach Spalte und Zeile: `K` ist `4/11`. Die Spalte sind die Bits b7 b6 b5 und die Zeile b4 b3 b2 b1, 4/11 ist also 100 1011.
- **Ein Bit umschalten.** Jedes der sieben Bits ist eine Schaltfläche, die es umschaltet und zum Ergebnis springt. Zwei davon erklären den Großteil der Tabelle: b6 (32) ist der einzige Unterschied zwischen Groß- und Kleinbuchstaben, und b7 (64) trennt ein Steuerzeichen von dem Zeichen, mit dem es in der Caret-Notation gepaart ist (`A` und `^A`, `[` und `^[`, das ist ESC).
- **Namen.** Der aktuelle Unicode-Name, der Name aus Unicode 1.0, wenn er abweicht (`BACKSLASH`, `SPACING UNDERSCORE`), der Name aus RFC 20 (`Reverse Slant`, `Underline`, `Overline`) und dessen Alternativen. Steuerzeichen haben überhaupt keinen Unicode-Namen: Die Eigenschaft Name ist für sie in Unicode leer, und sie werden über formale Aliasse aus ISO 6429 benannt (`LINE FEED`, `NEW LINE`, `END OF LINE`, abgekürzt `LF`, `NL`, `EOL`). Die Tabelle in RFC 20 nennt Code 25 `EM`; die erste Abkürzung in Unicode dafür ist `EOM`.
- **Kategorie und Klasse.** Die General_Category aus der Unicode Character Database und für die Steuerzeichen die Klasse nach RFC 20: Übertragungssteuerzeichen (communication control, CC), Formatsteuerzeichen (format effector, FE) oder Informationstrennzeichen (information separator, IS).
- **Hinweise.** Anmerkung 3 in RFC 20 kennzeichnet elf Positionen (`#` `@` `[` `\` `]` `^` `` ` `` `{` `|` `}` `~`), die im internationalen Austausch nicht ohne vorherige Absprache verwendet werden sollten; Anmerkung 4 erlaubt, dass das Pfund-Sterling-Zeichen den Platz von `#` einnimmt.
- **Wofür es gedacht war und was es heute bewirkt.** Für jedes Steuerzeichen eine Zusammenfassung der Definition aus RFC 20 und, wo Linux ihm eine Aufgabe gibt, diese Aufgabe: Strg+C (ETX) unterbricht, Strg+D (EOT) beendet die Eingabe, Strg+S und Strg+Q (DC3, DC1) stoppen die Ausgabe und setzen sie fort, Strg+Z (SUB) suspendiert den Prozess, und ESC beginnt auf der Linux-Konsole eine Escape-Sequenz. Das stammt aus den Linux-Manpages termios(3) und console_codes(4).
- **So schreiben Sie es.** Die Form für ein Zeichenfolgenliteral in C, JSON, JavaScript, Python und Tcl (iRules), die HTML-Referenzen und die URL-Form mit ihrer Klasse nach RFC 3986. Wo eine Sprache eine Falle hat, folgt ein kurzer Hinweis (siehe unten).
- **Whitespace?** Ja oder nein für jede der sieben Definitionen.
- **Beziehungen.** Caret-Notation, der andere Buchstabe (groß oder klein), der Wert einer Ziffer und die ASCII-Zeichen, die UTS #39 als damit verwechselbar zählt (`1`, `I`, `l` und `|` teilen sich einen Prototyp; `0` und `O` einen anderen).

## Die Fallen, die die Escape-Sequenzen umgehen

- **Hexadezimale Escape-Sequenzen in C enden nicht nach zwei Ziffern.** `"\x1Bfoo"` liest weiter Hexziffern, daher schreibt das Tool Steuerzeichen in C oktal (`\033`), was nach drei Ziffern endet.
- **Tcl 8.4, und damit iRules, behält von `\x` nur die letzten zwei Hexziffern.** `"\x1Bfoo"` liest `\x1Bf` und behält `Bf`: Das Ergebnis ist das Byte 0xBF, gefolgt von `oo`, nicht ESC und `foo`. Das Tool schreibt Steuerzeichen auch in Tcl oktal. Das wurde in Tcl 8.4.6 ausgeführt.
- **JSON muss das Anführungszeichen, den Reverse Solidus und die Steuerzeichen 0 bis 31 maskieren** und darf DEL unverändert lassen (RFC 8259, Abschnitt 7).
- **In JavaScript bedeutet `\0` nur dann NUL, wenn keine Ziffer folgt.**
- **HTML macht aus `&#0;` U+FFFD**, das Ersetzungszeichen, und behandelt Referenzen auf die meisten Steuerzeichen als Parse-Fehler (der Parser nach WHATWG).

## Wenn es kein ASCII ist

Ein Wert über 127 wird benannt, mit der Anzahl der UTF-8-Bytes, die er braucht, und der Art von Problem, die er verursachen kann: unsichtbar, ein Leerzeichen, das nicht das ASCII-Leerzeichen ist, ein typografisches Anführungszeichen, ein Strich, der nicht das Hyphen-Minus ist, oder ein Zeichen, dessen Kompatibilitätsform ASCII ist. Führt UTS #39 es als verwechselbar mit ASCII-Text, nennt das Tool diesen Text und bietet das ASCII-Zeichen an, das Sie vermutlich gemeint haben.

Zwei Fälle sind häufig genug, um Vorlagen zu sein. `&minus;` ist U+2212 MINUS SIGN und `&tilde;` ist U+02DC SMALL TILDE: Keines davon ist ASCII, und das ASCII-Hyphen-Minus (45) und die ASCII-Tilde (126) haben überhaupt keine benannte Referenz. Schreiben Sie `&#45;` und `&#126;` oder die Zeichen selbst. Manche veröffentlichten ASCII-Tabellen führen `&minus;` und `&tilde;` bei 45 und 126; die Liste der benannten Referenzen der WHATWG tut das nicht.

Für jede Eigenschaft eines Codepunkts außerhalb von ASCII verlinkt das Ergebnis auf den [Unicode-Inspektor](/tools/unicode-inspector).

## Das Textfeld

Fügen Sie eine Zeile aus einer Konfiguration, einer iRule oder einer E-Mail ein. Jedes Zeichen erscheint als Zelle mit seinem Code (hexadezimal bei ASCII, der Codepunkt bei allem anderen), und alles außerhalb von ASCII wird mit Position, UTF-8-Bytes, Namen und dem Grund aufgeführt, warum es Probleme machen kann. Gelesen werden bis zu 2.000 Zeichen.

## So wurde geprüft

Jede Escape-Sequenz, jede Referenz und jede Whitespace-Antwort wurde am 03.10.2026 für alle 128 Codes in den echten Implementierungen ausgeführt, und alle stimmen mit dem Tool überein: Zeichenfolgenliterale in CPython 3.11, Node 22, GCC (C11) und Tcl 8.4.6; HTML-Referenzen (dezimal, hexadezimal und benannt) in Chromium; Whitespace mit `isspace()` in C, `str.isspace()` in Python, `\s` und `trim()` in JavaScript, einem strikten JSON-Parser, dem Befehlsparser von Tcl 8.4.6 und der DOM-eigenen Aufteilung an ASCII-Whitespace. Jede Zelle der Codetabelle von RFC 20 wurde mit den Daten des Tools verglichen. Die Unicode-Namen wurden für jeden der 1.114.112 Codepunkte mit der Datendatei von Unicode 18.0.0 abgeglichen.

## Ergebnisse teilen

Unter der Antwort zum Nachschlagen erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Wert im Feld zum Nachschlagen so, wie eingegeben: `/tools/ascii-table#input=%26tilde%3B`. Das Feld „Text zu Codes“ ist ein eigener Teil der Seite und nicht enthalten. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Wert beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Das Feld zum Nachschlagen fasst 200 Zeichen, weit unter den 16.384, die die Website nach dem `#` erlaubt.
- **Öffnen eines Links.** Der Link hat die Form `#input=`, mit der die Links des Unicode-Inspektors schon bisher einen Code hier öffnen; das Öffnen funktioniert also genau wie bei diesen Links: Der Wert füllt das Feld, die Seite liest ihn, und er bleibt in der Adresse, bis Sie das Feld ändern oder leeren.

## Grenzen

- ASCII ist hier der 7-Bit-Code. Die Codes 128 bis 255 gehören zu dem 8-Bit-Zeichensatz, den ein System verwendet (Latin-1, Windows-1252, eine DOS-Codepage); das Tool rät nicht, welcher es ist.
- Das Verhalten im Terminal ist das von Linux, laut seinen Manpages. Andere Systeme können die Steuertasten anders belegen.
- Das Feld zum Nachschlagen liest jeweils einen Wert. Für Text verwenden Sie das Textfeld oder den [Unicode-Inspektor](/tools/unicode-inspector).

## Quellen

- [RFC 20: ASCII format for Network Interchange (1969), reproducing USAS X3.4-1968](https://www.rfc-editor.org/rfc/rfc20) (abgerufen am 03.10.2026)
- [Unicode Character Database 18.0.0: UnicodeData.txt](https://www.unicode.org/Public/18.0.0/ucd/UnicodeData.txt) (abgerufen am 03.10.2026)
- [Unicode Character Database 18.0.0: NameAliases.txt](https://www.unicode.org/Public/18.0.0/ucd/NameAliases.txt) (abgerufen am 03.10.2026)
- [Unicode Character Database 18.0.0: DerivedName.txt](https://www.unicode.org/Public/18.0.0/ucd/extracted/DerivedName.txt) (abgerufen am 03.10.2026)
- [The Unicode Standard 18.0.0, chapter 4: Character Properties (the Name property)](https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-4/) (abgerufen am 03.10.2026)
- [UAX #44: Unicode Character Database (UAX44-LM2, General_Category values)](https://www.unicode.org/reports/tr44/) (abgerufen am 03.10.2026)
- [UTS #39: Unicode Security Mechanisms, confusables.txt 18.0.0](https://www.unicode.org/Public/18.0.0/security/confusables.txt) (abgerufen am 03.10.2026)
- [WHATWG HTML: named character references (entities.json)](https://html.spec.whatwg.org/entities.json) (abgerufen am 03.10.2026)
- [WHATWG HTML: parsing (numeric character reference end state)](https://html.spec.whatwg.org/multipage/parsing.html) (abgerufen am 03.10.2026)
- [WHATWG Infra: ASCII whitespace](https://infra.spec.whatwg.org/) (abgerufen am 03.10.2026)
- [ISO/IEC 9899:2011 committee draft N1570 (C11)](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) (abgerufen am 03.10.2026)
- [RFC 8259: JSON](https://www.rfc-editor.org/rfc/rfc8259) (abgerufen am 03.10.2026)
- [ECMA-262: ECMAScript Language Specification](https://tc39.es/ecma262/) (abgerufen am 03.10.2026)
- [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) (abgerufen am 03.10.2026)
- [Tcl 8.4 manual: Tcl (backslash substitution)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (abgerufen am 03.10.2026)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 03.10.2026); Abschnitt 3.5 (abgerufen am 27.10.2026): das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
- [RFC 5234: ABNF (core rules)](https://www.rfc-editor.org/rfc/rfc5234) (abgerufen am 03.10.2026)
- [RFC 5321: SMTP (lines end with CR LF)](https://www.rfc-editor.org/rfc/rfc5321) (abgerufen am 03.10.2026)
- [RFC 9112: HTTP/1.1 (message format)](https://www.rfc-editor.org/rfc/rfc9112) (abgerufen am 03.10.2026)
- [POSIX.1-2024: Definitions (line, newline)](https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap03.html) (abgerufen am 03.10.2026)
- [Linux manual page termios(3)](https://man7.org/linux/man-pages/man3/termios.3.html) (abgerufen am 03.10.2026)
- [Linux manual page console_codes(4)](https://man7.org/linux/man-pages/man4/console_codes.4.html) (abgerufen am 03.10.2026)
