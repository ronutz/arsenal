## Cosa fa lo strumento

Risponde a una sola domanda: il traffico verso l’indirizzo tradotto raggiungerà davvero il gateway? Non se la policy lo consente, ma se il pacchetto arriva o no.

La distinzione conta perché il guasto tipico sta un livello sotto la base di regole. Se l’indirizzo tradotto si trova in una subnet a cui il gateway è collegato direttamente, qualche dispositivo invierà un ARP per quell’indirizzo e, se il gateway non risponde, non viene mai inviato nulla.

## La regola

**Il NAT automatico (Network Address Translation)** aggiunge da sé la voce proxy ARP all’installazione della policy, purché in Global Properties sia abilitata *Automatic ARP configuration*.

**Il NAT manuale no.** Non l’ha mai fatto. La voce la crea l’amministratore.

**Nessuno dei due conta** se l’indirizzo tradotto non è in una subnet collegata. In quel caso nessuno sul segmento invierà un ARP per quell’indirizzo, e qualcosa a monte deve instradarlo; il proxy ARP è la cosa sbagliata da guardare.

## La firma diagnostica

Uno static NAT manuale verso un indirizzo nella subnet del gateway stesso, senza una voce proxy ARP, produce un silenzio molto particolare. La policy si installa senza errori. La base di regole sembra corretta. Il server è in salute.

E nei log del firewall **non c’è proprio nulla**: nessun pacchetto scartato, nessun rifiuto. Non è arrivato nulla da registrare. Una cattura sull’interfaccia esterna mostra richieste ARP che restano senza risposta.

## Un caso in cui «usa il NAT automatico» non basta

Il NAT automatico non crea comunque nulla se in Global Properties *Automatic ARP configuration* è disattivata. Lo strumento tratta quella combinazione esattamente come una regola manuale, perché il risultato è identico.

Se aggiungi voci a mano accanto a quelle automatiche, *Merge manual proxy ARP configuration* deve essere abilitata, altrimenti non possono coesistere.

## Cosa non fa, per scelta

**Non stabilisce l’ordine della base di regole NAT.** Le fonti pubblicate si contraddicono sul fatto che le regole manuali vengano valutate prima o dopo quelle automatiche: una guida indica prima le manuali, un’altra prima i livelli automatici, e la guida all’amministrazione di Check Point descrive i due tipi come applicati in modo diverso senza chiarire l’ordine.

Stabilire un ordine vorrebbe dire prendere una posizione e presentare un’ipotesi come un calcolo. Il comportamento del proxy ARP è descritto ovunque allo stesso modo, quindi è a questo che lo strumento risponde.

## Limiti dichiarati

Un’interfaccia alla volta; un gateway con più interfacce rivolte verso lo stesso traffico è una questione di topologia che lo strumento non modella. Solo IPv4. E ragiona sulla raggiungibilità al livello 2, non sul fatto che la policy di accesso consenta la connessione una volta arrivata.

## Condivisione dei risultati

Sotto il verdetto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene il modulo dopo il `#` come valori con nome, sempre tutti i campi: `method`, `type`, `natip`, `gateway`, `prefix` e `autoarp` (1 o 0). Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Il modulo contiene due indirizzi, un prefisso e tre scelte, nessuno dei quali è un segreto, quindi il riquadro a comparsa non aggiunge nulla all’avviso standard del sito. Vengono inclusi tutti i campi, non solo quelli diversi dai valori predefiniti, così un vecchio link mantiene il suo significato anche se un valore predefinito cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** I valori del link sostituiscono l’intero modulo e la pagina lo valuta (aritmetica delle subnet; non viene inviato alcun ARP e non viene interrogato nulla). Un metodo o un tipo sconosciuto, un `autoarp` diverso da 1 o 0, o indirizzi che la pagina rifiuta fanno ignorare l’intero link. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
