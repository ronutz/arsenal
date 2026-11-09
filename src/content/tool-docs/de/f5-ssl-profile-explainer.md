## Was das Tool tut

Fügen Sie ein tmsh-Profil `client-ssl` oder `server-ssl` ein, und das Tool erklärt es: die Rolle des Profils, die Matrix der TLS-Protokollversionen, die es aktiviert und deaktiviert, und eine Sicherheitsbewertung zu Zertifikatskette, Neuaushandlung, SNI, OCSP-Stapling (Online Certificate Status Protocol) und Mutual TLS. Das Tool parst das Profil vollständig in Ihrem Browser und kontaktiert nie ein Gerät.

## Clientseitige und serverseitige Profile

Auf einem BIG-IP wird SSL von zwei Arten von Profilen behandelt, und das Erste, was das Tool Ihnen sagt, ist, um welche es sich handelt. Ein **client-ssl**-Profil terminiert TLS, das vom Client kommt: Das BIG-IP legt ein Zertifikat vor und entschlüsselt den Datenverkehr. Ein **server-ssl**-Profil tut das Gegenteil: Es baut TLS zum Pool-Member auf und verschlüsselt auf dem Weg nach draußen neu. Ein TLS-Deployment als Full Proxy verwendet beide, entschlüsselt vom Client, um den Datenverkehr zu prüfen oder zu steuern, und verschlüsselt dann zum Server neu. Wer die Rolle kennt, kann alles andere im Profil einordnen.

## Die Protokollmatrix

Welche TLS-Versionen ein Profil zulässt, legt sein Feld `options` fest, das bestimmte Versionen aktiviert oder deaktiviert. Das Tool stellt das als übersichtliche Matrix dar, sodass Sie auf einen Blick sehen, ob zum Beispiel TLS 1.0 und 1.1, die RFC 8996 für veraltet erklärt, noch aktiviert sind oder ob TLS 1.3 eingeschaltet ist. Das ist bei einem SSL-Profil oft der wichtigste Einzelpunkt, und in der rohen Bitmaske von `options` lässt er sich leicht falsch lesen.

## Die Sicherheitsbewertung

Über die Protokolle hinaus bewertet das Tool die Teile des Profils, die entscheiden, wie sicher das TLS tatsächlich ist:

- **Zertifikat, Schlüssel und Kette**, einschließlich der Frage, ob die Kette vollständig ist;
- **Neuaushandlung** und ob sichere Neuaushandlung (RFC 5746) verlangt wird;
- **SNI** (RFC 6066), um das richtige Zertifikat auszuliefern, wenn sich mehrere Namen das Profil teilen;
- **OCSP-Stapling** (die Erweiterung `status_request`, RFC 6066), mit dem der Server seinen eigenen Nachweis zum Sperrstatus mitliefert; und
- **Prüfung des Peer-Zertifikats**, über die Mutual TLS konfiguriert wird, bei dem das BIG-IP ein Client-Zertifikat verlangt und prüft.

Jeder Punkt wird bewertet, sodass riskante Einstellungen sich von soliden abheben.

## Verwendung

Fügen Sie einen Profilblock `client-ssl` oder `server-ssl` ein und lesen Sie seine Rolle, seine Protokollmatrix und die Sicherheitsbewertung von Kette, Neuaushandlung, SNI, OCSP und Mutual-TLS-Einstellungen. Die Analyse ist deterministisch und lokal.

Um zu prüfen, was ein Client mit einem virtuellen Server, der das Profil verwendet, tatsächlich aushandelt, führen Sie `openssl s_client` gegen den virtuellen Server aus und fügen die Ausgabe in [openssl s_client erklärt](/tools/openssl-s-client-explainer) ein; den Cipher-String des Profils liest [F5-Cipher-Strings erklärt](/tools/f5-cipher-string-expander).

## Ergebnisse teilen

Unter dem Kopf des Profils erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Profil, wobei der Wert jeder Einstellung `passphrase` und `proxy-ca-passphrase` durch `[redacted]` ersetzt ist, nie so, wie eingefügt; die Referenzen von F5 zu [client-ssl](https://clouddocs.f5.com/api/icontrol-rest/APIRef_tm_ltm_profile_client-ssl.html) und [server-ssl](https://clouddocs.f5.com/api/icontrol-rest/APIRef_tm_ltm_profile_server-ssl.html) (abgerufen am 27.10.2026) nennen sie die Passphrase des Schlüssels und die Passphrase des CA-Schlüssels für SSL Forward Proxy. Das Popover nennt zuerst, was der Link enthält und wie viele Werte ersetzt wurden, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Auch diese Seite zeigt diese Werte nie an, daher liest die empfangende Seite dasselbe Profil. `passphrase none` bleibt erhalten, ebenso Namen, Partitionen, Dateiobjekte und Hostnamen. Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird die Kopie beim Öffnen des Links nicht an den Server gesendet. Sie bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Kopie füllt das Feld wie beim Einfügen, und die Seite erklärt sie. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
