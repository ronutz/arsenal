# Analizzatore del flusso decisionale GSLB

Incolla dei blocchi `gtm wideip` e `gtm pool` (come li stampano `tmsh list gtm wideip a <name>` e `tmsh list gtm pool a <name>`) e la decisione a due livelli del GSLB (Global Server Load Balancing) di BIG-IP DNS (in precedenza GTM, Global Traffic Manager) viene mostrata come si svolge davvero.

Il livello wide IP mostra il metodo di selezione del pool (`pool-lb-mode`, predefinito round-robin) con i pool associati, il loro ordine e i valori di ratio, e le impostazioni del wide IP che determinano le risposte: persistenza, last-resort-pool, comportamento di failure-rcode e il parametro di dettaglio del decision log che ti permette di seguire nei log questo stesso flusso.

Il livello pool mostra la catena in tre passi: preferred (`load-balancing-mode`), alternate (`alternate-mode`), fallback (`fallback-mode`), e ogni passo riporta la semantica del vendor per il livello e per il metodo. Quando un attributo manca vengono applicati e indicati i valori predefiniti: round-robin, round-robin, return-to-dns.

Sotto, osservazioni deterministiche confrontano la configurazione con la grammatica documentata e con le regole del manuale Load Balancing: metodi fuori dall’elenco dei token ammessi per un livello, la proprietà del livello fallback di ignorare la disponibilità, dichiarata su ogni catena risolta, il collegamento del Fallback IP (il metodo senza indirizzo, o un indirizzo che nessun livello usa), l’insieme dei casi in cui si applica dynamic-ratio, i coefficienti QoS azzerati, i ratio dei membri che nessun livello usa, la regola di abbinamento di Global Availability e l’avviso sulla topologia a entrambi i livelli, che chiede di impostare a None il fallback di ogni pool.

Il nome di un singolo metodo spiega quel metodo, compresi i livelli che lo ammettono e la provenienza del segnale su cui decide (sondaggi sul percorso LDNS, statistiche lato server o nessuno). La parola `methods` elenca entrambi i cataloghi.

Tutto viene eseguito in locale; nulla di ciò che incolli lascia la pagina.

## Condivisione dei risultati

In cima alla lettura, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il testo della casella così come l’hai inserito, e nient’altro. Il suo riquadro a comparsa indica prima cosa contiene il link, poi un’avvertenza specifica: i nomi dei wide IP e dei pool identificano la tua infrastruttura, quindi rileggi il testo incollato prima di inviare il link. Poi offre Copia link e, se il browser lo prevede, il suo menu di condivisione; l’indirizzo della pagina non cambia.

Questa pagina salta ogni blocco che non spiega, quindi anche un intero file di configurazione riceve una lettura, e un link che lo contenesse porterebbe con sé tutto ciò che c’è dentro. Per questo, finché il testo incollato contiene un’impostazione segreta, il link non viene creato e il riquadro a comparsa indica l’impostazione: un attributo tmsh chiamato `password`, `passphrase` o `secret`, o il cui nome termina con uno di questi (`encrypted-password`, `proxy-ca-passphrase`, `shared-secret`), `bind-pw` o `community-name`, seguito da un valore diverso da `none`; oppure un’intestazione `Authorization` in qualsiasi punto, come nella stringa `send` di un monitor. Il [riferimento tmsh di F5 per gtm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/gtm/gtm_monitor_http.html) (consultato il 27/10/2026) elenca `password` accanto a `send`, e la [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (sezione 11.6.2, consultata il 27/10/2026) definisce il valore di Authorization come credenziali. Rimuovi quella riga e premi di nuovo: questa pagina non mostra mai quei valori, quindi il resto si legge allo stesso modo.

Secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) il frammento è separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il testo non viene inviato al server quando il link viene aperto; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non riceve alcun link, e il riquadro a comparsa indica quanto è lunga.
- **Apertura di un link.** Il testo riempie la casella come farebbe un incolla e la pagina lo legge; nulla viene inviato da nessuna parte. Il valore lascia poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina non contengono nulla.
