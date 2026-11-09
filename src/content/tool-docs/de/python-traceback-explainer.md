## Was das Tool tut

Fügen Sie einen Traceback ein, den CPython ausgegeben hat, und das Tool zerlegt ihn: jeden Frame mit Datei, Zeile, Funktion und Quellzeile und dem, worauf die Markierungen `^` und `~` darunter zeigen; jede Ausnahme mit ihrer Klassenkette aus der Hierarchie der eingebauten Ausnahmen, dem eigenen Vorschlag von CPython, sofern es einen gibt, den Angaben zu errno oder Codec und einem Hinweis aus ihrer Dokumentation; die Kette zwischen den Ausnahmen („direct cause“ gegenüber „during handling“); Ausnahmegruppen mit ihren Mitgliedern und Notizen; wo Sie zuerst suchen sollten; auf welche Releases das Format hindeutet; und was im eingefügten Text sensibel sein könnte, mit einer geschwärzten Kopie, die Sie statt des Originals teilen können. Alles läuft in Ihrem Browser: Der eingefügte Text wird gelesen, nie ausgeführt und nie gesendet.

Das Tool liest die Formate von CPython 3.11 bis 3.15, also die Releases, die der Python Developer's Guide am 27. Oktober 2026 als unterstützt führt: 3.15 und 3.14 im Status Bugfix, 3.13, 3.12 und 3.11 im Status Security, mit End of Life im Oktober 2031, 2030, 2029, 2028 und 2027. 3.10 hat am 1. Oktober 2026 sein End of Life erreicht. Jedes unten beschriebene Verhalten wurde an Tracebacks geprüft, die an diesem Tag von CPython 3.11.17, 3.12.3 und 3.13.16 ausgegeben wurden, sowie von CPython 3.14.2 im Build des [Python-Playground](/tools/python-playground) der Website. Ein Interpreter für 3.15 stand nicht zur Verfügung; nichts hier wurde also mit 3.15 getestet, und wo 3.15 erwähnt wird, ist die Quelle seine Dokumentation. Der [Artikel zu Fehlern und Tracebacks in Python](/learn/python-errors-and-tracebacks) behandelt dasselbe Thema mit Beispielen.

## Was das Tool liest

**Header und Frames.** Ein Traceback beginnt mit `Traceback (most recent call last):` und führt die Frames vom äußersten zum innersten Aufruf auf: Im letzten Frame wurde die Ausnahme ausgelöst. Jeder Frame ist eine Zeile `  File "<file>", line <n>, in <function>`, danach folgt um vier Leerzeichen eingerückt die Quellzeile, wenn CPython die Datei lesen konnte. Die Funktion ist der Name des Codeobjekts; die oberste Ebene eines Skripts ist also `<module>`, ein Lambda `<lambda>` und ein Generatorausdruck `<genexpr>`. Die Zeilennummer kann `None` sein.

**Die Markierungen (PEP 657, ab 3.11).** Unter die Quellzeile eines Frames setzt CPython `^` unter den Ausdruck, den der Frame gerade ausführte. Hat der Ausdruck Teile, markiert `~` die Teile und `^` die Operation: den Operator einer binären Operation (`a / b` ergibt `~^~`), die Klammern eines Indexzugriffs (`cfg["hostname"]` ergibt `~~~^^^^^^^^^^^^`) und ab 3.13 die Klammern eines Aufrufs (`int(port)` ergibt `~~~^^^^^^`). Das Tool verwandelt die Markierungen zurück in Text: den Ausdruck, den Teil unter `^` und die Teile unter `~`. CPython setzt die Markierungen nach Anzeigespalten und zählt ein breites oder vollbreites Zeichen (East Asian Width W oder F) als zwei Spalten; das Tool macht es genauso, mit der Breitentabelle von Unicode 15.1.0, die CPython 3.13 verwendet. Keine Markierungen werden ausgegeben, wenn CPython mit `-X no_debug_ranges` oder `PYTHONNODEBUGRANGES` gestartet wurde, wenn der Ausdruck die ganze Zeile ist und ab 3.13 auch bei `x = f(...)` und `return name(...)`, wenn der Aufruf der ganze Wert ist (3.12 markiert `json.loads(body)` in `data = json.loads(body)`, 3.13 nicht).

**Ausdrücke über mehrere Zeilen (ab 3.13).** Ein Frame kann einen Ausdruck zeigen, der sich über mehrere Quellzeilen erstreckt, mit Markierungen unter jeder Zeile und `...<N lines>...` für die ausgelassenen Zeilen. 3.11 und 3.12 zeigen nur die erste Zeile.

**Wiederholte Frames.** Nach drei identischen Frames (gleiche Datei, Zeile und Funktion) gibt CPython statt der übrigen `[Previous line repeated N more times]` aus. Das Tool zählt sie beim Frame darüber.

**Lokale Variablen.** `unittest --locals` und `traceback.TracebackException(..., capture_locals=True)` geben unter einem Frame Zeilen `name = value` aus. Das Tool listet sie auf und warnt, dass die Werte Secrets enthalten können.

**Die Ausnahmezeile.** `<type>: <message>` oder nur `<type>`, wenn die Meldung leer ist. CPython schreibt den Typ als `module.qualname`, außer bei eingebauten Klassen und bei Klassen des ausgeführten Skripts (`__main__`), die es ohne Modul schreibt. `ValueError` ist also eingebaut, `json.decoder.JSONDecodeError` stammt aus der Standardbibliothek, und `PollError` wurde höchstwahrscheinlich im Skript definiert.

**Notizen und mehrzeilige Meldungen.** Notizen, die mit `add_note()` hinzugefügt wurden (PEP 678, ab 3.11), werden „immediately after the exception message, in the order in which they were added, with each note starting on a new line“ ausgegeben, also direkt nach der Meldung, in der Reihenfolge des Hinzufügens, jede auf einer neuen Zeile. Eine Meldung mit Zeilenumbrüchen wird genauso ausgegeben; am Text allein lässt sich der Rest einer Meldung also nicht von einer Notiz unterscheiden. Das Tool zeigt diese Zeilen zusammen und sagt das dazu.

**Die Fundstelle eines SyntaxError.** Lässt sich Code nicht kompilieren, gibt CPython `  File "<file>", line <n>` ohne Funktion aus, dann die betroffene Zeile mit Markierungen `^` und danach `SyntaxError: <message>`. Ließ sich das Skript selbst nicht kompilieren, lief nichts, und es gibt überhaupt keinen Header `Traceback`; ließ sich ein importiertes Modul nicht kompilieren, steht die Fundstelle nach den Frames des Codes, der es importiert hat. Diese Markierungen zählen Zeichen, keine Anzeigespalten.

**Ketten (PEP 3134).** Wird eine Ausnahme ausgelöst, während eine andere behandelt wird, gibt CPython beide aus, die ältere zuerst, verbunden durch ein Banner:

- `The above exception was the direct cause of the following exception:` bedeutet `raise new from original`: eine bewusste Übersetzung, und die frühere Ausnahme ist `__cause__` der neuen.
- `During handling of the above exception, another exception occurred:` bedeutet, dass der Handler der früheren Ausnahme eine neue ausgelöst hat: Der Handler selbst ist gescheitert, und die frühere Ausnahme wurde zum `__context__` der neuen.
- `raise new from None` gibt die neue Ausnahme allein aus (PEP 409, PEP 415).

Eine Ausnahme, die erzeugt, aber nie ausgelöst wurde, etwa die Ursache in `raise ValueError(...) from KeyError(...)`, wird ohne Header und ohne Frames ausgegeben.

**Ausnahmegruppen (PEP 654, ab 3.11).** Eine Gruppe wird als Kasten ausgegeben: `+ Exception Group Traceback (most recent call last):`, ein Rand `|` auf jeder Zeile der Gruppe und jedes Mitglied unter einem Titel `+-+---------------- 1 ----------------`, `+---------------- 2 ----------------` und so weiter, jedes mit eigenem Traceback, eigener Kette und eigenen Notizen, pro Ebene um einen Rand tiefer verschachtelt. Die Meldung der Gruppe endet mit `(N sub-exceptions)`. Standardmäßig gibt CPython 15 Mitglieder aus und dann `and N more exceptions` (`max_group_width`) sowie zehn Verschachtelungsebenen und dann `... (max_group_depth is 10)`. Das Tool liest Gruppen bis zu 40 Ebenen tief, sodass sich auch ein Traceback lesen lässt, der mit größeren Grenzen ausgegeben wurde.

**Was vor dem Traceback steht.** `Exception in thread <name>:` bedeutet, dass `threading.excepthook` eine in einem Thread ausgelöste Ausnahme ausgegeben hat, und das Programm ist womöglich weitergelaufen. `Exception ignored in: ...` bedeutet, dass `sys.unraisablehook` eine Ausnahme ausgegeben hat, die sich nicht weiter ausbreiten konnte, zum Beispiel aus einem Destruktor. Eine Log-Zeile wie `ERROR:netops.poller:...`, ein Shell-Prompt oder `>>> ` vor dem Header wird nicht gelesen, mit einem Hinweis.

**Was das Tool nicht liest.** Die Berichte von IPython und pytest sind eigene Formate, nicht das von CPython; das Tool sagt das und liest nur, was im Format von CPython vorliegt (bei IPython die Ausnahmezeile). Ein Log, bei dem jede Zeile ein Präfix hat (einen Zeitstempel, eine Stufe), wird nicht gelesen. Enthält der eingefügte Text zwei Tracebacks, wird der erste gelesen, und ein Hinweis nennt die Zeile, in der der zweite beginnt. Zeilen direkt nach einer Ausnahmezeile gelten als deren Meldung oder Notizen, bis eine Leerzeile, ein Banner, ein neuer Header oder ein Prompt `>>> ` kommt.

## Wo sich die Releases unterscheiden

Beobachtet an den Tracebacks, die die Vektoren festlegen (3.11.17, 3.12.3, 3.13.16 und 3.14.2), und in der Dokumentation jedes Releases.

| Was | 3.11 | 3.12 | 3.13 | 3.14 | 3.15 |
| --- | --- | --- | --- | --- | --- |
| `^` unter dem fehlschlagenden Ausdruck, `~` um einen Operator oder Indexzugriff | ja | ja | ja | ja | nicht getestet |
| `~` unter einer aufgerufenen Funktion, `^` unter ihren Klammern | nein: nur `^` | nein: nur `^` | ja | ja | nicht getestet |
| Keine Markierungen für einen Ausdruck, der die ganze Zeile ist | ja | ja | ja, auch für `x = f(...)` und `return name(...)` | wie 3.13 | nicht getestet |
| Ein Ausdruck über mehrere Zeilen, mit `...<N lines>...` | nur erste Zeile | nur erste Zeile | ja | ja | nicht getestet |
| Ein Frame für eine List-, Dict- oder Set-Comprehension (`<listcomp>`) | ja | nein (PEP 709) | nein | nein | nicht getestet |
| Ausnahmegruppen, Notizen | ja | ja | ja | ja | nicht getestet |
| „Did you forget to import 'sys'?“ | nein | ja | ja | ja | nicht getestet |
| Ein Skript, das wie ein Modul der Standardbibliothek heißt | „partially initialized module ... (most likely due to a circular import)“ | dasselbe | „(consider renaming '...' since it has the same name as the standard library module ...)“ | nicht getestet | nicht getestet |
| Ein falsch geschriebenes Keyword-Argument | „'max_split' is an invalid keyword argument for split()“ | dasselbe | „got an unexpected keyword argument 'max_split'. Did you mean 'maxsplit'?“ | wie 3.13 | nicht getestet |
| Dateiname der interaktiven Shell | `<stdin>` | `<stdin>` | `<python-input-0>` | `<python-input-N>` in den Beispielen der Dokumentation | dasselbe in der Dokumentation |
| Farbe im Terminal | nein | nein | ja | ja | ja |
| Neue eingebaute Ausnahmen | | | `PythonFinalizationError` | | `ImportCycleError` |

Zwei weitere Unterschiede zeigten sich bei den Läufen. In 3.11 gibt die eigene Anzeige des Interpreters den Vorschlag „Did you mean“ eines `NameError` aus, `traceback.print_exc()` aber nicht; ab 3.12 geben ihn beide aus. Und der Pyodide-Build von 3.14.2 gab die ssl-Ausnahmen als `_ssl.SSLError` aus (ohne `ValueError` in der Kette von `SSLCertVerificationError`), wo 3.11 bis 3.13 `ssl.SSLError` ausgeben; das Tool kennt beide Schreibweisen. In 26 der 34 Szenarien, die auf beiden liefen, war der Text von 3.14.2 Byte für Byte derselbe wie der von 3.13.16; die übrigen acht unterscheiden sich nur in Pfaden, in der Tiefe, bei der die Rekursion abbrach, und in dem, was WebAssembly nicht kann (Sockets, Threads und Prozesse). Die Traceback-Dokumentation von 3.15 liest sich bis auf ihre Versionszeile wie die von 3.14; die neuen Meldungen von 3.15 (Vorschläge über innere Attribute, Python-Namen für Methoden anderer Sprachen, Lazy Imports, die bei der ersten Verwendung gemeldet werden) wurden gelesen, aber nicht ausgeführt.

## Die Klasse der Ausnahme

Das Tool kennt jede dokumentierte eingebaute Ausnahme und die Ausnahmen der Standardbibliothek, auf die Skripte für Netzwerk und Sicherheit am häufigsten stoßen: `socket.gaierror` und `socket.herror`; die Fehler von `ssl`; `json.decoder.JSONDecodeError`; `asyncio.exceptions.CancelledError`, `InvalidStateError`, `IncompleteReadError` und `LimitOverrunError`; die Fehler von `subprocess`; `urllib.error.URLError`, `HTTPError` und `ContentTooShortError`; sowie `http.client.HTTPException`, `RemoteDisconnected`, `IncompleteRead`, `BadStatusLine`, `InvalidURL` und `LineTooLong`. Für jede zeigt es die Klassenkette, die nächste Basisklasse zuerst (zum Beispiel `ConnectionRefusedError → ConnectionError → OSError → Exception → BaseException`), einen Satz dazu, was sie bedeutet, das Release, das sie eingeführt hat, wenn es neuer als 3.11 ist, und einen Link auf ihren Eintrag in der Dokumentation. Die Ketten haben die Interpreter selbst ausgegeben (`__mro__` jeder Klasse auf 3.11.17, 3.12.3, 3.13.16 und 3.14.2, bei jeder eingebauten Klasse identisch), und sie stimmen mit dem Hierarchiebaum auf der Seite zu den Ausnahmen jedes Releases überein; `ImportCycleError` stammt allein aus der Dokumentation von 3.15. Aliasse werden unter dem Namen ihres Ziels ausgegeben: `socket.timeout` und `asyncio.TimeoutError` als `TimeoutError`, `IOError` und `EnvironmentError` als `OSError`, `ssl.CertificateError` als `ssl.SSLCertVerificationError`.

Bei einer unbekannten Klasse sagt das Tool, was der ausgegebene Name nahelegt: Ein Name ohne Modul ist eine Klasse des ausgeführten Skripts (oder eine eingebaute Klasse, die neuer ist als das Tool), und ein Name mit Modul ist in diesem Modul dokumentiert.

**Hinweise.** Für 36 häufige Ausnahmeklassen und für jede Meldung zu `'NoneType'` ergänzt das Tool, was zuerst zu prüfen ist, jeweils aus der Dokumentation der Klasse: `ModuleNotFoundError` (eine virtuelle Umgebung sieht nur, was in ihr installiert wurde), `KeyError` (`dict.get(key, default)` liefert stattdessen einen Standardwert), `AttributeError` oder `TypeError` zu `'NoneType'` (eine Funktion ohne `return` gibt `None` zurück, und `re.match()` und `re.search()` geben `None` zurück, wenn nichts passt), `UnboundLocalError` (eine Zuweisung irgendwo in einer Funktion macht den Namen in der ganzen Funktion lokal), `ConnectionRefusedError`, `TimeoutError`, `socket.gaierror`, `ssl.SSLCertVerificationError` (verify_message nennt den Grund; `CERT_NONE` akzeptiert so gut wie jedes Zertifikat), `subprocess.CalledProcessError`, `asyncio.exceptions.CancelledError` (eine `TaskGroup` bricht die anderen Tasks ab, wenn einer scheitert), `AssertionError` (`python -O` entfernt `assert`-Anweisungen), `SyntaxError` (die Markierungen zeigen, wo der Parser den Fehler erkannt hat, was „is not always the place that needs to be fixed“, also nicht immer die Stelle ist, die korrigiert werden muss) und weitere.

**Aus der Meldung.** Die eigenen Vorschläge von CPython („Did you mean“, „Did you forget to import“, „consider renaming“); errno und sein Text bei `[Errno N] text` und `[WinError N] text` (die Nummern stammen vom Betriebssystem und unterscheiden sich zwischen Systemen; eine negative Zahl bei `socket.gaierror` ist einer der Codes `EAI_*` von getaddrinfo); sowie Codec, Byte oder Zeichen, Position und Grund eines `UnicodeDecodeError` oder `UnicodeEncodeError`.

## Wo Sie zuerst suchen sollten

Für die Ausnahme, mit der der Traceback endet (bei einer Gruppe für jedes Blatt-Mitglied, bis zu zwanzig):

- in Ihrem eigenen Code ausgelöst: dieser Frame und die Werte, die ihn erreicht haben;
- durch eine `raise`-Anweisung ausgelöst: Die Meldung nennt den Grund; verknüpft ein Banner sie mit einer früheren Ausnahme, folgt die Auswertung der Kette auch zu dieser (die direkte Ursache ist der ursprüngliche Fehler; bei „during handling“ ist der erste Fehler der frühere, und der Handler ist danach gescheitert);
- in der Standardbibliothek, einem installierten Paket oder einem eingefrorenen Modul ausgelöst: der letzte Frame Ihres eigenen Codes davor, der übergeben hat, was die Bibliothek nicht verarbeiten konnte;
- ein SyntaxError: die Fundstelle und, falls vorhanden, der Frame, der die Datei importiert hat;
- ein `RecursionError`: der Frame, der sich wiederholt; ein `KeyboardInterrupt`: wo das Programm gewartet hat;
- keine Frames: Die Ausnahme selbst wurde nie ausgelöst, oder nur ihre letzte Zeile wurde eingefügt.

„Ihr eigener Code“ ist jeder Frame, der nicht in der Standardbibliothek (`.../lib/python3.X/...`, `...\Lib\...`), in einem installierten Paket (`site-packages` oder unter Debian `dist-packages`) oder in einem eingefrorenen Modul (`<frozen ...>`) liegt; `<stdin>`, `<string>` und die interaktive Shell zählen als Ihr eigener Code. Das ist eine Lesart, keine Bewertung: Der Frame, der die Ausnahme auslöst, ist nicht immer die Stelle des Fehlers.

## Welches Release ihn ausgegeben hat

Das Tool sammelt Indizien und bildet ihre Schnittmenge: Ein Pfad, der die Standardbibliothek nennt (`/usr/lib/python3.13/`, `python314.zip`, `Python313\`), ergibt das Release genau; Markierungen überhaupt bedeuten 3.11 oder neuer; `~` unter einem Aufruf oder ein Ausdruck über mehrere Zeilen 3.13 oder neuer; ein Comprehension-Frame 3.11 oder älter; eine Ausnahmegruppe 3.11 oder neuer; `<python-input-N>` 3.13 oder neuer; „Did you forget to import“ 3.12 oder neuer; „consider renaming“ oder „Did you mean '...'?“ ohne Doppelpunkt 3.13 oder neuer; `PythonFinalizationError` 3.13 oder neuer; `ImportCycleError` 3.15. Indizien, die sich widersprechen (ein eingefügter Text, der zwei Releases mischt oder bearbeitet wurde), werden als solche gemeldet.

## Was sensibel sein könnte

Ein Traceback ist ein Log-Artefakt und enthält regelmäßig, was nicht veröffentlicht werden sollte: Pfade nennen Benutzer und Hosts, Quellzeilen und Meldungen können Token, Passwörter und URLs mit Zugangsdaten enthalten, und ausgegebene lokale Variablen enthalten Werte. Das Tool sucht nach:

- einem Benutzernamen in einem Home-Verzeichnis: `/home/<name>/`, `/Users/<name>/`, `C:\Users\<name>\`, einmal pro Name gemeldet, mit Anzahl;
- allem, was die Secret-Prüfung von [Code als Bild](/tools/code-to-image) findet: Blöcke mit privaten Schlüsseln, `Authorization`-Header, AWS-Zugriffsschlüssel-IDs, JSON Web Tokens, Passwörter in URLs, verschlüsselte Werte von FortiOS sowie Attribute, Einträge, Schlüssel, Variablen und Zuweisungen, die nach Secret aussehen. Zeilen mit mehr als 2.000 Zeichen erhält diese Prüfung nicht (sie wird bei sehr langen Zeilen langsam), und ein Hinweis sagt das.

Die **geschwärzte Kopie** ersetzt jeden Benutzernamen durch `<user>` und jeden Fund durch `[redacted]`; sie ist das, was in ein Issue oder ein Ticket gehört. Die Prüfungen sind nicht vollständig: Lesen Sie die Kopie, bevor Sie sie veröffentlichen.

Aus demselben Grund setzt die Seite einen Traceback nie so, wie eingefügt, in einen Link (ihre Teilen-Einstellung ist „never“). Ihre Schaltfläche **Ergebnisse teilen** in diesem Abschnitt erzeugt einen Link nur, wenn Sie sie wählen, und der Link enthält nach dem `#` die oben beschriebene geschwärzte Kopie, nie den eingefügten Text; waren einige Zeilen länger als 2.000 Zeichen und blieben daher ungeprüft, bietet sie keinen Link an und sagt, warum. Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird die Kopie beim Öffnen des Links nicht an den Server gesendet, aber wer den Link hat, kann sie lesen: Lesen Sie die Kopie zuerst. Ein Link füllt das Feld wie beim Einfügen, und die Seite erklärt den Inhalt; der Wert verschwindet danach ohne Anfrage aus der Adresse der Seite. Die Kopie ist auf 16.384 Zeichen begrenzt, die Grenze, die die Website für jeden Wert nach dem `#` setzt. Auch über die API der Website wird das Tool nicht angeboten: Einen Traceback zum Erklären an einen Server zu senden, hieße, seine Secrets mitzusenden, und ein Programm, das einen Traceback hat, hat bereits das Ausnahmeobjekt, das `traceback.TracebackException` aus der Standardbibliothek exakt ausliest.

## Grenzen

Höchstens 200.000 Zeichen, 5.000 Zeilen und 5.000 Zeichen pro Zeile; Ausnahmegruppen bis zu 40 Verschachtelungsebenen. Die längste Eingabe in den Tests brauchte etwa 0,4 Sekunden.

## Durchgerechnetes Beispiel

Die Schaltfläche „Beispiel“ lädt den Traceback, den CPython 3.13.16 für dieses Skript ausgegeben hat, das ein Lab-Gerät auf einem Port abfragt, auf dem nichts lauscht:

```python
# poll.py: open an SSH session to each device in the inventory; nothing listens on the lab's port here.
import socket  # TCP

INVENTORY = {"r1": "127.0.0.1"}  # device name and management address
SSH_PORT = 2222  # the lab's SSH port


class PollError(Exception):
    """A device could not be polled."""


def open_session(host, port):
    # Connect with a short timeout.
    return socket.create_connection((host, port), timeout=2)


def poll(inventory):
    # Turn a refusal into the application's own error, keeping the original as its cause.
    for name, host in inventory.items():
        try:
            open_session(host, SSH_PORT)
        except ConnectionRefusedError as err:
            err.add_note(f"device {name} ({host})")
            raise PollError(f"{name}: SSH port {SSH_PORT} closed") from err


poll(INVENTORY)
```

Das Tool liest zwei Ausnahmen, verbunden durch das Banner „direct cause“. Die erste, `ConnectionRefusedError: [Errno 111] Connection refused`, hat vier Frames, zwei in `poll.py` und zwei in `/usr/lib/python3.13/socket.py`, und eine Zeile nach ihrer Ausnahmezeile, `device r1 (127.0.0.1)`, das ist die Notiz. Die zweite, `PollError: r1: SSH port 2222 closed`, ist eine Klasse des Skripts (kein Modul im Namen), ausgelöst durch eine `raise`-Anweisung. Wo Sie zuerst suchen sollten: `PollError` wurde absichtlich ausgelöst; ihre direkte Ursache ist die Ablehnung der Verbindung, ausgelöst in der Standardbibliothek, und der letzte Frame des Skripts davor ist `open_session`, Zeile 14. Der Pfad nennt die Standardbibliothek von 3.13, und das `~` unter jeder aufgerufenen Funktion bestätigt 3.13 oder neuer. Der Benutzername in `/home/ana/` wird gemeldet, und die geschwärzte Kopie enthält an seiner Stelle `/home/<user>/`.

## Herkunft

Das Verhalten ist durch den Satz von Referenzvektoren (Golden Vectors) `python-traceback-explainer-golden-2026-10-27b` festgelegt: 57 Traceback-Vektoren (45 von 3.13.16 ausgegeben, darunter eine interaktive Sitzung, ein Thread, Logging, `sys.unraisablehook`, `unittest --locals`, `-X no_debug_ranges`, Farbe, `python -m` und ein Dateiname im Windows-Stil, der an `compile()` übergeben wurde; sechs von den anderen Releases ausgegeben, vier von 3.11.17, einer von 3.12.3 und einer von 3.14.2; der Bericht von IPython 9.17.1; die letzte Zeile eines Tracebacks von 3.13.16 allein; und vier Tracebacks von 3.13.16, umgewandelt mit Zeilenumbrüchen CR LF, geschützten Leerzeichen, einer Einrückung und einem Schnitt), acht Ablehnungen, 26 Anzeigebreiten und 14 Klassenketten. Die erwartete Struktur jedes Tracebacks (Typen, Meldungen, Notizen, Verknüpfungen, Frames, Positionen, ob Markierungen ausgegeben wurden und welche Art von Ausdruck darunter stand) hat nicht das Tool erzeugt: Ein Test-Harness hat jedes Skript erneut ausgeführt und sie aus den Ausnahmeobjekten geschrieben (`traceback.TracebackException`, `FrameSummary` und der eigene Text von CPython pro Frame), und in jedem Szenario und jedem Release stimmte die Lesart des ausgegebenen Texts durch das Tool in allen 3.971 Vergleichen damit überein. Die Auswertungen (wo zuerst zu suchen ist, der Bereich der Releases, die Hinweise und Funde, die geschwärzten Kopien) wurden von Hand nach den obigen Regeln geschrieben. Sechs Share-Vektoren legen fest, was ein Link von „Ergebnisse teilen“ enthält: die geschwärzten Kopien des Beispiels, des Secrets-Vektors und des Vektors mit Windows-Pfad sowie keinen Link bei einer Zeile, die die Secret-Prüfung übersprungen hat, bei einem eingefügten Text, der kein Traceback ist, und bei einem leeren Feld. 100.000 zufällige und mutierte Eingaben haben es nie scheitern lassen.

## API

Bewusst nicht über die API erreichbar: siehe „Was sensibel sein könnte“ oben.

## Quellen

Alle abgerufen am 27.10.2026.

- Dokumentation von Python 3.15: [traceback](https://docs.python.org/3/library/traceback.html) (verglichen mit den Ausgaben [3.11](https://docs.python.org/3.11/library/traceback.html), [3.12](https://docs.python.org/3.12/library/traceback.html), [3.13](https://docs.python.org/3.13/library/traceback.html) und [3.14](https://docs.python.org/3.14/library/traceback.html)), [Built-in Exceptions](https://docs.python.org/3/builtins/exceptions.html) (mit den Ausgaben 3.11 bis 3.14), [Command line and environment](https://docs.python.org/3/using/cmdline.html), [sys](https://docs.python.org/3/library/sys.html), [threading](https://docs.python.org/3/library/threading.html), [sysconfig](https://docs.python.org/3/library/sysconfig.html), [unittest](https://docs.python.org/3/library/unittest.html), [venv](https://docs.python.org/3/library/venv.html), [codecs](https://docs.python.org/3/library/codecs.html), [re](https://docs.python.org/3/library/re.html), [Built-in Types](https://docs.python.org/3/builtins/stdtypes.html), [socket](https://docs.python.org/3/library/socket.html), [ssl](https://docs.python.org/3/library/ssl.html), [json](https://docs.python.org/3/library/json.html), [asyncio exceptions](https://docs.python.org/3/library/asyncio-exceptions.html), [Coroutines and Tasks](https://docs.python.org/3/library/asyncio-task.html), [subprocess](https://docs.python.org/3/library/subprocess.html), [urllib.error](https://docs.python.org/3/library/urllib.error.html), [http.client](https://docs.python.org/3/library/http.client.html)
- [The Python Tutorial: Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html) und [More Control Flow Tools](https://docs.python.org/3/tutorial/controlflow.html); [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) und [Execution model](https://docs.python.org/3/reference/executionmodel.html); [Programming FAQ: UnboundLocalError](https://docs.python.org/3/faq/programming.html)
- What's New in Python [3.11](https://docs.python.org/3/whatsnew/3.11.html), [3.12](https://docs.python.org/3/whatsnew/3.12.html), [3.13](https://docs.python.org/3/whatsnew/3.13.html), [3.14](https://docs.python.org/3/whatsnew/3.14.html), [3.15](https://docs.python.org/3/whatsnew/3.15.html)
- [PEP 657](https://peps.python.org/pep-0657/), [PEP 654](https://peps.python.org/pep-0654/), [PEP 678](https://peps.python.org/pep-0678/), [PEP 3134](https://peps.python.org/pep-3134/), [PEP 409](https://peps.python.org/pep-0409/), [PEP 415](https://peps.python.org/pep-0415/), [PEP 709](https://peps.python.org/pep-0709/), [PEP 3151](https://peps.python.org/pep-3151/)
- [Python Developer's Guide: Status of Python versions](https://devguide.python.org/versions/)
- [Debian Python Policy](https://www.debian.org/doc/packaging-manuals/python-policy/): `dist-packages`
- Unicode Character Database [15.1.0 EastAsianWidth.txt](https://www.unicode.org/Public/15.1.0/ucd/EastAsianWidth.txt) (16.0.0 und 17.0.0 zum Vergleich) und [UAX #11, East Asian Width](https://www.unicode.org/reports/tr11/)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
