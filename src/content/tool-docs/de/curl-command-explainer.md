## Was das Tool tut

Fügen Sie einen `curl`-Befehl ein, und das Tool erklärt ihn Option für Option und übersetzt ihn dann in vier andere Formen: einen `fetch`-Aufruf im Browser, eine rohe HTTP-Anfrage, einen HTTPie-Befehl und Python-Code mit `requests`. Der Befehl wird in Ihrem Browser in Tokens zerlegt und dekodiert; es wird nie etwas gesendet und keine Anfrage ausgeführt.

## Ein Parsing, fünf Ansichten

Im Kern gibt es nur einen Schritt: Das Tool parst Ihren `curl`-Befehl in ein einziges Anfragemodell und erfasst Methode, URL, Header, Body, Authentifizierung und die übrigen Optionen. Alles, was Sie sehen, wird aus diesem einen Modell abgeleitet. Weil eine korrekte Übersetzung ohnehin voraussetzt, dass jede Option verstanden ist, ist die Erklärung Option für Option nichts anderes als dasselbe Modell mit Beschriftungen; deshalb stimmen Erklärung und Übersetzungen immer überein.

## Wie das Tool Optionen liest

Jede Option, der curl ein Argument gibt, erhält dieses Argument auch hier, so wie curl es liest, sodass ein Wert nie für die URL gehalten wird. Die Liste ist die eigene Optionstabelle von curl ([src/tool_getparam.c](https://raw.githubusercontent.com/curl/curl/master/src/tool_getparam.c), abgerufen am 01.11.2026), abgeglichen mit der [Manpage von curl](https://curl.se/docs/manpage.html) (abgerufen am 01.11.2026). Die Optionen, die die Anfrage formen, werden einzeln erklärt; jede andere wird mit ihrem Argument benannt. Einige brauchen mehr als einen Namen:

- **`--oauth2-bearer`** ist Bearer-Authentifizierung ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), Abschnitt 2.1): Die Übersetzungen senden `Authorization: Bearer` und das Token, es sei denn, ein `Authorization`-Header ist mit `-H` geschrieben; dann sendet curl stattdessen diesen.
- **`-u user:password`** ist Basic-Authentifizierung, die Standardmethode von curl ([curl-Handbuch](https://curl.se/docs/manpage.html), `--basic`, abgerufen am 01.11.2026): Die Übersetzungen für `fetch` und rohes HTTP senden `Authorization: Basic` und das Base64 von `user:password` ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), Abschnitt 2, abgerufen am 01.11.2026), HTTPie erhält sein eigenes `-a user:password` und Python `requests` sein eigenes `auth=`. Mit `--digest` erhält HTTPie `-A digest` und `requests` sein `HTTPDigestAuth` ([Dokumentation von requests](https://requests.readthedocs.io/en/latest/user/authentication/), abgerufen am 01.11.2026). Nur mit Benutzernamen fragt curl nach dem Passwort, daher enthalten `fetch` und rohes HTTP kein Feld, und auch HTTPie fragt mit `-a user` nach. Mit `--digest`, `--ntlm`, `--negotiate`, `--anyauth` oder `--aws-sigv4` wird kein Basic-Feld geschrieben, weil diese Verfahren stattdessen auf eine Challenge antworten oder die Anfrage signieren. Ein mit `-H` geschriebenes `Authorization` oder `--oauth2-bearer` hat Vorrang.
- **`--json`** ist laut Manpage eine Abkürzung für `--data-binary`, `--header "Content-Type: application/json"` und `--header "Accept: application/json"`: Der Body ist das JSON so, wie eingegeben, mehrere `--json`-Teile werden ohne Trennzeichen aneinandergefügt, und ein mit `-H` geschriebener Header ersetzt den, den `--json` hinzufügt.
- **`--url-query`** hängt sein Argument an das Ende der Query der URL an, kodiert so, wie `--data-urlencode` kodiert, oder unverändert, wenn es mit `+` beginnt; ein Argument, das aus einer Datei gelesen wird (`name@file`), wird benannt, kann aber nicht angehängt werden.
- **`-U` / `--proxy-user`, `-E` / `--cert`, `--proxy-cert`, `--pass`, `--proxy-pass`, `--tlspassword`, `--proxy-tlspassword`, `--httpsig-key` und `--ftp-account`** werden ohne ihr Secret erklärt: Der Benutzer oder die Datei des Zertifikats wird angezeigt, ein Passwort, eine Passphrase, ein Schlüssel oder Kontodaten nicht.

## Die erzeugten Formen

- **curl erklärt.** Jede Option wird benannt und beschrieben, sodass eine unbekannte Option kein Rätsel mehr ist.
- **fetch.** Der Aufruf der Fetch API des Browsers nach der Semantik von MDN, fertig zum Einfügen in JavaScript.
- **Rohes HTTP.** Die tatsächliche Anfragezeile, Header und Body so, wie sie über die Leitung gingen; so sieht man am klarsten, was eine Anfrage genau ist.
- **HTTPie.** Der entsprechende `http`-Befehl für alle, die diesen Client bevorzugen.
- **Python requests.** Der entsprechende Code mit der Bibliothek Requests.

## Warum übersetzen statt ausführen

Das Tool führt die Anfrage bewusst nie aus. Das ist eine Entscheidung für Datenschutz und Sicherheit: Sie können einen Befehl dekodieren und umwandeln, der Zugangsdaten enthält oder auf einen internen Host zeigt, ohne dass etwas davon Ihren Browser verlässt und ohne auszulösen, was die Anfrage bewirken würde. Es übersetzt und erklärt; ein Client ist es nicht.

## Verwendung

Fügen Sie einen `curl`-Befehl ein und lesen Sie die Erklärung Option für Option und die vier Übersetzungen. Die Umwandlung ist deterministisch und lokal, daher ergibt derselbe Befehl immer dieselbe Ausgabe.

Das umgekehrte Tool ist der [Übersetzer für HTTP-Anfragen](/tools/http-request-translator): Fügen Sie eine rohe Anfrage ein und erhalten Sie einen ausführbaren Befehl zurück. Wenn Sie auf der Suche danach hierhergekommen sind: Er ist unter den Namen umgezogen, der beschreibt, was er tut.

## Ergebnisse teilen

Unter der Anfragezeile erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Befehl, wobei alle Zugangsdaten darin durch `REDACTED` ersetzt sind, nie so, wie eingegeben: Ein curl-Befehl, der beim Debuggen einer API eingefügt wird, enthält oft welche, und diese Seite zeigt Header-Werte, Cookies und in der Python-Übersetzung ein `-u`-Passwort im Klartext. Das Popover nennt zuerst, was der Link enthält und wie viele Werte ersetzt wurden, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Was ersetzt wird, jeder Wert dort, wo die [Manpage von curl](https://curl.se/docs/manpage.html) (abgerufen am 01.11.2026) oder ein HTTP-Standard ihn definiert:

- **`-u` / `--user` und `-U` / `--proxy-user`**: das Passwort („The username and passwords are split up on the first colon“); der Benutzer bleibt.
- **`--oauth2-bearer`, `--pass`, `--proxy-pass`, `--tlspassword`, `--proxy-tlspassword` und `--ftp-account`**: der ganze Wert; ebenso **`--httpsig-key`**, sofern es nicht mit `@` eine Datei benennt. **`-E` / `--cert` und `--proxy-cert`**: das Passwort nach dem ersten Doppelpunkt des Zertifikats, der nicht als `\:` geschrieben ist.
- **`-H` / `--header` und `--proxy-header`**, nach dem Namen des Felds: `Authorization` und `Proxy-Authorization` behalten ihr Schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitte 11.6.2 und 11.7.2: Der Wert „consists of credentials“); Basic behält seine User-ID und verliert das Passwort ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), Abschnitt 2); ein JWT behält seinen Protected Header und verliert Claims und Signatur ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1); Zugangsdaten nach AWS Signature Version 4 (`AWS4-HMAC-SHA256`) behalten den Umfang der Anmeldeinformationen (Credential Scope) und `SignedHeaders` und verlieren Zugriffsschlüssel-ID und Signatur ([Create a signed AWS API request](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html), abgerufen am 01.11.2026); `Cookie` behält seine Namen; ein Feld, das wie ein Secret benannt ist (`X-API-Key`, `X-Auth-Token`), entfällt ganz; ein Token in jedem anderen Wert entfällt.
- **`-b` / `--cookie`**: jeder Wert von `NAME1=VALUE1; NAME2=VALUE2` ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitt 4.2.1); ein Dateiname bleibt.
- **`-d` und die `--data`-Familie, `--json`, `--url-query` und `-F`**: JSON-Einträge und `name=value`-Parameter, deren Name ein Secret bezeichnet: `access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), Abschnitte 2.2 und 2.3), `refresh_token`, `client_secret`, `password` und `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), Abschnitte 2.3.1, 4.1.2, 4.3.2 und 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), Abschnitt 4.5) und jeder Name, der auf token, secret, password oder api key endet. Ein `@file` bleibt.
- **Die URL, `--url`, `-x` / `--proxy` und `-e` / `--referer`**: das Passwort in `user:password@` ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1) und die geheimen Parameter in Query und Fragment; bei `X-Amz-Credential` nur die Zugriffsschlüssel-ID. Das Argument jeder anderen Option wird genauso gelesen, daher verliert ein `--preproxy` oder ein SOCKS-Host, der mit `user:password@` geschrieben ist, das Passwort.

Ein Wert, der leer, ein Platzhalter oder eine Shell-Variable (`$TOKEN`) ist, bleibt. Jede Ersetzung wird an Ort und Stelle geschrieben, sodass die Kopie die Anführungszeichen, Abstände und Zeilenfortsetzungen des eingefügten Texts behält; ein Wert, in dem Escape-Sequenzen stehen, wird als Ganzes neu in Anführungszeichen gesetzt. Die Share-Vektoren des Tools prüfen, dass die Seite, die den Link öffnet, dieselbe Anfrage liest. Bleibt ein Schlüssel oder Token an einer Stelle, die kein Name kennzeichnet (ein JWT in einem URL-Pfad, ein privater Schlüssel), gibt es keinen Link: Das Popover nennt die Zeile, und Sie setzen dort einen Platzhalter ein und wählen die Schaltfläche erneut.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird die Kopie beim Öffnen des Links nicht an den Server gesendet. Sie bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Kopie füllt das Feld wie beim Einfügen, und die Seite erklärt sie; es wird nichts gesendet oder ausgeführt. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
