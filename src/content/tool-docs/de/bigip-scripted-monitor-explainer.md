## Was das Tool tut

Das Tool liest die Datei, die ein Scripted-Monitor von BIG-IP LTM abspielt (die send- und expect-Zeilen unter `/config/eav/`), und erklärt sie so, wie der Monitor sie laut der Dokumentation von F5 liest. Jede Zeile wird so, wie geschrieben, und so, wie gelesen, angezeigt: das Schlüsselwort, der Text ohne Anführungszeichen und mit aufgelösten Escape-Sequenzen von F5, wie ein send endet (CR LF, nur LF, nur CR oder gar nicht) und was eine bekannte Antwort oder ein bekannter Befehl in SMTP, POP3, IMAP oder FTP bedeutet, mit dem Abschnitt des RFC. Die Befunde prüfen die Datei gegen jede Regel, die F5 nennt, und markieren alles, was F5 offenlässt, die Regeln S1 bis S16, jede an eine Zeile gebunden.

Geben Sie zusätzlich ein Servertranskript an, simuliert das Tool die Prüfung: Jedes send geht hinaus, jedes expect wird mit der nächsten Antwort des Servers verglichen, und das Ergebnis ist **bestanden**, **scheitert in Zeile N** mit der Begründung von F5 oder **in Zeile N nicht entscheidbar**, wo der Text von F5 nicht festlegt, was der Monitor tut. Es wird keinerlei Verbindung aufgebaut: Das Transkript ist Text, den Sie einfügen, und das Skript wird gelesen, nie ausgeführt. Das [Lab zum Scripted-Monitor](/learn/bigip-ltm-scripted-monitors#lab-scripted-monitor-dialogue) im Artikel unter „Lernen“ spielt ein Skript Zeile für Zeile gegen einen Server ab, der sich an die RFCs hält, und zeigt, welche Regel von F5 es stoppt.

Die Fakten stammen von F5: aus der BIG-IP 21.1.0 LTM Monitors Reference, „Scripted monitor settings“, und aus der TMSH Reference für `ltm monitor scripted`. Die Fakten zu den Protokollen stammen aus RFC 5321 (SMTP), RFC 1939 (POP3), RFC 9051 (IMAP4rev2) und RFC 959 (FTP). Alle wurden am 27.10.2026 gelesen.

## Die Regeln, die F5 nennt

- **S1, ein CR in einer Zeile (Fehler).** F5: Skripte „must use hard-return line endings (LF), not soft-return line endings (CR-LF)“, also LF statt CR-LF. Eine unter Windows gespeicherte Datei hat vor jedem LF ein CR. Der Befund gibt an, ob das CR die Zeile beendet oder mitten in ihr steht.
- **S2, nicht genau ein Leerzeichen nach dem Schlüsselwort (Fehler).** F5: „Exactly one character space must be used to separate the send or expect instruction keywords from the text“. Zwei oder mehr Leerzeichen oder ein Tab werden markiert.
- **S3, Zeichen nach einem schließenden Anführungszeichen (Fehler).** F5: „The text to send or match extends to the end of the line, even when using quotation marks. Any characters that follow a closing quotation mark will break the match.“ In einer expect-Zeile lässt der Simulator die Prüfung daher dort scheitern; bei einer send-Zeile legt F5 nicht fest, was gesendet wird, daher hält der Simulator mit „nicht entscheidbar“ an.
- **S4, ein erstes Wort, das weder send noch expect ist (Fehler).** F5 dokumentiert nur diese beiden Schlüsselwörter. Der Befund gibt an, wenn das Wort ein großgeschriebenes Schlüsselwort (`Expect`) ist, ein Kommentar (`#`) oder ein Zeichen dafür, dass ein Expect-Skript (Tcl) eingefügt wurde (`spawn`, `set`, `#!/usr/bin/expect` und Ähnliches).
- **S5, eine Escape-Sequenz, die F5 nicht aufführt (Warnung).** Die Tabelle von F5: `\a` Klingel (Bell), `\b` Rückschritt (Backspace), `\f` Seitenvorschub, `\n` neue Zeile, `\r` Wagenrücklauf, `\t` Tab, `\v` vertikaler Tab, `\\` Backslash, `\'` einfaches Anführungszeichen. Alles andere nach einem Backslash, etwa `\x0d` oder `\"`, ist nicht dokumentiert.
- **Die Präfixregel (der Abgleich des Simulators).** F5: „Matching text can match the prefix of a response, but cannot match a substring that is not a prefix, that is, a substring that starts other than at the beginning of the response.“ Der Text muss also am Anfang der Antwort stehen. Kommt er erst später in der Antwort vor, nennt der Schritt das Zeichen, an dem er beginnt.
- **Die Reihenfolge.** F5: „the lines of the file are always read in the sequence specified“. Der Simulator geht die Datei von oben nach unten durch und hält bei der ersten Zeile an, die scheitert oder nicht entscheidbar ist.

## Was F5 offenlässt

Der Text von F5 klärt diese Punkte nicht, daher markiert das Tool sie als Warnungen, und der Simulator hält dort mit **nicht entscheidbar** und dem Grund an, statt zu raten:

- **S9, eine Leerzeile.** Leerzeilen nach der letzten Anweisung werden vermerkt, können einen Abgleich aber nicht ändern.
- **S10, Whitespace vor dem Schlüsselwort.**
- **S11, eine Form von Anführungszeichen, die F5 nicht beschreibt:** einfache Anführungszeichen (F5 nennt eine Escape-Sequenz für das einfache Anführungszeichen, legt aber nicht fest, ob einfache Anführungszeichen einen Text einschließen), ein öffnendes Anführungszeichen ohne schließendes oder ein Anführungszeichen in einem Text ohne Anführungszeichen.
- **S12, ein leerer Text** (`expect` allein oder `expect ""`).
- **S13, eine letzte Zeile ohne LF.** Ein expect in einer solchen Zeile hält die Simulation an; ein send dort wird nur vermerkt.
- **S14, überhaupt keine expect-Zeile:** Nichts, was der Server sagt, wird je geprüft.
- **Groß- und Kleinschreibung.** Beginnt die Antwort mit dem Text in anderer Schreibung (`+ok` gegenüber `+OK`), meldet der Simulator „nicht entscheidbar“: F5 legt nicht fest, ob der Vergleich Groß- und Kleinschreibung unterscheidet.
- **Was eine Antwort ist.** F5 legt nicht fest, wie viel einer mehrzeiligen Antwort der Monitor vor dem Vergleich liest. Würde ein Treffer voraussetzen, dass der Monitor über das Ende der ersten Zeile der Antwort hinaus gelesen hat, meldet der Simulator „nicht entscheidbar“.
- **Eine Zeile ohne Anführungszeichen, die auf CR endet** (eine CR-LF-Datei ohne Anführungszeichen): F5 verlangt nur LF, legt aber nicht fest, wie eine solche Zeile dann gelesen wird.

## Empfehlungen aus den RFCs

- **S6, ein send ohne Zeilenende (Warnung).** SMTP, POP3, IMAP und FTP beenden jeden Befehl mit CR LF (RFC 5321 2.3.8, RFC 1939, Abschnitt 3, RFC 9051 2.2, RFC 959, Abschnitt 4), daher wartet ein Server dieser Protokolle auf eines. Das eigene Beispiel von F5 schreibt `\r\n` an das Ende jedes send; nichts im Text von F5 besagt, dass der Monitor ein Zeilenende ergänzt.
- **S7, ein send, das nur auf LF oder nur auf CR endet (Hinweis).** RFC 5321 2.3.8: Eine konforme Implementierung darf keinen anderen Zeilenabschluss als CR LF erkennen.
- **S8, ein expect, das wie ein Muster geschrieben ist (Hinweis):** ein führendes `^`, ein abschließendes `$`, `.*` oder `.+` oder die Optionen `-re`, `-gl`, `-ex` oder `-nocase` von Expect. Der Text wird wörtlich abgeglichen; laut F5 unterstützen nur die Monitore HTTP, HTTPS, HTTP/2, TCP und UDP reguläre Ausdrücke.
- **S15, Zugangsdaten in einem send (Warnung):** `PASS` (POP3, FTP) oder `LOGIN` (IMAP). Das Passwort wird überall in der Ausgabe maskiert, auch im Vergleich mit dem Transkript. Die Datei speichert es im Klartext, die tmsh-Referenz nennt für diesen Monitortyp keine TLS-Option, und laut RFC 9051 6.2.3 darf LOGIN nicht in unsicheren Netzwerken verwendet werden. POP3 erlaubt QUIT und IMAP erlaubt LOGOUT vor der Authentifizierung, daher ist eine Prüfung ohne Anmeldung meist möglich.
- **S16, ein expect auf einen Antwortcode mit Leerzeichen (Hinweis),** etwa `"250 "`. In mehrzeiligen Antworten von SMTP und FTP beginnt jede Zeile außer der letzten mit dem Code und einem Bindestrich (RFC 5321 4.2.1, RFC 959 4.2), daher ist `"250 "` nie der Anfang einer Antwort auf EHLO; erwarten Sie den Code allein.

## Das Transkript und wie die Simulation es liest

Schreiben Sie die Sitzung so, wie die RFCs es tun: `S:` vor jede Zeile, die der Server sendet, `C:` vor jede Zeile, die der Client sendet.

```
S: 220 foo.com Simple Mail Transfer Service Ready
C: HELO bigip1.somecompany.net
S: 250 foo.com
C: quit
S: 221 foo.com Service closing transmission channel
```

- Eine **Antwort** ist eine Folge von `S:`-Zeilen; eine `C:`-Zeile oder eine Leerzeile beendet sie. Setzen Sie eine Leerzeile zwischen zwei `S:`-Folgen, wenn der Server sie als getrennte Antworten sendet.
- Jede `S:`-Zeile wird so gelesen, als ende sie auf **CR LF**, wie es alle vier Protokolle verlangen. Die Leerzeichen nach `S:` und `C:` sind Notation, keine Daten (RFC 1939 schreibt `S:  +OK` mit zweien).
- Jedes **expect** wird ab dem ersten Zeichen mit der **nächsten Antwort** verglichen. Das ist die eine Annahme des Simulators: F5 legt nicht fest, was als „the response“ gilt, wenn eine Antwort mehrere Zeilen hat. Wo immer das die Bewertung ändern könnte, meldet der Simulator „nicht entscheidbar“.
- Jedes **send** wird mit der nächsten `C:`-Zeile verglichen, sofern es eine gibt; ein Unterschied wird vermerkt (das Transkript kann von einem anderen Client stammen), nie als Fehlschlag gewertet.
- Hat das Transkript für ein expect **keine Antwort mehr übrig**, scheitert die Prüfung dort: Laut der Zeile Timeout bei F5 gilt ein Ziel, das nicht innerhalb des Timeouts antwortet, als down.
- Zeilen, die weder mit `S:` noch mit `C:` beginnen, werden ignoriert und aufgeführt.

Die Gründe, aus denen eine Prüfung scheitert: Der Text kommt in der Antwort vor, aber nicht an ihrem Anfang (mit dem Offset); die Antwort beginnt nicht mit dem Text und enthält ihn nicht; die Antwort endet vor dem Text; auf ein schließendes Anführungszeichen folgen Zeichen, oder es folgt das CR eines CR-LF-Endes; es kommt keine Antwort.

## Die Ausgabe lesen

Die Zusammenfassung zählt Zeilen, sends, expects und Befunde und weist darauf hin, wenn die Datei nicht auf LF endet. Die Simulation zeigt die Bewertung, dann eine Zeile pro erreichter Zeile des Skripts: die Zeile, was sie sendet oder erwartet, so wie der Monitor sie liest, die Antwort, mit der sie verglichen wurde (nummeriert wie im Transkript), oder bei einem send, ob das Transkript dieselbe Client-Zeile zeigt, und das Ergebnis. Die Tabelle der Zeilen zeigt jede Zeile so, wie geschrieben: Ein Steuerzeichen, das die Datei tatsächlich enthält (das CR eines CR-LF-Endes, ein Tab), erscheint als sein Unicode-Symbol, etwa ␍ oder ␉, und eine als Backslash und Buchstabe eingegebene Escape-Sequenz bleibt so, wie eingegeben; an anderen Stellen wird Text mit den Escape-Sequenzen von F5 und ein Backslash als zwei angezeigt.

Die Schaltfläche **Beispiel** lädt das SMTP-Skript von F5 aus der Monitors Settings Reference wörtlich, mit einer Sitzung nach dem Muster von RFC 5321: Es besteht.

## Zeitverhalten

Das Skript hat laut der Dokumentation von F5 keinen eigenen Timer. Das Interval des Monitors (bei Scripted standardmäßig 10 Sekunden, laut tmsh-Referenz) und sein Timeout (31 Sekunden, dreimal das Interval plus eins) entscheiden, wann ein Member als down markiert wird, wie bei jedem Monitor; [der Artikel zu den Health-Monitoren von LTM](/learn/ltm-health-monitors) und sein [Lab zum Monitor-Timing](/learn/ltm-health-monitors#lab-f5-monitor-timing) zeigen, wie beide zusammenwirken.

## Ergebnisse teilen

Am Ende der Zusammenfassung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` beide Felder (`input` für das Skript, `transcript` für das Transkript, sofern vorhanden), wobei jedes Passwort zu PASS und LOGIN durch die Punkte ersetzt ist, die diese Seite anzeigt, im Skript so, wie geschrieben, und in den `C:`-Zeilen des Transkripts; kein Passwort bleibt also so, wie eingegeben. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Das sind die Passwörter, die Regel S15 maskiert: `PASS` ([RFC 1939](https://www.rfc-editor.org/rfc/rfc1939), Abschnitt 7) und das letzte Argument von `LOGIN` ([RFC 9051](https://www.rfc-editor.org/rfc/rfc9051), Abschnitt 6.2.3), abgerufen am 27.10.2026. Ein Punkt pro Zeichen, wie auf dieser Seite, sodass die empfangende Seite genau dieselben Zeilen, Befunde und dieselbe Simulation liest: Die Share-Vektoren des Tools vergleichen die beiden Ergebnisse vollständig. Ein Passwort, das mit Escape-Sequenzen geschrieben ist, lässt sich so, wie geschrieben, nicht finden (die Seite maskiert dann den ganzen Text), daher gibt es dafür überhaupt keinen Link, und das Popover nennt die Zeile. Andere Zugangsdaten bleiben so, wie eingegeben, etwa ein SMTP-AUTH-Austausch ([RFC 4954](https://www.rfc-editor.org/rfc/rfc4954), Base64, das zum Passwort dekodiert); das Popover weist darauf hin, bevor Sie kopieren. Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird die Kopie beim Öffnen des Links nicht an den Server gesendet. Sie bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Beide Felder werden wie beim Einfügen gefüllt (ein Transkript, das der Link nicht enthält, wird geleert), und die Seite liest sie. Es wird keine Verbindung aufgebaut und nichts ausgeführt. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Grenzen

- Das Tool wendet die veröffentlichten Regeln von F5 an. Was ein bestimmter BIG-IP-Build darüber hinaus tut, kann es nicht wissen; wo die Dokumentation schweigt, meldet es stattdessen „nicht entscheidbar“.
- Das Transkript stammt von Ihnen: Der Simulator weiß nicht, wie Ihr Server tatsächlich antwortet, wie schnell oder ob er nur einen Teil einer Antwort liefert.
- Die Prüfung auf Zugangsdaten ist ein Muster: `PASS x` und `tag LOGIN user password`. Ein Passwort, das auf andere Weise gesendet wird (etwa per AUTH), wird nicht erkannt.
- Testen Sie den echten Monitor auf dem System: `tmsh run ltm monitor scripted NAME destination ADDRESS:PORT`, dann `tmsh show ltm monitor scripted NAME test-result`, oder mit der Schaltfläche „Test“ im Configuration utility.

## API

Dieselbe Engine beantwortet die Operation `/api/v1/bigip-scripted-monitor-explainer` der HTTP-API der Website, beschrieben im OpenAPI-Vertrag auf der [API-Seite](/api); der Vertrag gibt auch an, ob diese Website die API bereitstellt.

- **Anfrage.** Ein JSON-Objekt, `{"script": "...", "transcript": "..."}`, im Body eines POST oder im Query-Parameter `input` eines GET; das Transkript darf leer sein oder fehlen. Das Skript ist auf 32.768 Zeichen begrenzt, das Transkript auf 65.536.
- **Antwort.** `lines` (jede mit `line`, `raw`, `kind`, `keyword`, `written`, `quoted`, `decoded`, `length`, `ending`, `hint`, `secret`, `breaks` und `open`), `findings` (`rule`, `severity`, `line`, `params`), `counts`, `sends`, `expects`, `endsWithLf`, `transcript` (`replies`, `clientLines`, `ignoredLines`) und `simulation` (`verdict`, `stopLine`, `reason`, `steps`, `unreadReplies`, `unusedClientLines`, `notes`), die letzten beiden null, wenn kein Transkript angegeben ist. Ein Passwort ist in jedem Feld maskiert.

## Quellen

- [F5, BIG-IP 21.1.0 LTM Monitors Reference, Monitors Settings Reference: Scripted monitor settings, the escape sequences and F5's SMTP example; the TCP Receive String and which monitors support regular expressions](https://techdocs.f5.com/en-us/bigip-21-1-0/big-ip-local-traffic-manager-monitors-reference/monitors-settings-reference.html#scripted-monitor-settings) (abgerufen am 27.10.2026)
- [F5 TMSH Reference v17, ltm monitor scripted: options and defaults, run and show test-result](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_scripted.html) (abgerufen am 27.10.2026)
- [RFC 5321, Simple Mail Transfer Protocol](https://www.rfc-editor.org/rfc/rfc5321) (abgerufen am 27.10.2026)
- [RFC 1939, Post Office Protocol, Version 3](https://www.rfc-editor.org/rfc/rfc1939) (abgerufen am 27.10.2026)
- [RFC 9051, Internet Message Access Protocol (IMAP), Version 4rev2](https://www.rfc-editor.org/rfc/rfc9051) (abgerufen am 27.10.2026)
- [RFC 959, File Transfer Protocol](https://www.rfc-editor.org/rfc/rfc959) (abgerufen am 27.10.2026)
- Artikel unter „Lernen“: [Scripted-Monitore in BIG-IP LTM](/learn/bigip-ltm-scripted-monitors), [Wie Health-Monitore von LTM zwischen up und down entscheiden](/learn/ltm-health-monitors). Verwandt: [Expect-Skripte erklärt](/tools/expect-script-explainer) für Expect selbst und [tmsh-Konfiguration erklärt](/tools/f5-tmsh-config-explainer) für das Objekt `ltm monitor scripted`, das die Datei benennt.
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
