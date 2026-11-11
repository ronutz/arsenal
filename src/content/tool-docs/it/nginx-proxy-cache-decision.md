## Cosa fa lo strumento

Incolla le direttive di cache, la richiesta e la risposta dell’upstream. Lo strumento risponde a **due domande distinte**: questa risposta verrà **memorizzata**, e una richiesta successiva corrispondente verrà **servita** da quella copia? Dietro ogni risposta c’è la verifica ordinata delle regole, più la chiave della cache calcolata.

Sono distinte di proposito. Una risposta può essere perfettamente memorizzabile e non essere mai servita perché la chiave è diversa; una risposta può essere servita quando non dovrebbe, perché la chiave ignora qualcosa che contava.

## Le regole di memorizzazione, in ordine

La cache è del tutto disattivata se `proxy_cache` non indica una zona, di gran lunga il motivo più comune per cui non viene mai memorizzato nulla. Vengono memorizzati solo i metodi elencati in `proxy_cache_methods`, per impostazione predefinita GET e HEAD. Una risposta con `Set-Cookie` non viene memorizzata, perché si presume che sia specifica di un utente. Un `Cache-Control: no-cache`, `no-store` o `private` dell’upstream impedisce la memorizzazione. Un codice di stato senza `proxy_cache_valid` e senza un’intestazione di freschezza non ha una durata con cui essere memorizzato. E `proxy_no_cache` con un valore non vuoto e diverso da zero impedisce la scrittura.

## La coppia che si confonde

`proxy_no_cache` impedisce la **scrittura**. `proxy_cache_bypass` salta la **ricerca** nella cache e scrive comunque il risultato. Sembrano sinonimi e sono opposti proprio nella metà che conta: usare bypass dove intendevi no_cache riempie la cache esattamente di ciò che cercavi di tenerne fuori.

## L’asimmetria che fa trapelare dati

NGINX esclude dalla memorizzazione le **risposte** con cookie. **Non** impedisce che alle **richieste** con cookie venga servita una voce condivisa.

Di solito è innocuo, perché le risposte personalizzate non sono mai state memorizzate, finché qualcuno non aggiunge `proxy_ignore_headers Set-Cookie` per far «funzionare» la cache su un backend che imposta un cookie di sessione in ogni risposta. A quel punto le risposte specifiche di ciascun utente stanno sotto una chiave condivisa da tutti gli utenti. Lo strumento avvisa proprio di questa combinazione, perché è una modifica di due righe che sembra un miglioramento delle prestazioni.

## Limiti dichiarati

Un singolo scambio, non il ciclo di vita della cache: niente `proxy_cache_use_stale`, niente `proxy_cache_lock`, nessuna riconvalida, nessun conteggio di `min_uses`, nessuna gestione di `Vary`. La freschezza viene trattata come presente o assente invece di essere calcolata, quindi una voce scaduta è fuori ambito. La resa della chiave sostituisce le variabili comuni e lascia tutto il resto così com’è scritto.

## Condivisione dei risultati

Sotto i due verdetti, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` una copia della casella; contiene la casella così come l’hai inserita solo se attivi l’interruttore descritto più sotto. Le intestazioni dello scambio sono la lezione e, incollate dagli strumenti per sviluppatori di un browser, sono attive: i valori dei cookie sono comunemente identificatori di sessione ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezione 8.4, consultata il 01/11/2026) e un valore `Authorization` è costituito da credenziali («consists of credentials», [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2, consultata il 01/11/2026). La decisione legge se quelle intestazioni ci sono, mai i loro valori; solo la chiave della cache calcolata mostra un valore, dove la chiave nomina `$cookie_<name>` o `$http_<name>` ([ngx_http_core_module, Embedded Variables](https://nginx.org/en/docs/http/ngx_http_core_module.html#variables), consultato il 01/11/2026). Quindi la copia sostituisce con `[redacted]` ogni valore di cookie di una riga `request_header Cookie:`, il valore del cookie di una riga `response_header Set-Cookie:` (il nome e gli attributi restano), le credenziali dopo lo schema di una riga `Authorization` o `Proxy-Authorization` (lo schema resta) e l’intero valore di un’intestazione il cui nome sembra segreto (`X-Api-Key`, `X-Auth-Token`); ogni altro byte resta così come l’hai inserito, commenti compresi. Prima che venga proposto il link, la copia viene decisa di nuovo e deve dare la stessa decisione (memorizzata, servita, l’esito di ogni regola, ogni avviso), altrimenti il link non viene creato; la chiave e il passaggio che la cita mostrano allora `[redacted]` dove c’era un valore. Nella copia viene poi cercata una credenziale ancora presente (un JWT nell’URI, una chiave): se ce n’è una, il link non viene creato e il riquadro a comparsa ne indica la riga.

Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Indica anche quanti valori sono stati sostituiti. Quando ne ha sostituito qualcuno, un interruttore sotto la prima riga, **Includi nel link i valori sostituiti**, ti permette di inviarli comunque, per uno scambio scritto con valori inventati o per una chiave che nomina un cookie: è disattivato ogni volta che il riquadro a comparsa si apre; se lo attivi, il link contiene la casella così come l’hai inserita, e il riquadro a comparsa avverte che i valori dei cookie sono spesso sessioni attive e che i valori `Authorization` sono credenziali. L’interruttore non viene offerto quando una credenziale ha già bloccato il link.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La copia (o, con l’interruttore, la casella) compila la casella come farebbe un incolla e la pagina decide. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
