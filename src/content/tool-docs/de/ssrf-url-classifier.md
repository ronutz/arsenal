## Was das Tool tut

Fügen Sie eine URL ein, und das Tool sagt Ihnen, wohin sie tatsächlich zeigt: Loopback, ein privater oder Link-Local-Bereich, ein Metadaten-Endpunkt einer Cloud, Shared Address Space für CGNAT, anderer reservierter Adressraum oder das öffentliche Internet. Es dekodiert die Tricks zur Verschleierung von IP-Adressen, mit denen eine interne Adresse getarnt wird, liest die IPv4-Adresse, die eine IPv6-Adresse in sich tragen kann (sechs Layouts, Teredo eingeschlossen), nennt den Block für besondere Zwecke aus den IANA-Registrys, in den eine Adresse fällt, und zwar für jede Zeile beider Registrys, kennzeichnet die Anycast-Dienstadressen für besondere Zwecke, kennzeichnet gefährliche URL-Schemata und eingebettete Zugangsdaten und zeigt eine SSRF-Risikostufe. Es löst nie DNS auf und sendet die Anfrage nie; es ist ein Klassifikator, keine Sonde.

## Was SSRF ist und warum die Klassifizierung zählt

Server-Side Request Forgery ist ein Angriff, bei dem ein Server dazu gebracht wird, eine Anfrage an eine URL zu senden, die der Angreifer gewählt hat, typischerweise um etwas zu erreichen, das der Angreifer nicht direkt erreichen kann: einen Dienst auf `localhost`, einen Rechner in einem internen Bereich oder den Metadaten-Endpunkt eines Cloud-Anbieters. Die Abwehr läuft auf die Entscheidung hinaus, ob eine URL gefahrlos abgerufen werden kann, und diese Entscheidung ist schwieriger, als sie aussieht, weil sich eine interne Adresse in vielen getarnten Formen schreiben lässt. Das Tool ist für genau diese Entscheidung gebaut: Es soll Ihnen helfen, eine URL zu verstehen und eine Zulassungsliste zu entwerfen, klar auf der defensiven Seite der Linie.

## Die Verschleierungen, die das Tool dekodiert

Ein naiver Filter, der `127.0.0.1` sperrt, übersieht die vielen anderen Schreibweisen derselben Adresse, und genau das nutzen Angreifer aus. Das Tool dekodiert sie, damit das tatsächliche Ziel sichtbar wird:

- **Dezimale** Ganzzahlform, in der `2130706433` für `127.0.0.1` steht und `2852039166` für die Metadatenadresse `169.254.169.254` (die Schaltfläche „Beispiel“ lädt diese);
- **oktale** und **hexadezimale** Oktettformen;
- **Kurzform** von IPv4, in der `127.1` zu `127.0.0.1` erweitert wird;
- **jede Schreibweise einer IPv6-Adresse**: Das Tool zerlegt die Adresse in ihre acht 16-Bit-Teile, bevor es irgendetwas klassifiziert, daher sind `[0:0:0:0:0:0:0:1]` und `[0000:0000:0000:0000:0000:0000:0000:0001]` die Loopback-Adresse `::1`, genau wie RFC 4291 `0:0:0:0:0:0:0:1` und `::1` als zwei Schreibweisen der Loopback-Adresse aufführt, wobei „The use of "::" indicates one or more groups of 16 bits of zeros“ ([RFC 4291, Abschnitt 2.2](https://www.rfc-editor.org/rfc/rfc4291.txt)); und
- **IPv6-Adressen, die eine IPv4-Adresse enthalten**, beschrieben im nächsten Abschnitt.

Anschließend klassifiziert es das so ermittelte Literal gegen jede Zeile der Special-Purpose-Registrys der IANA und hebt die Metadatenadressen der Clouds hervor, die bevorzugte SSRF-Ziele sind. Die dekodierte Adresse wird in der kanonischen Textform von [RFC 5952](https://www.rfc-editor.org/rfc/rfc5952.txt) gezeigt: Kleinbuchstaben, ohne führende Nullen, die längste Folge von Null-Teilen als `::` geschrieben (Abschnitt 4) und für die Präfixe, die selbst eine eingebettete IPv4-Adresse kennzeichnen, in gemischter Notation mit gepunktetem Ende, denn „mixed notation is RECOMMENDED if the following condition is met“, und die Bedingung ist ein Well-Known Prefix wie die, die RFC 4291 definiert (Abschnitt 5).

## IPv6-Adressen, die eine IPv4-Adresse enthalten

Sechs IPv6-Layouts legen eine IPv4-Adresse in die 128 Bit. Ein Filter, der nur den IPv6-Text prüft, lässt das interne IPv4-Ziel durch; daher dekodiert das Tool die IPv4-Adresse, bewertet die URL danach, sagt, welche Einbettung es dekodiert hat, und zeigt die Registry-Zeile der enthaltenen Adresse. Eine öffentliche Adresse in einer Einbettung wird als öffentlich bewertet, mit Nennung der Einbettung.

| Layout | Präfix | Wo die IPv4-Adresse steht | Quelle |
|---|---|---|---|
| IPv4-gemappt | `::ffff:0:0/96` | die unteren 32 Bit | [RFC 4291, Abschnitt 2.5.5.2](https://www.rfc-editor.org/rfc/rfc4291.txt) |
| IPv4-kompatibel (veraltet) | `::/96`, außer `::` und `::1` | die unteren 32 Bit | [RFC 4291, Abschnitt 2.5.5.1](https://www.rfc-editor.org/rfc/rfc4291.txt) |
| NAT64 Well-Known Prefix | `64:ff9b::/96` | die unteren 32 Bit (das /96-Layout) | [RFC 6052, Abschnitte 2.1 und 2.2](https://www.rfc-editor.org/rfc/rfc6052.txt) |
| NAT64-Präfix für lokale Nutzung | `64:ff9b:1::/48` | hängt von der Präfixlänge ab, die der Betreiber gewählt hat: das Layout /48, /56, /64 oder /96 aus RFC 6052 | [RFC 8215, Abschnitte 1 und 5](https://www.rfc-editor.org/rfc/rfc8215.txt) |
| 6to4 | `2002::/16` | Bits 16 bis 47 (das Feld V4ADDR) | [RFC 3056, Abschnitt 2](https://www.rfc-editor.org/rfc/rfc3056.txt) |
| Teredo | `2001::/32` | zwei Adressen: der Server in den Bits 32 bis 63, der Client invertiert in den Bits 96 bis 127 | [RFC 4380, Abschnitt 4](https://www.rfc-editor.org/rfc/rfc4380.txt) |

**IPv4-gemappt.** `[::ffff:127.0.0.1]` ist die Loopback-Adresse im IPv6-Gewand. Ein Browser zeigt sie nicht so an: Der IPv6-Serializer des WHATWG URL Standard schreibt jeden 16-Bit-Teil als „the shortest possible lowercase hexadecimal number“, daher kommt dieselbe URL als `[::ffff:7f00:1]` zurück ([WHATWG URL Standard, IPv6 serializer](https://url.spec.whatwg.org/)). Beide Schreibweisen werden als Loopback mit hohem Risiko bewertet.

**IPv4-kompatibel.** RFC 4291 definiert `::a.b.c.d` mit 96 Null-Bits vor der IPv4-Adresse und zieht das Format dann zurück: Es „is now deprecated because the current IPv6 transition mechanisms no longer use these addresses“, und die enthaltene IPv4-Adresse „must be a globally-unique IPv4 unicast address“ ([RFC 4291, Abschnitt 2.5.5.1](https://www.rfc-editor.org/rfc/rfc4291.txt)). Die Registry hat keine Zeile dafür. Ein Stack, der das Format noch akzeptiert, erreicht die enthaltene Adresse; daher werden `[::127.0.0.1]` und sein hexadezimaler Zwilling `[::7f00:1]` als Loopback bewertet, `[::a9fe:a9fe]` als Cloud-Metadaten und `[::8.8.8.8]` als öffentlich; das Ergebnis sagt in jedem Fall, dass das Format veraltet ist. `::` und `::1` sind eigene Registry-Zeilen und werden nie als IPv4-kompatibel gelesen.

**NAT64 Well-Known Prefix.** `[64:ff9b::169.254.169.254]` und sein hexadezimaler Zwilling `[64:ff9b::a9fe:a9fe]` enthalten die Link-Local-Metadatenadresse und werden daher als Cloud-Metadaten bewertet. RFC 6052 legt fest: „The Well-Known Prefix MUST NOT be used to represent non-global IPv4 addresses“, und weist Translatoren an, solche Pakete zu verwerfen ([RFC 6052, Abschnitt 3.1](https://www.rfc-editor.org/rfc/rfc6052.txt)). Die Adresse nennt trotzdem dieses interne Ziel; deshalb muss ein Filter sie ablehnen, statt jedem Translator auf dem Pfad zu vertrauen. Eine Adresse unter dem Well-Known Prefix, die eine öffentliche IPv4-Adresse enthält, etwa `64:ff9b::8.8.8.8`, wird als öffentlich bewertet, weil die Registry `64:ff9b::/96` als global erreichbar kennzeichnet.

**NAT64-Präfix für lokale Nutzung.** RFC 8215 reserviert `64:ff9b:1::/48` für die Übersetzung innerhalb eines Netzwerks und überlässt die Länge des Übersetzungspräfixes dem Betreiber; Knoten „must not make any assumptions regarding the syntax or properties of those addresses“ ([RFC 8215, Abschnitt 5](https://www.rfc-editor.org/rfc/rfc8215.txt)). Das Tool liest die Adresse daher mit jedem Layout aus RFC 6052, das in ein /48 passt (/96, /64, /56 und /48), behält die Lesart, die am weitesten nach innen zeigt (Cloud-Metadaten, dann Loopback, Link-Local, privat), und meldet die /96-Lesart, wenn keine das tut. Jedes Layout überspringt die Bits 64 bis 71, und RFC 6052 legt fest: „These bits MUST be set to zero“ ([RFC 6052, Abschnitt 2.2](https://www.rfc-editor.org/rfc/rfc6052.txt)); sind sie nicht null, wird keine IPv4-Adresse dekodiert. Weil die IANA-Registry `64:ff9b:1::/48` als nicht global erreichbar kennzeichnet, wird eine Adresse darin nie niedriger als reserviert bewertet.

**6to4.** RFC 3056 bildet ein Standortpräfix aus dem 16-Bit-Präfix `2002` und der 32-Bit-IPv4-Adresse des Standorts, geschrieben `2002:V4ADDR::/48` ([RFC 3056, Abschnitt 2](https://www.rfc-editor.org/rfc/rfc3056.txt)). `[2002:7f00:1::]` enthält daher `127.0.0.1` und wird als Loopback bewertet; `[2002:a9fe:a9fe::1]` enthält die Metadatenadresse.

**Teredo.** Eine Teredo-Adresse hat fünf Teile: „Prefix“, „Server IPv4“, „Flags“, „Port“ und „Client IPv4“ ([RFC 4380, Abschnitt 4](https://www.rfc-editor.org/rfc/rfc4380.txt)). Das Präfix ist `2001:0000:/32` (Abschnitt 2.6). Die Serveradresse steht unverändert in den Bits 32 bis 63. Gemappter Port und gemappte Adresse des Clients sind verschleiert: „Each bit in the address and port number is reversed; this can be done by an exclusive OR of the 16-bit port number with the hexadecimal value 0xFFFF, and an exclusive OR of the 32-bit address with the hexadecimal value 0xFFFFFFFF“ (Abschnitt 4). RFC 5991 hat das Feld Flags später mit Zufallsbits neu definiert, die Felder für Server und Client aber unverändert gelassen ([RFC 5991, Abschnitt 3.1](https://www.rfc-editor.org/rfc/rfc5991.txt)). Das Tool macht das XOR rückgängig, bewertet beide IPv4-Adressen, lässt die weiter innen liegende entscheiden (bei Gleichstand gewinnt der Server) und zeigt Server, Client, Client-Port und Flags. `[2001:0:808:808:0:feae:80ff:fffe]` hat den Server `8.8.8.8` und den Client `127.0.0.1` (`0x80fffffe` XOR `0xffffffff`) und wird daher als Loopback bewertet; `[2001:0:808:808:0:feae:fefd:fcfb]` enthält den Client `1.2.3.4` mit Port 337, dasselbe Paar, das RFC 4380 für sein eigenes Beispiel zur Verschleierung verwendet (Abschnitt 5.1.1), und wird als öffentlich bewertet. RFC 4380 ergänzt, dass „the identifiers used in global addresses MUST include a global scope unicast IPv4 address“ (Abschnitt 4); eine Teredo-Adresse, die eine interne enthält, nennt also ein Ziel, das keine gültige Teredo-Adresse enthalten sollte.

**Was das Tool nicht dekodiert: 6a44.** RFC 6751 bildet eine 6a44-Adresse aus „the 6a44-network IPv6 prefix C (a /48 the ISP has assigned to its 6a44 relays)“, gefolgt von der IPv4-Adresse des Kundenstandorts, einem Port und der lokalen IPv4-Adresse des Clients ([RFC 6751, Abschnitt 5](https://www.rfc-editor.org/rfc/rfc6751.txt)). Weil jeder ISP das /48 selbst wählt, kennzeichnet kein festes Präfix eine 6a44-Adresse, und ohne die Konfiguration dieses ISP kann das Tool sie von keiner anderen Adresse unterscheiden. Die IPv4-Seite nennt es aber: `192.88.99.2` ist die 6a44-Relay-Anycast-Adresse (Abschnitt 8).

## Jeder Block für besondere Zwecke, benannt nach den IANA-Registrys

Das Tool enthält jede Zeile der IANA-Registrys IPv4 und IPv6 Special-Purpose Address Space ([IPv4-CSV](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) und [IPv6-CSV](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv), beide zuletzt am 09.10.2025 aktualisiert, abgerufen am 26.10.2026): 25 IPv4-Zeilen und 25 IPv6-Zeilen. Der CIDR- und Subnetzrechner liest dieselbe Kopie der IPv4-Zeilen. Eine Adresse wird mit der spezifischsten Zeile abgeglichen, die sie abdeckt, und das Ergebnis zeigt den Block, den Namen in der Registry und den RFC, wörtlich. Die Registry definiert Globally Reachable als „whether an IP datagram whose destination address is drawn from the allocated special-purpose address block is forwardable beyond a specified administrative domain“, und die Bewertung folgt dem:

- **Globally Reachable False** wird als **reserviert** bewertet (hohes Risiko auf der Skala dieses Tools), sofern die Zeile keine aussagekräftigere Kategorie hat: Loopback, privat, Link-Local oder Carrier-Grade NAT.
- **Globally Reachable True** wird als **öffentlich** bewertet (niedriges Risiko), und der Block wird trotzdem genannt, sodass nichts aus der Registry in ein anonymes „öffentlich“ fällt.
- **Kein Wert** kommt auf zwei Arten vor. Für die Zeilen der Einbettungen (6to4, Teredo) nennt die Registry N/A und verweist auf den RFC, daher entscheidet die enthaltene IPv4-Adresse. Für die beiden veralteten Zeilen enthält die Registry überhaupt keine booleschen Werte, und das Tool bewertet sie als reserviert: RFC 7526 legt fest: „The prefix 192.88.99.0/24 MUST NOT be reassigned for other use except by a future IETF Standards Action“, und hält fest, dass „The Boolean values for the address block 192.88.99.0/24 have been removed“ ([RFC 7526, Abschnitte 4 und 7](https://www.rfc-editor.org/rfc/rfc7526.txt)); und `2001:10::/28` liegt innerhalb von `2001::/23`, das nicht global erreichbar ist, „Unless allowed by a more specific allocation“ (Fußnote [1] der Registry).

Die Multicast-Blöcke `224.0.0.0/4` und `ff00::/8` sind keine Special-Purpose-Zeilen (sie haben eigene Registrys) und werden trotzdem als reserviert bewertet, ohne benannte Zeile.

### IPv4

| Block | IANA-Name | RFC | Globally Reachable | Bewertung |
|---|---|---|---|---|
| `0.0.0.0/8` | "This network" | RFC 791, Section 3.2 | False | reserviert, hoch |
| `0.0.0.0/32` | "This host on this network" | RFC 1122, Section 3.2.1.3 | False | reserviert, hoch |
| `10.0.0.0/8` | Private-Use | RFC 1918 | False | privat, hoch |
| `100.64.0.0/10` | Shared Address Space | RFC 6598 | False | CGNAT, mittel |
| `127.0.0.0/8` | Loopback | RFC 1122, Section 3.2.1.3 | False | Loopback, hoch |
| `169.254.0.0/16` | Link Local | RFC 3927 | False | Link-Local, hoch (`169.254.169.254`: Cloud-Metadaten) |
| `172.16.0.0/12` | Private-Use | RFC 1918 | False | privat, hoch |
| `192.0.0.0/24` | IETF Protocol Assignments | RFC 6890, Section 2.1 | False | reserviert, hoch |
| `192.0.0.0/29` | IPv4 Service Continuity Prefix | RFC 7335 | False | reserviert, hoch |
| `192.0.0.8/32` | IPv4 dummy address | RFC 7600 | False | reserviert, hoch |
| `192.0.0.9/32` | Port Control Protocol Anycast | RFC 7723 | True | öffentlich, niedrig, Anycast-Dienst |
| `192.0.0.10/32` | Traversal Using Relays around NAT Anycast | RFC 8155 | True | öffentlich, niedrig, Anycast-Dienst |
| `192.0.0.170/32`, `192.0.0.171/32` | NAT64/DNS64 Discovery | RFC 8880; RFC 7050, Section 2.2 | False | reserviert, hoch |
| `192.0.2.0/24` | Documentation (TEST-NET-1) | RFC 5737 | False | reserviert, hoch |
| `192.31.196.0/24` | AS112-v4 | RFC 7535 | True | öffentlich, niedrig |
| `192.52.193.0/24` | AMT | RFC 7450 | True | öffentlich, niedrig |
| `192.88.99.0/24` | Deprecated (6to4 Relay Anycast) | RFC 7526 | kein Wert | reserviert, hoch |
| `192.88.99.2/32` | 6a44-relay anycast address | RFC 6751 | False | reserviert, hoch, Anycast-Dienst |
| `192.168.0.0/16` | Private-Use | RFC 1918 | False | privat, hoch |
| `192.175.48.0/24` | Direct Delegation AS112 Service | RFC 7534 | True | öffentlich, niedrig |
| `198.18.0.0/15` | Benchmarking | RFC 2544 | False | reserviert, hoch |
| `198.51.100.0/24` | Documentation (TEST-NET-2) | RFC 5737 | False | reserviert, hoch |
| `203.0.113.0/24` | Documentation (TEST-NET-3) | RFC 5737 | False | reserviert, hoch |
| `240.0.0.0/4` | Reserved | RFC 1112, Section 4 | False | reserviert, hoch |
| `255.255.255.255/32` | Limited Broadcast | RFC 8190; RFC 919, Section 7 | False | reserviert, hoch |

Innerhalb von `192.0.0.0/24` entscheidet die Fußnote der Registry: Das /24 ist „Not useable unless by virtue of a more specific reservation“, daher gewinnt die spezifischste Zeile. `100.100.100.200`, eine Metadatenadresse einer Cloud, liegt im Shared Address Space und wird als Cloud-Metadaten bewertet, mit Nennung dieser Zeile.

### IPv6

| Block | IANA-Name | RFC | Globally Reachable | Bewertung |
|---|---|---|---|---|
| `::1/128` | Loopback Address | RFC 4291 | False | Loopback, hoch |
| `::/128` | Unspecified Address | RFC 4291 | False | reserviert, hoch |
| `::ffff:0:0/96` | IPv4-mapped Address | RFC 4291 | False | nach der enthaltenen IPv4-Adresse |
| `64:ff9b::/96` | IPv4-IPv6 Translat. | RFC 6052 | True | nach der enthaltenen IPv4-Adresse |
| `64:ff9b:1::/48` | IPv4-IPv6 Translat. | RFC 8215 | False | nach der enthaltenen IPv4-Adresse, nie niedriger als reserviert |
| `100::/64` | Discard-Only Address Block | RFC 6666 | False | reserviert, hoch |
| `100:0:0:1::/64` | Dummy IPv6 Prefix | RFC 9780 | False | reserviert, hoch |
| `2001::/23` | IETF Protocol Assignments | RFC 2928 | False | reserviert, hoch |
| `2001::/32` | TEREDO | RFC 4380; RFC 8190 | N/A | nach der weiter innen liegenden der beiden enthaltenen IPv4-Adressen |
| `2001:1::1/128` | Port Control Protocol Anycast | RFC 7723 | True | öffentlich, niedrig, Anycast-Dienst |
| `2001:1::2/128` | Traversal Using Relays around NAT Anycast | RFC 8155 | True | öffentlich, niedrig, Anycast-Dienst |
| `2001:1::3/128` | DNS-SD Service Registration Protocol Anycast | RFC 9665 | True | öffentlich, niedrig, Anycast-Dienst |
| `2001:2::/48` | Benchmarking | RFC 5180; RFC Errata 1752 | False | reserviert, hoch |
| `2001:3::/32` | AMT | RFC 7450 | True | öffentlich, niedrig |
| `2001:4:112::/48` | AS112-v6 | RFC 7535 | True | öffentlich, niedrig |
| `2001:10::/28` | Deprecated (previously ORCHID) | RFC 4843 | kein Wert | reserviert, hoch |
| `2001:20::/28` | ORCHIDv2 | RFC 7343 | True | öffentlich, niedrig |
| `2001:30::/28` | Drone Remote ID Protocol Entity Tags (DETs) Prefix | RFC 9374 | True | öffentlich, niedrig |
| `2001:db8::/32` | Documentation | RFC 3849 | False | reserviert, hoch |
| `2002::/16` | 6to4 | RFC 3056 | N/A | nach der enthaltenen IPv4-Adresse |
| `2620:4f:8000::/48` | Direct Delegation AS112 Service | RFC 7534 | True | öffentlich, niedrig |
| `3fff::/20` | Documentation | RFC 9637 | False | reserviert, hoch |
| `5f00::/16` | Segment Routing (SRv6) SIDs | RFC 9602 | False | reserviert, hoch |
| `fc00::/7` | Unique-Local | RFC 4193; RFC 8190 | False | privat, hoch (`fd00:ec2::254`: Cloud-Metadaten) |
| `fe80::/10` | Link-Local Unicast | RFC 4291 | False | Link-Local, hoch |

Einige Zeilen verdienen ein Wort. Das Benchmarking-Präfix ist `2001:2::/48`, weil Erratum 1752 RFC 5180 korrigiert hat, das `2001:0200::/48` gedruckt hatte; das Erratum lautet „The IANA has assigned 2001:0002::/48 for IPv6 benchmarking“ ([RFC Errata 1752](https://www.rfc-editor.org/errata/eid1752)). `5f00::/16` enthält Segment Identifiers von Segment Routing over IPv6, und die SRv6-Spezifikationen „are intended to be applicable to a contained SR Domain or between collaborating SR Domains“ ([RFC 9602, Abschnitt 5](https://www.rfc-editor.org/rfc/rfc9602.txt)). `100:0:0:1::/64` ist das Dummy-IPv6-Präfix, das RFC 9780 anstelle von „an IPv4 loopback address mapped to IPv6“ empfiehlt ([RFC 9780, Abstract](https://www.rfc-editor.org/rfc/rfc9780.txt)). ORCHIDv2- und DET-Adressen sind Kennungen, keine Locators: ORCHIDs „are considered non-routable addresses from the IPv6-layer perspective“ ([RFC 7343, Abstract](https://www.rfc-editor.org/rfc/rfc7343.txt)), und HHITs „are valid, though non-routable, IPv6 addresses“ ([RFC 9374, Abschnitt 1](https://www.rfc-editor.org/rfc/rfc9374.txt)). Die Registry kennzeichnet trotzdem beide Blöcke als global erreichbar; das Tool folgt der Registry und bewertet sie als öffentlich, mit Nennung des Blocks. Für die Dokumentationspräfixe nennt RFC 3849 die Absicht klar: „This assignment implies that IPv6 network operators should add this address prefix to the list of non-routeable IPv6 address space“ ([RFC 3849, Abschnitt 3](https://www.rfc-editor.org/rfc/rfc3849.txt)).

## Die Anycast-Dienstadressen und warum sie als öffentlich gelten

Fünf Zeilen sind Anycast-Dienstadressen, die die Registry als global erreichbar kennzeichnet: `192.0.0.9` und `2001:1::1` für das Port Control Protocol, `192.0.0.10` und `2001:1::2` für TURN und `2001:1::3` für das DNS-SD Service Registration Protocol. Eine sechste, `192.88.99.2`, ist die 6a44-Relay-Anycast-Adresse, die die Registry als nicht global erreichbar kennzeichnet. Das Tool behält die Bewertung, die sich aus der Registry ergibt (öffentlich für die ersten fünf, reserviert für die sechste), nennt aber den Block und ergänzt eine Kennzeichnung, dass es sich um eine Anycast-Dienstadresse für besondere Zwecke handelt, damit die lesende Person das sieht.

Warum sie überhaupt kennzeichnen? Eine Anycast-Adresse ist nicht ein einzelner Rechner: „A packet sent to an anycast address is delivered to the 'topologically nearest' network interface with the anycast address“ ([RFC 8155, Abschnitt 6](https://www.rfc-editor.org/rfc/rfc8155.txt)). Bei PCP ist das absichtlich eine nahe Middlebox: Mit den Adressen können Clients „transmit signaling messages to their closest PCP-aware on-path NAT, firewall, or other middlebox“ ([RFC 7723, Abstract](https://www.rfc-editor.org/rfc/rfc7723.txt)). `2001:1::3` ist „a fixed anycast address that can be commonly used as a destination for SRP Updates when no SRP registrar is explicitly configured“ ([RFC 9665, Abschnitt 10.5](https://www.rfc-editor.org/rfc/rfc9665.txt)). Ein Server, der eine dieser URLs abruft, spricht also womöglich mit Geräten auf seinem eigenen Netzwerkpfad, was eine bloße Bewertung als öffentlich verbergen würde. Die Bewertung bleibt öffentlich, weil die Registry das sagt; die Kennzeichnung ist dafür da, dass eine Zulassungsliste diese Adressen ausdrücklich nennt, statt sie als gewöhnliche Internet-Hosts durchzulassen. Die Kennzeichnung folgt auch einer Einbettung: `[64:ff9b::192.0.0.9]` wird als öffentlich bewertet und gekennzeichnet, weil die enthaltene Adresse die PCP-Anycast-Adresse ist.

## Durchgerechnete Beispiele

Die Referenzvektoren (Golden Vectors) des Tools legen jedes Beispiel unten fest, zusammen mit einem Vektor pro Registry-Zeile.

| Eingabe | Bewertet als | Warum |
|---|---|---|
| `http://2852039166/latest/meta-data/` | Cloud-Metadaten, hoch | dezimale Form von `169.254.169.254` (die Schaltfläche „Beispiel“) |
| `http://[::ffff:7f00:1]/` | Loopback, hoch | IPv4-gemappt, enthält `127.0.0.1` |
| `http://[0:0:0:0:0:0:0:1]/` | Loopback, hoch | eine ausgeschriebene Schreibweise von `::1` |
| `http://[::7f00:1]/` | Loopback, hoch | IPv4-kompatibel (veraltet), enthält `127.0.0.1` |
| `http://[64:ff9b::169.254.169.254]/` | Cloud-Metadaten, hoch | NAT64 Well-Known Prefix, enthält `169.254.169.254` |
| `http://[2002:7f00:1::]/` | Loopback, hoch | 6to4, enthält `127.0.0.1` |
| `http://[2001:0:808:808:0:feae:80ff:fffe]/` | Loopback, hoch | Teredo, der Client ist `127.0.0.1` |
| `http://[2001:0:a9fe:a9fe:8000:feae:fefd:fcfb]/` | Cloud-Metadaten, hoch | Teredo, der Server ist `169.254.169.254` |
| `http://[2001:2::1]/` | reserviert, hoch | Benchmarking, `2001:2::/48` |
| `http://[5f00::1]/` | reserviert, hoch | Segment Routing (SRv6) SIDs, `5f00::/16` |
| `http://192.88.99.1/` | reserviert, hoch | Deprecated (6to4 Relay Anycast), kein Wert für Globally Reachable |
| `http://192.0.0.10/` | öffentlich, niedrig, gekennzeichnet | Anycast-Dienstadresse für TURN |
| `http://[2001:1::3]/` | öffentlich, niedrig, gekennzeichnet | Anycast-Adresse des DNS-SD Service Registration Protocol |
| `http://192.31.196.1/` | öffentlich, niedrig, benannt | AS112-v4 |

## Schemata, Zugangsdaten und das ehrliche Unbekannte

Über die Adresse hinaus kennzeichnet das Tool gefährliche URL-Schemata (die über `http` und `https` hinaus, die SSRF-Payloads oft missbrauchen) und eingebettete Zugangsdaten in der Form `user:pass@host`. In einem Punkt achtet es besonders auf Ehrlichkeit: Ein bloßer Hostname, der kein bekannter Sondername ist, wird als zur Laufzeit aufgelöst gemeldet, nicht erraten, weil das Tool nie eine DNS-Auflösung durchführt. Das ist die wahrheitsgemäße Antwort, und sie ist auch der Grund, warum das Tool sicher ist: Es klassifiziert, was die URL sagt, statt nach außen zu greifen.

## Verwendung

Fügen Sie eine URL ein oder wählen Sie „Beispiel“, und lesen Sie die Klassifizierung, das dekodierte Ziel, die eingebettete IPv4-Adresse mit ihrer eigenen Registry-Zeile, beide Teredo-Adressen, wenn es zwei gibt, den Block für besondere Zwecke, jede Kennzeichnung als Anycast oder veraltet, jedes gekennzeichnete Schema und alle gekennzeichneten Zugangsdaten sowie die SSRF-Risikostufe. Alles wird lokal berechnet; es wird nie eine Anfrage gesendet.

## Ergebnisse teilen

Nach der Antwort (der Bewertung, den Fakten und den Auffälligkeiten) erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die URL, wobei ein Passwort vor dem `@` durch `[redacted]` ersetzt ist. [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.2.1, abgerufen am 01.11.2026) erklärt `user:password` in der Userinfo für veraltet und legt fest, dass Anwendungen „should not render as clear text any data after the first colon“. Die Seite zeigt die Userinfo nie, nur dass es eine gibt, daher liest sich die Kopie genauso; sie wird erneut klassifiziert, bevor der Link angeboten wird, und wenn sie sich nicht genauso lesen würde (eine URL ohne `//`, deren „Passwort“ die Seite als Teil des Pfads zeigt), gibt es keinen Link, und das Popover bittet Sie, das Passwort zu entfernen. Ein Benutzername allein bleibt so, wie eingegeben, denn er kann genau der Trick sein, um den es geht (`http://expected-host@internal/`); das Popover sagt das, für den Fall, dass er ein Token ist. Ein JWT oder eine AWS-Zugriffsschlüssel-ID in Pfad oder Query verhindert den Link, und ein Name wie `access_token=` in der Query wird im Popover genannt. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die URL füllt das Feld wie beim Einfügen, und die Seite klassifiziert sie, lokal: keine DNS-Abfrage und keine Anfrage. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## API

Dieselbe Engine beantwortet die Operation `/api/v1/ssrf-url-classifier` der HTTP-API der Website, Feld für Feld beschrieben im OpenAPI-Vertrag auf der [API-Seite](/api), mit Beispielen aus den Referenzvektoren. Der Vertrag gibt auch an, ob diese Website die API bereitstellt.

- **Anfrage.** Die URL oder der Host als Text: `?input=` bei GET oder ein POST-Body.
- **Antwort.** Die Teile der URL (`scheme`, `host`, `port`, `path`, `hasUserinfo`, `schemeFlag`), die Adresse (`isIp`, `ipVersion`, `canonicalIp`, `obfuscated`, `obfuscationForm`), die Bewertung (`category`, `risk`, `reasons` auf Englisch) und die Dekodierung: `embedding` (`ipv4-mapped`, `ipv4-compatible`, `nat64-wkp`, `nat64-local`, `6to4`, `teredo` oder `null`), `embeddedIpv4` (die Adresse, die entscheidet), `embeddingLayout`, `specialBlock` und `embeddedSpecialBlock` (jeweils `{prefix, name, rfc, globallyReachable}` oder `null`), `teredo` (`serverIpv4`, `clientIpv4`, `clientPort`, `flags` oder `null`) und `anycastService`. Für `http://[2001:0:808:808:0:feae:80ff:fffe]/` antwortet die API mit `loopback` / `high`, mit dem `teredo`-Server `8.8.8.8`, dem Client `127.0.0.1`, Port 337 und Flags 0 sowie `embeddedSpecialBlock` `127.0.0.0/8` „Loopback“.
- **Fehler.** Nur eine leere Eingabe wird abgelehnt: HTTP 400. Ein Host, den das Tool nicht einordnen kann, ist kein Fehler; er wird als `unresolved` oder `internal-name` bewertet.

`embedding`, `embeddedIpv4`, `embeddingLayout` und `specialBlock` kamen am 19.10.2026 hinzu; später am selben Tag erhielt `embedding` die Werte `ipv4-compatible` und `teredo`, `specialBlock` deckte fortan jede Registry-Zeile ab, `embeddedSpecialBlock`, `teredo` und `anycastService` kamen hinzu, und `canonicalIp` wechselte bei einer IPv4-kompatiblen Adresse zur gemischten Notation (`::127.0.0.1`).

## Quellen

Alle abgerufen am 19.10.2026.

- [IANA, IPv4 Special-Purpose Address Space, CSV, Registry zuletzt aktualisiert am 09.10.2025](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) (abgerufen am 26.10.2026): alle 25 Zeilen; Fußnote [2] aus der [XML-Fassung](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xml)
- [IANA, IPv6 Special-Purpose Address Space, CSV, Registry zuletzt aktualisiert am 09.10.2025](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv) (abgerufen am 26.10.2026): alle 25 Zeilen; Fußnoten [1] bis [4] und die Definition von Globally Reachable aus der [XML-Fassung](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xml)
- [RFC 4291, IP Version 6 Addressing Architecture, February 2006](https://www.rfc-editor.org/rfc/rfc4291.txt) (abgerufen am 19.10.2026): Abschnitt 2.2 (Textformen), Abschnitte 2.5.5.1 und 2.5.5.2 (IPv4-kompatibel und IPv4-gemappt)
- [RFC 5952, A Recommendation for IPv6 Address Text Representation, August 2010](https://www.rfc-editor.org/rfc/rfc5952.txt) (abgerufen am 19.10.2026): Abschnitte 4 und 5
- [RFC 6052, IPv6 Addressing of IPv4/IPv6 Translators, October 2010](https://www.rfc-editor.org/rfc/rfc6052.txt) (abgerufen am 19.10.2026): Abschnitte 2.1 bis 2.4 und 3.1
- [RFC 8215, Local-Use IPv4/IPv6 Translation Prefix, August 2017](https://www.rfc-editor.org/rfc/rfc8215.txt) (abgerufen am 19.10.2026): Abschnitte 1, 4.1 und 5
- [RFC 3056, Connection of IPv6 Domains via IPv4 Clouds, February 2001](https://www.rfc-editor.org/rfc/rfc3056.txt) (abgerufen am 19.10.2026): Abschnitt 2
- [RFC 4380, Teredo: Tunneling IPv6 over UDP through Network Address Translations (NATs), February 2006](https://www.rfc-editor.org/rfc/rfc4380.txt) (abgerufen am 19.10.2026): Abschnitte 2.6 und 4
- [RFC 5991, Teredo Security Updates, September 2010](https://www.rfc-editor.org/rfc/rfc5991.txt) (abgerufen am 19.10.2026): Abschnitt 3.1
- [RFC 6751, Native IPv6 behind IPv4-to-IPv4 NAT Customer Premises Equipment (6a44), October 2012](https://www.rfc-editor.org/rfc/rfc6751.txt) (abgerufen am 19.10.2026): Abschnitte 5 und 8
- [RFC 7526, Deprecating the Anycast Prefix for 6to4 Relay Routers, May 2015](https://www.rfc-editor.org/rfc/rfc7526.txt) (abgerufen am 19.10.2026): Abschnitte 4 und 7
- [RFC 7723, Port Control Protocol (PCP) Anycast Addresses, January 2016](https://www.rfc-editor.org/rfc/rfc7723.txt) (abgerufen am 19.10.2026): Abstract und Abschnitt 1
- [RFC 8155, Traversal Using Relays around NAT (TURN) Server Auto Discovery, April 2017](https://www.rfc-editor.org/rfc/rfc8155.txt) (abgerufen am 19.10.2026): Abschnitte 6 und 8
- [RFC 9665, Service Registration Protocol for DNS-Based Service Discovery, June 2025](https://www.rfc-editor.org/rfc/rfc9665.txt) (abgerufen am 19.10.2026): Abschnitt 10.5
- [RFC Errata 1752 for RFC 5180, IPv6 Benchmarking Methodology for Network Interconnect Devices](https://www.rfc-editor.org/errata/eid1752) (abgerufen am 19.10.2026): das korrigierte Benchmarking-Präfix
- [RFC 7343, An IPv6 Prefix for Overlay Routable Cryptographic Hash Identifiers Version 2 (ORCHIDv2), September 2014](https://www.rfc-editor.org/rfc/rfc7343.txt) (abgerufen am 19.10.2026): Abstract
- [RFC 9374, DRIP Entity Tag (DET) for Unmanned Aircraft System Remote ID (UAS RID), March 2023](https://www.rfc-editor.org/rfc/rfc9374.txt) (abgerufen am 19.10.2026): Abschnitt 1
- [RFC 9602, Segment Routing over IPv6 (SRv6) Segment Identifiers in the IPv6 Addressing Architecture, October 2024](https://www.rfc-editor.org/rfc/rfc9602.txt) (abgerufen am 19.10.2026): Abschnitte 5 und 6
- [RFC 9780, Bidirectional Forwarding Detection (BFD) for Multipoint Networks over Point-to-Multipoint MPLS Label Switched Paths (LSPs), May 2025](https://www.rfc-editor.org/rfc/rfc9780.txt) (abgerufen am 19.10.2026; MPLS steht für Multiprotocol Label Switching): Abstract
- [RFC 3849, IPv6 Address Prefix Reserved for Documentation, July 2004](https://www.rfc-editor.org/rfc/rfc3849.txt) (abgerufen am 19.10.2026): Abschnitte 2 und 3
- [RFC 9637, Expanding the IPv6 Documentation Space, August 2024](https://www.rfc-editor.org/rfc/rfc9637.txt) (abgerufen am 19.10.2026): Abstract und IANA Considerations
- [RFC 6666, A Discard Prefix for IPv6, August 2012](https://www.rfc-editor.org/rfc/rfc6666.txt) (abgerufen am 19.10.2026): Abschnitte 2 und 4
- [RFC 7050, Discovery of the IPv6 Prefix Used for IPv6 Address Synthesis, November 2013](https://www.rfc-editor.org/rfc/rfc7050.txt) (abgerufen am 19.10.2026): Abschnitt 2.2
- [WHATWG, URL Standard, Living Standard, zuletzt aktualisiert am 19. Oktober 2026](https://url.spec.whatwg.org/) (abgerufen am 19.10.2026): der IPv6-Serializer
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, January 2005](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 01.11.2026): Abschnitt 3.5, das Fragment, und Abschnitt 3.2.1, das Passwort in der Userinfo
