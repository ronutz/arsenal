## Cosa fa

Questo strumento decodifica una spec origin_pool di F5 Distributed Cloud (XC). Incolla l’oggetto origin_pool dalla vista JSON della Console, il corpo della sua spec o un envelope create/get, e lo strumento espone ciò che il pool fa davvero: il tipo e l’indirizzo di ogni origin server, la porta del pool, l’algoritmo di bilanciamento del carico e la selezione degli endpoint, i controlli di integrità (health check) che richiama e le impostazioni del TLS verso l’origine. Viene eseguito interamente nel tuo browser.

## Origin server: tipo e posizione

Un origin pool può puntare alle origini in diversi modi, e lo strumento li nomina uno per uno. Un IP pubblico o un nome DNS pubblico raggiunge le origini via Internet. Un IP o un nome DNS «on given sites» raggiunge le origini tramite un Customer Edge o un Regional Edge e contiene un localizzatore di sito o di virtual site: lo strumento mostra questa posizione. I nomi di servizio K8s e Consul usano la service discovery su un sito. Esistono anche le varianti virtual network e custom endpoint. Ogni origine può inoltre avere delle etichette, che lo strumento elenca.

## Dove stanno davvero pesi e priorità

Un equivoco frequente è che gli origin server di un pool abbiano pesi e priorità. Non li hanno. All’interno di un pool, gli origin server sono un elenco piatto servito secondo l’algoritmo del pool. Pesi e priorità si impostano un livello più su, sul riferimento al pool all’interno di una route o nei pool predefiniti del load balancer: ogni riferimento è un pool più un peso più una priorità. Lo strumento lo dice, così cerchi nel posto giusto.

## La porta del pool e la selezione degli endpoint

La porta può essere esplicita, presa dall’endpoint o automatica, e automatica significa 443 quando il TLS verso l’origine è attivo e 80 quando non lo è. La selezione degli endpoint stabilisce da quale Regional Edge il traffico esce verso l’origine: Local Preferred (il valore predefinito) esce dal RE locale quando questo ha una voce di origine integra, altrimenti inoltra il traffico sulla rete globale di F5 a un RE che ce l’ha. Ecco perché la stessa origine può comparire molte volte nella Console, una per ogni RE.

## TLS verso l’origine

Se il TLS verso l’origine è attivo, lo strumento decodifica il livello di sicurezza, riusando gli stessi dati sui livelli dello strumento delle suite di cifratura per livello di sicurezza TLS (quindi High significa almeno TLS 1.2), insieme alla modalità SNI (usa l’intestazione Host, un valore esplicito o nessun SNI), alla scelta sulla verifica del server e all’eventuale mTLS. Segnala il caso che conta di più: la verifica dell’origin server saltata. La connessione resta cifrata, ma il certificato dell’origine non viene convalidato, quindi lo strumento lo mette in evidenza.

## Condivisione dei risultati

Sotto gli origin server, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` una copia del pool, mai il pool così come l’hai incollato. Un pool con mTLS verso le origini contiene la chiave privata di ogni certificato client: «TLS Private Key data in unencrypted PEM format ... may be optionally secured using BlindFold» ([riferimento dell’API XC per l’origin pool](https://docs.cloud.f5.com/docs-v2/api/views-origin-pool), consultato il 01/11/2026). Lo schema di F5 Distributed Cloud contrassegna questi segreti: SecretType, usato in un oggetto per indicare un campo sensibile o riservato («used in an object to indicate a sensitive/confidential field»), contiene il segreto in chiaro (`clear_secret_info.url`: «For string:/// scheme, Secret needs to be encoded Base64 format») oppure cifrato da Blindfold (`blindfold_secret_info.location`). La pagina legge se l’mTLS è attivo, mai la chiave. Per questo la copia sostituisce con `[redacted]` ogni segreto SecretType, e conserva ogni altro byte così come l’hai incollato. Prima che il link venga offerto, la pagina rilegge la copia e deve ottenere la stessa lettura, altrimenti il link non viene creato; poi nella copia viene cercata una credenziale ancora presente (una chiave privata fuori da SecretType, il valore di un matcher dell’intestazione `Authorization`, un JWT, una password in un URL, riconosciuti come negli altri strumenti del sito): una sola significa niente link, e il riquadro a comparsa ne indica la riga; un valore il cui nome sembra soltanto un segreto viene invece indicato nel riquadro a comparsa.

Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Indica anche quanti valori sono stati sostituiti, e che un pool nomina i suoi origin server, i loro indirizzi e i siti. Non c’è un interruttore per includere i valori sostituiti: un pool non contiene valori di intestazioni o cookie, e i segreti definiti dallo schema non vengono mai inviati.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La copia riempie la casella come farebbe un incolla, e la pagina la legge. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
