## Was das Tool tut

Der CIDR- und Subnetzrechner arbeitet mit IPv4-Blöcken in CIDR-Notation, also einer Adresse mit Präfixlänge wie `192.168.1.0/24`. Er hat vier Modi, die Sie über die Tabs oben wählen:

- **Subnetz** analysiert einen Block: Netzwerkadresse, letzte Adresse, Netzmaske, Wildcard-Maske, erster und letzter nutzbarer Host, Gesamtzahl der Adressen und nutzbare Hosts, die Adressbits und die Bereiche für besondere Zwecke, in die der Block fällt oder die er überlappt.
- **VLSM** schneidet Subnetze variabler Länge aus einem übergeordneten Block, passend zu einer Liste von Host-Anzahlen.
- **Supernetz** fasst eine Liste von Präfixen zur kleinsten Menge von Blöcken zusammen, die genau dieselben Adressen abdeckt, und zum kleinsten einzelnen Präfix, das sie alle abdeckt.
- **Überlappung / Lücke** findet, welche Präfixe einer Liste sich überlappen oder einander enthalten, und listet bei angegebenem Bereich den Adressraum darin auf, den kein Präfix abdeckt.

Jede Berechnung läuft in Ihrem Browser; nichts, was Sie eingeben, wird gesendet. Ein Block, den eine andere Seite übergibt, steht in der Adresse nach dem `#`, einem Teil, den keine Anfrage überträgt; siehe **Links in den Rechner** weiter unten.

## Modus „Subnetz“

Eine Präfixlänge `/n` legt die ersten `n` Bits der 32-Bit-Adresse als Netzwerkteil fest und lässt `32 - n` Bits für Hosts, sodass der Block `2^(32 - n)` Adressen umfasst (RFC 4632, Abschnitt 3.1). Bei einem Block von /0 bis /30 reserviert das Tool zwei davon: die Adresse, deren Host-Bits alle 0 sind (die Netzwerkadresse), und die, deren Host-Bits alle 1 sind (den Directed Broadcast). RFC 1122, Abschnitt 3.2.1.3, erlaubt im Feld der Host-Nummer außerhalb der dort aufgeführten Sonderfälle weder 0 noch lauter Einsen, daher hat ein Block von /0 bis /30 `2^(32 - n) - 2` nutzbare Hosts.

Ein /31 und ein /32 reservieren nichts. Laut RFC 3021, Abschnitt 2.1, gilt auf einem Punkt-zu-Punkt-Link mit 31-Bit-Maske für beide Adressen: „MUST be interpreted as host addresses“ (als Host-Adressen zu interpretieren). Deshalb zählt das Tool in einem /31 zwei nutzbare Hosts, bezeichnet die erste Adresse als Netzwerkkennung, die auch ein nutzbarer Host ist, und die letzte als Adresse ohne Directed Broadcast. Ein /32 ist ein einzelner Host.

Eine Adresse mit gesetzten Host-Bits, etwa `192.168.1.77/24`, wird als der Block gelesen, zu dem sie gehört: Die Zeile der Netzwerkadresse zeigt `192.168.1.0`. Der Schieberegler **Präfixlänge** schreibt das Präfix der aktuellen Adresse um und rechnet sofort neu. Die Schaltfläche **Beispiel** lädt `192.168.1.0/24`.

Durchgerechnete Beispiele, so wie das Tool sie ausgibt:

- `192.168.1.0/24`: Netzwerk `192.168.1.0`, Broadcast `192.168.1.255`, nutzbar `192.168.1.1` bis `192.168.1.254`, 254 Hosts, Netzmaske `255.255.255.0`, Wildcard `0.0.0.255`.
- `10.0.0.0/30`: Netzwerk `10.0.0.0`, Broadcast `10.0.0.3`, nutzbar `10.0.0.1` bis `10.0.0.2`, 2 Hosts, Netzmaske `255.255.255.252`.
- `10.0.0.0/31`: zwei nutzbare Adressen, `10.0.0.0` und `10.0.0.1`, keine Netzwerk- oder Broadcast-Adresse reserviert.

## Einordnung in Bereiche für besondere Zwecke

Unter den Ergebnissen des Subnetz-Modus vergleicht das Tool den Block mit jeder Zeile der Registry IPv4 Special-Purpose Address Space der IANA, Stand des Downloads vom 26.10.2026 (die Registry wurde zuletzt am 09.10.2025 aktualisiert; der SSRF-URL-Klassifikator liest dieselbe Kopie ihrer Zeilen), dazu einer Zeile für Multicast. Es gibt eine von drei Bewertungen aus:

- **Innerhalb eines Bereichs für besondere Zwecke**: Der ganze Block liegt in einem aufgeführten Bereich. Der Satz nennt den spezifischsten, zum Beispiel liegt `192.168.1.0/24` in `192.168.0.0/16`, Private-Use (RFC 1918).
- **Teilweise für besondere Zwecke**: Der Block enthält einen oder mehrere aufgeführte Bereiche und außerdem andere Adressen. Zwei CIDR-Blöcke sind entweder ineinander verschachtelt oder disjunkt, daher kann ein Block einen Bereich nur auf diese Weise teilweise überlappen. Der Satz nennt die Anzahl, zum Beispiel bei `10.0.0.0/7`: 16.777.216 von 33.554.432 Adressen fallen in `10.0.0.0/8`. Verschachtelte Zeilen werden einmal gezählt: `192.0.0.0/23` enthält `192.0.0.0/24` und dessen sechs spezifischere Zeilen, und das Tool meldet 256 von 512.
- **Kein Bereich für besondere Zwecke (global routbarer Unicast-Adressraum)**: Der Block berührt keinen aufgeführten Bereich, zum Beispiel `172.32.0.0/24`, das /24 direkt oberhalb von `172.16.0.0/12`.

Unter der Bewertung listet eine Tabelle jede Zeile auf, die der Block berührt, die spezifischste zuerst: den Bereich, den Namen in der Registry, die RFC-Spalte, die Beziehung (**ist dieser Block**, **enthält diesen Block** oder **in diesem Block (teilweise Überlappung)**) und vier Flags der Registry. Die Registry definiert sie: **Quelle** (Source) und **Ziel** (Destination) sagen, ob eine Adresse aus dem Bereich als Quelle bzw. als Ziel eines Datagramms gültig ist, das zwei Geräte durchläuft; **Weiterleitbar** (Forwardable) sagt, ob ein Router ein solches Datagramm zwischen externen Schnittstellen weiterleiten darf; **Global erreichbar** (Globally reachable) sagt, ob es über eine bestimmte administrative Domäne hinaus weitergeleitet werden kann. Wo die Registry eine Fußnote anhängt, zeigt das Tool sie: Fußnote 1 an den Flags von Loopback („Several protocols have been granted exceptions to this rule“), Fußnote 2 an `192.0.0.0/24` („Not useable unless by virtue of a more specific reservation“).

Die Zeilen, wie die Registry sie aufführt (S = Source, D = Destination, F = Forwardable, G = Globally reachable):

| Bereich | Name | RFC | S | D | F | G |
|---|---|---|---|---|---|---|
| `0.0.0.0/8` | „This network“ | RFC 791, Section 3.2 | ja | nein | nein | nein |
| `0.0.0.0/32` | „This host on this network“ | RFC 1122, Section 3.2.1.3 | ja | nein | nein | nein |
| `10.0.0.0/8` | Private-Use | RFC 1918 | ja | ja | ja | nein |
| `100.64.0.0/10` | Shared Address Space | RFC 6598 | ja | ja | ja | nein |
| `127.0.0.0/8` | Loopback | RFC 1122, Section 3.2.1.3 | nein [1] | nein [1] | nein [1] | nein [1] |
| `169.254.0.0/16` | Link Local | RFC 3927 | ja | ja | nein | nein |
| `172.16.0.0/12` | Private-Use | RFC 1918 | ja | ja | ja | nein |
| `192.0.0.0/24` [2] | IETF Protocol Assignments | RFC 6890, Section 2.1 | nein | nein | nein | nein |
| `192.0.0.0/29` | IPv4 Service Continuity Prefix | RFC 7335 | ja | ja | ja | nein |
| `192.0.0.8/32` | IPv4 dummy address | RFC 7600 | ja | nein | nein | nein |
| `192.0.0.9/32` | Port Control Protocol Anycast | RFC 7723 | ja | ja | ja | ja |
| `192.0.0.10/32` | Traversal Using Relays around NAT Anycast | RFC 8155 | ja | ja | ja | ja |
| `192.0.0.170/32`, `192.0.0.171/32` | NAT64/DNS64 Discovery | RFC 8880; RFC 7050, Section 2.2 | nein | nein | nein | nein |
| `192.0.2.0/24` | Documentation (TEST-NET-1) | RFC 5737 | nein | nein | nein | nein |
| `192.31.196.0/24` | AS112-v4 | RFC 7535 | ja | ja | ja | ja |
| `192.52.193.0/24` | AMT | RFC 7450 | ja | ja | ja | ja |
| `192.88.99.0/24` | Deprecated (6to4 Relay Anycast), beendet: 2015-03 | RFC 7526 | nicht aufgeführt | nicht aufgeführt | nicht aufgeführt | nicht aufgeführt |
| `192.88.99.2/32` | 6a44-relay anycast address | RFC 6751 | ja | ja | ja | nein |
| `192.168.0.0/16` | Private-Use | RFC 1918 | ja | ja | ja | nein |
| `192.175.48.0/24` | Direct Delegation AS112 Service | RFC 7534 | ja | ja | ja | ja |
| `198.18.0.0/15` | Benchmarking | RFC 2544 | ja | ja | ja | nein |
| `198.51.100.0/24` | Documentation (TEST-NET-2) | RFC 5737 | nein | nein | nein | nein |
| `203.0.113.0/24` | Documentation (TEST-NET-3) | RFC 5737 | nein | nein | nein | nein |
| `224.0.0.0/4` | Multicast | RFC 1112, Section 4; RFC 5771 | nicht aufgeführt | nicht aufgeführt | nicht aufgeführt | nicht aufgeführt |
| `240.0.0.0/4` | Reserved | RFC 1112, Section 4 | nein | nein | nein | nein |
| `255.255.255.255/32` | Limited Broadcast | RFC 8190; RFC 919, Section 7 | nein | ja | nein | nein |

Die Registry für besondere Zwecke führt Multicast nicht auf. Die Multicast-Zeile stammt aus der Registry IPv4 Multicast Address Space der IANA, deren Anmerkung „the range 224.0.0.0 through 239.255.255.255“ nennt, denselben Bereich, den RFC 1112, Abschnitt 4, für Host-Gruppenadressen angibt. Diese Registry hat keine Flag-Spalten, daher zeigt das Tool ihre Flags als **nicht aufgeführt**, statt sie zu raten; ebenso verfährt es mit der veralteten 6to4-Relay-Zeile, deren Flag-Zellen die Registry leer lässt.

Einige Zeilen erklären sich mit ihrem RFC besser. RFC 1918, Abschnitt 3, reserviert die drei Private-Use-Blöcke „for private internets“. RFC 6598 reserviert `100.64.0.0/10` für Carrier-Grade NAT und hält fest: „Shared Address Space is distinct from RFC 1918 private address space because it is intended for use on Service Provider networks“. RFC 5737 reserviert die drei TEST-NET-Blöcke für Dokumentation. Laut RFC 1112, Abschnitt 4, gilt für Adressen mit „1111“ als den vier höchstwertigen Bits: Sie „are reserved for future addressing modes“ (sind für künftige Adressierungsarten reserviert); das ist die Zeile `240.0.0.0/4`.

Was die Einordnung nicht ist: Sie meldet die Zeilen der Registry und sonst nichts. Sie prüft nicht, ob ein Block jemandem zugeteilt ist oder im Internet angekündigt wird, und die Registry selbst merkt an, dass aufgeführte Präfixe „are not guaranteed routability in any particular local or global context“, also nirgends garantiert routbar sind.

## Modus „VLSM“

Geben Sie einen **übergeordneten Block** und eine Zeile pro Subnetz ein: einen optionalen Namen und die Anzahl der Hosts, die es aufnehmen muss. **Zuteilen** bemisst und platziert jede Anforderung:

1. **Größe.** Eine Anforderung für `h` Hosts erhält den kleinsten Block mit mindestens `h + 2` Adressen; die zwei sind Netzwerk- und Broadcast-Adresse (RFC 1122, Abschnitt 3.2.1.3). 100 Hosts erhalten ein /25, 25 Hosts ein /27, 2 Hosts ein /30. Eine Anforderung für 0 Hosts wird mit einer Meldung abgelehnt, die das Problem benennt; eine Anforderung, die größer ist als jeder IPv4-Block, wird als nicht passend aufgeführt.
2. **Reihenfolge.** Die Anforderungen werden mit dem größten Block zuerst platziert, nicht in der eingegebenen Reihenfolge, und das Ergebnis sagt das. Jeder Block beginnt dann an einem Vielfachen seiner eigenen Größe, und die zugeteilten Blöcke lassen keine Lücken zwischen sich.
3. **Platzierung.** Jeder Block nimmt die nächste ausgerichtete Position im übergeordneten Block ein; eine Anforderung, deren ausgerichteter Block über den übergeordneten Block hinausreichen würde, steht unter **Passte nicht**.

Die Option **/31 für Anforderungen mit 2 Hosts (Punkt-zu-Punkt-Links, RFC 3021)** ist standardmäßig ausgeschaltet. Ist sie aktiviert, erhält eine Anforderung für genau 2 Hosts ein /31 statt eines /30, und ihre Zeile zeigt keinen Broadcast: RFC 3021, Abschnitt 2.1, macht beide Adressen zu Hosts, und laut Abschnitt 2.2 gilt für den Limited Broadcast: „MUST be used for all broadcast traffic on a point-to-point link with a 31-bit subnet mask“. Verwenden Sie die Option nur, wo beide Enden des Links 31-Bit-Präfixe unterstützen: Abschnitt 5 warnt, dass ein Link, „in which only one end supports the use of 31-bit prefixes“, möglicherweise nicht korrekt funktioniert („may not operate correctly“).

Ein übergeordneter Block mit gesetzten Host-Bits, etwa `192.0.2.77/24`, wird auf `192.0.2.0/24` maskiert, und das Ergebnis sagt das über der Tabelle, statt den Plan stillschweigend aus einem anderen Block zu schneiden als dem eingegebenen.

Das Ergebnis zeigt den übergeordneten Block, die belegten und freien Adressen, die Auslastung, eine Tabelle aller Subnetze (Name, angeforderte Hosts, Netzwerk, Präfix, Netzmaske, nutzbarer Bereich, Broadcast, nutzbare Hosts), den verbleibenden freien Platz im übergeordneten Block als CIDR-Blöcke und die Anforderungen, die nicht passten.

Durchgerechnetes Beispiel: übergeordneter Block `203.0.113.0/24` mit einem Büro für 100 Hosts, einem Gäste-LAN für 25, einem Management-LAN für 10 und zwei Router-Links mit je 2 Hosts.

- Option aus: `203.0.113.0/25`, `203.0.113.128/27`, `203.0.113.160/28`, `203.0.113.176/30`, `203.0.113.180/30`; 184 Adressen belegt, 72 frei (71,9 %), freie Blöcke `203.0.113.184/29` und `203.0.113.192/26`.
- Option an: Die Links werden zu `203.0.113.176/31` und `203.0.113.178/31`; 180 belegt, 76 frei (70,3 %), freie Blöcke `203.0.113.180/30`, `203.0.113.184/29` und `203.0.113.192/26`.

## Modus „Supernetz“

Fügen Sie bis zu 1.024 Präfixe ein, getrennt durch Zeilenumbrüche, Kommas oder Leerzeichen. **Zusammenfassen** führt sie zusammen (überlappende oder benachbarte Präfixe werden zu einem Bereich) und gibt aus:

- die **minimale abdeckende Menge**: die wenigsten ausgerichteten CIDR-Blöcke, die genau dieselben Adressen abdecken wie die Eingaben, nicht mehr;
- das **einzelne Supernetz**: das kleinste einzelne Präfix, das jede Eingabe abdeckt, und wie viele Adressen es über die Eingaben hinaus hinzufügt, wenn es größer ist als ihre Vereinigung.

Beispiele: `192.168.0.0/24` und `192.168.1.0/24` werden ohne Zusatz zu `192.168.0.0/23` zusammengefasst. `10.0.0.0/24` und `10.0.2.0/24` bleiben zwei Blöcke; das einzelne Supernetz `10.0.0.0/22` würde 512 Adressen hinzufügen, die in keiner der Eingaben liegen.

## Modus „Überlappung / Lücke“

Fügen Sie bis zu 1.024 Präfixe und optional einen **Bereich** ein. **Prüfen** vergleicht jedes Paar und kennzeichnet jedes überlappende Paar als **identisch mit**, **enthält** oder **liegt in**, mit dem gemeinsamen Bereich und seiner Größe; zwei CIDR-Blöcke sind entweder ineinander verschachtelt oder disjunkt, daher ist jede Überlappung eine davon. Außerdem zählt es die Adressen, die die Präfixe abdecken. Mit einem Bereich listet es die **Lücken im Bereich** auf: die Adressen im Bereich, die kein Präfix abdeckt, als die größten ausgerichteten Blöcke, die hineinpassen.

Beispiel: `10.0.0.0/26` und `10.0.0.128/26` im Bereich `10.0.0.0/24` überlappen sich nicht, decken 128 von 256 Adressen ab und lassen die Lücken `10.0.0.64/26` und `10.0.0.192/26`.

## Links in den Rechner

Eine andere Seite kann den Rechner mit einem bereits ausgefüllten Block öffnen. Das CIDR-Feld der Startseite tut das über seinen Link **Den vollständigen CIDR-Rechner öffnen** und über die Zeile zu den besonderen Zwecken, und die Adresse sieht dann so aus: `/de/tools/cidr/#input=192.0.2.7%2F31`. Der Block steht im Fragment, dem Teil nach dem `#`: Ein Browser setzt das Fragment nie in eine HTTP-Anfrage oder in einen Referer-Header, daher erhält der Host, der die Seite ausliefert, den Block nicht. Der Rechner liest ihn im Browser, prüft ihn mit demselben Validator wie **Berechnen** und zeigt das Ergebnis des Subnetz-Modus (für `192.0.2.7/31`: `192.0.2.6` und `192.0.2.7`, zwei nutzbare Adressen). Ein ungültiger Block zeigt dieselbe Fehlermeldung wie bei der Eingabe; ein Wert mit mehr als 16.384 Zeichen wird ignoriert.

Was das Fragment nicht verbirgt: Es bleibt in der Adressleiste und im Verlauf des Browsers, ein Lesezeichen bewahrt es, und alle, denen Sie die Adresse schicken, können es lesen; die Schaltfläche **Teilen** der Seite weist darauf hin, wenn die Adresse einen Block enthält. **Leeren**, **Beispiel** oder jede Änderung entfernt den Block aus der Adresse, ohne die Seite neu zu laden, sodass ein späteres Teilen oder Neuladen ihn nicht mehr überträgt. Ein Wechsel der Sprache behält den Block bei.

Ältere Links setzen den Block stattdessen in den Query-String (`?input=192.0.2.7%2F31`). Sie funktionieren weiterhin, doch ein Query-String ist Teil der Anfrage, sodass diese erste Anfrage den Block an den Host übertragen hat, bevor die Seite lief. Der Rechner verschiebt den Block dann ins Fragment und weist in einem Hinweis unter der Eingabe darauf hin.

## Ergebnisse teilen

Im Subnetz-Modus erzeugt **Ergebnisse teilen** unter dem Ergebnis einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält den Block, aus dem das Ergebnis berechnet wurde (`#input=192.168.1.0%2F24`), und sonst nichts. Die Modi VLSM, Supernetz und Überlappung werden nicht geteilt: Ihre vielen Felder passen nicht in den einen Wert, den diese Adresse überträgt. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ein Block ist weit kürzer.
- **Öffnen eines Links.** Der Link ist dieselbe Adresse, die unter **Links in den Rechner** beschrieben ist: Der Block füllt das Feld des Subnetz-Modus und wird mit demselben Validator wie **Berechnen** berechnet. Wie bei jedem Link in dieses Tool bleibt der Wert nach dem `#`, bis Sie das Feld ändern oder leeren, und verschwindet dann ohne Anfrage aus der Adresse.

## API

Dieselbe Engine beantwortet die Operation `/api/v1/cidr` der HTTP-API der Website, Feld für Feld beschrieben im OpenAPI-Vertrag auf der [API-Seite](/api), mit Beispielen aus den Referenzvektoren. Der Vertrag gibt auch an, ob diese Website die API bereitstellt.

- **Anfrage.** Ein bloßer Block (`192.168.1.0/24`, als `?input=` bei GET oder als Body eines POST) führt den Subnetz-Modus aus. Ein JSON-Objekt wählt einen Modus: `{"mode": "subnet", "block": "..."}`; `{"mode": "vlsm", "parent": "...", "requirements": [{"label": "Office", "hosts": 100}], "pointToPoint31": false}`; `{"mode": "supernet", "prefixes": [...]}`; oder `{"mode": "overlap", "prefixes": [...], "scope": "..."}`. `prefixes` darf auch eine einzelne Zeichenfolge sein, getrennt wie im Feld der Seite.
- **Antwort.** Jedes Ergebnis enthält `mode`. Subnetz liefert die Felder der Subnetz-Ergebnisse (`input`, `network`, `broadcast`, `netmask`, `wildcard`, `firstHost`, `lastHost`, `totalAddresses`, `usableHosts`) und `specialPurpose`: `status` (`special`, `partial` oder `none`), `specialAddresses` und `matches`, einen Eintrag pro Registry-Zeile, die der Block berührt, mit den Spalten der Registry (ein Flag, das die Registry leer lässt, ist `null`), `relation` (`equal`, `inside` oder `contains`) und `overlapAddresses`. VLSM liefert `subnets` (jedes mit `pointToPoint31`), `unallocated`, `parentInput`, `parentMasked`, `freeBlocks`, `placement` (`largest-first`) und die Adresssummen. Supernetz liefert `aggregated`, `singleSupernet` und `supernetExtraAddresses`; Überlappung / Lücke liefert `overlaps`, `gaps`, `coveredAddresses` und `scopeAddresses`.
- **Fehler.** HTTP 400, `invalid_input`, mit der Meldung der Engine: Eine Anforderung mit 0 Hosts ergibt `a requirement (Z) asks for 0 hosts`.

Bis zum 19.10.2026 lieferte die Operation nur die Aufschlüsselung des Subnetz-Modus; `mode` und `specialPurpose` kamen an diesem Tag hinzu, und die Modi VLSM, Supernetz und Überlappung / Lücke wurden über die API erreichbar.

## Quellen

- [IANA, IPv4 Special-Purpose Address Space registry, CSV](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) (Registry aktualisiert am 09.10.2025; abgerufen am 26.10.2026): jede Zeile für besondere Zwecke, ihre Flags und Fußnoten
- [IANA, IPv4 Multicast Address Space registry](https://www.iana.org/assignments/multicast-addresses/multicast-addresses.xml) (Registry aktualisiert am 20.08.2026; abgerufen am 26.10.2026): der Multicast-Bereich
- [RFC 4632: Classless Inter-domain Routing (CIDR)](https://www.rfc-editor.org/rfc/rfc4632) (abgerufen am 19.10.2026): Abschnitt 3.1, Präfixnotation und Blockgrößen
- [RFC 1122: Requirements for Internet Hosts - Communication Layers](https://www.rfc-editor.org/rfc/rfc1122) (abgerufen am 19.10.2026): Abschnitt 3.2.1.3, die reservierten Werte der Host-Nummer
- [RFC 3021: Using 31-Bit Prefixes on IPv4 Point-to-Point Links](https://www.rfc-editor.org/rfc/rfc3021) (abgerufen am 19.10.2026): Abschnitte 2.1, 2.2 und 5
- [RFC 6890: Special-Purpose IP Address Registries](https://www.rfc-editor.org/rfc/rfc6890) (abgerufen am 19.10.2026), aktualisiert durch [RFC 8190](https://www.rfc-editor.org/rfc/rfc8190) (abgerufen am 19.10.2026): die Struktur der Registry
- [RFC 1918: Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918) (abgerufen am 19.10.2026): Abschnitt 3
- [RFC 6598: IANA-Reserved IPv4 Prefix for Shared Address Space](https://www.rfc-editor.org/rfc/rfc6598) (abgerufen am 19.10.2026)
- [RFC 5737: IPv4 Address Blocks Reserved for Documentation](https://www.rfc-editor.org/rfc/rfc5737) (abgerufen am 19.10.2026)
- [RFC 3927: Dynamic Configuration of IPv4 Link-Local Addresses](https://www.rfc-editor.org/rfc/rfc3927) (abgerufen am 19.10.2026)
- [RFC 1112: Host Extensions for IP Multicasting](https://www.rfc-editor.org/rfc/rfc1112) (abgerufen am 19.10.2026): Abschnitt 4, Host-Gruppenadressen und der Bereich der Klasse E
- [RFC 5771: IANA Guidelines for IPv4 Multicast Address Assignments](https://www.rfc-editor.org/rfc/rfc5771) (abgerufen am 19.10.2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
