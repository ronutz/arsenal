## Cosa fa lo strumento

Incolla una policy Access Control di Check Point in una piccola grammatica didattica (una o più dichiarazioni `layer`, le loro regole e una riga `test`) e il valutatore fa attraversare i layer alla connessione sotto i tuoi occhi. Ogni passo indica la regola che ha trovato una corrispondenza, spiega cosa significa davvero quella corrispondenza e segnala i drop che non registrano nulla. L’output è una traccia, non un verdetto, perché il verdetto da solo non insegna nulla: lo scopo è vedere una connessione accettata da un layer e scartata da quello successivo.

## La frase che vuole insegnare

**Gli ordered layer sono un AND, non un OR.** Un accept in un layer significa che la connessione *passa al layer successivo*; viene consentita solo quando accetta l’ultimo ordered layer. Un drop in qualsiasi layer termina subito la valutazione, quindi un permesso in un layer iniziale non può salvare il traffico che un layer successivo rifiuta: l’eccezione va messa nel layer che altrimenti lo negherebbe. È il comportamento che chi arriva da FortiGate, BIG-IP o da una semplice catena iptables sbaglia più spesso, ed è il motivo per cui la traccia mostra «accettata, passa al layer successivo» anziché una spunta.

## La grammatica

Layer: `layer Network ordered` oppure `layer DMZ inline`. Regole: `1 | permit internal | accept | src=10.0.0.0/8 dst=any svc=443`, con le azioni `accept`, `drop` oppure `inline:<layer>` per dare accesso a una sotto-policy. Aggiungi `nolog` per modellare una regola con Track impostato su None. Tutto ciò che viene omesso vale Any. Una riga `test src=... dst=... svc=...` fornisce la connessione. Le righe che iniziano con `#` sono commenti.

## Cos’altro segnala

Oltre alla traccia, il valutatore esamina la policy stessa: l’assenza di una regola di cleanup esplicita, una regola di cleanup senza logging (che ne vanifica l’unico scopo), le regole con Track impostato su None e lo shadowing a coppie, cioè una regola che non può mai attivarsi perché una precedente corrisponde già a tutto ciò a cui corrisponderebbe lei.

L’avviso sui drop silenziosi merita una menzione a parte. Quando non corrisponde nulla, la regola di cleanup implicita scarta la connessione e non registra assolutamente nulla. È il fatto più costoso di una base di regole Check Point per chi fa troubleshooting, perché il sintomo è una connessione che fallisce senza una voce di log che lo spieghi, e sembra un guasto di rete anziché una decisione della policy.

## Limiti dichiarati

I **nomi** dei servizi non vengono risolti: `443` è un numero di porta, non `https`. Associare i nomi alle porte vorrebbe dire tirare a indovinare sul database degli oggetti di qualcun altro. L’analisi dello shadowing è **a coppie**, quindi una regola coperta da più regole precedenti insieme, ma da nessuna da sola, non viene segnalata. Solo IPv4. La grammatica è un sottoinsieme didattico voluto (le regole reali aggiungono VPN (Virtual Private Network), contenuti, orari, install-on e negazione), ma la semantica dei layer insegnata qui si applica allo stesso modo a tutte.

## Condivisione dei risultati

Sotto il verdetto e la connessione valutata, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la policy così come l’hai incollata. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

I nomi delle regole, le subnet e la connessione di test descrivono la tua rete (per questo il riquadro a comparsa aggiunge una riga di avvertenza). Prima che venga proposto un link, la casella viene esaminata alla ricerca di una credenziale definita da uno standard: una chiave privata PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sezione 10), una riga `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2), una riga `Cookie` con un valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezione 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1), un ID della chiave di accesso AWS o un valore FortiOS `ENC`; tutte consultate il 01/11/2026. La grammatica non prevede alcuno spazio per nessuna di queste, ma i nomi delle regole e le righe di commento sono testo libero. Se ne compare una, il link non viene creato: il riquadro a comparsa indica la sua riga, e tu la sostituisci con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto non blocca il link; il riquadro a comparsa indica il primo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La casella si riempie come farebbe un incolla e la pagina valuta i layer. Non viene contattato nulla. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
