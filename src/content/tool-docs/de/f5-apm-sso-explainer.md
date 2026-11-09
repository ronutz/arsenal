# APM-SSO-Methoden erklärt

Nach der Authentifizierung hat BIG-IP Zero Trust Access (früher BIG-IP APM, Access Policy Manager) die Aufgabe, sich weiter für Sie zu authentifizieren, und das Kapitel Single Sign-On Methods definiert genau acht Wege dafür: HTTP Basic, NTLMv1, NTLMv2, Kerberos mit eingeschränkter Delegierung (Constrained Delegation), Form Based, Forms - Client Initiated, OAuth Bearer und SAML. Das Tool stellt jede Methode als Karte dar, mit ihrem Mechanismus, dem Weg der Zugangsdaten, ihren Voraussetzungen und ihren Eigenheiten, alles getreu aus dem Kapitel und den methodenspezifischen Leitfäden verdichtet.

Die Bewertung auf jeder Karte ist der Absatz des Kapitels selbst zum Schadensbereich, und er ist die wichtigste Aussage für den Betrieb: Ein falsch konfiguriertes SSO-Objekt für HTTP Basic, NTLMv1, NTLMv2, Kerberos, OAuth Bearer oder SAML kann SSO für alle Authentifizierungsmethoden in der Sitzung dieses Benutzers deaktivieren. Form Based und Forms - Client Initiated sind die einzigen beiden Methoden, die nicht deaktiviert werden, wenn das Objekt einer anderen Methode fehlerhaft ist. Eine einzige fehlerhafte SSO-Konfiguration für Kerberos, und jede Anwendung in der Sitzung kann ihr SSO verlieren; eine fehlerhafte Formularkonfiguration, und nur diese eine Anwendung verliert es. Diese Asymmetrie entscheidet darüber, wie sorgfältig jede Objektklasse behandelt werden sollte.

Die Karte für Kerberos enthält die vollständige Liste der Voraussetzungen: ein Delegierungskonto im Active Directory pro Server-Realm, dessen SPN im SPN-Format als Account Name eingetragen ist, den Realm in Großbuchstaben, ressourcenbasierte eingeschränkte Delegierung für Umgebungen mit mehreren Realms und den Satz des Handbuchs selbst, den man sich einrahmen sollte: APM Kerberos SSO braucht und verwendet keine Keytab-Datei. Ihre natürlichen Eingangstüren sind die Methoden, bei denen das Passwort nie im Klartext übertragen wird, unter den Beispielen des Kapitels selbst Client-Zertifikate und NTLM. Für NTLMv2 gilt die dokumentierte Eigenheit, dass eine 401 mit mehr als einem Header WWW-Authenticate: NTLM das SSO scheitern lässt, laut Handbuch das erwartete Verhalten. Forms - Client Initiated enthält das raffinierteste Detail seines Designs: Das JavaScript, das APM einfügt, weist dem Passwortparameter ein Token statt des tatsächlichen Passworts zu, sodass die Zugangsdaten nie in der Seite stehen.

Der Hinweis zur Mechanik bei jeder Abfrage verbindet die Methoden mit dem Räderwerk dahinter: Agents der Zugriffsrichtlinie befüllen die Sitzungsvariablen, die SSO verwendet; die klassische Verdrahtung ist eine Logon Page, gefolgt von SSO Credential Mapping, die session.logon.last.* in session.sso.token.last.* überträgt.

Geben Sie den Namen einer Methode ein (Aliasse wie `ntlm`, `fbci` oder `kcd` funktionieren ebenfalls) oder `methods` für alle acht; oder wählen Sie die Schaltfläche der Methode unter dem Feld, die es für Sie ausfüllt.

Alles läuft lokal; nichts, was Sie eingeben, verlässt die Seite.

## Ergebnisse teilen

Oberhalb der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Methodennamen so, wie eingegeben, und sonst nichts. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Diese Seite nimmt überhaupt keine SSO-Konfiguration entgegen: Sie liest einen Namen aus ihrer Tabelle mit acht Methoden oder `methods` und lehnt alles andere ab. Ein Link wird nur für einen Namen angeboten, den sie liest, und ein eingehender Link wird nur dafür angenommen; daher kann weder ein SSO-Objekt noch eine Zugangsinformation in einem Link übertragen werden.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Text beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Der Text füllt das Feld wie beim Einfügen, und die Seite liest ihn; es wird nichts gesendet. Danach verschwindet der Wert sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
