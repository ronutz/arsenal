## Was das Tool tut

Fügen Sie eine Liste von FortiGate-Firewall-Richtlinien und ein Paket ein, und das Tool nimmt die Auswertung so vor, wie FortiOS es täte: von oben nach unten, jedes Kriterium muss zutreffen, der erste Treffer gewinnt. Es meldet die zutreffende Richtlinie, eine Ablaufverfolgung, die für jede frühere Richtlinie das **erste Kriterium nennt, an dem sie ausgeschieden ist**, und die Richtlinien unterhalb des Treffers, die ebenfalls zugetroffen hätten. Es läuft vollständig in Ihrem Browser und kontaktiert nie ein Gerät.

## Warum die Ablaufverfolgung mehr zählt als die Bewertung

Zu wissen, dass Richtlinie 7 zutrifft, ist nur ein kleiner Teil der Antwort. Der nützliche Teil ist, warum die Richtlinien 1 bis 6 nicht zutrafen, denn daran erkennen Sie, ob die Liste so geschrieben ist wie beabsichtigt. Eine Richtlinie mit den richtigen Adressen und der falschen ausgehenden Schnittstelle trifft stillschweigend nicht zu, und nichts in der Oberfläche weist darauf hin; der Trefferzähler steigt einfach nie.

Die Ablaufverfolgung nennt pro Richtlinie ein Kriterium: das erste, das nicht zutraf. FortiOS verlangt alle, daher genügt ein einziges Scheitern, um eine Richtlinie auszuschließen, und nur das erste zu melden, hält die Ausgabe auch bei einer langen Liste lesbar.

## Verdeckt oder Catch-all, und warum genau diese Unterscheidung zählt

Sobald eine Richtlinie zutrifft, fallen spätere Richtlinien, die ebenfalls zugetroffen hätten, in zwei sehr verschiedene Kategorien, und das Tool hält sie auseinander.

**Verdeckt** heißt, die spätere Richtlinie ist mindestens so spezifisch wie die siegreiche. Das ist ein echter Fehler: Sie ist in der Konfiguration aktiv, sieht auf dem Bildschirm korrekt aus und kann für diesen Datenverkehr in dieser Reihenfolge nie wirksam werden. Es ist das häufigste Richtlinienproblem auf FortiGate überhaupt, und die Behebung besteht darin, sie über die siegreiche zu verschieben.

**Catch-all** heißt, die spätere Richtlinie ist breiter als die siegreiche. Ein allgemeines Zulassen unter einer Reihe spezifischer Regeln ist korrektes Design und kein Fehler, daher meldet das Tool es, ohne es zu markieren. Wer beides vermischt, lässt ein solches Tool bei jeder gut geordneten Richtlinienliste falschen Alarm schlagen; deshalb wird die Spezifität berechnet und nicht angenommen.

## Eingabeformate

Zwei Formen werden akzeptiert, weil Sie vielleicht die eine oder die andere vorliegen haben.

**FortiOS-CLI**: die Ausgabe von `show firewall policy` oder ein Block `config firewall policy`. Die Mitglieder werden aus den Listen in Anführungszeichen gelesen, und eine Richtlinie mit `set status disable` wird als übersprungen gemeldet, statt stillschweigend ignoriert zu werden.

**Eine Tabelle mit Pipe-Zeichen oder Tabulatoren**: `id | srcintf | dstintf | srcaddr | dstaddr | service | action`, so sieht eine Kopie aus der GUI oder eine von Hand geschriebene Liste aus. Mehrere Mitglieder in einer Zelle werden durch Kommas getrennt.

Das Paket steht in beiden Formaten in einer eigenen Zeile:

```
packet: srcintf=port1, dstintf=port2, srcaddr=LAN, dstaddr=WebSrv, service=HTTPS
```

## Die Grenze, offen benannt

Abgeglichen werden **Objektnamen**, keine aufgelösten Adressen. Eine eingefügte Richtlinienliste enthält die Definitionen der Adressobjekte nicht, daher lässt sich die Frage „Liegt 10.1.1.5 im Objekt namens LAN_Subnet?“ mit dieser Eingabe nicht beantworten. Geben Sie den Objektnamen an oder `all`.

Das ist eine bewusste Entscheidung. Das Tool könnte raten, indem es Adressen aus Objektnamen herausliest, und es läge selbstsicher falsch, sobald ein Name seinen Inhalt nicht beschreibt. Eine offen benannte Grenze ist nützlicher als eine plausible falsche Antwort, und sie ist der Grund, warum man dem Tool bei den Teilen, die es beantwortet, vertrauen kann.

Außerdem modelliert es **nur die Trefferentscheidung**. Ergebnisse von NAT (Network Address Translation) und von Sicherheitsprofilen, Routing und Sitzungszustand hängen von Konfiguration ab, die diese Eingabe nicht enthält, und werden nicht abgeleitet.

## Ergebnisse teilen

Unter der Kernaussage (ohne Paket an erster Stelle der Auswertung) erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` eine Kopie des Feldes. Die Seite liest die Richtlinien und die Zeile `packet:` und überspringt alles andere, daher wird auch eine ganze hier eingefügte Konfiguration ausgewertet; die Kopie ersetzt den Wert jeder geheimen FortiOS-Einstellung darin durch eine nummerierte Markierung und ist nie das Feld so, wie eingefügt. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Das Popover nennt außerdem, wie viele Werte ersetzt wurden.

Ersetzt werden die Einstellungen, die in der [CLI-Referenz von FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) einen Passworttyp haben (`password`, `password-2`, `password-3` oder `password_aes256`; abgerufen am 01.11.2026): `psksecret`, `psksecret-remote` und `ppk-secret` einer IPsec-Phase-1, das `password` eines Administrators und das `passwd` eines lokalen Benutzers, der `api-key` eines API-Benutzers, die `secret`-Werte für RADIUS (Remote Authentication Dial-In User Service), die `key`-Werte für TACACS+ und HA, `auth-pwd` und `priv-pwd` von SNMPv3, das `password` für BGP (Border Gateway Protocol) und LDAP (Lightweight Directory Access Protocol), `authentication-key` und `key-string` für OSPF (Open Shortest Path First), eine WLAN-`passphrase` und die geheimen Schlüssel der Cloud-Connectoren; jede Einstellung, deren Name auf ein Wort wie password, secret oder token endet; der `name` einer SNMP-Community, der selbst der Community-String ist ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), Abschnitt 3.2.5; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), Abschnitt 5.2.1); und jeder `ENC`-Wert, unabhängig von der Einstellung. Laut dem Advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) von Fortinet selbst (abgerufen am 01.11.2026) lassen sich die `ENC`-Daten einer Konfiguration, die „willingly posted on a forum for troubleshooting purpose“ wurde (also zur Fehlersuche in einem Forum veröffentlicht), zu Klartext entschlüsseln, und solche Daten „should currently be considered "easy to decrypt"“; ein `ENC`-Wert wird daher wie das Secret behandelt, das er enthält. Jeder Wert wird zu einer nummerierten Markierung (`[redacted-1]`, `[redacted-2]` usw.), derselbe Wert erhält dieselbe Nummer; das Wort `ENC`, die Anführungszeichen und jedes andere Zeichen bleiben erhalten. Einen Schalter, um die Werte wieder einzusetzen, gibt es nicht: Keiner von ihnen ändert die Auswertung, und jeder gehört zu den Zugangsdaten.

Ein Wert, der über seine Zeile hinausreicht, lässt sich dort nicht ersetzen (ein privater Schlüssel im PEM-Format in Anführungszeichen über mehrere Zeilen, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), Abschnitt 10), und die Kopie kann noch Zugangsdaten enthalten, die sich keiner Einstellung zuordnen lassen (ein JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1; eine Zeile `Authorization`, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2; ein Passwort in einer URL, RFC 3986, Abschnitt 3.2.1; eine AWS-Zugriffsschlüssel-ID). In beiden Fällen gibt es keinen Link: Das Popover nennt die Zeile, und Sie setzen einen Platzhalter an seine Stelle und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur nach einem Secret aussieht (etwa ein Wort in einem Kommentar), verhindert den Link nicht; das Popover nennt den ersten solchen Wert. Der Abgleich liest diese Einstellungen nie, daher kommt er mit der Kopie zu genau demselben Ergebnis; die Namen der Schnittstellen, Adressen und Richtlinien bleiben so, wie eingefügt, und das Popover bittet Sie, sie zuerst zu lesen.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Kopie füllt das Feld wie beim Einfügen, und die Seite führt den Abgleich durch. Ein Link, der noch ein Secret enthält, ist einer, den die Schaltfläche nie erzeugt, und wird ignoriert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Einordnung

Das Tool ergänzt den Artikel zu Firewall-Richtlinien und NAT auf FortiGate, der die Auswertungskette erklärt, die das Tool durchläuft, einschließlich der Frage, warum Destination-NAT über eine VIP vor der Auswertung der Richtlinien stattfindet und Source-NAT danach. Für die Vorbereitung auf NSE 4 deckt es die Prüfungsziele 2.01 und 2.02 ab.
