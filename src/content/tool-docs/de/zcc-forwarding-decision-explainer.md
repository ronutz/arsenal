# Weiterleitungsentscheidung von ZCC erklärt

Fügen Sie eine Konfiguration des Zscaler Client Connector ein (den erkannten Netzwerkzustand, die ZIA-Weiterleitungsaktion, die Z-Tunnel-Version und optional die ZPA-Aktion) und lesen Sie das dokumentierte Entscheidungsgerüst Schicht für Schicht, genau so, wie die Referenzarchitektur und das Hilfeportal des Herstellers es beschreiben.

## Warum eine Erklärung und kein Simulator

Dieses Tool existiert in der Form, die seine Ratifizierungsklausel festgelegt hat, und der Grund steht hier vor allem anderen. Der Prüfdurchgang (21.07.2026, anhand der Referenzarchitektur Secure Mobile Access with Zscaler Client Connector und von help.zscaler.com) ergab, dass das **Gerüst** der Entscheidung durchgehend öffentlich dokumentiert ist: wie der Zustand des vertrauenswürdigen Netzwerks ermittelt wird, was jede der vier Aktionen von ZIA pro Zustand bewirkt, was jede Z-Tunnel-Version erfasst, das automatische Failover von Z-Tunnel 2.0 auf 1.0, der hybride Web-Split und die zwei Aktionen von ZPA. Dieses Gerüst ist deterministisch, und dieses Tool berechnet es.

**Nicht** veröffentlicht ist eine einheitliche Rangfolge für die Bypass-Schicht. Jeder Mechanismus ist für sich dokumentiert (Application Bypass, Destination- und Domain-Exclusions und -Inclusions, VPN Gateway Bypass (VPN: Virtual Private Network), die PAC des App-Profils, die PAC des Forwarding-Profils mit ihrem Bypass-Makro für Z-Tunnel 2.0), aber wenn mehrere davon denselben Flow betreffen, veröffentlicht Zscaler Rezepte, keine Matrix zur Auflösung von Konflikten. Ein Simulator müsste diese Matrix erfinden. Dieses Tool verzichtet darauf: Es stellt jeden dokumentierten Mechanismus in einer erklärenden Übersicht dar und entscheidet nichts. Es gilt dieselbe Regel wie für die übrigen Tools der Website: nichts erfinden.

## Eingabegrammatik

Eine Einstellung pro Zeile, `key = value`. Zeilen, die mit `#` beginnen, sind Kommentare.

- `network`: trusted | vpn | off-trusted (erforderlich)
- `zia-action`: tunnel | twlp | enforce-proxy | none (erforderlich)
- `tunnel`: zt2 | zt1 (nur bei den Tunnel-Aktionen)
- `web-split`: on | off (der dokumentierte Hybridmodus von Z-Tunnel 2.0)
- `zpa-action`: tunnel | none (optional)

## Was Sie erhalten

Das Gerüst erscheint als Karten in Schichten: der Netzwerkzustand mit den dokumentierten Erkennungskriterien (DNS Server und Search Domains als die statischsten empfohlen, Abgleich mit ANY oder ALL, die Exklusivität von Pre-Defined Trusted Networks und die dokumentierte Fehlerart bei dynamischer Auflösung); die dokumentierte Bedeutung der ZIA-Aktion; die Semantik des Z-Tunnels für Ihre Wahl, also der reine Web-Proxy-Tunnel von Z-Tunnel 1.0 über 80/443 gegenüber der Erfassung aller Ports per DTLS/TLS bei Z-Tunnel 2.0, mit dem automatischen Failover und, falls aktiviert, dem hybriden Web-Split; und die bewusst kleinere Entscheidung der ZPA-Schicht zwischen zwei Aktionen. Unter dem Gerüst stehen die Bypass-Übersicht und die grundsätzlichen Hinweise, darunter die eigene Empfehlungstabelle der Referenzarchitektur (Trusted = None, VPN = Tunnel with Local Proxy, Off-Trusted = Tunnel, Z-Tunnel 2.0) und die Fail-Open- und Fail-Close-Regeln.

Alles läuft lokal in Ihrem Browser; nichts, was Sie einfügen, verlässt die Seite.

## Ergebnisse teilen

Am Anfang der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Einstellungen so, wie eingefügt. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Jede Einstellung ist eine von wenigen dokumentierten Auswahlmöglichkeiten, ohne Adresse, Host, Benutzer oder Schlüssel, daher ergänzt das Popover keinen eigenen Warnhinweis. Bevor ein Link angeboten wird, wird das Feld auf Zugangsdaten geprüft, die ein Standard definiert: ein privater Schlüssel im PEM-Format ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), Abschnitt 10), eine `Authorization`-Zeile ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2), eine `Cookie`-Zeile mit einem Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitt 4.2.1), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1), eine AWS-Zugriffsschlüssel-ID oder ein `ENC`-Wert von FortiOS; alle abgerufen am 01.11.2026. Die Grammatik hat für keinen davon einen Platz, aber eine Kommentarzeile ist Freitext. Enthält das Feld einen davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie ersetzen den Wert durch einen Platzhalter und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur wie ein Secret aussieht, verhindert den Link nicht; das Popover nennt den ersten.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Das Feld füllt sich wie beim Einfügen, und die Seite geht das Gerüst durch. Es wird nichts kontaktiert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Quellen

- [Zscaler Reference Architecture: Secure Mobile Access with Zscaler Client Connector](https://www.zscaler.com/resources/reference-architectures/secure-mobile-access-with-zcc.pdf) (Zustände, Aktionen, Kriterien, Tunnelsemantik, Failover und Empfehlungstabelle; abgerufen am 09.11.2026)
- [Zscaler Help: About Z-Tunnel 1.0 & Z-Tunnel 2.0](https://help.zscaler.com/zscaler-client-connector/about-z-tunnel-1.0-z-tunnel-2.0) (abgerufen am 09.11.2026)
- [Zscaler Help: Best Practices for Adding Bypasses for Z-Tunnel 2.0](https://help.zscaler.com/zscaler-client-connector/best-practices-adding-bypasses-z-tunnel-2.0) (die Aufgabenteilung zwischen den beiden PAC-Dateien; abgerufen am 09.11.2026)
- [Zscaler Help: Configuring Forwarding Profiles for Zscaler Client Connector](https://help.zscaler.com/zscaler-client-connector/configuring-forwarding-profiles-zscaler-client-connector) (abgerufen am 09.11.2026)

Die Fragment-Regel hinter „Ergebnisse teilen“ steht in [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.5 (abgerufen am 01.11.2026), und die Zugangsdaten, nach denen die Prüfung sucht, sind in RFC 7468, RFC 9110, RFC 6265 und RFC 7519 definiert (am selben Tag abgerufen).
