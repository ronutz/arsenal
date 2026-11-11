## Cosa fa lo strumento

Incolla un elenco di regole Firewall Filtering di Zscaler Internet Access (ZIA) in una piccola grammatica didattica, una regola per riga nella forma `order | name | action | criteria`, più una riga `flow:` facoltativa, e il simulatore esegue davanti a te la semantica documentata della policy: le regole messe in ordine numerico crescente, il flusso seguito regola per regola con la valutazione che si ferma alla prima corrispondenza, il verdetto indicato (una regola, oppure la Default Firewall Filtering Rule per tutto ciò che non ha trovato corrispondenza) e un’analisi dell’oscuramento a coppie che elenca le regole che non possono mai scattare perché una regola precedente copre già tutto ciò a cui potrebbero corrispondere.

## La grammatica

Regole: `10 | allow-web | allow | proto=tcp port=443 dest=203.0.113.0/24 src=any`, con le azioni `allow`, `block` (scarto silenzioso) o `block-icmp` (blocco con notifica al client) e un token `disabled` facoltativo. I criteri omessi valgono Any, e Any viene ignorato durante la valutazione, esattamente come documenta il vendor. Righe facoltative: `flow: proto=tcp port=8443 dest=203.0.113.7 src=10.0.0.5` per seguire un flusso, e `default: allow|block` per modellare la modifica dell’azione della regola Default da parte di un super admin. Le righe che iniziano con `#` sono commenti.

## Cosa codifica la semantica

Tutto ciò che viene simulato è il comportamento pubblicato da Zscaler: la valutazione percorre il Rule Order in ordine crescente e si ferma alla prima corrispondenza; una regola disattivata non viene applicata ma mantiene la sua posizione (il servizio la salta e passa oltre); la Default Firewall Filtering Rule non si può eliminare, ha sempre la precedenza più bassa, i suoi criteri sono fissi e solo la sua azione è modificabile, e nella configurazione iniziale blocca tutto il traffico: per questo il valore predefinito del simulatore, in assenza di una riga `default:`, è block.

## Limiti dichiarati

Il modello dei criteri è volutamente un sottoinsieme didattico: protocollo, porte, origine, destinazione. Le regole Firewall Filtering reali aggiungono utenti, gruppi, reparti, sedi, servizi e applicazioni di rete, paesi di destinazione, livelli di attendibilità del dispositivo e fasce orarie; la semantica dell’ordinamento che questo strumento insegna si applica a tutti allo stesso modo. L’analisi dell’oscuramento è solo a coppie: una regola coperta da più regole precedenti insieme, ma da nessuna da sola, non viene segnalata. Le regole di sistema predefinite (Office 365, traffico dei servizi Zscaler) e i limiti di ordine legati all’Admin Rank sono descritti nell’articolo abbinato ma non vengono simulati.

## Condivisione dei risultati

Sotto la scheda del verdetto (in cima alla lettura quando non c’è una riga del flusso), **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` le regole e il flusso così come li hai incollati. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

I nomi delle regole e gli indirizzi possono identificare la tua infrastruttura (è il motivo per cui il riquadro a comparsa aggiunge una riga di avvertenza). Prima che venga offerto un link, nella casella viene cercata una credenziale definita da uno standard: una chiave privata PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sezione 10), una riga `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2), una riga `Cookie` con un valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezione 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1), un ID della chiave di accesso AWS o un valore `ENC` di FortiOS; tutte consultate il 01/11/2026. La grammatica non prevede alcuno spazio per nessuna di queste, ma i nomi delle regole e le righe di commento sono testo libero. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto non blocca il link; il riquadro a comparsa indica il primo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La casella si riempie come farebbe un incolla e la pagina simula le regole. Non viene contattato nulla. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Fonti

Lo strumento si basa su tre pagine di Zscaler Help, ciascuna fissata con la sua data di consultazione nel manifest dello strumento: About Firewall Filtering (ordine di valutazione, la regola Default che nega per impostazione predefinita, l’insieme dei verbi d’azione), Configuring the Firewall Filtering Policy (Rule Order, la convenzione per cui Any significa criterio ignorato, Admin Rank) ed Editing the Default Firewall Filtering Rule (precedenza più bassa, non eliminabile, criteri fissi, modifica dell’azione da parte di un super admin).

La regola del frammento su cui si basa Condividi i risultati è quella della [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.5 (consultata il 01/11/2026), e le credenziali cercate dal suo controllo sono definite nelle RFC 7468, RFC 9110, RFC 6265 e RFC 7519 (consultate lo stesso giorno).
