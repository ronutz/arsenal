## Was das Tool tut

Eine MAC-Adresse ist eine 48-Bit-Hardwareadresse, meist als sechs Hex-Bytes geschrieben, etwa `00:1b:54:11:22:33`. Die ersten drei Bytes sind die OUI (Organizationally Unique Identifier), die die IEEE einem Hersteller zuteilt. Das Tool nimmt eine MAC (in jedem gängigen Format) oder eine bloße OUI entgegen, sucht die OUI in einem eingebetteten Snapshot der MA-L-Registry der IEEE, um den Hersteller zu nennen, und wertet die zwei aussagekräftigen Bits des ersten Bytes aus. Es erkennt außerdem Adressen, deren Bedeutung ein Standard festlegt und nicht ein Hersteller: Multicast-Abbildungen, virtuelle VRRP-Router, Zuteilungen der IANA und bekannte Gruppenadressen. Alles läuft in Ihrem Browser.

## Die zwei Bits, auf die es ankommt

Das allererste Byte einer MAC enthält in seinen niederwertigen Bits zwei Flags:

- Das **I/G-Bit** (niedrigstwertiges Bit) steht bei 0 für Unicast und bei 1 für Multicast. Eine Multicast-Adresse ist eine Gruppenadresse, keine einzelne Schnittstelle.
- Das **U/L-Bit** (zweitniedrigstwertiges Bit) steht bei 0 für universell und bei 1 für lokal verwaltet. Eine universell verwaltete Adresse ist global eindeutig und stammt aus der OUI eines Herstellers; eine lokal verwaltete Adresse wurde per Software gesetzt (von einem Hypervisor, einer gebündelten Schnittstelle, einer zufälligen WLAN-MAC) und hat keinen Hersteller.

`02:...` ist also lokal verwaltet (es gibt keinen Hersteller zu finden), und `01:...` ist Multicast. Die eine standardisierte Ausnahme ist `33-33`, siehe unten: Hier ist das Local-Bit gesetzt, und doch ist es die Multicast-Abbildung von IPv6, keine per Software gewählte Adresse (RFC 9542, Abschnitt 2.3.1).

## Multicast-Abbildungen

- **IPv4-Multicast, `01-00-5E-00-00-00` bis `01-00-5E-7F-FF-FF`.** RFC 1112, Abschnitt 6.4, bildet eine Gruppe ab durch „placing the low-order 23-bits of the IP address into the low-order 23 bits of the Ethernet multicast address 01-00-5E-00-00-00“, also indem die niederwertigen Bits der IP-Adresse in die Ethernet-Multicast-Adresse übernommen werden. Eine Gruppenadresse hat 28 signifikante Bit; 5 Bit gehen also verloren, und 32 IPv4-Gruppen teilen sich jede MAC. Die Seite nennt den Grund und verlinkt auf die Zuordnung von Multicast-Gruppen zu MAC-Adressen, mit bereits eingetragener MAC; dort stehen alle 32 mit ihren IANA-Namen: `01:00:5e:00:00:01` teilen sich `224.0.0.1`, `224.128.0.1`, `225.0.0.1` und so weiter bis `239.128.0.1`. Die API liefert die 32 in `ipv4Groups`. Die obere Hälfte des Blocks ist kein IPv4: Die Registry Ethernet Numbers der IANA weist `01-00-5E-80-00-00` bis `8F-FF-FF` dem Multicast von MPLS (Multiprotocol Label Switching) zu (RFC 5332), und das Tool sagt das.
- **IPv6-Multicast, `33-33-xx-xx-xx-xx`.** RFC 2464, Abschnitt 7, sendet ein IPv6-Multicast-Paket an „the Ethernet multicast address whose first two octets are the value 3333 hexadecimal and whose last four octets are the last four octets of DST“, also an eine Ethernet-Multicast-Adresse, deren letzte vier Oktette die der Zieladresse (DST) sind. Das Tool zeigt diese letzten 32 Bit; `33:33:00:00:00:01` enthält also `0000:0001`, das Ende von `ff02::1`.

## VRRP und andere Zuteilungen der IANA

Die IANA hält die OUI `00-00-5E`. RFC 9568, Abschnitt 7.3, setzt die MAC eines virtuellen VRRP-Routers für IPv4 als `00-00-5E-00-01-{VRID}` und für IPv6 als `00-00-5E-00-02-{VRID}` zusammen, wobei die VRID „An integer value (1-255)“ ist, also eine Ganzzahl. Das Tool zeigt zum Beispiel für `00:00:5e:00:01:01` `Virtueller VRRP-Router (IPv4), VRID 1` und kennzeichnet eine VRID 0 als außerhalb dieses Bereichs.

Auch die übrigen benannten Zeilen der Registry Ethernet Numbers der IANA werden erkannt, jede mit dem RFC, den die Registry angibt:

| Adresse oder Bereich | Bedeutung | Referenz |
| --- | --- | --- |
| `00-00-5E-00-00-00` bis `00-00-5E-00-00-FF` | Reserved | RFC 9542 |
| `00-00-5E-00-52-00`, `-01` | PacketPWEthA, PacketPWEthB | RFC 6658 |
| `00-00-5E-00-52-02` | BFD for VXLAN | RFC 8971 |
| `00-00-5E-00-52-13` | Proxy Mobile IPv6 | RFC 6543 |
| `00-00-5E-00-53-00` bis `00-00-5E-00-53-FF` | Documentation (unicast) | RFC 9542 |
| `00-00-5E-90-01-00` und `01-00-5E-90-01-00` | TRILL OAM | RFC 7455 |
| `01-00-5E-80-00-00` bis `01-00-5E-8F-FF-FF` | MPLS Multicast | RFC 5332 |
| `01-00-5E-90-00-00` | MPLS-TP p2p | RFC 7213 |
| `01-00-5E-90-00-01` | BFD on Link Aggregation Group (LAG) interfaces | RFC 7130 |
| `01-00-5E-90-00-02`, `-03` | AllL1MI-ISs, AllL2MI-ISs | RFC 8202 |
| `01-00-5E-90-10-00` bis `01-00-5E-90-10-FF` | Documentation (multicast) | RFC 9542 |

## Bekannte Gruppenadressen

| Adresse | Name | Standard |
| --- | --- | --- |
| `01-80-C2-00-00-00` | Bridge Group address / Nearest Customer Bridge group address | IEEE 802.1Q, 802.1X, 802.1AE, 802.1AX |
| `01-80-C2-00-00-01` | IEEE MAC-specific Control Protocols group address | IEEE 802.1Q |
| `01-80-C2-00-00-02` | IEEE 802.3 Slow_Protocols_Multicast address | IEEE 802.1Q, 802.1AX |
| `01-80-C2-00-00-03` | Nearest non-TPMR Bridge group address / IEEE Std 802.1X PAE address | IEEE 802.1Q, 802.1X, 802.1AE, 802.1AX, 802.1BR |
| `01-80-C2-00-00-04` | IEEE MAC-specific Control Protocols group address | IEEE 802.1Q |
| `01-80-C2-00-00-05`, `-06` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-07` | MEF Forum ELMI protocol group address (not exclusively reserved for this purpose) | IEEE 802.1Q |
| `01-80-C2-00-00-08` | Provider Bridge group address | IEEE 802.1Q |
| `01-80-C2-00-00-09`, `-0A` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-0B` | EDE-SS PEP Address | IEEE 802.1Q, 802.1X, 802.1AE |
| `01-80-C2-00-00-0C` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-0D` | Provider Bridge MVRP address | IEEE 802.1Q |
| `01-80-C2-00-00-0E` | Individual LAN Scope group address / Nearest Bridge group address | IEEE 802.1Q, 802.1X, 802.1AE, 802.1AS |
| `01-80-C2-00-00-0F` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-14` | All Level 1 Intermediate Systems (IS-IS AllL1ISs) | ISO/IEC 10589 |
| `01-80-C2-00-00-15` | All Level 2 Intermediate Systems (IS-IS AllL2ISs) | ISO/IEC 10589 |
| `09-00-2B-00-00-04` | All End System Network Entities (ES-IS AllEndSystems) | ISO 9542 |
| `09-00-2B-00-00-05` | All Intermediate System Network Entities (AllIntermediateSystems) | ISO 9542 |

Die Namen sind die der IEEE Registration Authority, aus ihrer öffentlichen Liste der standardisierten Gruppen-MAC-Adressen. Die IS-IS-Werte stimmen mit der Konstantentabelle von RFC 1142 überein, der Neuveröffentlichung von ISO DP 10589 aus dem Jahr 1990. Für die 16 Adressen `01-80-C2-00-00-00` bis `0F` hält das Tutorial der IEEE zu standardisierten Gruppenadressen fest, dass an sie gesendete Frames „are not relayed by MAC bridges conforming to IEEE 802.1D“, also von normgerechten MAC-Bridges nicht weitergeleitet werden, und das Tool ergänzt diesen Hinweis. Andere Gruppenadressen in `01-80-C2` (zum Beispiel der Bereich `01-80-C2-00-00-30` bis `3F` für CCM- und Linktrace-Nachrichten) stehen noch nicht in der Tabelle und erscheinen als nicht im MA-L-Snapshot enthalten.

## Akzeptierte Formate

Die Schreibweisen mit Doppelpunkt (`00:1b:54:...`), mit Bindestrich (`00-1b-54-...`), die Punktschreibweise von Cisco (`001b.5411.2233`) und die ungetrennte (`001b5411...`) funktionieren alle, in Groß- oder Kleinschreibung, ebenso eine bloße OUI aus sechs Hexziffern. Eine bloße OUI wird nur dann einer Standardbedeutung zugeordnet, wenn drei Bytes sie entscheiden (`33-33-xx` ist immer IPv6-Multicast); `01-00-5E` allein könnte IPv4- oder MPLS-Multicast sein, daher braucht das Tool die vollständige Adresse.

## Zu den Daten

Die Herstellernamen stammen aus der öffentlichen MA-L-Liste (OUI) der IEEE, hier eingebettet als Snapshot eines bestimmten Zeitpunkts. Weil es ein Snapshot ist, fehlt ein sehr kürzlich vergebener Block womöglich noch, und dieser Build deckt die MA-L-Registry (24 Bit) ab, nicht die kleineren Blöcke von MA-M (28 Bit) oder MA-S (36 Bit). Der Snapshot wird erst bei der ersten Suche nachgeladen; die Seite öffnet also schnell, und bei einer Suche wird nie etwas von einem Server abgerufen. Die oben genannten, von Standards festgelegten Adressen sind eine kleine feste Tabelle im Code, jede Zeile mit ihrer Quelle verknüpft.

## Verwendung

Geben Sie eine MAC-Adresse oder eine OUI ein oder fügen Sie sie ein. Eine lokal verwaltete oder unbekannte Adresse wird ehrlich als solche gemeldet, statt dass geraten wird.

## Ergebnisse teilen

Unter der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält die MAC-Adresse oder OUI so, wie eingegeben (`#input=00%3A1b%3A54%3A11%3A22%3A33`), und sonst nichts. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; eine Adresse ist weit kürzer.
- **Öffnen eines Links.** Der Link ist dieselbe Adresse, mit der auch andere Seiten diesem Tool eine MAC-Adresse übergeben: Der Wert füllt das Feld und wird wie beim Einfügen nachgeschlagen (die Herstellertabelle wird bei der ersten Suche von dieser Website geladen, wie beim Einfügen auch). Wie bei jedem Link in dieses Tool bleibt der Wert nach dem `#`, bis Sie das Feld ändern oder leeren, und verschwindet dann ohne Anfrage aus der Adresse.

## API

Dieselbe Engine beantwortet die Operation `/api/v1/oui-lookup` der HTTP-API der Website, Feld für Feld beschrieben im OpenAPI-Vertrag auf der [API-Seite](/api), mit Beispielen aus den Referenzvektoren. Der Vertrag gibt auch an, ob diese Website die API bereitstellt.

- **Anfrage.** Die MAC-Adresse oder OUI als Text, in jeder Schreibweise, die die Seite akzeptiert.
- **Antwort.** `ok`, `input`, `hex`, `formatted`, `oui`, `ouiFormatted`, `vendor` (oder `null`), `multicast`, `local`, `isOuiOnly`, `notes` (Sätze auf Englisch) und, wenn ein Standard oder eine Registry der Adresse ihre Bedeutung gibt, `wellKnown`: `kind` (`ipv4-multicast`, `ipv6-multicast`, `vrrp-ipv4`, `vrrp-ipv6`, `iana-block` oder `group-address`), `name`, `standard` und je nach Art `ipv4Groups` (die 32 Gruppen), `ipv6Low32`, `vrid` oder `bridgeFiltered`.
- **Fehler.** Eine Eingabe, die keine MAC und keine OUI ist, ist kein HTTP-Fehler: Die API antwortet mit `ok: false` und `error.message`.

`wellKnown` kam am 19.10.2026 hinzu.

## Quellen

- [IEEE Registration Authority: MA-L (OUI) public listing](https://standards-oui.ieee.org/oui/oui.csv) (Snapshot vom 10.07.2026)
- [RFC 1112: Host Extensions for IP Multicasting, Abschnitt 6.4](https://www.rfc-editor.org/rfc/rfc1112) (abgerufen am 19.10.2026)
- [RFC 2464: Transmission of IPv6 Packets over Ethernet Networks, Abschnitt 7](https://www.rfc-editor.org/rfc/rfc2464) (abgerufen am 19.10.2026)
- [RFC 9568: Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6, Abschnitt 7.3](https://www.rfc-editor.org/rfc/rfc9568) (abgerufen am 19.10.2026)
- [RFC 9542: IANA Considerations and IETF Protocol and Documentation Usage for IEEE 802 Parameters, Abschnitte 2.1.3, 2.1.4 und 2.3.1](https://www.rfc-editor.org/rfc/rfc9542) (abgerufen am 19.10.2026)
- [Registry Ethernet Numbers der IANA: IANA Unicast and Multicast 48-bit MAC Addresses (zuletzt aktualisiert am 13.10.2026)](https://www.iana.org/assignments/ethernet-numbers/ethernet-numbers.txt) (abgerufen am 19.10.2026)
- [IEEE Registration Authority: Standards Group MAC public listing](https://standards.ieee.org/products-programs/regauth/grpmac/public/) (abgerufen am 19.10.2026)
- [IEEE Registration Authority: Standard Group MAC Addresses: A Tutorial Guide (PDF)](https://standards.ieee.org/wp-content/uploads/import/documents/tutorials/macgrp.pdf) (abgerufen am 19.10.2026)
- [RFC 1142: OSI IS-IS Intra-domain Routing Protocol (Neuveröffentlichung von ISO DP 10589)](https://www.rfc-editor.org/rfc/rfc1142) (abgerufen am 19.10.2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
