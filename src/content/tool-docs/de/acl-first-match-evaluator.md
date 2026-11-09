## Was das Tool tut

Fügen Sie eine IPv4-Access-Liste aus Cisco IOS oder IOS XE so ein, wie Sie sie aus einer Konfiguration kopieren würden, beschreiben Sie ein Paket, und das Tool nennt den Eintrag, der darüber entscheidet. Jeder Eintrag, den es vorher prüft, wird mit dem ersten Feld angezeigt, das ihn ausgeschlossen hat (Protokoll, Quelladresse, Quellport, Zieladresse, Zielport, `established` oder `fragments`); trifft nichts zu, erreicht das Paket das implizite Deny. Eine Lint-Prüfung liest die ganze Liste, mit oder ohne Paket. Alles wird in Ihrem Browser aus dem eingefügten Text berechnet; auf kein Gerät wird etwas angewendet.

Der Umfang ist bewusst gewählt: **v1 liest nur die IPv4-Syntax von Cisco IOS und IOS XE.** Was am Ende einer Liste geschieht, ist Verhalten der Plattform, kein Standard: Juniper EX beendet jeden Filter mit einem impliziten Discard, während Extreme Switch Engine und Fabric Engine zulassen, worauf keine Regel zutraf. Der [Artikel zu ACLs](/learn/access-control-lists-on-switches-and-routers) stellt die Plattformen mit ihren Quellen nebeneinander.

## Was das Tool liest

- **Nummerierte Listen**: `access-list`-Zeilen, Standard 1 bis 99 und 1300 bis 1999, erweitert 100 bis 199 und 2000 bis 2699, und ihre `remark`-Zeilen.
- **Benannte Listen**: ein Block `ip access-list standard NAME` oder `ip access-list extended NAME`, Einträge mit oder ohne Sequenznummern, `remark`-Zeilen. Ein Name beginnt mit einem Buchstaben; eine Zahl im passenden Bereich benennt dieselbe Liste wie die `access-list`-Zeilen mit dieser Nummer. Mehrere Listen in einem eingefügten Text werden gelesen; über Schaltflächen wählen Sie die auszuwertende.
- **Adressen**: `any` (0.0.0.0 255.255.255.255), `host A` (A 0.0.0.0), eine Adresse mit ihrer Wildcard und in einem Standardeintrag eine Adresse allein, die 0.0.0.0 als Maske annimmt. Auf 1 gesetzte Wildcard-Bits werden ignoriert und müssen nicht zusammenhängen.
- **Protokolle**: `ip` (jedes Protokoll), eine Zahl von 0 bis 255 und die Schlüsselwörter, deren Nummer eine Quelle nennt: `icmp` 1, `igmp` 2, `tcp` 6, `udp` 17, `gre` 47, `esp` 50, `eigrp` 88, `pim` 103 (IANA, dasselbe Schlüsselwort) und `ospf` 89 (RFC 2328). Cisco akzeptiert auch `ahp`, `ipinip`, `nos` und `pcp`; keine gelesene Quelle nennt ihre Nummern, daher wird eine Zeile damit mit diesem Grund aufgeführt, und Sie können stattdessen die Nummer schreiben.
- **Ports**, nur nach `tcp` oder `udp`: `eq` und `neq` mit bis zu 10 Ports, `lt`, `gt` und `range` (einschließlich der Grenzen). Ein Operator nach der Quelle prüft den Quellport, nach dem Ziel den Zielport. Ein Port ist 0 bis 65535 oder ein Name aus der TCP- oder UDP-Liste des Datenmodells von Cisco IOS XE 17.18.1 (`www` ist TCP 80, `domain` 53 bei beiden, `snmp` UDP 161 ...); ein TCP-Name funktioniert nur mit `tcp`, ein UDP-Name nur mit `udp`.
- **Optionen**: `established` (nur TCP: Ein Treffer verlangt gesetztes ACK oder RST), `fragments` (der Eintrag gilt nur für nicht initiale Fragmente), `log` und `log-input`.

Zeilen, die das Tool nicht liest, werden unter dem Ergebnis mit dem Grund aufgeführt, nie verworfen: Objektgruppen, ICMP- und IGMP-Meldungstypen, `dscp`, `precedence`, `tos`, `time-range`, `option`, `ttl`, TCP-Flags außer `established`, `dynamic` und reflexive Einträge, Hostnamen, `no`-Befehle, `ip access-list resequence`, `ip access-group` (wo eine Liste angewendet wird) und Ausgaben von `show access-lists`. Sieht eine solche Zeile wie ein Eintrag aus, weist das Ergebnis darauf hin, dass die Bewertung nur die gelesenen Einträge umfasst.

## Der Durchlauf

Cisco wertet eine Liste **nach Sequenznummer** aus, und der erste zutreffende Eintrag entscheidet; nichts danach wird gelesen. Das Tool prüft die Einträge in dieser Reihenfolge:

- Ein Eintrag ohne Nummer erhält 10 mehr als die höchste Nummer seiner Liste (10 für den ersten) und kommt ans Ende. Eine Nummer, die in der Liste schon vorkommt, wird abgelehnt (Cisco antwortet mit `Duplicate sequence number`), und ein Eintrag, der bis auf seine Nummer einem vorhandenen gleicht, ändert nichts; beide werden als nicht gelesene Zeilen aufgeführt.
- In einer **Standardliste** legt Cisco die Einträge, die einen einzelnen Host nennen, in einer Hashtabelle ab und schlägt die Quelle dort nach, bevor es die übrigen Einträge durchsucht. Der Durchlauf folgt dieser Reihenfolge und weist darauf hin, wenn ein Host-Eintrag vor einer niedrigeren Sequenznummer geprüft wird.
- Ein **Standardeintrag** prüft nur die Quelladresse: Protokoll, Ziel und Ports des Pakets spielen keine Rolle.
- Trifft nichts zu, wird das Paket durch das implizite Deny blockiert, das Cisco als die ungeschriebene deny-Anweisung am Ende jeder Access-Liste dokumentiert.
- Eine Liste ohne Einträge erhält keine Bewertung durch das implizite Deny: Laut Cisco lässt eine Schnittstelle, auf die eine leere Access-Liste angewendet ist, den gesamten Datenverkehr zu.

Das Testpaket ist ein unfragmentiertes Paket: Ein Eintrag mit `fragments` trifft es nie.

## Lint

- **Verdeckt**: Ein früherer Eintrag trifft jedes Paket, das dieser treffen würde, mit der entgegengesetzten Aktion; dieser entscheidet also nie über etwas.
- **Redundant**: Ein früherer Eintrag trifft jedes Paket, das dieser treffen würde, mit derselben Aktion; oder ein späterer tut es, und kein Eintrag dazwischen entscheidet über eines dieser Pakete anders. Ihn zu entfernen ändert nichts.
- **Wiederholt nur das implizite Deny**: ein deny-Eintrag, mit dem sich kein späterer permit-Eintrag überschneidet. Er ändert keine Bewertung, aber sein Zähler (oder sein `log`) zeigt den Datenverkehr.
- **Trifft nie**: eine Portprüfung, die kein Port besteht, etwa `lt 0`.
- **Nicht zusammenhängende Wildcard**: bei Cisco zulässig, wird aber markiert, weil keine Präfixlänge sie ausdrücken kann und ihre Adressen keinen zusammenhängenden Block bilden.
- **Ignorierte Bits**: eine Adresse mit gesetzten Bits, wo ihre Wildcard sie ignoriert (`10.1.1.5 0.0.0.255` trifft 10.1.1.0/24).
- **Reichweite einer Standardliste**: Ihre Einträge prüfen nur die Quelle, daher entscheidet jeder über alles, was diese Quellen senden.

Die Lint-Prüfung betrachtet nicht initiale Fragmente ebenso wie ganze Pakete, weil Cisco sie unterschiedlich prüft: Ein deny-Eintrag mit Ports oder `established` gilt nicht für ein nicht initiales Fragment, und der nächste Eintrag wird verarbeitet. Ein Eintrag unter einem solchen deny-Eintrag heißt daher „für jedes unfragmentierte Paket“ verdeckt, mit Begründung, statt schlechthin verdeckt.

Jede Adresse jedes Eintrags wird angezeigt: so, wie geschrieben, als Adresse und Wildcard mit gelöschten ignorierten Bits, als Präfix in der Notation von RFC 4632, wenn die Wildcard zusammenhängend ist, und mit der Anzahl der Adressen, die sie trifft.

## Was das Tool nicht wissen kann

- Was das Gerät enthält. Das Tool liest den eingefügten Text; eine Zeile, die es nicht liest, kann auf dem Gerät trotzdem ein Eintrag sein.
- Wo die Liste angewendet ist und in welcher Richtung. Ein Port, ein VLAN oder eine geroutete Schnittstelle, eingehend oder ausgehend, ändert, welche Pakete die Liste überhaupt erreichen; der Artikel erklärt die Anwendungspunkte.
- Hardwaregrenzen. Eine Liste, die sich korrekt liest, kann trotzdem nicht in den TCAM des Switches passen.
- Andere Plattformen. Ihre Syntax und ihr Listenende unterscheiden sich; v1 liest sie nicht.

## Beispiele

Die Schaltfläche „Beispiel“ lädt die Liste aus dem Lab des Kurses „Betrieb und Wartung von LAN-Switches“, Kapitel 4.3: SSH von 10.1.10.0/24 zum Managementnetz 10.1.99.0/24 zulassen, alles andere zu 10.1.99.0/24 blockieren, den Rest zulassen, als `ip access-list extended MGMT-PROTECT` mit den Sequenznummern 10, 20 und 30. Das Paket dazu ist SSH aus VLAN 20 (TCP von 10.1.20.25, Port 51514, an 10.1.99.10, Port 22): Eintrag 10 scheitert an der Quelladresse, und Eintrag 20 blockiert es. Ändern Sie die Quelle auf 10.1.10.25, und Eintrag 10 lässt es zu; vertauschen Sie die ersten beiden Einträge, wird SSH aus VLAN 10 blockiert, und der permit-Eintrag wird als verdeckt markiert. Die Referenzvektoren (Golden Vectors) decken den ersten Treffer auf jedem Feld ab, jeden Portoperator an seinen Grenzen, Standard- und erweiterte Listen, die Hash-Reihenfolge, Sequenznummern außer der Reihe, beide Arten von Redundanz und die nicht gelesenen Zeilen; einer davon ist das eigene Beispiel von Extreme Fabric Engine für eine nicht zusammenhängende Wildcard (3.4.5.6 mit 255.255.255.0 trifft 192.168.1.6, nicht aber 3.4.5.7), in Cisco-Schreibweise.

## API

Dieselbe Engine beantwortet die Operation `/api/v1/acl-first-match-evaluator` der HTTP-API der Website, beschrieben im OpenAPI-Vertrag auf der [API-Seite](/api), die auch angibt, ob diese Website die API bereitstellt.

- **Anfrage.** Die Access-Liste als Text (gelesen und per Lint geprüft) oder ein JSON-Objekt `{"acl": "...", "packet": {"protocol": "tcp", "source": "10.1.20.25", "destination": "10.1.99.10", "sourcePort": 51514, "destinationPort": 22, "ackOrRst": false}, "list": "MGMT-PROTECT"}` (dann zusätzlich für dieses Paket durchlaufen). `packet` und `list` sind optional; Ports dürfen Zahlen oder Zeichenfolgen sein.
- **Antwort.** `lists` (jede mit `name`, `kind`, `line`, `entries`, `evaluationOrder` und `remarks`; jeder Eintrag mit `seq`, `seqGiven`, `line`, `text`, `action`, `protocol`, `source`, `sourcePort`, `destination`, `destinationPort`, `established`, `fragments`, `log` und `hashed`; jede Adresse mit `written`, `form`, `address`, `wildcard`, `base`, `contiguous`, `prefix`, `addresses` und `ignoredBitsSet`), `selected`, `issues` (`line`, `text`, `entryLike`, `reason`), `packet`, `packetErrors`, `steps` (`seq`, `line`, `text`, `action`, `matched`, `field`, `reason`), `verdict` (`action`, `by`: `entry`, `implicit-deny` oder `empty-list`, `seq`, `line`, `text`, `sentence`), `lint` (`kind`, `seq`, `line`, `other`, `sentence`), `notes` und `counts`.
- **Fehler.** HTTP 400 für eine Anfrage, die mit `{` beginnt, aber kein gültiges JSON ist oder keine Zeichenfolge `acl` enthält, sowie für einen Text mit mehr als 65.536 Zeichen oder 4.000 Zeilen. Eine Zeile oder ein Paket, das sich nicht lesen lässt, ist kein HTTP-Fehler: `issues` und `packetErrors` nennen den Grund.

## Ergebnisse teilen

Unter der Bewertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Access-Liste so, wie eingefügt (`input`), und das Testpaket so, wie eingegeben (`protocol`, `source`, `srcport`, `destination`, `dstport` und `ackrst`, wenn das Kontrollkästchen aktiviert ist), dazu `list`, wenn Sie eine andere als die erste Liste gewählt haben. Das Popover nennt zuerst, was der Link enthält, dann einen eigenen Warnhinweis (eine Access-Liste nennt interne Netzwerke und Hosts und das, was sie erreichen darf), und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Die Liste durchläuft außerdem die Secret-Prüfung der Website: Ist ein Wert seinem Format nach Zugangsdaten (ein Passwort in einer URL, ein privater Schlüssel im PEM-Format, ein JWT), ob in einem Kommentar oder anderswo, gibt es keinen Link, und das Popover nennt die Zeile. Setzen Sie einen Platzhalter an seine Stelle und wählen Sie die Schaltfläche erneut.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 02.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Liste und jedes Feld des Pakets werden so, wie eingegeben, gefüllt, und die Seite liest sie; es wird nichts kontaktiert. Ein Wert des Pakets, den das Tool nicht lesen kann, zeigt dieselbe Meldung wie bei der Eingabe. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Quellen

- [Cisco, Security and VPN Configuration Guide, Cisco IOS XE 17.x: IP Access List Entry Sequence Numbering](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/sec-vpn/b-security-vpn/m_sec-acl-seq-num.html) (abgerufen am 02.11.2026; VPN steht für Virtual Private Network): erster Treffer, „If no conditions match, the packet is dropped“, die leere Liste, Sequenznummern im Abstand von 10, abgelehnte Duplikate, Host-Einträge in Standardlisten gehasht und zuerst nachgeschlagen
- [Cisco, ACLs Configuration Guide, Cisco IOS XE 17 (Catalyst 9000): Access Control Lists](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/security/acls/acls-configuration-guide/access-control-lists.html) (abgerufen am 02.11.2026): die Sequenznummer „dictates the order in which ACEs are evaluated“, Kommentare, nummerierte Syntax und Bereiche, Portoperatoren, `established`
- [Cisco IOS Security Command Reference, Commands A to C](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/security/a1/sec-a1-cr-book/sec-cr-a2.html) (abgerufen am 02.11.2026): `access-list (IP extended)` und `access-list (IP standard)`: Protokolle, Wildcard-Bits, Portoperatoren und -namen, `established`, `fragments`, `log`, das implizite Deny
- [Cisco, IOS XE 17.18.1 YANG model Cisco-IOS-XE-acl](https://raw.githubusercontent.com/YangModels/yang/main/vendor/cisco/xe/17181/Cisco-IOS-XE-acl.yang) (abgerufen am 02.11.2026): `eq` und `neq` mit bis zu 10 Ports, Sequenznummern 1 bis 2147483647, Kommentare mit 1 bis 100 Zeichen
- [Cisco, IOS XE 17.18.1 YANG model Cisco-IOS-XE-types](https://raw.githubusercontent.com/YangModels/yang/main/vendor/cisco/xe/17181/Cisco-IOS-XE-types.yang) (abgerufen am 02.11.2026): Nummernbereiche der Listen, TCP- und UDP-Portnamen mit ihren Nummern
- [Cisco, End-of-Sale and End-of-Life Announcement for the Cisco IOS XE 17.18.x](https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xe-17/ios-xe-17-18-x-eol.html) (abgerufen am 02.11.2026): Software-Maintenance-Releases bis 29. April 2028, Sicherheitskorrekturen bis 30. September 2029
- [RFC 4632, Classless Inter-domain Routing (CIDR)](https://www.rfc-editor.org/rfc/rfc4632.txt) (abgerufen am 02.11.2026): Präfixnotation und zusammenhängende Masken
- [IANA, Assigned Internet Protocol Numbers](https://www.iana.org/assignments/protocol-numbers/protocol-numbers-1.csv) (abgerufen am 02.11.2026): die Protokollnummern hinter den Schlüsselwörtern
- [RFC 2328, OSPF Version 2](https://www.rfc-editor.org/rfc/rfc2328.txt) (abgerufen am 02.11.2026): „OSPF is IP protocol number 89“
- [Juniper Networks, Understanding how firewall filters are evaluated (EX Series)](https://www.juniper.net/documentation/us/en/software/junos/routing-policy/topics/concept/firewall-filter-ex-series-evaluation-understanding.html) (abgerufen am 02.11.2026): der implizite Discard am Ende jedes Filters
- [Extreme Networks, Switch Engine v33.7.1 User Guide (PDF)](https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20User%20Guide/downloads/Switch_Engine_33_7_1_User_Guide.pdf) (abgerufen am 02.11.2026): „If a packet matches no rule entries in the ACL, it is permitted“
- [Extreme Networks, Fabric Engine v9.4 User Guide, access control lists](https://documentation.extremenetworks.com/Fabric%20Engine%20v9.4%20User%20Guide/fe_9.4_ug_revacdev/content/documents/Switch_Operating_Systems/VOSS_and_Fabric_Engine/fabric_engine_user_guide/access_control_lists.shtml) (abgerufen am 02.11.2026): „The default action mode for ACLs is permit“
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, section 3.5](https://www.rfc-editor.org/rfc/rfc3986#section-3.5) (abgerufen am 02.11.2026): das Fragment, auf dem „Ergebnisse teilen“ beruht
