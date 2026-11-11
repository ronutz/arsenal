## Cosa fa

Incolla profili di persistenza e virtual server BIG-IP come frammento tmsh e lo strumento spiega la persistenza di ciascuno: di quale metodo si tratta, su cosa si basa, come si comporta, i campi che contano e i modi in cui fallisce nella pratica. Per ogni virtual server mostra anche la catena di persistenza, cioè il metodo primario e il fallback usato quando il primario non produce alcun record. Analizza la configurazione nel tuo browser e non contatta alcun dispositivo.

## Cos’è la persistenza, e perché il metodo conta

La persistenza, detta anche affinità di sessione (session affinity), tiene un client legato allo stesso membro del pool attraverso più connessioni, cosa di cui le applicazioni stateful hanno bisogno perché una sessione iniziata su un server prosegua su quel server. BIG-IP offre diversi metodi, e l’aspetto importante è che ciascuno si basa su qualcosa di diverso, quindi ciascuno ha il proprio modo di fallire. Scegliere un metodo significa in realtà scegliere su cosa basarsi e accettare il modo in cui quella chiave può venire meno.

## I metodi comuni e come falliscono

- La persistenza **source-address** si basa sull’indirizzo IP del client. Il suo problema classico sono molti client che arrivano da dietro un unico NAT o proxy: condividono un indirizzo, quindi restano tutti legati a un solo membro del pool e il carico si sbilancia. Si rompe anche se l’indirizzo di un client cambia a metà sessione.
- La persistenza **cookie** si basa su un cookie HTTP gestito dal BIG-IP, in modalità che lo inseriscono, lo riscrivono o lo leggono passivamente. È precisa, ma richiede HTTP e un client che accetti i cookie, quindi non si applica al traffico non HTTP.
- La persistenza **SSL** si basa sul session ID TLS. Fallisce quando i client cambiano o rinegoziano i session ID, o quando i session ID hanno vita breve, ed è per questo che viene così spesso abbinata a un fallback.
- La persistenza **universal** si basa su un valore che un’iRule estrae dal traffico, il che permette di mantenere la persistenza su quasi tutto (un token, un’intestazione, un campo) al prezzo di scrivere la regola.

Impostazioni come match-across-services, match-across-virtuals e match-across-pools ampliano l’ambito in cui si applica un record di persistenza, e lo strumento le legge dove sono impostate.

## La catena tra primario e fallback

Un virtual server può indicare un profilo di persistenza primario e uno di fallback. Quando il metodo primario non trova alcun record esistente per una connessione, BIG-IP usa il fallback per assegnarla. Un abbinamento noto è la persistenza sul session ID SSL con source-address come fallback, così un client il cui session ID non è ancora noto resta comunque legato tramite l’IP. Lo strumento mostra questa catena per ogni virtual server, così vedi cosa decide davvero il membro. Per i byte contenuti in un cookie di persistenza, lo strumento complementare è il decodificatore di cookie di persistenza BIG-IP; questo spiega il metodo che lo circonda.

## Come si usa

Incolla profili di persistenza, virtual server o entrambi, e leggi per ciascuno il metodo, la chiave su cui si basa, i campi e i modi di fallire, oltre alla catena dal primario al fallback per ogni virtual server. L’analisi è deterministica e locale.

## Condivisione dei risultati

In cima alla lettura, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` i profili e i virtual server con il valore di ogni impostazione segreta sostituito da `[redacted]`, mai così come li hai incollati. Un profilo cookie può contenerne una: [`cookie-encryption-passphrase`](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_persistence_cookie.html) «Specifies a passphrase to be used for cookie encryption» (riferimento tmsh di F5, ltm persistence cookie, consultato il 27/10/2026). Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser lo prevede, il suo menu di condivisione; l’indirizzo della pagina non cambia.

La copia è quella dell’[analizzatore della configurazione tmsh](/tools/f5-tmsh-config-explainer), creata con lo stesso parser con cui legge questa pagina, quindi viene sostituito anche ogni valore di password, passphrase, segreto e community SNMP di un testo incollato più ampio; il riquadro a comparsa indica quanti. `[redacted]` è una sola parola tmsh, quindi la pagina che riceve il link legge gli stessi profili, catene e campi. I nomi di profili, virtual server, pool e cookie vengono inclusi così come sono stati incollati; lo stesso vale per il corpo di un’iRule, e il riquadro a comparsa lo segnala quando ce n’è uno. Secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) il frammento è separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la copia non viene inviata al server quando il link viene aperto; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non riceve alcun link, e il riquadro a comparsa indica quanto è lunga.
- **Apertura di un link.** La copia riempie la casella come farebbe un incolla e la pagina la spiega. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina non contengono nulla.
