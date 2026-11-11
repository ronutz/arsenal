## Cosa fa

Incolla un percorso RESTCONF di F5OS e lo strumento lo decodifica segmento per segmento: la radice dell’API, i prefissi dei moduli YANG, la gerarchia dei container ed eventuali chiavi di lista come `tenant=tenant1`. Indica i moduli che riconosce e spiega di cosa si occupa ciascuno. Analizza solo il testo del percorso: non viene scaricato nulla, non viene consultato alcuno schema e nulla lascia il browser.

## Perché un percorso F5OS va decodificato

F5OS, il livello di piattaforma sotto i tenant su VELOS e rSeries, si gestisce con **RESTCONF** (RFC 8040) su dati modellati in **YANG**, non con iControl REST sul modello a oggetti di TMOS. Chi conosce bene `/mgmt/tm/ltm/virtual` si trova davanti `/restconf/data/f5-tenants:tenants/tenant=tenant1/config` e non ha modo di capire quale parte è un modulo, quale un container e quale seleziona un’istanza. È un problema di vocabolario più che di difficoltà, ed è ciò che lo strumento elimina.

## Il prefisso del modulo e la convenzione dei prefissi

`f5-tenants:tenants` è il nodo `tenants` del modulo YANG `f5-tenants`. F5OS usa i moduli **OpenConfig**, indipendenti dal vendor (`openconfig-system`, `openconfig-interfaces`, `openconfig-vlan`), accanto ai moduli `f5-` propri di F5. **Solo il primo nodo di un modulo porta il prefisso**; i nodi sottostanti si scrivono senza, perché lo ereditano. Un prefisso che ricompare a metà di un percorso significa che il percorso è passato in un altro modulo, ed è la cosa più utile da notare quando se ne legge uno.

## Le chiavi di lista, e la doppia porta

RESTCONF indirizza una voce di lista inserendone la chiave nel percorso, non con un parametro di query: `tenant=tenant1` seleziona un tenant dalla lista `tenants`. Lo strumento distingue queste voci dai semplici container.

Spiega anche la disposizione delle porte che coglie molti di sorpresa: in origine F5OS esponeva RESTCONF sulla **porta 8888** sotto `/restconf`, e da **F5OS 1.8** la stessa API è raggiungibile sulla porta HTTPS standard sotto `/api`. Due percorsi che sembrano diversi possono indirizzare la stessa identica risorsa. La versione è quella indicata su DevCentral di F5 stessa, dove un codeshare del dicembre 2022 sull’automazione dei backup di F5OS riporta che da F5OS 1.8 la forma `:8888/restconf` si può sostituire con `:443/api`; le note di rilascio di F5OS-A 1.8.0 riportano una correzione corrispondente, 1572137-2, perché l’API di caricamento e scaricamento funzioni sia con `/api` sia con `/restconf`. Le guide all’automazione di F5 per rSeries e VELOS documentano entrambi gli accessi senza indicare una versione. L’autenticazione usa un’intestazione `X-Auth-Token`, e quel token è a sua volta un JWT, quindi scade.

## Cosa non fa

La tabella dei moduli è limitata e volutamente breve. Se un percorso usa un modulo che lo strumento non conosce, ne decodifica la struttura e **dice che il modulo non è riconosciuto invece di descriverlo tirando a indovinare**. Inoltre non convalida nulla rispetto a uno schema, perché non ne ha: non può dirti se un nodo esiste nella tua release di F5OS, solo come è costruito il percorso che hai inserito.

## Come si usa

Incolla un percorso semplice, un URL completo o un percorso con una query string. I parametri della query vengono messi da parte e indicati, perché qualificano la richiesta invece di identificare la risorsa.

## Condivisione dei risultati

Sotto la panoramica, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il testo della casella così come l’hai inserito, e nient’altro. Il suo riquadro a comparsa indica prima cosa contiene il link, poi un’avvertenza specifica: un indirizzo completo riporta l’host e la porta di gestione della tua piattaforma, quindi rileggilo prima di inviare il link. Poi offre Copia link e, se il browser lo prevede, il suo menu di condivisione; l’indirizzo della pagina non cambia.

Un indirizzo può contenere anche una password prima della sua `@` (`https://admin:secret@host:8888/...`). La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.2.1, consultata il 27/10/2026) depreca il formato «user:password» nel campo userinfo e afferma che le applicazioni «should not render as clear text any data after the first colon». Questa pagina la mostrerebbe come parte dell’host, quindi finché il testo incollato ne contiene una il link non viene creato; rimuovila e premi di nuovo. Un nome utente da solo (`admin@host`) viene incluso.

Secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) il frammento è separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il testo non viene inviato al server quando il link viene aperto; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non riceve alcun link, e il riquadro a comparsa indica quanto è lunga.
- **Apertura di un link.** Il testo riempie la casella come farebbe un incolla e la pagina lo legge; nulla viene inviato da nessuna parte. Il valore lascia poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina non contengono nulla.
