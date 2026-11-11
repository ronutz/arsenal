## Cosa fa

Inserisci un timestamp Unix o una data ISO-8601 e rileggi lo stesso istante in tutte le forme comuni. Quando inserisci un numero, lo strumento ne rileva automaticamente l’unità (secondi, millisecondi, microsecondi o nanosecondi) dalla sua grandezza, così puoi incollare un valore da quasi qualsiasi sistema senza dire in quale unità è. Poi presenta l’istante come scomposizione del calendario UTC, come stringa ISO-8601, come timestamp RFC 3339, nel formato di data HTTP e come timestamp in tutte e quattro le unità. Tutto viene calcolato nel tuo browser.

## Che cosa significa tempo Unix

Il tempo Unix, definito da POSIX, è il numero di secondi trascorsi dall’epoch (1970-01-01 00:00:00 UTC), senza contare i secondi intercalari. Sistemi diversi lo memorizzano con risoluzioni diverse: lo Unix classico e la maggior parte delle API usano i secondi; JavaScript e molti database usano i millisecondi; alcune interfacce di tracing e del kernel usano i microsecondi o i nanosecondi. Poiché queste grandezze distano circa un fattore mille l’una dall’altra, l’unità si può dedurre da quante cifre ha il numero, ed è ciò che fa il rilevamento automatico.

## I formati che produce

- **Scomposizione del calendario UTC**: anno, mese, giorno e ora del giorno in UTC.
- **ISO 8601 e RFC 3339**: il formato di timestamp di Internet, ad esempio `2026-07-01T20:00:00Z`.
- **Data HTTP**: la forma IMF-fixdate usata nelle intestazioni HTTP (RFC 9110, sezione 5.6.7), ad esempio `Wed, 01 Jul 2026 20:00:00 GMT`.
- **Tutte e quattro le unità**: lo stesso istante espresso in secondi, millisecondi, microsecondi e nanosecondi.

## Intervallo e determinismo

Le date vengono gestite entro l’intervallo che un valore di data JavaScript può rappresentare, circa 273.000 anni prima e dopo l’epoch (un limite di 8,64 × 10^15 millisecondi da entrambe le parti). La conversione è una funzione pura del valore di input e non legge mai l’orologio corrente, quindi un dato timestamp viene sempre presentato allo stesso modo. Un’indicazione di comodo «rispetto ad adesso» ha per forza bisogno dell’orologio reale, quindi sta nell’interfaccia dello strumento e non in questo nucleo deterministico.

## Come si usa

Inserisci un timestamp Unix come `1751400000` (un valore di dieci cifre, quindi letto in secondi) o `1751400000000` (tredici cifre, letto in millisecondi), oppure una data ISO-8601 come `2026-07-01T20:00:00Z`, e leggi subito tutte le forme equivalenti.

## Condivisione dei risultati

Sotto il titolo, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il timestamp o la data così come l’hai inserito, una volta che la pagina l’ha letto. La riga che indica quanto tempo fa o quanto più avanti si trova l’istante dipende dall’orologio di chi apre il link, come accadrebbe per un testo incollato; le conversioni invece sono le stesse ovunque. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 01/11/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi ciò che segue il `#` non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Apertura di un link.** Il valore riempie la casella come farebbe un incolla e la pagina lo converte. I valori lasciano poi subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
