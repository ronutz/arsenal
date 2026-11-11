## Cosa fa

Un indirizzo MAC è un indirizzo hardware a 48 bit, di solito scritto come sei byte esadecimali, ad esempio `00:1b:54:11:22:33`. I primi tre byte sono l’OUI (Organizationally Unique Identifier), che l’IEEE assegna a un produttore. Lo strumento prende un MAC (in qualsiasi formato comune) o un OUI da solo, cerca l’OUI in una copia integrata del registro IEEE MA-L per dare un nome al produttore e legge i due bit significativi del primo byte. Riconosce anche gli indirizzi il cui significato è fissato da uno standard e non da un produttore: le corrispondenze multicast, i router virtuali VRRP, le assegnazioni IANA e gli indirizzi di gruppo noti. Tutto viene eseguito nel tuo browser.

## I due bit che contano

Il primissimo byte di un MAC porta due flag nei suoi bit meno significativi:

- Il **bit I/G** (il bit meno significativo) vale 0 per unicast e 1 per multicast. Un indirizzo multicast è un indirizzo di gruppo, non una singola interfaccia.
- Il **bit U/L** (il secondo bit meno significativo) vale 0 per universale e 1 per amministrato localmente. Un indirizzo amministrato universalmente è univoco a livello globale e preso dall’OUI di un produttore; un indirizzo amministrato localmente è stato impostato via software (da un hypervisor, da un’interfaccia aggregata, da un MAC Wi-Fi casuale) e non ha un produttore.

Quindi `02:...` è amministrato localmente (non c’è alcun vendor da trovare) e `01:...` è multicast. L’unica eccezione standard è `33-33`, descritto più avanti: ha il bit Local attivo, ma è la corrispondenza del multicast IPv6, non un indirizzo scelto via software (RFC 9542, sezione 2.3.1).

## Corrispondenze multicast

- **Multicast IPv4, da `01-00-5E-00-00-00` a `01-00-5E-7F-FF-FF`.** La RFC 1112, sezione 6.4, fa corrispondere un gruppo a un MAC copiando i bit meno significativi dell’indirizzo IP nei bit meno significativi dell’indirizzo multicast Ethernet di base («placing the low-order 23-bits of the IP address into the low-order 23 bits of the Ethernet multicast address 01-00-5E-00-00-00»). Un indirizzo di gruppo ha 28 bit significativi, quindi 5 bit vanno persi e 32 gruppi IPv4 condividono ogni MAC. La pagina spiega il perché e rimanda allo strumento Corrispondenza tra gruppi multicast e indirizzi MAC con il MAC già inserito, che li elenca tutti e 32 con i nomi assegnati dall’IANA: `01:00:5e:00:00:01` è condiviso da `224.0.0.1`, `224.128.0.1`, `225.0.0.1` e così via fino a `239.128.0.1`. L’API restituisce i 32 gruppi in `ipv4Groups`. La metà superiore del blocco non è IPv4: il registro Ethernet Numbers dell’IANA assegna l’intervallo da `01-00-5E-80-00-00` a `8F-FF-FF` al multicast MPLS (Multiprotocol Label Switching, RFC 5332), e lo strumento lo indica.
- **Multicast IPv6, `33-33-xx-xx-xx-xx`.** La RFC 2464, sezione 7, invia un pacchetto multicast IPv6 all’indirizzo multicast Ethernet formato da un prefisso fisso e dagli ultimi quattro ottetti dell’indirizzo di destinazione («the Ethernet multicast address whose first two octets are the value 3333 hexadecimal and whose last four octets are the last four octets of DST»). Lo strumento mostra quegli ultimi 32 bit, quindi `33:33:00:00:00:01` contiene `0000:0001`, la coda di `ff02::1`.

## VRRP e altre assegnazioni IANA

L’IANA detiene l’OUI `00-00-5E`. La RFC 9568, sezione 7.3, costruisce il MAC di un router virtuale VRRP come `00-00-5E-00-01-{VRID}` per IPv4 e `00-00-5E-00-02-{VRID}` per IPv6, dove il VRID è un valore intero in un intervallo fissato («An integer value (1-255)»). Lo strumento mostra, ad esempio, `Router virtuale VRRP (IPv4), VRID 1` per `00:00:5e:00:01:01`, e segnala un VRID 0 come fuori da quell’intervallo.

Vengono riconosciute anche le altre righe con un nome del registro Ethernet Numbers dell’IANA, ciascuna con la RFC citata dal registro:

| Indirizzo o intervallo | Significato | Riferimento |
| --- | --- | --- |
| da `00-00-5E-00-00-00` a `00-00-5E-00-00-FF` | Reserved | RFC 9542 |
| `00-00-5E-00-52-00`, `-01` | PacketPWEthA, PacketPWEthB | RFC 6658 |
| `00-00-5E-00-52-02` | BFD for VXLAN | RFC 8971 |
| `00-00-5E-00-52-13` | Proxy Mobile IPv6 | RFC 6543 |
| da `00-00-5E-00-53-00` a `00-00-5E-00-53-FF` | Documentation (unicast) | RFC 9542 |
| `00-00-5E-90-01-00` e `01-00-5E-90-01-00` | TRILL OAM | RFC 7455 |
| da `01-00-5E-80-00-00` a `01-00-5E-8F-FF-FF` | MPLS Multicast | RFC 5332 |
| `01-00-5E-90-00-00` | MPLS-TP p2p | RFC 7213 |
| `01-00-5E-90-00-01` | BFD on Link Aggregation Group (LAG) interfaces | RFC 7130 |
| `01-00-5E-90-00-02`, `-03` | AllL1MI-ISs, AllL2MI-ISs | RFC 8202 |
| da `01-00-5E-90-10-00` a `01-00-5E-90-10-FF` | Documentation (multicast) | RFC 9542 |

## Indirizzi di gruppo noti

| Indirizzo | Nome | Standard |
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

I nomi sono quelli della IEEE Registration Authority, tratti dal suo elenco pubblico degli indirizzi MAC di gruppo standard. I valori IS-IS corrispondono alla tabella delle costanti della RFC 1142, la ripubblicazione del 1990 di ISO DP 10589. Per i 16 indirizzi da `01-80-C2-00-00-00` a `0F`, la guida dell’IEEE sugli indirizzi di gruppo standard dice che i frame inviati a questi indirizzi non vengono inoltrati dai bridge MAC conformi allo standard («are not relayed by MAC bridges conforming to IEEE 802.1D»), e lo strumento aggiunge questa nota. Gli altri indirizzi di gruppo in `01-80-C2` (ad esempio l’intervallo da `01-80-C2-00-00-30` a `3F` per i messaggi CCM e Linktrace) non sono ancora nella tabella e risultano non presenti nella copia MA-L.

## Formati accettati

Funzionano tutte le forme: con due punti (`00:1b:54:...`), con trattini (`00-1b-54-...`), puntata Cisco (`001b.5411.2233`) e senza separatori (`001b5411...`), in maiuscolo o in minuscolo, e anche un OUI da solo di sei cifre esadecimali. Un OUI da solo viene associato a un significato standard solo dove bastano tre byte a deciderlo (`33-33-xx` è sempre multicast IPv6); `01-00-5E` da solo potrebbe essere multicast IPv4 o MPLS, quindi allo strumento serve l’indirizzo completo.

## I dati

I nomi dei vendor vengono dall’elenco pubblico IEEE MA-L (OUI), integrato qui come copia scattata in un dato momento. Trattandosi di una copia, un blocco assegnato di recente potrebbe non esserci ancora, e questa build copre il registro MA-L (24 bit), non i blocchi più piccoli MA-M (28 bit) o MA-S (36 bit). La copia viene caricata in modo differito alla prima ricerca, quindi la pagina si apre velocemente e al momento della ricerca non viene mai scaricato nulla da un server. Gli indirizzi definiti dagli standard elencati sopra sono una piccola tabella fissa nel codice, e ogni riga è legata alla sua fonte.

## Come si usa

Inserisci o incolla un indirizzo MAC o un OUI. Un indirizzo amministrato localmente o sconosciuto viene indicato onestamente come tale, senza tirare a indovinare.

## Condivisione dei risultati

Sotto la lettura, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene l’indirizzo MAC o l’OUI così come l’hai inserito (`#input=00%3A1b%3A54%3A11%3A22%3A33`), e nient’altro. Tutto ciò che il link contiene si trova dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; un indirizzo è molto più corto.
- **Apertura di un link.** Il link è lo stesso indirizzo che le altre pagine usano per passare un indirizzo MAC a questo strumento: il valore compila il campo e viene cercato come farebbe un incolla (la tabella dei vendor viene caricata da questo sito alla prima ricerca, come per un incolla). Come per ogni link a questo strumento, il valore resta dopo il `#` finché non modifichi o cancelli il campo, e poi lascia l’indirizzo senza alcuna richiesta.

## API

Lo stesso motore risponde all’operazione `/api/v1/oui-lookup` dell’API HTTP del sito, descritta campo per campo nel contratto OpenAPI della [pagina dell’API](/api), con esempi presi dai vettori di test di riferimento (golden vectors). Il contratto indica anche se questo sito espone l’API.

- **Richiesta.** L’indirizzo MAC o l’OUI come testo, in qualsiasi notazione accettata dalla pagina.
- **Risposta.** `ok`, `input`, `hex`, `formatted`, `oui`, `ouiFormatted`, `vendor` (o `null`), `multicast`, `local`, `isOuiOnly`, `notes` (frasi in inglese) e, quando uno standard o un registro dà un significato all’indirizzo, `wellKnown`: `kind` (`ipv4-multicast`, `ipv6-multicast`, `vrrp-ipv4`, `vrrp-ipv6`, `iana-block` o `group-address`), `name`, `standard` e, a seconda del tipo, `ipv4Groups` (i 32 gruppi), `ipv6Low32`, `vrid` o `bridgeFiltered`.
- **Errori.** Un input che non è un MAC né un OUI non è un errore HTTP: l’API risponde `ok: false` con `error.message`.

`wellKnown` è stato aggiunto il 19 ottobre 2026.

## Fonti

- [IEEE Registration Authority: MA-L (OUI) public listing](https://standards-oui.ieee.org/oui/oui.csv) (copia del 10/07/2026)
- [RFC 1112: Host Extensions for IP Multicasting, sezione 6.4](https://www.rfc-editor.org/rfc/rfc1112) (consultata il 19/10/2026)
- [RFC 2464: Transmission of IPv6 Packets over Ethernet Networks, sezione 7](https://www.rfc-editor.org/rfc/rfc2464) (consultata il 19/10/2026)
- [RFC 9568: Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6, sezione 7.3](https://www.rfc-editor.org/rfc/rfc9568) (consultata il 19/10/2026)
- [RFC 9542: IANA Considerations and IETF Protocol and Documentation Usage for IEEE 802 Parameters, sezioni 2.1.3, 2.1.4 e 2.3.1](https://www.rfc-editor.org/rfc/rfc9542) (consultata il 19/10/2026)
- [Registro IANA Ethernet Numbers: IANA Unicast and Multicast 48-bit MAC Addresses (ultimo aggiornamento il 13/10/2026)](https://www.iana.org/assignments/ethernet-numbers/ethernet-numbers.txt) (consultato il 19/10/2026)
- [IEEE Registration Authority: Standards Group MAC public listing](https://standards.ieee.org/products-programs/regauth/grpmac/public/) (consultato il 19/10/2026)
- [IEEE Registration Authority: Standard Group MAC Addresses: A Tutorial Guide (PDF)](https://standards.ieee.org/wp-content/uploads/import/documents/tutorials/macgrp.pdf) (consultato il 19/10/2026)
- [RFC 1142: OSI IS-IS Intra-domain Routing Protocol (ripubblicazione di ISO DP 10589)](https://www.rfc-editor.org/rfc/rfc1142) (consultata il 19/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
