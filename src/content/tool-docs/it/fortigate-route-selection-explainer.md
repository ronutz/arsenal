## Cosa fa

Indica una destinazione e un insieme di route, e questo strumento esegue la selezione che farebbe FortiOS: quali route vengono installate, quale prende davvero il traffico e quali sono backup flottanti. Viene eseguito interamente nel tuo browser.

## La distinzione per cui esiste l’intero strumento

La distanza amministrativa e la priorità vengono trattate di continuo come la stessa idea. Non lo sono, e agiscono in momenti diversi.

**La distanza decide quale route viene INSTALLATA.** Le route verso la stessa destinazione competono, vince la distanza più bassa, e la perdente è **assente** dalla tabella di inoltro: non è classificata più in basso, non è un ripiego usato sotto carico, semplicemente non c’è. Ecco perché «la mia route non funziona» si rivela così spesso «la mia route non è mai stata installata», e perché una route che hai configurato non si trova in `get router info routing-table all`.

**La priorità decide quale tra più route GIÀ INSTALLATE è preferita.** Si applica sempre e solo alle route che hanno superato il confronto sulla distanza. Una priorità 0 non può salvare una route che ha perso sulla distanza, e un vettore di test di riferimento (golden vector) fissa proprio quel caso.

## Cosa ne consegue

| Configurazione | Risultato |
|---|---|
| Stesso prefisso, stessa distanza | Si installano entrambe; sceglie la priorità |
| Stesso prefisso, distanza diversa | Se ne installa una; l’altra è un backup flottante |
| Stesso prefisso, stessa distanza, stessa priorità | ECMP distribuisce il carico su entrambe |

Il backup flottante è il modo in cui si costruisce una route predefinita di riserva: stesso prefisso, distanza più alta. Compare nella tabella solo quando la primaria viene ritirata, che è ciò che fa il **link health monitoring**, ed è per questo che una route statica senza di esso resta nella tabella anche quando il percorso oltre l’interfaccia è interrotto.

Lo strumento modella una route inattiva, così puoi vedere il backup subentrare.

## L’inoltro sceglie la corrispondenza più lunga

Tra le route **installate** vince il prefisso più specifico, indipendentemente da distanza e priorità. Un /16 prevale su una route predefinita per un indirizzo al suo interno anche se la route predefinita ha valori migliori, perché al momento dell’inoltro la specificità viene confrontata per prima.

È anche il motivo per cui il dirottamento dei prefissi (prefix hijacking) funziona, e per cui vale la pena tenere a mente questo ordine anche oltre il singolo dispositivo.

## Cosa non modella

Solo la tabella di routing. Due elementi vengono consultati **prima** e prevalgono su di essa:

- Una **policy route**, che corrisponde su origine, protocollo e porta oltre che sulla destinazione. Una policy route dimenticata è la causa classica del traffico che ignora una route statica palesemente corretta, quindi se la tabella dice una cosa e il traffico ne fa un’altra, guarda lì per prima cosa.
- Una **regola SD-WAN (Software-Defined Wide Area Network)**, che sceglie un membro in base alle prestazioni misurate prima che si arrivi alla tabella.

Gestisce solo IPv4 e non valuta se un gateway sia davvero raggiungibile; prende l’insieme delle route così com’è.

## Condivisione dei risultati

Sotto la route selezionata, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` la destinazione e le route così come le hai incollate. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Le route riportano i tuoi prefissi interni, next hop e interfacce, come fa una tabella di routing (è il motivo per cui il riquadro a comparsa aggiunge una riga di avvertenza). Prima che venga offerto un link, nella casella viene cercata una credenziale definita da FortiOS o da uno standard: una riga `set` di un’impostazione che il [riferimento CLI di FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) classifica come password (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` e le altre; consultato il 01/11/2026) o il `name` di una community SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sezione 3.2.5), qualsiasi valore `ENC` (secondo l’advisory di Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), consultato il 01/11/2026, dati di questo tipo pubblicati dove altri possono leggerli vanno considerati facili da decifrare: «should currently be considered “easy to decrypt”»), una coppia `psksecret=` o `password=` con gli stessi nomi su una riga di direttiva, una chiave privata PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), una riga `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2), una password in un URL o un ID della chiave di accesso AWS. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo, così ciò che condividi è esattamente ciò che hai scelto (un valore non viene mai sostituito all’interno di una casella incollata, perché cambierebbe ciò che viene inviato). Un valore il cui nome sembra soltanto un segreto non blocca il link; il riquadro a comparsa indica il primo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La casella si riempie come farebbe un incolla e la pagina seleziona la route. Non viene contattato nulla. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Dove si colloca

Si abbina all’articolo sul routing e sull’SD-WAN di FortiGate, che tratta l’intero ordine di consultazione e il livello SD-WAN che questo strumento tralascia. Per chi prepara l’NSE 4 copre l’obiettivo 4.01.
