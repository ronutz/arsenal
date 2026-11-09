## Was das Tool tut

Wählen Sie ein Protokoll, füllen Sie die Felder aus, die sich daran anpassen, und sehen Sie zu, wie der genaue `curl`-Befehl live entsteht. Jede Option, die der Generator ausgibt, wird unter dem Befehl erklärt, und alles mit Sicherheitsfolgen erhält eine Warnung: `-k`, Klartextprotokolle, ein Passwort auf der Kommandozeile oder die formularkodierte Vorgabe `-d` von `curl`, wenn der Body nach JSON aussieht. Es wird nichts ausgeführt, und nichts verlässt den Browser.

## Alle 27 Protokolle

Der Generator deckt die vollständige Protokollliste des aktuellen `curl`-Tools ab, wie sie auf curl.se veröffentlicht ist: DICT, FILE, FTP, FTPS, GOPHER, GOPHERS, HTTP, HTTPS, IMAP, IMAPS, LDAP (Lightweight Directory Access Protocol), LDAPS, MQTT, MQTTS, POP3, POP3S, RTSP, SCP, SFTP, SMB, SMBS, SMTP, SMTPS, TELNET, TFTP, WS und WSS. Die Auswahl eines Protokolls öffnet eine kurze Erklärung: was es ist, sein Standardport und ob es im Klartext läuft, innerhalb von TLS oder im Klartext beginnt und ein Upgrade erlaubt. Das Formular zeigt dann nur, was dieses Protokoll versteht: HTTP erhält Methoden, Header, Bodys und Formulare; SMTP einen Envelope; MQTT ein Topic; FTP Auflistung und Upload; `file://` nur einen Pfad.

## Eine Tabelle, eine Wahrheit

Die Erklärungen und der Befehlsaufbau lesen dieselbe Tabelle der Protokollfähigkeiten. Das ist gewollt: Der Text, der Ihnen zeigt, was ein Protokoll kann, und der Code, der den Befehl erstellt, können nicht auseinanderlaufen, weil sie dieselben Daten sind.

## Deterministisch von Grund auf

Identische Eingaben ergeben immer einen Byte für Byte identischen Befehl: Optionen werden in einer einzigen kanonischen Reihenfolge ausgegeben, und Werte werden nur bei Bedarf mit einfachen Anführungszeichen nach POSIX maskiert. Elf Referenzvektoren (Golden Vectors) legen dieses Verhalten fest, darunter die Regel, dass `-d` POST impliziert (daher wird nie ein überflüssiges `-X POST` ausgegeben), und die Escape-Sequenz `'\''`. Die Maskierung zielt auf POSIX-Shells; ein Hinweis im Tool sagt das, weil cmd.exe und PowerShell anderen Regeln folgen.

## Das Gegenstück zu „curl-Befehle erklärt“

Dieses Tool schreibt `curl`-Befehle; [curl-Befehle erklärt](/tools/curl-command-explainer) liest sie. Erstellen Sie hier einen Befehl, oder fügen Sie dort einen ein, um ihn Option für Option erklären und nach fetch, rohes HTTP, HTTPie und Python requests übersetzen zu lassen.

## Ergebnisse teilen

Unter dem Feld mit dem Befehl erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Formular, jedes Feld unter seinem eigenen Namen (ein Formular hat keinen einzelnen Text zum Einfügen), wobei das Passwort und alle Zugangsdaten durch `REDACTED` ersetzt sind, nie so, wie eingegeben. Die Schaltfläche bleibt sichtbar, aber deaktiviert, bis das Formular einen Befehl ergibt. Das Popover nennt zuerst, was der Link enthält und wie viele Werte ersetzt wurden, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Was ersetzt wird:

- **Das Passwortfeld**: Der Befehl lautet weiterhin `-u user:REDACTED`, und die Warnung vor einem Passwort auf der Kommandozeile bleibt.
- **Header**, nach Namen: `Authorization` und `Proxy-Authorization` behalten ihr Schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitte 11.6.2 und 11.7.2: Der Wert „consists of credentials“); Basic behält seine User-ID und verliert das Passwort ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), Abschnitt 2); ein JWT behält seinen Protected Header und verliert Claims und Signatur ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1); `Cookie` behält seine Namen; ein Header, der wie ein Secret benannt ist (`X-API-Key`), entfällt ganz; ein Token in jedem anderen Wert entfällt.
- **Das Cookie-Feld**: jeder Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitt 4.2.1). **Ein Formularfeld, das wie ein Secret benannt ist** (`client_secret`): sein Wert; ein Dateifeld behält seinen Pfad. **Der Body**: JSON-Einträge und `name=value`-Parameter, die wie ein Secret benannt sind (`access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), Abschnitte 2.2 und 2.3), `refresh_token`, `client_secret`, `password` und `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), Abschnitte 2.3.1, 4.1.2, 4.3.2 und 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), Abschnitt 4.5) und jeder Name, der auf token, secret, password oder api key endet).
- **Host, Proxy und Pfad**: ein Passwort in `user:password@` ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1; curl liest es auch ohne Schema) und jeder Query-Parameter, der ein Secret ist.

Jedes andere Feld bleibt so, wie eingegeben; Standardwerte (https, GET, Standardausgabe, Schalter aus) entfallen im Link, und ein Tab in einem einzeiligen Feld wird als Leerzeichen übertragen. Die Share-Vektoren des Tools prüfen, dass die Kopie dieselben Optionen und Warnungen ergibt. Enthält der aus der Kopie erstellte Befehl noch einen Schlüssel oder ein Token, den kein Name kennzeichnet (ein JWT im Pfad), gibt es keinen Link, und das Popover sagt das.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird das Formular beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Das ganze Formular wird ersetzt (ein Feld, das der Link nicht enthält, wird geleert), und der Befehl wird erstellt; es wird nichts ausgeführt oder gesendet. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
