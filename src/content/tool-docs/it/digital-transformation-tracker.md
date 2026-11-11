# Monitoraggio della trasformazione digitale

Trenta tappe in sette ambiti della vita di tutti i giorni, dai primi pacchetti di ARPANET a previsioni che non si sono ancora avverate. Lo scopo dello strumento non è la linea temporale. È il **livello di certezza** associato a ogni riga.

## Perché esistono i livelli

Un monitoraggio con una sezione «che cosa viene dopo» è uno spazio per le previsioni, e la regola del sito è che gli strumenti calcolano invece di indovinare. La soluzione è che a una previsione non è mai permesso di sembrare un fatto:

- **Realizzato**: è successo, con una data ed è verificabile.
- **In vigore**: un obbligo di legge che vincola oggi.
- **In calendario**: una data futura fissata dalla legge o da un calendario pubblicato. Alta fiducia nella data, nessuna affermazione sulle conseguenze.
- **In calendario, ma in movimento**: una data che esiste davvero nella legge *e* che è in corso di modifica. Lo strumento mostra la data originale, la data proposta e il fatto che la modifica non è ancora legge.
- **Previsione**: la proiezione di qualcuno, sempre con il nome di chi la fa, e affiancata da un segnale contrario quando esiste.

Quel quarto livello è quello che nessun altro mostra. Gli obblighi per i sistemi ad alto rischio dell’AI Act dell’UE sono l’esempio concreto: previsti per il 2 agosto 2026, con un accordo provvisorio del 7 maggio 2026 per spostarli al 2 dicembre 2027, e non ancora legge, quindi la data originale continua a valere per la pianificazione.

## Che cosa registra ogni riga

Ogni tappa risponde a due domande: che cosa è cambiato per una persona comune, e che cosa è diventato possibile che prima non lo era. Filtrare per ambito mostra quanto diversamente la trasformazione sia arrivata nel denaro, nel lavoro, nella salute e nello Stato.

## Condivisione dei risultati

Sotto il conteggio, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` i filtri attivi, per ID: `domains` e `certainties`, nell’ordine della pagina (una riga senza nulla di attivo non contiene nulla, cioè tutti, come nella pagina). Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Senza alcun filtro attivo, la vista è la pagina così come si apre, a cui rimanda già il pulsante Condividi della pagina stessa, quindi il pulsante resta in attesa. Le tappe non viaggiano mai: la pagina che apre il link legge lo stesso insieme di dati, quindi il link resta corto e una riga corretta raggiunge anche i link vecchi.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi la vista non viene inviata al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerla.

- **Apertura di un link.** I filtri vengono impostati e la linea temporale si ridisegna, come quando li tocchi. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.

## Privacy

I filtri vengono valutati in locale. Nulla viene trasmesso, e l’insieme di dati arriva insieme alla pagina.
