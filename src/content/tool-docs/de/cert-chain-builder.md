## Was das Tool tut

Das Tool nimmt beliebig viele X.509-Zertifikate im PEM-Format in beliebiger Reihenfolge an und tut, was die Pfadbildung eines TLS-Clients tut, bevor sie auch nur eine Signatur prüft: Es findet das End-Entity-Zertifikat, verfolgt jedes Zertifikat bis zu seinem Aussteller und meldet die Kette, die ein Server senden sollte, die fehlenden und die überzähligen Zertifikate sowie jede Strukturregel der Pfadvalidierung nach RFC 5280, die die Kette verletzt. Danach verifiziert die Seite die Signatur jeder Verknüpfung in Ihrem Browser mit WebCrypto und meldet das getrennt, weil das strukturelle Ergebnis auf jedem Rechner gleich ist, während die Signaturprüfung davon abhängt, was der Browser kann.

Fügen Sie das Leaf-Zertifikat ein, die Zwischenzertifikate, das Root-Zertifikat, falls Sie es haben, eine alte Cross-Signatur, bei der Sie unsicher sind, das Zwischenzertifikat versehentlich doppelt; die Seite sortiert alles und gibt an, was sie mit jedem Zertifikat gemacht hat.

## Wie die Kette entsteht

- **Das End-Entity-Zertifikat** ist das Zertifikat, das kein anderes in der Eingabe ausstellt und dessen basicConstraints kein cA setzt. Gibt es mehrere solche Zertifikate, wird das erste verwendet und die anderen werden gemeldet; gibt es keines (ein Bündel aus Zwischenzertifikaten allein), wird die oberste CA verwendet, und die Seite weist darauf hin.
- **Jede Verknüpfung** wird über Authority Key Identifier zu Subject Key Identifier hergestellt, wenn beide Zertifikate einen enthalten (RFC 5280, Abschnitt 4.2.1.1: Der Key Identifier dient dazu, „to facilitate certification path construction“, also die Bildung des Zertifizierungspfads zu erleichtern), und über den Namen des Ausstellers zum Namen des Subject, wenn einem der beiden einer fehlt. Ein Zertifikat mit dem richtigen Namen, aber einem anderen Schlüssel ist kein Aussteller; es wird als CA mit gewechseltem Schlüssel (Rollover) gemeldet und der tatsächliche Aussteller als fehlend.
- **Mehrere mögliche Aussteller** (eine kreuzsignierte CA oder zwei Zertifikate für denselben Schlüssel) werden zugunsten desjenigen aufgelöst, dessen Gültigkeit den Beginn des Subject abdeckt; die Alternativen werden als überzählig aufgeführt.
- **Der Pfad endet** bei einem selbstsignierten Zertifikat (Subject gleich Aussteller, und die Key Identifier widersprechen dem nicht) oder wenn der nächste Aussteller nicht in der Eingabe ist. Im zweiten Fall wird der fehlende Aussteller genannt, mit dem Key Identifier, den das Subject erwartet, und der URL unter caIssuers, die das Zertifikat enthält, sofern vorhanden. Die Seite ruft sie nicht ab.

## Die geprüften Regeln

Entlang des Pfads, von oben nach unten, die Prüfungen aus RFC 5280, Abschnitt 6.1.4, die keine Kryptografie brauchen:

- **(k) basicConstraints.** Ein Aussteller der Version 3 muss die Erweiterung mit cA TRUE enthalten. „If the cA boolean is not asserted, then the keyCertSign bit in the key usage extension MUST NOT be asserted“, und der Schlüssel „MUST NOT be used to verify certificate signatures“ (Abschnitt 4.2.1.9).
- **(n) keyUsage.** Ist die Erweiterung bei einem Aussteller vorhanden, muss keyCertSign gesetzt sein.
- **(l) und (m) pathLenConstraint.** Der Wert „gives the maximum number of non-self-issued intermediate certificates that may follow this certificate in a valid certification path“, also die Höchstzahl nicht selbst ausgestellter Zwischenzertifikate, die in einem gültigen Pfad folgen dürfen; das End-Entity-Zertifikat „is not included in this limit“, und null bedeutet, dass kein Zwischenzertifikat folgen darf. Die Seite zählt von der Spitze des Pfads abwärts, überspringt selbst ausgestellte Zertifikate und nennt die CA, deren Grenze ausgeschöpft wurde. Ein selbstsigniertes Root-Zertifikat an der Spitze ist der Vertrauensanker, der „not included as part of the prospective certification path“ ist (Abschnitt 6.1); seine eigene Einschränkung dient nur als Startwert.
- **Gültigkeit zu einem Zeitpunkt.** Jedes Zertifikat auf dem Pfad wird zum gewählten Zeitpunkt beurteilt, standardmäßig nach Ihrer Uhr oder zu einem Datum, das Sie festlegen, und als abgelaufen oder noch nicht gültig gemeldet. Ein Aussteller, der vor dem von ihm ausgestellten Zertifikat abläuft, ergibt eine Warnung mit dem Datum, weil die Kette ab diesem Tag nicht mehr validiert, ganz gleich, was das Leaf-Zertifikat sagt.
- **Algorithmen.** Eine Signatur mit SHA-1 oder MD5 an beliebiger Stelle außer bei einem selbstsignierten Root-Zertifikat (dessen eigene Signatur kein Validator prüft) wird nach den Baseline Requirements des CA/Browser Forum markiert, die die letzte Verwendung von SHA-1 in Zertifikaten zum 15.09.2026 beendet haben; ein RSA-Schlüssel unter 2048 Bit wird nach Abschnitt 6.1.5 desselben Dokuments markiert.
- **Das End-Entity-Zertifikat.** Ein Serverzertifikat ohne subjectAltName wird markiert, da Browser den Hostnamen nur mit dieser Erweiterung abgleichen.

## Die Bewertungen

- **Vollständig**: Der Pfad führt vom End-Entity-Zertifikat zu einem selbstsignierten Zertifikat, jede Verknüpfung ist hergestellt, und keine Regel ist verletzt. Vollständig heißt hier strukturell vollständig; ob dem Root-Zertifikat vertraut wird, entscheidet der Truststore des Clients.
- **Vollständig, mit Warnungen**: dasselbe, mit etwas, das Sie zuerst lesen sollten.
- **Die Kette endet bei einer CA, deren Aussteller hier fehlt**: Der Pfad ist, soweit er reicht, in Ordnung und endet bei einem Zwischenzertifikat, dessen Aussteller nicht eingefügt wurde. Das ist die normale Form einer TLS-Kette, denn „a certificate that specifies a trust anchor MAY be omitted from the chain, provided that supported peers are known to possess any omitted certificates“ (RFC 9846, Abschnitt 4.5.1; Abschnitt 4.4.2 in RFC 8446, den er im Juli 2026 abgelöst hat). Ist der fehlende Aussteller in den Truststores Ihrer Clients, fehlt nichts; ist er selbst ein Zwischenzertifikat, fügen Sie es hinzu.
- **Unvollständig**: Der Pfad endet beim End-Entity-Zertifikat. Kein Client kann aus dem Vorhandenen eine Kette bilden; fügen Sie die Zwischenzertifikate hinzu.
- **Ungültig**: Eine der obigen Regeln ist verletzt. Ein konformer Client lehnt die Kette ab.

## Die zu konfigurierende Kette

Die Seite kodiert die Zertifikate auf dem Pfad aus ihren Bytes neu, als base64 mit 64 Spalten, in der Reihenfolge, die RFC 9846, Abschnitt 4.5.1, verlangt: „The sender's certificate MUST come in the first CertificateEntry in the list. Each following certificate SHOULD directly certify the one immediately preceding it.“ Das Root-Zertifikat kann enthalten sein oder fehlen; Server lassen es normalerweise weg. Wohin die Datei gehört, hängt vom Server ab:

- **nginx**: eine Datei, „the server certificate must appear before the chained certificates in the combined file“; die falsche Reihenfolge scheitert beim Start mit „key values mismatch“, weil nginx den privaten Schlüssel gegen das erste gefundene Zertifikat prüft.
- **Apache httpd 2.4.8 und neuer**: `SSLCertificateFile` „may also include intermediate CA certificates, sorted from leaf to root“, was „obsoletes SSLCertificateChainFile“, SSLCertificateChainFile also überflüssig macht.
- **F5 BIG-IP**: Die Zwischenzertifikate werden als eigenes Zertifikatsobjekt importiert („in sequence with no space between“ eingefügt, also direkt hintereinander ohne Leerzeile) und im Profil Client SSL oder Server SSL als Chain zu Zertifikat und Schlüssel ausgewählt; das Leaf-Zertifikat bleibt in einem eigenen Objekt. Der Artikel von F5 ergänzt, dass „putting the root CA certificate in the certificate bundle is optional, and will never cause the client to trust the root CA“.

## Was die Seite kryptografisch verifiziert und was nicht

Die Signatur jeder Verknüpfung wird im Browser gegen den öffentlichen Schlüssel des Ausstellers geprüft, der in der Tabelle steht: RSASSA-PKCS1-v1_5 und RSASSA-PSS mit SHA-1, SHA-256, SHA-384 oder SHA-512, ECDSA auf P-256, P-384 und P-521 sowie Ed25519, sofern der Browser es unterstützt. Ein selbstsigniertes Root-Zertifikat wird gegen seinen eigenen Schlüssel geprüft; das beweist, dass das Zertifikat in sich stimmig ist, nicht, dass ihm jemand vertraut. Was der Browser nicht kann, erscheint als nicht geprüft, nie als fehlgeschlagen.

Nicht erledigt wird, was ein Validator erledigt: einen Truststore befragen, den Hostnamen mit subjectAltName abgleichen, Name Constraints, Policy Constraints und Extended Key Usage entlang des Pfads auswerten und die Sperrung prüfen. Die Verweise auf CRL (Certificate Revocation List) und OCSP (Online Certificate Status Protocol) auf dem Pfad werden aufgeführt; keiner wird kontaktiert.

Um zu sehen, was ein Validator aus der Kette macht, die ein Server tatsächlich sendet, führen Sie `openssl s_client -showcerts` gegen den Server aus und fügen die Ausgabe in [openssl s_client erklärt](/tools/openssl-s-client-explainer) ein: Die PEM-Blöcke sind die Kette, wie sie gesendet wurde, die diese Seite dann sortieren kann, und der Verify return code ist das Urteil von OpenSSL darüber.

## Ergebnisse teilen

Unter der Bewertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Zertifikate so, wie eingefügt, und, falls Sie eines festgelegt haben, das Datum in „Gültigkeit beurteilen zum“: `/tools/cert-chain-builder#certs=...&asof=2026-10-04`. Ohne Datum urteilt die Seite nach ihrer eigenen Uhr, ein später geöffneter Link also nach der Uhr dessen, der ihn öffnet. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher werden die Zertifikate beim Öffnen des Links nicht an den Server gesendet. Sie bleiben in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Ein privater Schlüssel ist nie enthalten.** Eine kombinierte PEM-Datei (die vollständige Kette mit ihrem Schlüssel, wie manche Server sie laden) enthält einen Schlüssel, den der Generator ignoriert. Enthält das Feld einen Block `-----BEGIN ... PRIVATE KEY-----`, wird kein Link angeboten, und das Popover fordert Sie auf, den Schlüssel zuerst zu entfernen.
- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Zertifikate füllen das Feld wie beim Einfügen, und das Datum wird gesetzt; die Seite bildet den Pfad und prüft die Signaturen im Browser, wie beim Einfügen. Ein Datum, das kein tatsächlich existierender Tag in der Form JJJJ-MM-TT ist, führt dazu, dass der ganze Link ignoriert wird. In beiden Fällen verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
- **Links von anderen Seiten.** Ein Wert, der als `#input=` übergeben wird, füllt das Feld weiterhin genau wie bisher; „Ergebnisse teilen“ verwendet eigene Namen (`certs`, `asof`), sodass sich beides nie vermischt.

## Grenzen

- Bis zu 32 Zertifikatsblöcke und 262.144 Zeichen Eingabe; nur PEM (eine DER-Datei wandeln Sie mit `openssl x509 -inform der -outform pem` um).
- Namen werden als einzeilige Distinguished Names verglichen, so wie der Decoder sie ausgibt; das ist in Grenzfällen von Zeichenfolgentyp und Groß-/Kleinschreibung strenger als der Vergleich nach RFC 5280, Abschnitt 7.1, und eine Kette, die sich nur nach diesen Regeln verknüpfen ließe, wird als nicht verknüpft gemeldet.
- Der Zeitpunkt ist 00:00 UTC des Datums, wenn Sie eines festlegen, und sonst Ihre Uhr auf die Sekunde genau.
- Browser gehen unterschiedlich mit einem fehlenden Zwischenzertifikat um: Manche rufen es just in time über die URL unter caIssuers ab, Firefox lädt Zwischenzertifikate stattdessen vorab aus der CA-Datenbank von Mozilla (seit Firefox 75) und ruft nichts ab. Funktioniert eine Kette in einem Browser und im anderen nicht, liegt es meist daran.

## Quellen

- [RFC 5280: Internet X.509 Public Key Infrastructure Certificate and CRL Profile](https://www.rfc-editor.org/rfc/rfc5280) (abgerufen am 04.10.2026): Abschnitte 4.2.1.1, 4.2.1.2, 4.2.1.3, 4.2.1.9, 6.1 und 6.1.4
- [RFC 9846: The Transport Layer Security (TLS) Protocol Version 1.3, Juli 2026, Abschnitt 4.5.1, derselbe Text wie Abschnitt 4.4.2 von RFC 8446, den er ablöst](https://www.rfc-editor.org/rfc/rfc9846.html#section-4.5.1) (abgerufen am 26.10.2026)
- [CA/Browser Forum: Baseline Requirements for TLS Server Certificates, version 2.3.1](https://github.com/cabforum/servercert/blob/main/docs/BR.md) (abgerufen am 04.10.2026): Abschnitt 6.1.5 und das Änderungsprotokoll
- [RFC 9155: Deprecating MD5 and SHA-1 Signature Hashes in TLS 1.2 and DTLS 1.2](https://www.rfc-editor.org/rfc/rfc9155) (abgerufen am 04.10.2026)
- [nginx: Configuring HTTPS servers, SSL certificate chains](https://nginx.org/en/docs/http/configuring_https_servers.html) (abgerufen am 04.10.2026)
- [Apache HTTP Server 2.4: mod_ssl, SSLCertificateFile and SSLCertificateChainFile](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html) (abgerufen am 04.10.2026)
- [F5 K13302: Configure the BIG-IP system to use an SSL chain certificate](https://my.f5.com/manage/s/article/K13302) (aktualisiert am 26.11.2025, abgerufen am 04.10.2026)
- [Mozilla: Intermediate CA Preloading](https://wiki.mozilla.org/Security/CryptoEngineering/Intermediate_Preloading) (abgerufen am 04.10.2026)
- [Let's Encrypt: Chains of Trust](https://letsencrypt.org/certificates/) (abgerufen am 04.10.2026): die Hierarchie, zu der die Beispielkette gehört
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
