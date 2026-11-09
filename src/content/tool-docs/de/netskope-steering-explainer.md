## Was das Tool tut

Beschreiben Sie die Lage (verwaltetes Gerät oder nicht, am Standort oder unterwegs, ob sich das Zertifikatspaket installieren lässt, ob die Richtlinie den Benutzer benennen muss), und das Tool sagt, welche Steering-Methode passt: der Endpoint-Client, ein IPsec- oder GRE-Tunnel, ein expliziter Proxy oder Proxy-Chaining von einem bereits vorhandenen Proxy aus. **Jede Methode nennt ihre Kosten, ob gewählt oder nicht**, denn ein Tool, das nur die Nachteile der verworfenen Optionen aufzählt, wäre Werbung für die gewählte.

## Die Wechselwirkung, vor der das Tool warnt

**Der Client erkennt andere Steering-Methoden und deaktiviert sich standardmäßig selbst, wenn er IPsec, GRE oder einen expliziten Proxy findet.** Beides zu betreiben, ist also nicht automatisch doppelt genäht: Es läuft auf eines von beiden hinaus, entschieden von einer Einstellung, die die meisten nie geöffnet haben.

Das Tool bietet auch die dritte Anordnung an: den Client parallel zum Tunnel bereitstellen, **nicht zum Steering**, sondern um Zertifikate zu verteilen und die Benutzeridentität zu liefern. Der Tunnel überträgt den Datenverkehr; der Client beantwortet, wer der Benutzer ist.

## Die harte Grenze, die das Tool nennt

**Ohne das Root- und das Intermediate-Zertifikat von Netskope auf dem Endpoint gibt es keine TLS-Inspektion und keine SAML-Authentifizierung.** Der Datenverkehr kommt an, und die Richtlinie arbeitet nur mit Metadaten. Eine Regel, die so geschrieben ist, als wäre der Inhalt sichtbar, sieht in der Konsole richtig aus und tut nicht, was die Person glaubt, die sie geschrieben hat.

## Der Unterschied zu „Steering-Entscheidung von Netskope erklärt“

Beide beantworten verschiedene Fragen, und beide gibt es auf dieser Website:

- **Dieses Tool beantwortet eine Designfrage**: Welcher Zugangsweg sollte für diese Lage bereitgestellt werden?
- **„Steering-Entscheidung von Netskope erklärt“ beantwortet eine Laufzeitfrage**: Was geschieht bei einer bereits vorhandenen Steering-Konfiguration mit *genau diesem Flow*: gesteuert, umgangen, blockiert oder direkt?

Wählen Sie hier die Methode; verfolgen Sie dort den Flow.

## Was das Tool nicht tut

Es kennt weder Ihre Lizenzen noch Ihren Tenant noch Ihre bestehende Konfiguration. DNS-Steering etwa erfordert bestimmte Lizenzen und gilt nur für bestimmte Konfigurationstypen, was das Tool nicht für Sie prüfen kann.

## Ergebnisse teilen

Unter der Überschrift der Methoden erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die sieben Antworten, jede immer als 1 oder 0, damit ein Link seine Bedeutung behält, wenn sich ein Standardwert ändert. Die Antworten beschreiben eine Lage und nennen weder ein System noch eine Person. Die Seite zeigt schon beim Öffnen Methoden an, daher steht die Schaltfläche sofort bereit. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Kontrollkästchen werden aktiviert, als hätten Sie sie angeklickt, und die Methoden folgen. Ein Link, dem eine Antwort fehlt, wird ignoriert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
