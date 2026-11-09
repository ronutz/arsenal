## Was das Tool tut

Dekodieren Sie einen Certificate Signing Request nach PKCS#10 und lesen Sie, was er enthält: den Subject-Namen, den öffentlichen Schlüssel, die Subject Alternative Names und die anderen Erweiterungen, die der Antragsteller anfordert, sowie etwaige Attribute. Das Tool parst die Struktur des Requests vollständig in Ihrem Browser und kontaktiert nie eine Zertifizierungsstelle.

## Was ein CSR ist und was nicht

Ein CSR ist das Objekt, das Sie einer Zertifizierungsstelle (Certificate Authority, CA) übergeben, wenn Sie sie bitten, ein Zertifikat auszustellen. Entscheidend ist: Er ist kein Zertifikat. Er hat keine Seriennummer, keinen Aussteller und keine Gültigkeitsdaten, weil nichts davon bisher festgelegt ist. Er enthält nur, was der Antragsteller anfordert: einen Subject-Namen, einen öffentlichen Schlüssel und optional eine Reihe angeforderter Erweiterungen wie Subject Alternative Names. Der gesamte Request ist mit dem privaten Schlüssel signiert, der zum öffentlichen Schlüssel darin passt; das beweist, dass der Antragsteller diesen privaten Schlüssel tatsächlich besitzt, ein Schritt namens Proof of Possession (Besitznachweis).

## Angefordert, nicht gewährt

Ein CSR sagt Ihnen, was angefordert wurde, nicht, was eine CA gewähren wird. Eine Zertifizierungsstelle kann nach ihrer eigenen Richtlinie und der von ihr durchgeführten Validierung hinzufügen, ändern oder weglassen, was ein CSR anfordert; die SANs und Erweiterungen, die Sie hier sehen, sind also eine Anforderung, keine Garantie. Dieser Unterschied ist wichtig, wenn ein ausgestelltes Zertifikat nicht zum CSR passt: Oft wendet dann die CA ihre Richtlinie an, und es liegt kein Fehler vor.

## Was das Tool dekodiert

Der Request ist DER-kodiertes ASN.1 (dieselbe Tag-Length-Value-Kodierung, die Zertifikate verwenden), und der Decoder zerlegt ihn in lesbare Felder:

- den **Subject**-Distinguished-Name;
- den **öffentlichen Schlüssel** mit Algorithmus und Größe;
- die **angeforderten Erweiterungen**, enthalten in einem PKCS#9-Attribut `extensionRequest`, allen voran die Subject Alternative Names; und
- weitere **Attribute** wie ein Challenge-Passwort oder einen Unstructured Name, sofern vorhanden.

Es dekodiert nur die Struktur. Die Selbstsignatur des Requests wird nicht verifiziert, und weil ein CSR keinen Gültigkeitszeitraum hat, gibt es nichts Zeitabhängiges zu prüfen.

## Verwendung

Fügen Sie einen CSR nach PKCS#10 ein (den Block zwischen den Markierungen CERTIFICATE REQUEST) und lesen Sie Subject, Schlüssel, angeforderte SANs und Erweiterungen sowie Attribute ab. Das Parsen ist deterministisch und lokal.

## Ergebnisse teilen

Unter dem einleitenden Hinweis erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Feld so, wie eingefügt: `/tools/csr-decoder#input=-----BEGIN%20CERTIFICATE%20REQUEST-----...`. Ein Request ist das, was Sie an eine CA senden: ein Subject, ein öffentlicher Schlüssel und die angeforderten Erweiterungen. Alles andere im Feld geht mit. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Request beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **In zwei Fällen kein Link.** Wenn das Feld außerdem einen privaten Schlüssel enthält (einen Block `-----BEGIN ... PRIVATE KEY-----`, wie ihn manche Generatoren zusammen mit dem Request ausgeben), und wenn der Request ein Challenge-Passwort enthält, das diese Seite im Klartext zeigt: Der Request ist signiert, daher lässt er sich nicht ohne das Passwort teilen. Das Popover sagt, welcher Fall vorliegt.
- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Der Link hat die Form `#input=`, die diese Seite bereits liest, daher funktioniert das Öffnen genau wie bei solchen Links schon immer: Der Wert füllt das Feld und wird dekodiert, und er bleibt in der Adresse, bis Sie das Feld ändern oder leeren.
