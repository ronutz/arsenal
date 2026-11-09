## Was das Tool tut

Zerlegen Sie jede URL in ihre benannten Teile: Schema, Host, Port, Pfad, die einzelnen Query-Parameter und das Fragment. Das Tool dekodiert prozentkodierte Zeichen und internationalisierte Hostnamen (Punycode), markiert eingebettete Zugangsdaten und andere Probleme und zeigt den Standardport des Schemas. Alles läuft in Ihrem Browser.

## Die Teile einer URL

Eine URL folgt einer festgelegten Grammatik, beschrieben in RFC 3986, und das Tool zerlegt eine URL in ihre Komponenten der obersten Ebene: das **Schema** (etwa `https`), die **Authority** (die etwaige Benutzerinformationen, den **Host** und den **Port** enthält), den **Pfad**, die **Query** und das **Fragment**. Anschließend teilt es den Query-String in einzelne Parameter auf und dekodiert jeden davon, sodass aus einer langen Query eine lesbare Liste von Name-Wert-Paaren wird statt einer undurchsichtigen Zeichenfolge. Gemäß dem WHATWG URL Standard behandelt es ein `+` in einer formularkodierten Query als Leerzeichen.

## Geparst wie geschrieben, nicht normalisiert

Eine wichtige Designentscheidung: Das Tool parst die URL genau so, wie Sie sie angegeben haben, und normalisiert sie nicht stillschweigend. Das ist wichtig, weil die Unterschiede, die ein Browser unauffällig glätten würde, oft genau das sind, was Sie sehen wollen: ein unerwarteter Port, ein doppelter Schrägstrich, ein verirrtes kodiertes Zeichen. Gerade weil die URL so angezeigt wird, wie sie geschrieben ist, eignet sich das Tool zum Debuggen und dazu, Verdächtiges zu erkennen.

## Dekodieren und markieren

Zwei Dinge macht das Tool besonders sichtbar:

- **Internationalisierte Hostnamen.** Ein Label des Hosts in Punycode-Form (beginnend mit `xn--`) wird zurück in seinen Unicode-Text dekodiert (RFC 3492 und das IDNA-Framework von RFC 5890), sodass Sie den tatsächlichen Namen sehen; das hilft auch, Tricks mit ähnlich aussehenden Domains aufzudecken.
- **Eingebettete Zugangsdaten.** Eine URL kann Benutzername und Passwort in der Form `user:pass@host` enthalten, und das Tool markiert das, denn Zugangsdaten in einer URL sind ein häufiger Fehler und ein Sicherheitsrisiko.

## Verwendung

Fügen Sie eine URL ein und lesen Sie Schema, Host, Port, Pfad, die dekodierten Query-Parameter und das Fragment ab, mit markierten Zugangsdaten und anderen Problemen. Das Parsen ist deterministisch und lokal, daher können Sie jede URL gefahrlos prüfen, auch eine, die Sie nicht aufrufen wollen.

## Ergebnisse teilen

Unter der Leiste „Aufbau“ erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die URL, wobei das Passwort und jeder Token-Parameter durch `REDACTED` ersetzt sind, nie so, wie eingegeben: Die Leiste „Aufbau“ zeigt die ganze URL, einschließlich des Passworts. Das Popover nennt zuerst, was der Link enthält und wie viele Werte ersetzt wurden, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Ersetzt wird:

- **Das Passwort in den Benutzerinformationen**, also der Text nach dem ersten Doppelpunkt: Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1, gilt für Anwendungen: „should not render as clear text any data after the first colon“. Der Benutzername bleibt.
- **Query- und Fragment-Parameter**, deren Name nach einem Secret aussieht: `access_token` in einer Query ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), Abschnitt 2.3) oder in einem Fragment, in dem ein Implicit Grant es zurückgibt ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), Abschnitt 4.2.2); `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), Abschnitt 4.1.2); `X-Amz-Signature` und `X-Amz-Security-Token` vollständig und von `X-Amz-Credential` nur die Zugriffsschlüssel-ID, sodass der Umfang der Anmeldeinformationen dahinter (Credential Scope: Datum, Region und Dienst) lesbar bleibt, denn daran liegt es meist, wenn eine vorsignierte URL scheitert ([Create a signed AWS API request](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html), abgerufen am 01.11.2026); `sig` ([Create a service SAS](https://learn.microsoft.com/en-us/rest/api/storageservices/create-service-sas), abgerufen am 01.11.2026); `key` ([Use API keys to access APIs](https://cloud.google.com/docs/authentication/api-keys-use), abgerufen am 01.11.2026); und jeder Name, der auf token, secret, password oder api key endet.

Host, Port, Pfad und alle übrigen Parameter bleiben so, wie eingegeben, und die Share-Vektoren des Tools prüfen, dass die Seite, die den Link öffnet, dieselben Teile liest. Ein Hinweis, der nur einen ersetzten Wert betraf (ein prozentkodiertes Zeichen oder ein `+` darin), entfällt mit ihm. Bleibt ein Schlüssel oder Token an einer Stelle zurück, die kein Name kennzeichnet (ein JWT im Pfad), gibt es keinen Link, und das Popover sagt das.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird die Kopie beim Öffnen des Links nicht an den Server gesendet. Sie bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Kopie füllt das Feld wie beim Einfügen, und die Seite zerlegt sie. Wie bei jedem `#input=`-Link auf diese Seite bleibt der Wert in der Adresse, bis Sie das Feld bearbeiten.
