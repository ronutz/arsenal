## Was das Tool tut

Fügen Sie den Dateinamen eines Wheels (`.whl`) oder einer Quelldistribution (`.tar.gz`) ein oder eine URL, die auf einen solchen endet, und das Tool zerlegt ihn: den Projektnamen und seine normalisierte Form, die Version und ihre Normalform nach PEP 440, das optionale Build-Tag und jedes Python-, ABI- und Plattform-Tag mit dem, was es voraussetzt. Komprimierte Tag-Mengen werden expandiert, und zu jeder Kombination steht, welche Interpreter und welche Systeme sie abdeckt. Öffnen Sie **Mit einem Interpreter abgleichen** und beschreiben Sie einen (CPython oder PyPy, die Python-Version, free-threaded Build oder nicht, Linux mit glibc oder musl, macOS oder Windows, die Version der C-Bibliothek oder von macOS, die Architektur): Das Tool sagt, ob sich das Wheel dort installieren lässt und welches seiner Tags gewinnt.

Der Modus **Versionen** liest stattdessen eine Liste von Versionen: Jede wird geparst und normalisiert, mit dem, was die Normalisierung geändert hat; die Liste wird in der Reihenfolge nach PEP 440 sortiert, gleiche Versionen sind markiert, und wenn Sie ein Specifier-Set wie `>= 1.0, != 1.3.*, < 2` hinzufügen, sehen Sie, welche Versionen im Bereich liegen und welche ein Installer standardmäßig wählt. Alles läuft in Ihrem Browser; eine URL wird nur auf ihr letztes Segment gekürzt, und es wird nichts heruntergeladen. Das Tool steht neben [pyproject.toml erklärt](/tools/pyproject-toml-explainer), das die Datei liest, aus der diese Namen entstehen, und dem [Python-Playground](/tools/python-playground).

## Wie ein Dateiname gelesen wird

Das Binary Distribution Format gibt den Dateinamen eines Wheels als `{distribution}-{version}(-{build tag})?-{python tag}-{abi tag}-{platform tag}.whl` vor, ein gültiger Name hat also vier oder fünf Bindestriche. Die hier angewandten Regeln:

- **Der Name** ist ein gültiger Projektname (ASCII-Buchstaben, Ziffern, `.`, `_` und `-`, mit einem Buchstaben oder einer Ziffer am Anfang und am Ende) und wird in seiner normalisierten Form verglichen: kleingeschrieben, wobei jede Folge aus `-`, `_` und `.` durch ein einzelnes `-` ersetzt wird. In einem Dateinamen schreiben Tools ihn klein und jede solche Folge als ein einzelnes `_`; Tools, die Wheels lesen, müssen `.` und Großbuchstaben aus älteren Dateien aber weiterhin akzeptieren, daher werden diese mit einer Warnung akzeptiert. Ein doppelter Unterstrich wird abgelehnt, wie pip ihn ablehnt.
- **Die Version** ist eine Version nach PEP 440. Tools schreiben sie normalisiert; ein Name, bei dem das nicht so ist, wird mit einer Warnung akzeptiert, die die Normalform nennt.
- **Das Build-Tag** muss mit einer Ziffer beginnen. Es entscheidet nur zwischen Wheels, die in allem anderen identisch sind, und sortiert dabei zuerst nach seinen führenden Ziffern als Zahl und dann nach dem Rest als Text. Es ist nicht Teil der Version, und laut Spezifikation sollte ein Release, auf das man sich von außen beziehen muss, etwa eine Sicherheitskorrektur, eine neue Version erhalten statt einer Build-Nummer.
- **Eine Quelldistribution** ist `{name}-{version}.tar.gz` mit genau einem Bindestrich. Ein Name mit mehr Bindestrichen wird so gelesen, wie pip ihn liest (die Version steht nach dem letzten Bindestrich), mit einer Warnung; eine `.zip` wird als die ältere Form gelesen, ebenfalls mit einer Warnung.

## Die Tags

- **Python-Tag**: ein Implementierungskürzel (`py` für jede Implementierung, `cp` CPython, `pp` PyPy, `ip` IronPython, `jy` Jython), gefolgt von der Version ohne Punkt (`cp313` ist CPython 3.13). Ein Tag nur mit Hauptversion wie `py3` ist keine Kurzform für `py30`: Es bedeutet, dass das Wheel nach dem Willen seiner Herausgeber über 3.x-Versionen hinweg funktionieren soll.
- **ABI-Tag**: `none` (kein Erweiterungsmodul, das an eine Python-ABI gebunden ist), `abi3` (die stabile ABI von CPython, für Builds, die nicht free-threaded sind), `abi3t` (die stabile ABI für free-threaded Builds, PEP 803, ab Python 3.15), das eigene `cpXY` von CPython mit seinen Flags (`d` Debug, `t` free-threaded sowie die älteren `m` und `u`) oder das `pypyXY_ppNN` von PyPy.
- **Plattform-Tag**: `any`; `win_amd64`, `win32`, `win_arm64`; `manylinux_x_y_arch` (glibc x.y oder neuer, PEP 600) und seine veralteten Namen `manylinux1` (glibc 2.5), `manylinux2010` (2.12) und `manylinux2014` (2.17); `musllinux_x_y_arch` (musl x.y oder neuer, PEP 656; packaging führt nur dieselbe Hauptversion von musl auf); `macosx_x_y_arch` (macOS x.y oder neuer; `10_y` für macOS 10, `x_0` ab macOS 11, mit x von 10 bis 15 oder ab 26), einschließlich der Namen für mehrere Architekturen wie `universal2` (arm64 und x86_64); `ios_x_y_arch_sdk`; `android_apilevel_abi`; `pyemscripten_YEAR_PATCH_wasm32` (PEP 783, angenommen); und das einfache `linux_arch`, das die Spezifikation für eine öffentliche Verteilung als unzureichend bezeichnet. Alles andere wird als Wert von `sysconfig.get_platform()` eines anderen Systems gelesen.
- **Komprimierte Tag-Mengen**: Jedes Tag kann eine sortierte, durch `.` getrennte Sammlung sein, und das Wheel steht dann für jede Kombination. `py2.py3-none-any` sind zwei Kombinationen; bis zu 400 werden einzeln erklärt, der Rest wird gezählt.

## Welche Interpreter und Systeme

Laut der Spezifikation der Platform Compatibility Tags führt ein Installer eine nach Präferenz geordnete Liste der Tags (Python, ABI, Plattform), die er unterstützt, und installiert ein Wheel, wenn eines der Tags des Wheels in dieser Liste steht. Das Tool baut diese Liste so auf, wie packaging 26.3 sie für den beschriebenen Interpreter und das beschriebene System aufbaut, vergleicht die expandierten Tags des Wheels damit und meldet den besten Treffer und seine Position. Für CPython 3.13 auf glibc 2.39, x86-64, hat die Liste 1.147 Tags, dieselbe Anzahl, die `python -m pip debug --verbose` in dem Container ausgegeben hat, in dem das Tool gebaut wurde. pip 26.2 enthält noch packaging 26.2 als mitgelieferte Bibliothek, und packaging 26.3 hat an der Reihenfolge eine Sache geändert: Es bevorzugt das einfache Plattform-Tag `linux_*` gegenüber den Tags für manylinux und musllinux, sodass in jeder Gruppe das Tag `linux_x86_64` jetzt zuerst statt zuletzt kommt. Die Liste von pip enthält daher dieselben Tags in fast derselben Reihenfolge: Nur das einfache Tag `linux_*` jeder Gruppe verschiebt sich, und ob sich ein Wheel installieren lässt, ändert sich nie.

Zu jeder Kombination gibt es außerdem eine verständliche Lesart ihrer Interpreter-Regel: `py3-none` ist jedes Python 3; `cp311-abi3` ist CPython 3.11 oder neuer, Builds, die nicht free-threaded sind; `cp313-cp313t` ist nur der free-threaded Build von CPython 3.13. Manche Kombinationen sind gültige Namen, die kein Installer je aufführt, und das Tool sagt das mit Begründung: `abi3` mit einem anderen Python-Tag als `cp`, eine kompilierte ABI mit der Plattform `any`, eine ABI, die eine andere Version nennt als das Python-Tag, oder ein Tag `cp3` mit einer ABI.

Was die Zielprüfung nicht modelliert: Ziele für iOS, Android und Emscripten, andere Implementierungen als CPython und PyPy (für PyPy wird 7.3 angenommen, ABI `pp73`) und die Regeln pro Distribution, die ein Installer zusätzlich anwenden kann, etwa ein nicht passendes `Requires-Python` oder ein Index, der eine Datei verbirgt. Angeboten werden die Python-Versionen, die laut dem Python Developer's Guide unterstützte Branches sind: 3.11 bis 3.15.

## Befunde

| Code | Schweregrad | Bedeutung |
|---|---|---|
| `not-a-distribution` | Fehler | Der Name endet nicht auf `.whl`, `.tar.gz` oder `.zip` |
| `suffix-case` | Fehler | Die Endung ist nicht kleingeschrieben |
| `wrong-part-count` | Fehler | Ein Wheel-Name ohne vier oder fünf Bindestriche |
| `sdist-no-hyphen` | Fehler | Der Name einer Quelldistribution ohne Bindestrich |
| `empty-name`, `bad-name` | Fehler | Kein Name oder kein gültiger Projektname |
| `double-underscore` | Fehler | `__` im Namensteil |
| `bad-version` | Fehler | Keine Version nach PEP 440 |
| `bad-build-tag` | Fehler | Ein Build-Tag, das nicht mit einer Ziffer beginnt |
| `empty-tag` | Fehler | Ein leeres Tag oder ein leeres Mitglied einer komprimierten Menge |
| `python-tag-not-identifier` | Fehler | Ein Python-Tag, das mit einer Ziffer beginnt (pip lehnt den Namen ab) |
| `name-not-escaped` | Warnung | Akzeptiert, aber nicht in der Schreibweise, die Tools heute verwenden |
| `version-not-normalized` | Warnung | Die Version ist nicht in Normalform |
| `build-tag-used` | Warnung | Ein Build-Tag ist vorhanden |
| `tags-not-sorted`, `tags-uppercase` | Warnung | Eine komprimierte Menge in falscher Reihenfolge oder Großbuchstaben in einem Tag |
| `impossible-combination` | Warnung | Eine Kombination, die kein Installer aufführt |
| `unknown-python-tag` | Warnung | Ein Python-Tag, das nicht aus Buchstaben gefolgt von einer Version besteht |
| `linux-simple-tag` | Warnung | `linux_arch` statt manylinux oder musllinux |
| `legacy-arch-mismatch` | Warnung | Ein veralteter manylinux-Name auf einer Architektur, für die er nie definiert war |
| `macos-version-shape`, `android-abi`, `ios-multiarch` | Warnung | Ein Plattform-Tag außerhalb der Formen, die seine Familie festlegt |
| `sdist-zip`, `sdist-hyphens` | Warnung | Ein älterer oder nicht standardkonformer Name einer Quelldistribution |
| `local-version` | Hinweis | Ein lokales Label der Version (PyPI akzeptiert keine lokalen Versionen) |
| `legacy-manylinux` | Hinweis | Ein veralteter manylinux-Name und das Tag, das er bedeutet |
| `unknown-platform` | Hinweis | Eine Plattform außerhalb der beschriebenen Familien |
| `too-many-tags` | Hinweis | Mehr als 400 Kombinationen; der Rest wird gezählt |

## Versionen nach PEP 440

Eine Version hat die Form `[N!]N(.N)*[{a|b|rc}N][.postN][.devN][+local]`. Das Tool parst die Formen, die die Spezifikation akzeptiert, gibt die Normalform an und sagt, was sich geändert hat: Whitespace und ein führendes `v` entfernt, Großbuchstaben in Kleinbuchstaben umgewandelt, führende Nullen entfernt, `alpha`, `beta`, `c`, `pre` und `preview` als `a`, `b` und `rc` geschrieben, Trennzeichen entfernt oder als ein einzelner Punkt geschrieben, eine fehlende Nummer bei Vorabversion, Post-Release oder Entwicklungsversion als 0 angenommen, `-1` nach dem Release als `.post1` gelesen, `-` und `_` in einem lokalen Label als `.` geschrieben und eine Epoche `0!` entfernt. Eine Epoche ungleich null wird angezeigt; die Spezifikation rät von ihr ab.

Die Sortierung folgt der Spezifikation: Release-Nummern werden als Zahlen verglichen, fehlende zählen als null, daher sind `1.0`, `1.0.0` und `1` gleich; innerhalb eines Release kommen zuerst die Entwicklungsversionen, dann `a`, `b` und `rc`, dann das finale Release, dann die Post-Releases; eine Version mit lokalem Label wird nach derselben Version ohne lokales Label einsortiert.

## Specifier-Sets

Jede Klausel wird in Worten erklärt: `~=2.2` ist `>=2.2, ==2.*`; `==1.1.*` ist ein Präfixvergleich; `==1.1` ignoriert das lokale Label eines Kandidaten und füllt Release-Nummern mit Nullen auf; `<V` lässt die Vorabversionen von V aus, außer V ist selbst eine; `>V` lässt die Post-Releases von V aus, außer V ist selbst eines, sowie die lokalen Versionen von V; `===` vergleicht den Text (Buchstaben ohne Rücksicht auf Groß- und Kleinschreibung), und davon wird dringend abgeraten. Klauseln werden aus den Gründen abgelehnt, die die Spezifikation und packaging 26.3 nennen: `~=` mit nur einer Release-Nummer, `.*` mit einem anderen Operator als `==` und `!=` oder nach einem Teil für Vorabversion, Post-Release oder Entwicklungsversion, ein lokales Label mit einem anderen Operator als `==` und `!=`, zwei Klauseln ohne Komma.

Die Behandlung von Vorabversionen folgt der Spezifikation und packaging 26.3: Vorabversionen, einschließlich Entwicklungsversionen, werden ausgelassen, es sei denn, eine Klausel nennt eine, oder jede Version im Bereich ist eine Vorabversion; die Tabelle zeigt sowohl, was im Bereich liegt, als auch, was standardmäßig gewählt wird, und markiert die neueste gewählte Version.

## Wo das Tool packaging folgt und wo es strenger ist

Jede Bewertung wurde während der Entwicklung mit packaging 26.3 verglichen (siehe „Herkunft“). Das Tool folgt den Entscheidungen von packaging, wo die Spezifikation Spielraum lässt, etwa bei den exklusiven Regeln für `<` und `>` und bei der Tag-Liste des Installers. An einer Stelle ist es strenger, und es sagt das: Ein Dateiname, dessen Namensteil kein gültiger Projektname ist (ein `_` oder `.` am Anfang oder Ende, ein Nicht-ASCII-Buchstabe, ein Leerzeichen im Namen einer sdist), wird hier abgelehnt, während die Dateinamen-Parser von packaging ihn akzeptieren.

## Durchgerechnete Beispiele

- **Die Schaltfläche „Beispiel“**: `cryptography-50.0.2-cp311-abi3-manylinux_2_34_x86_64.whl`. CPython 3.11 oder neuer, stabile ABI, Builds, die nicht free-threaded sind, unter Linux mit glibc 2.34 oder neuer auf x86-64. Gegen CPython 3.13 auf glibc 2.39 lässt es sich installieren, als Tag 163 von 1.147 (pip 26.2.2 mit packaging 26.2 gibt es als 162 aus); auf glibc 2.31 nicht; auf einem free-threaded 3.14 nicht, weil `abi3` für free-threaded Builds nicht aufgeführt wird.
- `markupsafe-3.0.4-cp313-cp313-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl` wird zu drei Kombinationen expandiert; `manylinux2014` wird als veralteter Name von `manylinux_2_17` vermerkt.
- `Foo.Bar-1.0-py2.py3-none-any.whl` wird mit einer Warnung akzeptiert: Tools schreiben heute `foo_bar`.
- **Versionen**: Die Beispielliste `2.1 2.2 2.9.1 3.0 2.10rc1` mit `~=2.2` bringt `2.2`, `2.9.1` und `2.10rc1` in den Bereich und wählt `2.2` und `2.9.1`, weil ein finales Release im Bereich liegt.

## Herkunft

Die Engine ist rein: String-Scanner und Vergleiche, keine Uhr, kein Netzwerk, kein Zufall, kein regulärer Ausdruck mit verschachtelten Quantoren. Die Eingabe ist auf 20.000 Zeichen begrenzt, auf 256 pro Version, 1.024 pro Specifier-Set und 500 Versionen. Sie bringt Referenzvektoren (Golden Vectors) mit (Satz `wheel-filename-explainer/2026-10-27a`): 134 Zeilen mit 40 akzeptierten und 12 abgelehnten Versionen, zwei Sortierlisten (eine davon die der Spezifikation selbst), 22 Specifier-Sets (viele davon Beispiele aus der Spezifikation) und 13 abgelehnten, 33 Dateinamen und 12 Interpreter-Zielen, jede Bewertung aus packaging 26.3 übernommen. Während der Entwicklung wurde die Engine außerdem auf generierten Eingaben mit packaging 26.3 verglichen: 60.059 Versionen, 59.963 Specifier-Sets, 30.000 Dateinamen, 230 Ziele und 607.200 Prüfungen von Tags gegen Regeln, ohne andere Abweichung als die strengere Namensregel oben.

## API

Dieselbe Engine beantwortet die Operation `/api/v1/wheel-filename-explainer` der HTTP-API der Website, beschrieben im OpenAPI-Vertrag auf der [API-Seite](/api); der Vertrag gibt auch an, ob diese Website die API bereitstellt.

- **Anfrage.** Text, im Body einer POST-Anfrage oder im Query-Parameter `input` einer GET-Anfrage. Ein einzelnes Token, das auf `.whl`, `.tar.gz` oder `.zip` endet (oder eine URL dorthin), wird als Dateiname gelesen; alles andere wird als Versionen gelesen, eine pro Zeile oder durch Leerzeichen oder Kommas getrennt, und die erste Zeile, die mit `~`, `=`, `!`, `<` oder `>` beginnt, ist das Specifier-Set.
- **Antwort.** `mode` (`filename`, `versions`, `empty` oder `too-long`). Im Dateinamenmodus enthält `filename` die Felder `kind`, `fileName`, `parts`, `name`, `expectedName`, `version` (mit `normalized`, `epoch`, `release`, `pre`, `post`, `dev`, `local` und den `notes` zur Normalisierung), `build`, die geparsten `pythonTags`, `abiTags` und `platformTags`, die `expanded` Kombinationen mit ihrer Regel `interpreter`, `expandedCount`, `findings` und `valid`. Im Versionsmodus enthält `versions` die Felder `entries`, die Reihenfolge `sorted`, `equalGroups`, den geparsten `specifier` und die `selection`. Die Zielprüfung ist nur eine Funktion der Seite.

## Ergebnisse teilen

Unter der Bewertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Dateinamen so, wie eingegeben, und, wenn die Zielprüfung geöffnet ist, ihre sechs Auswahlen (Implementierung, Python-Version, free-threaded Build, Betriebssystem, dessen Version, Architektur); im Modus „Versionen“ enthält er die Versionen und das Specifier-Set. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Das Feld nimmt auch eine URL zu einem Wheel an, und die URL eines privaten Index kann vor dem `@` Zugangsdaten enthalten: pip liest `https://username:password@...` sowie ein einteiliges Token „as the "username"“, also als Benutzernamen, ohne Passwort ([pip, Authentication](https://pip.pypa.io/en/stable/topics/authentication/), abgerufen am 01.11.2026). Für die Auswertung genügt der Dateiname am Ende des Pfads, daher erhält eine URL mit irgendetwas vor ihrem `@` keinen Link: Fügen Sie nur den Dateinamen ein. Der Benutzer einer ssh-URL ist ein Login-Name und zählt nicht.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` steht, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Öffnen eines Links.** Der Modus wird gewählt, und seine Felder werden so gefüllt, wie eingegeben; ein Ziel öffnet die Prüfung mit diesen Auswahlen. Jede Auswahl muss eine sein, die die Seite anbietet, sonst wird der Link ignoriert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Quellen

Alle abgerufen am 27.10.2026.

- [Python Packaging User Guide: Binary distribution format](https://packaging.python.org/en/latest/specifications/binary-distribution-format/): die Konvention für Dateinamen, die Schreibweise des Namens darin, das Build-Tag
- [Python Packaging User Guide: Source distribution format](https://packaging.python.org/en/latest/specifications/source-distribution-format/): der Dateiname einer sdist
- [Python Packaging User Guide: Platform compatibility tags](https://packaging.python.org/en/latest/specifications/platform-compatibility-tags/): Python-, ABI- und Plattform-Tags, manylinux, musllinux, Tags für macOS, iOS und Android, komprimierte Tag-Mengen, wie Installer sie verwenden
- [Python Packaging User Guide: Names and normalization](https://packaging.python.org/en/latest/specifications/name-normalization/)
- [Python Packaging User Guide: Version specifiers](https://packaging.python.org/en/latest/specifications/version-specifiers/) und [PEP 440](https://peps.python.org/pep-0440/)
- [PEP 427](https://peps.python.org/pep-0427/), [PEP 600](https://peps.python.org/pep-0600/), [PEP 656](https://peps.python.org/pep-0656/), [PEP 803](https://peps.python.org/pep-0803/), [PEP 3149](https://peps.python.org/pep-3149/), [PEP 703](https://peps.python.org/pep-0703/), [PEP 783](https://peps.python.org/pep-0783/)
- [Python documentation: C API Stability](https://docs.python.org/3/c-api/stable.html): `abi3` und `abi3t`
- [packaging 26.3: Tags](https://packaging.pypa.io/en/stable/tags.html): die Reihenfolge der Tag-Liste des Installers; [Änderungsprotokoll](https://packaging.pypa.io/en/stable/changelog.html): 26.3 bevorzugt native Plattform-Tags `linux_*`
- [Python developer's guide: Status of Python versions](https://devguide.python.org/versions/): die unterstützten Branches, die die Zielprüfung anbietet
