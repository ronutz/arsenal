## Cosa fa

È un codec bidirezionale per cinque codifiche di testo. Inserisci un testo e restituisce in un colpo solo le forme Base64, Base64 URL-safe, Base32, esadecimale e con codifica percentuale; inserisci una stringa codificata e la decodifica di nuovo in testo. La decodifica è tollerante: accetta padding mancante e spazi vaganti, e quando un flusso di byte decodificato non è testo UTF-8 valido il risultato viene segnalato come binario invece di essere mostrato come caratteri illeggibili. Tutto viene eseguito nel tuo browser; nulla viene inviato.

## Le cinque codifiche

Tutte e cinque convertono tra il testo (come byte) e una rappresentazione sicura in ASCII, e ognuna è definita da uno standard:

- **Base64** (RFC 4648, sezione 4) usa l’alfabeto `A-Z a-z 0-9 + /` e completa con `=`. Aumenta i dati di circa un terzo ed è la codifica alla base delle credenziali HTTP Basic, `base64(user:password)`, definite nella RFC 7617.
- **Base64 URL-safe** (RFC 4648, sezione 5) sostituisce `+` e `/` con `-` e `_` e di solito omette il padding `=`, quindi la stringa può stare senza problemi in un URL o in un nome di file. È la codifica usata da ogni segmento di un JWT.
- **Base32** (RFC 4648, sezione 6) usa `A-Z 2-7` e completa con `=`. Non distingue tra maiuscole e minuscole ed evita i caratteri facili da confondere, ed è per questo che compare per esempio nei segreti TOTP.
- **Esadecimale (Base16)** (RFC 4648, sezione 8) usa `0-9 A-F`, due caratteri per byte.
- **Codifica percentuale (percent-encoding)** (RFC 3986, sezione 2) lascia invariato l’insieme dei caratteri non riservati (`A-Z a-z 0-9 - . _ ~`) e codifica ogni altro byte come `%XX`. È la codifica degli URL.

## Padding, spazi e risultati binari

Base64 e Base32 vengono di norma completati con `=` fino a un numero intero di blocchi, ma nella pratica le stringhe arrivano spesso senza padding o con interruzioni di riga inserite, quindi il decodificatore accetta entrambe le forme. Quando decodifichi un valore i cui byte non formano testo UTF-8 valido (un blob compresso, un’immagine, una chiave grezza), lo strumento ti dice che il risultato è binario invece di mostrarlo come testo illeggibile, così sai che la decodifica è riuscita anche se il payload non è leggibile da una persona.

## Esempi svolti

- Il testo `hello` diventa in Base64 `aGVsbG8=`, in Base64 URL-safe `aGVsbG8`, in Base32 `NBSWY3DP`, in esadecimale `68656c6c6f` e con codifica percentuale `hello` (tutti i suoi caratteri sono non riservati).
- La decodifica del valore Base64 `dXNlcjpwYXNz`, una tipica credenziale HTTP Basic, restituisce `user:pass`.

## Come si usa

Inserisci un testo per vedere le cinque codifiche una accanto all’altra, oppure incolla un valore codificato per decodificarlo. Poiché il codec è una funzione pura del suo input, lo stesso testo produce sempre lo stesso output.

## Condivisione dei risultati

Sotto l’output, **Condividi i risultati** crea un link a questa pagina, solo quando lo premi, che contiene dopo il `#` il testo della casella così come l’hai inserito, con la direzione, il codec e il numero di livelli quando sono diversi dai valori predefiniti (Codifica, Base64, un livello): `/tools/base64#text=dXNlcjpwYXNz&direction=decode`. Il suo riquadro a comparsa indica prima cosa contiene il link, poi offre Copia link e, se il browser ne ha uno, il menu di condivisione; l’indirizzo della pagina non cambia.

Il testo codificato nasconde spesso una credenziale: HTTP Basic invia `user:password` in Base64 ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), sezione 2, consultata il 27/10/2026). Per questo il riquadro a comparsa aggiunge un avvertimento specifico dello strumento prima che tu copi qualcosa. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sezione 3.5, consultata il 27/10/2026) stabilisce che il frammento viene separato dal resto dell’URI prima della dereferenziazione («separated from the rest of the URI prior to a dereference»), quindi il testo non viene inviato al server quando si apre il link; resta nella barra degli indirizzi e nella cronologia di chi lo apre, e chiunque abbia il link può leggerlo.

- **Lunghezza massima.** Al massimo 16.384 caratteri in tutto, il limite che il sito applica a ogni valore dopo il `#`; una condivisione più lunga non ottiene il link e il riquadro a comparsa ne indica la lunghezza.
- **Apertura di un link.** La direzione, il codec e i livelli vengono impostati e il testo compila la casella come farebbe un testo incollato; la pagina calcola ogni codifica come al solito. Una direzione o un codec che la pagina non offre, o un numero di livelli al di fuori dell’intervallo da 1 a 3, fa ignorare l’intero link. In ogni caso i valori lasciano subito l’indirizzo della pagina, senza alcuna richiesta, quindi un ricaricamento o il pulsante Condividi della pagina stessa non contengono nulla.
- **Link da altre pagine.** Un valore passato come `#input=` compila ancora la casella esattamente come prima. Condividi i risultati usa nomi propri (`text`, `direction`, `codec`, `layers`), quindi le due forme non si mescolano mai.
