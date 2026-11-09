## Was das Tool tut

Geben Sie eine TLS-Cipher-Suite ein, ob als IANA-Namen, als Namen in OpenSSL oder GnuTLS oder als hexadezimalen Codepunkt, und das Tool zerlegt sie in ihre Bestandteile (Schlüsselaustausch, Authentifizierung, Verschlüsselungsverfahren mit Modus und MAC) und liefert eine Sicherheitsbewertung in verständlicher Sprache, zusammen mit dem offiziellen Empfehlungsstatus der Suite bei der IANA. Es läuft in Ihrem Browser mit einer mitgelieferten Kopie der IANA-Registry.

## Den Namen einer Cipher-Suite lesen

Eine Cipher-Suite ist ein benanntes Bündel der Algorithmen, die eine TLS-Verbindung verwenden wird, und der Name ist strukturiert. In TLS 1.2 und älter lässt sich ein Name wie `TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256` in seine Teile zerlegen: `ECDHE` ist das Verfahren für den Schlüsselaustausch, `RSA` die Art, wie der Server authentifiziert wird, `AES_128_GCM` das Verschlüsselungsverfahren mit Schlüssellänge und Modus und `SHA256` der Hash für MAC und PRF. TLS 1.3 hat das geändert: Eine Suite für 1.3 wie `TLS_AES_128_GCM_SHA256` nennt nur das symmetrische Verfahren und den Hash, weil der Schlüsselaustausch immer ephemer ist und separat ausgehandelt wird. Das Tool zerlegt beide Formen in ihre Komponenten.

## Namen, Codepunkte und die Registry

Dieselbe Suite hat in verschiedenen Tools verschiedene Namen, darunter liegt bei allen ein numerischer Codepunkt. Die maßgebliche Quelle ist die Registry TLS Cipher Suites der IANA, die jedem Codepunkt aus zwei Bytes seinen Namen zuordnet und das Flag **Recommended** führt (Y, N oder D für discouraged, also abgeraten, nach RFC 8447). Das Tool führt jede Eingabe, ob IANA-Name, Name in OpenSSL oder GnuTLS oder roher hexadezimaler Codepunkt, auf diesen Eintrag der Registry zurück, sodass Sie zwischen der Schreibweise, die ein Tool zeigt, und der, die ein anderes erwartet, wechseln können.

## Die Sicherheitsbewertung

Kennt das Tool die Bestandteile, kann es die Suite beurteilen, und es kennzeichnet bekannt unsichere und schwache Suiten auf Grundlage von Standards statt nach Meinung: RC4-Suiten sind unsicher (RFC 7465), 3DES-Suiten sind wegen des Sweet32-Angriffs schwach (RFC 8429), und die Einträge, die die Registry selbst als nicht empfohlen führt, fließen ein. Außerdem erkennt es moderne Wahlen, darunter die Modi für authentifizierte Verschlüsselung (GCM und ChaCha20-Poly1305) und die Post-Quanten-Hybridgruppen für den Schlüsselaustausch auf Basis von ML-KEM (NIST FIPS 203).

## Verwendung

Geben Sie eine Cipher-Suite in einer beliebigen gängigen Form ein und lesen Sie den dekodierten Schlüsselaustausch, die Authentifizierung, das Verschlüsselungsverfahren, den Modus und den MAC, den Empfehlungsstatus bei der IANA und die Sicherheitsbewertung ab. Die Dekodierung ist deterministisch und läuft vollständig lokal.

Welche Suite ein laufender Server gewählt hat, steht in der Zeile `Cipher is` der Ausgabe von `openssl s_client`; [openssl s_client erklärt](/tools/openssl-s-client-explainer) liest diese Zeile mit allem, was sie umgibt, einschließlich der Falle, dass die Version darin die des Verschlüsselungsverfahrens selbst ist und nicht immer die ausgehandelte Version.

## Ergebnisse teilen

Unter den Bewertungsplaketten erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Cipher-Suite so, wie eingegeben: `/tools/cipher#input=TLS_CHACHA20_POLY1305_SHA256`. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Name beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Öffnen eines Links.** Der Link hat die Form `#input=`, die diese Seite bereits liest, daher funktioniert das Öffnen genau wie bei solchen Links schon immer: Der Wert füllt das Feld und wird dekodiert, und er bleibt in der Adresse, bis Sie das Feld ändern oder leeren.
