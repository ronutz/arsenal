## Was das Tool tut

Führen Sie `tty` in einer Shell aus, fügen Sie die Ausgabe ein, und das Tool sagt Ihnen, welche Schicht des Terminal-Stacks Sie tatsächlich vor sich haben: einen Pseudoterminal-Slave, eine virtuelle Konsole, eine echte serielle Leitung, das Synonym für das steuernde Terminal oder die Systemkonsole. Es behandelt auch **„not a tty“**, und das ist ein Befund, kein Fehler.

Die vier einzeiligen Definitionen erscheinen, **bevor** Sie etwas einfügen: Wer mit Unklarheiten über die Begriffe ankommt, sollte nichts eingeben müssen, bevor die Seite etwas erklärt.

## Was jede Antwort liefert

- **`/dev/pts/N`**: ein Pseudoterminal-Slave. Etwas im Userspace hält den Master: Ihr Terminalemulator, `sshd` oder `tmux`. **Die Nummer wird vergeben und hat keine Bedeutung**: Zwei Shells mit aufeinanderfolgenden Nummern haben nichts miteinander zu tun. Deshalb beendet das Schließen eines Fensters auch, was darin lief: Der Master verschwindet, der Kernel löst einen Hangup aus, und der Sitzungsleiter erhält SIGHUP.
- **`/dev/ttyN`**: eine virtuelle Konsole, also der Kernel, der Tastatur und Bildschirm der Maschine selbst bedient. Sie übersteht, was ein Pseudoterminal nicht übersteht, und deshalb landen Sie dort, wenn der Displayserver abgestürzt ist.
- **`/dev/ttyS0`, `/dev/ttyUSB0`**: eine echte serielle Leitung, der ursprüngliche Fall, unverändert. Das Tool warnt, dass **serielle Parameter nicht ausgehandelt werden**: Passen sie nicht zusammen, entsteht glaubwürdig aussehender Datenmüll statt Stille. Zeigt eine Konsole Zeichensalat, ist daher meist die Geschwindigkeit falsch eingestellt und nicht das Kabel defekt.
- **`/dev/tty`**: kein Gerät, sondern ein **Synonym** für das Terminal, das den aufrufenden Prozess steuert. Es erklärt, warum eine Passwortabfrage Sie auch dann noch erreicht, wenn die Ausgabe umgeleitet ist.
- **`/dev/console`**: wohin der Kernel schreibt, auf einem Server häufig die serielle Schnittstelle statt des Bildschirms.

## Was das Tool nicht tut

Es liest einen Pfad, kein System. Es kann Ihnen nicht sagen, wer den Master für Ihr bestimmtes `/dev/pts/3` hält, und es rät nicht bei unbekannten Gerätenamen: Ein nicht erkannter Pfad wird als nicht erkannt gemeldet, denn ein plattformspezifisches Gerät sollte nicht aus seiner Schreibweise erschlossen werden.

## Ergebnisse teilen

Unter „Was das ist“ erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Gerätepfad oder die tty-Ausgabe so, wie eingegeben (`input`), und sonst nichts. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Die vier Definitionen oben gehören zur Seite selbst und sind daher nicht im Link.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Pfad beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Öffnen eines Links.** Der Pfad füllt das Feld wie bei der Eingabe, und die Seite erklärt ihn; es wird nichts gesendet. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
