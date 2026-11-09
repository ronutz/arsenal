# SSL-Bypass-Planer für ZIA

## Was das Tool tut

Fügen Sie eine Liste von Anwendungen oder Zielen ein (eine pro Zeile, in einer Grammatik mit vier Feldern) und erhalten Sie einen deterministischen Plan für die TLS-Inspektion. Jedes Asset erhält eine von drei Bewertungen: **Inspect** (der Standard, der jede Content-Engine versorgt), **Do Not Inspect über eine Richtlinienregel** (die Ausnahme an der Edge für Governance-Kategorien und für Anwendungen mit Pinning auf Pfaden, die kein Agent steuert) oder **Bypass im Client Connector** (die sauberste Ausnahme für Anwendungen mit Pinning, wenn ZCC den Pfad steuert: Der Datenverkehr gelangt nie in den Tunnel, ergänzt um eine Richtlinienregel als Defense in Depth). Jede Bewertung enthält ihre belegte Begründung, jeder Bypass eine Übersicht der blinden Flecken, die nennt, was diesen Flow nicht mehr sieht, und sobald etwas ungeprüft bleibt, hängt der Plan die Checkliste der äußeren Auffangmaßnahmen an: die Aktion für Untrusted Server Certificates, OCSP (Online Certificate Status Protocol) über Stapling, Minimum TLS Version als Untergrenze und Block No-SNI.

## Die Grammatik

Ein Asset pro Zeile, vier durch senkrechte Striche getrennte Felder; Zeilen, die mit `#` beginnen, sind Kommentare:

```
<name> | pinned|clean | regulated|general | agent|no-agent
```

`pinned` kennzeichnet eine Anwendung mit Certificate Pinning (sie akzeptiert kein unter der Inspektions-CA neu erzeugtes Zertifikat und verweigert bei Interception die Verbindung). `regulated` kennzeichnet eine Governance-Kategorie, die nach Richtlinie oder Gesetz versiegelt bleiben muss. `agent` kennzeichnet einen Pfad, den der Zscaler Client Connector steuert.

## Den Plan lesen

Die Zusammenfassung zählt die Bewertungen; die Karten gehen die Begründung für jedes Asset durch; der Hinweis zur Reihenfolge enthält den Grundsatz, dass Ausnahmen mit Do Not Inspect weit oben in die Reihenfolge gehören, über den Inspect-Block, weil die Regeln der SSL-Richtlinie in aufsteigender Reihenfolge nach dem ersten Treffer ausgewertet werden. Wird jedes Asset geprüft, gibt es keine Bypass-Übersicht und keine offenen Auffangmaßnahmen, und der Plan nennt das ausdrücklich. Jede Richtlinienausnahme, die der Planer empfiehlt, ist eine Do-Not-Inspect-Regel, gesetzt auf **Evaluate Other Policies**, denn diese Form lässt die äußeren Auffangmaßnahmen und die Web-Richtlinien in Kraft; ein Hinweis im Plan erklärt, dass **Bypass Other Policies** keine Auffangmaßnahmen bietet und auch URL Filtering und Cloud App Control überspringt und dass Datenverkehr, der im Client Connector umgangen wird, die Edge gar nicht erst erreicht.

## Ehrlichkeit

Die Grammatik ist eine bewusst gewählte Teilmenge zum Lernen: Eine echte Bypass-Planung grenzt Regeln zusätzlich nach Benutzern, Gruppen und Standorten ein und wägt Besonderheiten von Anwendungen ab, die dieser Planer nicht modelliert. Die Entscheidungslogik ist der dauerhafte Teil: Pinning erzwingt eine Ausnahme, Governance versiegelt eine Kategorie, alles andere wird geprüft, und jeder Bypass ist ein blinder Fleck mit einem Preis. Alle Berechnungen laufen lokal; Asset-Namen verlassen die Seite nie.

## Ergebnisse teilen

Unter den Zählern der Zusammenfassung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Assets so, wie eingefügt. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Asset-Namen können Ihre internen Anwendungen erkennbar machen (deshalb ergänzt das Popover einen Warnhinweis). Bevor ein Link angeboten wird, wird das Feld auf Zugangsdaten geprüft, die ein Standard definiert: ein privater Schlüssel im PEM-Format ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), Abschnitt 10), eine `Authorization`-Zeile ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2), eine `Cookie`-Zeile mit einem Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitt 4.2.1), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1), eine AWS-Zugriffsschlüssel-ID oder ein `ENC`-Wert von FortiOS; alle abgerufen am 01.11.2026. Die Grammatik hat für keinen davon einen Platz, aber Asset-Namen und Kommentarzeilen sind Freitext. Enthält das Feld einen davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie ersetzen den Wert durch einen Platzhalter und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur wie ein Secret aussieht, verhindert den Link nicht; das Popover nennt den ersten.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Das Feld füllt sich wie beim Einfügen, und die Seite plant die Inspektion. Es wird nichts kontaktiert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Quellen

Gestützt auf die Dokumentation von Zscaler zu SSL Inspection (Configuring the SSL/TLS Inspection Policy; About SSL Inspection) und auf die Referenzarchitektur Data Protection, Abrufdatum 21.07.2026. Die zwei Formen von Do Not Inspect und die Einstellungen, die jede bietet, wurden auf [Configuring SSL/TLS Inspection Policy](https://help.zscaler.com/zia/configuring-ssltls-inspection-policy) erneut nachgelesen (abgerufen am 26.10.2026). Der zugehörige Artikel unter „Lernen“ ist [*TLS Inspection in ZIA: The Policy, the Bypasses, and the Bill*](/learn/zia-ssl-inspection-policy-and-bypasses).

Die Fragment-Regel hinter „Ergebnisse teilen“ steht in [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.5 (abgerufen am 01.11.2026), und die Zugangsdaten, nach denen die Prüfung sucht, sind in RFC 7468, RFC 9110, RFC 6265 und RFC 7519 definiert (am selben Tag abgerufen).
