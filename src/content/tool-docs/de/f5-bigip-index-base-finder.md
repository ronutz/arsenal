## Was das Tool tut

Auf einem BIG-IP hat die Frage „Beginnt das bei 0 oder bei 1?“ keine einheitliche Antwort. Tcl, die Sprache unter iRules, zählt jede Position ab 0. Mehrere Befehle, die F5 ergänzt hat, zählen ab 1. Zähler geben für das erste Element 1 zurück. Viele Nullen in der Konfiguration sind Werte und keine Positionen. Das Tool sammelt 76 solcher Stellen, jede mit ihrer Quelle, sodass Sie genau die prüfen können, auf die Sie sich gleich verlassen wollen.

Es hat zwei Modi:

- **Nachschlagen** listet die Stellen auf, gruppiert nach Teil des Systems: Tcl in iRules, die Befehle, die F5 in iRules ergänzt, Konfigurationsobjekte, Plattform und Hardware, die APIs sowie Logging und Paketmitschnitt. Suchen Sie nach Befehl oder Begriff, oder filtern Sie danach, wo die Zählung beginnt.
- **Position übersetzen** nimmt eine Position so, wie Menschen zählen, mit 1 als erstem Element, wandelt sie in die Nummer um, die jeder Befehl braucht, führt jeden Befehl in der Lern-Engine der Website für Tcl 8.4.6 aus und zeigt daneben die um eins verschobene Variante.

## Wie ein Eintrag zu lesen ist

- **Das Abzeichen** gibt an, wie die Stelle zählt: `0` beginnt bei 0, `1` beginnt bei 1, `←` zählt von rechts (`end`, `end-1`, die letzten N), `0·1` bedeutet, dass beide Zählweisen an derselben Stelle zusammentreffen, `=0` bedeutet, dass 0 ein Wert mit Bedeutung ist (Standard, kein Limit, alle, Erfolg, gleich), und `n` steht für eine Anzahl, die man leicht für eine Position hält.
- **Zählt**, **Erstes**, **Letztes** und **Nichts vorhanden** geben an, was gezählt wird, wie man das erste und das letzte Element erreicht und was zurückkommt, wenn nichts da ist (-1, 0 oder ein leerer String).
- **Beispiel** zeigt den Code und was er zurückgibt. Jedes Tcl-Beispiel wurde in einer echten tclsh 8.4.6 ausgeführt.
- **Vorsicht** nennt die Falle, für die dieser Eintrag bekannt ist.
- **Die Seiten von F5 widersprechen sich** erscheint, wenn zwei Aussagen von F5 nicht beide stimmen können.
- **Wie sicher** unterscheidet vier Stufen: laut Tcl-Handbuch und in tclsh 8.4.6 ausgeführt; laut Quelle; nur durch ein Beispiel auf der Quellseite belegt; und zwei Aussagen von F5, die sich widersprechen.
- **Quellen** listet jede Seite auf, auf der der Eintrag beruht, mit dem Datum, an dem sie gelesen wurde.

## Faustregeln

1. Positionen in Tcl zählen ab 0, und `end` ist der letzte Index, also die Länge minus eins.
2. Feldartige Nummern von F5 zählen ab 1: Felder von `getfield`, Tiefen von `URI::path`, Indizes von Pfadsegmenten in LTM Policies, das veraltete `matchclass`.
3. Zähler geben für das erste Element 1 zurück: `HTTP::request_num`, `table incr`.
4. Viele Nullen sind Werte, keine Positionen: Route Domain 0, Port 0, `connection-limit 0`, `SSL::verify_result` 0 und `0.0` bei tcpdump.
5. Fast überall kommt der niedrigere Wert zuerst (Ereignispriorität, Ordinalwerte von Policies, Reihenfolge in BIG-IP DNS, Syslog-Schweregrad), außer bei Prioritätsgruppen im Pool, wo der höhere gewinnt.
6. In einem `if` ist 0 falsch und jede andere Zahl wahr, auch -1: Vergleichen Sie einen Index mit `>= 0`, statt ihn direkt zu testen, und speichern Sie eigene Flags als 0 oder 1, wie es der iRules Style Guide auf DevCentral verlangt.

## Die Positionsübersetzung

Wählen Sie eine Frage, und geben Sie einen Wert und N an (1 ist das erste):

- **Das N-te Zeichen**: `string index` und `string range` mit N-1 sowie `substr` von F5, daneben `string index` mit N.
- **Das N-te Feld nach einem Split**: `getfield` von F5 mit N sowie `split` und dann `lindex` mit N-1, daneben beide falsch gezählt.
- **Das N-te Segment eines Pfads**: dieselben beiden Befehle, wobei das leere Stück vor einem führenden Schrägstrich berücksichtigt wird, daneben die Variante, die es vergisst.
- **Die letzten N Labels eines Hostnamens**: `domain` von F5 sowie `split`, `lrange` vom Ende und `join`, daneben die Variante, die ein Label zu viel nimmt.
- **Das N-te Element einer Tcl-Liste**: `lindex` mit N-1, daneben `lindex` mit N.
- **Wo ein Text zuerst vorkommt**: `string first` und der Test `>= 0`, daneben ein `if` direkt auf den Index.

Jede Zeile ist als **Eigene Zählung** (die richtige Nummer für diesen Befehl), **Um eins daneben** oder **Verwandte Antwort** gekennzeichnet. Die Antwort oben ist das, was die erste richtige Zeile zurückgegeben hat, und ein Hinweis erscheint, wenn richtige Zeilen voneinander abweichen. Hinweise erklären die Fälle, die die Zahlen verändern: ein Wert, der mit dem Trennzeichen beginnt, ein Pfad mit Query-String (`HTTP::uri` enthält ihn, `HTTP::path` nicht), ein Trennzeichen aus mehr als einem Zeichen (`split` behandelt jedes Zeichen als Trennzeichen, `getfield` verwendet den ganzen String) und ein Treffer an Index 0 oder ein Fehlschlag mit -1.

## Wo sich die Seiten von F5 widersprechen

Beim genauen Lesen der Quellen fanden sich Stellen, an denen zwei Aussagen von F5 nicht beide stimmen können. Keine davon wurde für dieses Tool auf einem BIG-IP getestet; behandeln Sie daher jede als Frage, die Sie auf Ihrer Version prüfen sollten: die Anzahl 0 bei `substr`, die Kommentare im Beispiel zu `URI::path`, der Wert von `matchclass` bei keinem Treffer, der Bereich auf der Seite zu `priority`, der Variablenname im Beispiel zu `DNSMSG::record`, die Beschreibung eines Ordinalwerts von Policies in iControl REST, die Reihenfolge der Access Control Lists (ACLs) von APM und die Priorität, die `LB::server` für ein Member ohne konfigurierte Priorität meldet. Jeder Widerspruch erscheint bei seinem Eintrag, mit beiden Quellen.

## Ergebnisse teilen

Unter der ersten Antwort jedes Modus (der Anzahl der Treffer unter „Nachschlagen“, der Antwort unter „Position übersetzen“) erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Felder dieses Modus als benannte Werte: unter „Nachschlagen“ `search`, `base` und `area`, sofern gesetzt (ohne Suchwörter und ohne Filter gibt es dort nichts zu teilen, und die Schaltfläche ist deaktiviert); unter „Position übersetzen“ `mode=translate`, `question`, `value` sowie `n`, `sep` oder `needle`, je nachdem, was die Frage verwendet. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher werden die Werte beim Öffnen des Links nicht an den Server gesendet. Jeder bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Die Felder enthalten höchstens 2.000 Zeichen (der Wert), weit unter den 16.384, die die Website nach dem `#` zulässt.
- **Öffnen eines Links.** Der Modus öffnet sich, seine Felder werden gesetzt, und die Seite rechnet wie bei der Eingabe; die Lern-Engine für Tcl 8.4.6 läuft in der Seite, und es wird nichts abgerufen. Ein Feld des anderen Modus, eine unbekannte Zählweise, ein unbekannter Bereich oder eine unbekannte Frage, ein Wert über der Grenze seines Felds oder ein N außerhalb von 1 bis 1.000 führt dazu, dass der ganze Link ignoriert wird. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Grenzen

- Die Positionsübersetzung nimmt einen Wert mit bis zu 2.000 Zeichen, ein N von 1 bis 1.000, ein Trennzeichen mit bis zu 20 Zeichen und einen Suchtext mit bis zu 200 Zeichen an, und jeder Befehl hält nach 200 Schritten an.
- Die Befehle von F5 in der Positionsübersetzung verhalten sich so, wie die Seiten von F5 sie beschreiben. Wo eine Seite schweigt, sagt die Zeile das: Die Seite von F5 zu `getfield` hat kein Beispiel, in dem der String mit dem Trennzeichen beginnt, daher ist die Lesart des Tools für diesen Fall als Annahme gekennzeichnet.
- Einträge zu Plattform, Konfiguration und API stammen aus der Dokumentation von F5 und wurden für dieses Tool nicht auf Hardware getestet.
- Alles läuft in Ihrem Browser. Es wird nichts gesendet, und nichts läuft auf einem BIG-IP.

## Quellen

Das Tool führt jede Quelle mit dem Datum auf, an dem sie gelesen wurde, insgesamt 109. Die wichtigsten:

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (abgerufen am 03.10.2026)
- [F5 K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (abgerufen am 03.10.2026)
- [Tcl 8.4 manual: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (abgerufen am 03.10.2026)
- [Tcl 8.4 manual: lindex](https://www.tcl-lang.org/man/tcl8.4/TclCmd/lindex.htm) (abgerufen am 03.10.2026)
- [Tcl 8.4 manual: split](https://www.tcl-lang.org/man/tcl8.4/TclCmd/split.htm) (abgerufen am 03.10.2026)
- [Tcl 8.4 manual: if](https://www.tcl-lang.org/man/tcl8.4/TclCmd/if.htm) (abgerufen am 03.10.2026)
- [F5 iRules reference: getfield](https://clouddocs.f5.com/api/irules/getfield.html) (abgerufen am 03.10.2026)
- [F5 iRules reference: substr](https://clouddocs.f5.com/api/irules/substr.html) (abgerufen am 03.10.2026)
- [F5 iRules reference: domain](https://clouddocs.f5.com/api/irules/domain.html) (abgerufen am 03.10.2026)
- [F5 iRules reference: URI::path](https://clouddocs.f5.com/api/irules/URI__path.html) (abgerufen am 03.10.2026)
- [F5 iRules reference: priority](https://clouddocs.f5.com/api/irules/priority.html) (abgerufen am 03.10.2026)
- [F5 tmsh reference: ltm policy](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_policy.html) (abgerufen am 03.10.2026)
- [F5 tmsh reference: ltm pool](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_pool.html) (abgerufen am 03.10.2026)
- [F5 K411: Overview of packet tracing with the tcpdump utility](https://my.f5.com/manage/s/article/K411) (abgerufen am 03.10.2026)
- [F5 DevCentral: iRules Style Guide](https://community.f5.com/t/irules-style-guide/71151) (abgerufen am 03.10.2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
