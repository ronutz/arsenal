## Was das Tool tut

Ein Byte bedeutet nichts, solange niemand sagt, in welchem Zeichensatz es steht. `E9` ist é in windows-1252, Ú in IBM 850 und Z in EBCDIC, und in UTF-8 ist es überhaupt kein Zeichen, sondern nur das erste Byte eines Zeichens. Dieses Tool zeigt denselben Text und dieselben Bytes gleichzeitig durch vierzehn Zeichensätze, dekodiert Bytes genau so, wie ein Browser sie dekodiert, und macht den Schaden rückgängig, wenn Text im falschen Zeichensatz gelesen wurde.

Es hat drei Modi:

- **Text zu Bytes** schreibt einen Text in einem Zeichensatz, in sechs Schreibweisen, Zeichen für Zeichen, und sagt, was mit jedem Zeichen geschah, das der Zeichensatz nicht abbilden kann. Danach zeigt es denselben Text in jedem Zeichensatz und wie diese Bytes in jedem Zeichensatz zurückgelesen werden: das Mojibake, das jede falsche Annahme erzeugt.
- **Bytes zu Text** liest Bytes, die als Hex eingegeben oder aus einem Hexdump eingefügt wurden, als Escape-Sequenzen, als %XX oder als Base64, dekodiert sie mit dem gewählten oder dem erkannten Zeichensatz und listet jede Sequenz auf, die ersetzt werden musste, mit dem Grund. Außerdem zeigt es, was jeder Zeichensatz aus denselben Bytes macht.
- **Mojibake reparieren** nimmt verstümmelten Text wie `cafÃ©`, findet den Zeichensatz, der ihn falsch gelesen hat, und den, in dem die Bytes tatsächlich standen, und gibt das Original zurück, mit den Schritten und der Angabe, wie stark die Belege sind.

## Die vierzehn Zeichensätze

| Zeichensatz | Bytes pro Zeichen | Was ein Browser damit macht |
|---|---|---|
| UTF-8 | 1 bis 4 | Dekodiert ihn; der WHATWG Encoding Standard schreibt ihn für neue Inhalte vor |
| UTF-16LE, UTF-16BE | 2 oder 4 | Dekodiert beide („utf-16“ ist ein Label von UTF-16LE); kodiert sie nie |
| UTF-32LE, UTF-32BE | 4 | Nicht unterstützt |
| US-ASCII | 1 (sieben Bit) | Die Labels „ascii“ und „us-ascii“ bedeuten windows-1252 |
| ISO-8859-1 (Latin-1) | 1 | Die Labels „iso-8859-1“ und „latin1“ bedeuten windows-1252 |
| windows-1252 | 1 | Dekodiert ihn |
| ISO-8859-15 (Latin-9) | 1 | Dekodiert ihn |
| Mac OS Roman | 1 | Dekodiert ihn (Label „macintosh“) |
| IBM 437 (DOS, USA) | 1 | Nicht unterstützt |
| IBM 850 (DOS, Westeuropa) | 1 | Nicht unterstützt |
| IBM 037 und IBM 500 (EBCDIC) | 1 | Nicht unterstützt |

Die Tabellen für windows-1252, ISO-8859-15 und Mac OS Roman sind die Indizes des WHATWG Encoding Standard und stimmen daher mit dem überein, was ein Browser dekodiert. Die IBM-Tabellen sind die archivierten Zuordnungstabellen der Hersteller beim Unicode-Konsortium, die das Konsortium „only for historical and archival purposes“ aufbewahrt, ohne Gewähr, dass sie zu einer bestimmten Plattform passen. Jede Tabelle wurde am 03.10.2026 Byte für Byte mit den Codecs von CPython 3.11 und mit iconv aus glibc 2.39 verglichen. Die Unterschiede:

- **windows-1252, Bytes 0x81, 0x8D, 0x8F, 0x90 und 0x9D.** Der WHATWG-Standard ordnet sie den C1-Steuerzeichen U+0081, U+008D, U+008F, U+0090 und U+009D zu; die Tabelle von Microsoft, CPython und iconv lassen sie undefiniert. Das Tool folgt dem WHATWG-Standard, sodass jedes Byte dekodiert wird und beim Dekodieren nie Information verloren geht.
- **Mac OS Roman in iconv.** glibc ordnet 0xC6 U+0394 und 0xF0 U+E01E zu, wo die Tabelle von Apple und der WHATWG-Standard U+2206 und U+F8FF haben.

## Dekodieren wie ein Browser

Die Decoder für UTF-8 und UTF-16 folgen dem WHATWG Encoding Standard Schritt für Schritt. Ist eine Sequenz fehlerhaft, ersetzt ein einziges U+FFFD ihren maximalen Teil (Maximal Subpart): die längste Folge von Bytes, die noch ein wohlgeformtes Zeichen hätte beginnen können, oder ein einzelnes Byte. Der Unicode Standard beschreibt dieselbe Praxis in Abschnitt 3.9.6, und seine Tabellen 3-8 bis 3-11 gehören zu den Vorlagen. Jede ersetzte Sequenz wird benannt:

| Grund | UTF-8-Bytes | Was er bedeutet |
|---|---|---|
| Verirrtes Folgebyte | 80 bis BF, wo ein Zeichen beginnt | sein erstes Byte fehlt, oder die Daten sind kein UTF-8 |
| C0 oder C1 | C0, C1 | könnte nur eine Zwei-Byte-Form eines ASCII-Zeichens beginnen |
| F5 bis FF | F5 bis FF | kommt in UTF-8 nie vor |
| Überlang | E0 80-9F, F0 80-8F | eine längere Form eines Codepunkts, der eine kürzere hat |
| Surrogat | ED A0-BF | U+D800 bis U+DFFF, die UTF-8 nicht übertragen kann |
| Jenseits von U+10FFFF | F4 90-BF | hinter dem letzten Codepunkt |
| Abgebrochen | ein Startbyte, dann etwas anderes | die bis dahin gelesenen Bytes werden zu einem U+FFFD |

UTF-16 ersetzt Surrogate ohne Partner und ein übrig gebliebenes ungerades Byte; UTF-32, das Browser nicht dekodieren, folgt den Definitionen D99 und D100 des Unicode Standard und ersetzt jede Vier-Byte-Einheit, die ein Surrogat ist oder jenseits von U+10FFFF liegt.

**Byte Order Marks.** Ist „Den Zeichensatz von einer Byte Order Mark bestimmen lassen“ eingeschaltet (der Standard), werden Daten, die mit EF BB BF, FE FF oder FF FE beginnen, als UTF-8, UTF-16BE oder UTF-16LE dekodiert, gleich welchen Zeichensatz Sie gewählt haben, und die Markierung gehört nicht zum Text: Der WHATWG-Standard behandelt die Markierung als maßgeblicher als ein Label. Das Tool erkennt außerdem die UTF-32-Markierungen 00 00 FE FF und FF FE 00 00, die ein Browser nicht erkennt: Er hält das FF FE von FF FE 00 00 für die Markierung von UTF-16LE und dekodiert den Rest als UTF-16LE (Chromium 141, gemessen am 03.10.2026).

**Erkennen.** Steht der Zeichensatz auf „Erkennen“, sagt das Tool, warum es einen gewählt hat: eine Byte Order Mark; jedes Byte ist ASCII (dann liest jeder ASCII-kompatible Zeichensatz denselben Text); wohlgeformtes UTF-8 mit Zeichen jenseits von ASCII; Null-Bytes dort, wo ASCII-Text in UTF-16 oder UTF-32 sie platziert; oder das Muster von EBCDIC (0x40 häufig, keine ASCII-Leerzeichen, die meisten Bytes über 0x80). Andernfalls sagt es, dass es keine eindeutige Antwort gibt, und die Tabelle der Lesarten ist die Antwort.

## Bytes aus dem Feld lesen

| Format | Beispiel |
|---|---|
| Hex, beliebige Trennzeichen, mit oder ohne 0x oder \x | `C3 A9`, `c3a9`, `0xC3, 0xA9`, `{ 0xC3, 0xA9 }` |
| Ein Hexdump | die Ausgabe von `hexdump -C`, `xxd` oder `od -Ax -tx1`: Offsets und die ASCII-Spalte werden übersprungen |
| Escape-Sequenzen | `\xC3\xA9`, `b'caf\xc3\xa9'` (Python), `caf\303\251` (so setzt git Dateinamen in Anführungszeichen) |
| Prozentkodierung | `caf%C3%A9`, gelesen so, wie der WHATWG URL Standard es liest: Ein %, auf das keine zwei Hexziffern folgen, bleibt ein % |
| Base64 | Standardalphabet oder URL-sicheres Alphabet, Padding optional |

Ein Hexdump wird erkannt, wenn jede Zeile mit einem Offset beginnt und die Offsets in Schritten der Zeilenbreite wachsen, sodass die ASCII-Spalte nie als Bytes gelesen wird, selbst wenn sie zufällig wie Hex aussieht.

## Bytes schreiben

Die sechs Schreibweisen: Hex-Paare; das Layout von `hexdump -C`; ein C-Array; ein Bytes-Literal in Python (genau so, wie `repr()` in Python es schreibt); Base64 (RFC 4648, Abschnitt 4); und Prozentkodierung, bei der die nicht reservierten Zeichen nach RFC 3986 unverändert bleiben. Jede wurde mit ihrer Referenz verglichen: `hexdump -C` aus util-linux, `repr()`, `base64` und `urllib.parse.quote` aus CPython.

**Zeichen, die ein Zeichensatz nicht abbilden kann,** werden als `?` geschrieben (was die meisten Konverter tun), als dezimale HTML-Referenz wie `&#8364;` (was ein Browser tut, wenn ein Formular in einem solchen Zeichensatz gesendet wird: der Fehlermodus „html“ des WHATWG-Standards, den der Server nicht davon unterscheiden kann, dass jemand diese Zeichen eintippt) oder gar nicht (strikt).

## Mojibake reparieren

Mojibake lässt sich umkehren, wenn der falsche Zeichensatz nichts verloren hat: Kodieren Sie den verstümmelten Text mit dem Zeichensatz zurück, der ihn falsch gelesen hat, und dekodieren Sie die Bytes mit dem richtigen. Das Tool versucht das in zwei Stufen:

1. **UTF-8, gelesen als Ein-Byte-Zeichensatz** (windows-1252, ISO-8859-1, ISO-8859-15, Mac OS Roman, IBM 437, IBM 850). Das Rückgängigmachen muss wohlgeformtes UTF-8 ergeben, das Bytes jenseits von ASCII selten zufällig bilden: ein starker Beleg. Bis zu drei Durchgänge machen Text rückgängig, der mehr als einmal falsch gelesen wurde (`Ã¢â‚¬â„¢` ist ’, zweimal falsch gelesen).
2. **Ein Ein-Byte-Zeichensatz, gelesen als ein anderer**, etwa eine Datei in IBM 850, angezeigt als windows-1252 (`a‡Æo` für ação), oder EBCDIC, angezeigt als Latin-1. In diesen Zeichensätzen wird jedes Byte dekodiert, daher behält das Tool eine Lesart nur, wenn sie bei einem Mojibake-Maß besser abschneidet (die Paare, die UTF-8 hinterlässt, Symbole mitten in Wörtern, Großbuchstaben mitten in kleingeschriebenen Wörtern, Steuerzeichen, Rahmenzeichen, Wörter mit gemischten Schriften), und kennzeichnet den Beleg als schwächer.

Ging unterwegs ein Byte verloren (oft das letzte Byte von ” oder ™, das windows-1252 in ein unsichtbares Steuerzeichen verwandelt), stellt ein toleranter Durchgang den Rest wieder her und markiert jedes verlorene Zeichen mit U+FFFD. **Verstümmelung ansehen** wechselt mit dem reparierten Text zu „Text zu Bytes“, und die Tabelle der zurückgelesenen Bytes zeigt genau, wie er verstümmelt wurde.

Geprüft am 03.10.2026: 104 von 106 Mojibake-Proben aus fünfzehn Texten (UTF-8, falsch gelesen als fünf Zeichensätze, zweimal falsch gelesen, IBM 850 und windows-1252 gegenseitig falsch gelesen, EBCDIC falsch gelesen als Latin-1) kamen exakt zurück, und die fünfzehn Texte selbst blieben unangetastet. Beide Fehlschläge sind kurz: AÇÃO in EBCDIC, falsch gelesen als Latin-1 (`ÁhfÖ`), wo eine andere Lesart vorne liegt, und Ça va in windows-1252, falsch gelesen als IBM 850 (`Ãa va`), das unverändert bleibt. Von 12.087 korrekten Texten (Absätze aus den Learn-Artikeln dieser Website auf Englisch und Portugiesisch sowie sechzehn Sätze in anderen Sprachen, Schriften und Symbolsätzen) wurde keinem eine Reparatur angeboten.

## Ergebnisse teilen

Unter der ersten Antwort des aktiven Modus erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Feld dieses Modus so, wie eingegeben, und die eigenen Auswahlen des Modus. Der Name des Felds nennt den Modus, sodass der Link genau den Modus öffnet, in dem Sie waren: `text` für „Text zu Bytes“, mit `charset`, `policy`, `bom` und `style` (der Schreibweise der Bytes); `bytes` für „Bytes zu Text“, mit `format`, `charset` und `sniff` (ob eine Byte Order Mark entscheidet); `garbled` für „Mojibake reparieren“. Eine Auswahl auf ihrem Standardwert entfällt. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Text beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Der Modus wird gesetzt, sein Feld füllt sich wie beim Einfügen, seine Auswahlen werden gesetzt, und die Seite rechnet. Zwei Felder auf einmal, eine Auswahl, die zu einem anderen Modus gehört, oder ein Wert, den die Seite nicht anbietet, führen dazu, dass der ganze Link ignoriert wird. In beiden Fällen verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
- **Warum nicht `#input=`.** Ein Wert, der als `#input=` übergeben wird, öffnet weiterhin den Modus, nach dem er aussieht, genau wie bisher. Ein geteilter Link verwendet diese Form nicht, weil der Anschein täuschen kann: Ein Text wie `cafe` lässt sich auch als zwei Hex-Bytes lesen.

## Grenzen

- Die Reparatur arbeitet auf dem ganzen Text. Text, der korrekte mit verstümmelten Zeichen mischt, bleibt unangetastet: Fügen Sie den verstümmelten Teil allein ein.
- Bytes, die durch `?` oder U+FFFD ersetzt oder verworfen wurden, lassen sich nicht zurückholen; die Reparatur nennt, wie viele Zeichen verloren gingen.
- Die Erkennung und die zweite Stufe der Reparatur sind Heuristiken. Starke Belege kommen von Byte Order Marks und wohlgeformtem UTF-8; alles andere wird als schwächer gekennzeichnet.
- Nur die vierzehn Zeichensätze oben. Ostasiatische Multi-Byte-Zeichensätze (Shift_JIS, GBK, Big5, EUC-KR) sind nicht enthalten.
- Bis zu 64 KiB an Bytes werden auf einmal dekodiert und 20.000 Zeichen kodiert; Tabellen listen die ersten 2.000 Zeilen auf; die Reparatur untersucht die ersten 2.000 Zeichen.

## Quellen

- [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/): die Decoder für UTF-8 und UTF-16, das Erkennen der BOM (BOM Sniffing), der Ein-Byte-Decoder und -Encoder, die Labels, die Fehlermodi; Living Standard, zuletzt aktualisiert am 21. Mai 2026 (abgerufen am 03.10.2026)
- [WHATWG indexes: windows-1252](https://encoding.spec.whatwg.org/index-windows-1252.txt), [ISO-8859-15](https://encoding.spec.whatwg.org/index-iso-8859-15.txt), [macintosh](https://encoding.spec.whatwg.org/index-macintosh.txt) (abgerufen am 03.10.2026)
- [The Unicode Standard 18.0.0, chapter 3: Conformance](https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-3/): Tabelle 3-7, Abschnitt 3.9.6 und Tabellen 3-8 bis 3-11, Definitionen D95 bis D100 (abgerufen am 03.10.2026)
- [Unicode FAQ: UTF-8, UTF-16, UTF-32 & BOM](https://www.unicode.org/faq/utf_bom.html) (abgerufen am 03.10.2026)
- [Unicode mapping tables](https://www.unicode.org/Public/MAPPINGS/): [ReadMe](https://www.unicode.org/Public/MAPPINGS/ReadMe.txt), [CP437](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/PC/CP437.TXT), [CP850](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/PC/CP850.TXT), [CP037](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/EBCDIC/CP037.TXT), [CP500](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/EBCDIC/CP500.TXT), [CP1252](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP1252.TXT), [8859-1](https://www.unicode.org/Public/MAPPINGS/ISO8859/8859-1.TXT), [Apple ROMAN](https://www.unicode.org/Public/MAPPINGS/VENDORS/APPLE/ROMAN.TXT) (abgerufen am 03.10.2026)
- [RFC 3629: UTF-8](https://www.rfc-editor.org/rfc/rfc3629) (abgerufen am 03.10.2026)
- [RFC 2781: UTF-16](https://www.rfc-editor.org/rfc/rfc2781) (abgerufen am 03.10.2026)
- [RFC 4648: Base16, Base32 and Base64](https://www.rfc-editor.org/rfc/rfc4648) (abgerufen am 03.10.2026)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 03.10.2026); Abschnitt 3.5 (abgerufen am 27.10.2026): das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
- [WHATWG URL Standard: percent-decode](https://url.spec.whatwg.org/) (abgerufen am 03.10.2026)
