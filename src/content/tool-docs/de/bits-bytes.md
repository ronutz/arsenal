## Was das Tool tut

Drei Felder: eine Größe, eine Rate und eine Zeit. Jedes davon wird für sich allein erklärt; zwei beliebige ergeben das dritte.

- **Eine Größe** („1,5 GB“, „700 MiB“, „10K“, „8 Bit“, „2 Kilobyte“) wird ausgegeben als exakte Anzahl von Bits und Bytes, als Wert in jeder Einheit beider Konventionen (Bits mit SI- und Binärpräfixen, Bytes mit SI-Präfixen, Bytes mit IEC-Präfixen) und, wenn die Angabe ein SI-Präfix bei Bytes war, als dieselbe Angabe auf beide Arten gelesen, mit dem Unterschied zwischen beiden.
- **Eine Rate** („100 Mbit/s“, „12,5 MB/s“, „1 Gbps“, „56k“) wird in Bits und Bytes pro Sekunde ausgegeben, in jeder Rateneinheit und als die Menge, die sie in einer Minute, einer Stunde und einem Tag überträgt.
- **Eine Zeit** („90 s“, „2h 30min“, „1 d“) wird exakt gelesen, auf die Millisekunde genau. Die Einheiten sind ms, s, min, h und d, ausgeschrieben auf Englisch, Portugiesisch, Spanisch, Deutsch, Französisch oder Italienisch (seconds, minutes, hours, days; segundos, minutos, horas, dias bzw. días; Sekunden, Minuten, Stunden, Tage; secondes, heures, jours, oder j für Tag; secondi, minuti, ore, giorni).
- **Zwei der drei** ergeben das dritte: Größe durch Rate ist die Übertragungszeit (mit ihren Teilen), Größe durch Zeit ist die erreichte Rate, Rate mal Zeit ist die übertragene Menge. Sind alle drei angegeben, wird die Zeit aus Größe und Rate neu berechnet.
- **Effizienz** skaliert die Rate: eine Vorlage für TCP über IPv4 über Ethernet, TCP über IPv6, UDP über IPv4 oder ein beliebiger Prozentsatz.
- **Die Verbindungstabelle** beantwortet die Frage nach der Übertragungszeit für eine Reihe von Standardverbindungen auf einmal, bei der gewählten Effizienz.

## Die zwei Arten von Kilo

Die Präfixe haben in der Informatik zwei Bedeutungen, und der Rechner hält sie wie die Standards durch die Schreibweise auseinander:

- **SI-Präfixe sind dezimal.** k ist 1000, M ist 1 000 000 und so weiter; ein Kilobyte (kB) sind 1000 Byte, ein Megabit (Mbit) sind 1 000 000 Bit. Das bedeuten die Präfixe überall sonst in der Wissenschaft, und das meinen Festplatten- und Netzwerkhersteller.
- **Binäre IEC-Präfixe sind Potenzen von 1024.** Die IEC hat sie im Dezember 1998 verabschiedet (IEC 60027-2 Amendment 2, veröffentlicht 1999-01; heute IEC 80000-13): kibi Ki 2^10, mebi Mi 2^20, gibi Gi 2^30, tebi Ti 2^40, pebi Pi 2^50, exbi Ei 2^60. Ein Kibibyte (KiB) sind 1024 Byte, ein Mebibyte (MiB) sind 1 048 576 Byte. Das NIST weist darauf hin, dass sie nicht zum SI gehören.
- **Die alte Gewohnheit.** Vor 1998, und in mancher Software bis heute, bedeuteten „KB“ und „MB“ 1024 und 1 048 576 Byte. Der Unterschied wächst mit dem Präfix: 2,4 % bei Kilo, 4,86 % bei Mega, 7,37 % bei Giga, 10 % bei Tera, 12,6 % bei Peta. Eine „1 TB“-Festplatte fasst 1 000 000 000 000 Byte, die ein System, das in Potenzen von 1024 zählt, als 931 GiB anzeigt und vielleicht mit „931 GB“ beschriftet; es fehlt nichts. Der Rechner gibt für jede SI-Angabe bei Bytes beide Lesarten aus, damit die Frage nie diskutiert werden muss.

So wird die Eingabe gelesen:

- `b` ist ein Bit und `B` ein Byte; `bit`, `bits`, `byte`, `bytes` und `octet` werden akzeptiert, ebenso die ausgeschriebenen Präfixe (kilobyte, mebibit).
- `k`, `K`, `M`, `G`, `T`, `P`, `E`, `Z` sind dezimal; `Ki`, `Mi`, `Gi`, `Ti`, `Pi`, `Ei`, `Zi` sind binär.
- Ein bloßes Präfix ohne Einheit (`10K`, `1.5M`) wird als Potenz von 1024 in Bytes gelesen, so wie `ls -h` und `du -h` Größen ausgeben (laut der Manpage von GNU ls sind K, M, G, T, P, E, Z, Y, R, Q Potenzen von 1024, KB, MB und so weiter Potenzen von 1000, und KiB ist gleich K); das Ergebnis weist darauf hin.
- `Kb`, `Mb`, `Gb` (ein großgeschriebenes Präfix mit kleinem b) werden als Bits gelesen, weil das Symbol das besagt, und markiert, weil manche Produktdatenblätter Bytes so schreiben.
- Eine Rate ist eine Größe, gefolgt von `/s` oder `ps`: `Mbit/s`, `MB/s`, `Mbps`, `kbps`. Ein bloßes `56k` als Rate sind 56 000 bit/s.
- Komma und Punkt dienen bei der Eingabe gleichermaßen als Dezimaltrennzeichen (`1,5 GB` und `1.5 GB` sind dieselbe Größe); Ergebnisse werden mit dem Trennzeichen der Sprache der Seite ausgegeben.

## Vorlagen für die Effizienz

Die Nennrate einer Verbindung zählt jedes Bit auf der Leitung. Nutzdaten kommen langsamer voran, weil jeder Frame Header, eine Präambel und eine Lücke mitführt. Für volle Frames mit 1500 Byte:

| Vorlage | Nutzdaten pro Frame | Auf der Leitung pro Frame | Effizienz |
|---|---|---|---|
| TCP über IPv4 über Ethernet | 1500 - 20 (IPv4) - 20 (TCP) = 1460 | 1500 + 14 + 4 + 8 + 12 = 1538 | 94,93 % |
| TCP über IPv6 über Ethernet | 1500 - 40 (IPv6) - 20 (TCP) = 1440 | 1538 | 93,63 % |
| UDP über IPv4 über Ethernet | 1500 - 20 (IPv4) - 8 (UDP) = 1472 | 1538 | 95,71 % |

Die minimalen Header-Längen stammen aus RFC 791 (IPv4, 20 Oktette), RFC 8200 (IPv6, 40 Oktette, laut seinem Abschnitt 8.3 um 20 Oktette länger als der minimale IPv4-Header), RFC 9293 (TCP, 20 Oktette) und RFC 768 (UDP, 8 Oktette). Der Overhead pro Frame stammt aus RFC 2544, Anhang B, „Maximum frame rates reference“: „Preamble 64 bits, Frame 8 x N bits, Gap 96 bits“, wobei N der Frame einschließlich des 14-Byte-Headers und der 4-Byte-FCS ist; die 812 Frames pro Sekunde mit 1518 Byte bei 10 Mb/s aus demselben Anhang sind 10 000 000 / (1538 x 8), und der Referenzvektor `rfc2544-frame-time` bildet das nach. Diese Vorlagen sind Obergrenzen: Eine echte TCP-Übertragung verbraucht außerdem Kapazität für Bestätigungen, Slow Start und Sendewiederholungen.

## Die Verbindungstabelle

| Verbindung | Nennrate | Quelle |
|---|---|---|
| 56k-Modem | 56 000 bit/s im Downstream | ITU-T V.90 (09/98) |
| ISDN, ein B-Kanal | 64 kbit/s | Tabelle des Rechners von 2004 |
| T1 | 1 544 kbit/s | ITU-T G.704 (10/98) |
| E1 | 2 048 kbit/s | ITU-T G.704 (10/98) |
| Ethernet 10 Mb/s bis 400 Gb/s | 10, 100 und 1000 Mb/s; 2,5, 5, 10, 25, 40, 100 und 400 Gb/s | IEEE 802.3-2022 |

Die mit 2004 gekennzeichneten Zeilen standen 2004 auf nutzmann.net und 2013 auf ntz.com.br in der Verbindungstabelle des Rechners für Bits und Bytes, des ältesten Vorfahren der Tools dieser Website. Sein durchgerechnetes Beispiel ist hier die Schaltfläche „Beispiel“: Eine „56k“-Datei braucht über ein „56k“-Modem etwa 8,2 Sekunden, nicht eine, weil die Datei 56 KiB groß ist (57 344 Byte, 458 752 Bit) und das Modem 56 000 Bit pro Sekunde überträgt: genau 8,192 s.

## Exaktheit

Jede Menge wird als ganzzahlige Mantisse mit einer Zehnerpotenz gespeichert und jede Rate und Zeit als Verhältnis zweier solcher Zahlen, sodass nichts gerundet wird, bevor es ausgegeben wird. Ausgegebene Werte behalten bis zu sechs Dezimalstellen; ein Wert, dessen exakte Form nicht abbricht (eine Drittelsekunde), wird als gerundet gekennzeichnet. Zeitdauern werden in Tage, Stunden, Minuten, Sekunden und Millisekunden zerlegt, kaufmännisch auf die Millisekunde gerundet, und die Summe wird zusätzlich in Sekunden mit sechs Dezimalstellen angegeben. Ein Zettabyte in Bits wird vollständig ausgeschrieben.

## Ergebnisse teilen

Unter der ersten Antwort erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die ausgefüllten Felder so, wie eingegeben: `size`, `rate`, `time` und `eff` (die Effizienz, eine Vorlage oder ein Prozentsatz): `/tools/bits-bytes#size=56+KiB&rate=56+kbit%2Fs`. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher werden die Werte beim Öffnen des Links nicht an den Server gesendet. Sie bleiben in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Öffnen eines Links.** Die vier Felder werden gemeinsam gesetzt, ein fehlendes wird geleert, sodass das Ergebnis das des Absenders ist; die Seite rechnet. Ein Wert, der länger ist, als sein Feld fasst, führt dazu, dass der ganze Link ignoriert wird. In beiden Fällen verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
- **Links von anderen Seiten.** Eine Größe, die als `#input=` übergeben wird, füllt das Feld für die Größe weiterhin genau wie bisher; „Ergebnisse teilen“ verwendet eigene Namen, sodass sich beides nie vermischt.

## Grenzen

- Nicht abgebildet: TCP-Fenster und Round-Trip-Time, Verluste, Komprimierung und der Unterschied zwischen der Nennrate einer Verbindung und dem, was ein Provider liefert. Die Vorlagen für die Effizienz sind Obergrenzen pro Frame.
- Der Rechner gibt an, was eine Angabe nach jeder Konvention bedeutet. Welche Konvention ein bestimmtes Betriebssystem für die Anzeige von Größen verwendet, muss dessen Dokumentation angeben; der Rechner behauptet es nicht.
- Jedes Feld wird nach 64 Zeichen abgeschnitten und von einem einzigen verankerten Ausdruck gelesen; die Arithmetik verwendet BigInt, daher läuft kein Wert über.

## Quellen

- [NIST: Prefixes for binary multiples](https://physics.nist.gov/cuu/Units/binary.html) (abgerufen am 04.10.2026)
- [ls(1), GNU coreutils (man7.org)](https://man7.org/linux/man-pages/man1/ls.1.html) (abgerufen am 04.10.2026): -h, --si und das Argument SIZE
- [RFC 2544, Appendix B, Maximum frame rates reference](https://www.rfc-editor.org/rfc/rfc2544.html#page-22) (abgerufen am 26.10.2026)
- [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791) (abgerufen am 04.10.2026)
- [RFC 8200: IPv6, section 8.3](https://www.rfc-editor.org/rfc/rfc8200.html#section-8.3) (abgerufen am 04.10.2026)
- [RFC 9293: TCP](https://www.rfc-editor.org/rfc/rfc9293) (abgerufen am 04.10.2026)
- [RFC 768: UDP](https://www.rfc-editor.org/rfc/rfc768) (abgerufen am 04.10.2026)
- [ITU-T V.90 (09/98)](https://www.itu.int/rec/T-REC-V.90/en) (abgerufen am 04.10.2026)
- [ITU-T G.704 (10/98)](https://www.itu.int/rec/T-REC-G.704/en) (abgerufen am 04.10.2026)
- [IEEE 802.3-2022](https://standards.ieee.org/ieee/802.3/10422/) (abgerufen am 04.10.2026)
- [nutzmann.net, Calculadora de bits e bytes (2004), Internet Archive](https://web.archive.org/web/20041009131549/http://nutzmann.net:80/bitsandbytes.htm) (abgerufen am 04.10.2026): das durchgerechnete Beispiel des Rechners von 2004, sein Hinweis zur IEC und seine Verbindungstabelle
- [ntz.com.br, Calculadora e conversão de bits e bytes (2013), Internet Archive](https://web.archive.org/web/2013/http://ntz.com.br/bitsandbytes.html) (abgerufen am 04.10.2026): derselbe Rechner auf der Website von 2013, mit seiner Tabelle der IEC-Präfixe
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
