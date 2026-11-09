## Was das Tool tut

Geben Sie ein Ziel und eine Reihe von Routen an, und das Tool führt die Auswahl so durch, wie FortiOS es täte: welche Routen installiert werden, welche der Datenverkehr tatsächlich nimmt und welche Floating-Backups sind. Es läuft vollständig in Ihrem Browser.

## Die Unterscheidung, um die es dem Tool geht

Administrative Distanz und Priorität werden routinemäßig als dieselbe Idee behandelt. Das sind sie nicht, und sie wirken zu verschiedenen Zeitpunkten.

**Die Distanz entscheidet, welche Route INSTALLIERT wird.** Routen zum selben Ziel konkurrieren, die niedrigste Distanz gewinnt, und die unterlegene Route **fehlt** in der Weiterleitungstabelle: nicht niedriger eingestuft, kein Fallback, der unter Last genutzt wird, sondern einfach nicht vorhanden. Deshalb stellt sich „Meine Route funktioniert nicht“ so oft als „Meine Route wurde nie installiert“ heraus, und deshalb ist eine konfigurierte Route in `get router info routing-table all` nicht zu finden.

**Die Priorität entscheidet, welche von mehreren BEREITS INSTALLIERTEN Routen bevorzugt wird.** Sie gilt nur für Routen, die den Vergleich der Distanz überstanden haben. Eine Priorität von 0 kann keine Route retten, die bei der Distanz verloren hat, und ein Referenzvektor (Golden Vector) legt genau diesen Fall fest.

## Was daraus folgt

| Konfiguration | Ergebnis |
|---|---|
| Gleiches Präfix, gleiche Distanz | Beide werden installiert; die Priorität entscheidet |
| Gleiches Präfix, andere Distanz | Eine wird installiert; die andere ist ein Floating-Backup |
| Gleiches Präfix, gleiche Distanz, gleiche Priorität | Per ECMP auf beide verteilt |

Mit einem Floating-Backup baut man eine Standardroute für den Standby-Fall: gleiches Präfix, höhere Distanz. Sie erscheint nur in der Tabelle, wenn die primäre Route zurückgezogen wird; genau das leistet **Link Health Monitoring**, und deshalb bleibt eine statische Route ohne diese Funktion in der Tabelle, auch wenn der Pfad hinter der Schnittstelle unterbrochen ist.

Das Tool modelliert eine inaktive Route, damit Sie sehen, wie das Backup übernimmt.

## Die Weiterleitung nimmt den längsten Treffer

Unter den **installierten** Routen gewinnt das spezifischste Präfix, unabhängig von Distanz oder Priorität. Ein /16 schlägt für eine Adresse darin eine Standardroute, selbst wenn die Standardroute bessere Werte hat, denn bei der Weiterleitung wird zuerst die Spezifität verglichen.

Deshalb funktioniert auch Prefix-Hijacking, und deshalb lohnt es sich, diese Reihenfolge über ein einzelnes Gerät hinaus im Kopf zu behalten.

## Was das Tool nicht modelliert

Nur die Routingtabelle. Zwei Dinge werden **vor** ihr herangezogen und setzen sie außer Kraft:

- Eine **Policy-Route**, die neben dem Ziel auch Quelle, Protokoll und Port abgleicht. Eine vergessene Policy-Route ist die klassische Ursache für Datenverkehr, der eine offensichtlich korrekte statische Route ignoriert; sagt die Tabelle also das eine und tut der Datenverkehr das andere, schauen Sie zuerst dort nach.
- Eine **SD-WAN-Regel** (Software-defined Wide Area Network), die ein Mitglied nach gemessener Leistung auswählt, bevor die Tabelle erreicht wird.

Das Tool kennt nur IPv4 und prüft nicht, ob ein Gateway tatsächlich erreichbar ist; es nimmt die Routen so, wie sie angegeben sind.

## Ergebnisse teilen

Unter der ausgewählten Route erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Ziel und die Routen so, wie eingefügt. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Routen nennen, wie eine Routingtabelle, Ihre internen Präfixe, Next Hops und Schnittstellen (deshalb ergänzt das Popover einen Warnhinweis). Bevor ein Link angeboten wird, wird das Feld nach Zugangsdaten durchsucht, die FortiOS oder ein Standard definiert: eine `set`-Zeile einer Einstellung, die in der [CLI-Referenz von FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) einen Passworttyp hat (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` und die übrigen; abgerufen am 01.11.2026), oder der `name` einer SNMP-Community ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), Abschnitt 3.2.5), jeder `ENC`-Wert (das Advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) von Fortinet, abgerufen am 01.11.2026, hält zu solchen Daten, die dort veröffentlicht werden, wo andere sie lesen können, fest: „should currently be considered "easy to decrypt"“), ein Paar `psksecret=` oder `password=` mit denselben Namen auf einer Direktivenzeile, ein privater Schlüssel im PEM-Format ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), eine Zeile `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2), ein Passwort in einer URL oder eine AWS-Zugriffsschlüssel-ID. Findet sich eines davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie setzen einen Platzhalter an seine Stelle und wählen die Schaltfläche erneut; so teilen Sie genau das, was Sie gewählt haben (in einem eingefügten Feld wird nie ein Wert ersetzt, denn das würde ändern, was gesendet wird). Ein Wert, dessen Name nur nach einem Secret aussieht, verhindert den Link nicht; das Popover nennt den ersten solchen Wert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Das Feld wird wie beim Einfügen gefüllt, und die Seite wählt die Route aus. Es wird nichts kontaktiert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Einordnung

Das Tool ergänzt den Artikel zu Routing und SD-WAN auf FortiGate, der die vollständige Reihenfolge der Abfragen und die SD-WAN-Schicht behandelt, die das Tool auslässt. Für die Vorbereitung auf NSE 4 unterstützt es Prüfungsziel 4.01.
