## Was das Tool tut

Analysieren Sie eine IPv6-Adresse oder ein Präfix und betrachten Sie es von allen Seiten: die kanonische Kurzform und die vollständig ausgeschriebene Form, die Art der Adresse, die Präfixberechnung für einen Block, eine Hardware-MAC-Adresse, falls eine in der Interface-ID eingebettet ist, die Felder einer Teredo-Adresse und der Reverse-DNS-Name, der auf sie zurückverweist. Alles wird in Ihrem Browser berechnet.

## Kanonische und ausgeschriebene Form

Eine IPv6-Adresse hat 128 Bit, geschrieben als acht Gruppen aus je vier Hexziffern, getrennt durch Doppelpunkte. Dieselbe Adresse lässt sich auf viele Arten schreiben, daher legt RFC 5952 eine kanonische Form fest: Kleinbuchstaben, ohne führende Nullen in jeder Gruppe und mit der einen längsten Folge von Nullgruppen zu `::` zusammengezogen. Das Tool zeigt diese kanonische Form und daneben die vollständig ausgeschriebene Form, in der jede Gruppe voll dasteht; diese Fassung brauchen Sie, wenn Sie alle 128 Bit sehen oder Adressen spaltenweise untereinanderlegen wollen. Zum Beispiel ist `2001:0db8:0000:0000:0000:0000:0000:0001` die ausgeschriebene Form von `2001:db8::1` und wird wieder zu ihr kanonisiert. Eine IPv4-gemappte Adresse behält die gemischte Schreibweise, die RFC 5952, Abschnitt 5 empfiehlt (`::ffff:192.0.2.128`), während die ausgeschriebene Form immer aus acht Hexgruppen besteht.

## Einordnung und Präfixberechnung

Nicht jede Adresse ist eine normale öffentliche. Das Tool ordnet Bereiche für besondere Verwendung ein, jeden geprüft gegen die IANA IPv6 Special-Purpose Address Registry:

| Block | Anzeige | Definiert in |
| --- | --- | --- |
| `::1/128` | Loopback | RFC 4291 |
| `::/128` | Unspezifiziert | RFC 4291 |
| `::ffff:0:0/96` | IPv4-mapped | RFC 4291 |
| `64:ff9b::/96` | IPv4/IPv6-Übersetzung | RFC 6052 |
| `64:ff9b:1::/48` | IPv4/IPv6-Übersetzung (lokale Nutzung) | RFC 8215 |
| `100::/64` | Discard-Only | RFC 6666 |
| `2001::/32` | Teredo | RFC 4380 |
| `2001:db8::/32` | Dokumentation | RFC 3849 |
| `2002::/16` | 6to4 | RFC 3056 |
| `3fff::/20` | Dokumentation | RFC 9637 |
| `5f00::/16` | Segment Routing (SRv6) SIDs | RFC 9602 |
| `fc00::/7` | Unique Local | RFC 4193 |
| `fe80::/10` | Link-Local Unicast | RFC 4291 |
| `ff00::/8` | Multicast | RFC 4291 |

Alles andere in `2000::/3` wird als Global Unicast gemeldet. Die Registry hat weitere Zeilen (zum Beispiel `2001:2::/48` für Benchmarking und `2001:20::/28` für ORCHIDv2), die diese Tabelle noch nicht aufführt; eine Adresse in einem dieser Bereiche erscheint daher als Global Unicast.

Geben Sie ein Präfix an, berechnet das Tool die Netzwerkadresse des Blocks, seine erste und letzte Adresse und wie viele Adressen er umfasst: dieselbe Arithmetik, die der CIDR- und Subnetzrechner für IPv4 durchführt, nur auf einem 128-Bit-Feld.

## Multicast: Scope, Flags und Source-Specific Multicast

Eine Multicast-Adresse beginnt mit `ff`, gefolgt von einem 4-Bit-Flag-Feld und einem 4-Bit-Scope (RFC 4291, Abschnitt 2.7). Das Tool benennt den Scope nach der Scope-Registry der IANA: interface-local (1), link-local (2), realm-local (3, benannt durch RFC 7346), admin-local (4), site-local (5), organization-local (8) und global (E). Die Werte 0 und F sind reserviert und erscheinen als `reserviert (Scope 0)` und `reserviert (Scope F)`; die Werte 6, 7 und 9 bis D sind nicht zugewiesen und erscheinen zum Beispiel als `nicht zugewiesen (Scope 6)`. So liest sich `ff0f::1` nicht mehr wie ein gültiger Scope.

Das Flag-Feld wird Bit für Bit als X, R, P und T gelesen (RFC 7371, Abschnitt 4): T=1 kennzeichnet eine transiente Adresse, P=1 eine Adresse, die auf einem Unicast-Präfix beruht (RFC 3306), R=1 eine Adresse mit eingebettetem Rendezvous Point (RFC 3956). `ff02::1` zeigt `0000 (X=0, R=0, P=0, T=0)`.

Sind die Flags `0011` und die nächsten 16 Bit null, liegt die Adresse in `ff3x::/32`, das RFC 4607, Abschnitt 1 für Source-Specific Multicast (SSM) reserviert: „all SSM addresses must have P=1, T=1, and plen=0“. Das Tool kennzeichnet sie dann als Source-Specific Multicast und nennt anhand von RFC 4607 und der IANA-Registry den Teil des Raums der Gruppen-IDs, in dem sie liegt: `ff3x::0:0` bis `ff3x::3fff:ffff` sind ungültig, `ff3x::4000:0` bis `ff3x::7fff:ffff` sind für die Zuteilung durch die IANA reserviert, `ff3x::8000:0` bis `ff3x::ffff:ffff` dienen der dynamischen Zuweisung, und eine Adresse, deren Feld für das Netzwerkpräfix nicht null ist (außerhalb von `ff3x::/96`), ist für künftige Nutzung durch SSM reserviert und derzeit ungültig. Zum Beispiel ist `ff3e::8000:1` SSM mit globalem Scope im dynamischen Bereich.

## Teredo

Eine Teredo-Adresse packt einen Tunnelendpunkt in die 128 Bit (RFC 4380, Abschnitt 4): das 32-Bit-Präfix `2001::/32`, die IPv4-Adresse des Teredo-Servers im Klartext (Bits 32 bis 63), 16 Flag-Bits, dann externer UDP-Port und externe IPv4-Adresse des Clients, beide verschleiert: „Each bit in the address and port number is reversed“, also ein exklusives Oder mit `0xFFFF` für den Port und `0xFFFFFFFF` für die Adresse. Das Tool macht das XOR rückgängig und zeigt den Server, die Client-Adresse, den Client-Port und die Flags. Die Flags liest es mit dem Layout aus RFC 5991, Abschnitt 3.1 (`|C|z|Random1|U|G|Random2|`) und benennt das Cone-Bit C sowie die Bits U und G; die zwölf zufälligen Bits bleiben, wie sie sind.

Durchgerechnetes Beispiel mit Dokumentationsadressen: `2001:0:c000:22d:3c5a:63bf:34ff:8eeb` wird dekodiert zu Server `192.0.2.45` (`c000:022d`), Flags `0x3c5a` (C=0, U=0, G=0), Client-Port `40000` (`63bf` XOR `ffff` = `9c40`) und Client `203.0.113.20` (`34ff:8eeb` XOR `ffff:ffff` = `cb00:7114`). Das Modul `ipaddress` von Python liefert über seine Eigenschaft `teredo` denselben Server und Client. Der Decoder läuft für eine einzelne Adresse (ohne Präfixlänge oder mit `/128`); bei einem Block wie `2001::/32` ordnet er den Bereich ein und führt nur die Präfixberechnung durch.

## EUI-64 und Reverse-DNS

Zwei Extras ergeben sich aus der Adresse. Wurde die Interface-ID mit dem modifizierten EUI-64-Verfahren (RFC 4291, Anhang A) aus der 48-Bit-MAC einer Netzwerkkarte gebildet, stellt das Tool diese MAC wieder her; genau deshalb gibt es Privacy Extensions, die dieses Leck vermeiden. Außerdem bildet es den Reverse-DNS-Namen unter `ip6.arpa`: die Nibbles der Adresse in umgekehrter Reihenfolge, durch Punkte getrennt, mit `.ip6.arpa` am Ende; diesen Namen verwendet eine PTR-Abfrage für die Adresse.

## Verwendung

Fügen Sie eine IPv6-Adresse ein, um ihre kanonische und ausgeschriebene Form, ihre Einordnung, etwaige Multicast-Flags und den Scope, etwaige Teredo-Felder, eine eingebettete MAC und ihren Reverse-DNS-Namen zu sehen, oder fügen Sie ein Präfix ein, um die Blockberechnung hinzuzufügen. Die Analyse ist deterministisch und liest nur die Adresse, die Sie angeben.

## Ergebnisse teilen

Unter der kanonischen und der ausgeschriebenen Form erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält das Adressfeld so, wie eingegeben (`#input=2001%3Adb8%3A0%3A0%3A8%3A800%3A200c%3A417a`), und sonst nichts. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; eine Adresse oder ein Präfix ist weit kürzer.
- **Öffnen eines Links.** Die Adresse füllt das Feld wie beim Tippen, und die Seite dekodiert sie erneut; Text, der keine Adresse ist, erhält die eigene Meldung der Seite. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.

## API

Dieselbe Engine beantwortet die Operation `/api/v1/ipv6` der HTTP-API der Website, Feld für Feld beschrieben im OpenAPI-Vertrag auf der [API-Seite](/api), mit Beispielen aus den Referenzvektoren (Golden Vectors). Der Vertrag gibt auch an, ob diese Website die API bereitstellt.

- **Anfrage.** Die Adresse oder das Präfix als Text: `?input=` bei GET oder als Body eines POST.
- **Antwort.** `input`, `bytes` (16 Zahlen), `compressed`, `expanded`, `prefixLength`, `classification` (`type`, `detail` und `isMulticast`; für jede Multicast-Adresse außerdem `scope`, `scopeStatus` und `flags`; `ssmRange` für ff3x::/32; `embeddedIpv4` für die IPv4-gemappte und die IPv4-kompatible Form), `prefix` (die Präfixarithmetik oder `null`), `eui64Mac`, `teredo` (`server`, `flags`, `cone`, `port` und `client` oder `null`) und `reverseDns`. Für `2001:0:c000:22d:3c5a:63bf:34ff:8eeb` antwortet die API mit `teredo.server` `192.0.2.45`, `teredo.port` 40000 und `teredo.client` `203.0.113.20`.
- **Fehler.** HTTP 400, `invalid_input`, mit der Meldung `empty`, `format` oder `prefix`.

`scopeStatus`, `flags`, `ssmRange` und `teredo` kamen am 19.10.2026 hinzu.

## Quellen

- [IANA IPv6 Special-Purpose Address Registry, CSV (Registry zuletzt aktualisiert am 09.10.2025)](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv) (abgerufen am 19.10.2026)
- [IANA IPv6 Multicast Address Space Registry: Scopes und SSM-Gruppen-IDs (zuletzt aktualisiert am 07.04.2026)](https://www.iana.org/assignments/ipv6-multicast-addresses/ipv6-multicast-addresses.txt) (abgerufen am 19.10.2026)
- [RFC 4291: IP Version 6 Addressing Architecture, Abschnitt 2.7 und Anhang A](https://www.rfc-editor.org/rfc/rfc4291) (abgerufen am 19.10.2026)
- [RFC 5952: A Recommendation for IPv6 Address Text Representation](https://www.rfc-editor.org/rfc/rfc5952) (abgerufen am 19.10.2026)
- [RFC 7346: IPv6 Multicast Address Scopes](https://www.rfc-editor.org/rfc/rfc7346) (abgerufen am 19.10.2026)
- [RFC 7371: Updates to the IPv6 Multicast Addressing Architecture, Abschnitt 4](https://www.rfc-editor.org/rfc/rfc7371) (abgerufen am 19.10.2026)
- [RFC 3306: Unicast-Prefix-based IPv6 Multicast Addresses, Abschnitt 6](https://www.rfc-editor.org/rfc/rfc3306) (abgerufen am 19.10.2026)
- [RFC 3956: Embedding the Rendezvous Point (RP) Address in an IPv6 Multicast Address](https://www.rfc-editor.org/rfc/rfc3956) (abgerufen am 19.10.2026)
- [RFC 4607: Source-Specific Multicast for IP, Abschnitt 1](https://www.rfc-editor.org/rfc/rfc4607) (abgerufen am 19.10.2026)
- [RFC 4380: Teredo: Tunneling IPv6 over UDP through Network Address Translations (NATs), Abschnitt 4](https://www.rfc-editor.org/rfc/rfc4380) (abgerufen am 19.10.2026)
- [RFC 5991: Teredo Security Updates, Abschnitt 3.1](https://www.rfc-editor.org/rfc/rfc5991) (abgerufen am 19.10.2026)
- [RFC 9637: Expanding the IPv6 Documentation Space](https://www.rfc-editor.org/rfc/rfc9637) (abgerufen am 19.10.2026)
- [RFC 9602: Segment Routing over IPv6 (SRv6) Segment Identifiers in the IPv6 Addressing Architecture](https://www.rfc-editor.org/rfc/rfc9602) (abgerufen am 19.10.2026)
- [RFC 8215: Local-Use IPv4/IPv6 Translation Prefix](https://www.rfc-editor.org/rfc/rfc8215) (abgerufen am 19.10.2026)
- [RFC 3849: IPv6 Address Prefix Reserved for Documentation](https://www.rfc-editor.org/rfc/rfc3849) (abgerufen am 19.10.2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
