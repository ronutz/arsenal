## Cosa fa

Incolla l’output di un comando `nslookup` e lo strumento lo decodifica in una scomposizione strutturata e spiegata: quale resolver ha risposto, se la risposta era autoritativa, ogni record con i suoi campi esplicitati e qualsiasi errore riportato. Analizza solo il testo; nulla viene risolto e nulla viene inviato da nessuna parte.

## Come leggere il formato di nslookup

`nslookup` stampa le risposte DNS in un formato libero, quasi discorsivo, molto diverso da quello di `dig`, e quel formato ha un significato che vale la pena rendere esplicito. Ogni risposta inizia con un’intestazione **Server** e **Address** che indica il resolver interrogato. Una riga **Non-authoritative answer:** significa che il bit AA era a zero: la risposta è arrivata da un resolver, non da un server autoritativo per il nome. La RFC 1035 (sezione 4.1.1) e la RFC 2181 (sezione 6) definiscono l’autorità in base al nome, non al caching, quindi la riga non dice se il resolver ha risposto dalla sua cache o ha recuperato la risposta per te; i due casi appaiono identici. La sua assenza, per una query diretta, implica una risposta autoritativa. Quando una ricerca fallisce, nslookup stampa una riga come `** server can't find NAME: NXDOMAIN`, e lo strumento mette in evidenza l’errore e il significato dello stato.

## I record e i loro campi

Per la maggior parte dei tipi di record nslookup stampa una semplice riga `name = value`, ma alcuni concentrano più campi in una riga o in un blocco, e sono proprio quelli che vale la pena decodificare:

- I record **MX** si presentano come `mail exchanger = 10 mail.example.com`, dove il numero è la preferenza (il valore più basso è preferito) e il nome è l’host di posta. Lo strumento separa le due parti.
- I record **SRV** (RFC 2782) contengono priorità, peso, porta e destinazione in una sola riga; lo strumento li separa, così vedi a quale host e a quale porta del servizio puntano.
- I record **SOA** occupano più righe: il name server primario della zona, la casella di posta del responsabile, il numero di serie e i timer (refresh, retry, expire, minimum). Lo strumento dispone questi campi in ordine.

## Come si usa

Incolla una risposta di `nslookup` e leggi il resolver, lo stato di autorità, ogni record con i suoi campi e qualsiasi errore. L’analisi è deterministica e interamente locale; lo strumento non esegue mai una ricerca per conto suo, ed è anche per questo un modo sicuro di leggere un output acquisito altrove.

## Esempi

Il pulsante Carica esempio e i test dello strumento usano output reale di `nslookup` della build BIND 9.20.29, acquisito il 19 ottobre 2026 attraverso un relay locale che inviava ogni query a un resolver pubblico tramite DNS over HTTPS, per cui la riga Server mostra l’indirizzo del relay, `127.0.0.1#5311`. L’esempio di errore cerca `nonexistent.invalid`: la RFC 6761, sezione 6.4, consente di dare per scontato che le query per i nomi sotto `.invalid` restituiscano sempre NXDOMAIN, mentre `example.com` ora risponde NOERROR senza dati per i nomi che non esistono (la compact denial della RFC 9824).

## Condivisione dei risultati

In cima alla lettura, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene l’output di nslookup così come l’hai incollato (`#input=...`), e nient’altro. Prima che tu copi qualsiasi cosa, il riquadro a comparsa aggiunge un’avvertenza: l’output di nslookup può indicare host interni, indirizzi e il server interrogato, quindi rileggilo prima di inviare il link. Tutto ciò che il link contiene sta dopo il `#`, la parte che la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) separa dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»): il browser non la invia al server quando si apre il link, ma resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Lunghezza massima.** Un link contiene al massimo 16.384 caratteri, il limite che il sito applica a ogni valore dopo il `#`; un testo più lungo non riceve alcun link, e il riquadro a comparsa indica quanto sarebbe lungo.
- **Apertura di un link.** Il testo riempie la casella come farebbe un incolla e la pagina lo spiega di nuovo; nulla viene risolto o inviato. Un testo che non è output di nslookup riceve la nota della pagina. Accettati o no, i valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento, un segnalibro o il pulsante Condividi della pagina stessa non contengono nulla che tu non abbia scelto di condividere.

## API

Lo stesso motore risponde all’operazione `/api/v1/nslookup-output-explainer` dell’API HTTP del sito, descritta campo per campo nel contratto OpenAPI della [pagina dell’API](/api), con esempi presi dai vettori di test di riferimento (golden vectors). Il contratto indica anche se questo sito espone l’API.

- **Richiesta.** L’output di nslookup come testo, a capo e tabulazioni compresi.
- **Risposta.** `server` (`server` e `address`), `authority` (`authoritative`, `non-authoritative` o `unknown`), `records` (`name`, `type`, `value`, e `fields` per MX, SRV e SOA), `errors` (`name` e `code`), `referralNote`, `warnings` (codici stabili) e `recognized`.
- **Errori.** Un testo che non è output di nslookup non è un errore HTTP: `recognized` è `false`.

La risposta non è cambiata il 19 ottobre 2026; gli esempi sono stati sostituiti da acquisizioni fatte quel giorno.

## Fonti

- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (consultata il 19/10/2026): il bit AA, sezione 4.1.1
- [RFC 2181: Clarifications to the DNS Specification](https://www.rfc-editor.org/rfc/rfc2181) (consultata il 19/10/2026): l’autorità sulla zona, sezione 6
- [RFC 2308: Negative Caching of DNS Queries](https://www.rfc-editor.org/rfc/rfc2308) (consultata il 19/10/2026): NXDOMAIN, NODATA e il minimum del SOA
- [RFC 2782: A DNS RR for specifying the location of services (DNS SRV)](https://www.rfc-editor.org/rfc/rfc2782) (consultata il 19/10/2026): i campi SRV
- [RFC 9499: DNS Terminology](https://www.rfc-editor.org/rfc/rfc9499) (marzo 2024, rende obsoleta la RFC 8499; consultata il 19/10/2026): server autoritativo e resolver
- [RFC 6761: Special-Use Domain Names](https://www.rfc-editor.org/rfc/rfc6761) (consultata il 19/10/2026): sezione 6.4, i nomi sotto `.invalid`
- [RFC 9824: Compact Denial of Existence in DNSSEC](https://www.rfc-editor.org/rfc/rfc9824) (consultata il 19/10/2026): NOERROR senza dati per un nome che non esiste
- [RFC 7505: A "Null MX" No Service Resource Record for Domains That Accept No Mail](https://www.rfc-editor.org/rfc/rfc7505) (consultata il 19/10/2026): l’esempio MX, preferenza 0 ed exchange `.`
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultata il 27/10/2026): sezione 3.5, il frammento, che contiene i valori di un link creato con Condividi i risultati
