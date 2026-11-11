## Cosa fa

Incolla un JSON Web Key Set e lo strumento lo scompone chiave per chiave: per ogni chiave legge il tipo, l’ID della chiave, l’uso e l’algoritmo previsti e i parametri specifici del tipo, e segnala qualsiasi chiave che contenga materiale privato. Se incolli anche un JWT, abbina il token alla chiave che dovrebbe verificarlo confrontando gli ID delle chiavi. Nulla lascia il tuo browser.

## Cos’è un JWKS

Un JSON Web Key Set (JWKS) è il documento JSON che un identity provider pubblica, di solito in `/.well-known/jwks.json`, perché chiunque possa verificare i token che firma senza un segreto condiviso. È semplicemente un elenco di chiavi:

    { "keys": [ {JWK}, {JWK}, ... ] }

Ogni voce è una JSON Web Key (JWK) che descrive una chiave: il suo tipo (`kty`, come RSA, EC o OKP), un ID della chiave facoltativo (`kid`), a cosa serve (`use`, di solito `sig` per la firma o `enc` per la cifratura), l’algoritmo con cui va usata (`alg`) e i parametri specifici di quel tipo di chiave.

## Materiale pubblico e privato

Questa distinzione è il punto di sicurezza dello strumento. Un JWKS pubblicato per la verifica dovrebbe contenere solo chiavi pubbliche. Ogni tipo di chiave ha parametri pubblici e parametri privati: una chiave RSA pubblica il modulo e l’esponente (`n`, `e`) e tiene segreto l’esponente privato (`d`); una chiave a curva ellittica pubblica le sue coordinate (`x`, `y`) e tiene segreto lo scalare privato (`d`); una chiave simmetrica (`oct`) non è altro che il segreto (`k`). Se una chiave dell’insieme contiene uno qualsiasi dei campi privati, significa che del materiale di chiavi private è stato esposto, un errore grave, quindi lo strumento lo segnala esplicitamente.

## Abbinare un token alla sua chiave

Un JWT firmato di solito indica, nella sua intestazione, l’ID (`kid`) della chiave che lo ha firmato. Un verificatore cerca nel JWKS la chiave con quel `kid` e la usa. Lo strumento fa lo stesso: dati un JWT e un insieme, trova la chiave il cui `kid` corrisponde a quello del token, che è esattamente la ricerca che un verificatore reale esegue prima di controllare la firma. I parametri delle chiavi seguono la RFC 7517 e la RFC 7518, con il tipo di chiave OKP per le chiavi a curva di Edwards (come Ed25519) definito nella RFC 8037.

## Come si usa

Incolla un JWKS per esaminare ogni chiave e scoprire eventuale materiale privato esposto, e incolla facoltativamente un JWT per vedere quale chiave dell’insieme è quella destinata a verificarlo.

## Condivisione dei risultati

Sotto il riepilogo delle chiavi (nella modalità Abbina un JWT, sotto l’abbinamento), **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` una copia dell’insieme di chiavi: ogni valore privato sostituito da `[redacted]`, ogni altro carattere così come l’hai incollato. Il suo riquadro a comparsa indica prima cosa contiene il link e quanti valori sono stati sostituiti, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Un insieme di chiavi incollato può contenere materiale di chiavi private, che un link non deve mai contenere. La [RFC 7518](https://www.rfc-editor.org/rfc/rfc7518) (consultata il 01/11/2026) definisce i membri `d`, `p`, `q`, `dp`, `dq`, `qi` e `oth` di una chiave privata RSA (sezione 6.3.2, con `r`, `d` e `t` di ogni voce `oth`), il `d` di una chiave privata a curva ellittica (sezione 6.2.2) e il `k` di una chiave simmetrica (sezione 6.4.1); la [RFC 8037](https://www.rfc-editor.org/rfc/rfc8037) (sezione 2, consultata il 01/11/2026) assegna a una chiave OKP un `d` privato. La copia mantiene i nomi dei membri e sostituisce solo i loro valori, quindi la pagina che la apre segnala lo stesso materiale privato e spiega ogni chiave esattamente come ha fatto la tua: questa pagina non mostra mai quei valori. I controlli del sito la verificano, tra le altre, sulle chiavi private della RFC 7517, appendice A.2 e A.3, e della RFC 8037, appendice A.1.

Nella modalità Abbina, il link contiene anche l’intestazione del JWT, e nient’altro del token: la pagina legge solo l’intestazione, e un JWT è una credenziale al portatore (bearer) finché è valido ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), sezione 1.2, consultata il 01/11/2026). Se il primo segmento della casella JWT non è un’intestazione JSON, il link non ne contiene nulla, quindi un token di accesso opaco non finisce mai al suo posto; un’intestazione il cui membro `jwk` contiene materiale di chiavi private non ottiene il link.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi i valori non vengono inviati al server quando si apre il link; restano nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerli.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La copia compila la casella dell’insieme di chiavi, la modalità Abbina si apre quando il link lo indica e l’intestazione compila la casella del JWT; la pagina analizza e abbina come per un testo incollato, e non recupera mai un `jwks_uri`. Un insieme di chiavi che non si riesce ad analizzare o che contiene ancora un valore privato, una modalità che la pagina non offre o un’intestazione che è più di un’intestazione fanno ignorare l’intero link. In ogni caso i valori lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
