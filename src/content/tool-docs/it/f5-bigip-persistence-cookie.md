## Cosa fa

Decodifica il valore di un cookie di persistenza `BIGipServer` di F5 BIG-IP per ricavare l’indirizzo IP e la porta del membro del pool di backend, oppure fai il percorso inverso e codifica il valore di un cookie a partire da un indirizzo e una porta. Gestisce le quattro codifiche non cifrate usate da BIG-IP e viene eseguito interamente nel tuo browser.

## Cos’è il cookie, e perché conta decodificarlo

Quando la persistenza tramite cookie di BIG-IP funziona nella modalità predefinita insert, aggiunge un cookie chiamato `BIGipServer<pool>` il cui valore codifica il membro del pool a cui è stato inviato un client, così il client torna allo stesso membro. Il punto è che la codifica non è una cifratura: nella forma predefinita, il cookie codifica in chiaro l’indirizzo IP interno e la porta del membro del pool. Chiunque possa vedere il cookie, cioè il client e qualsiasi cosa si trovi sul percorso, può decodificarlo e scoprire una parte della tua topologia interna. Lo strumento esiste per dimostrarlo, e segnala quando un indirizzo decodificato rientra in un intervallo privato RFC 1918, perché è proprio il dettaglio interno che non intendevi pubblicare.

## Le codifiche e il loro ordine dei byte

La sottigliezza, e il motivo per cui serve un decodificatore apposito, è l’ordine dei byte. Nella codifica IPv4 predefinita l’indirizzo è un unico numero decimale i cui byte sono letti in little-endian, cioè invertiti, e la porta è un campo decimale con i due byte scambiati. Per esempio, l’indirizzo `10.1.1.100` viene codificato nel decimale `1677787402` e la porta `80` nel valore `20480`, con i byte scambiati. In tutto BIG-IP definisce quattro codifiche di questo tipo, che coprono IPv4, IPv6 e le varianti con route domain, ciascuna con una propria regola, che lo strumento implementa a partire dalla documentazione di F5 stessa (K6917), verificata con un noto decodificatore di riferimento.

## La correzione, contro cui lo strumento non può nulla

La mitigazione è semplice e vale la pena dirla: configura la cifratura dei cookie nel profilo di persistenza (F5 K7784). Un cookie di persistenza cifrato non contiene alcun indirizzo leggibile, e questo strumento non può decodificarlo, per scelta progettuale. Se qui riesci a decodificare il tuo cookie di produzione, può farlo chiunque altro: è il segnale per attivare la cifratura.

## Come si usa

Incolla il valore di un cookie `BIGipServer` per decodificare l’indirizzo e la porta del membro, oppure inserisci un indirizzo e una porta per ottenere il valore di un cookie. Il calcolo è deterministico e locale; nulla viene inviato da nessuna parte.

## Condivisione dei risultati

Ogni modalità ha il suo pulsante **Condividi i risultati** sotto la propria risposta. Il pulsante crea un link a questa pagina, solo quando lo premi, che contiene i valori dopo il `#`. In Decodifica, il link contiene una copia del cookie che la pagina ha decodificato, nome e valore, mai la riga così come l’hai incollata: la pagina legge solo ciò che precede il primo `;`, e una riga incollata può contenere altro, gli attributi di una riga `Set-Cookie` o il valore `Cookie` di un browser in cui un cookie di sessione segue il cookie di persistenza ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), esempio della sezione 4.2.1 `Cookie: SID=31d4d96e407aad42; lang=en-US`; sezione 8.4: un cookie contiene comunemente un identificatore di sessione; consultata il 01/11/2026). Così la pagina che riceve il link decodifica lo stesso membro del pool, e il resto rimane a te. In Codifica, il link contiene l’indirizzo, la porta e il route domain così come la pagina li ha letti. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser lo prevede, il suo menu di condivisione; l’indirizzo della pagina non cambia. Poiché l’indirizzo decodificato o inserito è di solito quello di un membro del pool interno, il riquadro a comparsa aggiunge una riga che ti chiede di controllarlo prima di inviare il link.

Secondo la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) il frammento è separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando il link viene aperto; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** La modalità si apre e i suoi campi vengono compilati come se li inserissi tu, e la pagina decodifica o codifica come al solito. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina non contengono nulla.
