## Cosa fa

Questo strumento mette in corrispondenza, in entrambe le direzioni, i livelli di sicurezza TLS di F5 Distributed Cloud (XC) e le suite di cifratura (cipher suite) che negoziano. Scegli un livello (**High**, **Medium** o **Low**) e lo strumento mostra le versioni TLS minima e massima esatte e l’elenco completo delle suite, ciascuna annotata con scambio di chiavi, forward secrecy e robustezza. Oppure incolla una suite di cifratura (nella forma IANA `TLS_*` o in quella OpenSSL con i trattini) o un’intera riga di uno scanner, e lo strumento ti dice quali livelli includono quella suite. Tutto viene eseguito nel tuo browser.

## La tabella su cui si basa

Gli elenchi delle suite sono trascritti testualmente dalla TLS Reference di F5. Due aspetti di quella tabella colgono spesso di sorpresa. Primo, **Default è il livello High**: va da un minimo di TLS 1.2 a un massimo di TLS 1.3, ed è quello che usa un HTTPS load balancer con un certificato automatico. Secondo, i livelli sono **cumulativi**: Medium contiene tutte le suite di High più quattro suite ECDHE-CBC, e Low contiene tutte le suite di Medium più quattro suite RSA statiche. Ogni livello arriva al massimo a TLS 1.3.

## Perché lo scanner segnala un load balancer

Sul campo ricorrono di continuo due domande, e lo strumento risponde a entrambe. Se uno scanner riporta **TLS 1.0 o 1.1 abilitati**, il load balancer è su **Medium o Low**: quei livelli hanno come minimo TLS 1.0. Il livello Default/High ha come minimo TLS 1.2, quindi non presenta i protocolli vecchi (K000148226). Se uno scanner riporta **cifrari deboli**, quasi sempre si tratta delle **suite RSA statiche che aggiunge il livello Low**: non hanno forward secrecy, ed è proprio ciò che uno scanner penalizza nel voto (K000148079).

## Come leggere le annotazioni

Ogni suite è etichettata con il suo scambio di chiavi (TLS 1.3, ECDHE-ECDSA, ECDHE-RSA o RSA), con l’indicazione della forward secrecy (PFS) e con un grado di robustezza. Le suite ECDHE sono PFS; le suite RSA statiche no. TLS 1.3 e le suite AEAD (GCM / ChaCha20) sono robuste; le suite CBC-SHA sono di media robustezza; le suite RSA statiche sono deboli.

## Condivisione dei risultati

Ogni modalità ha il proprio pulsante **Condividi i risultati**, sotto la propria risposta, che crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il valore di quella modalità: sotto le suite del livello, il livello che hai scelto; sotto i livelli della suite, la riga che hai inserito, non appena vi viene riconosciuta una suite. Un livello o una suite di cifratura non nomina alcun sistema né alcuna persona. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** Il livello viene selezionato e la riga della suite viene compilata, come se li avessi scelti e digitati; seguono entrambe le letture. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
