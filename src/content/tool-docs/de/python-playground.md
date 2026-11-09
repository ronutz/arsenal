## Was das Tool tut

Echtes CPython 3.14 läuft in Ihrem Browser. Die Engine ist Pyodide 314.0.7, der Build von CPython für WebAssembly aus dem Projekt Pyodide, ausgeliefert von diesem Ursprung und auf Version und SHA-256-Hashwert festgelegt. Sie schreiben ein Programm, geben ihm auf Wunsch eine Standardeingabe, wählen „Ausführen“ und lesen stdout, stderr und den Wert des letzten Ausdrucks, so wie eine REPL ihn zeigen würde. Nichts, was Sie eingeben, verlässt die Seite: Der Interpreter lebt in einem Web Worker auf Ihrem Gerät, hat kein Netzwerk und keine Prozesse, und die eigene Richtlinie der Seite würde beides ohnehin ablehnen.

Es ist das erste Tool der Website, das Code ausführt, der nicht von der Website selbst stammt. Daraus folgen drei Dinge, und die Seite spricht jedes davon offen aus, statt es zu verbergen:

- **Es gibt einen Download, einmal, wenn Sie es wollen.** Die Engine umfasst etwa 13,5 MB in fünf Dateien. Die Seite öffnet mit dem Editor und einem Beispiel, aber ohne die Engine; eine Schaltfläche, die die Größe nennt, startet den Download mit einem Fortschrittsbalken. Ihr Browser speichert die Dateien im Cache (sie sind versioniert und als unveränderlich gekennzeichnet), daher kostet ein zweiter Besuch nichts.
- **Eine Engine von Dritten läuft.** Die eigenen Prüfungen der Website decken das Gerüst darum ab: die Vorabprüfung, die Grenzen, die Beispiele (die bei jedem Build erneut durch die echte Engine laufen) und die Hashwerte der festgelegten Dateien. Für das Verhalten des Interpreters ist das Projekt Pyodide zuständig.
- **Verfügbar ist die Standardbibliothek.** Die Pyodide-Distribution bietet 357 Pakete (numpy, pandas, requests und die übrigen); keines davon wird in dieser Version geladen. Vierzig Module der Standardbibliothek fehlen im WebAssembly-Build (unter anderem tkinter, curses, pwd, grp, readline), und die Vorabprüfung nennt sie, wenn Sie eines importieren.

## Die Vorabprüfung

Bevor etwas an die Engine geht, wird der Programmtext gelesen (nie ausgeführt), und Sie erfahren, was hier nicht funktioniert und warum, in den Begriffen der Engine selbst:

- ein Import eines Moduls der Standardbibliothek, das diesem Build fehlt, mit dem Fehler, den die Engine auslöst;
- ein Import eines Pakets, das die Pyodide-Distribution anbietet, diese Version aber nicht lädt, genannt mit seinem Paketnamen (PIL ist Pillow, yaml ist pyyaml);
- ein Import von etwas, das hier niemand installieren kann, oder ein relativer Import, der kein Paket hat, auf das er sich beziehen könnte;
- Netzwerkmodule (socket, urllib, http, requests …) und Prozessmodule (subprocess, multiprocessing, os.system), die Emscripten ablehnt;
- zoneinfo, das hier keine Zeitzonendatenbank findet und ZoneInfoNotFoundError auslöst;
- input() bei leerem stdin-Feld, das beim ersten Lesen EOFError auslöst;
- ein time.sleep, das länger ist als das Zeitlimit, ein unbegrenztes while True, Module, deren Ausgabe sich von Ausführung zu Ausführung ändert (random, time, uuid, datetime.now);
- Dateien, die im Arbeitsspeicher der Engine liegen und mit der Ausführung verschwinden; ein Programm, das nichts ausgibt (stattdessen wird der Wert des letzten Ausdrucks gezeigt); beim Einrücken gemischte Tabs und Leerzeichen.

Als Fehler markierte Punkte blockieren die Ausführung; die übrigen sind Hinweise.

## Grenzen

- Programm: 20.000 Zeichen. Standardeingabe: 20.000 Zeichen.
- Zeitlimit: 30 Sekunden pro Ausführung. Beim Erreichen der Grenze wird der Worker beendet und ein neuer aus den zwischengespeicherten Dateien gestartet.
- Ausgabe: 200.000 Zeichen pro Stream, danach abgeschnitten und gekennzeichnet.
- „Stoppen“ beendet den Worker sofort (die einzige Möglichkeit, synchrones Python ohne einen Interrupt-Puffer mit Cross-Origin-Isolation zu unterbrechen, den diese statische Website nicht bereitstellt) und startet einen neuen.
- Jede Ausführung beginnt in einem frischen globalen Namespace, in dem `__name__` auf `"__main__"` gesetzt ist; Ausführungen geben also keine Variablen aneinander weiter, und das Main-Guard-Idiom funktioniert.

## Standardeingabe

Das stdin-Feld speist `input()` und `sys.stdin`, eine Zeile pro Lesevorgang, danach das Dateiende. Ein abschließender Zeilenumbruch fügt keine leere Zeile hinzu. `for line in sys.stdin:` liest alles.

## Die Beispiele

Dreizehn Programme, geschrieben für die Menschen, für die es die Website gibt: ein /24 in /26er aufteilen, Präfixe zusammenfassen, Netzmasken und Wildcards in Binärdarstellung, ein modifizierter EUI-64 aus einer MAC-Adresse, ein DNS-Header, gebaut mit struct, HMAC-SHA256 in Hex und Base64url, Latenzstatistik mit p95, Jitter und zwei Standardabweichungen, Übertragungszeiten bei drei Line Rates, eine Syslog-Zählung nach Schweregrad aus eingefügtem Log-Text, Zeilen aus dem stdin-Feld, aus einer API-Antwort ausgewählte Felder, Dijkstras Shortest Path First über sechs Router und der bloße letzte Ausdruck. Ihre exakte Ausgabe ist als Referenzvektoren (Golden Vectors) festgehalten und wird bei jedem Build mit der echten Engine unter Node neu gemessen; ein Upgrade der Engine, das eine davon ändert, lässt den Build scheitern und wird gezielt geprüft.

Das Latenzbeispiel gibt beide Standardabweichungen aus und beschriftet jede. `statistics.pstdev` liefert „the population standard deviation“, also die Standardabweichung der Grundgesamtheit, und das ist, was ping als mdev ausgibt: Die Manpage ping(8) schreibt „Population standard deviation (mdev)“, und iputils berechnet sie, indem es die Summe der quadrierten Abweichungen durch die Anzahl der Antworten teilt. `statistics.stdev` liefert „the sample standard deviation“, die Stichprobenstandardabweichung, die bei denselben Messwerten größer ist (8,34 gegenüber 7,99 ms im Beispiel). Vergleichen Sie die Zeile pstdev mit der Zusammenfassung `rtt min/avg/max/mdev` von ping, nicht die Zeile stdev.

Das SPF-Beispiel führt Dijkstras Shortest Path First (SPF) von Router R1 aus über die sechs Router und acht Links des [Artikels zu Dijkstra](/learn/dijkstra-and-the-twenty-minute-algorithm) aus, mit einer Kandidatenliste in `heapq`, und gibt jeden Schritt in der Reihenfolge aus, die RFC 2328, Abschnitt 16.1, beschreibt: „the paths to the candidate vertex that is closest to the root are guaranteed to be shortest“, die Pfade zum wurzelnächsten Kandidaten sind also garantiert die kürzesten; dieser Router kommt in den Baum, und seine Links werden untersucht. Ein kürzerer Pfad ersetzt Kosten und Next Hops eines Kandidaten, ein Pfad mit gleichen Kosten fügt seine Next Hops den bereits aufgeführten hinzu, und der Durchlauf endet, wenn die Kandidatenliste leer ist. Am Ende stehen Kosten, Next Hops und Eltern jedes Routers sowie die Reihenfolge, in der die Kosten endgültig wurden (R1 R3 R2 R4 R5 R6), und das ist Dijkstras Idee von 1959 in seinen eigenen Worten: „the minimal paths from P to the other nodes are constructed in order of increasing length“, die minimalen Pfade entstehen also in der Reihenfolge zunehmender Länge. Kandidaten mit gleichen Kosten verlassen den Heap in der Reihenfolge der Router-Namen, eine Regel, die das Programm in einem Kommentar nennt; die Ausgabe ist also bei jeder Ausführung gleich. Ändern Sie einen Kostenwert (etwa R2 nach R4 von 1 auf 20) und führen Sie es erneut aus, um zu sehen, wie sich die Next Hops verschieben; die [Einführung in OSPF](/learn/ospf-primer) behandelt Open Shortest Path First, das Protokoll, das diese Berechnung ausführt.

## Was die API nicht tut

Dieses Tool ist nicht über die HTTP-API erreichbar. Beliebiges Python auf gemeinsam genutzter Infrastruktur auszuführen wäre Remote Code Execution; die Engine läuft nur in Ihrem Browser. Die Vorabprüfung ist eine Lernhilfe rund um den Editor, kein stabiler Vertrag.

## Ergebnisse teilen

Unter der Leiste zum Ausführen erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Programm und die Standardeingabe so, wie eingegeben, nie die Ausgabe: Wer den Link öffnet, führt das Programm auf Wunsch selbst aus. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Ein Programm kann Schlüssel, Token und interne Namen enthalten, daher bittet das Popover Sie, es zu lesen, bevor Sie den Link senden. Bevor ein Link angeboten wird, wird der Text nach Zugangsdaten durchsucht, die ein Standard definiert: ein privater Schlüssel im PEM-Format, eine Zeile `Authorization` oder `Proxy-Authorization` mit beliebigem Schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitte 11.6.2 und 11.7.2: Der Wert „consists of credentials“), eine Zeile `Cookie` oder `Set-Cookie` mit einem Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitte 4.1.1 und 4.2.1), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1: Die Form „user:password“ „is deprecated“), eine AWS-Zugriffsschlüssel-ID oder ein `ENC`-Wert von FortiOS; alle abgerufen am 01.11.2026. Findet sich eines davon, gibt es keinen Link: Das Popover nennt das Feld und die Zeile, und Sie setzen einen Platzhalter an seine Stelle und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur nach einem Secret aussieht (`api_key = "..."`, eine Zuweisung, die die Prüfung in der Form von Python selbst liest), blockiert den Link nicht; das Popover nennt den ersten solchen Wert, damit Sie ihn prüfen können.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` steht, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die beiden Felder werden gefüllt, eine frühere Ausgabe wird gelöscht, und die Seite sagt, dass das Programm aus einem Link stammt. Sonst geschieht nichts: Die Engine (etwa 13,5 MB) wird nicht heruntergeladen, und ist sie bereits geladen, läuft das Programm erst, wenn Sie **Ausführen** wählen. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Quellen

Die Dokumentation von Pyodide (die Seiten zu Web Workern und zu den Standard-Streams, Version 314.0.7), die package.json, pyodide-lock.json und die Typings des Pakets selbst in der npm-Registry, die Dokumentation von CPython 3.14 zu den Modulen, die die Beispiele verwenden, RFC 1035, Abschnitt 4.1.1, RFC 4291, Anhang A, und RFC 5424, Abschnitt 6.2.1, für die Arithmetik der Beispiele sowie MDN zu Modul-Workern und zur Quellenliste der Content Security Policy, abgerufen am 04.10.2026. Die Seite zu statistics in Python 3.14 (pstdev und stdev), die Manpage ping(8) auf man7.org und der Quelltext von iputils für die Zusammenfassungszeile von ping (ping/ping_output.c) wurden am 19.10.2026 abgerufen, ebenso RFC 2328, Abschnitte 16.1 und 16.1.1 (rfc-editor.org), und Dijkstras Notiz von 1959, A Note on Two Problems in Connexion with Graphs, Numerische Mathematik 1, Seiten 269 bis 271 (der Scan im Repository des CWI, den der Artikel zu Dijkstra zitiert), für das SPF-Beispiel. Alle sind auf der Seite des Tools aufgeführt.
