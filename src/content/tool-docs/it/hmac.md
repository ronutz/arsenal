## Cosa fa

Calcola un HMAC, cioè un hash con chiave, su un messaggio usando una chiave segreta, e mostra il risultato in esadecimale e in Base64. Come hash sottostante scegli SHA-256, SHA-384 o SHA-512. Il calcolo usa il Web Crypto nativo del browser, e la chiave non lascia mai il tuo browser. È la stessa costruzione, sullo stesso percorso di codice, che il verificatore JWT usa per controllare una firma HS256, quindi i due strumenti concordano per costruzione.

## A cosa serve l’HMAC

Un hash semplice dimostra che i dati non sono cambiati, ma chiunque può ricalcolarlo, quindi non può dimostrare chi li ha prodotti. L’HMAC aggiunge all’hash una chiave segreta e così lo trasforma in un codice di autenticazione del messaggio (message authentication code): un valore che dimostra sia che il messaggio è integro sia che proviene da qualcuno che possiede la chiave. Il mittente calcola l’HMAC e lo invia insieme al messaggio; il destinatario, che condivide la chiave, lo ricalcola e verifica che i due coincidano. È definito nella RFC 2104 e nel FIPS 198-1, con i vettori di test nella RFC 4231.

## Simmetrico per natura

L’HMAC usa un unico segreto condiviso sia per produrre sia per verificare il codice. Questo lo rende veloce e semplice, ma significa anche che chiunque possa verificare un HMAC può anche falsificarne uno, perché entrambe le operazioni usano la stessa chiave. È lo strumento giusto quando a produrre e a controllare i codici è la stessa parte, o sono due parti che condividono già un segreto fidato. Quando parti indipendenti devono poter verificare senza poter falsificare, è più adatta una firma asimmetrica: è lo stesso compromesso che separa HS256 da RS256 nei JWT.

## Come è costruito

L’HMAC non è semplicemente l’hash della chiave unita al messaggio, che sarebbe vulnerabile agli attacchi di estensione della lunghezza (length extension). È una costruzione annidata: si calcola l’hash del messaggio insieme a una prima forma derivata della chiave, poi l’hash di quel risultato con una seconda forma derivata. È questa struttura a dare all’HMAC la sua dimostrazione di sicurezza, ed è per questo che conviene usare l’HMAC invece di inventare un proprio hash con chiave.

## Come si usa

Inserisci un messaggio e una chiave segreta, scegli l’hash e leggi l’HMAC in esadecimale o in Base64. Dai lo stesso messaggio e la stessa chiave a due sistemi e i codici coincideranno; cambia di un solo carattere il messaggio o la chiave e il codice cambia completamente.

## Condivisione dei risultati

Sotto il MAC, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il messaggio così come l’hai inserito e l’algoritmo, mai la chiave. Chi riceve il link inserisce la chiave che gli comunichi per un’altra via e ottiene lo stesso MAC; nemmeno il MAC è incluso, perché accanto al messaggio permetterebbe a chiunque di provare offline a indovinare una chiave debole. Un’eccezione: anche la chiave `Jefe` viene inclusa, perché è la chiave di prova pubblicata nella [RFC 4231](https://www.rfc-editor.org/rfc/rfc4231) (caso di test 2, consultata il 01/11/2026), quella che usa l’Esempio della pagina. Il suo riquadro a comparsa indica prima cosa contiene il link, poi un’avvertenza specifica (il messaggio è incluso così come l’hai inserito, quindi rileggilo prima di inviare il link), poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Una chiave HMAC è una chiave: la [RFC 2104](https://www.rfc-editor.org/rfc/rfc2104) (sezione 3, consultata il 01/11/2026) chiede chiavi scelte a caso («chosen at random») e rinnovate periodicamente («periodically refreshed»), una pratica che limita i danni di una chiave esposta («limits the damage of an exposed key»), e chi la possiede può calcolare un MAC valido per qualsiasi messaggio.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi i valori non vengono inviati al server quando si apre il link; restano nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerli.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Il messaggio e l’algoritmo compilano la pagina. La casella della chiave riceve la chiave di prova pubblicata quando arriva con il link, e altrimenti mantiene ciò che ha inserito chi legge; su una pagina nuova è vuota, e una nota avvisa che la chiave non viaggia mai. Il MAC viene calcolato con Web Crypto nel browser non appena entrambi i campi sono compilati. Un algoritmo che la pagina non offre, o una chiave diversa da quella pubblicata, fa ignorare l’intero link. In ogni caso i valori lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
