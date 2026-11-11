## Cosa fa lo strumento

Incolla le righe `location` di un blocco server più una riga `request <uri>`, e lo strumento esegue davanti a te l’algoritmo di selezione documentato di NGINX. Indica il blocco che prevale e mostra l’intero percorso: cosa è successo a ogni passaggio e perché, compresi i passaggi che non hanno deciso nulla. Una query string nella riga della richiesta è ammessa; resta fuori dalla corrispondenza e alimenta solo le variabili `$arg_<name>`.

## La regola che vuole insegnare

**NGINX non sceglie la prima location che corrisponde, e nemmeno l’ultima.** Prova prima una corrispondenza esatta e, se ne trova una, si ferma. Poi controlla tutte le location con prefisso e ricorda la corrispondenza **più lunga**, non la prima. Se quel prefisso ha `^~`, vince subito. Altrimenti vengono provate le espressioni regolari **nell’ordine del file**, e vince la prima che corrisponde, battendo il prefisso ricordato. Da nginx 1.31.5, se nessuna regex corrisponde, vengono provate nell’ordine del file le location con predicato (`location $variable`), e vince la prima la cui variabile non è né vuota né `0`. Solo se in questi due turni non corrisponde nulla vince, alla fine, il prefisso.

L’ordine del file decide solo i turni delle espressioni regolari e dei predicati, ed è per questo che leggere una configurazione dall’alto verso il basso ti porta attivamente fuori strada sul risultato.

## I due risultati che si scoprono a proprie spese

Un blocco con prefisso `/images/` perde contro un blocco `~ \.(gif|jpg|png)$` scritto sotto di esso, perché le regex vengono provate dopo il turno dei prefissi e lo battono. Il blocco dall’aspetto più specifico, scritto per primo, viene superato per progetto.

E `^~` non significa «priorità più alta»: significa **fermati prima delle espressioni regolari** (e, dalla 1.31.5, anche prima delle location con predicato). È proprio per questo che risolve il caso precedente.

Lo stesso ordine decide quale blocco passa un URL `.php` a PHP-FPM; [PHP-FPM and FastCGI](/learn/php-fpm-and-fastcgi) spiega cosa passa poi tra NGINX e PHP.

## Cos’altro segnala

Oltre al percorso, lo strumento esamina la configurazione stessa: i blocchi con prefisso che un’espressione regolare potrebbe scavalcare (con l’indicazione della correzione `^~`), le location duplicate, l’assenza di un `location /` che raccolga tutto il resto, la versione di nginx richiesta da una location con predicato e qualsiasi predicato la cui variabile non ha un valore.

## Limiti dichiarati

Un solo blocco server: nessuna selezione per `server_name` e nessuna corrispondenza sulla porta di ascolto. I pattern `~` e `~*` vengono compilati come espressioni regolari JavaScript; PCRE e JS concordano sulla sintassi usata nei normali blocchi location, ma sono motori diversi, quindi per qualsiasi cosa insolita fidati di NGINX stesso. La vista sulla portabilità degli [Strumenti per regex](/tools/regex) elenca, costrutto per costrutto, dove PCRE2 e JavaScript leggono un pattern in modo diverso. Nessun `rewrite`, `try_files` o reindirizzamento interno: lo strumento dice quale blocco viene selezionato, non cosa fa l’intera richiesta. L’URI viene confrontato così com’è scritto, perché NGINX decodifica prima del confronto, e farne qui solo metà sarebbe peggio che non farlo affatto. Le variabili non vengono valutate: un predicato `$arg_<name>` legge la query string, qualsiasi altra variabile assume il valore che le dai in una riga `variable $name value`, e una variabile non dichiarata conta come vuota, quindi il suo predicato non corrisponde.

## Condivisione dei risultati

Sotto il vincitore, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il testo della casella così come l’hai inserito, una volta che la pagina ha calcolato il percorso. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. La sintassi accetta righe location, righe `variable` e la riga `request`, nient’altro, quindi nessun’altra direttiva può finire nel link; ma una riga di richiesta può contenere una query string e una riga `variable` un valore. Prima che venga proposto un link, nella casella viene cercata una credenziale definita da uno standard: una chiave privata PEM, una riga `Authorization` o `Proxy-Authorization` con qualsiasi schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezioni 11.6.2 e 11.7.2: il valore è costituito da credenziali, «consists of credentials»), una riga `Cookie` o `Set-Cookie` con un valore ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezione 8.4: i server di solito conservano nel cookie un nonce, cioè un identificatore di sessione, «commonly store a nonce (or “session identifier”) in a cookie»), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sezione 1), una password in un URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1), un ID della chiave di accesso AWS o un valore FortiOS `ENC`; tutte consultate il 01/11/2026. Una sola di queste significa niente link: il riquadro a comparsa ne indica la riga, e tu la sostituisci con un segnaposto e premi di nuovo. Un valore il cui nome sembra soltanto un segreto (un membro JSON `token`, un `token=` in una query string) non blocca il link; il riquadro a comparsa indica il primo, così puoi controllarlo.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La casella si compila come farebbe un incolla e la pagina ne ripercorre la selezione. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Fonti

- [Documentazione di NGINX, ngx_http_core_module, location](https://nginx.org/en/docs/http/ngx_http_core_module.html#location) (consultata il 26/10/2026): l’ordine di selezione, `^~` che salta le espressioni regolari e le location con predicato, la regola dei predicati e l’esempio svolto (configurazioni da A a F) che i test dello strumento riproducono
- [Documentazione di NGINX, How nginx processes a request](https://nginx.org/en/docs/http/request_processing.html) (consultata il 26/10/2026): le location confrontano solo la parte URI della riga di richiesta, senza argomenti
- [Changelog di NGINX, nginx 1.31.5, 2 settembre 2026](https://nginx.org/en/CHANGES) (consultato il 26/10/2026): «Feature: predicate locations»
