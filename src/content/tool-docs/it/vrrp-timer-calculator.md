## Cosa fa

Il protocollo VRRP (Virtual Router Redundancy Protocol) consente a più router di una LAN di condividere un unico indirizzo di gateway predefinito. Uno di essi, l’Active Router, inoltra il traffico per l’indirizzo virtuale e invia un ADVERTISEMENT a ogni intervallo; gli altri, i Backup, attendono, e quello che per primo smette di ricevere gli ADVERTISEMENT subentra. Quanto dura quell’attesa, chi vince e quale indirizzo MAC vedono gli host sono tutti aspetti fissati dallo standard, e questo calcolatore li ricava con esattezza, in tre modalità:

- **Timer.** Per la priorità di un router e l’intervallo di advertisement: Skew_Time e il tempo che un Backup attende prima di dichiarare fuori servizio l’Active Router, con il calcolo mostrato, e quando un Backup con quella priorità subentra dopo un guasto silenzioso e dopo uno spegnimento ordinato.
- **Elezione.** Per un numero di router da due a otto, ciascuno con un nome, una priorità, un indirizzo primario e l’indicazione se possiede l’indirizzo virtuale, con Preempt_Mode attivo o disattivato: chi diventa Active Router e perché, chi subentra quando si guasta in modo silenzioso o si spegne in modo ordinato e quanto tempo serve, cosa succede quando torna, e i timer di ogni router.
- **MAC virtuale.** Per un VRID (Virtual Router Identifier) e una famiglia di indirizzi: il Virtual Router MAC address in tre notazioni.

Le regole sono quelle della [RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), VRRP versione 3 per IPv4 e IPv6 (aprile 2024), che rende obsoleta la RFC 5798, la quale a sua volta aveva reso obsoleta la RFC 3768 ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), sezione Abstract). Un selettore in cima al modulo sceglie invece VRRPv2, con le regole della [RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt) (aprile 2004, resa obsoleta dalla RFC 5798 e ora dalla RFC 9568), per gli apparati meno recenti che lo usano ancora. Tutto viene calcolato nel tuo browser, e nulla viene arrotondato.

## Nomi: Active o Master

La RFC 9568 ha rinominato il router che inoltra il traffico: «The term for the VRRP Router assuming forwarding responsibility has been changed to “Active Router” to be consistent with IETF inclusive terminology» ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), sezione 1.1). Il tempo di attesa corrispondente è Active_Down_Interval, misurato dall’Active_Down_Timer. La RFC 3768, e la RFC 5798 prima che la RFC 9568 la sostituisse, dicono Master, Master_Down_Interval e Master_Down_Timer, e l’output di molti router lo dice ancora. La pagina usa i termini di ciascuna versione: Active Router e Active_Down_Interval per VRRPv3, Master e Master_Down_Interval per VRRPv2.

## Timer: i dati in ingresso

- **Versione di VRRP**: VRRPv3 (RFC 9568) o VRRPv2 (RFC 3768).
- **Priorità**: un numero intero da 1 a 255. «The priority value for the VRRP Router that owns the IPvX address associated with the Virtual Router MUST be 255 (decimal)», e «VRRP Routers backing up a Virtual Router MUST use priority values between 1-254 (decimal). The default priority value for VRRP Routers backing up a Virtual Router is 100 (decimal)» ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), sezione 5.2.4). Quattro valori preimpostati compilano il campo: 255 (il proprietario), 254, 100 (il predefinito) e 1.
- **Intervallo di advertisement**: per VRRPv3, centesimi di secondo, oppure un tempo con l’unità: `100`, `1 s`, `250 ms`, `0.5 s`. Il campo è di 12 bit di centesimi di secondo ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), sezione 5.2.7), e l’erratum verificato 8301 rende esplicito l’intervallo configurabile: «Configurable value in the range 1-4095 (centiseconds). Default is 100 centiseconds (1 second)» ([errata della RFC 9568](https://www.rfc-editor.org/errata/rfc9568)). Per VRRPv2, secondi interi da 1 a 255: il campo Adver Int è di 8 bit e «indicates the time interval (in seconds) between ADVERTISEMENTS. The default is 1 second» ([RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt), sezioni 5.1 e 5.3.7). Un campo vuoto vale il predefinito della versione. I decimali si scrivono con il punto.

## Timer: cosa calcola

Per VRRPv3, le formule della [RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), sezione 6.1, in centesimi di secondo:

```text
Skew_Time            = (((256 - Priority) * Active_Adver_Interval) / 256)
Active_Down_Interval = (3 * Active_Adver_Interval) + Skew_Time
```

Active_Adver_Interval è l’intervallo che un Backup legge negli ADVERTISEMENT dell’Active Router; il suo valore iniziale coincide con Advertisement_Interval («initial value is the same as Advertisement_Interval»), l’impostazione del Backup stesso (sezione 6.1), e un Backup passa al valore annunciato ogni volta che accetta un ADVERTISEMENT (sezione 6.4.2). La pagina mostra entrambe le formule con i tuoi numeri: con priorità 100 e 100 cs, (256 - 100) x 100 = 15.600, diviso 256 dà 60,9375 cs, e 3 x 100 + 60,9375 dà 360,9375 cs, cioè 3,609375 secondi.

Per VRRPv2, le formule della [RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt), sezione 6.1, in secondi:

```text
Skew_Time            = ( (256 - Priority) / 256 )
Master_Down_Interval = (3 * Advertisement_Interval) + Skew_time
```

Le due versioni non differiscono solo per l’unità. In VRRPv3 lo skew è una frazione dell’intervallo; in VRRPv2 è una frazione di un secondo, qualunque sia l’intervallo. Con il valore predefinito di 1 secondo danno gli stessi valori, ma a 3 secondi un Backup VRRPv2 con priorità 100 attende 9,609375 s, mentre un Backup VRRPv3 a 300 cs attende 1082,8125 cs (10,828125 s). Per questo le due versioni non si mescolano mai in un unico calcolo: un intervallo in centesimi di secondo o in millisecondi con VRRPv2 viene rifiutato, come pure una frazione di secondo.

**Valori esatti.** Ogni timer è un numero intero di 256esimi dell’unità della versione, quindi ha un decimale esatto, e la pagina lo stampa per intero: 0,78125 cs con priorità 254, 99,609375 cs con priorità 1. «La RFC non prevede arrotondamenti» è un dato di fatto sullo standard, non una scorciatoia di questo strumento: un’implementazione mantiene i timer alla propria risoluzione, quindi la visualizzazione di un router può mostrare un valore arrotondato.

**Quando subentra un Backup con questa priorità.**

- **Dopo un guasto silenzioso.** L’Active Router si ferma, e l’Active_Down_Timer di un Backup, «Timer that fires when a VRRP Advertisement has not been received for Active_Down_Interval» ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), sezione 6.2), scatta un Active_Down_Interval dopo l’ultimo ADVERTISEMENT ricevuto. Contando dal guasto stesso, il tempo va da un intervallo in meno di Active_Down_Interval (il guasto è avvenuto poco prima dell’ADVERTISEMENT successivo previsto) all’intero Active_Down_Interval (è avvenuto subito dopo un ADVERTISEMENT): da 2,609375 s a 3,609375 s con priorità 100 e 1 s.
- **Dopo uno spegnimento ordinato.** Un Active Router che si spegne invia «an ADVERTISEMENT with Priority = 0» (sezione 6.4.3), e un Backup che lo riceve imposta il proprio timer «to Skew_Time» (sezione 6.4.2): 0,609375 s con priorità 100 e 1 s.

I ritardi di propagazione e di elaborazione non sono inclusi, né il tempo che switch e host impiegano a seguire il MAC virtuale fino alla sua nuova porta.

**Priorità 255.** I timer del proprietario vengono calcolati, ma in una rete funzionante il proprietario non li attende mai: all’avvio un router con priorità 255 invia un ADVERTISEMENT e passa subito allo stato Active («to the {Active} state», sezione 6.4.1), e prevale su qualsiasi priorità inferiore indipendentemente da quel flag («independent of the setting of this flag», sezione 6.1). Attenderebbe come Backup solo se anche un secondo router rivendicasse 255, e «only a single VRRP Router on the link SHOULD be configured with priority 255» (sezione 8.3.2).

**Intervalli inferiori al secondo.** Sotto i 100 cs la pagina aggiunge l’avvertenza della RFC 9568 stessa: un ritardo di accodamento più lungo dell’intervallo può far sì che un Backup si promuova e poi torni indietro, e «this process can repeat many times per second, causing a significant disruption of traffic» (sezione 2.5).

## Elezione: i dati in ingresso

- **Versione di VRRP** e **Intervallo di advertisement**, come sopra; l’intervallo è lo stesso su ogni router.
- **Preempt_Mode**: attivo (il predefinito) o disattivato, lo stesso su ogni router. «Controls whether a (starting or restarting) higher-priority Backup Router preempts a lower-priority Active Router. Values are True to allow preemption and False to prohibit preemption. Default is True.» ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), sezione 6.1).
- **Da due a otto router**, ciascuno con:
  - un **nome**: fino a 32 tra lettere, cifre, punti, trattini o underscore, senza spazi; un nome vuoto diventa R1, R2 e così via;
  - una **priorità**, da 1 a 254, oppure 255 per il proprietario;
  - il suo **indirizzo primario**: in IPv4 «an IPv4 address selected from the set of real interface addresses», e «In IPv6, the link-local address of the interface over which the packet is transmitted is used» ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), sezione 1.7), quindi un indirizzo primario IPv6 deve rientrare in fe80::/10 ([RFC 4291](https://www.rfc-editor.org/rfc/rfc4291.txt), sezione 2.5.6);
  - **Possiede l’indirizzo virtuale**: spuntato per il router il cui indirizzo reale di interfaccia è l’indirizzo virtuale. Spuntarlo imposta la priorità a 255.

## Elezione: le regole che applica

La pagina esegue la macchina a stati della RFC 9568 (sezione 6.4) attraverso quattro momenti, con tutti i router che partono insieme e ogni ADVERTISEMENT che arriva istantaneamente:

1. **All’avvio.** Il proprietario invia un ADVERTISEMENT e passa subito allo stato Active («to the {Active} state»); ogni altro router parte come Backup con l’Active_Down_Timer impostato ad Active_Down_Interval (sezione 6.4.1). Senza un proprietario, la priorità più alta ha l’Active_Down_Interval più breve, quindi il suo timer scatta per primo e il router diventa Active; gli altri accettano il suo ADVERTISEMENT, la cui priorità è più alta della loro, e restano Backup (sezione 6.4.2).
2. **Un guasto silenzioso dell’Active Router.** Il miglior Backup rimasto subentra quando scatta il suo timer, con i tempi della modalità Timer.
3. **Uno spegnimento ordinato dell’Active Router.** Il suo ADVERTISEMENT con priorità 0 imposta il timer di ogni Backup al rispettivo Skew_Time, e il miglior Backup rimasto, con lo skew più breve, subentra per primo.
4. **Il suo ritorno.** Il proprietario torna subito Active, qualunque sia Preempt_Mode. Qualsiasi altro router parte come Backup: un Backup reimposta il proprio timer alla ricezione di un ADVERTISEMENT «If Preempt_Mode is False, or if the Priority in the ADVERTISEMENT is greater than or equal to the local Priority», e altrimenti lo scarta (sezione 6.4.2). Quindi, con Preempt_Mode attivo e una priorità più alta, il router che torna ignora gli ADVERTISEMENT dell’Active Router attuale, il suo timer scatta un Active_Down_Interval dopo il suo avvio, e subentra; l’Active Router attuale, ricevendo una priorità più alta, torna Backup (sezione 6.4.3). Con Preempt_Mode disattivato, o con la stessa priorità dell’Active Router attuale, resta Backup.

**Parità.** Due Backup con la stessa priorità massima vanno in timeout insieme e diventano entrambi Active. Un Active Router torna Backup quando «the Priority in the ADVERTISEMENT is equal to the local Priority and the primary IPvX address of the sender is greater than the local primary IPvX address (based on an unsigned integer comparison of the IPvX addresses in network byte order)» (sezione 6.4.3), quindi resta Active l’indirizzo primario più alto. Il confronto è numerico: 192.0.2.10 batte 192.0.2.9, e fe80::1:0 batte fe80::ff. L’indirizzo risolve una parità solo tra Active Router, ed è per questo che un router che torna con la stessa priorità dell’Active Router attuale resta Backup anche quando il suo indirizzo è più alto. Quando due router condividono una priorità la pagina avverte, perché la RFC 9568 chiede che «all Virtual Routers SHOULD be configured with different priorities and with sufficient differences in the priorities» (sezione 8.3.2).

Il risultato è il verdetto (chi è Active e perché), i quattro momenti in ordine con la regola e il tempo di ciascuno, e una tabella dei router in ordine di elezione con lo Skew_Time e l’Active_Down_Interval di ognuno.

## MAC virtuale

«IPv4 case: 00-00-5E-00-01-{VRID} (in hex, in network byte order)» e «IPv6 case: 00-00-5E-00-02-{VRID} (in hex, in network byte order)»: «The first three octets are derived from the IANA's Organizationally Unique Identifier (OUI)», i due successivi sono il blocco assegnato a VRRP per la famiglia, e l’ultimo è il VRID ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), sezione 7.3). Il VRID è un «Configurable value in the range 1-255 (decimal). There is no default» (sezione 6.1). La pagina scrive l’indirizzo in tre modi: con i trattini, come lo scrive la RFC (00-00-5E-00-01-0A); con i due punti (00:00:5e:00:01:0a); e in tre gruppi di quattro separati da punti (0000.5e00.010a). Indica anche l’ultimo ottetto in esadecimale e dove vengono inviati gli ADVERTISEMENT: 224.0.0.18 per IPv4, ff02::12 per IPv6, protocollo IP 112 (sezioni 5.1.1 e 5.1.2). VRRPv2 usa lo stesso blocco IPv4 ([RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt), sezione 7.3) e non ne ha uno IPv6.

L’Active Router risponde alle richieste ARP e ai messaggi Neighbor Solicitation per l’indirizzo virtuale con questo MAC: «The Active Router MUST NOT respond with its physical MAC address», il che «allows the host to always use the same MAC address, regardless of the current Active Router» (sezioni 8.1.2 e 8.2.2).

## Cosa rifiuta, e perché

- **Priorità 0.** Non si configura mai: «The priority value zero (0) has special meaning, indicating that the current Active Router has stopped participating in VRRP. This is used to trigger Backup Routers to quickly transition to the Active Router without having to wait for the current Active_Down_Interval» ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), sezione 5.2.4). La pagina lo dice e chiede un valore da 1 a 254, o 255 per il proprietario.
- **Priorità superiore a 255**, che il campo a 8 bit non può contenere, e tutto ciò che non è un numero intero.
- **Un proprietario la cui priorità non è 255**, e **la priorità 255 su un router non indicato come proprietario** (la sezione 6.1 la riserva al proprietario).
- **Due proprietari.** Ne DOVREBBE esistere solo uno (sezione 8.3.2). Nel testo pubblicato, la sezione 7.1 fa scartare a un router qualsiasi ADVERTISEMENT quando è esso stesso il proprietario, quindi due proprietari restano entrambi Active; l’erratum verificato 8298 modifica quel controllo in modo che vinca l’indirizzo primario più alto. L’esito dipende da quale testo segue un’implementazione, quindi la pagina non tira a indovinare.
- **VRID 0 o superiore a 255**, e un VRID in esadecimale: il VRID si inserisce in decimale.
- **Un intervallo di 0**, che l’erratum verificato 8301 esclude perché un intervallo nullo fa andare in timeout ogni Backup all’istante; **oltre 4095 cs** (40,95 s) per VRRPv3 o **oltre 255 s** per VRRPv2; e **una frazione dell’unità della versione** (255 ms sono 25,5 cs).
- **Aritmetica VRRPv2 e VRRPv3 mescolata**: un intervallo in centesimi di secondo o in millisecondi con VRRPv2, e IPv6 con VRRPv2, che «is intended for use with IPv4 routers only» ([RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt), sezione 1.2).
- **Router che mescolano IPv4 e IPv6** (un router virtuale appartiene a una sola famiglia, RFC 9568, sezione Abstract), **un indirizzo primario IPv6 che non è link-local**, **due router con lo stesso indirizzo primario** (confrontati per valore, quindi fe80::1 e fe80:0:0:0:0:0:0:1 sono lo stesso indirizzo), due router con lo stesso nome, meno di due o più di otto router, e un indirizzo con una lunghezza di prefisso o una zona.

## Esempi svolti

Gli esempi sono il laboratorio VRRP del capitolo 4.2 del corso aperto [LAN Switch Operations and Maintenance](/materials/lan-switch-operations-and-maintenance): VRID 10 sulla VLAN 10, il gateway virtuale 10.1.10.1, SW-CORE-01 con priorità 110 e 10.1.10.2 e SW-CORE-02 con priorità 100 e 10.1.10.3, preemption attiva, un intervallo di un secondo.

- **Timer**, priorità 100 a 100 cs: Skew_Time 60,9375 cs (0,609375 s), Active_Down_Interval 360,9375 cs (3,609375 s). Un link interrotto sposta il gateway da 2,609375 s a 3,609375 s dopo il guasto, i «circa 3,6 s» del laboratorio; uno spegnimento ordinato lo sposta 0,609375 s dopo l’ADVERTISEMENT con priorità 0, i «circa 0,6 s» del laboratorio.
- **Elezione**: SW-CORE-01 ha la priorità più alta e diventa Active Router 357,03125 cs (3,5703125 s) dopo l’avvio di entrambi; se si guasta, subentra SW-CORE-02 come sopra; quando SW-CORE-01 torna con la preemption attiva, riprende il ruolo 3,5703125 s dopo il proprio avvio. Con la preemption disattivata resta Backup, ed è il suggerimento con cui si chiude il laboratorio.
- **MAC virtuale**, VRID 10, IPv4: 00-00-5E-00-01-0A, l’indirizzo che gli host del laboratorio apprendono per 10.1.10.1.
- **La tabella dell’articolo**, a 100 cs: la priorità 254 attende 300,78125 cs, la 200 attende 321,875 cs, la 1 attende 399,609375 cs; a 1 cs un Backup con priorità 254 attende 3,0078125 cs, circa 30 millisecondi.
- **I limiti**: a 4095 cs un Backup con priorità 1 attende 16.364,00390625 cs (163,6400390625 s); un Backup VRRPv2 con priorità 1 e 255 s attende 765,99609375 s.
- **Una parità**: due router con priorità 100, con 192.0.2.2 e 192.0.2.3, diventano entrambi Active dopo 3,609375 s, e 192.0.2.3 resta Active; se si guasta, subentra 192.0.2.2, e quando 192.0.2.3 torna resta Backup, con o senza preemption.

## Cosa non fa

Non comunica con alcun router: priorità, indirizzi e intervallo li fornisci tu. Presuppone che ogni router abbia lo stesso intervallo e lo stesso Preempt_Mode, che i router partano insieme e che gli ADVERTISEMENT arrivino senza ritardo. Il tracking (abbassare una priorità quando un uplink si guasta), i ritardi di preemption, Accept_Mode, l’ARP gratuito e la rapidità con cui gli switch riapprendono il MAC, l’interoperabilità tra VRRPv2 e VRRPv3 (RFC 9568, sezione 8.4) e HSRP restano fuori. I valori predefiniti e i comandi dei vendor non sono inclusi: per quelli, leggi la documentazione del vendor e le slide sui vendor del corso. Per eseguire passo passo una sequenza di guasti e ritorni, usa il laboratorio sull’elezione dell’articolo [First-hop redundancy](/learn/first-hop-redundancy-vrrp-and-hsrp).

## Condivisione dei risultati

Sotto il verdetto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la modalità, la versione e i campi della modalità visualizzata, così come li hai inseriti: sempre `mode` (`timers`, `election` o `mac`) e `version` (`3` o `2`); nella modalità Timer `priority`, e `interval` se inserito; nella modalità Elezione `routers`, un router per riga scritto come `<name> <priority> <address>`, con ` owner` dopo il proprietario e `*` per un campo lasciato vuoto, `preempt` (`1` o `0`), e `interval` se inserito; nella modalità MAC virtuale `vrid` e `family` (`ipv4` o `ipv6`). I campi delle altre modalità non sono inclusi. Nella modalità Elezione il riquadro a comparsa aggiunge un’avvertenza: i nomi dei router e gli indirizzi primari descrivono una rete privata, quindi rileggili prima di inviare il link.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 02/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi questi valori non vengono inviati al server quando si apre il link; restano nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerli.

- **Lunghezza massima.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; questi campi sono molto più corti.
- **Apertura di un link.** La modalità, la versione e i campi della modalità vengono impostati come li imposterebbe la digitazione (un intervallo che il link non contiene resta vuoto, cioè vale il predefinito; un `preempt` mancante vale attivo), le altre modalità conservano i propri valori, e la pagina esegue il calcolo. Un link con una modalità, una versione, un valore di `preempt` o una famiglia sconosciuti, un campo di un’altra modalità, un campo obbligatorio mancante, un valore su due righe (tranne l’elenco dei router) o un elenco di router che non è formato da due a otto righe di tre o quattro parole viene ignorato. Accettati o no, i valori lasciano poi subito l’indirizzo della pagina stessa, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.

## Provenienza

Il motore è aritmetica fissa e una lettura fissa della macchina a stati, senza orologio, senza rete e senza casualità. Include 133 vettori di test di riferimento (golden vectors, insieme `vrrp-timer-calculator-golden-2026-11-02`): 26 righe di timer (priorità 1, 100, 200, 254 e 255 con l’intervallo predefinito, a 1 cs e a 4095 cs, e VRRPv2 a 1 s e a 255 s), 14 elezioni, 12 MAC virtuali, i tre esempi, le grafie degli intervalli e i valori predefiniti, le frasi che enunciano le regole e 51 rifiuti. Ogni valore atteso e ogni esito di elezione è stato ricavato da un’implementazione separata, non eseguendo questo motore: i timer con le formule della RFC nelle frazioni esatte di Python, e le elezioni con una simulazione a eventi discreti della macchina a stati della RFC 9568 (timer, ADVERTISEMENT, priorità 0, preemption e spareggio per indirizzo) attraverso i quattro momenti, con il confronto di indirizzi di Python stesso. Gli errata sono stati letti lo stesso giorno: la RFC 9568 ha sei errata verificati, di cui l’8301 (l’intervallo da 1 a 4095) e l’8298 (due proprietari) determinano il comportamento di questo strumento, mentre gli altri (7947 e 7949 sull’ARP gratuito, 8299 e 8300 sui controlli in ricezione) non cambiano alcun timer; la RFC 3768 non ne ha.

## API

Lo stesso motore risponde a `/api/v1/vrrp-timer-calculator` dell’API HTTP del sito; il contratto si trova nella [pagina dell’API](/api), che indica anche se questo sito offre l’API.

- **Richiesta.** Un oggetto JSON. Timer: `{"mode": "timers", "version": 3, "priority": 100, "interval": "100"}`; `version` (3 per impostazione predefinita) e `interval` (il predefinito se assente) sono facoltativi, e un intervallo senza unità è espresso nell’unità della versione. Elezione: `{"mode": "election", "version": 3, "interval": "100", "preempt": true, "routers": [{"name": "SW-CORE-01", "priority": 110, "address": "10.1.10.2"}, {"name": "SW-CORE-02", "priority": 100, "address": "10.1.10.3"}]}`; `preempt` (true per impostazione predefinita), `name` e `owner` (false per impostazione predefinita) sono facoltativi, e la `priority` di un proprietario può essere omessa. MAC virtuale: `{"mode": "mac", "vrid": 10, "family": "ipv4"}`.
- **Risposta, timer.** `mode`, `version`, `unit` (`cs` o `s`), `names` (`rfc`, `interval`, `down`, `downTimer`, `activeRole`, `activeState`), `priority`, `owner`, `interval`, `intervalSeconds`, `intervalDefault`, `skewTime`, `skewTimeSeconds`, `downInterval`, `downIntervalSeconds`, `skewNumerator`, `arithmetic` (`skew`, `down`: le formule con i valori, come `Skew_Time = ((256 - 100) * 100) / 256 = 15600 / 256 = 60.9375 cs`), `failover` (`silentFrom`, `silentTo`, `shutdown` e i rispettivi `...Seconds`; null per la priorità 255), `warnings` e `notes`. Ogni tempo è un testo decimale esatto con il punto come separatore decimale.
- **Risposta, elezione.** `mode`, `version`, `unit`, `names`, `family`, `preempt`, `preemptDefault`, `interval`, `intervalSeconds`, `intervalDefault`, `routers` (ognuno: `index`, `name`, `priority`, `address`, `owner`, `rank`, `startState`, `skewTime`, `skewTimeSeconds`, `downInterval`, `downIntervalSeconds`), `ranking`, `active`, `activeReason` (`owner`, `priority` o `address-tie`), `steps` (quattro: `event` `start`, `failure`, `shutdown` o `return`; `outcome`; `active`, `activeName`, `subject`, `tied`, `after`, `afterSeconds`, `from`, `fromSeconds`, `text`), `verdictText`, `warnings` e `notes`.
- **Risposta, MAC virtuale.** `mode`, `version`, `family`, `vrid`, `vridHex`, `block`, `hyphen`, `colon`, `dotted`, `multicastGroup`, `ipProtocol` e `notes`.
- **Errori.** HTTP 400, `invalid_input`, con il messaggio del motore, per esempio `Priority 0 is never configured: RFC 9568 reserves it for the Active Router to indicate it is relinquishing responsibility for the Virtual Router. ...`.

## Fonti

- [RFC 9568, Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6, aprile 2024](https://www.rfc-editor.org/rfc/rfc9568.txt) (consultata il 02/11/2026): sezioni 1.1, 1.7, 2.5, 5.1, 5.2.4, 5.2.7, da 6.1 a 6.4, 7.3, 8.1.2, 8.2.2 e 8.3.2. Una Proposed Standard che rende obsoleta la RFC 5798; né resa obsoleta né aggiornata
- [Errata della RFC 9568](https://www.rfc-editor.org/errata/rfc9568) (consultati il 02/11/2026): sei errata verificati; l’8301 (Advertisement_Interval da 1 a 4095 centesimi di secondo) e l’8298 (un proprietario che riceve ADVERTISEMENT) si applicano qui
- [RFC 3768, Virtual Router Redundancy Protocol (VRRP), aprile 2004](https://www.rfc-editor.org/rfc/rfc3768.txt) (consultata il 02/11/2026): VRRP versione 2, sezioni 1.2, 5.1, 5.3.7, 6.1, 6.4 e 7.3. Una Draft Standard resa obsoleta dalla RFC 5798, a sua volta resa obsoleta dalla RFC 9568; consultata solo per gli apparati meno recenti; [pagina degli errata](https://www.rfc-editor.org/errata/rfc3768): nessun erratum
- [RFC 4291, IP Version 6 Addressing Architecture, febbraio 2006](https://www.rfc-editor.org/rfc/rfc4291.txt) (consultata il 02/11/2026): sezioni 2.2 e 2.5.6
- [RFC Editor, indice delle RFC (XML)](https://www.rfc-editor.org/rfc-index.xml) (consultato il 02/11/2026): lo stato della RFC 9568, della RFC 5798 (resa obsoleta dalla RFC 9568), della RFC 3768 (resa obsoleta dalla RFC 5798) e della RFC 4291
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 02/11/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
