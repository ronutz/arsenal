## Cosa fa

Rispondi a sei domande su una sede (la banda richiesta, se è richiesta l’alta disponibilità, se l’IP in uscita è statico, se il transito deve essere cifrato, se l’apparato di edge supporta GRE e se gli endpoint interni del tunnel passano per un source NAT) e lo strumento restituisce la raccomandazione deterministica per l’inoltro: GRE o IPsec, il valore di capacità per tunnel che si applica e la regola documentata da cui deriva, e il numero minimo di tunnel primari e di backup che copre il requisito. Ogni passaggio di eliminazione viene mostrato in ordine, così la risposta insegna il ragionamento invece di sostituirlo. Stesse risposte, stessa raccomandazione, sempre; tutto viene eseguito nel tuo browser e non contatta nulla.

## I valori pubblicati da cui calcola

Tutti i valori di capacità sono quelli di Zscaler, verificati dal vivo sul portale di assistenza il 21 luglio 2026. Un tunnel GRE trasporta fino a 1 Gbps, a meno che gli indirizzi degli endpoint interni del tunnel non passino per un source NAT: in quel caso il valore scende a 250 Mbps, perché il servizio bilancia il carico del traffico GRE sugli indirizzi interni e il NAT li fa confluire in uno solo. Un tunnel IPsec trasporta fino a 400 Mbps per indirizzo IP pubblico di origine. Le forme di scalabilità rispecchiano gli esempi svolti della documentazione stessa: 2 Gbps di GRE sono due tunnel primari più due di backup su IP pubblici di origine distinti; 800 Mbps di IPsec sono due più due, ottenuti tramite IP pubblici di origine diversi oppure tramite più tunnel sullo stesso IP con NAT Traversal e randomizzazione della porta di origine sotto IKEv2.

## Come funziona l’eliminazione

GRE è preferibile quando valgono i suoi tre requisiti (un indirizzo pubblico statico in uscita, un apparato che supporta GRE e nessun obbligo di cifratura), perché è l’incapsulamento più semplice, inoltrato alla velocità dell’hardware, con il limite per tunnel più alto. Se anche un solo requisito non è soddisfatto, la risposta passa a IPsec, che tollera gli indirizzi dinamici (peer identificati tramite nome di dominio completo), fornisce la cifratura per costruzione e richiede solo che siano configurati IKEv2 e Dead Peer Detection. Il numero di tunnel è poi la divisione, arrotondata per eccesso, della banda richiesta per il valore per tunnel applicabile, e il numero di tunnel di backup rispecchia quello dei primari quando è richiesta l’alta disponibilità, con ogni tunnel di backup diretto a un Public Service Edge in un data center diverso: la forma primario/secondario documentata. Quando non è richiesta l’HA, lo strumento restituisce il minimo effettivo e dice chiaramente che il vendor raccomanda comunque un tunnel secondario.

## Cosa non finge di sapere

I valori sono indicazioni sul piano di inoltro per i tunnel delle sedi, non promesse su un circuito specifico, e lo strumento indica quale regola documentata ha prodotto ogni numero invece di inventare una precisione che non c’è. Gli utenti in roaming sono esclusi dall’ambito per scelta: un portatile fuori dalla rete inoltra il traffico tramite lo Z-Tunnel di Zscaler Client Connector, non tramite un tunnel di sede, ed è un confine che questo strumento dichiara invece di sfumarlo.

## Condivisione dei risultati

Sotto la scheda della raccomandazione, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene il modulo dopo il `#` come valori con nome, sempre tutti i campi: `mbps` così come l’hai inserito, e `ha`, `staticip`, `encryption`, `gre` e `nated` come 1 o 0. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Un valore di banda e cinque risposte sì o no non identificano nulla, quindi il riquadro a comparsa non aggiunge nulla all’avviso standard del sito. Vengono inclusi tutti i campi, non solo quelli diversi dalle risposte iniziali, così un vecchio link mantiene il suo significato anche se queste cambiano.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** I valori del link sostituiscono l’intero modulo e la pagina rifà la scelta (aritmetica sui valori pubblicati; non viene contattato nulla). Una banda che la pagina rifiuta, o una risposta diversa da 1 o 0, fa ignorare l’intero link. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Fonti

I valori GRE, la regola sul source NAT e gli esempi di scalabilità vengono da [Understanding Generic Routing Encapsulation (GRE)](https://help.zscaler.com/zia/understanding-generic-routing-encapsulation-gre). Il limite IPsec per IP di origine, le sue due forme di scalabilità e la raccomandazione primario/secondario vengono da [Configuring an IPSec VPN Tunnel](https://help.zscaler.com/zia/configuring-ipsec-vpn-tunnel) (VPN: rete privata virtuale). I requisiti di GRE e l’indicazione di passare a IPsec con un IP dinamico vengono da [Choosing Traffic Forwarding Methods](https://help.zscaler.com/zia/choosing-traffic-forwarding-methods), e la regola per cui l’MTU di un tunnel (Maximum Transmission Unit, unità massima di trasmissione) resta pari o inferiore sia all’MTU dell’appliance sia alla path MTU viene da [Determining Optimal MTU for GRE or IPSec Tunnels](https://help.zscaler.com/zia/determining-the-optimal-mtu-for-gre-or-ipsec-tunnels). Tutte e quattro le pagine sono state consultate il 09/11/2026.

La regola del frammento su cui si basa Condividi i risultati è quella della [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.5 (consultata il 01/11/2026).
