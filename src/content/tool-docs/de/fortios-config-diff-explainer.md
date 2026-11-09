## Was das Tool tut

Fügen Sie zwei FortiOS-Konfigurationen ein, getrennt durch eine Zeile mit `---`, und Sie erhalten einen **strukturellen** Vergleich: was sich nach Abschnitt, Objekt und Einstellung geändert hat. Es läuft vollständig in Ihrem Browser.

## Warum ein zeilenweiser Vergleich hier nicht passt

Ein textueller Vergleich ermittelt ein minimales **Edit-Skript**, und das ist nicht dasselbe wie die Änderung, die ein Mensch vorgenommen hat. Auf FortiOS-Ausgaben angewendet, führt das zu drei bestimmten Ärgernissen:

- Ein Block, der **verschoben** wurde, erscheint als Löschung plus Einfügung, sodass die Prüfung eines unveränderten Objekts dieselbe Aufmerksamkeit kostet wie eine echte Änderung.
- Ein Objekt wirkt geändert, weil ein Nachbar eine Zeile hinzubekommen hat und sich die Ausrichtung verschoben hat.
- Drei echte Änderungen gehen in vierhundert Zeilen unveränderten Kontexts unter.

Dieses Tool zerlegt beide Seiten in Abschnitt, Objekt und Einstellung und vergleicht dann die Strukturen. Ein verschobener Block ist keine Änderung. Eine geänderte Einstellung ist eine Zeile, die den alten und den neuen Wert nennt.

## Die eine Stelle, an der die Reihenfolge kein Rauschen ist

In den meisten Abschnitten spielt die Reihenfolge der Objekte keine Rolle: Adressobjekte, Dienstobjekte, Schnittstellen. Eine Umsortierung dort zu melden, wäre Rauschen, daher wird sie ignoriert.

Bei **Firewall-Richtlinien** und ihren Verwandten **ist** die Reihenfolge das Verhalten. Der erste Treffer gewinnt, daher ändert das Verschieben einer Richtlinie über eine andere, was das Gerät tut, ohne dass sich eine einzige Einstellung ändert. Genau diese Änderung begräbt ein zeilenweiser Vergleich am gründlichsten, denn auf beiden Seiten der Verschiebung unterscheidet sich textuell nichts außer der Position.

Diese Abschnitte werden anhand ihres Namens als reihenfolgeabhängig behandelt, und eine Umsortierung darin wird als echter Befund gemeldet:

`firewall policy` · `firewall policy6` · `firewall proxy-policy` · `firewall local-in-policy` · `firewall shaping-policy` · `firewall security-policy` · `router policy` · `router policy6` · `system sdwan`

Beide Fälle gleich zu behandeln, in die eine wie in die andere Richtung, würde das Tool falsch machen; deshalb sind beide Verhaltensweisen durch Referenzvektoren (Golden Vectors) festgelegt.

## Eingabe

Zwei Konfigurationen, entweder getrennt durch eine Zeile, die nur `---` enthält, oder mit `BEFORE:` und `AFTER:` in eigenen Zeilen beschriftet. Jede Seite ist eine gewöhnliche Ausgabe von `show` oder `show full-configuration`.

Verschachtelte `config`-Blöcke innerhalb eines Objekts werden geparst, und ihren Einstellungen wird der verschachtelte Pfad vorangestellt, damit sie nicht mit einer gleichnamigen Einstellung des übergeordneten Objekts kollidieren.

## Was das Tool nicht tut

**Es vergleicht, es urteilt nicht.** Es sagt Ihnen, dass eine Richtlinie verschoben oder eine Adresse geändert wurde, aber nicht, ob das eine gute Idee war, denn das hängt von einer Absicht ab, die es nicht sehen kann.

Es bildet auch nicht das inhaltliche Gewicht einer Einstellung ab. Einen Kommentar zu ändern und eine Aktion zu ändern, erscheint beides als eine geänderte Einstellung, und es bleibt Ihnen überlassen, zu wissen, was davon zählt.

Identische Eingaben ergeben Stille statt eines beruhigenden Banners. Einem Vergleichstool, das Phantomänderungen findet, kann man bei den Änderungen, auf die es ankommt, nicht trauen; auch das legt ein Vektor fest.

## Ergebnisse teilen

Als Erstes im Vergleich erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` eine Kopie des Feldes, beide Konfigurationen, in denen der Wert jeder geheimen FortiOS-Einstellung durch eine nummerierte Markierung ersetzt ist, nie das Feld so, wie eingefügt. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Das Popover nennt außerdem, wie viele Werte ersetzt wurden.

Ersetzt werden die Einstellungen, die in der [CLI-Referenz von FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) einen Passworttyp haben (`password`, `password-2`, `password-3` oder `password_aes256`; abgerufen am 01.11.2026): `psksecret`, `psksecret-remote` und `ppk-secret` einer IPsec-Phase-1, das `password` eines Administrators und das `passwd` eines lokalen Benutzers, der `api-key` eines API-Benutzers, die `secret`-Werte für RADIUS (Remote Authentication Dial-In User Service), die `key`-Werte für TACACS+ und HA, `auth-pwd` und `priv-pwd` von SNMPv3, das `password` für BGP (Border Gateway Protocol) und LDAP (Lightweight Directory Access Protocol), `authentication-key` und `key-string` für OSPF (Open Shortest Path First), eine WLAN-`passphrase` und die geheimen Schlüssel der Cloud-Connectoren; jede Einstellung, deren Name auf ein Wort wie password, secret oder token endet; der `name` einer SNMP-Community, der selbst der Community-String ist ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), Abschnitt 3.2.5; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), Abschnitt 5.2.1); und jeder `ENC`-Wert, unabhängig von der Einstellung. Laut dem Advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) von Fortinet selbst (abgerufen am 01.11.2026) lassen sich die `ENC`-Daten einer Konfiguration, die „willingly posted on a forum for troubleshooting purpose“ wurde (also zur Fehlersuche in einem Forum veröffentlicht), zu Klartext entschlüsseln, und solche Daten „should currently be considered "easy to decrypt"“; ein `ENC`-Wert wird daher wie das Secret behandelt, das er enthält. Jeder Wert wird zu einer nummerierten Markierung (`[redacted-1]`, `[redacted-2]` usw.), derselbe Wert erhält dieselbe Nummer; das Wort `ENC`, die Anführungszeichen und jedes andere Zeichen bleiben erhalten. Einen Schalter, um die Werte wieder einzusetzen, gibt es nicht: Keiner von ihnen ändert die Auswertung, und jeder gehört zu den Zugangsdaten. Da gleiche Werte gleiche Markierungen behalten und verschiedene Werte verschiedene, erscheint ein Secret, das sich zwischen beiden Seiten geändert hat, weiterhin als geänderte Einstellung (`psksecret: ENC [redacted-1] → ENC [redacted-3]`), und eines, das sich nicht geändert hat, weiterhin nicht.

Ein Wert, der über seine Zeile hinausreicht, lässt sich dort nicht ersetzen (ein privater Schlüssel im PEM-Format in Anführungszeichen über mehrere Zeilen, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), Abschnitt 10), und die Kopie kann noch Zugangsdaten enthalten, die sich keiner Einstellung zuordnen lassen (ein JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1; eine Zeile `Authorization`, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2; ein Passwort in einer URL, RFC 3986, Abschnitt 3.2.1; eine AWS-Zugriffsschlüssel-ID). In beiden Fällen gibt es keinen Link: Das Popover nennt die Zeile, und Sie setzen einen Platzhalter an seine Stelle und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur nach einem Secret aussieht (etwa ein Wort in einem Kommentar), verhindert den Link nicht; das Popover nennt den ersten solchen Wert. Adressen, Objektnamen und der Rest beider Konfigurationen bleiben so, wie eingefügt, und das Popover bittet Sie, sie zuerst zu lesen.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Kopie füllt das Feld wie beim Einfügen, und die Seite vergleicht die beiden Konfigurationen, mit denselben geänderten Abschnitten, Objekten und Einstellungen wie beim Absender. Ein Link, der noch ein Secret enthält, ist einer, den die Schaltfläche nie erzeugt, und wird ignoriert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Einordnung

Kombinieren Sie das Tool mit dem Artikel zu Firewall-Richtlinien und NAT auf FortiGate, der erklärt, warum die Reihenfolge in den Abschnitten, die das Tool als reihenfolgeabhängig behandelt, das Verhalten bestimmt.
