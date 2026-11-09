## Was das Tool tut

Wählen Sie den Profilstapel eines virtuellen Servers vom Typ Standard (Full Proxy) auf BIG-IP, also ob er ein Client-SSL-Profil, ein HTTP-Profil, ein Server-SSL-Profil und einen Pool hat, und das Tool zeigt die Reihenfolge, in der die gängigen iRule-Ereignisse ausgelöst werden, von `CLIENT_ACCEPTED` bis `CLIENT_CLOSED`, als Zeitleiste und als Liste. Es ist ein Modell des dokumentierten Verhaltens von F5, berechnet in Ihrem Browser; es verbindet sich nie mit einem Gerät.

## Warum die Reihenfolge vom Stapel abhängt

Eine iRule ist ereignisgesteuert: Ihr Tcl-Code läuft, wenn ein benanntes Ereignis ausgelöst wird, und welche Ereignisse in welcher Reihenfolge ausgelöst werden, entscheidet die Konfiguration des virtuellen Servers, nicht das Skript. Ein virtueller Server als Full Proxy verarbeitet Client- und Serverseite als zwei getrennte Verbindungen, daher durchlaufen die Ereignisse getrennte Phasen: Die Client-Verbindung wird angenommen, der clientseitige TLS-Handshake wird abgeschlossen, die HTTP-Anfrage wird geparst, ein Pool-Member wird ausgewählt, die serverseitige Verbindung wird geöffnet, der serverseitige TLS-Handshake wird abgeschlossen, die Anfrage wird gesendet, die Antwort kommt zurück, und schließlich werden beide Seiten geschlossen. Ändern Sie den Stapel, ändert sich die Menge der Ereignisse mit.

## Was jedes Profil hinzufügt

- **Keine Profile außer einem Pool:** Übrig bleiben die Ereignisse auf Verbindungsebene, `CLIENT_ACCEPTED` am Anfang, die Ereignisse der Lastverteilung, wenn ein Member gewählt wird, `SERVER_CONNECTED` auf der Serverseite und die `CLOSED`-Ereignisse am Ende.
- **Ein Client-SSL-Profil** fügt die clientseitigen TLS-Ereignisse hinzu, etwa `CLIENTSSL_CLIENTHELLO` und `CLIENTSSL_HANDSHAKE`, bevor die Anfrage verarbeitet wird.
- **Ein HTTP-Profil** fügt die Anfrage- und Antwortereignisse hinzu, `HTTP_REQUEST` auf der Clientseite sowie `HTTP_REQUEST_SEND` und `HTTP_RESPONSE` auf der Serverseite, sodass Sie auf Header und Nutzdaten reagieren können.
- **Ein Server-SSL-Profil** fügt die serverseitigen TLS-Ereignisse für die Verbindung zum Pool-Member hinzu.
- **Ein JSON- oder SSE-Profil** liegt außerhalb dieses Modells. Mit BIG-IP 21.0.0 kamen die JSON-Ereignisse ([`JSON_REQUEST`](https://clouddocs.f5.com/api/irules/JSON_REQUEST.html), `JSON_RESPONSE` samt ihren Varianten error und missing) und [`SSE_RESPONSE`](https://clouddocs.f5.com/api/irules/SSE_RESPONSE.html) hinzu, und sie brauchen auf dem virtuellen Server ein JSON- oder SSE-Profil zusätzlich zum HTTP-Profil ([BIG-IP 21.0 profiles reference](https://techdocs.f5.com/en-us/bigip-21-0-0/big-ip-local-traffic-management-profiles-reference/model-context-protocol.html), abgerufen am 26.10.2026). Das Tool nennt sie in seinen Hinweisen, statt sie in die Abfolge einzuordnen.

Das Tool ordnet außerdem die bedingten Ereignisse, die Pfade der Datensammlung und den Fehlerpfad der Lastverteilung (`LB_FAILED`) an der Stelle der Abfolge ein, an die sie gehören.

## Ein Hinweis zu mehreren iRules

Behandeln zwei iRules dasselbe Ereignis, ist die Reihenfolge zwischen ihnen nicht die Reihenfolge, in der sie aufgelistet sind; sie wird innerhalb jedes Ereignisses über den Befehl `priority` gesteuert (F5 K12090273), wobei eine Standardpriorität gilt, wenn keine gesetzt ist. Das ist eine andere Achse als die ereignisübergreifende Reihenfolge, die das Tool darstellt.

## Verwendung

Schalten Sie die Profile Ihres virtuellen Servers ein oder aus und lesen Sie die entstehende Ereignisfolge als Zeitleiste und als Liste. Sie gibt das dokumentierte Ereignismodell von F5 wieder (die Master List of iRule Events und die Referenzen der einzelnen Ereignisse); sie ist also eine Hilfe für Planung und Lernen, kein Mitschnitt von einem laufenden System.

## Ergebnisse teilen

Über der Ereignisfolge erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält die fünf Profilschalter mit ihren Namen, jeden als `1` oder `0` (`#clientssl=1&http=1&serverssl=1&pool=1&fastl4=0`), und sonst nichts; eine Abfolge gibt es immer, daher erhält auch ein Stapel mit lauter ausgeschalteten Schaltern einen Link. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; fünf Schalter sind weit kürzer.
- **Öffnen eines Links.** Die Schalter übernehmen die Werte des Links (ein Schalter, den der Link nicht enthält, ist aus), und die Abfolge wird gezeichnet, als hätten Sie die Schalter angeklickt. Ein anderer Wert als `1` oder `0` führt dazu, dass der ganze Link ignoriert wird. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.
