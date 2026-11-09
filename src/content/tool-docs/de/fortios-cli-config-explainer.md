## Was das Tool tut

Fügen Sie einen FortiOS-Konfigurationsblock ein, und das Tool gibt die Struktur als Baum zurück, mit jedem Verb erklärt: was `config`, `edit`, `set`, `unset`, `append`, `next`, `end` und `abort` jeweils tun und wo im Block sich jede Zeile befindet. Lokal und offline: Es liest die Struktur, nicht die Semantik.

## Die Falle, für die es das Tool gibt

**`set` auf einem Feld mit mehreren Werten ersetzt die ganze Liste.** `set srcaddr "internal-net"` auf einer Richtlinie, die vier Quelladressen hatte, lässt ihr eine, erfolgreich und stillschweigend, ohne dass die Ausgabe es erwähnt. Der Befehl, der hinzufügt, ist **`append`**.

Das Tool warnt bei jedem `set` auf ein bekanntes Listenfeld und nennt Feld und Zeile. Das ist die teuerste Angewohnheit bei der Arbeit mit der FortiOS-CLI, und sie ist unsichtbar, wenn man einen Block nur flüchtig liest, also genau so, wie Blöcke gelesen werden.

## Zwei weitere Dinge, die das Tool immer sagt

- **`edit` legt an, was es nicht findet.** Eine vertippte Richtlinien-ID erzeugt keinen Fehler, sondern eine Richtlinie.
- **`end` ist die einzige Zeile, die festschreibt.** `next` schließt einen Eintrag und bleibt in der Tabelle; `abort` schließt und verwirft. Ein Block, der `end` verwendet, wo `next` gemeint war, verlässt die Tabelle zu früh, und jede weitere Bearbeitung landet woanders.

Außerdem meldet es **nicht geschlossene Blöcke**, denn ein nicht geschlossener Block hat nichts festgeschrieben, und wer einen solchen in eine laufende Sitzung einfügt, landet an einer unerwarteten Stelle.

## Was das Tool nicht tut

Es kennt weder Ihre Adressobjekte noch Ihre Richtlinien noch Ihre VDOM-Aufteilung und kann nicht sagen, ob ein Wert sinnvoll ist. Es beantwortet, ob die Form des Befehls das tut, was die Person, die ihn eingibt, vermutlich erwartet hat; das ist eine andere und oft nützlichere Frage.

Es kann auch nicht wissen, was vorher in einem Feld stand. Wenn es warnt, dass ein `set` eine Liste ersetzt, **ist die Frage, die Sie beantworten sollen, was diese Liste enthielt.**

## Ergebnisse teilen

Als Erstes in der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` eine Kopie des Blocks, in der der Wert jeder geheimen FortiOS-Einstellung durch eine nummerierte Markierung ersetzt ist, nie den Block so, wie eingefügt, denn der Baum zeigt den Wert jeder Zeile. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Das Popover nennt außerdem, wie viele Werte ersetzt wurden.

Ersetzt werden die Einstellungen, die in der [CLI-Referenz von FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) einen Passworttyp haben (`password`, `password-2`, `password-3` oder `password_aes256`; abgerufen am 01.11.2026): `psksecret`, `psksecret-remote` und `ppk-secret` einer IPsec-Phase-1, das `password` eines Administrators und das `passwd` eines lokalen Benutzers, der `api-key` eines API-Benutzers, die `secret`-Werte für RADIUS (Remote Authentication Dial-In User Service), die `key`-Werte für TACACS+ und HA, `auth-pwd` und `priv-pwd` von SNMPv3, das `password` für BGP (Border Gateway Protocol) und LDAP (Lightweight Directory Access Protocol), `authentication-key` und `key-string` für OSPF (Open Shortest Path First), eine WLAN-`passphrase` und die geheimen Schlüssel der Cloud-Connectoren; jede Einstellung, deren Name auf ein Wort wie password, secret oder token endet; der `name` einer SNMP-Community, der selbst der Community-String ist ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), Abschnitt 3.2.5; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), Abschnitt 5.2.1); und jeder `ENC`-Wert, unabhängig von der Einstellung. Laut dem Advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) von Fortinet selbst (abgerufen am 01.11.2026) lassen sich die `ENC`-Daten einer Konfiguration, die „willingly posted on a forum for troubleshooting purpose“ wurde (also zur Fehlersuche in einem Forum veröffentlicht), zu Klartext entschlüsseln, und solche Daten „should currently be considered "easy to decrypt"“; ein `ENC`-Wert wird daher wie das Secret behandelt, das er enthält. Jeder Wert wird zu einer nummerierten Markierung (`[redacted-1]`, `[redacted-2]` usw.), derselbe Wert erhält dieselbe Nummer; das Wort `ENC`, die Anführungszeichen und jedes andere Zeichen bleiben erhalten. Einen Schalter, um die Werte wieder einzusetzen, gibt es nicht: Keiner von ihnen ändert die Auswertung, und jeder gehört zu den Zugangsdaten.

Ein Wert, der über seine Zeile hinausreicht, lässt sich dort nicht ersetzen (ein privater Schlüssel im PEM-Format in Anführungszeichen über mehrere Zeilen, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), Abschnitt 10), und die Kopie kann noch Zugangsdaten enthalten, die sich keiner Einstellung zuordnen lassen (ein JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1; eine Zeile `Authorization`, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2; ein Passwort in einer URL, RFC 3986, Abschnitt 3.2.1; eine AWS-Zugriffsschlüssel-ID). In beiden Fällen gibt es keinen Link: Das Popover nennt die Zeile, und Sie setzen einen Platzhalter an seine Stelle und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur nach einem Secret aussieht (etwa ein Wort in einem Kommentar), verhindert den Link nicht; das Popover nennt den ersten solchen Wert. Die Namen von Schnittstellen, Adressen, Objekten und Benutzern bleiben so, wie eingefügt, und das Popover bittet Sie, sie zuerst zu lesen.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Kopie füllt das Feld wie beim Einfügen, und die Seite erklärt sie: Baum, Warnungen und Hinweise lesen sich wie beim Absender, mit den Markierungen anstelle der Werte. Ein Link, der noch ein Secret enthält, ist einer, den die Schaltfläche nie erzeugt, und wird ignoriert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Verwandte Tools

Um eine Konfiguration per Skript von einer FortiGate abzuholen, schreibt der [Generator für Expect-Skripte](/tools/expect-script-builder) ein Skript für Anmeldung und Ausführung mit einem FortiOS-Profil. Standardmäßig beantwortet er den Pager `--More--` mit einem Leerzeichen, statt die Ausgabeeinstellung der Konsole zu ändern; das wäre eine globale Änderung, die sich auf die Sitzungen aller Administratoren auswirken würde.
