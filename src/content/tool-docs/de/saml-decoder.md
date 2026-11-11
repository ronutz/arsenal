## Was das Tool tut

Fügen Sie eine SAML Response oder Assertion ein, als rohes XML, in Base64 oder URL-kodiert, und das Tool dekodiert sie: Aussteller, Status, Subject, Bedingungen, Audience und Attribute. Neben der Dekodierung führt es eine regelbasierte Sicherheitsbewertung aus, und es parst das XML auf eine Weise, die gegen XXE gehärtet ist. Alles geschieht in Ihrem Browser.

## SAML in Kürze

SAML, die Security Assertion Markup Language, ist der XML-basierte Standard hinter einem großen Teil des Single Sign-on in Unternehmen. Nachdem Sie sich authentifiziert haben, stellt ein Identity Provider eine signierte **Assertion** aus, meist verpackt in eine **Response**, die einem Service Provider bestätigt, wer Sie sind. Das Tool zieht die Teile heraus, die entscheiden, ob dieser Assertion zu trauen ist: den **Issuer** (welcher IdP), den **Status** (ob die Authentifizierung erfolgreich war), das **Subject** mit seiner NameID (wer), die **Conditions** (das Gültigkeitsfenster und die **AudienceRestriction**, die nennt, für wen die Assertion bestimmt ist) und die **Attributes** (die Claims über den Benutzer). Weil SAML über das HTTP-POST-Binding Base64-kodiert übertragen wird, oft zusätzlich URL-kodiert in einem Formularwert, macht das Tool diese Kodierungen zuerst rückgängig; eine für das HTTP-Redirect-Binding DEFLATE-komprimierte Nachricht weist es zurück, mit einer Fehlermeldung, die nach dem reinen XML oder dem HTTP-POST-Formular fragt.

## Das Sicherheitsmodell: XXE-Ablehnung

Die wichtigste Eigenschaft dieses Tools ist die Art, wie es parst. Nicht vertrauenswürdiges XML ist wegen XXE-Angriffen (XML External Entity) und Angriffen per Entity-Expansion wie Billion Laughs gefährlich, und beide setzen voraus, dass das Dokument eine DTD deklariert, über einen `DOCTYPE` oder eine `<!ENTITY>`-Deklaration, um ihre Entitäten zu definieren. Eine legitime SAML-Nachricht braucht nie eine DTD, daher lehnt der Parser jedes Dokument, das eine enthält, von vornherein ab. Diese eine Regel verhindert klassisches XXE und die Billion-Laughs-Expansion schon konstruktionsbedingt, statt zu versuchen, sie nachträglich zu bereinigen.

## Was die Bewertung prüft

Über die Dekodierung hinaus bewertet das Tool die Nachricht anhand von Sicherheitsempfehlungen für SAML: ob sie signiert ist, ob sie schwache Signatur- oder Digest-Algorithmen (etwa SHA-1) verwendet und ob ihre Bedingungen und ihre Audience vorhanden und stimmig sind. Ist die Assertion verschlüsselt, erkennt das Tool das `EncryptedAssertion` und meldet es, statt zu versuchen, es zu entschlüsseln. Diese Prüfungen spiegeln die Fragen der SAML-Empfehlungen von OWASP, sodass die Ausgabe auf die Dinge zeigt, die tatsächlich Schwachstellen in SAML verursachen.

## Verwendung

Fügen Sie eine SAML Response oder Assertion in einer ihrer üblichen Formen ein und lesen Sie Aussteller, Status, Subject, Bedingungen, Audience und Attribute dekodiert, zusammen mit der Sicherheitsbewertung. Das Parsen ist deterministisch und lokal, und der Parser, der XXE ablehnt, macht es sicher, nicht vertrauenswürdige Nachrichten zu untersuchen.

Um eine lange Nachricht Zeile für Zeile zu lesen, formatiert der [XML-Formatierer und -Validator](/tools/xml-formatter) sie übersichtlich; seine Dokumentation erklärt, warum eine signierte Nachricht nach dem Umformatieren nicht weitergesendet werden darf.

## Ergebnisse teilen

Unter den Badges im Kopf der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen und sobald die Seite die Nachricht dekodiert hat. Der Link enthält nach dem `#` die Nachricht so, wie eingefügt (rohes XML, URL-kodiert oder Base64). Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Eine SAML-Nachricht nennt Ihren Identity Provider und Ihren Service Provider, und ein Subject kann eine Person nennen, daher bittet das Popover Sie, sie zu prüfen, bevor Sie den Link senden.

Eine Nachricht, die Zugangsdaten enthält, erhält keinen Link: eine signierte Assertion, eine Assertion in einer signierten Response oder ein `EncryptedAssertion`. Laut [SAML 2.0 Profiles](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf) (OASIS, abgerufen am 01.11.2026) gilt für die Bearer-Methode: „the subject of the assertion is the bearer of the assertion“ (Abschnitt 3.3); Assertions, die über das HTTP-POST-Binding zugestellt werden, müssen signiert sein („MUST be signed“, Abschnitt 4.1.4.5); und der Service Provider merkt sich verwendete IDs nur so lange, wie die Assertion gültig ist. Eine signierte Assertion meldet ihr Subject also an, und ein Link würde das jedem in die Hand geben, den er erreicht, bis sie abläuft; eine verschlüsselte ([SAML 2.0 Core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf), Abschnitt 2.3.4) kann der Service Provider öffnen. Die Signatur zu entfernen würde ändern, was diese Seite zeigt, daher wird die Nachricht auch nicht kopiert. Ein AuthnRequest, ein LogoutRequest oder eine LogoutResponse, Metadaten, eine Fehler-Response (laut Profiles, Abschnitt 4.1.4.2: „MUST NOT include any assertions“) und eine nicht signierte Assertion erhalten alle einen Link.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Nachricht füllt das Feld wie beim Einfügen, und die Seite dekodiert sie, lokal; sie verifiziert nichts, ruft nichts ab und entschlüsselt nichts. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
