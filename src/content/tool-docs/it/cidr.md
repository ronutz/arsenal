## Cosa fa

Il Calcolatore CIDR / subnet lavora su blocchi IPv4 scritti in notazione CIDR, cioè un indirizzo e una lunghezza del prefisso come `192.168.1.0/24`. Ha quattro modalità, che scegli con le schede in alto:

- **Subnet** analizza un blocco: indirizzo di rete, ultimo indirizzo, maschera di rete, wildcard mask, primo e ultimo host utilizzabile, indirizzi totali e host utilizzabili, i bit dell’indirizzo e gli intervalli per usi speciali in cui il blocco ricade o con cui si sovrappone.
- **VLSM** ricava subnet a lunghezza variabile da un blocco padre in base a un elenco di numeri di host.
- **Supernet** aggrega un elenco di prefissi nel più piccolo insieme di blocchi che copre esattamente gli stessi indirizzi, e nel singolo prefisso più piccolo che li copre tutti.
- **Sovrapposizioni / lacune** trova quali prefissi di un elenco si sovrappongono o si contengono a vicenda e, dato un ambito, elenca lo spazio al suo interno che nessun prefisso copre.

Ogni calcolo viene eseguito nel tuo browser; nulla di ciò che inserisci viene inviato altrove. Un blocco passato da un’altra pagina arriva dopo il `#` nell’indirizzo, una parte che nessuna richiesta trasporta; vedi **Link verso il calcolatore** più sotto.

## Modalità Subnet

Una lunghezza del prefisso `/n` fissa i primi `n` bit dell’indirizzo a 32 bit come parte di rete e lascia `32 - n` bit agli host, quindi il blocco comprende `2^(32 - n)` indirizzi (RFC 4632, sezione 3.1). Per un blocco da /0 a /30 lo strumento ne riserva due: l’indirizzo con tutti i bit di host a 0 (l’indirizzo di rete) e quello con tutti i bit di host a 1 (il broadcast diretto). La RFC 1122, sezione 3.2.1.3, non ammette 0 o tutti i bit a uno nel campo del numero di host al di fuori dei casi speciali che elenca, quindi un blocco da /0 a /30 ha `2^(32 - n) - 2` host utilizzabili.

Una /31 e una /32 non riservano nulla. La RFC 3021, sezione 2.1, stabilisce che su un collegamento punto-punto con una maschera a 31 bit entrambi gli indirizzi vanno interpretati come indirizzi di host («MUST be interpreted as host addresses»), quindi lo strumento conta due host utilizzabili in una /31, indica il primo indirizzo come identificatore di rete che è anche un host utilizzabile e l’ultimo come indirizzo senza broadcast diretto. Una /32 è un singolo host.

Un indirizzo inserito con bit di host impostati, come `192.168.1.77/24`, viene letto come il blocco a cui appartiene: la riga dell’indirizzo di rete mostra `192.168.1.0`. Il cursore **Lunghezza del prefisso** riscrive il prefisso dell’indirizzo corrente e ricalcola subito. Il pulsante **Esempio** carica `192.168.1.0/24`.

Esempi svolti, come li stampa lo strumento:

- `192.168.1.0/24`: rete `192.168.1.0`, broadcast `192.168.1.255`, utilizzabili da `192.168.1.1` a `192.168.1.254`, 254 host, maschera di rete `255.255.255.0`, wildcard `0.0.0.255`.
- `10.0.0.0/30`: rete `10.0.0.0`, broadcast `10.0.0.3`, utilizzabili da `10.0.0.1` a `10.0.0.2`, 2 host, maschera di rete `255.255.255.252`.
- `10.0.0.0/31`: due indirizzi utilizzabili, `10.0.0.0` e `10.0.0.1`, nessun indirizzo di rete o di broadcast riservato.

## Classificazione per usi speciali

Sotto i risultati della modalità Subnet, lo strumento confronta il blocco con ogni riga del registro IANA IPv4 Special-Purpose Address Space, scaricato il 26 ottobre 2026 (il registro è stato aggiornato l’ultima volta il 9 ottobre 2025; il Classificatore di URL SSRF legge la stessa copia delle sue righe), più una riga per il multicast. Restituisce uno di tre verdetti:

- **All’interno di un intervallo per usi speciali**: l’intero blocco si trova in un intervallo elencato. La frase indica il più specifico, ad esempio `192.168.1.0/24` è all’interno di `192.168.0.0/16`, Private-Use (RFC 1918).
- **In parte per usi speciali**: il blocco contiene uno o più intervalli elencati e anche altri indirizzi. Due blocchi CIDR sono o annidati o disgiunti, quindi questo è l’unico modo in cui un blocco può sovrapporsi in parte a un intervallo. La frase riporta il conteggio, ad esempio `10.0.0.0/7`: 16.777.216 indirizzi su 33.554.432 ricadono in `10.0.0.0/8`. Le righe annidate vengono contate una sola volta: `192.0.0.0/23` contiene `192.0.0.0/24` e le sue sei righe più specifiche, e lo strumento riporta 256 su 512.
- **Nessun intervallo per usi speciali (spazio unicast instradabile globalmente)**: il blocco non incontra alcun intervallo elencato, ad esempio `172.32.0.0/24`, la /24 subito sopra `172.16.0.0/12`.

Sotto il verdetto, una tabella elenca ogni riga che il blocco incontra, a partire dalla più specifica: l’intervallo, il nome del registro, la colonna RFC, la relazione (**è questo blocco**, **contiene questo blocco** o **dentro questo blocco (sovrapposizione parziale)**) e quattro dei flag del registro. È il registro a definirli: **Origine** e **Destinazione** indicano se un indirizzo dell’intervallo è valido come origine o destinazione di un datagramma che attraversa due dispositivi; **Inoltrabile** indica se un router può inoltrare un datagramma di questo tipo tra interfacce esterne; **Raggiungibile globalmente** indica se è inoltrabile oltre un determinato dominio amministrativo. Dove il registro aggiunge una nota, lo strumento la mostra: la nota 1 sui flag di Loopback («Several protocols have been granted exceptions to this rule»), la nota 2 su `192.0.0.0/24` («Not useable unless by virtue of a more specific reservation»).

Le righe, così come le elenca il registro (Origine, Destinazione, Inoltrabile, Raggiungibile globalmente):

| Intervallo | Nome | RFC | O | D | I | G |
|---|---|---|---|---|---|---|
| `0.0.0.0/8` | "This network" | RFC 791, Section 3.2 | sì | no | no | no |
| `0.0.0.0/32` | "This host on this network" | RFC 1122, Section 3.2.1.3 | sì | no | no | no |
| `10.0.0.0/8` | Private-Use | RFC 1918 | sì | sì | sì | no |
| `100.64.0.0/10` | Shared Address Space | RFC 6598 | sì | sì | sì | no |
| `127.0.0.0/8` | Loopback | RFC 1122, Section 3.2.1.3 | no [1] | no [1] | no [1] | no [1] |
| `169.254.0.0/16` | Link Local | RFC 3927 | sì | sì | no | no |
| `172.16.0.0/12` | Private-Use | RFC 1918 | sì | sì | sì | no |
| `192.0.0.0/24` [2] | IETF Protocol Assignments | RFC 6890, Section 2.1 | no | no | no | no |
| `192.0.0.0/29` | IPv4 Service Continuity Prefix | RFC 7335 | sì | sì | sì | no |
| `192.0.0.8/32` | IPv4 dummy address | RFC 7600 | sì | no | no | no |
| `192.0.0.9/32` | Port Control Protocol Anycast | RFC 7723 | sì | sì | sì | sì |
| `192.0.0.10/32` | Traversal Using Relays around NAT Anycast | RFC 8155 | sì | sì | sì | sì |
| `192.0.0.170/32`, `192.0.0.171/32` | NAT64/DNS64 Discovery | RFC 8880; RFC 7050, Section 2.2 | no | no | no | no |
| `192.0.2.0/24` | Documentation (TEST-NET-1) | RFC 5737 | no | no | no | no |
| `192.31.196.0/24` | AS112-v4 | RFC 7535 | sì | sì | sì | sì |
| `192.52.193.0/24` | AMT | RFC 7450 | sì | sì | sì | sì |
| `192.88.99.0/24` | Deprecated (6to4 Relay Anycast), terminato nel marzo 2015 | RFC 7526 | non indicato | non indicato | non indicato | non indicato |
| `192.88.99.2/32` | 6a44-relay anycast address | RFC 6751 | sì | sì | sì | no |
| `192.168.0.0/16` | Private-Use | RFC 1918 | sì | sì | sì | no |
| `192.175.48.0/24` | Direct Delegation AS112 Service | RFC 7534 | sì | sì | sì | sì |
| `198.18.0.0/15` | Benchmarking | RFC 2544 | sì | sì | sì | no |
| `198.51.100.0/24` | Documentation (TEST-NET-2) | RFC 5737 | no | no | no | no |
| `203.0.113.0/24` | Documentation (TEST-NET-3) | RFC 5737 | no | no | no | no |
| `224.0.0.0/4` | Multicast | RFC 1112, Section 4; RFC 5771 | non indicato | non indicato | non indicato | non indicato |
| `240.0.0.0/4` | Reserved | RFC 1112, Section 4 | no | no | no | no |
| `255.255.255.255/32` | Limited Broadcast | RFC 8190; RFC 919, Section 7 | no | sì | no | no |

Il registro per usi speciali non elenca il multicast. La riga del multicast viene dal registro IANA IPv4 Multicast Address Space, la cui nota riporta «the range 224.0.0.0 through 239.255.255.255», lo stesso intervallo che la RFC 1112, sezione 4, indica per gli indirizzi dei gruppi di host. Quel registro non ha colonne di flag, quindi lo strumento mostra i suoi flag come **non indicato** anziché tirare a indovinare; fa lo stesso per la riga deprecata del relay 6to4, le cui celle dei flag il registro lascia vuote.

Alcune righe si spiegano meglio con la loro RFC. La RFC 1918, sezione 3, riserva i tre blocchi Private-Use alle reti private («for private internets»). La RFC 6598 riserva `100.64.0.0/10` al Carrier-Grade NAT e precisa: «Shared Address Space is distinct from RFC 1918 private address space because it is intended for use on Service Provider networks». La RFC 5737 riserva i tre blocchi TEST-NET alla documentazione. La RFC 1112, sezione 4, stabilisce che gli indirizzi con «1111» come quattro bit di ordine più alto sono riservati a futuri modi di indirizzamento («are reserved for future addressing modes»): è la riga `240.0.0.0/4`.

Cosa non è la classificazione: riporta le righe del registro e nient’altro. Non verifica se un blocco è assegnato a qualcuno o annunciato su Internet, e il registro stesso precisa che per i prefissi elencati non è garantita l’instradabilità («are not guaranteed routability in any particular local or global context»).

## Modalità VLSM

Inserisci un **blocco padre** e una riga per ogni subnet: un nome facoltativo e il numero di host che deve contenere. **Alloca** dimensiona e colloca ogni richiesta:

1. **Dimensione.** Una richiesta di `h` host riceve il blocco più piccolo di almeno `h + 2` indirizzi, dove i due sono l’indirizzo di rete e quello di broadcast (RFC 1122, sezione 3.2.1.3). 100 host ricevono una /25, 25 host una /27, 2 host una /30. Una richiesta di 0 host viene rifiutata con un messaggio che indica il problema; una richiesta più grande di qualsiasi blocco IPv4 viene elencata come non allocabile.
2. **Ordine.** Le richieste vengono collocate partendo dal blocco più grande, non nell’ordine di inserimento, e il risultato lo segnala. Ogni blocco inizia così su un multiplo della propria dimensione, e i blocchi allocati non lasciano buchi tra loro.
3. **Collocazione.** Ogni blocco occupa la successiva posizione allineata all’interno del blocco padre; una richiesta il cui blocco allineato uscirebbe dal padre viene elencata sotto **Non allocabile**.

L’opzione **Assegna una /31 alle richieste da 2 host (collegamenti punto-punto, RFC 3021)** è disattivata per impostazione predefinita. Se la selezioni, una richiesta di esattamente 2 host riceve una /31 invece di una /30, e la sua riga non mostra alcun broadcast: la RFC 3021, sezione 2.1, rende host entrambi gli indirizzi, e la sezione 2.2 stabilisce che il broadcast limitato «MUST be used for all broadcast traffic on a point-to-point link with a 31-bit subnet mask». Usala solo dove entrambe le estremità del collegamento supportano i prefissi a 31 bit: la sezione 5 avverte che un collegamento «in which only one end supports the use of 31-bit prefixes may not operate correctly».

Un blocco padre inserito con bit di host impostati, come `192.0.2.77/24`, viene mascherato in `192.0.2.0/24`, e il risultato lo segnala sopra la tabella invece di ricavare in silenzio il piano da un blocco diverso da quello inserito.

Il risultato mostra il blocco padre, gli indirizzi usati e liberi, l’utilizzo, una tabella di ogni subnet (nome, host richiesti, rete, prefisso, maschera di rete, intervallo utilizzabile, broadcast, host utilizzabili), lo spazio libero rimasto nel blocco padre come blocchi CIDR e le richieste non allocabili.

Esempio svolto: blocco padre `203.0.113.0/24` con un ufficio da 100 host, una LAN ospiti da 25, una LAN di gestione da 10 e due collegamenti tra router da 2 host ciascuno.

- Opzione disattivata: `203.0.113.0/25`, `203.0.113.128/27`, `203.0.113.160/28`, `203.0.113.176/30`, `203.0.113.180/30`; 184 indirizzi usati, 72 liberi (71,9%), blocchi liberi `203.0.113.184/29` e `203.0.113.192/26`.
- Opzione attivata: i collegamenti diventano `203.0.113.176/31` e `203.0.113.178/31`; 180 usati, 76 liberi (70,3%), blocchi liberi `203.0.113.180/30`, `203.0.113.184/29` e `203.0.113.192/26`.

## Modalità Supernet

Incolla fino a 1024 prefissi, separati da a capo, virgole o spazi. **Aggrega** li unisce (i prefissi sovrapposti o adiacenti diventano un unico intervallo) e restituisce:

- l’**insieme minimo di copertura**: il minor numero di blocchi CIDR allineati che coprono esattamente gli stessi indirizzi dell’input, non di più;
- la **supernet unica**: il singolo prefisso più piccolo che copre ogni input, e quanti indirizzi aggiunge oltre a questi quando è più grande della loro unione.

Esempi: `192.168.0.0/24` e `192.168.1.0/24` si aggregano in `192.168.0.0/23` senza nulla in più. `10.0.0.0/24` e `10.0.2.0/24` restano due blocchi; la supernet unica `10.0.0.0/22` aggiungerebbe 512 indirizzi che non sono in nessuno dei due input.

## Modalità Sovrapposizioni / lacune

Incolla fino a 1024 prefissi e, se vuoi, un **ambito**. **Verifica** confronta ogni coppia e classifica ogni coppia sovrapposta come **identico a**, **contiene** o **è dentro**, con l’intervallo condiviso e la sua dimensione; due blocchi CIDR sono o annidati o disgiunti, quindi ogni sovrapposizione è uno di questi casi. Conta anche gli indirizzi coperti dai prefissi. Con un ambito, elenca le **lacune nell’ambito**: gli indirizzi all’interno dell’ambito che nessun prefisso copre, come i blocchi allineati più grandi che ci stanno.

Esempio: `10.0.0.0/26` e `10.0.0.128/26` nell’ambito `10.0.0.0/24` non si sovrappongono, coprono 128 indirizzi su 256 e lasciano le lacune `10.0.0.64/26` e `10.0.0.192/26`.

## Link verso il calcolatore

Un’altra pagina può aprire il calcolatore con un blocco già compilato. La casella CIDR della home lo fa dal link **Apri il calcolatore CIDR completo** e dalla riga degli usi speciali, e l’indirizzo ha la forma `/en/tools/cidr/#input=192.0.2.7%2F31`. Il blocco viaggia nel frammento, la parte dopo il `#`: un browser non inserisce mai il frammento in una richiesta HTTP o in un’intestazione Referer, quindi l’host che serve la pagina non riceve il blocco. Il calcolatore lo legge nel browser, lo passa allo stesso validatore di **Calcola** e mostra il risultato della modalità Subnet (per `192.0.2.7/31`: `192.0.2.6` e `192.0.2.7`, due indirizzi utilizzabili). Un blocco non valido mostra lo stesso messaggio di errore che si otterrebbe inserendolo; un valore più lungo di 16.384 caratteri viene ignorato.

Cosa il frammento non nasconde: resta nella barra degli indirizzi e nella cronologia del browser, un segnalibro lo conserva e chiunque riceva l’indirizzo da te può leggerlo; il pulsante **Condividi i risultati** della pagina lo segnala quando l’indirizzo contiene un blocco. **Cancella**, **Esempio** o qualsiasi modifica rimuovono il blocco dall’indirizzo senza ricaricare la pagina, quindi una condivisione o un ricaricamento successivi non lo contengono più. Cambiare lingua conserva il blocco.

I link più vecchi mettevano invece il blocco nella query string (`?input=192.0.2.7%2F31`). Funzionano ancora, ma una query string fa parte della richiesta, quindi quella prima richiesta ha portato il blocco all’host prima che la pagina venisse eseguita. Il calcolatore sposta poi il blocco nel frammento e lo segnala in una nota sotto il campo di input.

## Condivisione dei risultati

In modalità Subnet, sotto il risultato, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene il blocco da cui è stato calcolato il risultato (`#input=192.168.1.0%2F24`), e nient’altro. Le modalità VLSM, Supernet e Sovrapposizioni / lacune non vengono condivise: i loro diversi campi non entrano nell’unico valore che questo indirizzo contiene. Tutto ciò che il link contiene va dopo il `#`, che secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): un browser non lo invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; un blocco è molto più corto.
- **Apertura di un link.** Il link è lo stesso indirizzo descritto in **Link verso il calcolatore**: il blocco compila il campo della modalità Subnet e viene calcolato con lo stesso validatore di **Calcola**. Come per ogni link verso questo strumento, il valore resta dopo il `#` finché non modifichi o cancelli il campo, e poi lascia l’indirizzo senza alcuna richiesta.

## API

Lo stesso motore risponde all’operazione `/api/v1/cidr` dell’API HTTP del sito, descritta campo per campo nel contratto OpenAPI della [pagina dell’API](/api), con esempi presi dai vettori di test di riferimento (golden vectors). Il contratto indica anche se questo sito serve l’API.

- **Richiesta.** Un blocco semplice (`192.168.1.0/24`, come `?input=` in GET o come corpo di una POST) esegue la modalità Subnet. Un oggetto JSON sceglie una modalità: `{"mode": "subnet", "block": "..."}`; `{"mode": "vlsm", "parent": "...", "requirements": [{"label": "Office", "hosts": 100}], "pointToPoint31": false}`; `{"mode": "supernet", "prefixes": [...]}`; oppure `{"mode": "overlap", "prefixes": [...], "scope": "..."}`. `prefixes` può anche essere un’unica stringa, separata come nella casella della pagina.
- **Risposta.** Ogni risultato contiene `mode`. Subnet restituisce i campi dei risultati della modalità Subnet (`input`, `network`, `broadcast`, `netmask`, `wildcard`, `firstHost`, `lastHost`, `totalAddresses`, `usableHosts`) e `specialPurpose`: `status` (`special`, `partial` o `none`), `specialAddresses` e `matches`, uno per ogni riga del registro che il blocco incontra, con le colonne del registro (un flag che il registro lascia vuoto è `null`), `relation` (`equal`, `inside` o `contains`) e `overlapAddresses`. VLSM restituisce `subnets` (ciascuna con `pointToPoint31`), `unallocated`, `parentInput`, `parentMasked`, `freeBlocks`, `placement` (`largest-first`) e i totali degli indirizzi. Supernet restituisce `aggregated`, `singleSupernet` e `supernetExtraAddresses`; Sovrapposizioni / lacune restituisce `overlaps`, `gaps`, `coveredAddresses` e `scopeAddresses`.
- **Errori.** HTTP 400, `invalid_input`, con il messaggio del motore: una richiesta di 0 host risponde `a requirement (Z) asks for 0 hosts`.

Fino al 19 ottobre 2026 l’operazione restituiva solo il dettaglio della modalità Subnet; `mode` e `specialPurpose` sono stati aggiunti quel giorno, e le modalità VLSM, Supernet e Sovrapposizioni / lacune sono diventate raggiungibili tramite l’API.

## Fonti

- [IANA, IPv4 Special-Purpose Address Space registry, CSV](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) (registro aggiornato il 09/10/2025; consultato il 26/10/2026): ogni riga per usi speciali, con i suoi flag e le sue note
- [IANA, IPv4 Multicast Address Space registry](https://www.iana.org/assignments/multicast-addresses/multicast-addresses.xml) (registro aggiornato il 20/08/2026; consultato il 26/10/2026): l’intervallo multicast
- [RFC 4632: Classless Inter-domain Routing (CIDR)](https://www.rfc-editor.org/rfc/rfc4632) (consultata il 19/10/2026): sezione 3.1, notazione dei prefissi e dimensioni dei blocchi
- [RFC 1122: Requirements for Internet Hosts - Communication Layers](https://www.rfc-editor.org/rfc/rfc1122) (consultata il 19/10/2026): sezione 3.2.1.3, i valori riservati del numero di host
- [RFC 3021: Using 31-Bit Prefixes on IPv4 Point-to-Point Links](https://www.rfc-editor.org/rfc/rfc3021) (consultata il 19/10/2026): sezioni 2.1, 2.2 e 5
- [RFC 6890: Special-Purpose IP Address Registries](https://www.rfc-editor.org/rfc/rfc6890) (consultata il 19/10/2026), aggiornata dalla [RFC 8190](https://www.rfc-editor.org/rfc/rfc8190) (consultata il 19/10/2026): la struttura del registro
- [RFC 1918: Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918) (consultata il 19/10/2026): sezione 3
- [RFC 6598: IANA-Reserved IPv4 Prefix for Shared Address Space](https://www.rfc-editor.org/rfc/rfc6598) (consultata il 19/10/2026)
- [RFC 5737: IPv4 Address Blocks Reserved for Documentation](https://www.rfc-editor.org/rfc/rfc5737) (consultata il 19/10/2026)
- [RFC 3927: Dynamic Configuration of IPv4 Link-Local Addresses](https://www.rfc-editor.org/rfc/rfc3927) (consultata il 19/10/2026)
- [RFC 1112: Host Extensions for IP Multicasting](https://www.rfc-editor.org/rfc/rfc1112) (consultata il 19/10/2026): sezione 4, gli indirizzi dei gruppi di host e l’intervallo di classe E
- [RFC 5771: IANA Guidelines for IPv4 Multicast Address Assignments](https://www.rfc-editor.org/rfc/rfc5771) (consultata il 19/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
