# Scelta del flusso OAuth

La prima domanda di ogni integrazione OAuth o OpenID Connect, con PingFederate, PingAM, PingOne o qualsiasi altra piattaforma, è *quale flusso*. Lo strumento codifica la risposta moderna come una decisione deterministica e cita la RFC alla base di ogni sua riga.

## Tre domande

Che tipo di app è (web lato server, SPA, nativa, da servizio a servizio o un dispositivo con input limitato)? Deve sapere **chi** è l’utente (è il compito di OpenID Connect, che si appoggia sullo stesso flusso)? Deve accedere anche quando l’utente non c’è (refresh token)?

## Le risposte che dà

Le app server, SPA e native ricevono tutte l’**authorization code**: con un client confidenziale e un segreto dove esiste un backend, con un client pubblico **con PKCE** (RFC 7636) dove non c’è, e per le app native viene esplicitata la regola del browser di sistema della RFC 8252. Da servizio a servizio si usano le **client credentials** (RFC 6749 §4.4), con la nota che lì i refresh token NON DOVREBBERO essere emessi. TV e chioschi ricevono il **device grant** (RFC 8628), con il suo passaggio dello user_code inserito su un secondo dispositivo.

## L’altra metà, che conta altrettanto

Ogni risultato include l’elenco dei flussi *da evitare*: **implicit** e **ROPC (password)** vengono ritirati per nome, secondo la OAuth 2.0 Security Best Current Practice (RFC 9700), con i motivi detti chiaramente: token nei frammenti, credenziali nelle app. I client pubblici che chiedono l’accesso offline ricevono il requisito della **rotazione** dei refresh token; chiedere l’identità dell’utente finale a un flusso da macchina a macchina solleva un avviso di contraddizione invece di dare una risposta sbagliata.

Tutto viene deciso in locale; le tre risposte non contengono segreti e nulla viene trasmesso.

## Condivisione dei risultati

Sotto il nome e il grant del flusso consigliato, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` le tue tre risposte: il tipo di applicazione con il suo nome stabile (`app=spa`) e ogni domanda a cui hai risposto sì (`identity=1`, `offline=1`). Non viene incluso nulla di ciò che digiti, perché non c’è nulla da digitare. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi le risposte non vengono inviate al server quando si apre il link; restano nella barra degli indirizzi e nella cronologia di chi lo apre.

- **Apertura di un link.** Le tre risposte sostituiscono quelle del modulo e la pagina consiglia lo stesso flusso, nel browser. Un tipo di applicazione che la pagina non offre, o una risposta diversa da 1 o 0, fa ignorare l’intero link. In ogni caso i valori lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
