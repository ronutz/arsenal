## Cosa fa

Incolla una risposta HTTP grezza e lo strumento dà un voto alla sua postura di sicurezza: le intestazioni (header) di sicurezza che imposta (e quelle che mancano), i flag dei suoi cookie e la sua policy cross-origin. Ogni rilievo viene verificato rispetto allo standard pertinente e alle raccomandazioni OWASP Secure Headers, e il risultato è un’analisi dettagliata con voto su cui puoi intervenire. Viene eseguito interamente nel tuo browser.

## Le intestazioni che verifica

Nei browser moderni la sicurezza si attiva in gran parte solo su richiesta, tramite le intestazioni di risposta, e lo strumento esamina quelle che contano:

- **Strict-Transport-Security** (HSTS, RFC 6797) indica al browser di usare solo HTTPS; lo strumento ne legge `max-age` e `includeSubDomains`.
- **Content-Security-Policy** (CSP Level 3) limita le origini da cui possono provenire script, stili e frame, ed è la difesa più forte contro il cross-site scripting; lo strumento segnala le parole chiave che la indeboliscono, come `unsafe-inline`.
- **X-Content-Type-Options: nosniff** impedisce al browser di indovinare il tipo di contenuto, e **X-Frame-Options** (o `frame-ancestors` della CSP) protegge dal clickjacking.
- **Referrer-Policy** e **Permissions-Policy** controllano cosa la pagina lascia trapelare nell’intestazione Referer e quali funzionalità del browser può usare.
- Le **policy cross-origin** (COOP, COEP, CORP), che regolano l’isolamento tra origini.

## I cookie e i loro flag

La sicurezza di un cookie sta nei suoi attributi, e lo strumento li verifica rispetto alla specifica attuale dei cookie (RFC 6265bis): **Secure** (inviato solo su HTTPS), **HttpOnly** (nascosto a JavaScript, il che limita il furto tramite cross-site scripting) e **SameSite** (che limita l’invio cross-site e attenua il CSRF). Riconosce anche i prefissi di nome `__Host-` e `__Secure-`, che impongono alcune di queste proprietà tramite il nome stesso.

## Come leggere il voto

Il voto serve a stabilire le priorità: non ti dice solo cosa c’è, ma cosa manca o è debole e perché ogni intestazione conta, così puoi correggere per prime le lacune con l’impatto maggiore. I controlli seguono l’insieme consigliato da OWASP e le specifiche di riferimento, non l’opinione di un singolo strumento.

## Come si usa

Incolla una risposta HTTP, intestazioni comprese, e leggi l’analisi con voto di intestazioni, cookie e policy cross-origin. L’analisi è deterministica e locale, quindi puoi eseguirla in sicurezza su una risposta catturata da qualsiasi sito.

## Condivisione dei risultati

Sotto il voto, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` una copia della risposta; contiene la risposta così come l’hai incollata solo se attivi l’interruttore descritto più sotto. Una risposta incollata contiene cookie, i cui valori sono comunemente identificatori di sessione ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sezione 8.4, consultata il 01/11/2026), e intestazioni che la pagina non legge mai, come una `Location` con un codice di autorizzazione nella query ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), sezione 4.1.2, consultata il 01/11/2026). La pagina valuta le intestazioni di sicurezza che conosce e il nome e gli attributi di ogni cookie, mai il valore di un cookie. Quindi la copia conserva la riga di stato e ogni riga di intestazione con il suo nome, i valori delle intestazioni che la pagina valuta così come li ha analizzati, e ogni `Set-Cookie` con il suo nome e i suoi attributi; il valore di ogni cookie, e il valore di ogni altra intestazione, diventa `[redacted]`. Prima che venga proposto il link, la copia viene valutata di nuovo e deve dare lo stesso report, poi passa per il controllo del sito che cerca credenziali ancora presenti in un valore valutato. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia. Il riquadro a comparsa indica anche quanti valori sono stati sostituiti. Quando ne è stato sostituito qualcuno, un interruttore sotto la prima riga, **Includi nel link i valori oscurati**, ti permette di inviarli comunque: è disattivato ogni volta che il riquadro a comparsa si apre; se lo attivi, il link contiene la risposta così come l’hai incollata, con tutti i valori, e il riquadro a comparsa lo dice e avverte che i valori dei cookie sono spesso sessioni attive e che altre intestazioni possono contenere token, quindi il link è per qualcuno a cui mostreresti la risposta. L’interruttore non viene offerto quando una credenziale in un valore valutato ha già bloccato il link.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La copia compila la casella come farebbe un incolla e la pagina la valuta. I valori poi lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
