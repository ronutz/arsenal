# Steering-Entscheidung von Netskope erklärt

Fügen Sie eine kompakte Beschreibung einer Steering-Konfiguration und eines Flows ein und gehen Sie die dokumentierte Entscheidungsreihenfolge bis zur Bewertung durch: **gesteuert**, **umgangen**, **blockiert** oder **direkt**, mit einem Entscheidungsprotokoll, das jede Prüfung unterwegs erklärt. Das Tool erklärt das Warum, es ist kein Simulator: Jeder Schritt im Protokoll beruft sich auf dokumentiertes Verhalten, und wo die öffentliche Dokumentation keine Regel veröffentlicht, sagt das Protokoll das, statt eine zu erfinden.

## Die Grammatik

Zeilen mit Schlüssel und Wert, eine Entscheidungsgröße pro Zeile:

```
mode: web                     # cloud-apps | web | all
dynamic: on                   # optional; then mode-on-prem / mode-off-prem (none allowed)
location: off-prem            # on-prem | off-prem
tunnel: up                    # up | down
fail-close: off               # on | off
flow: web app.example.com     # web <host> | app <name> | non-web <proto/port> | rfc1918 <ip> | loopback
non-standard-port: ip         # optional; fqdn | ip - how a non-standard web port is reached
exception: domain *.example.com          # 0+ lines; kinds: cert-pinned, domain, category, dest-location, firewall-app
flow-matches: domain          # which configured exception kinds this flow matches (or none)
```

Die Zeile `flow-matches` ist bewusste Ehrlichkeit: Ob ein echter Flow eine Kategorie oder ein Objekt für den Zielstandort trifft, hängt von Tenant-Daten ab, die dieses lokale Tool nicht sehen kann; Sie geben den Treffer also selbst an, und die Engine erklärt die dokumentierte Folge.

## Was das Entscheidungsprotokoll weiß

Die drei Traffic Modes und für wen jeder gedacht ist (Cloud Apps Only für Cloud Inline bzw. nur CASB, Web Traffic für die meisten Organisationen, All Traffic für Abonnenten von Cloud Firewall). Der immer aktive Standard-Bypass für den Adressraum nach RFC1918. Die Ausnahmefamilien und ihr dokumentiertes Verhalten, darunter die Opt-in-Option pro Profil **Steer and decrypt at Netskope Cloud** für die Familie Certificate Pinning, der einzige Treffer, der steuert, statt zu umgehen. Die Modi pro Standort beim dynamischen Steering, einschließlich **None**: kein Tunnel, und Ausnahmen werden nicht verarbeitet. Die dokumentierte Zweiteilung bei **Fail Close**: Ausnahmen nach Domain, IP und Certificate Pinning werden weiterhin angewendet, kategoriebasierte Ausnahmen dagegen blockiert. Und die Falle bei Ports außerhalb des Standards: Ein mit FQDN konfigurierter Port, der per IP-Adresse angesprochen wird, gilt als Nicht-Web-Datenverkehr; die dokumentierte Abhilfe ist, beides zu konfigurieren.

## Wo das Tool übergibt

Mit der Bewertung **gesteuert** beginnt die nächste Entscheidung: Ob die Sitzung entschlüsselt wird, ist Sache der TLS-Richtlinie, und genau dort setzt [der Artikel zur Inline-TLS-Entschlüsselung](/learn/netskope-inline-tls-decryption) an. Die Steering-Landschaft selbst (Client, expliziter Proxy und PAC, Tunnel, Reverse-Proxy) beschreibt [der Artikel zu den Steering-Methoden](/learn/netskope-steering-methods); für die PAC-Schicht gibt es [ein eigenes Tool](/tools/pac-file-explainer).

## Ergebnisse teilen

Unter der Bewertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen und sobald die Seite eine Entscheidung hat. Der Link enthält nach dem `#` die Spezifikation so, wie eingegeben. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Ein Flow und seine Ausnahmen nennen Hosts, Apps und Domains, und die Seite von Netskope zum [Steering-Profil](https://docs.netskope.com/en/configure-a-steering-profile) (abgerufen am 01.11.2026) sieht Ausnahmen für Datenverkehr mit „personal or private content“ vor: Das Popover bittet Sie, sie zu prüfen. Das Entscheidungsprotokoll wertet jede Zeile aus, daher wird nichts herausgeschnitten. Bevor ein Link angeboten wird, wird die Spezifikation nach Zugangsdaten durchsucht, die ein Standard definiert: ein privater Schlüssel im PEM-Format, eine `Authorization`- oder `Proxy-Authorization`-Zeile mit beliebigem Schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitte 11.6.2 und 11.7.2: Der Wert „consists of credentials“), eine `Cookie`- oder `Set-Cookie`-Zeile mit einem Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitt 8.4: Server „commonly store a nonce (or "session identifier") in a cookie“), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1), eine AWS-Zugriffsschlüssel-ID oder ein `ENC`-Wert von FortiOS; alle abgerufen am 01.11.2026. Enthält die Spezifikation einen davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie ersetzen den Wert durch einen Platzhalter und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur wie ein Secret aussieht (ein JSON-Eintrag `token`, ein `token=` in einer Query), blockiert den Link nicht; das Popover nennt den ersten, damit Sie ihn prüfen können.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Spezifikation füllt das Feld wie beim Einfügen, und die Seite erklärt sie. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Quellen

- [Netskope-Dokumentation: Configure a Steering Profile](https://docs.netskope.com/en/configure-a-steering-profile) (Modi, Standard-Bypasses; abgerufen am 09.11.2026)
- [Netskope-Dokumentation: Creating a Steering Configuration](https://docs.netskope.com/en/creating-a-steering-configuration) (Fail Close, Ports außerhalb des Standards; abgerufen am 09.11.2026)
- [Netskope-Dokumentation: Enabling Dynamic Steering](https://docs.netskope.com/en/enabling-dynamic-steering) (Modi pro Standort, Bedeutung von None; abgerufen am 09.11.2026)
- [Netskope-Dokumentation: Certificate Pinned Applications](https://docs.netskope.com/en/certificate-pinned-applications) (Steer and decrypt; abgerufen am 09.11.2026)
