## Was das Tool tut

Fügen Sie eine rohe HTTP/1.1-Anfrage ein, wie Sie sie aus einem Mitschnitt, einem Proxy-Log oder einem Beispiel aus einem RFC erhalten, und das Tool macht daraus den entsprechenden `curl`-Befehl, einen `fetch`-Aufruf für den Browser, einen HTTPie-Aufruf, ein Snippet für Python `requests` und einen PowerShell-Einzeiler. Alles wird in Ihrem Browser geparst; es wird nie etwas gesendet, und keine Anfrage wird ausgeführt.

## Das Gegenstück zur curl-Erklärung

[curl-Befehle erklärt](/tools/curl-command-explainer) geht in die eine Richtung: ein Befehl hinein, unter den Ausgaben eine rohe Anfrage. Dieses Tool geht in die andere: eine rohe Anfrage hinein, ein ausführbarer Befehl heraus. Es gibt beide, weil man die Richtungen in verschiedenen Momenten braucht. Ein Mitschnitt liefert eine Nachricht; ein Terminal will einen Befehl; ein Fehlerbericht will beides.

## Wie die URL zusammengesetzt wird

Eine gewöhnliche Anfragezeile enthält nur einen Pfad, etwa `GET /users HTTP/1.1`, weil die Verbindung den Host bereits kennt. Um etwas zu erzeugen, das sich überall ausführen lässt, verbindet das Tool dieses Ziel mit dem Header `Host`. Ziele in absolute-form, wie Proxys sie verwenden, sind bereits vollständig und werden unverändert übernommen. Fehlt `Host` bei einer Anfrage in origin-form, meldet das Tool das, weil die URL sonst geraten wäre.

## Header, die das Tool bewusst weglässt

`Host`, `Content-Length` und `Connection` werden nicht erneut ausgegeben. Jeder Client setzt sie selbst, und wer sie durchreicht, erzeugt doppelte Header oder, schlimmer, eine angegebene Länge, die nicht mehr zu dem Body passt, den der Client tatsächlich sendet.

## Wovor das Tool warnt

- **Ein `Content-Length`, das nicht zum Body passt.** Server und Proxys können sich dann uneinig sein, wo die Nachricht endet, und das ist der Rohstoff für Request Smuggling.
- **Ein Body in Chunks.** Er wird so übernommen, wie eingefügt, statt dekodiert zu werden; Transfer-Kodierungen zu dekodieren ist Aufgabe eines Decoders für Nachrichten, nicht eines Übersetzers.
- **`http` im Klartext.** Header und Body werden lesbar übertragen.
- **Ein `Authorization`-Header oder ein `Cookie`.** Eine mitgeschnittene Anfrage enthält meist gültige Zugangsdaten, und das ist in der Praxis die wichtigste Warnung: Was Sie gleich in ein Ticket einfügen, kann eine funktionierende Sitzung sein.

## Verwendung

Fügen Sie die Anfrage ein, lesen Sie die geparste Anfragezeile und die Header, und kopieren Sie dann die Form, die Sie brauchen. Die Umwandlung ist deterministisch und lokal, daher ergibt dieselbe Anfrage immer dieselbe Ausgabe.

## Ergebnisse teilen

Unter der Anfragezeile und ihren Warnungen erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Anfrage mit maskierten Zugangsdaten, nie so, wie eingegeben: Eine mitgeschnittene Anfrage enthält routinemäßig einen Authorization-Header oder ein Sitzungs-Cookie, und diese Seite zeigt jeden Header-Wert im Klartext und in fünf Übersetzungen. Das Popover nennt zuerst, was der Link enthält und wie viele Werte maskiert wurden, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Was maskiert wird:

- **Header-Felder**, nach Namen: `Authorization` und `Proxy-Authorization` behalten ihr Schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitte 11.6.2 und 11.7.2: Der Wert „consists of credentials“); Basic behält seine User-ID und verliert das Passwort ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), Abschnitt 2); ein JWT behält seinen Protected Header und verliert Claims und Signatur ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1); jeder `Cookie`-Wert entfällt ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitt 4.2.1); ein Feld, das wie ein Secret benannt ist (`X-API-Key`), entfällt ganz; ein Token in jedem anderen Wert (ein `Referer` mit einem Code) entfällt. Aus jedem wird `REDACTED`.
- **Das Anfrageziel**: Ein Passwort in `user:password@` ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1) und die geheimen Query-Parameter werden zu `REDACTED`.
- **Der Body**: JSON-Einträge und Formularparameter, die wie ein Secret benannt sind (`access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), Abschnitte 2.2 und 2.3), `refresh_token`, `client_secret`, `password` und `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), Abschnitte 2.3.1, 4.1.2, 4.3.2 und 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), Abschnitt 4.5) sowie jeder Name, der auf token, secret, password oder api key endet), werden Oktett für Oktett mit `*` gefüllt, sodass der Body seine Länge behält: Ein `Content-Length`, das gepasst hat, passt weiterhin.

Die Share-Vektoren des Tools prüfen, dass die Seite, die den Link öffnet, dieselbe Anfrage liest (dieselben Warnungen, Felder und dieselbe Länge des Bodys). Bleibt ein Schlüssel oder Token an einer Stelle, die kein Name kennzeichnet (ein JWT, das als Klartext-Body eingefügt ist), gibt es keinen Link: Das Popover nennt die Zeile.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird die Kopie beim Öffnen des Links nicht an den Server gesendet. Sie bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Kopie füllt das Feld wie beim Einfügen, und die Seite übersetzt sie; es wird nichts gesendet. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
