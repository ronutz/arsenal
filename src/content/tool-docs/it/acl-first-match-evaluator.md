## Cosa fa

Incolla una lista di controllo degli accessi (ACL) IPv4 Cisco IOS o IOS XE così come la copieresti da una configurazione, descrivi un pacchetto e lo strumento indica quale voce lo decide. Ogni voce verificata prima di quella mostra il primo campo che l’ha esclusa (protocollo, indirizzo di origine, porta di origine, indirizzo di destinazione, porta di destinazione, `established` o `fragments`); quando nessuna voce corrisponde, il pacchetto arriva alla negazione implicita (implicit deny). Un lint legge l’intera lista, con o senza pacchetto. Tutto viene calcolato nel tuo browser a partire dal testo che incolli; nulla viene applicato a un dispositivo.

L’ambito è voluto: **la v1 legge solo la sintassi IPv4 di Cisco IOS e IOS XE.** Il modo in cui una lista finisce è un comportamento della piattaforma, non uno standard: Juniper EX chiude ogni filtro con uno scarto implicito (implicit discard), mentre Extreme Switch Engine e Fabric Engine consentono ciò a cui nessuna regola corrisponde. L’[articolo sulle ACL](/learn/access-control-lists-on-switches-and-routers) mette le piattaforme a confronto, con le relative fonti.

## Cosa legge

- **Liste numerate**: righe `access-list`, standard da 1 a 99 e da 1300 a 1999, estese da 100 a 199 e da 2000 a 2699, con le relative righe `remark`.
- **Liste con nome**: un blocco `ip access-list standard NAME` o `ip access-list extended NAME`, voci con o senza numeri di sequenza, righe `remark`. Un nome inizia con una lettera; un numero nell’intervallo giusto indica la stessa lista delle righe `access-list` con quel numero. Se il testo incollato contiene più liste, vengono lette tutte; i pulsanti scelgono quella da valutare.
- **Indirizzi**: `any` (0.0.0.0 255.255.255.255), `host A` (A 0.0.0.0), un indirizzo con la sua wildcard e, in una voce standard, un indirizzo da solo, che prende 0.0.0.0 come maschera. I bit della wildcard impostati a 1 vengono ignorati e non devono essere per forza contigui.
- **Protocolli**: `ip` (tutti i protocolli), un numero da 0 a 255 e le parole chiave di cui una fonte indica il numero: `icmp` 1, `igmp` 2, `tcp` 6, `udp` 17, `gre` 47, `esp` 50, `eigrp` 88, `pim` 103 (IANA, con la stessa parola chiave) e `ospf` 89 (RFC 2328). Cisco accetta anche `ahp`, `ipinip`, `nos` e `pcp`; nessuna delle fonti consultate ne indica il numero, quindi una riga che ne usa una viene elencata con questo motivo e puoi scrivere il numero al suo posto.
- **Porte**, solo dopo `tcp` o `udp`: `eq` e `neq` con un massimo di 10 porte, `lt`, `gt` e `range` (estremi inclusi). Un operatore dopo l’origine verifica la porta di origine, dopo la destinazione la porta di destinazione. Una porta è un numero da 0 a 65535 o un nome dell’elenco TCP o UDP del modello dati di Cisco IOS XE 17.18.1 (`www` è TCP 80, `domain` 53 su entrambi, `snmp` UDP 161…); un nome TCP funziona solo con `tcp`, un nome UDP solo con `udp`.
- **Opzioni**: `established` (solo TCP: per corrispondere servono ACK o RST impostati), `fragments` (la voce si applica solo ai frammenti non iniziali), `log` e `log-input`.

Le righe che lo strumento non legge vengono elencate sotto il risultato con il motivo, mai scartate: object group, tipi di messaggio ICMP e IGMP, `dscp`, `precedence`, `tos`, `time-range`, `option`, `ttl`, flag TCP diversi da `established`, voci `dynamic` e reflexive, nomi host, comandi `no`, `ip access-list resequence`, `ip access-group` (il punto in cui una lista viene applicata) e l’output di `show access-lists`. Quando una di queste righe sembra una voce, il risultato precisa che il verdetto riguarda solo le voci lette.

## La verifica voce per voce

Cisco valuta una lista **per numero di sequenza** e la prima voce che corrisponde decide; nulla di ciò che segue viene letto. Lo strumento verifica le voci in quest’ordine:

- Una voce scritta senza numero riceve 10 in più del numero più alto della sua lista (10 se è la prima) e va in fondo. Un numero già presente nella lista viene rifiutato (Cisco risponde `Duplicate sequence number`) e una voce identica a una già presente, salvo il numero, non cambia nulla; entrambe vengono elencate tra le righe non lette.
- In una lista **standard**, Cisco inserisce in una tabella hash le voci che indicano un singolo host e cerca l’origine in quella tabella prima di esaminare le altre voci. La verifica segue quest’ordine e lo segnala quando una voce host viene verificata prima di un numero di sequenza più basso.
- Una voce **standard** verifica solo l’indirizzo di origine: protocollo, destinazione e porte del pacchetto non hanno alcun ruolo.
- Quando nessuna voce corrisponde, il pacchetto viene negato dalla negazione implicita, che Cisco documenta come l’istruzione deny non scritta che chiude ogni ACL.
- A una lista senza voci non si applica il verdetto della negazione implicita: Cisco documenta che un’interfaccia a cui è applicata un’ACL vuota consente tutto il traffico.

Il pacchetto di test è un pacchetto non frammentato: una voce con `fragments` non gli corrisponde mai.

## Il lint

- **Oscurata**: una voce precedente corrisponde a ogni pacchetto a cui corrisponderebbe questa, con l’azione opposta, quindi questa non decide mai nulla.
- **Ridondante**: una voce precedente corrisponde a ogni pacchetto a cui corrisponderebbe questa, con la stessa azione; oppure lo fa una voce successiva e nessuna voce intermedia decide diversamente per qualcuno di quei pacchetti. Rimuoverla non cambia nulla.
- **Ripete solo la negazione implicita**: una voce deny con cui nessuna voce permit successiva si sovrappone. Non cambia alcun verdetto, anche se il suo contatore (o il suo `log`) mostra il traffico.
- **Non corrisponde mai**: un test sulla porta che nessuna porta supera, come `lt 0`.
- **Wildcard non contigua**: lecita su Cisco, segnalata perché nessuna lunghezza di prefisso può esprimerla e i suoi indirizzi non formano un unico blocco.
- **Bit ignorati**: un indirizzo con bit impostati dove la sua wildcard li ignora (`10.1.1.5 0.0.0.255` corrisponde a 10.1.1.0/24).
- **Portata di una lista standard**: le sue voci verificano solo l’origine, quindi ognuna decide per tutto ciò che quelle origini inviano.

Il lint ragiona sui frammenti non iniziali oltre che sui pacchetti interi, perché Cisco li verifica in modo diverso: una voce deny con porte o `established` non si applica a un frammento non iniziale, e si passa alla voce successiva. Una voce che segue una deny di questo tipo viene quindi detta oscurata «per ogni pacchetto non frammentato», con il motivo, invece che oscurata e basta.

Ogni indirizzo di ogni voce viene mostrato così come è scritto, come indirizzo e wildcard con i bit ignorati azzerati, come prefisso in notazione RFC 4632 quando la wildcard è contigua, e con il numero di indirizzi a cui corrisponde.

## Cosa non può sapere

- Cosa contiene il dispositivo. Lo strumento legge il testo che incolli; una riga che non legge può comunque essere una voce sul dispositivo.
- Dove è applicata la lista, e in quale direzione. Una porta, una VLAN o un’interfaccia routed, in ingresso o in uscita, determina quali pacchetti arrivano davvero alla lista; l’articolo spiega i punti di applicazione.
- I limiti hardware. Una lista letta correttamente può comunque non entrare nella TCAM dello switch.
- Le altre piattaforme. La loro sintassi e il modo in cui chiudono una lista sono diversi; la v1 non le legge.

## Esempi

Il pulsante Esempio carica la lista del laboratorio del corso al capitolo 4.3 di LAN Switch Operations and Maintenance: consente SSH da 10.1.10.0/24 verso la rete di gestione 10.1.99.0/24, nega tutto il resto verso 10.1.99.0/24 e consente il resto, come `ip access-list extended MGMT-PROTECT` con numeri di sequenza 10, 20 e 30. Il suo pacchetto è SSH dalla VLAN 20 (TCP da 10.1.20.25 porta 51514 a 10.1.99.10 porta 22): la voce 10 fallisce sull’indirizzo di origine e la voce 20 lo nega. Cambia l’origine in 10.1.10.25 e la voce 10 lo consente; scambia le prime due voci e l’SSH dalla VLAN 10 viene negato, con la permit segnalata come oscurata. I vettori di test di riferimento (golden vectors) coprono la prima corrispondenza su ogni campo, ogni operatore di porta ai suoi estremi, liste standard ed estese, l’ordine della tabella hash, numeri di sequenza fuori ordine, entrambi i tipi di ridondanza e le righe non lette; uno di essi è l’esempio di wildcard non contigua della documentazione di Extreme Fabric Engine (3.4.5.6 con 255.255.255.0 corrisponde a 192.168.1.6 e non a 3.4.5.7), scritto con la sintassi Cisco.

## API

Lo stesso motore risponde all’operazione `/api/v1/acl-first-match-evaluator` dell’API HTTP del sito, descritta nel contratto OpenAPI della [pagina dell’API](/api), che indica anche se questo sito offre l’API.

- **Richiesta.** L’ACL come testo (letta e sottoposta al lint), oppure un oggetto JSON `{"acl": "...", "packet": {"protocol": "tcp", "source": "10.1.20.25", "destination": "10.1.99.10", "sourcePort": 51514, "destinationPort": 22, "ackOrRst": false}, "list": "MGMT-PROTECT"}` (e verificata voce per voce per quel pacchetto). `packet` e `list` sono facoltativi; le porte possono essere numeri o stringhe.
- **Risposta.** `lists` (ognuna con `name`, `kind`, `line`, `entries`, `evaluationOrder` e `remarks`; ogni voce con `seq`, `seqGiven`, `line`, `text`, `action`, `protocol`, `source`, `sourcePort`, `destination`, `destinationPort`, `established`, `fragments`, `log` e `hashed`; ogni indirizzo con `written`, `form`, `address`, `wildcard`, `base`, `contiguous`, `prefix`, `addresses` e `ignoredBitsSet`), `selected`, `issues` (`line`, `text`, `entryLike`, `reason`), `packet`, `packetErrors`, `steps` (`seq`, `line`, `text`, `action`, `matched`, `field`, `reason`), `verdict` (`action`, `by`: `entry`, `implicit-deny` o `empty-list`, `seq`, `line`, `text`, `sentence`), `lint` (`kind`, `seq`, `line`, `other`, `sentence`), `notes` e `counts`.
- **Errori.** HTTP 400 per una richiesta che inizia con `{` ma non è JSON valido o non ha una stringa `acl`, e per un testo di oltre 65.536 caratteri o 4000 righe. Una riga che non si riesce a leggere, o un pacchetto che non si riesce a leggere, non è un errore HTTP: `issues` e `packetErrors` ne indicano il motivo.

## Condivisione dei risultati

Sotto il verdetto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` l’ACL così come l’hai incollata (`input`) e il pacchetto di test così come l’hai inserito (`protocol`, `source`, `srcport`, `destination`, `dstport` e `ackrst` quando la casella è selezionata), più `list` se hai scelto una lista diversa dalla prima. Il suo riquadro a comparsa indica prima cosa contiene il link, poi un avvertimento specifico (un’ACL indica reti e host interni e ciò che può raggiungerli), poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La lista passa anche per il controllo dei segreti del sito: un valore che è una credenziale per il suo formato (una password in un URL, una chiave privata PEM, un JWT), in un commento (remark) o altrove, impedisce il link, e il riquadro a comparsa ne indica la riga. Metti un segnaposto al suo posto e premi di nuovo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 02/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La lista e ogni campo del pacchetto vengono compilati così come sono stati inseriti e la pagina li legge; non viene contattato nulla. Un valore del pacchetto che lo strumento non riesce a leggere mostra lo stesso messaggio che comparirebbe inserendolo a mano. I valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Fonti

- [Cisco, Security and VPN Configuration Guide, Cisco IOS XE 17.x: IP Access List Entry Sequence Numbering](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/sec-vpn/b-security-vpn/m_sec-acl-seq-num.html) (consultato il 02/11/2026; VPN sta per Virtual Private Network, rete privata virtuale): la prima corrispondenza, il pacchetto scartato quando nessuna condizione corrisponde («If no conditions match, the packet is dropped»), la lista vuota, i numeri di sequenza assegnati a intervalli di 10, i duplicati rifiutati, le voci host standard inserite in una tabella hash e cercate per prime
- [Cisco, ACLs Configuration Guide, Cisco IOS XE 17 (Catalyst 9000): Access Control Lists](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/security/acls/acls-configuration-guide/access-control-lists.html) (consultato il 02/11/2026): il numero di sequenza, che stabilisce l’ordine di valutazione delle voci («dictates the order in which ACEs are evaluated»), i commenti, la sintassi numerata e gli intervalli, gli operatori di porta, `established`
- [Cisco IOS Security Command Reference, Commands A to C](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/security/a1/sec-a1-cr-book/sec-cr-a2.html) (consultato il 02/11/2026): `access-list (IP extended)` e `access-list (IP standard)`: protocolli, bit della wildcard, operatori e nomi di porta, `established`, `fragments`, `log`, la negazione implicita
- [Cisco, IOS XE 17.18.1 YANG model Cisco-IOS-XE-acl](https://raw.githubusercontent.com/YangModels/yang/main/vendor/cisco/xe/17181/Cisco-IOS-XE-acl.yang) (consultato il 02/11/2026): `eq` e `neq` con un massimo di 10 porte, numeri di sequenza da 1 a 2147483647, commenti da 1 a 100 caratteri
- [Cisco, IOS XE 17.18.1 YANG model Cisco-IOS-XE-types](https://raw.githubusercontent.com/YangModels/yang/main/vendor/cisco/xe/17181/Cisco-IOS-XE-types.yang) (consultato il 02/11/2026): intervalli di numeri delle liste, nomi delle porte TCP e UDP con i relativi numeri
- [Cisco, End-of-Sale and End-of-Life Announcement for the Cisco IOS XE 17.18.x](https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xe-17/ios-xe-17-18-x-eol.html) (consultato il 02/11/2026): release di manutenzione del software fino al 29 aprile 2028, correzioni di sicurezza fino al 30 settembre 2029
- [RFC 4632, Classless Inter-domain Routing (CIDR)](https://www.rfc-editor.org/rfc/rfc4632.txt) (consultata il 02/11/2026): la notazione dei prefissi e le maschere contigue
- [IANA, Assigned Internet Protocol Numbers](https://www.iana.org/assignments/protocol-numbers/protocol-numbers-1.csv) (consultato il 02/11/2026): i numeri di protocollo dietro le parole chiave
- [RFC 2328, OSPF Version 2](https://www.rfc-editor.org/rfc/rfc2328.txt) (consultata il 02/11/2026): «OSPF is IP protocol number 89»
- [Juniper Networks, Understanding how firewall filters are evaluated (EX Series)](https://www.juniper.net/documentation/us/en/software/junos/routing-policy/topics/concept/firewall-filter-ex-series-evaluation-understanding.html) (consultato il 02/11/2026): lo scarto implicito alla fine di ogni filtro
- [Extreme Networks, Switch Engine v33.7.1 User Guide (PDF)](https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20User%20Guide/downloads/Switch_Engine_33_7_1_User_Guide.pdf) (consultato il 02/11/2026): un pacchetto a cui nessuna regola corrisponde viene consentito («If a packet matches no rule entries in the ACL, it is permitted»)
- [Extreme Networks, Fabric Engine v9.4 User Guide, access control lists](https://documentation.extremenetworks.com/Fabric%20Engine%20v9.4%20User%20Guide/fe_9.4_ug_revacdev/content/documents/Switch_Operating_Systems/VOSS_and_Fabric_Engine/fabric_engine_user_guide/access_control_lists.shtml) (consultato il 02/11/2026): l’azione predefinita delle ACL è consentire («The default action mode for ACLs is permit»)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, section 3.5](https://www.rfc-editor.org/rfc/rfc3986#section-3.5) (consultata il 02/11/2026): il frammento, su cui si basa la condivisione dei risultati
