## Cosa fa

Incolla un URL iControl REST e lo strumento lo decodifica: il modulo TMOS, la collezione, il percorso di partizione e cartelle codificato con le tilde insieme al suo equivalente `tmsh`, l’eventuale sottocollezione, come i membri di un pool, e le opzioni di query. Analizza solo il testo dell’URL: non viene scaricato nulla e nulla lascia il browser.

## La tilde

`/mgmt/tm/ltm/pool/~Common~apps~web_pool` indirizza `/Common/apps/web_pool`. La tilde è un separatore di cartelle, usato perché **un URL usa già la barra per la propria struttura**. Lo strumento mostra sempre la forma `tmsh` accanto alle parti decodificate, perché è la forma che la maggior parte dei lettori conosce già.

## Il dettaglio della partizione che causa i 404

Un nome scritto senza partizione viene risolto **nella partizione corrente di chi fa la chiamata**. La stessa richiesta può riuscire per un amministratore e restituire 404 per un altro, senza che ci sia niente di sbagliato in nessuno dei due casi. Lo strumento lo segnala ogni volta che il nome dell’oggetto non è qualificato.

## Opzioni di query

`$select`, `$filter`, `$top`, `$skip`, `expandSubcollections`, `options` e `ver` vengono spiegate una per una. Quella da conoscere è **`expandSubcollections`**: senza di essa, un pool torna senza membri, ed è la sorpresa più comune di questa API.

## Cosa non fa

La tabella dei moduli è finita. Se un percorso usa un modulo che lo strumento non conosce, ne decodifica la struttura e **segnala che il modulo non è riconosciuto invece di descriverlo tirando a indovinare**. Non convalida nulla su un dispositivo e non può dirti se l’oggetto esiste.

## Condivisione dei risultati

Sotto la panoramica, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il percorso con ogni credenziale sostituita, mai così come l’hai inserito. Il suo riquadro a comparsa indica prima cosa contiene il link e quanti valori sono stati sostituiti, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

- **Un token di autenticazione nel percorso** viene mascherato mantenendone la forma (le maiuscole diventano `X`, le minuscole `x`, le cifre `0`), così la pagina continua a leggerlo come l’oggetto che indirizzava. La guida stessa di F5 estende un token con `PATCH /mgmt/shared/authz/tokens/{{ bigip_auth_token }}` ([AS3, Authentication and Authorization](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/userguide/authentication.html), consultata il 27/10/2026), che mette il token stesso nel percorso.
- **Una password prima dell’host** (`https://user:password@host/...`) diventa `[redacted]`: la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sezione 3.2.1 (consultata il 27/10/2026), dice che le applicazioni non dovrebbero mostrare in chiaro i dati che seguono i primi due punti di uno userinfo («should not render as clear text any data after the first colon»).
- **Un’intestazione `X-F5-Auth-Token` o `Authorization`** incollata con il percorso perde le sue credenziali, sostituite da `[redacted]` (la stessa guida invia il token in `X-F5-Auth-Token`; [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sezione 11.6.2).

L’host, il modulo, la collezione, i nomi degli oggetti e le opzioni di query restano così come li hai inseriti; i vettori di condivisione dello strumento verificano che la pagina che riceve il link legga le stesse parti. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la copia non viene inviata al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La copia compila la casella come farebbe un incolla e la pagina la decodifica. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Lo strumento complementare

L’analizzatore dei percorsi RESTCONF F5OS decodifica il livello di piattaforma sotto un tenant, che usa RESTCONF su YANG invece di questo modello a oggetti. Le due API non si somigliano affatto perché vengono da tradizioni diverse, non da versioni diverse.
