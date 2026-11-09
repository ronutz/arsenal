## Was das Tool tut

Fügen Sie eine AS3-Deklaration für F5 BIG-IP ein, also das JSON, das Sie per POST an `/mgmt/shared/appsvcs/declare` senden, und das Tool gibt sie Ihnen erklärt zurück: ob es eine vollständige AS3-Anfrage oder eine reine ADC-Deklaration ist, die Optionen der obersten Ebene, die ADC-Metadaten und den Baum von Tenant über Application bis zur Ressource, wobei jede Klasse genannt und erklärt wird. Außerdem prüft es die Strukturregeln, die F5 dokumentiert. Das Tool dekodiert nur, läuft vollständig in Ihrem Browser und stützt sich auf das AS3-Benutzerhandbuch und die Schemareferenz von F5.

## Anfrage oder Deklaration

Zuerst sagt das Tool, welche der beiden Formen Sie eingefügt haben. Eine vollständige AS3-Anfrage hat `class: "AS3"` und enthält `action` (deploy, dry-run, retrieve, remove, patch) und `persist`, die die Deklaration umschließen. Eine reine ADC-Deklaration hat `class: "ADC"` auf oberster Ebene und lässt den Wrapper weg; die Optionen action und persist stehen dann nicht zur Verfügung. Bei einer Anfrage zeigt das Tool action und persist, bei der ADC-Deklaration in jedem Fall schemaVersion, id, label und remark.

## Der Baum, den es durchläuft

Unter den Metadaten durchläuft das Tool die feste AS3-Hierarchie: jeden Tenant (der zu einer BIG-IP-Partition wird), jede Application (mit ihrem Template und einem Hinweis, wenn ab AS3 3.20 standardmäßig generic gilt) und jedes Ressourcenobjekt darin. Für jedes Objekt zeigt es die Klasse und eine Erklärung in verständlicher Sprache, von Service_HTTP und Service_HTTPS über Pool, Monitor, TLS_Server, TLS_Client, Certificate, Persist, WAF_Policy und Endpoint_Policy bis iRule. Eine Klasse, die es nicht kennt, wird trotzdem aufgeführt und markiert, nie ausgeblendet.

## Die Strukturprüfungen

Neben der Erklärung wendet das Tool die dokumentierten Regeln an, die eine Deklaration gültig machen: eine Klasse AS3 oder ADC auf oberster Ebene, eine erforderliche schemaVersion, mindestens ein Tenant mit mindestens einer Application mit mindestens einer Ressource, und die Regel für die Übereinstimmung von Template und Service-Klasse (ein Template http, https, tcp, udp oder l4 verlangt ein passendes Service-Objekt namens service, früher serviceMain). Außerdem markiert es reservierte Namen (Common, Shared, service) als Hinweis und prüft, ob Objektnamen der Regel folgen: 1 bis 64 Zeichen, alphanumerisch, beginnend mit einem Buchstaben.

## Ergebnisse teilen

Unter der Bewertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` eine Kopie der Deklaration, nie das Eingefügte selbst: Jeder Wert, den die [Schemareferenz](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/refguide/schema-reference.html) von AS3 (abgerufen am 27.10.2026) als Secret definiert, wird durch `[redacted]` ersetzt. Das ist der `ciphertext` eines Secret-Objekts (mit dem Standard-Header `protected` ist er das Secret selbst, nur base64url-kodiert), eine `passphrase`, ein `password`, `secret`, `sharedSecret` oder `token`, als einfache Zeichenfolge geschrieben, die benannten Passphrasen (`cookiePassphrase`, `md5SignaturePassphrase`, `javaSignKeyPassphrase`), `privateKey` und `pkcs12` eines Certificate, eingebettet oder als `base64` oder `text` angegeben, die `targetPassphrase` der AS3-Anfrage und jeder Wert in `targetTokens` sowie die Zugangsdaten für Service Discovery (`secretAccessKey`, `apiAccessKey`, `encodedCredentials`, `encodedToken`). Das Popover nennt zuerst, was der Link enthält und wie viele Werte ersetzt wurden, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Die Seite zeigt diese Werte nie an, daher liest die empfangende Seite dieselbe Deklaration; die Kopie behält jedes andere Byte, einschließlich Abständen und Reihenfolge. Ein Schlüssel, der als `bigip`-Pfad oder als `url` angegeben ist, bleibt erhalten, ebenso `accessKeyId`, Namen, Adressen, iRules und `send`-Zeichenfolgen von Monitoren, die das Schema nicht als Secrets kennzeichnet: Prüfen Sie diese selbst, bevor Sie teilen.

Eingefügter Text, der kein gültiges JSON ist, lässt sich nicht sicher zerlegen: Nennt er irgendwo eine dieser Einstellungen, gibt es keinen Link, und das Popover bittet darum, zuerst das JSON zu korrigieren; nennt er keine, bleibt er so, wie eingegeben, und die empfangende Seite zeigt denselben Parse-Fehler.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird die Kopie beim Öffnen des Links nicht an den Server gesendet. Sie bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Kopie füllt das Feld wie beim Einfügen, und die Seite erklärt sie; es wird nichts gesendet. Danach verschwindet der Wert sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Umfang und Grundlagen

Das Tool erklärt die Struktur und prüft sie auf Plausibilität; es ist kein vollständiger Validator für JSON Schema. Es bildet nicht das gesamte AS3-Schema nach und prüft nicht jede Eigenschaft, daher kann AS3 selbst eine Deklaration ablehnen, die hier besteht; werten Sie ein sauberes Ergebnis als gutes Zeichen, nicht als Garantie. Nichts, was Sie einfügen, wird hochgeladen oder verlässt die Seite. Grundlage ist die AS3-Dokumentation von F5; für ein Deployment validieren Sie gegen Ihre AS3-Version und die Schemareferenz.
