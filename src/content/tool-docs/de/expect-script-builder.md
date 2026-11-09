## Was das Tool tut

Das Tool schreibt aus wenigen Angaben ein vollständiges Skript für [Expect](/glossary/expect): wie verbunden wird (ssh, telnet oder ein anderes Programm, etwa ein Client für die serielle Konsole), Host und Benutzer, wie die Anmeldung authentifiziert wird, ein Geräteprofil, die Befehle, die Timeouts und wohin die Ausgabe geht. Das Skript meldet sich an, erhöht die Berechtigungen, wo Sie es verlangen, behandelt das Paging, führt die Befehle nacheinander aus und meldet sich ab. Standardmäßig ändert es auf dem Gerät nichts: Wo das Ausschalten des Pagings eine globale Konfigurationsänderung wäre, beantwortet es stattdessen den Pager, und die Einstellung zu ändern ist eine ausdrückliche Wahl, die ihre Wiederherstellung gleich mitbringt. Es wird nichts ausgeführt, und nichts verlässt den Browser: Sie kopieren das Skript oder laden es herunter und führen es selbst aus.

Jedes Skript, das der Generator schreiben kann, besteht die Prüfung durch [Expect-Skripte erklärt](/tools/expect-script-explainer) ohne Fehler und ohne Warnung, und die Seite lässt die Erklärung über das Skript laufen, während Sie es zusammenstellen. Die Referenzvektoren (Golden Vectors) des Tools prüfen dieses Versprechen für jede Kombinationsklasse der Auswahlen, mehr als zweitausend davon. Die Hinweise, die die Erklärung trotzdem anzeigen kann, sind gewollt: E5 zum einzelnen Leerzeichen, das einen `--More--`-Prompt beantwortet, und E12 zu einem Skript, das nur in eine Logdatei schreibt.

## Secrets: nie im Skript

- **Ein ssh-Schlüssel.** ssh läuft mit `BatchMode=yes`; das schaltet laut ssh_config(5) „user interaction such as password prompts and host key confirmation requests“ ab, also Passwortabfragen und Rückfragen zum Host-Key, für Skripte und andere Batch-Jobs. Der Schlüssel muss allein funktionieren: Laden Sie ihn in den `ssh-agent`, oder geben Sie eine Schlüsseldatei an (`-i`, mit `IdentitiesOnly=yes`, damit nur dieser Schlüssel angeboten wird).
- **Ein Passwort aus einer Umgebungsvariablen.** Das Skript prüft, ob die Variable gesetzt und nicht leer ist (sonst Status 2), kopiert sie und entfernt sie mit `unset env(NAME)` aus der Umgebung, bevor es die Verbindung startet, sodass das gestartete Programm sie nicht erbt.
- **Ein Passwort, das beim Ausführen abgefragt wird.** Das Idiom aus expect(1): `stty -echo`, `send_user`, `expect_user -re "(.*)\n"`, `stty echo`, mit eigenen zwei Minuten für die Eingabe (`-timeout 120` im Block) und einem Echo, das bei jedem Ausgang wieder eingeschaltet wird. Das Skript braucht dann ein Terminal.

Auch in ein Log gelangt nichts Geheimes. Die Anmeldung läuft mit `log_user 0`, sodass ein Gerät, das das Passwort als Echo zurückgibt, es nicht auf den Bildschirm bringen kann, und die Transkriptdatei wird, wenn Sie eine verlangen, erst nach der Anmeldung und dem enable-Schritt geöffnet. Das Log von Expect zeichnet auch bei ausgeschaltetem Echo auf, was `expect_user` liest, und `exp_internal` gibt jedes `send` vollständig aus; daher öffnet der Generator nie ein Log, bevor die Secrets verwendet sind, und schaltet `exp_internal` nie ein. Beide Fakten wurden mit dem echten `expect` 5.45.4 geprüft und werden in [Secrets in Expect-Skripten](/learn/expect-secrets-and-safe-scripts) erklärt.

ssh erhält immer `-o StrictHostKeyChecking=accept-new`. Laut ssh_config(5) gilt damit: „ssh will automatically add new host keys to the user's known_hosts file, but will not permit connections to hosts with changed host keys“; neue Host-Keys werden also automatisch übernommen, Verbindungen zu Hosts mit geänderten Schlüsseln aber nicht zugelassen. Der Generator schreibt nie `no`, das einen geänderten Schlüssel akzeptiert.

## Geräteprofile

Die Profile stammen aus dem Datenmodul der Tool-Reihe; jeder Wert wurde am 27.10.2026 in den Dokumenten des jeweiligen Herstellers gelesen und wird in [Expect auf Netzwerkgeräten](/learn/expect-against-network-devices) erklärt:

- **Cisco IOS XE:** `terminal length 0` für die Sitzung, `--More--` wird mit der Leertaste beantwortet, `enable` mit seiner Frage `Password:`.
- **F5 BIG-IP (tmsh):** `modify /cli preference pager disabled display-threshold 0`, eine Einstellung des Benutzers, deren Gültigkeitsdauer die Referenz nicht nennt, ohne dokumentierten Wert zum Wiederherstellen.
- **Fortinet FortiOS:** Standardmäßig beantwortet das Skript jedes `--More--` mit einem Leerzeichen und `exp_continue`, und die Konfiguration des Geräts bleibt, wie sie war. Das Paging auszuschalten ist eine ausdrückliche Wahl: `config system console`, `set output standard`, `end`, eine globale Konfigurationsänderung, die in der Sitzung jedes Administrators wirkt; daher warnt der Generator in diesem Fall und fügt die dokumentierte Wiederherstellung hinzu (`set output more`), die Sie abwählen können.
- **Extreme Switch Engine:** `disable cli paging session`, für die Sitzung.
- **Extreme Fabric Engine:** `terminal more disable`, dessen Geltungsbereich die Referenz nicht nennt, mit `terminal more enable` zum Zurücksetzen; `enable` kann Fragen stellen, die die Dokumente nicht abdrucken, daher bietet der Generator es nur ohne Passwort an.
- **Generisch:** Ihre eigene Prompt-Regexp und ein Paging-Befehl, falls Sie einen haben.

Jede Prompt-Regexp wird wörtlich zwischen geschweifte Klammern geschrieben, `-re {...}`, sodass Tcl darin nichts ersetzt.

## Wie das Skript aufgebaut ist

- Der Timeout wird vor dem ersten `expect` gesetzt, sodass nichts auf den Standardwert von 10 Sekunden wartet.
- Ein einziges `expect` behandelt die ganze Anmeldung: Jede Frage (Benutzername, Passwort) wird einmal beantwortet; kommt dieselbe Frage ein zweites Mal, wurde die Antwort abgelehnt, und das Skript endet mit Status 1; der Prompt beendet die Anmeldung, und Zweige für `timeout` und `eof` beenden das Skript mit einer Meldung.
- Jeder Block in geschweiften Klammern beginnt mit einem Zeilenumbruch nach der Klammer. Expect 5.45.4 liest ein einzelnes Argument in geschweiften Klammern nur in diesem Fall als Muster und Rümpfe; in einer Zeile geschrieben, wäre der Block ein einziges Muster (Regel E19 der Erklärung).
- `run_command` sendet eine Zeile, die auf `\r` endet, und wartet auf den Prompt. Ein Muster, das auf jedes Zeilenende passt, startet mit `exp_continue` den Timer bei jeder Zeile neu; der Befehls-Timeout misst daher Stille und nicht die Dauer des ganzen Befehls, und eine lange Ausgabe läuft nicht in den Timeout, solange sie noch eintrifft.
- Wird das Paging beantwortet, wird das Muster als `-ex "--More--"` geschrieben, da `expect` jedes Wort, das mit `-` beginnt, als Option liest (Regel E20 der Erklärung).
- Am Ende stehen der Abmeldebefehl und danach `expect eof` oder, wenn Sie keinen Abmeldebefehl angeben, ein `close`, dann `wait`, sodass der Prozess eingesammelt wird.

Exit-Status: 0 fertig; 1 die Anmeldung ist gescheitert; 2 fehlende oder falsche Eingabe; 3 ein Befehl wurde nicht beendet; 4 die Sitzung wurde vorzeitig geschlossen.

## Was das Tool an Ihrer Eingabe prüft

- Nur Hostnamen und Adressen (kein Bindestrich am Anfang, sodass ein Wert ssh nie als Option erreichen kann); wird der Host aus der Kommandozeile übernommen, prüft das Skript das Argument beim Ausführen auf dieselbe Weise.
- Einen Port nur für ssh (`-p`); für telnet auf einem anderen Port verwenden Sie „Anderes Programm“.
- Schlüsseldateien und Logdateien als einfache Pfade, ohne Leerzeichen, `~` oder Zeichen, die Tcl ersetzen würde; die Kommandozeile eines Programms als durch Leerzeichen getrennte Wörter, keines davon mit `~` oder einem solchen Zeichen, und der Programmname beginnt nicht mit einem Bindestrich.
- Befehle als reinen Text, bis zu 40 Befehle mit jeweils bis zu 300 Zeichen; jedes `\`, `"`, `$`, `[`, `]`, `{` und `}` wird mit einem Backslash geschützt, sodass das Gerät den Befehl so erhält, wie eingegeben.
- Timeouts von 1 bis 3600 Sekunden, nie `-1`.
- Eine generische Prompt-Regexp mit ausgeglichenen geschweiften Klammern und nie eine, die sofort passt (`.*`, `^`, `$`).

Ein Befehl, der eine Frage stellt, wird nicht beantwortet: Das Skript endet mit Status 3, wenn der Befehls-Timeout abläuft. Beginnt ein Befehl wie eine der dokumentierten Bestätigungen des Profils (`reload`, `save configuration`, `reboot`, `reset`, `execute restore`), weist der Generator darauf hin.

## Grenzen

- Der Generator schreibt das Skript; er führt es nie aus. Führen Sie es zuerst gegen ein Lab-Gerät aus.
- Er wartet auf das Prompt-Muster des Profils. Eine Banner-Zeile oder eine Befehlszeile, die selbst auf `>` oder `#` endet und in einem eigenen Stück ankommt, kann für den Prompt gehalten werden; [der Artikel zu Netzwerkgeräten](/learn/expect-against-network-devices) behandelt Prompt-Muster.
- Kommentare und Meldungen im Skript sind auf Englisch, wie die Befehle selbst.
- Er beantwortet keine Bestätigungen, behandelt nicht mehrere Geräte in einem Skript und hält die Ausgaben der einzelnen Befehle nicht getrennt; bearbeiten Sie das Skript dafür, und prüfen Sie es danach erneut mit [der Erklärung](/tools/expect-script-explainer).

## Verwandte Tools und Lektüre

- **Was das Skript einsammelt.** Ist es eine Konfiguration, liest sie die Erklärung für die Plattform: [tmsh-Konfiguration erklärt](/tools/f5-tmsh-config-explainer), [FortiOS-CLI-Konfiguration erklärt](/tools/fortios-cli-config-explainer) und [ExtremeXOS-Konfiguration erklärt](/tools/exos-config-explainer).
- **Warum das Skript so geschrieben ist.** Das Quoting von Tcl, das entscheidet, was beim Gerät ankommt, steht in [Tcl für Autoren von Expect-Skripten](/learn/tcl-for-expect-writers); der Timer, den `exp_continue` in `run_command` neu startet, in [Timeouts, eof und Schleifen in Expect](/learn/expect-timeouts-eof-and-loops); und was Expect in ein Log schreibt, in [Debugging von Expect](/learn/expect-debugging-and-logging).

## Ergebnisse teilen

Unter dem Skript erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Formular, nie das Skript: jede Auswahl (Transport, Anmeldung, Geräteprofil, enable, Paging, Ausgabe, die Schalter und die beiden Timeouts) und jedes Textfeld, das das Formular für diese Auswahlen anzeigt. Die Seite schreibt aus demselben Formular Byte für Byte dasselbe Skript. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Der Generator nimmt nie ein Passwort entgegen: Er liest es aus einer Umgebungsvariablen, deren Name das einzige Feld dafür ist, oder fragt beim Ausführen danach. Das Formular nennt trotzdem Ihren Host, Ihren Benutzer und Ihre Befehle, daher bittet das Popover Sie, sie zu lesen, bevor Sie den Link senden. Bevor ein Link angeboten wird, wird der Text nach Zugangsdaten durchsucht, die ein Standard definiert: ein privater Schlüssel im PEM-Format, eine Zeile `Authorization` oder `Proxy-Authorization` mit beliebigem Schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitte 11.6.2 und 11.7.2: Der Wert „consists of credentials“), eine Zeile `Cookie` oder `Set-Cookie` mit einem Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitte 4.1.1 und 4.2.1), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1: Die Form „user:password“ „is deprecated“), eine AWS-Zugriffsschlüssel-ID oder ein `ENC`-Wert von FortiOS; alle abgerufen am 01.11.2026. Findet sich eines davon, gibt es keinen Link: Das Popover nennt das Feld, und Sie setzen einen Platzhalter an seine Stelle und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur nach einem Secret aussieht (`username admin secret ...` in einem Befehl, `set password ...`), blockiert den Link nicht; das Popover nennt den ersten solchen Wert, damit Sie ihn prüfen können.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` steht, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Öffnen eines Links.** Das Formular wird so gesetzt, wie Sie es setzen würden, Felder, die der Link nicht enthält, stehen auf ihren Standardwerten, und die Seite erzeugt das Skript. Jede Auswahl muss eine sein, die die Seite anbietet, und es darf kein verborgenes Feld vorhanden sein, sonst wird der Link ignoriert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Quellen

- [expect(1), Expect 5.45.4 manual source, core.tcl-lang.org](https://core.tcl-lang.org/expect/raw?name=expect.man&ci=expect-5-45-4) (abgerufen am 27.10.2026)
- [expect.c, Expect 5.45.4: how expect reads its arguments](https://core.tcl-lang.org/expect/raw?name=expect.c&ci=expect-5-45-4) (abgerufen am 27.10.2026)
- [OpenSSH ssh(1)](https://man.openbsd.org/ssh.1) (abgerufen am 27.10.2026)
- [OpenSSH ssh_config(5): StrictHostKeyChecking, BatchMode, IdentitiesOnly](https://man.openbsd.org/ssh_config.5) (abgerufen am 27.10.2026)
- [RFC 854, Telnet Protocol Specification](https://www.rfc-editor.org/rfc/rfc854) (abgerufen am 27.10.2026)
- Die Herstellerdokumente der Geräteprofile, mit ihren Daten aufgeführt in [Expect auf Netzwerkgeräten](/learn/expect-against-network-devices) (abgerufen am 27.10.2026)
